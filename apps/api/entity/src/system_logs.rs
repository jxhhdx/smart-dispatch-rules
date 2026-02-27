use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "system_logs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    #[sea_orm(column_name = "user_id")]
    pub user_id: Option<String>,
    pub username: Option<String>,
    pub action: String,
    pub module: String,
    pub description: Option<String>,
    pub params: Option<JsonValue>,
    pub result: Option<JsonValue>,
    #[sea_orm(column_name = "ip_address")]
    pub ip_address: Option<String>,
    #[sea_orm(column_name = "user_agent")]
    pub user_agent: Option<String>,
    #[sea_orm(column_name = "duration_ms")]
    pub duration_ms: Option<i32>,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id"
    )]
    User,
}

impl ActiveModelBehavior for ActiveModel {}
