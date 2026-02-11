# 用户管理测试用例

> Users Module - 用户CRUD、分页查询、状态管理

---

## 模块概览

| 属性 | 值 |
|-----|---|
| 模块 | 用户管理 (users) |
| 文件 | `apps/api/src/modules/users/` |
| 核心功能 | 用户CRUD、分页查询、状态更新、角色关联 |
| 测试用例数 | 42 |
| 优先级分布 | P0: 16, P1: 16, P2: 10 |

---

## 1. 功能路径测试 (Functional)

### 1.1 CRUD 正常流程

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| USER-F-01 | 创建用户 | 有效用户信息 | 返回创建的用户（不含密码） | P0 |
| USER-F-02 | 查询用户列表 | page=1, pageSize=10 | 返回分页用户列表 | P0 |
| USER-F-03 | 查询单个用户 | 有效用户ID | 返回用户详情 | P0 |
| USER-F-04 | 更新用户 | 用户ID+更新数据 | 返回更新后的用户 | P0 |
| USER-F-05 | 删除用户 | 有效用户ID | 返回删除成功 | P0 |
| USER-F-06 | 更新用户状态 | 用户ID+status=0/1 | 返回更新后的用户 | P1 |

**测试代码示例:**
```typescript
// USER-F-01: 创建用户
describe('create', () => {
  it('should create user with hashed password', async () => {
    const createDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    };
    const result = await usersService.create(createDto);
    expect(result.username).toBe('newuser');
    expect(result).not.toHaveProperty('passwordHash');
  });
});
```

### 1.2 查询功能

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| USER-F-07 | 关键词搜索-用户名 | keyword="admin" | 匹配用户名的用户列表 | P1 |
| USER-F-08 | 关键词搜索-真实姓名 | keyword="张三" | 匹配真实姓名的用户列表 | P1 |
| USER-F-09 | 关键词搜索-邮箱 | keyword="test@" | 匹配邮箱的用户列表 | P1 |
| USER-F-10 | 分页查询-第一页 | page=1, pageSize=10 | 返回前10条 | P1 |
| USER-F-11 | 分页查询-中间页 | page=5, pageSize=10 | 返回第41-50条 | P1 |
| USER-F-12 | 分页查询-最后一页 | page=最后一页 | 返回剩余记录 | P1 |
| USER-F-13 | 分页查询-超出范围 | page=9999 | 返回空列表 | P1 |

### 1.3 关联功能

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| USER-F-14 | 创建用户带角色 | roleId="xxx" | 用户关联指定角色 | P1 |
| USER-F-15 | 更新用户角色 | roleId="new-role" | 用户角色更新 | P1 |
| USER-F-16 | 查询包含角色信息 | 任意查询 | 返回包含 role 对象 | P1 |

---

## 2. 边界值测试 (Boundary)

### 2.1 用户名字段

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| USER-B-01 | 用户名-最短 | `"abc"` (3位) | 创建成功 | P0 |
| USER-B-02 | 用户名-最短-1 | `"ab"` (2位) | 400 长度校验失败 | P0 |
| USER-B-03 | 用户名-最长 | 50位字符 | 创建成功 | P1 |
| USER-B-04 | 用户名-空 | `""` | 400 必填校验失败 | P0 |
| USER-B-05 | 用户名-重复 | 已存在的用户名 | 400 唯一约束错误 | P0 |

### 2.2 密码字段

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| USER-B-10 | 密码-最短 | `"123456"` (6位) | 创建成功 | P0 |
| USER-B-11 | 密码-最短-1 | `"12345"` (5位) | 400 长度校验失败 | P0 |
| USER-B-12 | 密码-空 | `""` | 400 必填校验失败 | P0 |

### 2.3 邮箱字段

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| USER-B-20 | 邮箱-标准格式 | `"user@example.com"` | 创建成功 | P0 |
| USER-B-21 | 邮箱-子域名 | `"user@sub.example.com"` | 创建成功 | P1 |
| USER-B-22 | 邮箱-无效格式 | `"invalid-email"` | 400 格式校验失败 | P0 |
| USER-B-23 | 邮箱-缺失@ | `"userexample.com"` | 400 格式校验失败 | P0 |
| USER-B-24 | 邮箱-缺失域名 | `"user@"` | 400 格式校验失败 | P0 |
| USER-B-25 | 邮箱-空 | `""` | 400 必填校验失败 | P0 |
| USER-B-26 | 邮箱-重复 | 已存在的邮箱 | 400 唯一约束错误 | P0 |

