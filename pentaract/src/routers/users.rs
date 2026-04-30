use std::sync::Arc;

use axum::{
    extract::{Extension, State},
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use reqwest::StatusCode;

use crate::{
    common::{jwt_manager::AuthUser, routing::app_state::AppState},
    schemas::users::{InUser, MasterPasswordSchema, ResetConfirmSchema},
    services::users::UsersService,
};

pub struct UsersRouter;

impl UsersRouter {
    pub fn get_router(state: Arc<AppState>) -> Router<Arc<AppState>, axum::body::Body> {
        Router::new()
            .route("/", post(Self::register))
            .route("/master_password", post(Self::set_master_password))
            .route("/master_password/verify", post(Self::verify_master_password))
            .route("/master_password/reset_request", post(Self::reset_request))
            .route("/master_password/reset_confirm", post(Self::reset_confirm))
            .with_state(state)
    }

    async fn register(
        State(state): State<Arc<AppState>>,
        Json(in_user): Json<InUser>,
    ) -> impl IntoResponse {
        UsersService::new(&state.db).create(in_user).await?;
        Ok::<_, (StatusCode, String)>(StatusCode::OK)
    }

    async fn set_master_password(
        State(state): State<Arc<AppState>>,
        Extension(user): Extension<AuthUser>,
        Json(payload): Json<MasterPasswordSchema>,
    ) -> impl IntoResponse {
        UsersService::new(&state.db)
            .set_master_password(user.id, &payload.password)
            .await?;
        Ok::<_, (StatusCode, String)>(StatusCode::OK)
    }

    async fn verify_master_password(
        State(state): State<Arc<AppState>>,
        Extension(user): Extension<AuthUser>,
        Json(payload): Json<MasterPasswordSchema>,
    ) -> impl IntoResponse {
        UsersService::new(&state.db)
            .verify_master_password(user.id, &payload.password)
            .await?;
        Ok::<_, (StatusCode, String)>(StatusCode::OK)
    }

    async fn reset_request(
        State(state): State<Arc<AppState>>,
        Extension(user): Extension<AuthUser>,
    ) -> impl IntoResponse {
        UsersService::new_with_config(&state.db, &state.config)
            .reset_master_password_request(user.id)
            .await?;
        Ok::<_, (StatusCode, String)>(StatusCode::OK)
    }

    async fn reset_confirm(
        State(state): State<Arc<AppState>>,
        Json(payload): Json<ResetConfirmSchema>,
    ) -> impl IntoResponse {
        UsersService::new(&state.db)
            .reset_master_password_confirm(payload.token, &payload.new_password)
            .await?;
        Ok::<_, (StatusCode, String)>(StatusCode::OK)
    }
}
