# 本地开发快速指南

## 一键启动/停止

### 启动所有服务
```bash
./scripts/start-local.sh
```

这将自动：
1. 检查 Node.js 和 Docker 依赖
2. 启动 PostgreSQL 和 Redis (如果未运行)
3. 执行数据库迁移 (如果需要)
4. 启动后端服务 (http://localhost:3001)
5. 启动前端服务 (http://localhost:3000)

### 停止所有服务
```bash
./scripts/stop-local.sh
```

### 只启动后端
```bash
./scripts/start-local.sh backend
```

### 只启动前端
```bash
./scripts/start-local.sh frontend
```

### 强制清理残留进程
```bash
./scripts/stop-local.sh force
```

---

## 手动启动（传统方式）

### 1. 启动基础设施
```bash
docker-compose up -d
```

### 2. 启动后端
```bash
cd apps/api
npm run dev
```

### 3. 启动前端（新终端）
```bash
cd apps/web
npm run dev
```

---

## 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端页面 | http://localhost:3000 | React + Ant Design |
| 后端 API | http://localhost:3001/api/v1 | NestJS |
| 登录接口 | http://localhost:3001/api/v1/auth/login | POST 用户名/密码 |

### 预置账号
- **用户名**: `admin`
- **密码**: `admin123`

---

## 日志查看

启动脚本会将日志输出到 `logs/` 目录：

```bash
# 查看后端日志
tail -f logs/backend.log

# 查看前端日志
tail -f logs/frontend.log
```

---

## 测试

### 前端测试
```bash
cd apps/web
npm run test
```

### 后端单元测试
```bash
cd apps/api
npm run test:unit
```

---

## 常见问题

### 端口被占用
```bash
# 查找占用 3000/3001 的进程
lsof -i:3000
lsof -i:3001

# 强制停止
./scripts/stop-local.sh force
```

### 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 重启数据库
docker-compose restart postgres
```

### 依赖未安装
```bash
# 安装所有依赖
npm install

# 生成 Prisma Client
cd apps/api && npx prisma generate
```

---

## 脚本说明

| 脚本 | 用途 |
|------|------|
| `scripts/start-local.sh` | 启动本地开发环境 |
| `scripts/stop-local.sh` | 停止本地开发环境 |
| `scripts/setup-github-secrets.sh` | 设置 GitHub Secrets |
