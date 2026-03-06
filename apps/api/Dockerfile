# Smart Dispatch API - Dockerfile
# 用于本地 Docker 部署

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache openssl wget

# 先复制 prisma schema（因为 postinstall 需要它）
COPY prisma ./prisma/

# 复制 package.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，因为需要构建）
RUN npm install

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1 || exit 1

# 启动命令
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
