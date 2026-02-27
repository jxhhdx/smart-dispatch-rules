use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use sea_orm::DatabaseConnection;

pub mod auth;

pub async fn auth_middleware(
    State(_db): State<DatabaseConnection>,
    req: Request,
    next: Next,
) -> Response {
    // TODO: 实现 JWT 认证中间件
    next.run(req).await
}
