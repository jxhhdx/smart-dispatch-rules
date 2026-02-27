use axum::{extract::State, Json};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};

use crate::AppState;
use crate::models::{ApiResponse, LoginRequest, LoginResponse, UserInfo};
use crate::services::auth_service::AuthService;
use entity::users::{self, Entity as User};
use entity::login_logs::{self, Entity as LoginLog};

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Json<ApiResponse<LoginResponse>> {
    // 查找用户
    let user = User::find()
        .filter(users::Column::Username.eq(&req.username))
        .one(&state.db)
        .await;

    match user {
        Ok(Some(user)) => {
            // 验证密码
            match AuthService::verify_password(&req.password, &user.password_hash) {
                Ok(true) => {
                    // 检查用户状态
                    if user.status != 1 {
                        // 记录登录失败日志
                        let log = login_logs::ActiveModel {
                            id: Set(uuid::Uuid::new_v4().to_string()),
                            user_id: Set(Some(user.id.clone())),
                            username: Set(Some(user.username.clone())),
                            login_type: Set("password".to_string()),
                            ip_address: Set(None),
                            user_agent: Set(None),
                            status: Set(0),
                            fail_reason: Set(Some("用户已被禁用".to_string())),
                            created_at: Set(Utc::now().into()),
                        };
                        let _ = log.insert(&state.db).await;
                        
                        return Json(ApiResponse::error(403, "用户已被禁用"));
                    }

                    // 生成 JWT Token
                    let token = match AuthService::generate_token(&user) {
                        Ok(t) => t,
                        Err(e) => return Json(ApiResponse::error(500, format!("Token生成失败: {}", e))),
                    };

                    // 更新最后登录时间
                    let mut user_active: users::ActiveModel = user.clone().into();
                    user_active.last_login_at = Set(Some(Utc::now().into()));
                    let _ = user_active.update(&state.db).await;

                    // 记录登录成功日志
                    let log = login_logs::ActiveModel {
                        id: Set(uuid::Uuid::new_v4().to_string()),
                        user_id: Set(Some(user.id.clone())),
                        username: Set(Some(user.username.clone())),
                        login_type: Set("password".to_string()),
                        ip_address: Set(None),
                        user_agent: Set(None),
                        status: Set(1),
                        fail_reason: Set(None),
                        created_at: Set(Utc::now().into()),
                    };
                    let _ = log.insert(&state.db).await;

                    // 获取用户权限
                    let permissions = vec![]; // TODO: 从数据库获取权限

                    let response = LoginResponse {
                        token,
                        user: AuthService::to_user_info(user.clone(), permissions),
                    };

                    Json(ApiResponse::success(response))
                }
                Ok(false) => {
                    // 记录登录失败日志
                    let log = login_logs::ActiveModel {
                        id: Set(uuid::Uuid::new_v4().to_string()),
                        user_id: Set(Some(user.id.clone())),
                        username: Set(Some(user.username.clone())),
                        login_type: Set("password".to_string()),
                        ip_address: Set(None),
                        user_agent: Set(None),
                        status: Set(0),
                        fail_reason: Set(Some("密码错误".to_string())),
                        created_at: Set(Utc::now().into()),
                    };
                    let _ = log.insert(&state.db).await;

                    Json(ApiResponse::error(401, "用户名或密码错误"))
                }
                Err(e) => Json(ApiResponse::error(500, format!("密码验证失败: {}", e))),
            }
        }
        Ok(None) => {
            // 记录登录失败日志
            let log = login_logs::ActiveModel {
                id: Set(uuid::Uuid::new_v4().to_string()),
                user_id: Set(None),
                username: Set(Some(req.username)),
                login_type: Set("password".to_string()),
                ip_address: Set(None),
                user_agent: Set(None),
                status: Set(0),
                fail_reason: Set(Some("用户不存在".to_string())),
                created_at: Set(Utc::now().into()),
            };
            let _ = log.insert(&state.db).await;

            Json(ApiResponse::error(401, "用户名或密码错误"))
        }
        Err(e) => Json(ApiResponse::error(500, format!("数据库错误: {}", e))),
    }
}

pub async fn logout(
    State(_state): State<AppState>,
) -> Json<ApiResponse<()>> {
    // JWT 是无状态的，客户端只需删除 token
    // 这里可以选择将 token 加入黑名单（如果需要）
    Json(ApiResponse::success(()))
}

pub async fn profile(
    State(state): State<AppState>,
) -> Json<ApiResponse<UserInfo>> {
    // TODO: 从请求上下文获取当前用户
    // 暂时返回空数据
    Json(ApiResponse::error(501, "未实现"))
}

pub async fn refresh_token(
    State(state): State<AppState>,
) -> Json<ApiResponse<LoginResponse>> {
    // TODO: 从请求上下文获取当前用户并生成新 token
    Json(ApiResponse::error(501, "未实现"))
}
