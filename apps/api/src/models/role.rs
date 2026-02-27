use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// 角色模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub status: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 权限模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub r#type: String,
    pub parent_id: Option<Uuid>,
    pub path: Option<String>,
    pub sort_order: i32,
    pub status: i32,
    pub created_at: DateTime<Utc>,
    pub children: Option<Vec<Permission>>,
}

/// 创建角色请求
#[derive(Debug, Deserialize, Validate)]
pub struct CreateRoleRequest {
    #[validate(length(min = 1, max = 50))]
    pub name: String,
    #[validate(length(min = 1, max = 50))]
    pub code: String,
    pub description: Option<String>,
}

/// 更新角色请求
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateRoleRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<i32>,
}

/// 更新角色权限请求
#[derive(Debug, Deserialize)]
pub struct UpdateRolePermissionsRequest {
    pub permission_ids: Vec<Uuid>,
}

/// 角色列表项
#[derive(Debug, Serialize)]
pub struct RoleListItem {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub status: i32,
    pub user_count: i64,
    pub created_at: DateTime<Utc>,
}

/// 角色详情
#[derive(Debug, Serialize)]
pub struct RoleDetail {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub status: i32,
    pub permissions: Vec<Permission>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
