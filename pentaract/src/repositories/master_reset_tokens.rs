use sqlx::PgPool;
use uuid::Uuid;
use chrono::{Utc, Duration};
use crate::errors::{PentaractError, PentaractResult};

#[derive(Clone)]
pub struct MasterResetTokensRepository<'d> {
    db: &'d PgPool,
}

impl<'d> MasterResetTokensRepository<'d> {
    pub fn new(db: &'d PgPool) -> Self {
        Self { db }
    }

    pub async fn create(&self, user_id: Uuid) -> PentaractResult<Uuid> {
        let token = Uuid::new_v4();
        let expires_at = Utc::now() + Duration::hours(1);

        sqlx::query(
            "INSERT INTO master_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)"
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(token)
        .bind(expires_at.naive_utc())
        .execute(self.db)
        .await
        .map_err(|_| PentaractError::Unknown)?;

        Ok(token)
    }

    pub async fn verify(&self, token: Uuid) -> PentaractResult<Uuid> {
        let res = sqlx::query!(
            "SELECT user_id, expires_at FROM master_reset_tokens WHERE token = $1",
            token
        )
        .fetch_optional(self.db)
        .await
        .map_err(|_| PentaractError::Unknown)?
        .ok_or(PentaractError::Unauthorized)?;

        if res.expires_at < Utc::now().naive_utc() {
            return Err(PentaractError::Unauthorized);
        }

        Ok(res.user_id)
    }

    pub async fn delete_by_user(&self, user_id: Uuid) -> PentaractResult<()> {
        sqlx::query("DELETE FROM master_reset_tokens WHERE user_id = $1")
            .bind(user_id)
            .execute(self.db)
            .await
            .map_err(|_| PentaractError::Unknown)
            .map(|_| ())
    }
}
