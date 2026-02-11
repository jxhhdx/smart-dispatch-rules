# 规则管理测试用例

> Rules Module - 规则CRUD、版本管理、条件树

---

## 模块概览

| 属性 | 值 |
|-----|---|
| 模块 | 规则管理 (rules) |
| 文件 | `apps/api/src/modules/rules/` |
| 核心功能 | 规则CRUD、版本管理、条件树、发布/回滚 |
| 测试用例数 | 56 |
| 优先级分布 | P0: 20, P1: 20, P2: 16 |

---

## 1. 功能路径测试 (Functional)

### 1.1 规则 CRUD

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| RULE-F-01 | 创建规则 | 名称、类型、优先级 | 返回创建的规则 | P0 |
| RULE-F-02 | 查询规则列表 | page, pageSize | 返回分页列表 | P0 |
| RULE-F-03 | 查询规则详情 | 规则ID | 返回规则+版本信息 | P0 |
| RULE-F-04 | 更新规则 | 规则ID+更新数据 | 返回更新后的规则 | P0 |
| RULE-F-05 | 删除规则 | 规则ID | 删除成功 | P0 |
| RULE-F-06 | 更新规则状态 | status=0/1/2 | 状态更新成功 | P1 |

### 1.2 版本管理

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| RULE-F-10 | 创建版本 | 规则ID+配置 | 返回新版本(v+1) | P0 |
| RULE-F-11 | 查询版本列表 | 规则ID | 返回所有版本 | P0 |
| RULE-F-12 | 发布版本 | 规则ID+版本ID | 版本变为已发布 | P0 |
| RULE-F-13 | 回滚版本 | 规则ID+版本ID | 指定版本变为已发布 | P0 |
| RULE-F-14 | 创建版本带条件 | conditions | 条件树正确存储 | P1 |
| RULE-F-15 | 创建版本带动作 | actions | 动作正确存储 | P1 |

**版本管理测试:**
```typescript
// RULE-F-10: 创建版本（自动递增）
describe('createVersion', () => {
  it('should create new version with auto-increment', async () => {
    // 模拟当前最新版本为 v3
    jest.spyOn(prisma.ruleVersion, 'findFirst').mockResolvedValue({ version: 3 } as any);
    
    const result = await rulesService.createVersion('rule-id', { configJson: {} }, 'user-id');
    expect(result.version).toBe(4);  // v3 + 1 = v4
  });
});

// RULE-F-12: 发布版本
describe('publishVersion', () => {
  it('should publish version and update rule', async () => {
    await rulesService.publishVersion('rule-id', 'version-id', 'user-id');
    
    // 验证其他版本被下线
    expect(prisma.ruleVersion.updateMany).toHaveBeenCalledWith({
      where: { ruleId: 'rule-id', status: 1 },
      data: { status: 2 },
    });
    
    // 验证指定版本被发布
    expect(prisma.ruleVersion.update).toHaveBeenCalledWith({
      where: { id: 'version-id' },
      data: expect.objectContaining({ status: 1 }),
    });
  });
});
```

### 1.3 条件树

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| RULE-F-20 | 单层条件 | [condition] | 条件正确存储 | P1 |
| RULE-F-21 | 多层嵌套条件 | [and:[cond1, or:[cond2, cond3]]] | 嵌套结构正确存储 | P1 |
| RULE-F-22 | 条件-字段操作 | field, operator, value | 正确解析执行 | P1 |
| RULE-F-23 | 条件-逻辑类型 | AND/OR | 逻辑正确组合 | P1 |

**条件树测试数据:**
```typescript
const conditionTree = {
  conditions: [
    {
      conditionType: 'field',
      field: 'distance',
      operator: 'less_than',
      value: '5000',
      valueType: 'number',
      logicType: 'AND',
    },
    {
      conditionType: 'group',
      logicType: 'OR',
      children: [
        {
          conditionType: 'field',
          field: 'riderRating',
          operator: 'greater_than',
          value: '4.5',
          valueType: 'number',
        },
        {
          conditionType: 'field',
          field: 'isVIP',
          operator: 'equals',
          value: 'true',
          valueType: 'boolean',
        },
      ],
    },
  ],
};
```

---

## 2. 边界值测试 (Boundary)

### 2.1 规则名称

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| RULE-B-01 | 名称-空 | `""` | 400 必填校验 | P0 |
| RULE-B-02 | 名称-极短 | `"a"` | 创建成功 | P1 |
| RULE-B-03 | 名称-正常 | `"距离优先规则"` | 创建成功 | P0 |
| RULE-B-04 | 名称-超长 | 200位字符 | 创建成功或截断 | P1 |

