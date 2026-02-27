use axum::{
    routing::{get, post},
    Router,
};
use sea_orm::DatabaseConnection;

use crate::handlers::auth;

pub fn router() -> Router<DatabaseConnection> {
    Router::new()
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/profile", get(auth::profile))
        .route("/refresh", post(auth::refresh_token))
}
