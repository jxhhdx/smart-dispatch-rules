use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "rule_versions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    #[sea_orm(column_name = "rule_id")]
    pub rule_id: String,
    pub version: i32,
    #[sea_orm(column_name = "config_json")]
    pub config_json: JsonValue,
    pub description: Option<String>,
    pub status: i32,
    #[sea_orm(column_name = "published_at")]
    pub published_at: Option<DateTimeWithTimeZone>,
    #[sea_orm(column_name = "published_by")]
    pub published_by: Option<String>,
    #[sea_orm(column_name = "created_by")]
    pub created_by: Option<String>,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::rules::Entity",
        from = "Column::RuleId",
        to = "super::rules::Column::Id"
    )]
    Rule,
}

impl ActiveModelBehavior for ActiveModel {}
