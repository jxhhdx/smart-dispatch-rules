# GitHub Actions 工作流说明

本项目包含以下自动化工作流：

## 🔄 CI (ci.yml)

**触发条件:**
- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**功能:**
- 代码检查 (ESLint)
- TypeScript 类型检查
- 运行单元测试
- 构建检查

## 🚀 Deploy API (deploy-api.yml)

**触发条件:**
- `apps/api/**` 目录的文件变更 Push 到 `main`
- 手动触发 (workflow_dispatch)

**功能:**
- 构建 NestJS API
- 部署到 Vercel Production
- 执行数据库迁移 (Prisma)

**所需 Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_API_PROJECT_ID`
- `DATABASE_URL`
- `JWT_SECRET`

## 🌐 Deploy Web (deploy-web.yml)

**触发条件:**
- `apps/web/**` 目录的文件变更 Push 到 `main`
- 手动触发 (workflow_dispatch)

**功能:**
- 构建 React 应用
- 部署到 Vercel Production

**所需 Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_WEB_PROJECT_ID`
- `VITE_API_URL`

## 👁️ Preview (preview.yml)

**触发条件:**
- Pull Request 创建/更新

**功能:**
- 为 PR 创建预览环境
- 在 PR 评论中发布预览链接
- 使用预览环境数据库

**所需 Secrets:**
- 同 Deploy API/Web
- `DATABASE_URL_PREVIEW`
- `VITE_API_URL_PREVIEW`

## 🎯 Deploy All (deploy-all.yml)

**触发条件:**
- 仅手动触发 (workflow_dispatch)
- 可选择部署 API 和/或 Web

**功能:**
- 先运行测试
- 根据选择部署服务
- 汇总部署结果

## 配置 Secrets

在 GitHub 仓库 Settings > Secrets and variables > Actions 中配置：

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_API_PROJECT_ID=<api-project-id>
VERCEL_WEB_PROJECT_ID=<web-project-id>
DATABASE_URL=<production-db-url>
DATABASE_URL_PREVIEW=<preview-db-url>
JWT_SECRET=<jwt-secret>
VITE_API_URL=<production-api-url>
VITE_API_URL_PREVIEW=<preview-api-url>
```

## 本地测试工作流

使用 [act](https://github.com/nektos/act) 工具本地测试：

```bash
# 安装 act
brew install act

# 运行 CI 工作流
act -j lint-and-test

# 运行部署工作流 (需要 secrets)
act -j deploy-api --secret-file .env
```
