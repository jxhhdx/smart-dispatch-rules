use axum::{extract::{Path, State}, Json};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set, TransactionTrait, ModelTrait};
use uuid::Uuid;
use std::collections::HashMap;

use crate::AppState;
use crate::models::{ApiResponse, CreateRuleRequest, CreateVersionRequest, PaginatedResponse, UpdateRuleRequest};
use entity::rules::{self, Entity as Rule};
use entity::rule_versions::{self, Entity as RuleVersion};
use entity::rule_conditions::{self, Entity as RuleCondition};
use entity::rule_actions::{self, Entity as RuleAction};
use entity::users::{self, Entity as User};

#[derive(Debug, serde::Serialize)]
pub struct RuleListItem {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub rule_type: String,
    pub business_type: Option<String>,
    pub priority: i32,
    pub status: i32,
    pub current_version: Option<i32>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, serde::Serialize)]
pub struct RuleVersionItem {
    pub id: String,
    pub rule_id: String,
    pub version: i32,
    pub description: Option<String>,
    pub status: i32,
    pub published_at: Option<String>,
    pub published_by: Option<String>,
    pub created_at: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct ListRulesQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
    pub status: Option<i32>,
}

pub async fn list(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<ListRulesQuery>,
) -> Json<ApiResponse<PaginatedResponse<RuleListItem>>> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = Rule::find();

    if let Some(keyword) = query.keyword {
        let keyword = format!("%{}%", keyword);
        select = select.filter(rules::Column::Name.like(&keyword));
    }

    if let Some(status) = query.status {
        select = select.filter(rules::Column::Status.eq(status));
    }

    let total = match select.clone().count(&state.db).await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let rules = match select
        .order_by_desc(rules::Column::CreatedAt)
        .paginate(&state.db, page_size)
        .fetch_page(page - 1)
        .await
    {
        Ok(r) => r,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 获取创建者信息
    let user_ids: Vec<String> = rules.iter().filter_map(|r| r.created_by.clone()).collect();
    let users = if !user_ids.is_empty() {
        User::find()
            .filter(users::Column::Id.is_in(user_ids))
            .all(&state.db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|u| (u.id, u.username))
            .collect::<HashMap<_, _>>()
    } else {
        HashMap::new()
    };

    let list: Vec<RuleListItem> = rules.into_iter().map(|r| RuleListItem {
        id: r.id.clone(),
        name: r.name,
        description: r.description,
        rule_type: r.rule_type,
        business_type: r.business_type,
        priority: r.priority,
        status: r.status,
        current_version: None, // TODO: 获取当前版本号
        created_by_name: r.created_by.and_then(|id| users.get(&id).cloned()),
        created_at: r.created_at.to_string(),
    }).collect();

    Json(ApiResponse::success(PaginatedResponse::new(list, total, page, page_size)))
}

pub async fn detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<serde_json::Value>> {
    let rule = match Rule::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "规则不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 获取版本列表
    let versions = RuleVersion::find()
        .filter(rule_versions::Column::RuleId.eq(id.clone()))
        .order_by_desc(rule_versions::Column::Version)
        .all(&state.db)
        .await
        .unwrap_or_default();

    Json(ApiResponse::success(serde_json::json!({
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "rule_type": rule.rule_type,
        "business_type": rule.business_type,
        "priority": rule.priority,
        "status": rule.status,
        "effective_time": rule.effective_time,
        "expire_time": rule.expire_time,
        "versions": versions.iter().map(|v| serde_json::json!({
            "id": v.id,
            "version": v.version,
            "description": v.description,
            "status": v.status,
            "published_at": v.published_at,
            "created_at": v.created_at.to_string(),
        })).collect::<Vec<_>>(),
        "created_at": rule.created_at.to_string(),
        "updated_at": rule.updated_at.to_string(),
    })))
}

