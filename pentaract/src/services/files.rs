use axum::body::Bytes;
use sqlx::PgPool;
use tokio::sync::oneshot;
use uuid::Uuid;

use crate::{
    common::{
        access::check_access,
        channels::{
            ClientData, ClientMessage, ClientSender, DownloadFileData, StorageManagerData,
            UploadFileData,
        },
        email::EmailService,
        jwt_manager::AuthUser,
    },
    errors::{PentaractError, PentaractResult},
    models::{
        access::AccessType,
        files::{FSElement, File, InFile, SearchFSElement},
    },
    repositories::{
        access::AccessRepository, files::FilesRepository, storage_workers::StorageWorkersRepository,
        activity_logs::ActivityLogsRepository,
    },
    schemas::files::{InFileSchema, InFolderSchema},
};

pub struct FilesService<'d> {
    repo: FilesRepository<'d>,
    storage_workers_repo: StorageWorkersRepository<'d>,
    access_repo: AccessRepository<'d>,
    activity_logs_repo: ActivityLogsRepository<'d>,
    email_service: Option<EmailService>,
    tx: ClientSender,
}

impl<'d> FilesService<'d> {
    pub fn new(db: &'d PgPool, tx: ClientSender, email_service: Option<EmailService>) -> Self {
        let repo = FilesRepository::new(db);
        let storage_workers_repo = StorageWorkersRepository::new(db);
        let access_repo = AccessRepository::new(db);
        let activity_logs_repo = ActivityLogsRepository::new(db);
        Self {
            repo,
            access_repo,
            storage_workers_repo,
            activity_logs_repo,
            email_service,
            tx,
        }
    }

    pub async fn create_folder(
        &self,
        in_schema: InFolderSchema,
        user: &AuthUser,
    ) -> PentaractResult<()> {
        // 0. checking access
        check_access(
            &self.access_repo,
            user.id,
            in_schema.storage_id,
            &AccessType::W,
        )
        .await?;

        // 1. validation
        if !Self::validate_filepath(&in_schema.parent_path) {
            return Err(PentaractError::InvalidPath);
        }
        if in_schema.folder_name.contains(r"/") {
            return Err(PentaractError::InvalidFolderName);
        }

        // 2. constructing final values
        let path = if !in_schema.parent_path.is_empty() {
            format!("{}/{}/", in_schema.parent_path, in_schema.folder_name)
        } else {
            format!("{}/", in_schema.folder_name)
        };
        let in_file = InFile::new(path.clone(), 0, in_schema.storage_id);

        // 3. saving to db
        self.repo.create_folder(in_file).await?;
        let _ = self.activity_logs_repo.log(user.id, "CREATE_FOLDER", &path).await;
        Ok(())
    }

    pub async fn upload_to(&self, in_schema: InFileSchema, user: &AuthUser) -> PentaractResult<()> {
        // 0. checking access
        check_access(
            &self.access_repo,
            user.id,
            in_schema.storage_id,
            &AccessType::W,
        )
        .await?;

        // 1. check whether storage got workers
        Self::check_storage_workers(&self, in_schema.storage_id).await?;

        // 2. path validation
        if !Self::validate_filepath(&in_schema.path) {
            return Err(PentaractError::InvalidPath);
        }

        let in_file = InFile::new(in_schema.path, in_schema.size, in_schema.storage_id);

        // 3. saving file to db
        let file = self.repo.create_file_anyway(in_file).await?;

        self._upload(file, in_schema.file, user).await
    }

    pub async fn upload_anyway(
        &self,
        in_file: InFile,
        file_data: Bytes,
        user: &AuthUser,
    ) -> PentaractResult<()> {
        // 0. checking access
        check_access(
            &self.access_repo,
            user.id,
            in_file.storage_id,
            &AccessType::W,
        )
        .await?;

        // 1. check whether storage got workers
        Self::check_storage_workers(&self, in_file.storage_id).await?;

        // 2. saving file in db
        let file = self.repo.create_file_anyway(in_file).await?;

        self._upload(file, file_data, user).await
    }

    async fn _upload(&self, file: File, file_data: Bytes, user: &AuthUser) -> PentaractResult<()> {
        // 2. sending file to storage manager
        let (resp_tx, resp_rx) = oneshot::channel();

        let message = {
            let upload_file_data = UploadFileData {
                file_id: file.id,
                user_id: user.id,
                file_data: file_data.as_ref().into(),
            };
            ClientMessage {
                data: ClientData::UploadFile(upload_file_data),
                tx: resp_tx,
            }
        };

        tracing::debug!("sending task to manager");
        let _ = self.tx.send(message).await;

        // 3. waiting for a storage manager result
        let message_back = match resp_rx.await.unwrap().data {
            StorageManagerData::UploadFile(r) => r,
            _ => unimplemented!(),
        };

        if let Err(e) = message_back {
            println!("\n[FATAL ERROR] TELEGRAM REJECTED UPLOAD: {:?}\n", e);
            tracing::error!("{e}");

            // fallback logic: deleting file
            let _ = self.repo.delete_with_folders(file.id).await;

            return Err(e);
        }

        tracing::debug!("!!!! THE CODE IS NEW !!!!");

        // 4. setting file as uploaded
        self.repo.set_as_uploaded(file.id).await?;

        // 5. sending notification (non-blocking)
        if let Some(email_service) = self.email_service.clone() {
            let to_email = user.email.clone();
            let file_path = file.path.clone();
            tokio::spawn(async move {
                let _ = email_service.send_activity_notification(&to_email, "UPLOADED", &file_path).await;
            });
        }

        Ok(())
    }

