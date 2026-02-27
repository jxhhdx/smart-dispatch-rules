use axum::{
    routing::{get, post},
    Router,
};

use crate::AppState;
use crate::handlers::auth;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/profile", get(auth::profile))
        .route("/refresh", post(auth::refresh_token))
}
