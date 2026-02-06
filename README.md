# Smart Dispatch Rules

智能派单规则管理系统 - 面向外卖配送场景的策略规则管理后台。

## 技术栈

- **前端**: React + TypeScript + Ant Design + Zustand
- **后端**: NestJS + TypeScript + Prisma
- **数据库**: PostgreSQL
- **部署**: Vercel (Serverless)
- **CI/CD**: GitHub Actions

## 项目结构

```
smart-dispatch-rules/
├── apps/
│   ├── api/          # NestJS 后端 API
│   └── web/          # React 前端应用
├── packages/
│   └── shared/       # 共享类型定义
├── .github/
│   └── workflows/    # GitHub Actions 工作流
├── docs/
│   ├── design.md     # 设计文档
│   ├── i18n-design.md # 国际化设计
│   └── DEPLOYMENT.md # 部署指南
├── turbo.json        # Turborepo 配置
└── package.json      # 根 package.json
```

## 功能特性

### 已完成

- [x] 项目初始化 (Turborepo + NestJS + React)
- [x] 数据库设计 (Prisma Schema)
- [x] 基础 API 脚手架
- [x] 登录认证模块 (JWT)
- [x] 用户管理 (CRUD)
- [x] 角色权限管理 (RBAC)
- [x] 规则管理 (CRUD + 版本管理)
- [x] 操作日志
- [x] 前端基础布局
- [x] 国际化支持 (i18n) - 中英双语
- [x] CI/CD 自动化部署 (GitHub Actions)

### 进行中

- [ ] 规则可视化配置
- [ ] 规则模拟执行
- [ ] 仪表盘数据统计
- [ ] 派单统计报表

## 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cd apps/api
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

### 数据库迁移

```bash
npm run db:migrate
npm run db:seed
```

### 启动开发服务器

```bash
# 同时启动前后端
npm run dev

# 单独启动后端
npm run dev --filter=api

# 单独启动前端
npm run dev --filter=web
```

- 前端: http://localhost:3000
- 后端: http://localhost:3001/api/v1

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 部署

项目配置了 GitHub Actions 自动化部署到 Vercel。

### 自动部署

- 推送到 `main` 分支会自动触发部署
- API 和 Web 会分别部署
- PR 会自动生成预览链接

### 手动部署

在 GitHub Actions 页面手动触发 **Deploy All to Production** 工作流。

### 配置说明

详细部署配置请参考 [部署指南](./docs/DEPLOYMENT.md)。

需要配置的 GitHub Secrets:

| Secret | 说明 |
|--------|------|
| `VERCEL_TOKEN` | Vercel 访问令牌 |
| `VERCEL_ORG_ID` | Vercel 组织 ID |
| `VERCEL_API_PROJECT_ID` | API 项目 ID |
| `VERCEL_WEB_PROJECT_ID` | Web 项目 ID |
| `DATABASE_URL` | 数据库连接字符串 |
| `JWT_SECRET` | JWT 密钥 |
| `VITE_API_URL` | 前端 API 地址 |

## 开发计划

按照 design.md 文档执行:

1. **Phase 1: 基础架构** ✅
   - 项目初始化
   - 数据库设计
   - 登录认证

2. **Phase 2: 核心功能** ✅
   - 用户/角色管理
   - 前端基础布局
   - 国际化支持

3. **Phase 3: 规则系统** (进行中)
   - 规则 CRUD
   - 规则版本管理
   - 可视化配置界面

4. **Phase 4: 完善功能**
   - 操作日志
   - 仪表盘统计
   - CI/CD 部署
   - 文档整理

## GitHub Actions 工作流

| 工作流 | 触发条件 | 说明 |
|-------|---------|------|
| CI | PR / Push | 代码检查、类型检查、测试 |
| Deploy API | API 代码变更 | 部署后端到 Vercel |
| Deploy Web | Web 代码变更 | 部署前端到 Vercel |
| Preview | PR | 创建预览环境 |
| Deploy All | 手动触发 | 同时部署前后端 |

### 📧 邮件通知

部署完成后会自动发送邮件通知：

```bash
# 配置邮件
cp skills/notification/config.example.json skills/notification/config.json
# 编辑 config.json 填入邮箱信息

# 测试邮件发送
python skills/notification/notify.py --test

# 本地使用
python skills/notification/notify.py --message "构建完成" --status success
```

需要在 GitHub Secrets 中添加 `NOTIFY_CONFIG` (base64 编码的配置文件)。

## License

MIT
