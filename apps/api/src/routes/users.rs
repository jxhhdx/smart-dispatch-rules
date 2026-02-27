use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::AppState;
use crate::handlers::users;
use crate::middleware::auth::require_auth;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(users::list).post(users::create))
        .route("/:id", get(users::detail).put(users::update).delete(users::delete))
        .route("/:id/status", put(users::update_status))
        .layer(axum::middleware::from_fn(require_auth))
}
