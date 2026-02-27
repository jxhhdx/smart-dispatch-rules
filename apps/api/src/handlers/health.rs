use axum::Json;
use serde_json::json;

pub async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "smart-dispatch-api",
        "version": "1.0.0"
    }))
}
