# 规则增强功能测试用例

> Rule Enhancements - 状态管理、复制、导出、复杂条件配置

---

## 模块概览

| 属性 | 值 |
|-----|---|
| 模块 | 规则增强功能 (rule-enhancements) |
| 相关文件 | `apps/api/src/modules/rules/`, `apps/web/src/pages/rules/` |
| 核心功能 | 状态管理、规则复制、规则导出、复杂条件编辑器 |
| 测试用例数 | 68 |
| 优先级分布 | P0: 24, P1: 28, P2: 16 |

---

## 1. 规则状态管理 (Rule Status Management)

### 1.1 功能路径测试

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| RS-F-01 | 启用规则 | status=1 (enabled) | 规则变为启用状态 | P0 |
| RS-F-02 | 禁用规则 | status=0 (disabled) | 规则变为禁用状态 | P0 |
| RS-F-03 | Switch组件切换状态 | 点击Switch开关 | 状态切换成功，列表刷新 | P0 |
| RS-F-04 | Action按钮启用 | 点击"启用"按钮 | 规则启用成功 | P0 |
| RS-F-05 | Action按钮禁用 | 点击"禁用"按钮 | 规则禁用成功 | P0 |
| RS-F-06 | 批量启用规则 | 选择多条规则，批量启用 | 所选规则全部启用 | P1 |
| RS-F-07 | 批量禁用规则 | 选择多条规则，批量禁用 | 所选规则全部禁用 | P1 |
| RS-F-08 | 状态变更后自动刷新 | 修改状态后 | 列表数据自动刷新 | P1 |
| RS-F-09 | 状态变更操作日志 | 修改规则状态 | 操作日志正确记录 | P1 |

**状态管理测试代码:**
```typescript
// RS-F-01: 启用规则
describe('enableRule', () => {
  it('should enable rule successfully', async () => {
    const result = await rulesService.updateStatus('rule-id', 1, 'user-id');
    expect(result.status).toBe(1);
    expect(prisma.rule.update).toHaveBeenCalledWith({
      where: { id: 'rule-id' },
      data: { status: 1, updatedBy: 'user-id', updatedAt: expect.any(Date) },
    });
  });
});

// RS-F-03: Switch组件切换状态
describe('RuleStatusSwitch', () => {
  it('should toggle status when switch clicked', async () => {
    render(<RuleStatusSwitch ruleId="rule-1" initialStatus={0} />);
    const switchEl = screen.getByRole('switch');
    
    fireEvent.click(switchEl);
    
    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith('rule-1', 1);
      expect(message.success).toHaveBeenCalledWith('规则已启用');
    });
  });
});
```

### 1.2 边界值测试

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| RS-B-01 | 状态-无效值 | status=3 | 400 校验失败 | P0 |
| RS-B-02 | 状态-负数 | status=-1 | 400 校验失败 | P0 |
| RS-B-03 | 状态-字符串数字 | status="1" | 转换后成功或400 | P1 |
| RS-B-04 | 已经是启用状态再次启用 | status=1→1 | 幂等，返回成功 | P1 |
| RS-B-05 | 已经是禁用状态再次禁用 | status=0→0 | 幂等，返回成功 | P1 |

### 1.3 异常测试

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| RS-E-01 | 修改不存在的规则状态 | id="not-exist" | 404 NotFoundException | P0 |
| RS-E-02 | 无权限修改状态 | 普通用户修改他人规则 | 403 Forbidden | P0 |
| RS-E-03 | 网络中断后重试 | 模拟网络超时 | 正确错误提示，可重试 | P1 |
| RS-E-04 | 并发状态修改 | 同时两次修改 | 后提交的覆盖或提示冲突 | P2 |

---

## 2. 规则复制功能 (Rule Copy)

### 2.1 功能路径测试

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| COPY-F-01 | 复制单条规则 | 点击复制按钮 | 创建规则副本 | P0 |
| COPY-F-02 | 复制后自动添加后缀 | 原规则名="距离规则" | 副本名="距离规则 - Copy" | P0 |
| COPY-F-03 | 复制规则所有版本 | 原规则有v1,v2,v3 | 副本包含相同版本 | P0 |
| COPY-F-04 | 复制规则条件配置 | 原规则有条件树 | 副本条件配置一致 | P0 |
| COPY-F-05 | 复制后自动跳转到编辑页 | 复制成功 | 路由跳转到编辑页面 | P0 |
| COPY-F-06 | 多次复制同一规则 | 复制"距离规则"3次 | "距离规则 - Copy 3" | P1 |
| COPY-F-07 | 复制已禁用的规则 | 原规则status=0 | 副本也为禁用状态 | P1 |
| COPY-F-08 | 复制后修改副本不影响原规则 | 修改副本名称 | 原规则名称不变 | P0 |

