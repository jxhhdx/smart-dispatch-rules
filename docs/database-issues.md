# 数据库问题追踪记录

## 记录说明
本文档用于追踪和记录数据库相关的异常问题，以便分析是否为系统性问题。

---

## Issue #1: admin 用户数据丢失

### 发生时间
- **首次发现**: 2026-02-10 23:43
- **报告者**: 用户反馈登录密码 admin123 失效

### 问题现象
1. 使用 curl 请求登录接口返回密码错误
2. 查询数据库时提示 `Error: P1014 - The underlying table for model 'User' does not exist`
3. 运行 `prisma db seed` 后问题解决，说明数据确实缺失

### 环境信息
```
数据库: PostgreSQL (localhost:5432)
数据库名: smart_dispatch
后端端口: 3001
前端端口: 3000 (代理到 3001)
```

### 当时进行的操作
- 添加了前端测试文件（6个 .test.tsx 文件）
- 添加了后端测试文件（8个 .spec.ts 文件）
- 添加了国际化翻译文件
- **没有修改**任何与认证、密码相关的代码

### 排除的代码原因
通过 `git diff` 验证，以下文件未被修改：
- `apps/api/prisma/seed.ts` - 数据库种子文件
- `apps/api/src/modules/auth/auth.service.ts` - 认证服务
- `apps/api/src/modules/auth/auth.controller.ts` - 认证控制器
- `apps/api/src/modules/users/users.service.ts` - 用户服务

### 可能的原因分析

#### 可能性 1: 数据库被重置（最可能）
- 之前可能运行过 `prisma migrate reset`
- 或者手动删除了表数据
- Docker 容器可能被重新创建

#### 可能性 2: 测试覆盖了数据
- 某些测试可能直接操作了数据库
- E2E 测试可能清理了数据

#### 可能性 3: 多数据库实例混淆
- 可能连接到了不同的 PostgreSQL 实例
- 环境变量可能临时指向了其他数据库

### 解决方案
```bash
cd apps/api
npx prisma db seed
```

### 验证结果
重新 seed 后，登录正常返回 token：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "username": "admin", ... }
  }
}
```

### 预防措施
1. **定期备份**: 定期导出数据库备份
   ```bash
   pg_dump -h localhost -U postgres smart_dispatch > backup.sql
   ```

2. **测试环境隔离**: 确保 E2E 测试使用独立的数据库
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_dispatch_test" npm run test:e2e
   ```

3. **监控登录失败**: 记录连续的登录失败日志

4. **seed 数据幂等性**: seed.ts 使用了 `upsert`，可以安全地重复运行

### 追踪检查项
- [ ] 下次部署后检查 admin 用户是否存在
- [ ] 运行 E2E 测试后检查 admin 用户是否存在
- [ ] 运行 `prisma migrate` 命令后检查数据完整性
- [ ] 观察 1 周内是否再次出现此问题

### 相关命令
```bash
# 检查 admin 用户是否存在
curl -s -X POST 'http://localhost:3000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq '.code'

# 如果返回 200 则正常，返回 401 则密码错误

# 快速修复
cd apps/api && npx prisma db seed
```

---

## 更新记录

| 日期 | 事件 | 处理人 |
|------|------|--------|
| 2026-02-10 | 首次记录 admin 用户丢失问题 | Kimi |

---

## 备注
如果此问题再次出现，请记录：
1. 上次修复后的操作记录
2. 数据库日志
3. Docker 容器状态
4. 是否有其他人访问过数据库
