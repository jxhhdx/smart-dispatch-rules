use sea_orm::{Database, DatabaseConnection, DbErr};
use std::env;

pub async fn init_db() -> Result<DatabaseConnection, DbErr> {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in environment");

    let db = Database::connect(&database_url).await?;
    
    tracing::info!("✅ Database connected successfully");
    
    Ok(db)
}

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
}

impl From<DatabaseConnection> for AppState {
    fn from(db: DatabaseConnection) -> Self {
        Self { db }
    }
}