**规则复制测试代码:**
```typescript
// COPY-F-01: 复制单条规则
describe('copyRule', () => {
  it('should create rule copy successfully', async () => {
    const originalRule = {
      id: 'rule-1',
      name: '距离优先规则',
      type: 'distance',
      priority: 100,
      status: 1,
      versions: [{ version: 1, configJson: { conditions: [] } }],
    };
    
    jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue(originalRule as any);
    
    const result = await rulesService.copyRule('rule-1', 'user-id');
    
    expect(result.name).toBe('距离优先规则 - Copy');
    expect(result.id).not.toBe('rule-1');
    expect(prisma.rule.create).toHaveBeenCalled();
  });
});

// COPY-F-06: 多次复制后缀处理
describe('copyRuleNameGeneration', () => {
  it('should append incremental suffix for multiple copies', async () => {
    jest.spyOn(prisma.rule, 'count')
      .mockResolvedValueOnce(1)  // 已存在 Copy
      .mockResolvedValueOnce(2); // 已存在 Copy 2
    
    const name = await rulesService.generateCopyName('距离优先规则');
    expect(name).toBe('距离优先规则 - Copy 3');
  });
});
```

### 2.2 边界值测试

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| COPY-B-01 | 超长名称复制 | 原名称190字符 | 副本名截断+Copy | P1 |
| COPY-B-02 | 名称已带Copy后缀 | "规则 - Copy" | "规则 - Copy 2" | P1 |
| COPY-B-03 | 名称已带Copy N后缀 | "规则 - Copy 5" | "规则 - Copy 6" | P1 |
| COPY-B-04 | 复制无版本规则 | 规则无版本 | 副本也无版本 | P1 |
| COPY-B-05 | 复制带10个版本的规则 | 10个历史版本 | 全部版本复制 | P1 |

### 2.3 异常测试

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| COPY-E-01 | 复制不存在的规则 | id="not-exist" | 404 NotFoundException | P0 |
| COPY-E-02 | 复制时数据库失败 | 模拟DB错误 | 500错误，无残留数据 | P0 |
| COPY-E-03 | 复制权限不足 | 无创建规则权限 | 403 Forbidden | P0 |
| COPY-E-04 | 复制超大规则 | 条件树>5MB | 允许复制或提示警告 | P2 |

---

## 3. 规则导出功能 (Rule Export)

### 3.1 功能路径测试

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| EXP-F-01 | 单条规则导出JSON | ruleId + format=json | 下载JSON文件 | P0 |
| EXP-F-02 | 批量规则导出JSON | 多个ruleId + format=json | 下载包含多个规则的JSON | P0 |
| EXP-F-03 | 导出CSV格式 | format=csv | 下载CSV文件 | P0 |
| EXP-F-04 | 文件名带时间戳 | 导出时间2024-01-15 10:30:25 | 文件名包含20240115103025 | P0 |
| EXP-F-05 | 导出包含完整版本信息 | - | JSON包含versions数组 | P1 |
| EXP-F-06 | 导出包含条件配置 | - | JSON包含conditions | P1 |
| EXP-F-07 | 全量导出所有规则 | 不指定ruleIds | 导出所有可见规则 | P1 |
| EXP-F-08 | 按筛选条件导出 | 筛选条件status=1 | 仅导出启用规则 | P1 |
| EXP-F-09 | 导出选中规则 | 勾选3条规则 | 仅导出选中规则 | P1 |

