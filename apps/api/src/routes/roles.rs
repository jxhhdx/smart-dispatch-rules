use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::AppState;
use crate::handlers::roles;
use crate::middleware::auth::require_auth;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(roles::list).post(roles::create))
        .route("/:id", get(roles::detail).put(roles::update).delete(roles::delete))
        .route("/:id/permissions", put(roles::update_permissions))
        .route("/permissions", get(roles::list_permissions))
        .layer(axum::middleware::from_fn(require_auth))
}
