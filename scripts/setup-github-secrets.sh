#!/bin/bash

# ==========================================
# GitHub Secrets 设置脚本
# ==========================================
# 使用方法:
# 1. 确保已安装 GitHub CLI: https://cli.github.com/
# 2. 登录 GitHub: gh auth login
# 3. 运行脚本: ./scripts/setup-github-secrets.sh
# ==========================================

set -e

echo "🚀 GitHub Secrets 设置工具"
echo "=========================="
echo ""

# 检查 gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ 错误: 请先安装 GitHub CLI"
    echo "   安装指南: https://cli.github.com/"
    exit 1
fi

# 检查登录状态
if ! gh auth status &> /dev/null; then
    echo "❌ 错误: 请先登录 GitHub CLI"
    echo "   运行: gh auth login"
    exit 1
fi

# 获取仓库信息
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
    read -p "请输入 GitHub 仓库名 (格式: owner/repo): " REPO
fi

echo "📦 目标仓库: $REPO"
echo ""

# 读取 .env 文件
if [ -f ".env" ]; then
    echo "📄 检测到 .env 文件，将使用其中的值作为默认值"
    source .env
fi

# 函数：设置 secret
set_secret() {
    local key=$1
    local default_value=$2
    local is_sensitive=$3
    
    if [ -n "$default_value" ] && [ "$is_sensitive" != "true" ]; then
        read -p "$key [$default_value]: " value
        value=${value:-$default_value}
    else
        read -p "$key: " value
    fi
    
    if [ -n "$value" ]; then
        echo "$value" | gh secret set "$key" -R "$REPO"
        echo "   ✅ 已设置 $key"
    else
        echo "   ⚠️  跳过 $key (值为空)"
    fi
}

echo "🔑 请提供以下 Secrets:"
echo ""

# Vercel 配置
echo "--- Vercel 配置 ---"
set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" "true"
set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"
set_secret "VERCEL_API_PROJECT_ID" "$VERCEL_API_PROJECT_ID"
set_secret "VERCEL_WEB_PROJECT_ID" "$VERCEL_WEB_PROJECT_ID"
echo ""

# 数据库配置
echo "--- 数据库配置 ---"
set_secret "DATABASE_URL" "$DATABASE_URL" "true"
set_secret "DATABASE_URL_PREVIEW" "$DATABASE_URL_PREVIEW" "true"
echo ""

# Redis 配置 (可选)
echo "--- Redis 配置 (可选) ---"
set_secret "REDIS_URL" "$REDIS_URL" "true"
set_secret "REDIS_URL_PREVIEW" "$REDIS_URL_PREVIEW" "true"
echo ""

# 应用配置
echo "--- 应用配置 ---"
set_secret "JWT_SECRET" "$JWT_SECRET" "true"
set_secret "VITE_API_URL" "$VITE_API_URL"
set_secret "VITE_API_URL_PREVIEW" "$VITE_API_URL_PREVIEW"
echo ""

# 可选配置
echo "--- 可选配置 ---"
set_secret "VERCEL_API_URL" "$VERCEL_API_URL"
set_secret "VERCEL_WEB_URL" "$VERCEL_WEB_URL"
echo ""

echo "=========================="
echo "✅ Secrets 设置完成!"
echo ""
echo "查看已设置的 secrets:"
echo "  gh secret list -R $REPO"
