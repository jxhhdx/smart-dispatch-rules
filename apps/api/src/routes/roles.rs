use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sea_orm::DatabaseConnection;

use crate::handlers::roles;

pub fn router() -> Router<DatabaseConnection> {
    Router::new()
        .route("/", get(roles::list).post(roles::create))
        .route("/:id", get(roles::detail).put(roles::update).delete(roles::delete))
        .route("/:id/permissions", put(roles::update_permissions))
        .route("/permissions", get(roles::list_permissions))
}
