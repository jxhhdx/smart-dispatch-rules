use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "rule_conditions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    #[sea_orm(column_name = "rule_version_id")]
    pub rule_version_id: String,
    #[sea_orm(column_name = "parent_id")]
    pub parent_id: Option<String>,
    #[sea_orm(column_name = "condition_type")]
    pub condition_type: String,
    pub field: Option<String>,
    pub operator: Option<String>,
    pub value: Option<String>,
    #[sea_orm(column_name = "value_type")]
    pub value_type: String,
    #[sea_orm(column_name = "logic_type")]
    pub logic_type: String,
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
