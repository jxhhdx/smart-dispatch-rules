use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 系统日志
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub username: Option<String>,
    pub action: String,
    pub module: String,
    pub description: Option<String>,
    pub params: Option<JsonValue>,
    pub result: Option<JsonValue>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub duration_ms: Option<i32>,
    pub created_at: DateTime<Utc>,
}

/// 登录日志
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub username: Option<String>,
    pub login_type: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub status: i32,
    pub fail_reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// 系统日志查询参数
#[derive(Debug, Deserialize)]
pub struct SystemLogQueryParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub user_id: Option<Uuid>,
    pub module: Option<String>,
    pub action: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
}

/// 登录日志查询参数
#[derive(Debug, Deserialize)]
pub struct LoginLogQueryParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub username: Option<String>,
    pub status: Option<i32>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
}

/// 系统日志列表项
#[derive(Debug, Serialize)]
pub struct SystemLogListItem {
    pub id: Uuid,
    pub username: Option<String>,
    pub action: String,
    pub module: String,
    pub description: Option<String>,
    pub ip_address: Option<String>,
    pub duration_ms: Option<i32>,
    pub created_at: DateTime<Utc>,
}

/// 登录日志列表项
#[derive(Debug, Serialize)]
pub struct LoginLogListItem {
    pub id: Uuid,
    pub username: Option<String>,
    pub login_type: String,
    pub ip_address: Option<String>,
    pub status: i32,
    pub fail_reason: Option<String>,
    pub created_at: DateTime<Utc>,
}
