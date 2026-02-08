#!/bin/bash

# Smart Dispatch Rules - 测试运行脚本

set -e

echo "🧪 Smart Dispatch Rules Test Suite"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, loading from .env.test${NC}"
    export $(cat .env.test | grep -v '#' | xargs)
fi

# 测试模式
TEST_MODE=${1:-"all"}

case $TEST_MODE in
    unit)
        echo "🧪 Running UNIT tests only..."
        npm run test -- --testPathPattern="unit" --verbose
        ;;
    e2e)
        echo "🔗 Running E2E tests only..."
        npm run test:e2e -- --verbose
        ;;
    coverage)
        echo "📊 Running tests with COVERAGE..."
        npm run test:cov
        ;;
    watch)
        echo "👀 Running tests in WATCH mode..."
        npm run test:watch
        ;;
    all|*)
        echo "🧪 Running ALL tests..."
        npm run test -- --verbose
        echo ""
        echo "🔗 Running E2E tests..."
        npm run test:e2e -- --verbose
        ;;
esac

echo ""
echo "=================================="
echo -e "${GREEN}✅ Tests completed!${NC}"