    async fn check_storage_workers(&self, storage_id: Uuid) -> PentaractResult<()> {
        if !self
            .storage_workers_repo
            .storage_has_any(storage_id)
            .await?
        {
            Err(PentaractError::StorageDoesNotHaveWorkers)
        } else {
            Ok(())
        }
    }

    pub async fn download(
        &self,
        path: &str,
        storage_id: Uuid,
        user: &AuthUser,
    ) -> PentaractResult<Vec<u8>> {
        // 0. checking access
        check_access(&self.access_repo, user.id, storage_id, &AccessType::R).await?;

        // 1. path validation
        if !Self::validate_path(path) {
            return Err(PentaractError::InvalidPath);
        }

        // 2. getting file by path
        let file = self.repo.get_file_by_path(path, storage_id).await?;

        // 3. sending task to storage manager
        let (resp_tx, resp_rx) = oneshot::channel();

        let message = {
            let download_file_data = DownloadFileData {
                file_id: file.id,
                storage_id,
                user_id: user.id,
            };
            ClientMessage {
                data: ClientData::DownloadFile(download_file_data),
                tx: resp_tx,
            }
        };

        tracing::debug!("sending task to manager");
        let _ = self.tx.send(message).await;

        // 4. waiting for a storage manager result
        match resp_rx.await.unwrap().data {
            StorageManagerData::DownloadFile(r) => r,
            _ => unimplemented!(),
        }
    }

    pub async fn list_dir(
        self,
        storage_id: Uuid,
        path: &str,
        user: &AuthUser,
    ) -> PentaractResult<Vec<FSElement>> {
        check_access(&self.access_repo, user.id, storage_id, &AccessType::R).await?;

        self.repo.list_dir(storage_id, path).await
    }

    pub async fn search(
        self,
        storage_id: Uuid,
        path: &str,
        search_path: &str,
        user: &AuthUser,
    ) -> PentaractResult<Vec<SearchFSElement>> {
        check_access(&self.access_repo, user.id, storage_id, &AccessType::R).await?;

        self.repo.search(search_path, path, storage_id).await
    }

    pub async fn rename(
        &self,
        old_path: &str,
        new_path: &str,
        storage_id: Uuid,
        user: &AuthUser,
    ) -> PentaractResult<()> {
        // 0. checking access
        check_access(&self.access_repo, user.id, storage_id, &AccessType::W).await?;

        // 1. path validation
        if !Self::validate_path(old_path) || !Self::validate_path(new_path) {
            return Err(PentaractError::InvalidPath);
        }

        // 2. renaming file
        self.repo.update_path(old_path, new_path, storage_id).await?;
        let _ = self.activity_logs_repo.log(user.id, "RENAME", &format!("{} -> {}", old_path, new_path)).await;

        // sending notification (non-blocking)
        if let Some(email_service) = self.email_service.clone() {
            let to_email = user.email.clone();
            let details = format!("{} to {}", old_path, new_path);
            tokio::spawn(async move {
                let _ = email_service.send_activity_notification(&to_email, "RENAMED", &details).await;
            });
        }
        Ok(())
    }

    pub async fn copy(
        &self,
        old_path: &str,
        new_path: &str,
        storage_id: Uuid,
        user: &AuthUser,
    ) -> PentaractResult<()> {
        // 0. checking access
        check_access(&self.access_repo, user.id, storage_id, &AccessType::W).await?;

        // 1. path validation
        if !Self::validate_path(old_path) || !Self::validate_path(new_path) {
            return Err(PentaractError::InvalidPath);
        }

        // 2. copying file
        self.repo.copy(old_path, new_path, storage_id).await?;
        let _ = self.activity_logs_repo.log(user.id, "COPY", &format!("{} -> {}", old_path, new_path)).await;

        // sending notification (non-blocking)
        if let Some(email_service) = self.email_service.clone() {
            let to_email = user.email.clone();
            let details = format!("{} to {}", old_path, new_path);
            tokio::spawn(async move {
                let _ = email_service.send_activity_notification(&to_email, "COPIED", &details).await;
            });
        }
        Ok(())
    }

    pub async fn delete(
        &self,
        path: &str,
        storage_id: Uuid,
        user: &AuthUser,
    ) -> PentaractResult<()> {
        // 0. checking access
        check_access(&self.access_repo, user.id, storage_id, &AccessType::W).await?;

        // 1. path validation
        if !Self::validate_path(path) {
            return Err(PentaractError::InvalidPath);
        }

        // 2. deleting file
        self.repo.delete(path, storage_id).await?;
        let _ = self.activity_logs_repo.log(user.id, "DELETE", path).await;

        // 3. sending notification (non-blocking)
        if let Some(email_service) = self.email_service.clone() {
            let to_email = user.email.clone();
            let file_path = path.to_string();
            tokio::spawn(async move {
                let _ = email_service.send_activity_notification(&to_email, "DELETED", &file_path).await;
            });
        }
        Ok(())
    }

    /////////////////////////////////////////////////////////////////////
    ////    Helpers
    /////////////////////////////////////////////////////////////////////

    fn validate_filepath(path: &str) -> bool {
        Self::validate_path(path) && !path.ends_with(r"/")
    }

    fn validate_path(path: &str) -> bool {
        !path.starts_with("/") && !path.contains("//")
    }
}
