# 快速开始

## 1. 安装依赖

```bash
npm install
```

## 2. 配置数据库

确保本地 PostgreSQL 已运行，然后创建数据库：

```bash
createdb smart_dispatch
```

编辑 `apps/api/.env`：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_dispatch?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
```

## 3. 数据库迁移

```bash
# 执行迁移
npm run db:migrate

# 初始化数据（创建默认管理员）
npm run db:seed
```

## 4. 启动开发服务器

```bash
# 同时启动前后端
npm run dev
```

或者分别启动：

```bash
# 后端 (http://localhost:3001)
cd apps/api && npm run dev

# 前端 (http://localhost:3000)
cd apps/web && npm run dev
```

## 5. 访问系统

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api/v1

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

## API 文档

### 认证
- `POST /api/v1/auth/login` - 登录
- `POST /api/v1/auth/logout` - 退出
- `GET /api/v1/auth/profile` - 获取当前用户信息

### 用户管理
- `GET /api/v1/users` - 用户列表
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### 角色管理
- `GET /api/v1/roles` - 角色列表
- `POST /api/v1/roles` - 创建角色
- `PUT /api/v1/roles/:id` - 更新角色
- `GET /api/v1/roles/permissions` - 权限列表

### 规则管理
- `GET /api/v1/rules` - 规则列表
- `POST /api/v1/rules` - 创建规则
- `PUT /api/v1/rules/:id` - 更新规则
- `GET /api/v1/rules/:id/versions` - 规则版本列表
- `POST /api/v1/rules/:id/versions/:versionId/publish` - 发布版本

### 日志
- `GET /api/v1/logs/operation` - 系统操作日志
- `GET /api/v1/logs/login` - 登录日志
