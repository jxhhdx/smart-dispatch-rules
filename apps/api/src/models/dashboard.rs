use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// 派单统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DispatchStatistic {
    pub id: Uuid,
    pub stat_date: NaiveDate,
    pub stat_hour: Option<i32>,
    pub total_orders: i32,
    pub dispatched_orders: i32,
    pub success_orders: i32,
    pub failed_orders: i32,
    pub timeout_orders: i32,
    pub dispatch_rate: Option<Decimal>,
    pub success_rate: Option<Decimal>,
    pub ontime_rate: Option<Decimal>,
    pub avg_dispatch_time: Option<i32>,
    pub avg_delivery_time: Option<i32>,
    pub avg_accept_time: Option<i32>,
    pub avg_distance: Option<Decimal>,
    pub total_distance: Option<Decimal>,
    pub active_riders: Option<i32>,
    pub avg_rider_load: Option<Decimal>,
    pub rules_triggered: Option<JsonValue>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 仪表盘统计数据
#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub today_orders: i64,
    pub today_dispatched: i64,
    pub today_success_rate: f64,
    pub today_avg_time: i64,
    pub active_riders: i64,
    pub online_riders: i64,
    pub active_rules: i64,
    pub today_triggered_rules: i64,
}

/// 趋势数据点
#[derive(Debug, Serialize)]
pub struct TrendPoint {
    pub time: String,
    pub value: i64,
}

/// 仪表盘趋势数据
#[derive(Debug, Serialize)]
pub struct DashboardTrends {
    pub order_trend: Vec<TrendPoint>,
    pub dispatch_trend: Vec<TrendPoint>,
    pub success_rate_trend: Vec<TrendPoint>,
}

/// 规则触发统计
#[derive(Debug, Serialize)]
pub struct RuleTriggerStat {
    pub rule_id: Uuid,
    pub rule_name: String,
    pub trigger_count: i64,
    pub success_count: i64,
    pub success_rate: f64,
}

/// 骑手绩效统计
#[derive(Debug, Serialize)]
pub struct RiderPerformance {
    pub rider_id: String,
    pub rider_name: String,
    pub total_orders: i64,
    pub completed_orders: i64,
    pub completion_rate: f64,
    pub avg_delivery_time: i64,
    pub rating: f64,
}

/// 区域热力图数据
#[derive(Debug, Serialize)]
pub struct HeatmapData {
    pub region: String,
    pub lat: f64,
    pub lng: f64,
    pub order_count: i64,
    pub intensity: f64,
}

/// 实时数据
#[derive(Debug, Serialize)]
pub struct RealtimeData {
    pub pending_orders: i64,
    pub dispatching_orders: i64,
    pub delivering_orders: i64,
    pub completed_today: i64,
    pub active_riders: i64,
    pub idle_riders: i64,
    pub offline_riders: i64,
}
