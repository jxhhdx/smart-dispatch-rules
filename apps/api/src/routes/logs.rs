use axum::{
    routing::get,
    Router,
};
use sea_orm::DatabaseConnection;

use crate::handlers::logs;

pub fn router() -> Router<DatabaseConnection> {
    Router::new()
        .route("/operation", get(logs::list_system_logs))
        .route("/login", get(logs::list_login_logs))
}
