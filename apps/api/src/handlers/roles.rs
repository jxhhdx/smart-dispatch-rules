use axum::{extract::{Path, State}, Json};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set, TransactionTrait};
use uuid::Uuid;

use crate::AppState;
use crate::models::{ApiResponse, CreateRoleRequest, PaginatedResponse, UpdateRoleRequest};
use entity::roles::{self, Entity as Role};
use entity::permissions::{self, Entity as Permission};
use entity::role_permissions::{self, Entity as RolePermission};

#[derive(Debug, serde::Serialize)]
pub struct RoleListItem {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub status: i32,
    pub user_count: i64,
    pub created_at: String,
}

#[derive(Debug, serde::Serialize)]
pub struct PermissionItem {
    pub id: Uuid,
    pub name: String,
    pub code: String,
    pub r#type: String,
    pub parent_id: Option<Uuid>,
    pub path: Option<String>,
    pub sort_order: i32,
    pub children: Vec<PermissionItem>,
}

#[derive(Debug, serde::Deserialize)]
pub struct ListRolesQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

pub async fn list(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<ListRolesQuery>,
) -> Json<ApiResponse<PaginatedResponse<RoleListItem>>> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let total = match Role::find().count(&state.db).await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let roles = match Role::find()
        .order_by_desc(roles::Column::CreatedAt)
        .paginate(&state.db, page_size)
        .fetch_page(page - 1)
        .await
    {
        Ok(r) => r,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let list: Vec<RoleListItem> = roles.into_iter().map(|r| RoleListItem {
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        status: r.status,
        user_count: 0, // TODO: 统计用户数量
        created_at: r.created_at.to_string(),
    }).collect();

    Json(ApiResponse::success(PaginatedResponse::new(list, total, page, page_size)))
}

pub async fn detail(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Json<ApiResponse<serde_json::Value>> {
    let role = match Role::find_by_id(id).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "角色不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 获取角色权限
    let permission_ids: Vec<Uuid> = RolePermission::find()
        .filter(role_permissions::Column::RoleId.eq(id))
        .all(&state.db)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|rp| rp.permission_id)
        .collect();

    let permissions = if !permission_ids.is_empty() {
        Permission::find()
            .filter(permissions::Column::Id.is_in(permission_ids))
            .all(&state.db)
            .await
            .unwrap_or_default()
    } else {
        vec![]
    };

    Json(ApiResponse::success(serde_json::json!({
        "id": role.id,
        "name": role.name,
        "code": role.code,
        "description": role.description,
        "status": role.status,
        "permissions": permissions,
        "created_at": role.created_at.to_string(),
        "updated_at": role.updated_at.to_string(),
    })))
}

pub async fn create(
    State(state): State<AppState>,
    Json(req): Json<CreateRoleRequest>,
) -> Json<ApiResponse<RoleListItem>> {
    // 检查角色编码是否已存在
    let exists = Role::find()
        .filter(roles::Column::Code.eq(&req.code))
        .one(&state.db)
        .await;
    
    if let Ok(Some(_)) = exists {
        return Json(ApiResponse::error(400, "角色编码已存在"));
    }

    let now = Utc::now();
    let role = roles::ActiveModel {
        id: Set(Uuid::new_v4()),
        name: Set(req.name),
        code: Set(req.code),
        description: Set(req.description),
        status: Set(1),
        created_at: Set(now.into()),
        updated_at: Set(now.into()),
    };

    match role.insert(&state.db).await {
        Ok(r) => {
            let item = RoleListItem {
                id: r.id,
                name: r.name,
                code: r.code,
                description: r.description,
                status: r.status,
                user_count: 0,
                created_at: r.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("创建失败: {}", e))),
    }
}

pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateRoleRequest>,
) -> Json<ApiResponse<RoleListItem>> {
    let role = match Role::find_by_id(id).one(&state.db).await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error(404, "角色不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let mut active: roles::ActiveModel = role.into();
    let now = Utc::now();

    if let Some(name) = req.name {
        active.name = Set(name);
    }
    if let Some(description) = req.description {
        active.description = Set(Some(description));
    }
    if let Some(status) = req.status {
        active.status = Set(status);
    }
    active.updated_at = Set(now.into());

    match active.update(&state.db).await {
        Ok(r) => {
            let item = RoleListItem {
                id: r.id,
                name: r.name,
                code: r.code,
                description: r.description,
                status: r.status,
                user_count: 0,
                created_at: r.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("更新失败: {}", e))),
    }
}

pub async fn delete(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Json<ApiResponse<()>> {
    // 检查角色是否存在
    let _ = match Role::find_by_id(id).one(&state.db).await {
        Ok(Some(_)) => (),
        Ok(None) => return Json(ApiResponse::error(404, "角色不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 开启事务
    let txn = match state.db.begin().await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("事务开启失败: {}", e))),
    };

    // 删除角色权限关联
    let _ = RolePermission::delete_many()
        .filter(role_permissions::Column::RoleId.eq(id))
        .exec(&txn)
        .await;

    // 删除角色
    let result = Role::delete_by_id(id).exec(&txn).await;

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

pub async fn update_permissions(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<serde_json::Value>,
) -> Json<ApiResponse<()>> {
    let permission_ids: Vec<Uuid> = req
        .get("permission_ids")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().and_then(|s| Uuid::parse_str(s).ok()))
                .collect()
        })
        .unwrap_or_default();

    // 开启事务
    let txn = match state.db.begin().await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("事务开启失败: {}", e))),
    };

    // 删除原有权限
    let _ = RolePermission::delete_many()
        .filter(role_permissions::Column::RoleId.eq(id))
        .exec(&txn)
        .await;

    // 添加新权限
    for perm_id in permission_ids {
        let rp = role_permissions::ActiveModel {
            role_id: Set(id),
            permission_id: Set(perm_id),
            created_at: Set(Utc::now().into()),
        };
        let _ = rp.insert(&txn).await;
    }

    match txn.commit().await {
        Ok(_) => Json(ApiResponse::success(())),
        Err(e) => Json(ApiResponse::error(500, format!("更新失败: {}", e))),
    }
}

fn build_permission_tree(permissions: Vec<permissions::Model>) -> Vec<PermissionItem> {
    let mut map: std::collections::HashMap<Uuid, PermissionItem> = permissions
        .into_iter()
        .map(|p| (
            p.id,
            PermissionItem {
                id: p.id,
                name: p.name,
                code: p.code,
                r#type: p.r#type,
                parent_id: p.parent_id,
                path: p.path,
                sort_order: p.sort_order,
                children: vec![],
            }
        ))
        .collect();

    let mut roots = vec![];
    let mut children: std::collections::HashMap<Option<Uuid>, Vec<Uuid>> = std::collections::HashMap::new();

    for (id, perm) in &map {
        children.entry(perm.parent_id).or_default().push(*id);
    }

    for (id, perm) in map.iter_mut() {
        if let Some(child_ids) = children.get(&Some(*id)) {
            for child_id in child_ids {
                if let Some(child) = map.get(child_id) {
                    perm.children.push(child.clone());
                }
            }
        }
        if perm.parent_id.is_none() {
            roots.push(perm.clone());
        }
    }

    // 排序
    roots.sort_by(|a, b| a.sort_order.cmp(&b.sort_order));
    for root in &mut roots {
        root.children.sort_by(|a, b| a.sort_order.cmp(&b.sort_order));
    }

    roots
}

pub async fn list_permissions(
    State(state): State<AppState>,
) -> Json<ApiResponse<Vec<PermissionItem>>> {
    let permissions = match Permission::find()
        .filter(permissions::Column::Status.eq(1))
        .order_by_asc(permissions::Column::SortOrder)
        .all(&state.db)
        .await
    {
        Ok(p) => p,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let tree = build_permission_tree(permissions);
    Json(ApiResponse::success(tree))
}