**规则导出测试代码:**
```typescript
// EXP-F-01: 单条规则导出JSON
describe('exportRule', () => {
  it('should export single rule as JSON', async () => {
    const rule = {
      id: 'rule-1',
      name: '距离优先',
      type: 'distance',
      versions: [{ version: 1, status: 1, configJson: {} }],
    };
    jest.spyOn(prisma.rule, 'findUnique').mockResolvedValue(rule as any);
    
    const result = await rulesService.exportRules(['rule-1'], 'json');
    
    expect(result.format).toBe('json');
    expect(result.data).toHaveProperty('rules');
    expect(result.filename).toMatch(/rules_export_\d{14}\.json/);
  });
});

// EXP-F-03: 导出CSV格式
describe('exportRulesCSV', () => {
  it('should export rules as CSV', async () => {
    const rules = [
      { id: '1', name: '规则1', type: 'distance', status: 1 },
      { id: '2', name: '规则2', type: 'rating', status: 0 },
    ];
    jest.spyOn(prisma.rule, 'findMany').mockResolvedValue(rules as any);
    
    const result = await rulesService.exportRules(['1', '2'], 'csv');
    
    expect(result.format).toBe('csv');
    expect(result.data).toContain('id,name,type,status');
    expect(result.filename).toMatch(/\.csv$/);
  });
});
```

### 3.2 边界值测试

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| EXP-B-01 | 导出空规则列表 | ruleIds=[] | 返回空文件或提示 | P1 |
| EXP-B-02 | 导出1万条规则 | 大量规则 | 分片导出或流式处理 | P2 |
| EXP-B-03 | 导出超大JSON | 条件树>10MB | 支持大文件导出 | P2 |
| EXP-B-04 | 特殊字符名称 | 名称含"," "\n" | CSV正确转义 | P1 |
| EXP-B-05 | 跨年时间戳 | 2023-12-31 23:59:59 | 文件名时间戳正确 | P1 |

### 3.3 异常测试

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| EXP-E-01 | 导出不存在的规则 | ruleIds含无效ID | 忽略无效ID或404 | P0 |
| EXP-E-02 | 无效格式参数 | format=xml | 400 不支持的格式 | P0 |
| EXP-E-03 | 无导出权限 | 无规则查看权限 | 403 Forbidden | P0 |
| EXP-E-04 | 导出时服务中断 | 模拟服务端错误 | 友好错误提示 | P1 |
| EXP-E-05 | 内存不足导出 | 超大导出 | 流式处理或分页 | P2 |

### 3.4 安全测试

| ID | 场景 | 测试输入 | 预期防护 | 优先级 |
|----|------|---------|---------|--------|
| EXP-S-01 | 文件名注入 | 规则名含"../etc/passwd" | 文件名净化处理 | P1 |
| EXP-S-02 | CSV注入攻击 | 字段以=+-@开头 | 添加单引号前缀 | P1 |
| EXP-S-03 | 越权导出 | 尝试导出他人私有规则 | 403 权限检查 | P0 |
| EXP-S-04 | 敏感信息泄露 | 配置含敏感字段 | 敏感字段脱敏 | P1 |

---

## 4. 增强规则编辑 (Enhanced Rule Editing)

### 4.1 过滤器类别 (Filter Categories)

#### 4.1.1 骑手维度 (Rider)

| ID | 场景 | 字段 | 操作符 | 预期结果 | 优先级 |
|----|------|-----|--------|---------|--------|
| EDIT-F-01 | 骑手ID过滤 | rider.id | eq, in | 条件正确保存 | P0 |
| EDIT-F-02 | 骑手等级过滤 | rider.level | eq, gt, gte, lt, lte | 条件正确保存 | P0 |
| EDIT-F-03 | 骑手评分过滤 | rider.rating | between | 支持范围查询 | P0 |
| EDIT-F-04 | 当前订单数过滤 | rider.activeOrders | eq, gt, lt | 数值比较 | P1 |
| EDIT-F-05 | 完成率过滤 | rider.completionRate | gte | 百分比比较 | P1 |
| EDIT-F-06 | 工作时长过滤 | rider.workHours | between | 时间范围 | P1 |

#### 4.1.2 商家维度 (Merchant)

| ID | 场景 | 字段 | 操作符 | 预期结果 | 优先级 |
|----|------|-----|--------|---------|--------|
| EDIT-F-10 | 商家ID过滤 | merchant.id | eq, in | 条件正确保存 | P0 |
| EDIT-F-11 | 商家类型过滤 | merchant.type | eq, in | 枚举值比较 | P0 |
| EDIT-F-12 | 商家评分过滤 | merchant.rating | between | 范围查询 | P1 |
| EDIT-F-13 | 配送范围过滤 | merchant.deliveryRange | lte | 距离比较 | P1 |
| EDIT-F-14 | VIP状态过滤 | merchant.isVIP | eq | 布尔值比较 | P1 |

#### 4.1.3 订单维度 (Order)

