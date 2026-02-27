use axum::{
    routing::get,
    Router,
};

use crate::AppState;
use crate::handlers::dashboard;
use crate::middleware::auth::require_auth;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/stats", get(dashboard::stats))
        .route("/trends", get(dashboard::trends))
        .route("/rule-stats", get(dashboard::rule_stats))
        .route("/rider-performance", get(dashboard::rider_performance))
        .route("/heatmap", get(dashboard::heatmap))
        .route("/realtime", get(dashboard::realtime))
        .layer(axum::middleware::from_fn(require_auth))
}
