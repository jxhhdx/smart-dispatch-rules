use chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

use validator::Validate;

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
    pub effective_time: Option<DateTime<FixedOffset>>,
    pub expire_time: Option<DateTime<FixedOffset>>,
}

/// 更新规则请求
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateRuleRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub priority: Option<i32>,
    pub status: Option<i32>,
    pub effective_time: Option<DateTime<FixedOffset>>,
    pub expire_time: Option<DateTime<FixedOffset>>,
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
#[derive(Debug, Deserialize, Clone)]
pub struct CreateConditionRequest {
    pub parent_id: Option<String>,
    pub condition_type: String,
    pub field: Option<String>,
    pub operator: Option<String>,
    pub value: Option<String>,
    pub value_type: Option<String>,
    pub logic_type: Option<String>,
    pub sort_order: Option<i32>,
    #[serde(default)]
    pub children: Vec<CreateConditionRequest>,
}

/// 创建动作请求
#[derive(Debug, Deserialize)]
pub struct CreateActionRequest {
    pub action_type: String,
    pub config_json: JsonValue,
    pub sort_order: Option<i32>,
}
