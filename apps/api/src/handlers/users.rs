use axum::{extract::{Path, State}, Json};
use sea_orm::DatabaseConnection;
use uuid::Uuid;

use crate::models::{ApiResponse, CreateUserRequest, PaginatedResponse, UpdateUserRequest, UserListItem};

pub async fn list(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<PaginatedResponse<UserListItem>>> {
    // TODO: 实现用户列表查询
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn detail(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现用户详情查询
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn create(
    State(_db): State<DatabaseConnection>,
    Json(_req): Json<CreateUserRequest>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现创建用户
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn update(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
    Json(_req): Json<UpdateUserRequest>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现更新用户
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn delete(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
) -> Json<ApiResponse<()>> {
    // TODO: 实现删除用户
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn update_status(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
    Json(_req): Json<serde_json::Value>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现更新用户状态
    Json(ApiResponse::error(501, "Not implemented"))
}