pub async fn create(
    State(state): State<AppState>,
    Json(req): Json<CreateRuleRequest>,
) -> Json<ApiResponse<RuleListItem>> {
    let now = Utc::now();
    let rule = rules::ActiveModel {
        id: Set(uuid::Uuid::new_v4().to_string()),
        name: Set(req.name),
        description: Set(req.description),
        rule_type: Set(req.rule_type),
        business_type: Set(req.business_type),
        priority: Set(req.priority.unwrap_or(0)),
        status: Set(0), // 草稿状态
        version_id: Set(None),
        effective_time: Set(req.effective_time),
        expire_time: Set(req.expire_time),
        created_by: Set(None), // TODO: 从 JWT 获取当前用户
        updated_by: Set(None),
        created_at: Set(now.into()),
        updated_at: Set(now.into()),
    };

    match rule.insert(&state.db).await {
        Ok(r) => {
            let item = RuleListItem {
                id: r.id.clone(),
                name: r.name,
                description: r.description,
                rule_type: r.rule_type,
                business_type: r.business_type,
                priority: r.priority,
                status: r.status,
                current_version: None,
                created_by_name: None,
                created_at: r.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("创建失败: {}", e))),
    }
}

pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateRuleRequest>,
) -> Json<ApiResponse<RuleListItem>> {
    let rule = match Rule::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "规则不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let mut active: rules::ActiveModel = rule.into();
    let now = Utc::now();

    if let Some(name) = req.name {
        active.name = Set(name);
    }
    if let Some(description) = req.description {
        active.description = Set(Some(description));
    }
    if let Some(priority) = req.priority {
        active.priority = Set(priority);
    }
    if let Some(status) = req.status {
        active.status = Set(status);
    }
    if let Some(effective_time) = req.effective_time {
        active.effective_time = Set(Some(effective_time));
    }
    if let Some(expire_time) = req.expire_time {
        active.expire_time = Set(Some(expire_time));
    }
    active.updated_at = Set(now.into());

    match active.update(&state.db).await {
        Ok(r) => {
            let item = RuleListItem {
                id: r.id.clone(),
                name: r.name,
                description: r.description,
                rule_type: r.rule_type,
                business_type: r.business_type,
                priority: r.priority,
                status: r.status,
                current_version: None,
                created_by_name: None,
                created_at: r.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("更新失败: {}", e))),
    }
}

pub async fn delete(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<()>> {
    // 开启事务
    let txn = match state.db.begin().await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("事务开启失败: {}", e))),
    };

    // 删除规则相关的所有版本、条件、动作
    let versions = RuleVersion::find()
        .filter(rule_versions::Column::RuleId.eq(id.clone()))
        .all(&txn)
        .await
        .unwrap_or_default();

    for version in versions {
        let _ = RuleCondition::delete_many()
            .filter(rule_conditions::Column::RuleVersionId.eq(version.id.clone()))
            .exec(&txn)
            .await;
        let _ = RuleAction::delete_many()
            .filter(rule_actions::Column::RuleVersionId.eq(version.id.clone()))
            .exec(&txn)
            .await;
    }

    let _ = RuleVersion::delete_many()
        .filter(rule_versions::Column::RuleId.eq(id.clone()))
        .exec(&txn)
        .await;

    let result = Rule::delete_by_id(id).exec(&txn).await;

    match result {
        Ok(_) => {
            let _ = txn.commit().await;
            Json(ApiResponse::success(()))
        }
        Err(e) => {
            let _ = txn.rollback().await;
            Json(ApiResponse::error(500, format!("删除失败: {}", e)))
        }
    }
}

pub async fn update_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<serde_json::Value>,
) -> Json<ApiResponse<RuleListItem>> {
    let status = req.get("status").and_then(|v| v.as_i64()).unwrap_or(0) as i32;

    let rule = match Rule::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "规则不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let mut active: rules::ActiveModel = rule.into();
    active.status = Set(status);
    active.updated_at = Set(Utc::now().into());

    match active.update(&state.db).await {
        Ok(r) => {
            let item = RuleListItem {
                id: r.id.clone(),
                name: r.name,
                description: r.description,
                rule_type: r.rule_type,
                business_type: r.business_type,
                priority: r.priority,
                status: r.status,
                current_version: None,
                created_by_name: None,
                created_at: r.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("更新失败: {}", e))),
    }
}

