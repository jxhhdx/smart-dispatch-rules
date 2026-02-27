use serde::{Deserialize, Serialize};


/// 权限模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: String,
    pub name: String,
    pub code: String,
    pub r#type: String,
    pub parent_id: Option<String>,
    pub path: Option<String>,
    pub sort_order: i32,
    pub status: i32,
    pub children: Option<Vec<Permission>>,
}
