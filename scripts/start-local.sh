#!/bin/bash

# Smart Dispatch Rules - 本地启动脚本
# 用法: ./scripts/start-local.sh [frontend|backend|all]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    
    print_success "依赖检查通过"
}

# 检查并启动 Docker 服务
check_docker_services() {
    print_info "检查 Docker 服务..."
    
    cd "$PROJECT_DIR"
    
    # 检查 PostgreSQL
    if docker ps | grep -q "smart-dispatch-db"; then
        print_success "PostgreSQL 已在运行"
    else
        print_warning "PostgreSQL 未运行，尝试启动..."
        docker-compose up -d postgres
        sleep 3
        
        # 等待数据库就绪
        print_info "等待数据库就绪..."
        until docker exec smart-dispatch-db pg_isready -U postgres >/dev/null 2>&1; do
            sleep 1
        done
        print_success "PostgreSQL 已启动"
    fi
    
    # 检查 Redis
    if docker ps | grep -q "smart-dispatch-redis"; then
        print_success "Redis 已在运行"
    else
        print_warning "Redis 未运行，尝试启动..."
        docker-compose up -d redis
        sleep 2
        print_success "Redis 已启动"
    fi
}

# 启动后端
start_backend() {
    if check_port 3001; then
        print_warning "后端服务已在端口 3001 运行"
        return
    fi
    
    print_info "启动后端服务..."
    cd "$PROJECT_DIR/apps/api"
    
    # 检查是否需要数据库迁移
    if [ ! -f ".migration-done" ] || [ "$(find prisma/migrations -type d -name '*' -newer .migration-done 2>/dev/null | wc -l)" -gt 0 ]; then
        print_info "执行数据库迁移..."
        npx prisma migrate dev --name init 2>/dev/null || true
        npx prisma generate
        touch .migration-done
    fi
    
    # 后台启动 NestJS
    nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PROJECT_DIR/.backend.pid"
    
    # 等待服务启动
    print_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/v1/auth/login -X POST \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' | grep -q "message"; then
            print_success "后端服务已启动 (http://localhost:3001)"
            return
        fi
        sleep 1
    done
    
    print_error "后端服务启动超时，请检查日志: $LOG_DIR/backend.log"
    exit 1
}

# 启动前端
start_frontend() {
    if check_port 3000; then
        print_warning "前端服务已在端口 3000 运行"
        return
    fi
    
    print_info "启动前端服务..."
    cd "$PROJECT_DIR/apps/web"
    
    # 后台启动 Vite
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PROJECT_DIR/.frontend.pid"
    
    # 等待服务启动
    print_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "前端服务已启动 (http://localhost:3000)"
            return
        fi
        sleep 1
    done
    
    print_error "前端服务启动超时，请检查日志: $LOG_DIR/frontend.log"
    exit 1
}

# 显示状态
show_status() {
    echo ""
    echo "======================================"
    echo "  Smart Dispatch Rules - 服务状态"
    echo "======================================"
    echo ""
    
    if check_port 3000; then
        print_success "前端: http://localhost:3000 ✅"
    else
        print_error "前端: 未运行 ❌"
    fi
    
    if check_port 3001; then
        print_success "后端: http://localhost:3001 ✅"
    else
        print_error "后端: 未运行 ❌"
    fi
    
    if docker ps | grep -q "smart-dispatch-db"; then
        print_success "PostgreSQL: 运行中 ✅"
    else
        print_error "PostgreSQL: 未运行 ❌"
    fi
    
    if docker ps | grep -q "smart-dispatch-redis"; then
        print_success "Redis: 运行中 ✅"
    else
        print_error "Redis: 未运行 ❌"
    fi
    
    echo ""
    echo "日志文件:"
    echo "  后端: $LOG_DIR/backend.log"
    echo "  前端: $LOG_DIR/frontend.log"
    echo ""
    echo "预置账号:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo ""
    echo "停止服务: ./scripts/stop-local.sh"
    echo "======================================"
}

# 主函数
main() {
    local mode="${1:-all}"
    
    echo "======================================"
    echo "  Smart Dispatch Rules - 本地启动"
    echo "======================================"
    echo ""
    
    check_dependencies
    check_docker_services
    
    case "$mode" in
        backend)
            start_backend
            ;;
        frontend)
            start_frontend
            ;;
        all|*)
            start_backend
            start_frontend
            ;;
    esac
    
    show_status
}

main "$@"
