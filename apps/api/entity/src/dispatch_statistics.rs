use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use rust_decimal::Decimal;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "dispatch_statistics")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    #[sea_orm(column_name = "stat_date")]
    pub stat_date: Date,
    #[sea_orm(column_name = "stat_hour")]
    pub stat_hour: Option<i32>,
    #[sea_orm(column_name = "total_orders")]
    pub total_orders: i32,
    #[sea_orm(column_name = "dispatched_orders")]
    pub dispatched_orders: i32,
    #[sea_orm(column_name = "success_orders")]
    pub success_orders: i32,
    #[sea_orm(column_name = "failed_orders")]
    pub failed_orders: i32,
    #[sea_orm(column_name = "timeout_orders")]
    pub timeout_orders: i32,
    #[sea_orm(column_name = "dispatch_rate")]
    pub dispatch_rate: Option<Decimal>,
    #[sea_orm(column_name = "success_rate")]
    pub success_rate: Option<Decimal>,
    #[sea_orm(column_name = "ontime_rate")]
    pub ontime_rate: Option<Decimal>,
    #[sea_orm(column_name = "avg_dispatch_time")]
    pub avg_dispatch_time: Option<i32>,
    #[sea_orm(column_name = "avg_delivery_time")]
    pub avg_delivery_time: Option<i32>,
    #[sea_orm(column_name = "avg_accept_time")]
    pub avg_accept_time: Option<i32>,
    #[sea_orm(column_name = "avg_distance")]
    pub avg_distance: Option<Decimal>,
    #[sea_orm(column_name = "total_distance")]
    pub total_distance: Option<Decimal>,
    #[sea_orm(column_name = "active_riders")]
    pub active_riders: Option<i32>,
    #[sea_orm(column_name = "avg_rider_load")]
    pub avg_rider_load: Option<Decimal>,
    #[sea_orm(column_name = "rules_triggered")]
    pub rules_triggered: Option<JsonValue>,
    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,
    #[sea_orm(column_name = "updated_at")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
