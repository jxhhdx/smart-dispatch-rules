use axum::{extract::{Path, State}, Json};
use sea_orm::DatabaseConnection;
use uuid::Uuid;

use crate::models::{ApiResponse, CreateRoleRequest, PaginatedResponse, RoleListItem, UpdateRoleRequest};

pub async fn list(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<PaginatedResponse<RoleListItem>>> {
    // TODO: 实现角色列表查询
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn detail(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现角色详情查询
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn create(
    State(_db): State<DatabaseConnection>,
    Json(_req): Json<CreateRoleRequest>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现创建角色
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn update(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
    Json(_req): Json<UpdateRoleRequest>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现更新角色
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn delete(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
) -> Json<ApiResponse<()>> {
    // TODO: 实现删除角色
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn update_permissions(
    State(_db): State<DatabaseConnection>,
    Path(_id): Path<Uuid>,
    Json(_req): Json<serde_json::Value>,
) -> Json<ApiResponse<()>> {
    // TODO: 实现更新角色权限
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn list_permissions(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<Vec<serde_json::Value>>> {
    // TODO: 实现权限列表查询
    Json(ApiResponse::error(501, "Not implemented"))
}
