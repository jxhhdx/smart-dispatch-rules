use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::AppState;
use crate::handlers::rules;
use crate::middleware::auth::require_auth;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(rules::list).post(rules::create))
        .route("/:id", get(rules::detail).put(rules::update).delete(rules::delete))
        .route("/:id/status", put(rules::update_status))
        .route("/:id/versions", get(rules::list_versions).post(rules::create_version))
        .route("/:id/versions/:version_id/publish", post(rules::publish_version))
        .route("/:id/versions/:version_id/rollback", post(rules::rollback_version))
        .route("/:id/clone", post(rules::clone_rule))
        .route("/:id/export", get(rules::export_rule))
        .route("/export", get(rules::export_all_rules))
        .route("/simulate", post(rules::simulate))
        .layer(axum::middleware::from_fn(require_auth))
}
