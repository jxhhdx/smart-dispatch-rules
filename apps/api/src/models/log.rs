use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;


/// 系统日志查询参数
#[derive(Debug, Deserialize)]
pub struct SystemLogQueryParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub role_id: Option<String>,
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
