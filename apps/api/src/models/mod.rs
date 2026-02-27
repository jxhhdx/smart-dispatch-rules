use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub mod user;
pub mod role;
pub mod permission;
pub mod rule;
pub mod log;
pub mod dashboard;

pub use user::*;
pub use role::*;
pub use permission::*;
pub use rule::*;
pub use log::*;
pub use dashboard::*;

/// 通用响应结构
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub message: String,
    pub data: Option<T>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            code: 0,
            message: "success".to_string(),
            data: Some(data),
        }
    }

    pub fn error(code: i32, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            data: None,
        }
    }
}

/// 分页请求
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: u64,
    #[serde(default = "default_page_size")]
    pub page_size: u64,
}

fn default_page() -> u64 {
    1
}

fn default_page_size() -> u64 {
    10
}

/// 分页响应
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub list: Vec<T>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

impl<T> PaginatedResponse<T> {
    pub fn new(list: Vec<T>, total: u64, page: u64, page_size: u64) -> Self {
        let total_pages = (total + page_size - 1) / page_size;
        Self {
            list,
            total,
            page,
            page_size,
            total_pages,
        }
    }
}
