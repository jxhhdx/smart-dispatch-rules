use axum::{
    routing::get,
    Router,
};
use sea_orm::DatabaseConnection;

use crate::handlers::dashboard;

pub fn router() -> Router<DatabaseConnection> {
    Router::new()
        .route("/stats", get(dashboard::stats))
        .route("/trends", get(dashboard::trends))
        .route("/rule-stats", get(dashboard::rule_stats))
        .route("/rider-performance", get(dashboard::rider_performance))
        .route("/heatmap", get(dashboard::heatmap))
        .route("/realtime", get(dashboard::realtime))
}
