# Smart Dispatch Rules

智能派单规则管理系统 - 面向外卖配送场景的策略规则管理后台。

## 技术栈

- **前端**: React + TypeScript + Ant Design + Zustand
- **后端**: NestJS + TypeScript + Prisma
- **数据库**: PostgreSQL
- **部署**: Vercel (Serverless)

## 项目结构

```
smart-dispatch-rules/
├── apps/
│   ├── api/          # NestJS 后端 API
│   └── web/          # React 前端应用
├── packages/
│   └── shared/       # 共享类型定义
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

## 开发计划

按照 design.md 文档执行:

1. **Phase 1: 基础架构** ✅
   - 项目初始化
   - 数据库设计
   - 登录认证

2. **Phase 2: 核心功能** ✅
   - 用户/角色管理
   - 前端基础布局

3. **Phase 3: 规则系统** (进行中)
   - 规则 CRUD
   - 规则版本管理
   - 可视化配置界面

4. **Phase 4: 完善功能**
   - 操作日志
   - 仪表盘统计
   - 文档整理

## License

MIT
