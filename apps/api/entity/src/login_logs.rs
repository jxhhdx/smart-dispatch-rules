use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "login_logs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(column_name = "user_id")]
    pub user_id: Option<Uuid>,
    pub username: Option<String>,
    #[sea_orm(column_name = "login_type")]
    pub login_type: String,
    #[sea_orm(column_name = "ip_address")]
    pub ip_address: Option<String>,
    #[sea_orm(column_name = "user_agent")]
    pub user_agent: Option<String>,
    pub status: i32,
    #[sea_orm(column_name = "fail_reason")]
    pub fail_reason: Option<String>,
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
