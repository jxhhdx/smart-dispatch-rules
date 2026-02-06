# 部署指南

本文档介绍如何使用 GitHub Actions 自动部署项目到 Vercel。

## 📋 目录

- [环境准备](#环境准备)
- [Vercel 配置](#vercel-配置)
- [GitHub Secrets 配置](#github-secrets-配置)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

---

## 环境准备

### 1. 创建 Vercel 账号

1. 访问 [Vercel](https://vercel.com) 并注册账号
2. 建议关联 GitHub 账号便于导入项目

### 2. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 3. 登录 Vercel

```bash
vercel login
```

---

## Vercel 配置

### 创建 API 项目

```bash
cd apps/api

# 初始化 Vercel 项目
vercel

# 按照提示配置：
# - 设置项目名称（如：smart-dispatch-api）
# - 选择框架预设（Nest.js）
# - 配置环境变量
```

### 创建 Web 项目

```bash
cd apps/web

# 初始化 Vercel 项目
vercel

# 按照提示配置：
# - 设置项目名称（如：smart-dispatch-web）
# - 选择框架预设（Vite）
```

### 获取 Vercel Token

```bash
# 生成访问令牌
vercel tokens create github-actions

# 保存生成的 token，后续配置到 GitHub Secrets
```

### 获取 Project ID 和 Org ID

```bash
# 在项目根目录执行
cd apps/api
vercel env ls

# 或者查看 .vercel/project.json
cat .vercel/project.json
```

输出示例：
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxx"
}
```

---

## GitHub Secrets 配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中配置以下 secrets：

### 必需 Secrets

| Secret Name | 说明 | 获取方式 |
|------------|------|---------|
| `VERCEL_TOKEN` | Vercel 访问令牌 | `vercel tokens create` |
| `VERCEL_ORG_ID` | Vercel 组织 ID | `.vercel/project.json` 中的 `orgId` |
| `VERCEL_API_PROJECT_ID` | API 项目 ID | `apps/api/.vercel/project.json` |
| `VERCEL_WEB_PROJECT_ID` | Web 项目 ID | `apps/web/.vercel/project.json` |

### 数据库 Secrets

| Secret Name | 说明 | 示例 |
|------------|------|------|
| `DATABASE_URL` | 生产环境数据库连接字符串 | `postgresql://user:pass@host/db` |
| `DATABASE_URL_PREVIEW` | 预览环境数据库连接字符串 | `postgresql://user:pass@host/db_preview` |
| `REDIS_URL` | Redis 连接地址 | `rediss://default:pass@host:port` |
| `REDIS_URL_PREVIEW` | 预览环境 Redis 地址 | `rediss://default:pass@host:port` |

### 应用 Secrets

| Secret Name | 说明 | 示例 |
|------------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | 随机字符串，如 `your-secret-key-123` |
| `VITE_API_URL` | 生产环境 API 地址 | `https://your-api.vercel.app` |
| `VITE_API_URL_PREVIEW` | 预览环境 API 地址 | `https://your-api-preview.vercel.app` |

### 可选 Secrets

| Secret Name | 说明 |
|------------|------|
| `VERCEL_API_URL` | API 部署后的完整 URL（用于通知） |
| `VERCEL_WEB_URL` | Web 部署后的完整 URL（用于通知） |

---

## 部署流程

### 自动部署

当代码推送到 `main` 分支时，GitHub Actions 会自动触发部署：

1. **修改 API 代码** → 自动部署 API
2. **修改 Web 代码** → 自动部署 Web
3. **修改共享包** → 同时部署 API 和 Web

### 手动部署

可以通过 GitHub Actions 页面手动触发部署：

1. 进入仓库的 **Actions** 标签
2. 选择 **Deploy All to Production**
3. 点击 **Run workflow**
4. 选择要部署的服务（API/Web）
5. 点击 **Run workflow**

### PR 预览部署

提交 Pull Request 时，会自动部署预览版本：
- 每个 PR 会生成独立的预览 URL
- PR 评论中会显示预览链接
- 预览环境使用独立的数据库

---

## 工作流说明

### CI 工作流 (`.github/workflows/ci.yml`)

**触发条件：**
- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**执行步骤：**
1. 代码检查 (Lint)
2. 类型检查 (TypeScript)
3. 运行测试
4. 构建检查

### API 部署工作流 (`.github/workflows/deploy-api.yml`)

**触发条件：**
- `apps/api/**` 目录的代码变更
- 手动触发

**执行步骤：**
1. 安装依赖
2. 构建项目
3. 部署到 Vercel
4. 执行数据库迁移

### Web 部署工作流 (`.github/workflows/deploy-web.yml`)

**触发条件：**
- `apps/web/**` 目录的代码变更
- 手动触发

**执行步骤：**
1. 安装依赖
2. 构建项目
3. 部署到 Vercel

### 预览部署工作流 (`.github/workflows/preview.yml`)

**触发条件：**
- Pull Request

**执行步骤：**
1. 部署预览版本
2. 在 PR 中评论预览链接

---

## 环境变量配置

### API 环境变量 (Vercel Dashboard)

在 Vercel Dashboard 中配置以下环境变量：

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
REDIS_URL=rediss://...
FRONTEND_URL=https://your-web.vercel.app
```

### Web 环境变量 (Vercel Dashboard)

```
VITE_API_URL=https://your-api.vercel.app
```

---

## 数据库迁移

### 生产环境迁移

```bash
cd apps/api

# 设置生产环境数据库 URL
export DATABASE_URL="your-production-db-url"

# 执行迁移
npx prisma migrate deploy

# 生成客户端
npx prisma generate
```

### 初始化数据

```bash
cd apps/api

# 运行 seed 脚本
npx prisma db seed
```

---

## 域名配置

### 自定义域名

1. 在 Vercel Dashboard 中选择项目
2. 进入 **Settings > Domains**
3. 添加自定义域名
4. 按照提示配置 DNS

### API 和 Web 关联

确保 Web 项目的 `VITE_API_URL` 指向正确的 API 域名：

```bash
# 生产环境
VITE_API_URL=https://api.yourdomain.com

# 预览环境
VITE_API_URL_PREVIEW=https://api-preview.yourdomain.com
```

---

## 常见问题

### Q: 部署失败，提示 "Build failed"

**A:** 检查以下几点：
1. 环境变量是否正确配置
2. `vercel.json` 配置是否正确
3. 构建命令是否正确

### Q: 数据库连接失败

**A:** 
1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库允许 Vercel 的 IP 访问
3. 对于 Vercel Postgres，使用自动配置的环境变量

### Q: 如何回滚部署？

**A:** 
1. 在 Vercel Dashboard 中找到项目
2. 进入 **Deployments**
3. 找到要回滚的版本
4. 点击右侧菜单选择 **Promote to Production**

### Q: 如何查看部署日志？

**A:**
1. GitHub Actions 页面查看工作流日志
2. Vercel Dashboard > Deployments > 选择部署查看详细日志

### Q: 预览环境和生产环境有什么区别？

**A:**
| 特性 | 预览环境 | 生产环境 |
|-----|---------|---------|
| URL | 随机生成 | 固定域名 |
| 数据库 | preview 库 | production 库 |
| 访问权限 | 公开 | 公开 |
| 自动部署 | PR 触发 | main 分支触发 |

---

## 相关文档

- [Vercel 文档](https://vercel.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
