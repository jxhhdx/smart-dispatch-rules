use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

use crate::models::{CreateUserRequest, UpdateUserRequest, User};
use crate::services::auth_service::AuthService;

pub struct UserService;

impl UserService {
    /// 创建用户
    pub async fn create_user(
        db: &DatabaseConnection,
        req: CreateUserRequest,
    ) -> Result<User, Box<dyn std::error::Error>> {
        let password_hash = AuthService::hash_password(&req.password)?;
        
        // TODO: 使用 Sea-ORM Entity 创建用户
        // let user = user::ActiveModel {
        //     id: Set(uuid::Uuid::new_v4().to_string()),
        //     username: Set(req.username),
        //     email: Set(req.email),
        //     password_hash: Set(password_hash),
        //     real_name: Set(req.real_name),
        //     phone: Set(req.phone),
        //     role_id: Set(req.role_id),
        //     status: Set(1),
        //     ..Default::default()
        // };
        // let user = user.insert(db).await?;
        
        todo!("Implement create_user")
    }

    /// 验证用户密码
    pub async fn validate_user(
        db: &DatabaseConnection,
        username: &str,
        password: &str,
    ) -> Result<Option<User>, Box<dyn std::error::Error>> {
        // TODO: 查询用户并验证密码
        todo!("Implement validate_user")
    }
}