| ID | 场景 | 字段 | 操作符 | 预期结果 | 优先级 |
|----|------|-----|--------|---------|--------|
| EDIT-F-20 | 订单金额过滤 | order.amount | between, gt, lt | 金额范围 | P0 |
| EDIT-F-21 | 配送距离过滤 | order.distance | lte, gt | 距离比较 | P0 |
| EDIT-F-22 | 订单重量过滤 | order.weight | between | 重量范围 | P1 |
| EDIT-F-23 | 商品数量过滤 | order.itemCount | gt, lte | 数量比较 | P1 |
| EDIT-F-24 | 商品类型过滤 | order.productType | in, eq | 类型匹配 | P1 |
| EDIT-F-25 | 紧急度过滤 | order.urgency | eq, gte | 等级比较 | P0 |
| EDIT-F-26 | 时间窗口过滤 | order.timeWindow | contains | 时间范围 | P1 |
| EDIT-F-27 | 客户等级过滤 | order.customerLevel | eq, gte | 等级比较 | P1 |

#### 4.1.4 时间维度 (Time)

| ID | 场景 | 字段 | 操作符 | 预期结果 | 优先级 |
|----|------|-----|--------|---------|--------|
| EDIT-F-30 | 小时过滤 | time.hourOfDay | between, in | 0-23范围 | P0 |
| EDIT-F-31 | 星期过滤 | time.dayOfWeek | in | 1-7枚举 | P0 |
| EDIT-F-32 | 节假日过滤 | time.isHoliday | eq | 布尔值 | P1 |
| EDIT-F-33 | 高峰时段过滤 | time.isPeakHour | eq | 布尔值 | P1 |
| EDIT-F-34 | 时间范围过滤 | time.timeRange | between | 自定义范围 | P1 |

#### 4.1.5 地理维度 (Geo)

| ID | 场景 | 字段 | 操作符 | 预期结果 | 优先级 |
|----|------|-----|--------|---------|--------|
| EDIT-F-40 | 区域过滤 | geo.district | eq, in | 区域匹配 | P0 |
| EDIT-F-41 | 商圈过滤 | geo.businessZone | eq, in | 商圈匹配 | P1 |
| EDIT-F-42 | 特殊位置过滤 | geo.isSpecialLocation | eq | 布尔值 | P1 |
| EDIT-F-43 | 天气过滤 | geo.weather | eq, in | 天气状态 | P2 |

### 4.2 条件操作符 (Operators)

| ID | 场景 | 操作符 | 适用类型 | 预期结果 | 优先级 |
|----|------|-------|---------|---------|--------|
| EDIT-F-50 | 等于 | eq | 所有类型 | 精确匹配 | P0 |
| EDIT-F-51 | 不等于 | ne | 所有类型 | 排除匹配 | P0 |
| EDIT-F-52 | 大于 | gt | 数值 | 数值大于 | P0 |
| EDIT-F-53 | 大于等于 | gte | 数值 | 数值大于等于 | P0 |
| EDIT-F-54 | 小于 | lt | 数值 | 数值小于 | P0 |
| EDIT-F-55 | 小于等于 | lte | 数值 | 数值小于等于 | P0 |
| EDIT-F-56 | 范围 | between | 数值、时间 | 范围包含 | P0 |
| EDIT-F-57 | 包含 | in | 字符串、枚举 | 多值匹配 | P0 |
| EDIT-F-58 | 模糊匹配 | contains | 字符串 | 子串匹配 | P1 |
| EDIT-F-59 | 开头匹配 | startsWith | 字符串 | 前缀匹配 | P1 |
| EDIT-F-60 | 结尾匹配 | endsWith | 字符串 | 后缀匹配 | P1 |
| EDIT-F-61 | 正则匹配 | regex | 字符串 | 模式匹配 | P2 |
| EDIT-F-62 | 为空 | isNull | 所有类型 | 空值检查 | P1 |
| EDIT-F-63 | 不为空 | isNotNull | 所有类型 | 非空检查 | P1 |

### 4.3 嵌套条件组 (Nested Condition Groups)

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| EDIT-F-70 | 单层AND组 | AND:[cond1, cond2] | 结构正确存储 | P0 |
| EDIT-F-71 | 单层OR组 | OR:[cond1, cond2] | 结构正确存储 | P0 |
| EDIT-F-72 | 嵌套AND-OR | AND:[cond1, OR:[cond2, cond3]] | 嵌套结构正确 | P0 |
| EDIT-F-73 | 三层嵌套 | AND→OR→AND | 深层嵌套支持 | P1 |
| EDIT-F-74 | 混合逻辑组 | 复杂嵌套树 | 完整保留结构 | P1 |
| EDIT-F-75 | 空条件组 | AND:[] | 允许空组或提示 | P1 |
| EDIT-F-76 | 单条件组 | AND:[cond1] | 简化处理 | P1 |
| EDIT-F-77 | 条件组拖拽排序 | 拖拽调整顺序 | 顺序正确保存 | P2 |

