#!/bin/bash

# Smart Dispatch Rules - 完整测试套件
# 包含：后端单元测试 + 后端 E2E 测试 + 前端 Playwright 测试

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

# 计数器
TOTAL=0
PASSED=0
FAILED=0

# 检查后端服务
if ! lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend service not running on port 3001${NC}"
    echo "Please start the backend first:"
    echo "  cd apps/api && npm run dev"
    exit 1
fi

# 检查前端服务
if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend service not running on port 3000${NC}"
    echo "Please start the frontend first:"
    echo "  cd apps/web && npm run dev"
    exit 1
fi

run_test() {
    local name="$1"
    local command="$2"
    
    echo ""
    echo -e "${BLUE}▶️  Running: $name${NC}"
    echo "----------------------------------------------"
    
    TOTAL=$((TOTAL + 1))
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $name PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $name FAILED${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. 后端单元测试
echo -e "${BLUE}🧪 Step 1/3: Backend Unit Tests${NC}"
echo "=============================================="
run_test "Backend Unit Tests" "cd apps/api && npm run test:unit"

# 2. 后端 E2E 测试
echo ""
echo -e "${BLUE}🔗 Step 2/3: Backend E2E Tests${NC}"
echo "=============================================="
run_test "Backend E2E Tests" "cd apps/api && npm run test:e2e"

# 3. 前端 Playwright 测试
echo ""
echo -e "${BLUE}🎭 Step 3/3: Frontend Playwright Tests${NC}"
echo "=============================================="
run_test "Frontend Playwright Tests" "npx playwright test"

# 汇总
echo ""
echo "=============================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=============================================="
echo "Total:  $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi
