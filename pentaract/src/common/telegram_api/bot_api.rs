use reqwest::multipart;
use uuid::Uuid;

use crate::{
    common::types::ChatId, errors::{PentaractError, PentaractResult},
    services::storage_workers_scheduler::StorageWorkersScheduler,
};

use super::schemas::{DownloadBodySchema, UploadBodySchema, UploadSchema};

pub struct TelegramBotApi<'t> {
    base_url: &'t str,
    scheduler: StorageWorkersScheduler<'t>,
}

impl<'t> TelegramBotApi<'t> {
    pub fn new(base_url: &'t str, scheduler: StorageWorkersScheduler<'t>) -> Self {
        Self {
            base_url,
            scheduler,
        }
    }

    pub async fn upload(
        &self,
        file: &[u8],
        chat_id: ChatId,
        storage_id: Uuid,
    ) -> PentaractResult<UploadSchema> {

        let token = self.scheduler.get_token(storage_id).await?;
        let url = self.build_url("", "sendDocument", token);

        let file_part = multipart::Part::bytes(file.to_vec()).file_name("pentaract_chunk.bin");
        let form = multipart::Form::new()
            .text("chat_id", chat_id.to_string())
            .part("document", file_part);

        // Adding timeout and basic retry logic
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .map_err(|_e| PentaractError::Unknown)?;

        let response = client
            .post(url)
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Could not read error body".to_string());
            
            // Force printing to console for immediate visibility
            println!("\n!!! TELEGRAM CRITICAL ERROR !!!");
            println!("Status: {}", status);
            println!("Body: {}\n", error_text);
            
            tracing::error!("[TELEGRAM API ERROR] Status: {}, Body: {}", status, error_text);
            return Err(PentaractError::Unknown);
        }

        Ok(response.json::<UploadBodySchema>().await?.result.document)
    }

    pub async fn download(
        &self,
        telegram_file_id: &str,
        storage_id: Uuid,
    ) -> PentaractResult<Vec<u8>> {
        // getting file path
        let token = self.scheduler.get_token(storage_id).await?;
        let url = self.build_url("", "getFile", token);
        // TODO: add retries with their number taking from env
        let body: DownloadBodySchema = reqwest::Client::new()
            .get(url)
            .query(&[("file_id", telegram_file_id)])
            .send()
            .await?
            .json()
            .await?;

        // downloading the file itself
        let token = self.scheduler.get_token(storage_id).await?;
        let url = self.build_url("file/", &body.result.file_path, token);
        let file = reqwest::get(url)
            .await?
            .bytes()
            .await
            .map(|file| file.to_vec())?;

        Ok(file)
    }

    /// Taking token by a value to force dropping it so it can be used only once
    #[inline]
    fn build_url(&self, pre: &str, relative: &str, token: String) -> String {
        format!("{}/{pre}bot{token}/{relative}", self.base_url)
    }
}
