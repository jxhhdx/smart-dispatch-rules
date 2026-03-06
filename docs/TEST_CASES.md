# 测试用例文档

## 一、规则管理 (Rules)

### 1.1 功能路径测试

| ID | 测试项 | 前置条件 | 操作步骤 | 预期结果 | 优先级 |
|----|--------|----------|----------|----------|--------|
| F-01 | 获取规则列表-默认参数 | 数据库有规则数据 | 调用 findAll({}) | 返回第1页，每页20条，按createdAt倒序 | P0 |
| F-02 | 获取规则列表-分页 | 有多页数据 | 调用 findAll({page: 2, pageSize: 10}) | 正确返回第2页10条数据 | P0 |
| F-03 | 获取规则列表-状态筛选 | 有不同状态规则 | 调用 findAll({status: 1}) | 只返回status=1的规则 | P1 |
| F-04 | 获取规则列表-关键词搜索 | 有匹配规则 | 调用 findAll({keyword: "派单"}) | 返回name或description包含"派单"的规则 | P1 |
| F-05 | 获取规则详情 | 规则存在 | 调用 findOne(validId) | 返回规则详情，包含creator、updater、versions | P0 |
| F-06 | 创建规则 | 用户已登录 | 调用 create(dto, userId) | 创建成功，记录createdBy和updatedBy | P0 |
| F-07 | 更新规则 | 规则存在 | 调用 update(id, dto, userId) | 更新成功，记录updatedBy | P0 |
| F-08 | 删除规则 | 规则存在 | 调用 remove(id) | 删除成功，返回{message: "删除成功"} | P0 |
| F-09 | 更新规则状态-启用 | 规则存在 | 调用 updateStatus(id, 1, userId) | status变为1 | P0 |
| F-10 | 更新规则状态-禁用 | 规则存在 | 调用 updateStatus(id, 0, userId) | status变为0 | P0 |
| F-11 | 获取版本列表 | 规则有多个版本 | 调用 getVersions(ruleId) | 返回所有版本，按version倒序 | P0 |
| F-12 | 创建版本-首次 | 规则无版本 | 调用 createVersion(ruleId, dto, userId) | version=1 | P0 |
| F-13 | 创建版本-递增 | 规则已有版本 | 调用 createVersion(ruleId, dto, userId) | version自动递增 | P0 |
| F-14 | 创建版本-带条件 | dto含conditions | 调用 createVersion(ruleId, dto, userId) | 递归创建所有条件 | P1 |
| F-15 | 创建版本-带动作 | dto含actions | 调用 createVersion(ruleId, dto, userId) | 创建所有动作 | P1 |
| F-16 | 发布版本 | 版本存在 | 调用 publishVersion(ruleId, versionId, userId) | 该版本status=1，其他status=2，rule.versionId更新 | P0 |
| F-17 | 回滚版本 | 版本存在 | 调用 rollbackVersion(ruleId, versionId, userId) | 复用发布逻辑，回滚成功 | P0 |

### 1.2 边界值测试

| ID | 测试项 | 输入值 | 预期结果 | 优先级 |
|----|--------|--------|----------|--------|
| B-01 | 分页-page=0 | page=0 | 视为page=1 | P1 |
| B-02 | 分页-pageSize=1 | pageSize=1 | 返回1条 | P1 |
| B-03 | 分页-超大page | page=999999 | 返回空列表 | P2 |
| B-04 | 空关键词 | keyword="" | 返回全部，不报错 | P1 |
| B-05 | 优先级=0 | priority=0 | 允许创建 | P1 |
| B-06 | 空conditions | conditions=[] | 允许创建，不报错 | P1 |
| B-07 | 空actions | actions=[] | 允许创建，不报错 | P1 |
| B-08 | 嵌套条件深度 | 10层children | 栈不溢出或有限制 | P2 |

### 1.3 异常测试

| ID | 测试项 | 操作 | 预期异常 | 优先级 |
|----|--------|------|----------|--------|
| E-01 | 获取不存在规则 | findOne("invalid-id") | NotFoundException("规则不存在") | P0 |
| E-02 | 更新不存在规则 | update("invalid", dto) | Prisma P2025错误 | P0 |
| E-03 | 删除不存在规则 | remove("invalid") | Prisma P2025错误 | P0 |
| E-04 | 创建版本-规则不存在 | createVersion("invalid", dto) | ForeignKey错误 | P0 |
| E-05 | 发布不存在版本 | publishVersion(ruleId, "invalid") | NotFoundException | P0 |
| E-06 | 数据库断开 | 任意操作 | 抛出异常，不挂起 | P1 |

