#!/bin/bash

# Smart Dispatch Rules - 完整测试套件
# 运行所有测试：后端单元测试 + E2E 测试

set -e

echo "🧪 Smart Dispatch Rules - Complete Test Suite"
echo "=============================================="
echo ""

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/apps/api"

# 加载环境变量
if [ -f .env.test ]; then
    echo -e "${BLUE}📋 Loading environment from .env.test${NC}"
    export $(cat .env.test | grep -v '#' | xargs)
fi

# 检查数据库连接
echo -e "${BLUE}🔌 Checking database connection...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is not set!${NC}"
    echo "Please set DATABASE_URL in .env.test file"
    exit 1
fi

# 解析参数
TEST_TYPE=${1:-"all"}

show_help() {
    echo "Usage: ./run-tests.sh [option]"
    echo ""
    echo "Options:"
    echo "  unit       - Run unit tests only"
    echo "  e2e        - Run E2E tests only"
    echo "  coverage   - Run tests with coverage report"
    echo "  watch      - Run tests in watch mode"
    echo "  all        - Run all tests (default)"
    echo "  help       - Show this help message"
    echo ""
}

case $TEST_TYPE in
    help|--help|-h)
        show_help
        exit 0
        ;;
    unit)
        echo -e "${BLUE}🧪 Running UNIT tests...${NC}"
        npm run test:unit
        ;;
    e2e)
        echo -e "${BLUE}🔗 Running E2E tests...${NC}"
        npm run test:e2e
        ;;
    coverage)
        echo -e "${BLUE}📊 Running tests with COVERAGE...${NC}"
        npm run test:cov
        echo ""
        echo -e "${GREEN}📈 Coverage report generated at:${NC}"
        echo "   coverage/lcov-report/index.html"
        ;;
    watch)
        echo -e "${BLUE}👀 Running tests in WATCH mode...${NC}"
        npm run test:watch
        ;;
    all|*)
        echo -e "${BLUE}🧪 Step 1/2: Running UNIT tests...${NC}"
        echo "----------------------------------------------"
        npm run test:unit
        
        UNIT_EXIT=$?
        
        echo ""
        echo -e "${BLUE}🔗 Step 2/2: Running E2E tests...${NC}"
        echo "----------------------------------------------"
        npm run test:e2e
        
        E2E_EXIT=$?
        
        echo ""
        echo "=============================================="
        
        if [ $UNIT_EXIT -eq 0 ] && [ $E2E_EXIT -eq 0 ]; then
            echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
            echo ""
            echo "Test Summary:"
            echo "  ✅ Unit tests: PASSED"
            echo "  ✅ E2E tests: PASSED"
            exit 0
        else
            echo -e "${RED}❌ SOME TESTS FAILED${NC}"
            echo ""
            echo "Test Summary:"
            [ $UNIT_EXIT -eq 0 ] && echo "  ✅ Unit tests: PASSED" || echo "  ❌ Unit tests: FAILED"
            [ $E2E_EXIT -eq 0 ] && echo "  ✅ E2E tests: PASSED" || echo "  ❌ E2E tests: FAILED"
            exit 1
        fi
        ;;
esac