**复杂条件测试数据:**
```typescript
// EDIT-F-72: 嵌套AND-OR条件
const complexConditionTree = {
  logicType: 'AND',
  conditions: [
    {
      conditionType: 'field',
      field: 'order.distance',
      operator: 'lte',
      value: '5000',
      valueType: 'number',
    },
    {
      conditionType: 'group',
      logicType: 'OR',
      children: [
        {
          conditionType: 'field',
          field: 'rider.rating',
          operator: 'gte',
          value: '4.5',
          valueType: 'number',
        },
        {
          conditionType: 'group',
          logicType: 'AND',
          children: [
            {
              conditionType: 'field',
              field: 'rider.level',
              operator: 'gte',
              value: '3',
              valueType: 'number',
            },
            {
              conditionType: 'field',
              field: 'rider.completionRate',
              operator: 'gte',
              value: '0.95',
              valueType: 'number',
            },
          ],
        },
      ],
    },
  ],
};
```

### 4.4 可视化编辑器 (Visual Builder)

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| EDIT-F-80 | 添加条件 | 点击添加条件 | 条件行插入编辑器 | P0 |
| EDIT-F-81 | 删除条件 | 点击删除按钮 | 条件行移除 | P0 |
| EDIT-F-82 | 添加条件组 | 点击添加组 | 条件组容器插入 | P0 |
| EDIT-F-83 | 展开/收起条件组 | 点击展开图标 | 子条件显示/隐藏 | P1 |
| EDIT-F-84 | 切换逻辑类型 | AND↔OR切换 | 逻辑类型变更 | P0 |
| EDIT-F-85 | 快速编辑模式 | 切换至快速模式 | 简化界面显示 | P1 |
| EDIT-F-86 | 高级编辑模式 | 切换至高级模式 | 完整功能显示 | P1 |
| EDIT-F-87 | JSON预览 | 打开JSON预览 | 显示条件JSON | P1 |
| EDIT-F-88 | JSON编辑 | 直接编辑JSON | 解析并更新可视化 | P2 |
| EDIT-F-89 | 条件验证 | 提交时验证 | 错误条件高亮提示 | P0 |
| EDIT-F-90 | 字段选择器 | 点击字段下拉 | 显示分类字段列表 | P0 |
| EDIT-F-91 | 操作符联动 | 选择字段类型 | 操作符选项联动 | P0 |
| EDIT-F-92 | 值类型校验 | 输入值 | 根据字段类型校验 | P0 |

### 4.5 可扩展设计 (Extensible Design)

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| EDIT-F-100 | 动态注册过滤器字段 | 注册新字段 | 字段出现在选择器 | P1 |
| EDIT-F-101 | 自定义字段类型 | 添加自定义type | 类型正确渲染 | P2 |
| EDIT-F-102 | 插件式操作符 | 注册新operator | 操作符可用 | P2 |
| EDIT-F-103 | 字段分类扩展 | 添加新category | 分类显示正确 | P2 |
| EDIT-F-104 | 字段配置热更新 | 更新字段配置 | 无需刷新生效 | P2 |

### 4.6 边界值测试

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| EDIT-B-01 | 最大条件数 | 100个条件 | 支持或限制提示 | P2 |
| EDIT-B-02 | 最大嵌套层级 | 10层嵌套 | 支持或限制提示 | P2 |
| EDIT-B-03 | 空字段名 | field="" | 400 校验失败 | P0 |
| EDIT-B-04 | 无效操作符 | operator="invalid" | 400 校验失败 | P0 |
| EDIT-B-05 | 值类型不匹配 | valueType=number, value="abc" | 400 类型错误 | P0 |
| EDIT-B-06 | 数值范围边界 | between [0, 0] | 允许或提示 | P1 |
| EDIT-B-07 | 超长字段值 | 字符串>10KB | 截断或限制 | P1 |
| EDIT-B-08 | 循环引用 | A→B→A | 检测并拒绝 | P2 |
| EDIT-B-09 | 无效时间值 | hourOfDay=25 | 400 范围错误 | P0 |
| EDIT-B-10 | 无效日期格式 | timeRange="invalid" | 400 格式错误 | P0 |

