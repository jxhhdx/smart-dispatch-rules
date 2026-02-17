# 🚀 Smart Dispatch Rules - 客户演示环境部署方案

> **目标**: 部署长期可用的客户演示环境  
> **域名**: Vercel 自动分配 (xxx.vercel.app)  
> **成本**: 完全免费 (Vercel Hobby + Postgres + Redis)

---

## 📋 部署概览

| 组件 | 服务 | 费用 |
|-----|------|------|
| 前端 (React) | Vercel | 免费 |
| 后端 (NestJS) | Vercel Serverless | 免费 |
| 数据库 (PostgreSQL) | Vercel Postgres | 免费 (256MB) |
| 缓存 (Redis) | Upstash | 免费 |
| 自动化部署 | GitHub Actions | 免费 |

---

## 🎯 部署前准备清单

### 1. 必需账号
- [ ] GitHub 账号（已有: `jxhhdx`）
- [ ] Vercel 账号（可用 GitHub 登录）
- [ ] Upstash 账号（可用 GitHub 登录）

### 2. 必需工具（已安装 ✓）
- [x] Node.js >= 18
- [x] Vercel CLI
- [x] Git

---

## 🛠️ 详细部署步骤

### Phase 1: Vercel 项目初始化

#### 1.1 登录 Vercel
```bash
vercel login
# 选择使用 GitHub 登录
```

#### 1.2 创建 API 项目（后端）
```bash
cd apps/api
vercel

# 回答以下问题：
# ? Set up "apps/api"? [Y/n] → Y
# ? Which scope do you want to deploy to? → 选择你的账号
# ? Link to existing project? [y/N] → N
# ? What’s your project name? → smart-dispatch-api
# ? In which directory is your code located? → ./ (当前目录)
```

#### 1.3 创建 Web 项目（前端）
```bash
cd ../web
vercel

# 回答以下问题：
# ? Set up "apps/web"? [Y/n] → Y
# ? Link to existing project? [y/N] → N
# ? What’s your project name? → smart-dispatch-web
# ? In which directory is your code located? → ./ (当前目录)
```

#### 1.4 记录项目信息
执行以下命令获取项目 ID：
```bash
cd apps/api && vercel project ls
cd apps/web && vercel project ls
```

记录下来：
- API 项目 ID: `prj_xxxxxxxxxx`
- Web 项目 ID: `prj_xxxxxxxxxx`
- Org ID: `team_xxxxxxxx` (在 Vercel 控制台 → Settings → General 中查看)

---

### Phase 2: 数据库配置

#### 2.1 创建 Vercel Postgres 数据库
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 `smart-dispatch-api` 项目
3. 点击 **Storage** → **Create Database** → **Postgres**
4. 选择 **Region**: `Hong Kong (hkg1)`（距离国内最近）
5. 点击 **Create**
6. 复制连接字符串（`.env.local` 格式）

