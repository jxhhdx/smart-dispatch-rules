# 🚀 Render 部署指南

> Render 提供稳定、免费的 Node.js 和 PostgreSQL 托管服务，适合客户演示环境。

---

## 📋 准备工作

### 1. 创建 Render 账号
1. 访问 https://dashboard.render.com
2. 使用 GitHub 账号登录
3. 授权访问你的仓库 `jxhhdx/smart-dispatch-rules`

---

## 🚀 部署步骤

### 方式一：使用 Blueprint (推荐)

#### Step 1: 创建 Blueprint
1. 在 Render Dashboard 点击 **New +**
2. 选择 **Blueprint**
3. 选择你的 GitHub 仓库 `smart-dispatch-rules`
4. Render 会自动读取 `render.yaml` 配置

#### Step 2: 配置环境变量
在 Render Dashboard 中确认以下变量：

| 服务 | 变量名 | 值 |
|-----|-------|-----|
| API | `NODE_ENV` | `production` |
| API | `PORT` | `10000` |
| API | `DATABASE_URL` | 自动从数据库服务获取 |
| API | `JWT_SECRET` | 自动生成或自定义 |
| Web | `VITE_API_URL` | `https://{api-url}/api/v1` |

#### Step 3: 部署
点击 **Apply** 开始部署，Render 会自动：
- 创建 PostgreSQL 数据库
- 构建并部署 API 服务
- 构建并部署 Web 前端

---

### 方式二：手动部署 (更灵活)

#### Step 1: 创建 PostgreSQL 数据库
1. Dashboard → **New +** → **PostgreSQL**
2. 配置：
   - Name: `smart-dispatch-db`
   - Region: Singapore
   - Plan: Free
3. 创建后记录 **Internal Database URL** (给 API 使用)

#### Step 2: 部署 API 服务
1. Dashboard → **New +** → **Web Service**
2. 选择 GitHub 仓库
3. 配置：
   - Name: `smart-dispatch-api`
   - Region: Singapore
   - Branch: `main`
   - Root Directory: `apps/api`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npx prisma db seed && npm run start:prod`
4. 添加环境变量：
   - `DATABASE_URL`: 从数据库服务复制的 Internal URL
   - `JWT_SECRET`: `your-secret-key-here` (请替换为随机字符串)
   - `JWT_EXPIRES_IN`: `7d`
5. 点击 **Create Web Service**

#### Step 3: 部署 Web 前端
1. Dashboard → **New +** → **Static Site**
2. 选择 GitHub 仓库
3. 配置：
   - Name: `smart-dispatch-web`
   - Region: Singapore
   - Branch: `main`
   - Root Directory: `apps/web`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. 添加环境变量：
   - `VITE_API_URL`: `https://smart-dispatch-api.onrender.com/api/v1` (替换为实际的 API 地址)
5. 点击 **Create Static Site**

---

## 🔧 验证部署

### 1. 测试 API
```bash
# 测试登录
curl -X POST https://your-api-url.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. 访问前端
打开 Web 服务的 URL，应该能看到登录页面。

### 3. 登录测试
- 用户名: `admin`
- 密码: `admin123`

---

## 📝 重要说明

### 免费额度限制
| 资源 | 限制 |
|-----|------|
| Web Service | 每月 750 小时运行时间 |
| PostgreSQL | 1GB 存储 |
| Static Site | 无限流量 |

> 💡 **提示**: Web Service 在 15 分钟无访问后会休眠，首次访问需要 30 秒左右启动。

### 数据库迁移
每次代码更新后，Render 会自动运行：
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 自动部署
推送到 `main` 分支会自动触发重新部署。

---

## 🆘 常见问题

### 1. API 启动失败
检查 Render Dashboard 的 **Logs** 选项卡，常见问题：
- 数据库连接失败 → 检查 DATABASE_URL
- JWT_SECRET 未设置 → 添加环境变量

### 2. 前端无法连接 API
- 检查 `VITE_API_URL` 是否指向正确的 API 地址
- 确认 API CORS 配置允许前端域名

### 3. 数据库迁移失败
手动执行迁移：
```bash
# 在 Render Dashboard 的 Shell 中执行
cd apps/api
npx prisma migrate deploy
```

---

## 🎉 部署完成后的信息

| 项目 | 值 |
|-----|-----|
| API 地址 | `https://smart-dispatch-api.onrender.com` |
| Web 地址 | `https://smart-dispatch-web.onrender.com` |
| 数据库 | `smart-dispatch-db` |
| 登录账号 | admin / admin123 |

---

**创建时间**: 2026-02-17  
**文档版本**: v1.0
