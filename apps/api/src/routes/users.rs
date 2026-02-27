use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sea_orm::DatabaseConnection;

use crate::handlers::users;

pub fn router() -> Router<DatabaseConnection> {
    Router::new()
        .route("/", get(users::list).post(users::create))
        .route("/:id", get(users::detail).put(users::update).delete(users::delete))
        .route("/:id/status", put(users::update_status))
}
