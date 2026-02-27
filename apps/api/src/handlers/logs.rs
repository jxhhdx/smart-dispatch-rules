use axum::{extract::{Query, State}, Json};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder};
use chrono::{DateTime, Utc};

use crate::AppState;
use crate::models::{ApiResponse, PaginatedResponse};
use entity::system_logs::{self, Entity as SystemLog};
use entity::login_logs::{self, Entity as LoginLog};

#[derive(Debug, serde::Serialize)]
pub struct SystemLogItem {
    pub id: String,
    pub username: Option<String>,
    pub action: String,
    pub module: String,
    pub description: Option<String>,
    pub ip_address: Option<String>,
    pub duration_ms: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, serde::Serialize)]
pub struct LoginLogItem {
    pub id: String,
    pub username: Option<String>,
    pub login_type: String,
    pub ip_address: Option<String>,
    pub status: i32,
    pub fail_reason: Option<String>,
    pub created_at: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct LogQueryParams {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub username: Option<String>,
    pub module: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
}

pub async fn list_system_logs(
    State(state): State<AppState>,
    Query(query): Query<LogQueryParams>,
) -> Json<ApiResponse<PaginatedResponse<SystemLogItem>>> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = SystemLog::find();

    if let Some(username) = query.username {
        select = select.filter(system_logs::Column::Username.eq(username));
    }

    if let Some(module) = query.module {
        select = select.filter(system_logs::Column::Module.eq(module));
    }

    if let Some(start_time) = query.start_time {
        select = select.filter(system_logs::Column::CreatedAt.gte(start_time));
    }

    if let Some(end_time) = query.end_time {
        select = select.filter(system_logs::Column::CreatedAt.lte(end_time));
    }

    let total = match select.clone().count(&state.db).await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let logs = match select
        .order_by_desc(system_logs::Column::CreatedAt)
        .paginate(&state.db, page_size)
        .fetch_page(page - 1)
        .await
    {
        Ok(l) => l,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let list: Vec<SystemLogItem> = logs.into_iter().map(|l| SystemLogItem {
        id: l.id.to_string(),
        username: l.username,
        action: l.action,
        module: l.module,
        description: l.description,
        ip_address: l.ip_address,
        duration_ms: l.duration_ms,
        created_at: l.created_at.to_string(),
    }).collect();

    Json(ApiResponse::success(PaginatedResponse::new(list, total, page, page_size)))
}

pub async fn list_login_logs(
    State(state): State<AppState>,
    Query(query): Query<LogQueryParams>,
) -> Json<ApiResponse<PaginatedResponse<LoginLogItem>>> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = LoginLog::find();

    if let Some(username) = query.username {
        select = select.filter(login_logs::Column::Username.eq(username));
    }

    if let Some(start_time) = query.start_time {
        select = select.filter(login_logs::Column::CreatedAt.gte(start_time));
    }

    if let Some(end_time) = query.end_time {
        select = select.filter(login_logs::Column::CreatedAt.lte(end_time));
    }

    let total = match select.clone().count(&state.db).await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let logs = match select
        .order_by_desc(login_logs::Column::CreatedAt)
        .paginate(&state.db, page_size)
        .fetch_page(page - 1)
        .await
    {
        Ok(l) => l,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let list: Vec<LoginLogItem> = logs.into_iter().map(|l| LoginLogItem {
        id: l.id.to_string(),
        username: l.username,
        login_type: l.login_type,
        ip_address: l.ip_address,
        status: l.status,
        fail_reason: l.fail_reason,
        created_at: l.created_at.to_string(),
    }).collect();

    Json(ApiResponse::success(PaginatedResponse::new(list, total, page, page_size)))
}
