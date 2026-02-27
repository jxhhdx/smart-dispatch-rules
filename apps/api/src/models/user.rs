use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// 用户模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub real_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role_id: Option<Uuid>,
    pub status: i32,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 创建用户请求
#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 6))]
    pub password: String,
    pub real_name: Option<String>,
    pub phone: Option<String>,
    pub role_id: Option<Uuid>,
}

/// 更新用户请求
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub real_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role_id: Option<Uuid>,
    pub status: Option<i32>,
}

/// 登录请求
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 1))]
    pub password: String,
}

/// 登录响应
#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

/// 用户信息（脱敏）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub real_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role_id: Option<Uuid>,
    pub role_name: Option<String>,
    pub status: i32,
    pub permissions: Vec<String>,
}

/// 用户列表项
#[derive(Debug, Serialize)]
pub struct UserListItem {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub real_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role_id: Option<Uuid>,
    pub role_name: Option<String>,
    pub status: i32,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
