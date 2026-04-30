use sqlx::{Pool, Postgres};

use crate::{
    common::{channels::ClientSender, email::EmailService},
    config::Config,
};

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Postgres>,
    pub config: Config,
    pub tx: ClientSender,
    pub email_service: EmailService,
}

impl AppState {
    pub fn new(db: Pool<Postgres>, config: Config, tx: ClientSender) -> Self {
        let email_service = EmailService::new(&config);
        Self {
            db,
            config,
            tx,
            email_service,
        }
    }
}
