use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