async fn create_conditions_recursive(
    db: &sea_orm::DatabaseTransaction,
    version_id: String,
    conditions: Vec<crate::models::CreateConditionRequest>,
    parent_id: Option<String>,
) -> Result<(), sea_orm::DbErr> {
    for (idx, cond) in conditions.into_iter().enumerate() {
        let cond_id = uuid::Uuid::new_v4().to_string();
        let condition = rule_conditions::ActiveModel {
            id: Set(cond_id.clone()),
            rule_version_id: Set(version_id.clone()),
            parent_id: Set(parent_id.clone()),
            condition_type: Set(cond.condition_type),
            field: Set(cond.field),
            operator: Set(cond.operator),
            value: Set(cond.value),
            value_type: Set(cond.value_type.unwrap_or_else(|| "string".to_string())),
            logic_type: Set(cond.logic_type.unwrap_or_else(|| "AND".to_string())),
            sort_order: Set(cond.sort_order.unwrap_or(idx as i32)),
            created_at: Set(Utc::now().into()),
        };
        condition.insert(db).await?;

        // 递归创建子条件
        if !cond.children.is_empty() {
            Box::pin(create_conditions_recursive(db, version_id.clone(), cond.children, Some(cond_id.clone()))).await?;
        }
    }
    Ok(())
}

pub async fn list_versions(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<Vec<RuleVersionItem>>> {
    let versions = match RuleVersion::find()
        .filter(rule_versions::Column::RuleId.eq(id.clone()))
        .order_by_desc(rule_versions::Column::Version)
        .all(&state.db)
        .await
    {
        Ok(v) => v,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let list: Vec<RuleVersionItem> = versions.into_iter().map(|v| RuleVersionItem {
        id: v.id,
        rule_id: v.rule_id,
        version: v.version,
        description: v.description,
        status: v.status,
        published_at: v.published_at.map(|t| t.to_string()),
        published_by: None, // TODO: 获取发布者名称
        created_at: v.created_at.to_string(),
    }).collect();

    Json(ApiResponse::success(list))
}

pub async fn create_version(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<CreateVersionRequest>,
) -> Json<ApiResponse<serde_json::Value>> {
    // 获取当前最大版本号
    let max_version = RuleVersion::find()
        .filter(rule_versions::Column::RuleId.eq(id.clone()))
        .order_by_desc(rule_versions::Column::Version)
        .one(&state.db)
        .await
        .ok()
        .flatten()
        .map(|v| v.version)
        .unwrap_or(0);

    let txn = match state.db.begin().await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("事务开启失败: {}", e))),
    };

    let version_id = uuid::Uuid::new_v4().to_string();
    let version = rule_versions::ActiveModel {
        id: Set(version_id.clone()),
        rule_id: Set(id.to_string()),
        version: Set(max_version + 1),
        config_json: Set(req.config_json),
        description: Set(req.description),
        status: Set(0), // 草稿状态
        published_at: Set(None),
        published_by: Set(None),
        created_by: Set(None),
        created_at: Set(Utc::now().into()),
    };

    if let Err(e) = version.insert(&txn).await {
        let _ = txn.rollback().await;
        return Json(ApiResponse::error(500, format!("创建版本失败: {}", e)));
    }

    // 创建条件
    if let Err(e) = create_conditions_recursive(&txn, version_id.to_string(), req.conditions, None).await {
        let _ = txn.rollback().await;
        return Json(ApiResponse::error(500, format!("创建条件失败: {}", e)));
    }

    // 创建动作
    for (idx, action) in req.actions.into_iter().enumerate() {
        let action_model = rule_actions::ActiveModel {
            id: Set(uuid::Uuid::new_v4().to_string()),
            rule_version_id: Set(version_id.to_string()),
            action_type: Set(action.action_type),
            config_json: Set(action.config_json),
            sort_order: Set(action.sort_order.unwrap_or(idx as i32)),
            created_at: Set(Utc::now().into()),
        };
        if let Err(e) = action_model.insert(&txn).await {
            let _ = txn.rollback().await;
            return Json(ApiResponse::error(500, format!("创建动作失败: {}", e)));
        }
    }

    match txn.commit().await {
        Ok(_) => Json(ApiResponse::success(serde_json::json!({
            "id": version_id,
            "version": max_version + 1,
        }))),
        Err(e) => Json(ApiResponse::error(500, format!("提交失败: {}", e))),
    }
}

