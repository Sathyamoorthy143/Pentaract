use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, AsyncSmtpTransport, Tokio1Executor, AsyncTransport};
use crate::config::Config;
use crate::errors::{PentaractError, PentaractResult};

#[derive(Clone)]
pub struct EmailService {
    transport: AsyncSmtpTransport<Tokio1Executor>,
    from_email: String,
}

impl EmailService {
    pub fn new(config: &Config) -> Self {
        let creds = Credentials::new(config.smtp_user.clone(), config.smtp_pass.clone());

        let transport = if config.smtp_user.is_empty() {
            tracing::warn!("SMTP credentials missing; recovery emails will not be sent");
            AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous("localhost").build()
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
                .unwrap_or_else(|_| AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous("localhost"))
                .credentials(creds)
                .port(config.smtp_port)
                .build()
        };

        Self {
            transport,
            from_email: config.smtp_user.clone(),
        }
    }

    pub async fn send_reset_link(&self, to_email: &str, token: &str) -> PentaractResult<()> {
        let reset_url = format!("http://localhost:3000/vault-recovery?token={}", token);
        
        let email = Message::builder()
            .from(self.from_email.parse().unwrap())
            .to(to_email.parse().unwrap())
            .subject("Pentaract - Master Vault Recovery")
            .body(format!(
                "You requested to reset your Master Vault password.\n\nClick the link below to verify your identity and set a new password:\n\n{}\n\nThis link will expire in 1 hour.",
                reset_url
            ))
            .map_err(|_| PentaractError::Unknown)?;

        self.transport.send(email).await.map_err(|e| {
            tracing::error!("Email send failed: {e}");
            PentaractError::Unknown
        })?;

        Ok(())
    }

    pub async fn send_activity_notification(&self, to_email: &str, action: &str, file_name: &str) -> PentaractResult<()> {
        let email = Message::builder()
            .from(self.from_email.parse().unwrap())
            .to(to_email.parse().unwrap())
            .subject(format!("Pentaract Alert: File {}", action))
            .body(format!(
                "Security Notification from your Pentaract Node:\n\nAction: {}\nFile: {}\nTime: {}\n\nIf you did not authorize this change, please check your Audit Logs immediately.",
                action,
                file_name,
                chrono::Utc::now().to_rfc2822()
            ))
            .map_err(|_| PentaractError::Unknown)?;

        self.transport.send(email).await.map_err(|_| PentaractError::Unknown)?;
        Ok(())
    }
}

