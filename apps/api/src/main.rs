use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 加载环境变量
    dotenvy::dotenv().ok();

    // 数据库连接
    let db_pool = db::init_db().await?;

    // CORS 配置
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 构建路由
    let app = Router::new()
        .route("/api/v1/health", get(handlers::health::health_check))
        .nest("/api/v1/auth", routes::auth::router())
        .nest("/api/v1/users", routes::users::router())
        .nest("/api/v1/roles", routes::roles::router())
        .nest("/api/v1/rules", routes::rules::router())
        .nest("/api/v1/logs", routes::logs::router())
        .nest("/api/v1/dashboard", routes::dashboard::router())
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(db_pool);

    // 启动服务
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;

    tracing::info!("🚀 Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
