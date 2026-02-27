use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};

use crate::AppState;
use crate::services::auth_service::AuthService;

pub async fn require_auth(
    headers: HeaderMap,
    request: Request,
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
                Json(serde_json::json!({
                    "code": 401,
                    "message": "缺少认证信息",
                    "data": null
                })),
            )
                .into_response();
        }
    };

    // 验证 token
    match AuthService::verify_token(token) {
        Ok(_claims) => {
            // TODO: 将 claims 添加到请求扩展中，供后续使用
            next.run(request).await
        }
        Err(_) => (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({
                "code": 401,
                "message": "认证已过期或无效",
                "data": null
            })),
        )
            .into_response(),
    }
}

// 用于从 State 中提取的 auth 中间件
pub async fn auth_middleware(
    State(_state): State<AppState>,
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Response {
    require_auth(headers, request, next).await
}
