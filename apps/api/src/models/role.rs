use serde::{Deserialize, Serialize};
use validator::Validate;
use uuid::Uuid;

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
