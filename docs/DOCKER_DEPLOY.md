# Docker 本地部署指南

本文档介绍如何使用 Docker 在本地部署 Smart Dispatch Rules 前后端服务。

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存

## 快速开始

### 1. 启动服务

使用便捷脚本启动所有服务：

```bash
./scripts/docker-start.sh up
```

或者使用 Docker Compose 直接启动：

```bash
docker-compose up -d
```

### 2. 访问服务

服务启动后，可以通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost | React 前端应用 |
| 后端 API | http://localhost:3001/api/v1 | NestJS API |
| API 文档 | http://localhost:3001/api/docs | Swagger 文档 |

### 3. 登录系统

使用预置的管理员账号登录：

- **用户名**: `admin`
- **密码**: `admin123`

## 常用命令

### 脚本命令

```bash
# 查看所有可用命令
./scripts/docker-start.sh help

# 启动服务（后台）
./scripts/docker-start.sh up

# 启动服务（前台，查看日志）
./scripts/docker-start.sh up-log

# 停止服务
./scripts/docker-start.sh down

# 重启服务
./scripts/docker-start.sh restart

# 重新构建镜像
./scripts/docker-start.sh build

# 查看服务状态
./scripts/docker-start.sh status

# 查看日志
./scripts/docker-start.sh logs

# 重新执行数据库种子
./scripts/docker-start.sh seed

# 清理所有数据（谨慎使用）
./scripts/docker-start.sh clean
```

### Docker Compose 命令

```bash
# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api
docker-compose logs -f web

# 进入容器
docker-compose exec api sh
docker-compose exec postgres psql -U postgres -d smart_dispatch

# 重启单个服务
docker-compose restart api
```

## 服务架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│     Web     │──────▶     API     │──────▶  PostgreSQL │
│  (Nginx)    │      │  (NestJS)   │      │   (数据库)   │
│   :80       │      │   :3001     │      │    :5432    │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     │   (缓存)    │
                     │    :6379    │
                     └─────────────┘
```

## 配置说明

### 数据库配置

- **主机**: `postgres`
- **端口**: `5432`
- **数据库**: `smart_dispatch`
- **用户名**: `postgres`
- **密码**: `postgres123`

### Redis 配置

- **主机**: `redis`
- **端口**: `6379`

### JWT 配置

- **密钥**: `your-super-secret-jwt-key-change-this-in-production`
- **过期时间**: `7d`

## 数据持久化

数据通过 Docker Volumes 持久化：

- `postgres_data`: PostgreSQL 数据
- `redis_data`: Redis 数据

即使容器被删除，数据也会保留。

## 故障排除

### 服务启动失败

1. 检查端口是否被占用：
   ```bash
   lsof -i :80
   lsof -i :3001
   lsof -i :5432
   lsof -i :6379
   ```

2. 查看服务日志：
   ```bash
   docker-compose logs
   ```

### 数据库连接失败

确保 postgres 服务健康后再启动 api：

```bash
docker-compose ps
```

### 重置所有数据

```bash
./scripts/docker-start.sh clean
```

## 自定义配置

如需修改配置（如端口、密码等），请编辑 `docker-compose.yml` 文件。

## 生产环境部署

本文档仅适用于本地开发环境。生产环境部署请参考：

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 部署指南
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Render 平台部署