### 4.7 异常测试

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| EDIT-E-01 | 无效条件格式 | 非法JSON结构 | 400 校验失败 | P0 |
| EDIT-E-02 | 不存在的字段 | field="invalid.field" | 400 字段不存在 | P0 |
| EDIT-E-03 | 字段与操作符不匹配 | string字段用gt | 400 不匹配 | P0 |
| EDIT-E-04 | 保存时网络中断 | 模拟网络错误 | 错误提示，保留编辑 | P1 |
| EDIT-E-05 | 条件解析失败 | 损坏的条件树 | 友好错误提示 | P1 |
| EDIT-E-06 | 并发编辑冲突 | 同时保存 | 冲突检测或覆盖提示 | P2 |

### 4.8 性能测试

| ID | 场景 | 测试条件 | 预期指标 | 优先级 |
|----|------|---------|---------|--------|
| EDIT-P-01 | 条件编辑器加载 | 50个条件 | < 500ms | P1 |
| EDIT-P-02 | 条件树保存 | 100个条件 | < 1000ms | P1 |
| EDIT-P-03 | 条件验证 | 复杂嵌套条件 | < 200ms | P1 |
| EDIT-P-04 | 字段选择器加载 | 100个字段 | < 100ms | P2 |
| EDIT-P-05 | 嵌套展开性能 | 10层嵌套展开 | < 300ms | P2 |

### 4.9 安全测试

| ID | 场景 | 测试输入 | 预期防护 | 优先级 |
|----|------|---------|---------|--------|
| EDIT-S-01 | 字段名注入 | field="db.collection" | 白名单校验 | P1 |
| EDIT-S-02 | 值注入攻击 | value=`{"$ne":null}` | 类型严格校验 | P1 |
| EDIT-S-03 | 递归攻击 | 1000层嵌套 | 层级限制 | P2 |
| EDIT-S-04 | 存储型XSS | value="<script>" | 输出转义 | P1 |
| EDIT-S-05 | 超大条件攻击 | 100MB条件树 | 大小限制 | P2 |

---

## 5. 执行清单

### P0 必测项（24个）

- [ ] RS-F-01~05 规则状态切换
- [ ] RS-B-01~02 状态边界值
- [ ] RS-E-01~02 状态异常
- [ ] COPY-F-01~05 规则复制核心
- [ ] COPY-E-01~03 复制异常
- [ ] EXP-F-01~04 导出功能
- [ ] EXP-E-01~03 导出异常
- [ ] EDIT-F-01~05 核心字段过滤
- [ ] EDIT-F-50~56 核心操作符
- [ ] EDIT-F-70~73 嵌套条件组
- [ ] EDIT-F-80~84 编辑器核心功能
- [ ] EDIT-B-03~05 编辑边界值
- [ ] EDIT-E-01~03 编辑异常

### P1 重要项（28个）

- [ ] RS-F-06~09 状态管理扩展
- [ ] RS-B-03~05 状态边界扩展
- [ ] COPY-F-06~08 复制扩展场景
- [ ] COPY-B-01~05 复制边界
- [ ] EXP-F-05~09 导出扩展
- [ ] EXP-B-01,04 导出边界
- [ ] EXP-S-01~04 导出安全
- [ ] EDIT-F-06~43 完整字段覆盖
- [ ] EDIT-F-57~63 完整操作符
- [ ] EDIT-F-74~77 嵌套扩展
- [ ] EDIT-F-85~92 编辑器完整功能
- [ ] EDIT-B-06~10 编辑边界扩展
- [ ] EDIT-P-01~03 编辑性能

### P2 补充项（16个）

- [ ] RS-E-03~04 状态深度异常
- [ ] COPY-E-04 复制超大规则
- [ ] COPY-B-04~05 复制边界扩展
- [ ] EXP-B-02~03,05 导出边界
- [ ] EXP-E-04~05 导出异常扩展
- [ ] EDIT-F-100~104 可扩展设计
- [ ] EDIT-B-01~02,08 编辑边界深度
- [ ] EDIT-P-04~05 编辑性能深度
- [ ] EDIT-S-03,05 编辑安全深度

---

*文档结束 - 规则增强功能共68个测试用例*
