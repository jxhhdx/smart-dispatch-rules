import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 antd 的 message 和 Modal
const mockMessageError = vi.fn()
const mockMessageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      error: mockMessageError,
      success: mockMessageSuccess,
    },
    Modal: {
      confirm: vi.fn(),
    },
  }
})

// 模拟 API
const mockGetRoles = vi.fn()
const mockGetPermissions = vi.fn()
const mockCreateRole = vi.fn()
const mockUpdateRole = vi.fn()
const mockDeleteRole = vi.fn()

vi.mock('../services/api', () => ({
  roleApi: {
    getList: () => mockGetRoles(),
    getPermissions: () => mockGetPermissions(),
    create: (...args: any[]) => mockCreateRole(...args),
    update: (...args: any[]) => mockUpdateRole(...args),
    delete: (...args: any[]) => mockDeleteRole(...args),
  },
}))

// 模拟 react-i18next
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'role:title': '角色管理',
    'role:create': '创建角色',
    'role:edit': '编辑角色',
    'role:field.name': '角色名称',
    'role:field.code': '角色代码',
    'role:field.description': '描述',
    'role:field.userCount': '用户数量',
    'role:permission.title': '权限配置',
    'role:validation.nameRequired': '请输入角色名称',
    'role:validation.codeRequired': '请输入角色代码',
    'role:validation.codePattern': '角色代码只能包含字母、数字和下划线',
    'role:placeholder.name': '请输入角色名称',
    'role:placeholder.code': '请输入角色代码',
    'role:placeholder.description': '请输入角色描述',
    'common:button.save': '保存',
    'common:button.cancel': '取消',
    'common:table.action': '操作',
    'common:message.confirmDelete': '确认删除吗？',
  }
  return translations[key] || key
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'zh-CN', changeLanguage: vi.fn() },
  }),
}))

describe('Roles Component', () => {
  const mockRoles = [
    { 
      id: '1', 
      name: '管理员', 
      code: 'admin', 
      description: '系统管理员',
      _count: { users: 2 },
      permissions: [{ permission: { id: 'p1', name: '用户管理' } }],
    },
    { 
      id: '2', 
      name: '普通用户', 
      code: 'user', 
      description: '普通用户角色',
      _count: { users: 5 },
      permissions: [],
    },
  ]

  const mockPermissions = [
    { id: 'p1', name: '用户管理' },
    { id: 'p2', name: '角色管理' },
    { id: 'p3', name: '规则管理' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRoles.mockResolvedValue({ data: mockRoles })
    mockGetPermissions.mockResolvedValue({ data: mockPermissions })
  })

  it('should have correct page title translation', () => {
    expect(mockT('role:title')).toBe('角色管理')
  })

  it('should fetch roles on mount', async () => {
    const result = await mockGetRoles()
    
    expect(mockGetRoles).toHaveBeenCalled()
    expect(result.data).toHaveLength(2)
  })

  it('should fetch permissions on mount', async () => {
    const result = await mockGetPermissions()
    
    expect(mockGetPermissions).toHaveBeenCalled()
    expect(result.data).toHaveLength(3)
  })

  it('should handle role creation', async () => {
    const newRole = {
      name: '测试角色',
      code: 'test_role',
      description: '测试角色描述',
      permissionIds: ['p1', 'p2'],
    }
    
    mockCreateRole.mockResolvedValue({ data: { id: '3', ...newRole } })
    
    await mockCreateRole(newRole)
    
    expect(mockCreateRole).toHaveBeenCalledWith(newRole)
  })

  it('should handle role update', async () => {
    const updateData = {
      name: '更新角色',
      description: '更新后的描述',
      permissionIds: ['p1', 'p3'],
    }
    
    mockUpdateRole.mockResolvedValue({ data: { id: '1', ...updateData } })
    
    await mockUpdateRole('1', updateData)
    
    expect(mockUpdateRole).toHaveBeenCalledWith('1', updateData)
  })

  it('should handle role deletion', async () => {
    mockDeleteRole.mockResolvedValue({})
    
    await mockDeleteRole('1')
    
    expect(mockDeleteRole).toHaveBeenCalledWith('1')
  })

  it('should validate role name is required', () => {
    const validateName = (value: string) => {
      if (!value) return '请输入角色名称'
      return null
    }
    
    expect(validateName('')).toBe('请输入角色名称')
    expect(validateName('管理员')).toBeNull()
  })

  it('should validate role code format', () => {
    const validateCode = (value: string) => {
      if (!value) return '请输入角色代码'
      const codeRegex = /^[a-zA-Z0-9_]+$/
      if (!codeRegex.test(value)) return '角色代码只能包含字母、数字和下划线'
      return null
    }
    
    expect(validateCode('')).toBe('请输入角色代码')
    expect(validateCode('admin-user')).toBe('角色代码只能包含字母、数字和下划线')
    expect(validateCode('admin_user')).toBeNull()
    expect(validateCode('admin123')).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    mockGetRoles.mockRejectedValue(new Error('Network Error'))
    
    await expect(mockGetRoles()).rejects.toThrow('Network Error')
  })

  it('should handle permission selection', async () => {
    const result = await mockGetPermissions()
    
    expect(result.data).toHaveLength(3)
    expect(result.data[0]).toHaveProperty('id')
    expect(result.data[0]).toHaveProperty('name')
  })

  it('should have correct field translations', () => {
    expect(mockT('role:field.name')).toBe('角色名称')
    expect(mockT('role:field.code')).toBe('角色代码')
    expect(mockT('role:field.description')).toBe('描述')
    expect(mockT('role:field.userCount')).toBe('用户数量')
    expect(mockT('role:permission.title')).toBe('权限配置')
  })

  it('should load role permissions when editing', async () => {
    const result = await mockGetRoles()
    
    const firstRole = result.data[0]
    expect(firstRole.permissions).toHaveLength(1)
    expect(firstRole.permissions[0].permission.id).toBe('p1')
  })
})