pub async fn publish_version(
    State(state): State<AppState>,
    Path((rule_id, version_id)): Path<(String, String)>,
) -> Json<ApiResponse<()>> {
    let txn = match state.db.begin().await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("事务开启失败: {}", e))),
    };

    // 将其他版本设为未发布
    let _ = RuleVersion::update_many()
        .filter(rule_versions::Column::RuleId.eq(rule_id.clone()))
        .set(rule_versions::ActiveModel {
            status: Set(0),
            ..Default::default()
        })
        .exec(&txn)
        .await;

    // 发布指定版本
    let result = RuleVersion::update_many()
        .filter(rule_versions::Column::Id.eq(version_id.clone()))
        .set(rule_versions::ActiveModel {
            status: Set(1),
            published_at: Set(Some(Utc::now().into())),
            published_by: Set(None), // TODO: 从 JWT 获取
            ..Default::default()
        })
        .exec(&txn)
        .await;

    match result {
        Ok(_) => {
            // 更新规则的当前版本
            let _ = Rule::update_many()
                .filter(rules::Column::Id.eq(rule_id))
                .set(rules::ActiveModel {
                    version_id: Set(Some(version_id)),
                    status: Set(1), // 启用规则
                    ..Default::default()
                })
                .exec(&txn)
                .await;

            let _ = txn.commit().await;
            Json(ApiResponse::success(()))
        }
        Err(e) => {
            let _ = txn.rollback().await;
            Json(ApiResponse::error(500, format!("发布失败: {}", e)))
        }
    }
}

pub async fn rollback_version(
    State(state): State<AppState>,
    Path((rule_id, version_id)): Path<(String, String)>,
) -> Json<ApiResponse<()>> {
    publish_version(State(state), Path((rule_id, version_id))).await
}

pub async fn clone_rule(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<RuleListItem>> {
    let rule = match Rule::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "规则不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let now = Utc::now();
    let new_rule = rules::ActiveModel {
        id: Set(uuid::Uuid::new_v4().to_string()),
        name: Set(format!("{} (复制)", rule.name)),
        description: Set(rule.description),
        rule_type: Set(rule.rule_type),
        business_type: Set(rule.business_type),
        priority: Set(rule.priority),
        status: Set(0),
        version_id: Set(None),
        effective_time: Set(rule.effective_time),
        expire_time: Set(rule.expire_time),
        created_by: Set(None),
        updated_by: Set(None),
        created_at: Set(now.into()),
        updated_at: Set(now.into()),
    };

    match new_rule.insert(&state.db).await {
        Ok(r) => {
            let item = RuleListItem {
                id: r.id.clone(),
                name: r.name,
                description: r.description,
                rule_type: r.rule_type,
                business_type: r.business_type,
                priority: r.priority,
                status: r.status,
                current_version: None,
                created_by_name: None,
                created_at: r.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("复制失败: {}", e))),
    }
}

pub async fn export_rule(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<serde_json::Value>> {
    let rule = match Rule::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "规则不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 获取版本详情
    let versions = RuleVersion::find()
        .filter(rule_versions::Column::RuleId.eq(id.clone()))
        .all(&state.db)
        .await
        .unwrap_or_default();

    Json(ApiResponse::success(serde_json::json!({
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "rule_type": rule.rule_type,
        "versions": versions,
    })))
}

pub async fn export_all_rules(
    State(state): State<AppState>,
) -> Json<ApiResponse<Vec<serde_json::Value>>> {
    let rules = match Rule::find().all(&state.db).await {
        Ok(r) => r,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let result: Vec<serde_json::Value> = rules.into_iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "rule_type": r.rule_type,
        })
    }).collect();

    Json(ApiResponse::success(result))
}

pub async fn simulate(
    State(_state): State<AppState>,
    Json(_req): Json<serde_json::Value>,
) -> Json<ApiResponse<serde_json::Value>> {
    // TODO: 实现规则模拟执行
    Json(ApiResponse::success(serde_json::json!({
        "success": true,
        "matched_rules": [],
        "actions": [],
    })))
}