### 1.4 安全测试

| ID | 测试项 | 操作 | 预期防护 | 优先级 |
|----|--------|------|----------|--------|
| S-01 | SQL注入-name | name="'; DROP TABLE --" | 参数化查询，无注入 | P0 |
| S-02 | 未认证访问 | 无Token调用 | 401 Unauthorized | P0 |

---

## 二、用户认证 (Auth)

### 2.1 功能路径测试

| ID | 测试项 | 前置条件 | 操作步骤 | 预期结果 | 优先级 |
|----|--------|----------|----------|----------|--------|
| F-01 | 正常登录 | 用户存在且status=1 | validateUser(username, password) | 返回用户对象，不含passwordHash | P0 |
| F-02 | 登录更新最后登录时间 | 登录成功 | login(user) | prisma.user.update更新lastLoginAt | P1 |
| F-03 | 获取用户信息 | Token有效 | getProfile(userId) | 返回用户详情，permissions为code数组 | P0 |
| F-04 | 刷新Token | Token有效 | refresh(req) | 返回新access_token | P0 |

### 2.2 异常测试

| ID | 测试项 | 操作 | 预期结果 | 优先级 |
|----|--------|------|----------|--------|
| E-01 | 用户名不存在 | validateUser("notexist", pass) | 返回null | P0 |
| E-02 | 密码错误 | validateUser(user, "wrong") | 返回null | P0 |
| E-03 | 用户禁用 | validateUser(disableUser, pass) | 返回null | P0 |
| E-04 | 获取不存在用户 | getProfile("invalid") | UnauthorizedException("用户不存在") | P0 |
| E-05 | Token过期 | 使用过期token | JwtAuthGuard 401 | P0 |
| E-06 | 无效Token | token="invalid" | JwtAuthGuard 401 | P0 |

### 2.3 边界值测试

| ID | 测试项 | 输入 | 预期结果 | 优先级 |
|----|--------|------|----------|--------|
| B-01 | 空用户名 | "" | @IsNotEmpty校验失败 | P1 |
| B-02 | 空密码 | "" | @IsNotEmpty校验失败 | P1 |
| B-03 | 超长用户名 | 100字符 | 正常处理 | P2 |

---

## 三、角色管理 (Roles)

### 3.1 功能路径测试

| ID | 测试项 | 操作 | 预期结果 | 优先级 |
|----|--------|------|----------|--------|
| F-01 | 获取角色列表 | findAll() | 返回角色，含permissions和_count.users | P0 |
| F-02 | 获取角色详情 | findOne(id) | 返回角色及权限列表 | P0 |
| F-03 | 获取权限列表 | findAllPermissions() | 返回status=1的权限，按sortOrder排序 | P0 |
| F-04 | 创建角色-带权限 | create({permissionIds: [...]}) | 创建角色并关联权限 | P0 |
| F-05 | 创建角色-无权限 | create({}) | 创建空权限角色 | P1 |
| F-06 | 更新角色权限 | update(id, {permissionIds: [...]}) | 先deleteMany旧权限，再create新关联 | P0 |
| F-07 | 删除角色 | remove(id) | 删除成功 | P0 |

### 3.2 异常测试

| ID | 测试项 | 操作 | 预期异常 | 优先级 |
|----|--------|------|----------|--------|
| E-01 | 获取不存在角色 | findOne("invalid") | NotFoundException("角色不存在") | P0 |
| E-02 | 删除有用户的角色 | remove(id)角色下有用户 | Error("该角色下还有用户，无法删除") | P0 |
| E-03 | 创建-无效权限ID | create({permissionIds: ["invalid"]}) | ForeignKey错误 | P0 |

---

## 四、用户管理 (Users)

### 4.1 功能路径测试

| ID | 测试项 | 操作 | 预期结果 | 优先级 |
|----|--------|------|----------|--------|
| F-01 | 获取用户列表 | findAll({}) | 返回分页列表，不含passwordHash | P0 |
| F-02 | 获取用户列表-关键词 | findAll({keyword: "张"}) | 匹配username/realName/email | P1 |
| F-03 | 获取用户详情 | findOne(id) | 返回用户，不含passwordHash | P0 |
| F-04 | 创建用户 | create(dto) | bcrypt加密密码，返回不含passwordHash | P0 |
| F-05 | 更新用户 | update(id, dto) | 更新成功 | P0 |
| F-06 | 删除用户 | remove(id) | 删除成功 | P0 |
| F-07 | 更新状态-禁用 | updateStatus(id, 0) | status=0 | P0 |
| F-08 | 更新状态-启用 | updateStatus(id, 1) | status=1 | P0 |

