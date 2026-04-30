use serde::Deserialize;

#[derive(Deserialize)]
pub struct InUser {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct MasterPasswordSchema {
    pub password: String,
}

#[derive(Deserialize)]
pub struct ResetConfirmSchema {
    pub token: uuid::Uuid,
    pub new_password: String,
}
