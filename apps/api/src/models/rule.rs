use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;
use validator::Validate;

/// 规则模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub rule_type: String,
    pub business_type: Option<String>,
    pub priority: i32,
    pub status: i32,
    pub version_id: Option<Uuid>,
    pub effective_time: Option<DateTime<Utc>>,
    pub expire_time: Option<DateTime<Utc>>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 规则版本
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleVersion {
    pub id: Uuid,
    pub rule_id: Uuid,
    pub version: i32,
    pub config_json: JsonValue,
    pub description: Option<String>,
    pub status: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub published_by: Option<Uuid>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub conditions: Option<Vec<RuleCondition>>,
    pub actions: Option<Vec<RuleAction>>,
}

/// 规则条件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleCondition {
    pub id: Uuid,
    pub rule_version_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub condition_type: String,
    pub field: Option<String>,
    pub operator: Option<String>,
    pub value: Option<String>,
    pub value_type: String,
    pub logic_type: String,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub children: Option<Vec<RuleCondition>>,
}

/// 规则动作
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleAction {
    pub id: Uuid,
    pub rule_version_id: Uuid,
    pub action_type: String,
    pub config_json: JsonValue,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
}

/// 创建规则请求
#[derive(Debug, Deserialize, Validate)]
pub struct CreateRuleRequest {
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    pub description: Option<String>,
    #[validate(length(min = 1))]
    pub rule_type: String,
    pub business_type: Option<String>,
    pub priority: Option<i32>,
    pub effective_time: Option<DateTime<Utc>>,
    pub expire_time: Option<DateTime<Utc>>,
}

/// 更新规则请求
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateRuleRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub priority: Option<i32>,
    pub status: Option<i32>,
    pub effective_time: Option<DateTime<Utc>>,
    pub expire_time: Option<DateTime<Utc>>,
}

/// 创建规则版本请求
#[derive(Debug, Deserialize)]
pub struct CreateVersionRequest {
    pub config_json: JsonValue,
    pub description: Option<String>,
    pub conditions: Vec<CreateConditionRequest>,
    pub actions: Vec<CreateActionRequest>,
}

/// 创建条件请求
#[derive(Debug, Deserialize)]
pub struct CreateConditionRequest {
    pub parent_id: Option<Uuid>,
    pub condition_type: String,
    pub field: Option<String>,
    pub operator: Option<String>,
    pub value: Option<String>,
    pub value_type: Option<String>,
    pub logic_type: Option<String>,
    pub sort_order: Option<i32>,
    pub children: Option<Vec<CreateConditionRequest>>,
}

/// 创建动作请求
#[derive(Debug, Deserialize)]
pub struct CreateActionRequest {
    pub action_type: String,
    pub config_json: JsonValue,
    pub sort_order: Option<i32>,
}

/// 规则列表项
#[derive(Debug, Serialize)]
pub struct RuleListItem {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub rule_type: String,
    pub business_type: Option<String>,
    pub priority: i32,
    pub status: i32,
    pub current_version: Option<i32>,
    pub created_by_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// 规则详情
#[derive(Debug, Serialize)]
pub struct RuleDetail {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub rule_type: String,
    pub business_type: Option<String>,
    pub priority: i32,
    pub status: i32,
    pub effective_time: Option<DateTime<Utc>>,
    pub expire_time: Option<DateTime<Utc>>,
    pub versions: Vec<RuleVersion>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 条件模板
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConditionTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub conditions: JsonValue,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
