# 🚀 部署指南（小白版）

## 第一步：创建数据库

1. 打开 https://vercel.com/dashboard
2. 点顶部 **"Storage"**
3. 点 **"Create Database"** → 选 **"Postgres"** → **Create**
4. 等创建完成，会显示一个长长的连接字符串（DATABASE_URL）

## 第二步：部署后端 API

1. 在 Vercel 点 **"Add New..."** → **"Project"**
2. 导入 `smart-dispatch-rules` 仓库
3. 配置：
   - **Framework Preset**: `Other`
   - **Root Directory**: `apps/api`
4. 点 **Environment Variables**，添加：
   - `DATABASE_URL` = （刚才复制的数据库地址）
   - `JWT_SECRET` = `my-secret-key-123`（随便填）
5. 点 **Deploy**

## 第三步：部署前端 Web

1. 再点 **"Add New..."** → **"Project"**
2. 再导入一次 `smart-dispatch-rules` 仓库
3. 配置：
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
4. 点 **Environment Variables**，添加：
   - `VITE_API_URL` = `https://你的api域名.vercel.app/api/v1`
     
     （这个地址在第二步部署完后能看到）
5. 点 **Deploy**

## 第四步：数据库初始化

部署完成后，需要初始化数据库表：

1. 本地打开终端：
```bash
cd /Users/gaoxiang/Workspace2026/smart-dispatch-rules/apps/api

# 设置数据库地址（用 Vercel 给你的那个）
export DATABASE_URL="postgres://..."

# 执行数据库迁移
npx prisma migrate deploy

# 添加测试数据
npx prisma db seed
```

## ✅ 完成

- 前端地址：`https://smart-dispatch-rules-web.vercel.app`
- 后端地址：`https://smart-dispatch-rules-api.vercel.app`
- 默认账号：admin / admin123

## 🔄 以后更新代码

只要 `git push` 到 GitHub，Vercel 会自动重新部署。
