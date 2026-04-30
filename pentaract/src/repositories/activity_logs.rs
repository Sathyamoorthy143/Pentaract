use sqlx::PgPool;
use uuid::Uuid;
use crate::errors::{PentaractError, PentaractResult};

#[derive(Clone)]
pub struct ActivityLogsRepository<'d> {
    db: &'d PgPool,
}

impl<'d> ActivityLogsRepository<'d> {
    pub fn new(db: &'d PgPool) -> Self {
        Self { db }
    }

    pub async fn log(&self, user_id: Uuid, action: &str, details: &str) -> PentaractResult<()> {
        sqlx::query(
            "INSERT INTO activity_logs (id, user_id, action, details) VALUES ($1, $2, $3, $4)"
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(action)
        .bind(details)
        .execute(self.db)
        .await
        .map_err(|e| {
            tracing::error!("{e}");
            PentaractError::Unknown
        })?;
        Ok(())
    }

    pub async fn list(&self, user_id: Uuid) -> PentaractResult<Vec<ActivityLog>> {
        sqlx::query_as::<_, ActivityLog>(
            "SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100"
        )
        .bind(user_id)
        .fetch_all(self.db)
        .await
        .map_err(|_| PentaractError::Unknown)
    }
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct ActivityLog {
    pub id: Uuid,
    pub user_id: Uuid,
    pub action: String,
    pub details: String,
    pub created_at: chrono::NaiveDateTime,
}
