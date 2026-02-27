use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "condition_templates")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub conditions: JsonValue,
    #[sea_orm(column_name = "created_by")]
    pub created_by: Option<Uuid>,
    #[sea_orm(column_name = "updated_by")]
    pub updated_by: Option<Uuid>,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
