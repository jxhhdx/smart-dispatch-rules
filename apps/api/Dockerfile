# Smart Dispatch API - Dockerfile
# 用于 Render 等容器平台部署

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache openssl

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 10000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/v1 || exit 1

# 启动命令
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"]
