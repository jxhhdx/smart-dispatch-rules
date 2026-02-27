use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "rule_actions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(column_name = "rule_version_id")]
    pub rule_version_id: Uuid,
    #[sea_orm(column_name = "action_type")]
    pub action_type: String,
    #[sea_orm(column_name = "config_json")]
    pub config_json: JsonValue,
    #[sea_orm(column_name = "sort_order")]
    pub sort_order: i32,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::rule_versions::Entity",
        from = "Column::RuleVersionId",
        to = "super::rule_versions::Column::Id"
    )]
    RuleVersion,
}

impl ActiveModelBehavior for ActiveModel {}