### 2.2 规则类型

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| RULE-B-10 | 类型-距离 | `"distance"` | 创建成功 | P0 |
| RULE-B-11 | 类型-工作量 | `"workload"` | 创建成功 | P0 |
| RULE-B-12 | 类型-评分 | `"rating"` | 创建成功 | P0 |
| RULE-B-13 | 类型-紧急度 | `"urgency"` | 创建成功 | P0 |
| RULE-B-14 | 类型-订单价值 | `"order_value"` | 创建成功 | P0 |
| RULE-B-15 | 类型-复合 | `"composite"` | 创建成功 | P0 |
| RULE-B-16 | 类型-无效 | `"invalid_type"` | 400 校验失败 | P0 |
| RULE-B-17 | 类型-空 | `""` | 400 必填校验 | P0 |

### 2.3 优先级

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| RULE-B-20 | 优先级-0 | `0` | 创建成功 | P1 |
| RULE-B-21 | 优先级-负数 | `-1` | 400 校验失败 | P1 |
| RULE-B-22 | 优先级-极大值 | `999999` | 创建成功 | P2 |
| RULE-B-23 | 优先级-小数 | `1.5` | 截断或允许 | P2 |

### 2.4 版本管理边界

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| RULE-B-30 | 版本号递增 | 当前v3，创建v4 | 自动v4 | P0 |
| RULE-B-31 | 首次创建版本 | 无现有版本 | 自动v1 | P0 |
| RULE-B-32 | 条件-空数组 | `[]` | 允许或提示 | P1 |
| RULE-B-33 | 条件-极大嵌套 | 10层嵌套 | 允许或限制 | P2 |

---

## 3. 异常测试 (Exception)

### 3.1 资源异常

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| RULE-E-01 | 查询不存在的规则 | id="not-exist" | 404 NotFoundException | P0 |
| RULE-E-02 | 更新不存在的规则 | id="not-exist" | 404 NotFoundException | P0 |
| RULE-E-03 | 删除不存在的规则 | id="not-exist" | 404 NotFoundException | P0 |
| RULE-E-04 | 创建版本-规则不存在 | ruleId="not-exist" | 404 外键错误 | P0 |
| RULE-E-05 | 发布版本-版本不存在 | versionId="not-exist" | 404 NotFoundException | P0 |
| RULE-E-06 | 发布版本-规则不匹配 | 版本属于其他规则 | 400 错误 | P1 |

### 3.2 业务规则异常

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| RULE-E-10 | 发布已发布版本 | version.status=1 | 幂等或提示 | P1 |
| RULE-E-11 | 回滚未发布版本 | version.status=0 | 允许或提示 | P2 |
| RULE-E-12 | 删除有发布版本的规则 | 有published版本 | 级联删除或阻止 | P1 |

### 3.3 数据异常

| ID | 场景 | 错误输入 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| RULE-E-20 | 无效条件格式 | `{ invalid: "data" }` | 400 校验失败 | P1 |
| RULE-E-21 | 无效动作格式 | `{ invalid: "data" }` | 400 校验失败 | P1 |
| RULE-E-22 | 超大配置JSON | >10MB | 400 大小限制 | P2 |

---

## 4. 性能测试 (Performance)

| ID | 场景 | 测试条件 | 预期指标 | 优先级 |
|----|------|---------|---------|--------|
| RULE-P-01 | 列表查询 | page=1, pageSize=20 | < 150ms | P1 |
| RULE-P-02 | 详情查询-含版本 | 多个版本 | < 200ms | P1 |
| RULE-P-03 | 创建版本 | 含100个条件 | < 500ms | P1 |
| RULE-P-04 | 发布版本 | 含事务操作 | < 300ms | P1 |
| RULE-P-05 | 并发创建版本 | 10并发 | 无重复版本号 | P2 |

---

## 5. 安全测试 (Security)

| ID | 场景 | 测试输入 | 预期防护 | 优先级 |
|----|------|---------|---------|--------|
| RULE-S-01 | 配置JSON注入 | `{"$gt": ""}` | 严格类型校验 | P1 |
| RULE-S-02 | 超大配置攻击 | 100MB JSON | 大小限制拒绝 | P2 |
| RULE-S-03 | 越权修改规则 | 其他用户创建的规则 | 403 权限检查 | P1 |
| RULE-S-04 | 越权发布规则 | 无发布权限 | 403 权限检查 | P1 |
| RULE-S-05 | 循环引用条件 | 条件A→B→A | 检测并拒绝 | P2 |

---

## 6. 执行清单

### P0 必测项（20个）

- [ ] RULE-F-01~06 规则CRUD
- [ ] RULE-F-10~13 版本管理核心
- [ ] RULE-B-01 名称空值
- [ ] RULE-B-10~17 规则类型
- [ ] RULE-B-30~31 版本号边界
- [ ] RULE-E-01~06 资源异常
- [ ] RULE-S-03~04 越权检查

---

*文档结束 - 规则管理共56个测试用例*
