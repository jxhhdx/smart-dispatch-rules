use axum::{extract::{Path, State}, Json};
use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::AppState;
use crate::models::{ApiResponse, PaginatedResponse};
use entity::condition_templates::{self, Entity as ConditionTemplate};

#[derive(Debug, serde::Serialize)]
pub struct TemplateResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub conditions: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub conditions: serde_json::Value,
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateTemplateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub conditions: Option<serde_json::Value>,
}

pub async fn list(
    State(state): State<AppState>,
) -> Json<ApiResponse<Vec<TemplateResponse>>> {
    let templates = ConditionTemplate::find()
        .filter(condition_templates::Column::Status.eq(1))
        .order_by_desc(condition_templates::Column::CreatedAt)
        .all(&state.db)
        .await;

    match templates {
        Ok(items) => {
            let list: Vec<TemplateResponse> = items.into_iter().map(|t| TemplateResponse {
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                conditions: t.conditions,
                created_at: t.created_at.to_string(),
            }).collect();
            Json(ApiResponse::success(list))
        }
        Err(e) => Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    }
}

pub async fn detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<TemplateResponse>> {
    let template = ConditionTemplate::find_by_id(id)
        .one(&state.db)
        .await;

    match template {
        Ok(Some(t)) => {
            let resp = TemplateResponse {
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                conditions: t.conditions,
                created_at: t.created_at.to_string(),
            };
            Json(ApiResponse::success(resp))
        }
        Ok(None) => Json(ApiResponse::error(404, "模板不存在")),
        Err(e) => Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    }
}

pub async fn create(
    State(state): State<AppState>,
    Json(req): Json<CreateTemplateRequest>,
) -> Json<ApiResponse<TemplateResponse>> {
    let now = chrono::Utc::now();
    let template = condition_templates::ActiveModel {
        id: Set(uuid::Uuid::new_v4().to_string()),
        name: Set(req.name),
        description: Set(req.description),
        category: Set(req.category.unwrap_or_else(|| "custom".to_string())),
        conditions: Set(req.conditions),
        created_by: Set(None),
        updated_by: Set(None),
        created_at: Set(now.into()),
        updated_at: Set(now.into()),
    };

    match template.insert(&state.db).await {
        Ok(t) => {
            let resp = TemplateResponse {
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                conditions: t.conditions,
                created_at: t.created_at.to_string(),
            };
            Json(ApiResponse::success(resp))
        }
        Err(e) => Json(ApiResponse::error(500, format!("创建失败: {}", e))),
    }
}

pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateTemplateRequest>,
) -> Json<ApiResponse<TemplateResponse>> {
    let template = ConditionTemplate::find_by_id(id)
        .one(&state.db)
        .await;

    match template {
        Ok(Some(t)) => {
            let mut active: condition_templates::ActiveModel = t.into();
            let now = chrono::Utc::now();
            
            if let Some(name) = req.name {
                active.name = Set(name);
            }
            if let Some(desc) = req.description {
                active.description = Set(Some(desc));
            }
            if let Some(conditions) = req.conditions {
                active.conditions = Set(conditions);
            }
            active.updated_at = Set(now.into());

            match active.update(&state.db).await {
                Ok(t) => {
                    let resp = TemplateResponse {
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        category: t.category,
                        conditions: t.conditions,
                        created_at: t.created_at.to_string(),
                    };
                    Json(ApiResponse::success(resp))
                }
                Err(e) => Json(ApiResponse::error(500, format!("更新失败: {}", e))),
            }
        }
        Ok(None) => Json(ApiResponse::error(404, "模板不存在")),
        Err(e) => Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    }
}

pub async fn delete(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<()>> {
    let result = ConditionTemplate::delete_by_id(id)
        .exec(&state.db)
        .await;

    match result {
        Ok(_) => Json(ApiResponse::success(())),
        Err(e) => Json(ApiResponse::error(500, format!("删除失败: {}", e))),
    }
}