#### 2.2 创建 Upstash Redis
1. 登录 [Upstash Console](https://console.upstash.com)
2. 点击 **Create Database**
3. Name: `smart-dispatch-redis`
4. Region: `Hong Kong, GCP`
5. 点击 **Create**
6. 复制 **Redis URL** (格式: `rediss://default:xxx@xxx.upstash.io:6379`)

---

### Phase 3: 配置环境变量

#### 3.1 在 Vercel 控制台配置 API 环境变量
进入 `smart-dispatch-api` 项目 → **Settings** → **Environment Variables**：

| 变量名 | 值 | 环境 |
|-------|-----|------|
| `DATABASE_URL` | Vercel Postgres 连接串 | Production |
| `JWT_SECRET` | 随机生成的密钥 (见下方) | Production |
| `JWT_EXPIRES_IN` | `7d` | Production |
| `REDIS_URL` | Upstash Redis URL | Production |

生成 JWT 密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3.2 在 Vercel 控制台配置 Web 环境变量
进入 `smart-dispatch-web` 项目 → **Settings** → **Environment Variables**：

| 变量名 | 值 | 环境 |
|-------|-----|------|
| `VITE_API_URL` | API 部署后的 URL | Production |

注意：`VITE_API_URL` 需要先部署 API 后获取。

---

### Phase 4: 配置 GitHub Secrets

#### 4.1 获取 Vercel Token
```bash
vercel tokens create
# Token name: github-actions
# 复制生成的 token
```

#### 4.2 在 GitHub 配置 Secrets
进入 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**：

| Secret 名称 | 值 |
|------------|-----|
| `VERCEL_TOKEN` | 上一步创建的 Token |
| `VERCEL_ORG_ID` | Org ID (如 `team_xxx`) |
| `VERCEL_API_PROJECT_ID` | API 项目 ID (如 `prj_xxx`) |
| `VERCEL_WEB_PROJECT_ID` | Web 项目 ID (如 `prj_xxx`) |
| `DATABASE_URL` | Vercel Postgres 连接串 |
| `JWT_SECRET` | JWT 密钥 |
| `REDIS_URL` | Upstash Redis URL |
| `VITE_API_URL` | 部署后的 API URL |

---

### Phase 5: 首次部署

#### 5.1 手动部署 API
```bash
cd apps/api
vercel --prod
```

部署完成后，记录生成的 URL（如 `https://smart-dispatch-api-xxx.vercel.app`）

#### 5.2 配置 Web 的 API 地址
将上述 URL 配置到 `smart-dispatch-web` 的环境变量 `VITE_API_URL` 中。

#### 5.3 手动部署 Web
```bash
cd apps/web
vercel --prod
```

#### 5.4 初始化数据库
```bash
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

---

### Phase 6: 配置自动部署（可选但推荐）

GitHub Actions 已配置，配置好 Secrets 后，推送代码到 `main` 分支会自动触发部署。

---

## 🎭 演示数据准备

### 预置账号
| 用户名 | 密码 | 角色 |
|-------|------|------|
| admin | admin123 | 超级管理员 |

### 可选：创建演示数据
执行以下命令添加演示数据：
```bash
cd apps/api
npx ts-node scripts/seed-demo-data.ts
```

---

## 🔒 安全加固（客户演示推荐）

### 1. 添加访问密码（Vercel 密码保护）
Vercel Hobby 暂不支持密码保护，可通过以下方式：
- 在环境变量中添加 `DEMO_MODE=true`
- 前端显示演示水印

### 2. 限制 API 访问
在 API 中添加 CORS 白名单：
```env
ALLOWED_ORIGINS=https://smart-dispatch-web-xxx.vercel.app
```

---

## 📊 部署验证清单

| 检查项 | 方法 |
|-------|------|
| 前端可访问 | 访问 Web URL，能看到登录页 |
| API 可访问 | 访问 `https://api-url/api/v1/health` |
| 数据库连接 | 登录后能正常操作 |
| 登录功能 | 使用 admin/admin123 能登录 |
| 规则管理 | 能创建、编辑规则 |

---

## 🚨 常见问题

### 1. 数据库迁移失败
```bash
# 手动执行迁移
cd apps/api
npx prisma migrate deploy
```

### 2. API 返回 500
检查 Vercel 函数日志：
```bash
cd apps/api && vercel logs --all
```

### 3. 前端无法连接 API
- 检查 `VITE_API_URL` 是否配置正确
- 检查 API CORS 设置

---

## 📝 演示环境信息

部署完成后填写：

| 项目 | 值 |
|-----|-----|
| 前端地址 | `https://smart-dispatch-web-xxx.vercel.app` |
| API 地址 | `https://smart-dispatch-api-xxx.vercel.app` |
| 登录账号 | admin / admin123 |
| 数据库 | Vercel Postgres |
| 部署时间 | 202X-XX-XX |

---

## ♻️ 后续维护

- **代码更新**: 推送到 `main` 分支自动部署
- **数据库变更**: 修改 `schema.prisma` 后执行 `prisma migrate dev`
- **监控**: 在 Vercel Dashboard 查看访问量和错误日志

---

**文档版本**: v1.0  
**创建时间**: 2026-02-17  
**维护人**: ___________
