use std::sync::Arc;
use axum::{
    extract::{Extension, State},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use reqwest::StatusCode;

use crate::{
    common::{jwt_manager::AuthUser, routing::app_state::AppState},
    repositories::activity_logs::ActivityLogsRepository,
};

pub struct ActivityLogsRouter;

impl ActivityLogsRouter {
    pub fn get_router(state: Arc<AppState>) -> Router<Arc<AppState>, axum::body::Body> {
        Router::new()
            .route("/", get(Self::list))
            .with_state(state)
    }

    async fn list(
        State(state): State<Arc<AppState>>,
        Extension(user): Extension<AuthUser>,
    ) -> impl IntoResponse {
        let logs = ActivityLogsRepository::new(&state.db).list(user.id).await?;
        Ok::<_, (StatusCode, String)>(Json(logs))
    }
}
