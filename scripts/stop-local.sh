#!/bin/bash

# Smart Dispatch Rules - 本地停止脚本
# 用法: ./scripts/stop-local.sh [frontend|backend|all]

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 停止前端
stop_frontend() {
    print_info "停止前端服务..."
    
    local stopped=false
    
    # 从 PID 文件停止
    if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
        local pid=$(cat "$PROJECT_DIR/.frontend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null
            print_success "前端服务已停止 (PID: $pid)"
            stopped=true
        fi
        rm -f "$PROJECT_DIR/.frontend.pid"
    fi
    
    # 停止端口 3000 上的进程
    local pids=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        print_success "前端服务已停止 (端口 3000)"
        stopped=true
    fi
    
    # 停止所有 vite 进程
    ps aux | grep "vite" | grep smart-dispatch | grep -v grep | awk '{print $2}' | while read pid; do
        kill -9 "$pid" 2>/dev/null || true
        print_success "Vite 进程已停止 (PID: $pid)"
        stopped=true
    done
    
    if [ "$stopped" = false ]; then
        print_warning "前端服务未运行"
    fi
}

# 停止后端
stop_backend() {
    print_info "停止后端服务..."
    
    local stopped=false
    
    # 从 PID 文件停止
    if [ -f "$PROJECT_DIR/.backend.pid" ]; then
        local pid=$(cat "$PROJECT_DIR/.backend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null
            print_success "后端服务已停止 (PID: $pid)"
            stopped=true
        fi
        rm -f "$PROJECT_DIR/.backend.pid"
    fi
    
    # 停止端口 3001 上的进程
    local pids=$(lsof -ti:3001 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        print_success "后端服务已停止 (端口 3001)"
        stopped=true
    fi
    
    # 停止所有 nest 进程
    ps aux | grep "nest start" | grep smart-dispatch | grep -v grep | awk '{print $2}' | while read pid; do
        kill -9 "$pid" 2>/dev/null || true
        print_success "NestJS 进程已停止 (PID: $pid)"
        stopped=true
    done
    
    if [ "$stopped" = false ]; then
        print_warning "后端服务未运行"
    fi
}

# 停止 Turbo
stop_turbo() {
    print_info "停止 Turbo 进程..."
    
    local stopped=false
    
    # 停止 turbo run dev 进程
    ps aux | grep "turbo run dev" | grep smart-dispatch | grep -v grep | awk '{print $2}' | while read pid; do
        kill -9 "$pid" 2>/dev/null || true
        print_success "Turbo 进程已停止 (PID: $pid)"
        stopped=true
    done
    
    # 停止 turbo daemon
    ps aux | grep "turbo-darwin" | grep smart-dispatch | grep -v grep | awk '{print $2}' | while read pid; do
        kill -9 "$pid" 2>/dev/null || true
        print_success "Turbo daemon 已停止 (PID: $pid)"
        stopped=true
    done
    
    if [ "$stopped" = false ]; then
        print_warning "Turbo 进程未运行"
    fi
}

# 停止 Docker 服务（可选）
stop_docker() {
    print_info "停止 Docker 服务..."
    
    cd "$PROJECT_DIR"
    
    if docker ps | grep -q "smart-dispatch"; then
        docker-compose down
        print_success "Docker 服务已停止"
    else
        print_warning "Docker 服务未运行"
    fi
}

# 强制停止所有相关进程
force_stop_all() {
    print_warning "强制停止所有相关进程..."
    
    # 停止所有与 smart-dispatch 相关的 node 进程
    ps aux | grep "smart-dispatch" | grep -E "(node|npm|nest|vite|turbo)" | grep -v grep | awk '{print $2}' | while read pid; do
        kill -9 "$pid" 2>/dev/null || true
        echo "  已停止进程 PID: $pid"
    done
    
    # 确保端口被释放
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
}

# 显示状态
show_status() {
    echo ""
    echo "======================================"
    echo "  Smart Dispatch Rules - 服务状态"
    echo "======================================"
    echo ""
    
    if lsof -ti:3000 >/dev/null 2>&1; then
        print_error "前端: 仍在运行 ❌"
    else
        print_success "前端: 已停止 ✅"
    fi
    
    if lsof -ti:3001 >/dev/null 2>&1; then
        print_error "后端: 仍在运行 ❌"
    else
        print_success "后端: 已停止 ✅"
    fi
    
    echo ""
    echo "======================================"
}

# 清理 PID 文件
cleanup() {
    rm -f "$PROJECT_DIR/.frontend.pid"
    rm -f "$PROJECT_DIR/.backend.pid"
}

# 显示帮助
show_help() {
    echo "用法: ./scripts/stop-local.sh [选项]"
    echo ""
    echo "选项:"
    echo "  frontend     只停止前端服务"
    echo "  backend      只停止后端服务"
    echo "  docker       停止 Docker 服务"
    echo "  all          停止所有服务 (默认)"
    echo "  force        强制停止所有相关进程"
    echo "  help         显示帮助"
    echo ""
}

# 主函数
main() {
    local mode="${1:-all}"
    
    echo "======================================"
    echo "  Smart Dispatch Rules - 停止服务"
    echo "======================================"
    echo ""
    
    case "$mode" in
        frontend)
            stop_frontend
            ;;
        backend)
            stop_backend
            ;;
        docker)
            stop_docker
            ;;
        force)
            force_stop_all
            stop_turbo
            ;;
        all)
            stop_frontend
            stop_backend
            stop_turbo
            cleanup
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项: $mode"
            show_help
            exit 1
            ;;
    esac
    
    show_status
}

main "$@"
