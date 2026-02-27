use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "permissions")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name: String,
    #[sea_orm(unique)]
    pub code: String,
    pub r#type: String,
    #[sea_orm(column_name = "parent_id")]
    pub parent_id: Option<Uuid>,
    pub path: Option<String>,
    #[sea_orm(column_name = "sort_order")]
    pub sort_order: i32,
    pub status: i32,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        self_reference = true,
        from = "Column::ParentId",
        to = "Column::Id"
    )]
    Parent,
    #[sea_orm(has_many = "super::role_permissions::Entity")]
    RolePermissions,
}

impl Related<super::roles::Entity> for Entity {
    fn to() -> RelationDef {
        super::role_permissions::Relation::Role.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::role_permissions::Relation::Permission.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