### 4.2 异常测试

| ID | 测试项 | 操作 | 预期异常 | 优先级 |
|----|--------|------|----------|--------|
| E-01 | 获取不存在用户 | findOne("invalid") | NotFoundException("用户不存在") | P0 |
| E-02 | 创建-用户名重复 | create({username: exist}) | Prisma Unique错误 | P0 |
| E-03 | 创建-邮箱重复 | create({email: exist}) | Prisma Unique错误 | P0 |

### 4.3 安全测试

| ID | 测试项 | 操作 | 预期防护 | 优先级 |
|----|--------|------|----------|--------|
| S-01 | 禁止返回passwordHash | 任意查询用户 | 返回对象不含passwordHash | P0 |
| S-02 | SQL注入防护 | keyword="' OR '1'='1" | 参数化查询 | P0 |

---

## 五、日志审计 (Logs)

### 5.1 功能路径测试

| ID | 测试项 | 操作 | 预期结果 | 优先级 |
|----|--------|------|----------|--------|
| F-01 | 获取操作日志 | findSystemLogs({}) | 分页返回，按时间倒序 | P0 |
| F-02 | 操作日志-模块筛选 | findSystemLogs({module: "rules"}) | 只返回该模块日志 | P1 |
| F-03 | 操作日志-时间范围 | findSystemLogs({startDate, endDate}) | 区间内日志 | P1 |
| F-04 | 获取登录日志 | findLoginLogs({}) | 分页返回 | P0 |
| F-05 | 创建操作日志 | createSystemLog(data) | 成功记录 | P0 |
| F-06 | 创建登录日志 | createLoginLog(data) | 成功记录 | P0 |

### 5.2 边界值测试

| ID | 测试项 | 输入 | 预期结果 | 优先级 |
|----|--------|------|----------|--------|
| B-01 | 单天时间范围 | start=end="2024-01-01" | 返回当天数据 | P1 |
| B-02 | 跨年范围 | 2023-12-31至2024-01-01 | 正确筛选 | P1 |
| B-03 | 开始>结束 | start>end | 返回空列表 | P1 |

---

## 六、测试执行清单

### 6.1 单元测试执行

```bash
# 规则管理
npm run test:unit -- rules.service.spec.ts

# 用户认证
npm run test:unit -- auth.service.spec.ts

# 角色管理
npm run test:unit -- roles.service.spec.ts

# 用户管理
npm run test:unit -- users.service.spec.ts

# 日志审计
npm run test:unit -- logs.service.spec.ts
```

### 6.2 E2E测试执行

```bash
# 规则管理
npm run test:e2e -- rules.e2e-spec.ts

# 用户认证
npm run test:e2e -- auth.e2e-spec.ts

# 用户管理
npm run test:e2e -- users.e2e-spec.ts
```

### 6.3 覆盖率检查

```bash
npm run test:cov
```

目标覆盖率：
- Statements: ≥ 80%
- Branches: ≥ 70%
- Functions: ≥ 80%
- Lines: ≥ 80%

---

## 七、当前测试缺口

| 模块 | 已覆盖 | 缺口 | 优先级 |
|------|--------|------|--------|
| Rules | F-01~F-08, F-16, E-01 | F-09~F-15(版本管理), B类, S类 | F-09~F-15: P0, B/S: P1 |
| Auth | F-01~F-04, E-01~E-04 | E-05~E-06(Token), B类, S类 | E-05~E-06: P0, B/S: P1 |
| Roles | F-01~F-03 | F-04~F-07(CRUD), E类 | F-04~F-07: P0, E: P0 |
| Users | F-01~F-03, E-01 | F-04~F-08, E-02~E-03, S类 | F-04~F-08: P0, E/S: P0 |
| Logs | F-01, F-04 | F-02~F-03, F-05~F-06, B类 | F-02~F-06: P0, B: P1 |

**建议优先补充**：Rules版本管理、Roles完整CRUD、Users创建和删除、Logs条件筛选
