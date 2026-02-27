use axum::{extract::State, Json};
use sea_orm::DatabaseConnection;

use crate::models::{ApiResponse, DashboardStats, DashboardTrends, HeatmapData, RealtimeData, RiderPerformance, RuleTriggerStat};

pub async fn stats(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<DashboardStats>> {
    // TODO: 实现仪表盘统计
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn trends(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<DashboardTrends>> {
    // TODO: 实现趋势数据
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn rule_stats(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<Vec<RuleTriggerStat>>> {
    // TODO: 实现规则触发统计
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn rider_performance(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<Vec<RiderPerformance>>> {
    // TODO: 实现骑手绩效统计
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn heatmap(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<Vec<HeatmapData>>> {
    // TODO: 实现热力图数据
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn realtime(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<RealtimeData>> {
    // TODO: 实现实时数据
    Json(ApiResponse::error(501, "Not implemented"))
}
