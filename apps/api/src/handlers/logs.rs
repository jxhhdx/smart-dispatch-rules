use axum::{extract::{Query, State}, Json};
use sea_orm::DatabaseConnection;

use crate::models::{ApiResponse, LoginLogListItem, LoginLogQueryParams, PaginatedResponse, SystemLogListItem, SystemLogQueryParams};

pub async fn list_system_logs(
    State(_db): State<DatabaseConnection>,
    Query(_params): Query<SystemLogQueryParams>,
) -> Json<ApiResponse<PaginatedResponse<SystemLogListItem>>> {
    // TODO: 实现系统日志查询
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn list_login_logs(
    State(_db): State<DatabaseConnection>,
    Query(_params): Query<LoginLogQueryParams>,
) -> Json<ApiResponse<PaginatedResponse<LoginLogListItem>>> {
    // TODO: 实现登录日志查询
    Json(ApiResponse::error(501, "Not implemented"))
}
