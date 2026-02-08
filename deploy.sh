#!/bin/bash

# Smart Dispatch Rules - 一键部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即停止

echo "🚀 Smart Dispatch Rules 自动部署脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "${RED}❌ 错误: 需要先安装 Node.js${NC}"
    echo "请访问 https://nodejs.org 下载安装 LTS 版本"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查是否安装了 Git
if ! command -v git &> /dev/null; then
    echo "${RED}❌ 错误: 需要先安装 Git${NC}"
    exit 1
fi

echo "✅ Git 已安装"

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -d "apps/api" ] || [ ! -d "apps/web" ]; then
    echo "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo "✅ 项目目录正确"
echo ""

# 安装 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI 已安装"
echo ""

# 检查是否已登录 Vercel
echo "🔐 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "${YELLOW}⚠️  未登录 Vercel，请先登录${NC}"
    echo ""
    echo "请先完成以下步骤："
    echo "1. 访问 https://vercel.com/signup 注册账号（用 GitHub 登录最简单）"
    echo "2. 注册完成后，回来运行: vercel login"
    echo ""
    echo "是否现在登录? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        vercel login
    else
        echo "${RED}❌ 需要登录 Vercel 才能继续部署${NC}"
        exit 1
    fi
fi

echo "✅ Vercel 已登录: $(vercel whoami)"
echo ""

# 检查 GitHub 仓库连接
echo "🔗 检查 GitHub 连接..."
if ! git remote -v &> /dev/null; then
    echo "${RED}❌ 错误: Git 仓库未配置远程地址${NC}"
    exit 1
fi

echo "✅ GitHub 仓库:"
git remote -v
echo ""

# 提示创建数据库
echo "📊 数据库设置"
echo "=============="
echo "${YELLOW}请先在 Vercel 网站创建 Postgres 数据库:${NC}"
echo ""
echo "1. 打开 https://vercel.com/dashboard"
echo "2. 点击顶部 'Storage'"
echo "3. 点击 'Create Database' → 选择 'Postgres'"
echo "4. 创建完成后，复制 DATABASE_URL"
echo ""

# 获取 DATABASE_URL
while true; do
    echo -n "请输入 DATABASE_URL (postgres://...): "
    read -rs DATABASE_URL
    echo ""
    
    if [[ $DATABASE_URL == postgres://* ]]; then
        break
    else
        echo "${RED}❌ 格式不正确，应该以 postgres:// 开头${NC}"
        echo "请重新输入..."
    fi
done

echo "✅ 数据库地址已输入"
echo ""

# 生成 JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || date | md5)
echo "🔑 生成的 JWT_SECRET: $JWT_SECRET"
echo ""

# 创建环境变量文件
echo "📝 创建环境变量文件..."

# API 环境变量
cat > apps/api/.env.production << EOF
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
PORT=3000
NODE_ENV=production
EOF

# 临时环境变量用于数据库迁移
export DATABASE_URL
export JWT_SECRET

echo "✅ API 环境变量文件创建完成"

# 部署 API
echo ""
echo "🚀 开始部署 API..."
echo "==================="
cd apps/api

# 安装依赖
echo "📦 安装 API 依赖..."
npm install

# 执行数据库迁移
echo "🗄️  执行数据库迁移..."
npx prisma migrate deploy

# 种子数据
echo "🌱 添加种子数据..."
npx prisma db seed 2>/dev/null || echo "⚠️  种子数据可能已存在"

# 部署到 Vercel
echo "☁️  部署 API 到 Vercel..."
vercel --prod --yes

# 获取 API 地址
API_URL=$(vercel ls --meta 2>/dev/null | grep -o 'https://[^[:space:]]*' | head -1 || echo "")

cd ../..

if [ -z "$API_URL" ]; then
    echo "${YELLOW}⚠️  无法自动获取 API 地址，请手动输入${NC}"
    echo -n "请输入 API 地址 (例如 https://xxx.vercel.app): "
    read -r API_URL
fi

echo ""
echo "✅ API 部署完成: $API_URL"
echo ""

# 部署 Web
echo "🚀 开始部署前端..."
echo "=================="
cd apps/web

# 创建前端环境变量
VITE_API_URL="${API_URL}/api/v1"
cat > .env.production << EOF
VITE_API_URL=$VITE_API_URL
EOF

echo "✅ 前端环境变量: VITE_API_URL=$VITE_API_URL"

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 构建
echo "🔨 构建前端..."
npm run build

# 部署到 Vercel
echo "☁️  部署前端到 Vercel..."
vercel --prod --yes

cd ../..

echo ""
echo "======================================"
echo "${GREEN}🎉 部署完成!${NC}"
echo "======================================"
echo ""
echo "📋 访问地址:"
echo "   前端: https://smart-dispatch-rules-web.vercel.app"
echo "   API:  ${API_URL}"
echo ""
echo "🔑 默认登录账号:"
echo "   用户名: admin"
echo "   密码:   admin123"
echo ""
echo "⚠️  注意:"
echo "   如果前端无法访问 API，请检查 CORS 设置"
echo "   在 apps/api/src/main.ts 中添加前端域名到白名单"
echo ""
