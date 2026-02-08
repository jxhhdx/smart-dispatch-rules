# Smart Dispatch Rules - 智能外卖派单策略规则管理后台

## 项目概述

基于 NestJS + React 的智能派单规则管理系统，零成本部署于 Vercel。

## 项目位置

**实际代码位置**: `/Users/gaoxiang/Workspace2026/smart-dispatch-rules`

**在 SoftwareDesign 工作空间中的引用**: `SoftwareDesign/rule_system/`

## 核心功能

| 功能模块 | 描述 |
|---------|------|
| 🔐 RBAC 权限管理 | 基于角色的细粒度权限控制 |
| 📋 派单策略规则 | 支持嵌套条件的可视化规则配置 |
| 📊 统计报表 | 派单成功率、骑手绩效、规则触发分析 |
| 📝 操作日志审计 | 完整的操作记录和追踪 |
| 🌐 国际化支持 | 支持中/英/日/韩多语言切换 |

## 技术栈

| 层级 | 技术 | 部署平台 |
|------|------|----------|
| 前端 | React + TypeScript + Ant Design | Vercel |
| 后端 | NestJS + TypeScript + Prisma | Vercel Serverless |
| 数据库 | PostgreSQL | Vercel Postgres (免费) |
| 缓存 | Redis | Upstash (免费) |
| 构建 | TurboRepo  monorepo | - |

## 项目结构

```
smart-dispatch-rules/
├── apps/
│   ├── web/            # React 前端应用 (Ant Design)
│   └── api/            # NestJS 后端 API
├── packages/
│   ├── shared/         # 共享类型和工具
│   └── ui/             # 共享 UI 组件
├── docs/               # 设计文档
├── scripts/            # 脚本工具
└── package.json        # Turborepo 配置
```

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp apps/api/.env.example apps/api/.env
# 编辑 .env 填入 DATABASE_URL

# 数据库迁移
cd apps/api && npx prisma migrate dev && npx prisma db seed

# 启动开发
npm run dev
```

## 部署

```bash
# 部署 API
cd apps/api && vercel --prod

# 部署前端
cd apps/web && vercel --prod
```

## 预置账号

| 用户名 | 密码 | 权限 |
|--------|------|------|
| admin | admin123 | 超级管理员（全部权限）|

## 文档

- [QUICKSTART.md](./QUICKSTART.md) - 快速开始指南
- [README.md](./README.md) - 项目说明
- [docs/design.md](./docs/design.md) - 架构设计、数据库设计、API 设计
- [docs/i18n-design.md](./docs/i18n-design.md) - 多语言架构

## 相关项目

- 所属工作空间: `SoftwareDesign`
- 引用目录: `SoftwareDesign/rule_system/`

## License

MIT
