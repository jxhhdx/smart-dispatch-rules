# 角色管理测试用例

> Roles Module - 角色CRUD、权限关联、用户计数

---

## 模块概览

| 属性 | 值 |
|-----|---|
| 模块 | 角色管理 (roles) |
| 文件 | `apps/api/src/modules/roles/` |
| 核心功能 | 角色CRUD、权限分配、用户计数 |
| 测试用例数 | 38 |
| 优先级分布 | P0: 14, P1: 14, P2: 10 |

---

## 1. 功能路径测试 (Functional)

### 1.1 CRUD 正常流程

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| ROLE-F-01 | 创建角色 | 名称、编码、描述 | 返回创建的角色 | P0 |
| ROLE-F-02 | 创建角色带权限 | + permissionIds | 返回带权限的角色 | P0 |
| ROLE-F-03 | 查询角色列表 | 无参数 | 返回所有角色（含权限） | P0 |
| ROLE-F-04 | 查询单个角色 | 有效角色ID | 返回角色详情 | P0 |
| ROLE-F-05 | 更新角色 | 角色ID+更新数据 | 返回更新后的角色 | P0 |
| ROLE-F-06 | 更新角色权限 | + permissionIds | 权限替换为新的列表 | P0 |
| ROLE-F-07 | 删除角色 | 无关联用户的角色ID | 删除成功 | P0 |
| ROLE-F-08 | 查询权限列表 | 无参数 | 返回所有可用权限 | P0 |

### 1.2 权限关联

| ID | 场景 | 输入 | 预期输出 | 优先级 |
|----|------|------|---------|--------|
| ROLE-F-09 | 创建时关联多个权限 | permissionIds=[1,2,3] | 角色拥有3个权限 | P1 |
| ROLE-F-10 | 更新时清空权限 | permissionIds=[] | 角色无权限 | P1 |
| ROLE-F-11 | 更新时不传权限 | 无permissionIds | 保持原有权限 | P1 |
| ROLE-F-12 | 角色包含用户计数 | _count.users | 返回正确的用户数 | P1 |

**权限关联测试:**
```typescript
// ROLE-F-02: 创建角色带权限
describe('create with permissions', () => {
  it('should create role with associated permissions', async () => {
    const createDto = {
      name: '管理员',
      code: 'admin',
      permissionIds: ['perm-1', 'perm-2', 'perm-3'],
    };
    const result = await rolesService.create(createDto);
    expect(result.permissions).toHaveLength(3);
  });
});

// ROLE-F-06: 更新角色权限（替换）
describe('update permissions', () => {
  it('should replace permissions when updating', async () => {
    const updateDto = {
      name: '更新后的角色',
      permissionIds: ['perm-4'],  // 新的权限列表
    };
    const result = await rolesService.update('role-id', updateDto);
    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].permission.id).toBe('perm-4');
  });
});
```

---

## 2. 边界值测试 (Boundary)

### 2.1 角色编码

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| ROLE-B-01 | 编码-标准格式 | `"admin_role"` | 创建成功 | P0 |
| ROLE-B-02 | 编码-仅字母 | `"admin"` | 创建成功 | P0 |
| ROLE-B-03 | 编码-含数字 | `"admin123"` | 创建成功 | P1 |
| ROLE-B-04 | 编码-含大写 | `"ADMIN"` | 创建成功或转为小写 | P1 |
| ROLE-B-05 | 编码-含连字符 | `"admin-role"` | 根据业务决定 | P2 |
| ROLE-B-06 | 编码-无效字符 | `"admin@role"` | 400 格式校验失败 | P0 |
| ROLE-B-07 | 编码-空 | `""` | 400 必填校验失败 | P0 |
| ROLE-B-08 | 编码-重复 | 已存在的编码 | 400 唯一约束错误 | P0 |

### 2.2 权限关联

| ID | 场景 | 输入值 | 预期结果 | 优先级 |
|----|------|-------|---------|--------|
| ROLE-B-10 | 权限-空数组 | `[]` | 创建无权限角色 | P1 |
| ROLE-B-11 | 权限-单权限 | `["perm-id-1"]` | 创建单权限角色 | P1 |
| ROLE-B-12 | 权限-多权限 | `["id1", "id2", ...]` | 创建多权限角色 | P1 |
| ROLE-B-13 | 权限-无效ID | `["not-exist"]` | 400 或忽略 | P1 |
| ROLE-B-14 | 权限-null | `null` | 无权限或400 | P1 |

---

## 3. 异常测试 (Exception)

### 3.1 资源异常

| ID | 场景 | 模拟条件 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| ROLE-E-01 | 查询不存在的角色 | id="not-exist" | 404 NotFoundException | P0 |
| ROLE-E-02 | 更新不存在的角色 | id="not-exist" | 404 NotFoundException | P0 |
| ROLE-E-03 | 删除不存在的角色 | id="not-exist" | 404 NotFoundException | P0 |
| ROLE-E-04 | 删除有用户的角色 | 关联用户的角色 | 400 错误提示 | P0 |
| ROLE-E-05 | 删除系统保留角色 | 系统默认角色 | 403 禁止删除 | P1 |

### 3.2 并发异常

| ID | 场景 | 测试方法 | 预期行为 | 优先级 |
|----|------|---------|---------|--------|
| ROLE-E-20 | 并发创建同编码角色 | 同时创建 | 只有一个成功 | P1 |
| ROLE-E-21 | 更新时角色被删除 | 查询后删除 | 404 错误 | P2 |

**资源异常测试:**
```typescript
// ROLE-E-04: 删除有用户的角色
describe('remove', () => {
  it('should throw error when deleting role with users', async () => {
    const roleWithUsers = {
      id: 'role-id',
      users: [{ id: 'user-1' }],  // 有关联用户
    };
    jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(roleWithUsers as any);
    
    await expect(rolesService.remove('role-id')).rejects.toThrow('该角色下还有用户，无法删除');
  });
});
```

---

## 4. 性能测试 (Performance)

| ID | 场景 | 测试条件 | 预期指标 | 优先级 |
|----|------|---------|---------|--------|
| ROLE-P-01 | 列表查询 | 含权限关联 | < 100ms | P1 |
| ROLE-P-02 | 创建角色 | 带20个权限 | < 200ms | P1 |
| ROLE-P-03 | 更新权限 | 替换50个权限 | < 300ms | P1 |

---

## 5. 安全测试 (Security)

| ID | 场景 | 测试输入 | 预期防护 | 优先级 |
|----|------|---------|---------|--------|
| ROLE-S-01 | 创建超级管理员 | 尝试创建super_admin | 只有超管可创建 | P1 |
| ROLE-S-02 | 越权删除角色 | 删除他人创建的角色 | 403 权限检查 | P1 |
| ROLE-S-03 | 权限提升 | 给自己添加所有权限 | 403 权限检查 | P1 |
| ROLE-S-04 | 循环依赖检查 | 角色A→B→A | 业务层面阻止 | P2 |

---

## 6. 执行清单

### P0 必测项（14个）

- [ ] ROLE-F-01~08 核心CRUD功能
- [ ] ROLE-B-01~08 编码边界值
- [ ] ROLE-E-01~04 资源异常
- [ ] ROLE-E-05 删除有用户的角色

---

*文档结束 - 角色管理共38个测试用例*
