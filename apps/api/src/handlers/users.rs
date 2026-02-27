use axum::{extract::{Path, State}, Json};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::AppState;
use crate::models::{ApiResponse, CreateUserRequest, PaginatedResponse, UpdateUserRequest};
use crate::services::auth_service::AuthService;
use entity::users::{self, Entity as User};
use entity::roles::{self, Entity as Role};

#[derive(Debug, serde::Serialize)]
pub struct UserListItem {
    pub id: String,
    pub username: String,
    pub email: String,
    pub real_name: Option<String>,
    pub phone: Option<String>,
    pub avatar_url: Option<String>,
    pub role_id: Option<String>,
    pub role_name: Option<String>,
    pub status: i32,
    pub last_login_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
}

pub async fn list(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<ListUsersQuery>,
) -> Json<ApiResponse<PaginatedResponse<UserListItem>>> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = User::find();

    // 关键字搜索
    if let Some(keyword) = query.keyword {
        let keyword = format!("%{}%", keyword);
        select = select.filter(
            sea_orm::Condition::any()
                .add(users::Column::Username.like(&keyword))
                .add(users::Column::RealName.like(&keyword))
                .add(users::Column::Email.like(&keyword))
        );
    }

    let total = match select.clone().count(&state.db).await {
        Ok(t) => t,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let users = match select
        .order_by_desc(users::Column::CreatedAt)
        .paginate(&state.db, page_size)
        .fetch_page(page - 1)
        .await
    {
        Ok(u) => u,
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 获取角色信息
    let role_ids: Vec<String> = users.iter().filter_map(|u| u.role_id.clone()).collect();
    let roles = if !role_ids.is_empty() {
        Role::find()
            .filter(roles::Column::Id.is_in(role_ids))
            .all(&state.db)
            .await
            .unwrap_or_default()
            .into_iter()
            .map(|r| (r.id, r.name))
            .collect::<std::collections::HashMap<_, _>>()
    } else {
        std::collections::HashMap::new()
    };

    let list: Vec<UserListItem> = users.into_iter().map(|u| UserListItem {
        id: u.id,
        username: u.username,
        email: u.email,
        real_name: u.real_name,
        phone: u.phone,
        avatar_url: u.avatar_url,
        role_id: u.role_id.clone(),
        role_name: u.role_id.clone().and_then(|id| roles.get(&id).cloned()),
        status: u.status,
        last_login_at: u.last_login_at.map(|t| t.to_string()),
        created_at: u.created_at.to_string(),
    }).collect();

    Json(ApiResponse::success(PaginatedResponse::new(list, total, page, page_size)))
}

pub async fn detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<ApiResponse<UserListItem>> {
    let user = match User::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(u)) => u,
        Ok(None) => return Json(ApiResponse::error(404, "用户不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 获取角色名
    let role_name = if let Some(role_id) = user.role_id.clone() {
        Role::find_by_id(role_id.clone())
            .one(&state.db)
            .await
            .ok()
            .flatten()
            .map(|r| r.name)
    } else {
        None
    };

    let item = UserListItem {
        id: user.id,
        username: user.username,
        email: user.email,
        real_name: user.real_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role_id: user.role_id.clone(),
        role_name,
        status: user.status,
        last_login_at: user.last_login_at.map(|t| t.to_string()),
        created_at: user.created_at.to_string(),
    };

    Json(ApiResponse::success(item))
}

pub async fn create(
    State(state): State<AppState>,
    Json(req): Json<CreateUserRequest>,
) -> Json<ApiResponse<UserListItem>> {
    // 检查用户名是否已存在
    let exists = User::find()
        .filter(users::Column::Username.eq(&req.username))
        .one(&state.db)
        .await;
    
    if let Ok(Some(_)) = exists {
        return Json(ApiResponse::error(400, "用户名已存在"));
    }

    // 检查邮箱是否已存在
    let exists = User::find()
        .filter(users::Column::Email.eq(&req.email))
        .one(&state.db)
        .await;
    
    if let Ok(Some(_)) = exists {
        return Json(ApiResponse::error(400, "邮箱已存在"));
    }

    // 密码加密
    let password_hash = match AuthService::hash_password(&req.password) {
        Ok(h) => h,
        Err(e) => return Json(ApiResponse::error(500, format!("密码加密失败: {}", e))),
    };

    let now = Utc::now();
    let user = users::ActiveModel {
        id: Set(uuid::Uuid::new_v4().to_string()),
        username: Set(req.username),
        email: Set(req.email),
        password_hash: Set(password_hash),
        real_name: Set(req.real_name),
        phone: Set(req.phone),
        avatar_url: Set(None),
        role_id: Set(req.role_id),
        status: Set(1),
        last_login_at: Set(None),
        created_at: Set(now.into()),
        updated_at: Set(now.into()),
    };

    match user.insert(&state.db).await {
        Ok(u) => {
            let item = UserListItem {
                id: u.id,
                username: u.username,
                email: u.email,
                real_name: u.real_name,
                phone: u.phone,
                avatar_url: u.avatar_url,
                role_id: u.role_id.clone(),
                role_name: None,
                status: u.status,
                last_login_at: None,
                created_at: u.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("创建失败: {}", e))),
    }
}

pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateUserRequest>,
) -> Json<ApiResponse<UserListItem>> {
    let user = match User::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(u)) => u,
        Ok(None) => return Json(ApiResponse::error(404, "用户不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let mut active: users::ActiveModel = user.into();
    let now = Utc::now();

    if let Some(email) = req.email {
        active.email = Set(email);
    }
    if let Some(real_name) = req.real_name {
        active.real_name = Set(Some(real_name));
    }
    if let Some(phone) = req.phone {
        active.phone = Set(Some(phone));
    }
    if let Some(avatar_url) = req.avatar_url {
        active.avatar_url = Set(Some(avatar_url));
    }
    if let Some(role_id) = req.role_id {
        active.role_id = Set(Some(role_id));
    }
    if let Some(status) = req.status {
        active.status = Set(status);
    }
    active.updated_at = Set(now.into());

    match active.update(&state.db).await {
        Ok(u) => {
            let item = UserListItem {
                id: u.id,
                username: u.username,
                email: u.email,
                real_name: u.real_name,
                phone: u.phone,
                avatar_url: u.avatar_url,
                role_id: u.role_id.clone(),
                role_name: None,
                status: u.status,
                last_login_at: u.last_login_at.map(|t| t.to_string()),
                created_at: u.created_at.to_string(),
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
    // 检查用户是否存在
    let user = match User::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(_)) => (),
        Ok(None) => return Json(ApiResponse::error(404, "用户不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    // 软删除：将状态改为禁用
    let result = User::delete_by_id(id).exec(&state.db).await;
    
    match result {
        Ok(_) => Json(ApiResponse::success(())),
        Err(e) => Json(ApiResponse::error(500, format!("删除失败: {}", e))),
    }
}

pub async fn update_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<serde_json::Value>,
) -> Json<ApiResponse<UserListItem>> {
    let status = req.get("status").and_then(|v| v.as_i64()).unwrap_or(1) as i32;

    let user = match User::find_by_id(id.clone()).one(&state.db).await {
        Ok(Some(u)) => u,
        Ok(None) => return Json(ApiResponse::error(404, "用户不存在")),
        Err(e) => return Json(ApiResponse::error(500, format!("查询失败: {}", e))),
    };

    let mut active: users::ActiveModel = user.into();
    active.status = Set(status);
    active.updated_at = Set(Utc::now().into());

    match active.update(&state.db).await {
        Ok(u) => {
            let item = UserListItem {
                id: u.id,
                username: u.username,
                email: u.email,
                real_name: u.real_name,
                phone: u.phone,
                avatar_url: u.avatar_url,
                role_id: u.role_id.clone(),
                role_name: None,
                status: u.status,
                last_login_at: u.last_login_at.map(|t| t.to_string()),
                created_at: u.created_at.to_string(),
            };
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(500, format!("更新失败: {}", e))),
    }
}