**邮箱格式测试数据:**
```typescript
const validEmails = [
  'user@example.com',
  'user.name@example.com',
  'user+tag@example.com',
  'user@sub.example.com',
  'user@example.co.uk',
  '123@example.com',
  'user@123.com',
];

const invalidEmails = [
  'invalid-email',
  '@example.com',
  'user@',
  'user@.com',
  'user@example.',
  'user name@example.com',
  '',
];
```

### 2.4 分页参数

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| USER-B-30 | 页码-0 | page=0 | 调整为1或400错误 | P1 |
| USER-B-31 | 页码-负数 | page=-1 | 400 参数错误 | P1 |
| USER-B-32 | 页码-1 | page=1 | 返回第一页 | P0 |
| USER-B-33 | 页码-极大值 | page=999999 | 返回空列表 | P1 |
| USER-B-34 | 页大小-0 | pageSize=0 | 返回空或最小值 | P1 |
| USER-B-35 | 页大小-负数 | pageSize=-10 | 400 参数错误 | P1 |
| USER-B-36 | 页大小-标准值 | pageSize=10 | 返回10条 | P0 |
| USER-B-37 | 页大小-最大值 | pageSize=1000 | 截断或允许 | P2 |

---

## 3. 异常测试 (Exception)

### 3.1 输入异常

| ID | 场景 | 错误输入 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| USER-E-01 | null 用户名 | null | 400 类型校验失败 | P0 |
| USER-E-02 | 数字用户名 | 123 | 400 类型校验失败 | P1 |
| USER-E-03 | 对象用户名 | { name: "test" } | 400 类型校验失败 | P1 |
| USER-E-04 | 无效邮箱格式 | "not-an-email" | 400 格式校验失败 | P0 |
| USER-E-05 | 超长邮箱 | "a"*250+"@test.com" | 400 长度校验失败 | P1 |
| USER-E-06 | 无效 roleId | "non-existent-role" | 400 或 404 外键错误 | P1 |
| USER-E-07 | 创建时提供 passwordHash | { passwordHash: "xxx" } | 忽略或400 | P2 |

### 3.2 资源异常

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| USER-E-20 | 查询不存在的用户 | id="not-exist" | 404 NotFoundException | P0 |
| USER-E-21 | 更新不存在的用户 | id="not-exist" | 404 NotFoundException | P0 |
| USER-E-22 | 删除不存在的用户 | id="not-exist" | 404 NotFoundException | P0 |
| USER-E-23 | 删除系统保留用户 | 系统管理员 | 400 或 403 禁止删除 | P1 |

### 3.3 并发异常

| ID | 场景 | 测试方法 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| USER-E-30 | 并发创建同名用户 | 同时创建同名 | 只有一个成功 | P1 |
| USER-E-31 | 并发更新同一用户 | 同时修改 | 最后写入生效 | P1 |
| USER-E-32 | 读取时用户被删除 | 查询后删除 | 正常处理或404 | P2 |

**资源异常测试:**
```typescript
// USER-E-20: 查询不存在的用户
describe('findOne', () => {
  it('should throw NotFoundException for non-existent user', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    await expect(usersService.findOne('not-exist')).rejects.toThrow(NotFoundException);
  });
});
```

---

## 4. 性能测试 (Performance)

| ID | 场景 | 测试条件 | 预期指标 | 优先级 |
|----|------|---------|---------|--------|
| USER-P-01 | 列表查询 | page=1, pageSize=20 | < 100ms | P1 |
| USER-P-02 | 列表查询-大页大小 | pageSize=100 | < 200ms | P1 |
| USER-P-03 | 关键词搜索 | keyword 有索引 | < 200ms | P1 |
| USER-P-04 | 用户创建 | 单条插入 | < 150ms | P1 |
| USER-P-05 | 批量查询压力 | 1000并发查询 | 平均<300ms | P2 |
| USER-P-06 | 大数据量分页 | 100万用户 | 末页查询<500ms | P2 |

---

## 5. 安全测试 (Security)

