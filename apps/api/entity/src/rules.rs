use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "rules")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    #[sea_orm(column_name = "rule_type")]
    pub rule_type: String,
    #[sea_orm(column_name = "business_type")]
    pub business_type: Option<String>,
    pub priority: i32,
    pub status: i32,
    #[sea_orm(column_name = "version_id")]
    pub version_id: Option<String>,
    #[sea_orm(column_name = "effective_time")]
    pub effective_time: Option<DateTimeWithTimeZone>,
    #[sea_orm(column_name = "expire_time")]
    pub expire_time: Option<DateTimeWithTimeZone>,
    #[sea_orm(column_name = "created_by")]
    pub created_by: Option<String>,
    #[sea_orm(column_name = "updated_by")]
    pub updated_by: Option<String>,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::CreatedBy",
        to = "super::users::Column::Id"
    )]
    Creator,
}

impl ActiveModelBehavior for ActiveModel {}