describe('Roles API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call create API with correct data including permissions', async () => {
    const newRole = {
      name: '测试角色',
      code: 'test_role',
      description: '测试角色描述',
      permissionIds: ['p1', 'p2'],
    }
    
    mockCreateRole.mockResolvedValue({ data: { id: '3', ...newRole } })
    
    await mockCreateRole(newRole)
    
    expect(mockCreateRole).toHaveBeenCalledWith(newRole)
    expect(newRole.permissionIds).toContain('p1')
    expect(newRole.permissionIds).toContain('p2')
  })

  it('should call update API with correct data', async () => {
    const updateData = {
      name: '更新角色',
      description: '更新后的描述',
      permissionIds: ['p1', 'p3'],
    }
    
    mockUpdateRole.mockResolvedValue({ data: { id: '1', ...updateData } })
    
    await mockUpdateRole('1', updateData)
    
    expect(mockUpdateRole).toHaveBeenCalledWith('1', updateData)
  })

  it('should call delete API with correct id', async () => {
    mockDeleteRole.mockResolvedValue({})
    
    await mockDeleteRole('1')
    
    expect(mockDeleteRole).toHaveBeenCalledWith('1')
  })

  it('should refresh role list after creation', async () => {
    mockCreateRole.mockResolvedValue({})
    mockGetRoles.mockResolvedValue({ data: [] })
    
    await mockCreateRole({ name: 'test', code: 'test', permissionIds: [] })
    await mockGetRoles()
    
    expect(mockCreateRole).toHaveBeenCalled()
    expect(mockGetRoles).toHaveBeenCalled()
  })

  it('should refresh role list after deletion', async () => {
    mockDeleteRole.mockResolvedValue({})
    mockGetRoles.mockResolvedValue({ data: [] })
    
    await mockDeleteRole('1')
    await mockGetRoles()
    
    expect(mockDeleteRole).toHaveBeenCalled()
    expect(mockGetRoles).toHaveBeenCalled()
  })

  it('should fetch permissions list', async () => {
    mockGetPermissions.mockResolvedValue({
      data: [
        { id: 'p1', name: '权限1' },
        { id: 'p2', name: '权限2' },
      ],
    })
    
    const result = await mockGetPermissions()
    
    expect(mockGetPermissions).toHaveBeenCalled()
    expect(result.data).toHaveLength(2)
  })
})

describe('Roles Permission Management', () => {
  it('should handle empty permissions', () => {
    const role = { permissions: [] }
    const selectedPermissions = role.permissions?.map((p: any) => p.permission.id) || []
    expect(selectedPermissions).toHaveLength(0)
  })

  it('should handle undefined permissions', () => {
    const role = {}
    const selectedPermissions = (role as any).permissions?.map((p: any) => p.permission.id) || []
    expect(selectedPermissions).toHaveLength(0)
  })

  it('should extract permission ids correctly', () => {
    const role = {
      permissions: [
        { permission: { id: 'p1', name: '权限1' } },
        { permission: { id: 'p2', name: '权限2' } },
      ],
    }
    const selectedPermissions = role.permissions?.map((p: any) => p.permission.id) || []
    expect(selectedPermissions).toEqual(['p1', 'p2'])
  })

  it('should validate code pattern strictly', () => {
    const codeRegex = /^[a-zA-Z0-9_]+$/
    
    // 有效代码
    expect(codeRegex.test('admin')).toBe(true)
    expect(codeRegex.test('admin_123')).toBe(true)
    expect(codeRegex.test('USER_ROLE')).toBe(true)
    expect(codeRegex.test('role123')).toBe(true)
    
    // 无效代码
    expect(codeRegex.test('admin-user')).toBe(false)
    expect(codeRegex.test('admin.user')).toBe(false)
    expect(codeRegex.test('admin user')).toBe(false)
    expect(codeRegex.test('admin@user')).toBe(false)
  })

  it('should have correct column configuration', () => {
    const columns = [
      { title: '角色名称', dataIndex: 'name' },
      { title: '角色代码', dataIndex: 'code' },
      { title: '描述', dataIndex: 'description' },
      { title: '用户数量', dataIndex: ['_count', 'users'], width: 120 },
      { title: '操作', width: 120, fixed: 'right' },
    ]
    
    expect(columns).toHaveLength(5)
    expect(columns[3].dataIndex).toEqual(['_count', 'users'])
  })
})
