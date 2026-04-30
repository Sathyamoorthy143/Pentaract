use sqlx::PgPool;
use uuid::Uuid;
use crate::{
    common::{email::EmailService, password_manager::PasswordManager}, 
    config::Config,
    errors::{PentaractError, PentaractResult}, 
    models::users::InDBUser,
    repositories::{
        master_reset_tokens::MasterResetTokensRepository,
        users::UsersRepository
    }, 
    schemas::users::InUser,
};

pub struct UsersService<'d> {
    repo: UsersRepository<'d>,
    reset_repo: MasterResetTokensRepository<'d>,
    email_service: Option<EmailService>,
}

impl<'d> UsersService<'d> {
    pub fn new(db: &'d PgPool) -> Self {
        let repo = UsersRepository::new(db);
        let reset_repo = MasterResetTokensRepository::new(db);
        Self { repo, reset_repo, email_service: None }
    }

    pub fn new_with_config(db: &'d PgPool, config: &Config) -> Self {
        let repo = UsersRepository::new(db);
        let reset_repo = MasterResetTokensRepository::new(db);
        let email_service = Some(EmailService::new(config));
        Self { repo, reset_repo, email_service }
    }

    pub async fn create(&self, in_user: InUser) -> PentaractResult<()> {
        let password_hash = PasswordManager::generate(&in_user.password).unwrap();
        let user = InDBUser::new(in_user.email, password_hash);
        self.repo.create(user).await?;
        Ok(())
    }

    pub async fn set_master_password(&self, user_id: Uuid, password: &str) -> PentaractResult<()> {
        let hash = PasswordManager::generate(password).unwrap();
        self.repo.update_master_password_hash(user_id, &hash).await?;
        Ok(())
    }

    pub async fn verify_master_password(&self, user_id: Uuid, password: &str) -> PentaractResult<()> {
        let user = self.repo.get_by_id(user_id).await?;
        let hash = user.master_password_hash.ok_or(PentaractError::Unauthorized)?;
        if PasswordManager::verify(password, &hash).is_err() {
            return Err(PentaractError::Unauthorized);
        }
        Ok(())
    }

    pub async fn reset_master_password_request(&self, user_id: Uuid) -> PentaractResult<()> {
        let user = self.repo.get_by_id(user_id).await?;
        let token = self.reset_repo.create(user_id).await?;
        
        if let Some(service) = &self.email_service {
            service.send_reset_link(&user.email, &token.to_string()).await?;
        }
        
        Ok(())
    }

    pub async fn reset_master_password_confirm(&self, token: Uuid, new_password: &str) -> PentaractResult<()> {
        let user_id = self.reset_repo.verify(token).await?;
        let hash = PasswordManager::generate(new_password).unwrap();
        self.repo.update_master_password_hash(user_id, &hash).await?;
        self.reset_repo.delete_by_user(user_id).await?;
        Ok(())
    }
}
