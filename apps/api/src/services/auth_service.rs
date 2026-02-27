use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

use crate::models::{User, UserInfo};

const JWT_EXPIRES_IN_DAYS: i64 = 7;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub role_id: Option<String>,
    pub exp: usize,
    pub iat: usize,
}

pub struct AuthService;

impl AuthService {
    /// 生成密码哈希
    pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
        hash(password, DEFAULT_COST)
    }

    /// 验证密码
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, bcrypt::BcryptError> {
        verify(password, hash)
    }

    /// 生成 JWT Token
    pub fn generate_token(user: &User) -> Result<String, jsonwebtoken::errors::Error> {
        let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        let now = Utc::now();
        let exp = now + Duration::days(JWT_EXPIRES_IN_DAYS);

        let claims = Claims {
            sub: user.id.to_string(),
            username: user.username.clone(),
            role_id: user.role_id.map(|r| r.to_string()),
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
    }

    /// 验证 JWT Token
    pub fn verify_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )?;
        Ok(token_data.claims)
    }

    /// 转换为用户信息
    pub fn to_user_info(user: User, permissions: Vec<String>) -> UserInfo {
        UserInfo {
            id: user.id,
            username: user.username,
            email: user.email,
            real_name: user.real_name,
            phone: user.phone,
            avatar_url: user.avatar_url,
            role_id: user.role_id,
            role_name: None, // TODO: 从 role_id 查询
            status: user.status,
            permissions,
        }
    }
}
