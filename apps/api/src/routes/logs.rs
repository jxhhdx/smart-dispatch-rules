use axum::{
    routing::get,
    Router,
};

use crate::AppState;
use crate::handlers::logs;
use crate::middleware::auth::require_auth;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/operation", get(logs::list_system_logs))
        .route("/login", get(logs::list_login_logs))
        .layer(axum::middleware::from_fn(require_auth))
}
