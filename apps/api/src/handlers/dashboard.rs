use axum::{extract::State, Json};
use chrono::{Local, Datelike};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder};

use crate::AppState;
use crate::models::{ApiResponse, DashboardStats, DashboardTrends, TrendPoint, RuleTriggerStat, RiderPerformance, HeatmapData, RealtimeData};
use entity::dispatch_statistics::{self, Entity as DispatchStatistic};
use entity::rules::{self, Entity as Rule};

pub async fn stats(
    State(state): State<AppState>,
) -> Json<ApiResponse<DashboardStats>> {
    let today = Local::now().date_naive();
    
    // 获取今日统计数据
    let today_stats = DispatchStatistic::find()
        .filter(dispatch_statistics::Column::StatDate.eq(today))
        .filter(dispatch_statistics::Column::StatHour.is_null())
        .one(&state.db)
        .await
        .unwrap_or_default();

    // 获取活跃规则数量
    let active_rules = Rule::find()
        .filter(rules::Column::Status.eq(1))
        .count(&state.db)
        .await
        .unwrap_or(0);

    let stats = DashboardStats {
        today_orders: today_stats.as_ref().map(|s| s.total_orders as i64).unwrap_or(0),
        today_dispatched: today_stats.as_ref().map(|s| s.dispatched_orders as i64).unwrap_or(0),
        today_success_rate: today_stats.as_ref().and_then(|s| s.success_rate.map(|r| r.to_string().parse().unwrap_or(0.0))).unwrap_or(0.0),
        today_avg_time: today_stats.as_ref().and_then(|s| s.avg_dispatch_time.map(|t| t as i64)).unwrap_or(0),
        active_riders: today_stats.as_ref().and_then(|s| s.active_riders.map(|r| r as i64)).unwrap_or(0),
        online_riders: 0, // TODO: 从缓存获取
        active_rules: active_rules as i64,
        today_triggered_rules: 0, // TODO: 统计今日触发规则次数
    };

    Json(ApiResponse::success(stats))
}

pub async fn trends(
    State(state): State<AppState>,
) -> Json<ApiResponse<DashboardTrends>> {
    let today = Local::now().date_naive();
    let seven_days_ago = today - chrono::Duration::days(7);

    let stats = DispatchStatistic::find()
        .filter(dispatch_statistics::Column::StatDate.gte(seven_days_ago))
        .filter(dispatch_statistics::Column::StatDate.lte(today))
        .filter(dispatch_statistics::Column::StatHour.is_null())
        .order_by_asc(dispatch_statistics::Column::StatDate)
        .all(&state.db)
        .await
        .unwrap_or_default();

    let order_trend: Vec<TrendPoint> = stats.iter().map(|s| TrendPoint {
        time: s.stat_date.to_string(),
        value: s.total_orders as i64,
    }).collect();

    let dispatch_trend: Vec<TrendPoint> = stats.iter().map(|s| TrendPoint {
        time: s.stat_date.to_string(),
        value: s.dispatched_orders as i64,
    }).collect();

    let success_rate_trend: Vec<TrendPoint> = stats.iter().map(|s| TrendPoint {
        time: s.stat_date.to_string(),
        value: s.success_rate.map(|r| (r.to_string().parse::<f64>().unwrap_or(0.0) * 100.0) as i64).unwrap_or(0),
    }).collect();

    Json(ApiResponse::success(DashboardTrends {
        order_trend,
        dispatch_trend,
        success_rate_trend,
    }))
}

pub async fn rule_stats(
    State(_state): State<AppState>,
) -> Json<ApiResponse<Vec<RuleTriggerStat>>> {
    // TODO: 实现规则触发统计
    Json(ApiResponse::success(vec![
        RuleTriggerStat {
            rule_id: uuid::Uuid::new_v4(),
            rule_name: "距离优先".to_string(),
            trigger_count: 150,
            success_count: 142,
            success_rate: 94.7,
        },
        RuleTriggerStat {
            rule_id: uuid::Uuid::new_v4(),
            rule_name: "负载均衡".to_string(),
            trigger_count: 89,
            success_count: 85,
            success_rate: 95.5,
        },
    ]))
}

pub async fn rider_performance(
    State(_state): State<AppState>,
) -> Json<ApiResponse<Vec<RiderPerformance>>> {
    // TODO: 实现骑手绩效统计
    Json(ApiResponse::success(vec![
        RiderPerformance {
            rider_id: "R001".to_string(),
            rider_name: "张三".to_string(),
            total_orders: 45,
            completed_orders: 43,
            completion_rate: 95.6,
            avg_delivery_time: 28,
            rating: 4.9,
        },
        RiderPerformance {
            rider_id: "R002".to_string(),
            rider_name: "李四".to_string(),
            total_orders: 38,
            completed_orders: 36,
            completion_rate: 94.7,
            avg_delivery_time: 32,
            rating: 4.8,
        },
    ]))
}

pub async fn heatmap(
    State(_state): State<AppState>,
) -> Json<ApiResponse<Vec<HeatmapData>>> {
    // TODO: 实现热力图数据
    Json(ApiResponse::success(vec![
        HeatmapData {
            region: "朝阳区".to_string(),
            lat: 39.92,
            lng: 116.44,
            order_count: 320,
            intensity: 0.85,
        },
        HeatmapData {
            region: "海淀区".to_string(),
            lat: 39.96,
            lng: 116.30,
            order_count: 280,
            intensity: 0.75,
        },
    ]))
}

pub async fn realtime(
    State(_state): State<AppState>,
) -> Json<ApiResponse<RealtimeData>> {
    // TODO: 实现实时数据
    Json(ApiResponse::success(RealtimeData {
        pending_orders: 12,
        dispatching_orders: 8,
        delivering_orders: 45,
        completed_today: 320,
        active_riders: 28,
        idle_riders: 15,
        offline_riders: 7,
    }))
}