| ID | 场景 | 测试输入 | 预期防护 | 优先级 |
|----|------|---------|---------|--------|
| USER-S-01 | SQL 注入-用户名 | `"'; DROP TABLE users; --"` | 参数化查询 | P0 |
| USER-S-02 | SQL 注入-邮箱 | `"' OR '1'='1"` | 参数化查询 | P0 |
| USER-S-03 | XSS-用户名 | `"<script>alert(1)</script>"` | 输出转义 | P1 |
| USER-S-04 | XSS-真实姓名 | `"<img src=x onerror=alert(1)>"` | 输出转义 | P1 |
| USER-S-05 | 越权访问-查看他人 | 其他用户ID | 403 权限检查 | P1 |
| USER-S-06 | 越权修改-修改他人 | 其他用户ID | 403 权限检查 | P0 |
| USER-S-07 | 密码明文存储检查 | 创建后查DB | 必须是哈希值 | P0 |
| USER-S-08 | 敏感字段过滤 | API 响应 | 不包含 passwordHash | P0 |
| USER-S-09 | 权限提升尝试 | roleId=admin | 只有超管可修改 | P1 |

**安全检查测试:**
```typescript
// USER-S-07: 密码必须哈希存储
describe('security', () => {
  it('should store password as hash', async () => {
    const createSpy = jest.spyOn(prisma.user, 'create');
    await usersService.create({ username: 'test', email: 'test@test.com', password: 'plain123' });
    
    const callArg = createSpy.mock.calls[0][0];
    expect(callArg.data.passwordHash).toBeDefined();
    expect(callArg.data.passwordHash).not.toBe('plain123');
    expect(callArg.data.passwordHash).toMatch(/^\$2[aby]\$/);  // bcrypt hash
  });
});

// USER-S-08: 响应不包含密码哈希
describe('response filtering', () => {
  it('should not return passwordHash in response', async () => {
    const result = await usersService.findOne('user-id');
    expect(result).not.toHaveProperty('passwordHash');
  });
});
```

---

## 6. 测试数据

### 6.1 有效用户数据

```typescript
export const validUserData = {
  create: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    realName: '测试用户',
    phone: '13800138000',
    roleId: 'role-id-1',
  },
  update: {
    email: 'updated@example.com',
    realName: '更新后的名字',
    phone: '13900139000',
  },
};
```

### 6.2 边界测试数据

```typescript
export const boundaryTestData = {
  usernames: {
    min: 'abc',           // 3 chars
    minMinusOne: 'ab',    // 2 chars - should fail
    max: 'a'.repeat(50),  // 50 chars
    empty: '',
  },
  passwords: {
    min: '123456',        // 6 chars
    minMinusOne: '12345', // 5 chars - should fail
    empty: '',
  },
  emails: {
    valid: ['test@test.com', 'a@b.co', 'user+tag@example.com'],
    invalid: ['invalid', '@test.com', 'user@', 'user@.com', ''],
  },
};
```

---

## 7. 执行清单

### P0 必测项（16个）

- [ ] USER-F-01 创建用户
- [ ] USER-F-02 查询用户列表
- [ ] USER-F-03 查询单个用户
- [ ] USER-F-04 更新用户
- [ ] USER-F-05 删除用户
- [ ] USER-B-01 用户名最短边界
- [ ] USER-B-02 用户名最短-1
- [ ] USER-B-04 用户名空
- [ ] USER-B-05 用户名重复
- [ ] USER-B-10 密码最短
- [ ] USER-B-11 密码最短-1
- [ ] USER-B-20~26 邮箱各种边界
- [ ] USER-E-20~22 资源不存在
- [ ] USER-S-01~02 SQL注入
- [ ] USER-S-07 密码哈希存储
- [ ] USER-S-08 敏感字段过滤

### 已有测试覆盖

已有测试: `apps/api/test/unit/users/users.service.spec.ts`

| 用例ID | 状态 |
|-------|------|
| USER-F-01~06 | ✅ 已覆盖 |
| USER-B-01~05 | ⚠️ 部分覆盖 |
| USER-E-20~22 | ✅ 已覆盖 |
| USER-S-01~09 | ❌ 需补充 |

---

*文档结束 - 用户管理共42个测试用例*
