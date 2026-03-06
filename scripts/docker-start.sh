#!/bin/bash

# Smart Dispatch Rules - Docker 本地部署脚本
# 用法: ./scripts/docker-start.sh [command]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助
show_help() {
    cat << EOF
Smart Dispatch Rules - Docker 部署脚本

用法:
    ./scripts/docker-start.sh [command]

命令:
    up          启动所有服务（后台运行）
    up-log      启动所有服务（前台运行，查看日志）
    down        停止并移除所有服务
    restart     重启所有服务
    build       重新构建所有镜像
    status      查看服务状态
    logs        查看日志
    clean       清理所有数据和镜像（谨慎使用）
    seed        重新执行数据库种子

示例:
    ./scripts/docker-start.sh up        # 启动服务
    ./scripts/docker-start.sh logs      # 查看日志
    ./scripts/docker-start.sh down      # 停止服务

访问地址:
    前端: http://localhost
    后端 API: http://localhost:3001/api/v1
    API 文档: http://localhost:3001/api/docs

默认账号:
    用户名: admin
    密码: admin123
EOF
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 获取 docker compose 命令
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# 启动服务（后台）
cmd_up() {
    info "正在启动 Smart Dispatch Rules 服务..."
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD up -d
    success "服务已启动！"
    echo ""
    echo "访问地址:"
    echo "  前端:     http://localhost"
    echo "  API:      http://localhost:3001/api/v1"
    echo "  API 文档: http://localhost:3001/api/docs"
    echo ""
    echo "默认账号:"
    echo "  用户名: admin"
    echo "  密码: admin123"
}

# 启动服务（前台）
cmd_up_log() {
    info "正在启动 Smart Dispatch Rules 服务（前台模式）..."
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD up
}

# 停止服务
cmd_down() {
    info "正在停止服务..."
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD down
    success "服务已停止"
}

# 重启服务
cmd_restart() {
    info "正在重启服务..."
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD restart
    success "服务已重启"
}

# 重新构建
cmd_build() {
    info "正在重新构建镜像..."
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD build --no-cache
    success "镜像构建完成"
}

# 查看状态
cmd_status() {
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD ps
}

# 查看日志
cmd_logs() {
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD logs -f
}

# 清理
cmd_clean() {
    warning "这将删除所有数据，包括数据库数据！"
    read -p "确定要继续吗？请输入 'yes' 确认: " confirm
    if [ "$confirm" = "yes" ]; then
        COMPOSE_CMD=$(get_compose_cmd)
        $COMPOSE_CMD down -v --rmi all
        success "清理完成"
    else
        info "已取消"
    fi
}

# 重新种子
cmd_seed() {
    info "正在执行数据库种子..."
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD exec api npx prisma db seed
    success "种子执行完成"
}

# 主函数
main() {
    check_docker

    case "${1:-up}" in
        up)
            cmd_up
            ;;
        up-log)
            cmd_up_log
            ;;
        down)
            cmd_down
            ;;
        restart)
            cmd_restart
            ;;
        build)
            cmd_build
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs
            ;;
        clean)
            cmd_clean
            ;;
        seed)
            cmd_seed
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
