use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use sea_orm::DatabaseConnection;
use serde_json::json;

use crate::services::auth_service::AuthService;

pub async fn jwt_auth_middleware(
    State(_db): State<DatabaseConnection>,
    headers: HeaderMap,
    req: Request,
    next: Next,
) -> Response {
    // 从 Authorization header 中提取 token
    let auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(t) => t,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "code": 401,
                    "message": "Missing or invalid authorization header",
                    "data": null
                })),
            )
                .into_response();
        }
    };

    // 验证 token
    match AuthService::verify_token(token) {
        Ok(_claims) => {
            // TODO: 将 claims 添加到请求扩展中
            next.run(req).await
        }
        Err(_) => (
            StatusCode::UNAUTHORIZED,
            Json(json!({
                "code": 401,
                "message": "Invalid or expired token",
                "data": null
            })),
        )
            .into_response(),
    }
}
