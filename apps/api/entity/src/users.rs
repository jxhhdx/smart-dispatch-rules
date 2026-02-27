use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub username: String,
    #[sea_orm(unique)]
    pub email: String,
    #[sea_orm(column_name = "password_hash")]
    pub password_hash: String,
    #[sea_orm(column_name = "real_name")]
    pub real_name: Option<String>,
    pub phone: Option<String>,
    #[sea_orm(column_name = "avatar_url")]
    pub avatar_url: Option<String>,
    #[sea_orm(column_name = "role_id")]
    pub role_id: Option<Uuid>,
    pub status: i32,
    #[sea_orm(column_name = "last_login_at")]
    pub last_login_at: Option<DateTimeWithTimeZone>,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::roles::Entity",
        from = "Column::RoleId",
        to = "super::roles::Column::Id"
    )]
    Role,
    #[sea_orm(has_many = "super::rules::Entity")]
    CreatedRules,
    #[sea_orm(has_many = "super::rules::Entity")]
    UpdatedRules,
    #[sea_orm(has_many = "super::system_logs::Entity")]
    SystemLogs,
    #[sea_orm(has_many = "super::login_logs::Entity")]
    LoginLogs,
}

impl Related<super::roles::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Role.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
