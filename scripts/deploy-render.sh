#!/bin/bash
# Render 部署脚本
# 用法: ./scripts/deploy-render.sh

echo "🚀 开始准备 Render 部署..."

# 检查必要文件
echo "📋 检查部署文件..."

if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml 不存在"
    exit 1
fi

if [ ! -f "apps/api/Dockerfile" ]; then
    echo "❌ apps/api/Dockerfile 不存在"
    exit 1
fi

echo "✅ 部署文件检查通过"

# 显示部署信息
echo ""
echo "======================================"
echo "  Render 部署准备完成"
echo "======================================"
echo ""
echo "📖 部署步骤:"
echo ""
echo "1. 访问 https://dashboard.render.com"
echo "2. 使用 GitHub 账号登录"
echo "3. 点击 'New +' → 'Blueprint'"
echo "4. 选择仓库: jxhhdx/smart-dispatch-rules"
echo "5. 点击 'Apply' 开始部署"
echo ""
echo "📁 使用的配置文件:"
echo "   - render.yaml (自动创建服务和数据库)"
echo ""
echo "⚙️  环境变量 (会自动配置):"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - DATABASE_URL (从数据库服务获取)"
echo "   - JWT_SECRET (自动生成)"
echo "   - VITE_API_URL (从 API 服务获取)"
echo ""
echo "📖 详细文档: RENDER_DEPLOYMENT.md"
echo ""
echo "🎉 部署完成后访问地址:"
echo "   API: https://smart-dispatch-api.onrender.com"
echo "   Web: https://smart-dispatch-web.onrender.com"
echo ""
