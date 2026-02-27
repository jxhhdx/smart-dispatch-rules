use axum::{extract::State, Json};
use sea_orm::DatabaseConnection;

use crate::models::{ApiResponse, LoginRequest, LoginResponse};

pub async fn login(
    State(_db): State<DatabaseConnection>,
    Json(_req): Json<LoginRequest>,
) -> Json<ApiResponse<LoginResponse>> {
    // TODO: 实现登录逻辑
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn logout(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<()>> {
    // TODO: 实现登出逻辑
    Json(ApiResponse::success(()))
}

pub async fn profile(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现获取用户信息逻辑
    Json(ApiResponse::error(501, "Not implemented"))
}

pub async fn refresh_token(
    State(_db): State<DatabaseConnection>,
) -> Json<ApiResponse<LoginResponse>> {
    // TODO: 实现刷新 token 逻辑
    Json(ApiResponse::error(501, "Not implemented"))
}
