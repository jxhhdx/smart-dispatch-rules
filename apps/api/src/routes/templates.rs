use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::AppState;
use crate::handlers::templates;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(templates::list).post(templates::create))
        .route("/:id", get(templates::detail).put(templates::update).delete(templates::delete))
}
