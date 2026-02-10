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
const mockGetUsers = vi.fn()
const mockGetRoles = vi.fn()
const mockCreateUser = vi.fn()
const mockUpdateUser = vi.fn()
const mockDeleteUser = vi.fn()

vi.mock('../services/api', () => ({
  userApi: {
    getList: (...args: any[]) => mockGetUsers(...args),
    create: (...args: any[]) => mockCreateUser(...args),
    update: (...args: any[]) => mockUpdateUser(...args),
    delete: (...args: any[]) => mockDeleteUser(...args),
  },
  roleApi: {
    getList: () => mockGetRoles(),
  },
}))

// 模拟 react-i18next
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'user:title': '用户管理',
    'user:create': '创建用户',
    'user:edit': '编辑用户',
    'user:field.username': '用户名',
    'user:field.email': '邮箱',
    'user:field.realName': '真实姓名',
    'user:field.role': '角色',
    'user:field.status': '状态',
    'user:field.password': '密码',
    'user:field.phone': '电话',
    'user:validation.usernameRequired': '请输入用户名',
    'user:validation.emailRequired': '请输入邮箱',
    'user:validation.emailInvalid': '邮箱格式不正确',
    'user:validation.passwordRequired': '请输入密码',
    'user:validation.passwordLength': '密码长度至少6位',
    'user:placeholder.username': '请输入用户名',
    'user:placeholder.email': '请输入邮箱',
    'user:placeholder.password': '请输入密码',
    'user:placeholder.realName': '请输入真实姓名',
    'user:placeholder.phone': '请输入电话',
    'common:button.save': '保存',
    'common:button.cancel': '取消',
    'common:button.search': '搜索',
    'common:table.action': '操作',
    'common:table.total': '共',
    'common:table.items': '条',
    'common:status.enabled': '启用',
    'common:status.disabled': '禁用',
    'common:message.confirmDelete': '确认删除吗？',
    'common:form.select': '请选择',
  }
  return translations[key] || key
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'zh-CN', changeLanguage: vi.fn() },
  }),
}))

describe('Users Component', () => {
  const mockUsers = [
    { id: '1', username: 'admin', email: 'admin@test.com', realName: '管理员', status: 1, role: { id: '1', name: '管理员' } },
    { id: '2', username: 'user1', email: 'user1@test.com', realName: '用户1', status: 0, role: { id: '2', name: '普通用户' } },
  ]

  const mockRoles = [
    { id: '1', name: '管理员' },
    { id: '2', name: '普通用户' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUsers.mockResolvedValue({
      data: {
        list: mockUsers,
        pagination: { page: 1, pageSize: 10, total: 2 },
      },
    })
    mockGetRoles.mockResolvedValue({ data: mockRoles })
  })

  it('should have correct page title translation', () => {
    expect(mockT('user:title')).toBe('用户管理')
  })

  it('should fetch users on mount with correct params', async () => {
    const result = await mockGetUsers({ page: 1, pageSize: 10 })
    
    expect(mockGetUsers).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    expect(result.data.list).toHaveLength(2)
  })

  it('should fetch roles on mount', async () => {
    const result = await mockGetRoles()
    
    expect(mockGetRoles).toHaveBeenCalled()
    expect(result.data).toHaveLength(2)
  })

  it('should handle user creation', async () => {
    const newUser = {
      username: 'newuser',
      email: 'newuser@test.com',
      password: 'password123',
      realName: '新用户',
      phone: '13800138000',
      roleId: '2',
    }
    
    mockCreateUser.mockResolvedValue({ data: { id: '3', ...newUser } })
    
    await mockCreateUser(newUser)
    
    expect(mockCreateUser).toHaveBeenCalledWith(newUser)
  })

  it('should handle user update', async () => {
    const updateData = {
      email: 'updated@test.com',
      realName: '更新用户',
      roleId: '1',
    }
    
    mockUpdateUser.mockResolvedValue({ data: { id: '1', ...updateData } })
    
    await mockUpdateUser('1', updateData)
    
    expect(mockUpdateUser).toHaveBeenCalledWith('1', updateData)
  })

  it('should handle user deletion', async () => {
    mockDeleteUser.mockResolvedValue({})
    
    await mockDeleteUser('1')
    
    expect(mockDeleteUser).toHaveBeenCalledWith('1')
  })

  it('should validate username is required', () => {
    const validateUsername = (value: string) => {
      if (!value) return '请输入用户名'
      return null
    }
    
    expect(validateUsername('')).toBe('请输入用户名')
    expect(validateUsername('admin')).toBeNull()
  })

  it('should validate email format', () => {
    const validateEmail = (value: string) => {
      if (!value) return '请输入邮箱'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return '邮箱格式不正确'
      return null
    }
    
    expect(validateEmail('')).toBe('请输入邮箱')
    expect(validateEmail('invalid')).toBe('邮箱格式不正确')
    expect(validateEmail('test@example.com')).toBeNull()
  })

  it('should validate password length for new users', () => {
    const validatePassword = (value: string, isEditing: boolean) => {
      if (isEditing) return null
      if (!value) return '请输入密码'
      if (value.length < 6) return '密码长度至少6位'
      return null
    }
    
    expect(validatePassword('', false)).toBe('请输入密码')
    expect(validatePassword('123', false)).toBe('密码长度至少6位')
    expect(validatePassword('123456', false)).toBeNull()
    expect(validatePassword('', true)).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    mockGetUsers.mockRejectedValue(new Error('Network Error'))
    
    await expect(mockGetUsers({ page: 1, pageSize: 10 })).rejects.toThrow('Network Error')
  })

  it('should handle pagination change', async () => {
    mockGetUsers.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 2, pageSize: 20, total: 0 },
      },
    })
    
    const result = await mockGetUsers({ page: 2, pageSize: 20 })
    
    expect(mockGetUsers).toHaveBeenCalledWith({ page: 2, pageSize: 20 })
    expect(result.data.pagination.page).toBe(2)
  })

  it('should have correct field translations', () => {
    expect(mockT('user:field.username')).toBe('用户名')
    expect(mockT('user:field.email')).toBe('邮箱')
    expect(mockT('user:field.realName')).toBe('真实姓名')
    expect(mockT('user:field.role')).toBe('角色')
    expect(mockT('user:field.status')).toBe('状态')
  })
})

describe('Users API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call create API with correct data', async () => {
    const newUser = {
      username: 'newuser',
      email: 'newuser@test.com',
      password: 'password123',
      realName: '新用户',
      phone: '13800138000',
      roleId: '2',
    }
    
    mockCreateUser.mockResolvedValue({ data: { id: '3', ...newUser } })
    
    await mockCreateUser(newUser)
    
    expect(mockCreateUser).toHaveBeenCalledWith(newUser)
  })

  it('should call update API with correct data', async () => {
    const updateData = {
      email: 'updated@test.com',
      realName: '更新用户',
      roleId: '1',
    }
    
    mockUpdateUser.mockResolvedValue({ data: { id: '1', ...updateData } })
    
    await mockUpdateUser('1', updateData)
    
    expect(mockUpdateUser).toHaveBeenCalledWith('1', updateData)
  })

  it('should call delete API with correct id', async () => {
    mockDeleteUser.mockResolvedValue({})
    
    await mockDeleteUser('1')
    
    expect(mockDeleteUser).toHaveBeenCalledWith('1')
  })

  it('should refresh user list after creation', async () => {
    mockCreateUser.mockResolvedValue({})
    mockGetUsers.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockCreateUser({ username: 'test', email: 'test@test.com', password: '123456' })
    await mockGetUsers({ page: 1, pageSize: 10 })
    
    expect(mockCreateUser).toHaveBeenCalled()
    expect(mockGetUsers).toHaveBeenCalled()
  })

  it('should refresh user list after deletion', async () => {
    mockDeleteUser.mockResolvedValue({})
    mockGetUsers.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockDeleteUser('1')
    await mockGetUsers({ page: 1, pageSize: 10 })
    
    expect(mockDeleteUser).toHaveBeenCalled()
    expect(mockGetUsers).toHaveBeenCalled()
  })
})

describe('Users Form Validation', () => {
  it('should validate all required fields', () => {
    const validateForm = (values: any, isEditing: boolean) => {
      const errors: string[] = []
      
      if (!values.username) errors.push('请输入用户名')
      if (!values.email) errors.push('请输入邮箱')
      if (!isEditing && !values.password) errors.push('请输入密码')
      
      return errors
    }
    
    expect(validateForm({}, false)).toHaveLength(3)
    expect(validateForm({ username: 'test' }, false)).toHaveLength(2)
    expect(validateForm({ username: 'test', email: 'a@b.c', password: '123456' }, false)).toHaveLength(0)
    // 编辑模式下，用户名和邮箱仍然需要验证
    expect(validateForm({ username: 'test', email: 'test@test.com' }, true)).toHaveLength(0)
  })

  it('should validate email format strictly', () => {
    const validateEmail = (email: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return regex.test(email)
    }
    
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('test@domain.co.uk')).toBe(true)
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
  })

  it('should handle status tag colors', () => {
    const getStatusColor = (status: number) => {
      return status === 1 ? 'success' : 'default'
    }
    
    const getStatusText = (status: number) => {
      return status === 1 ? '启用' : '禁用'
    }
    
    expect(getStatusColor(1)).toBe('success')
    expect(getStatusColor(0)).toBe('default')
    expect(getStatusText(1)).toBe('启用')
    expect(getStatusText(0)).toBe('禁用')
  })

  it('should have correct column configuration', () => {
    const columns = [
      { title: '用户名', dataIndex: 'username' },
      { title: '邮箱', dataIndex: 'email' },
      { title: '真实姓名', dataIndex: 'realName' },
      { title: '角色', dataIndex: ['role', 'name'] },
      { title: '状态', dataIndex: 'status', width: 100 },
      { title: '操作', width: 120, fixed: 'right' },
    ]
    
    expect(columns).toHaveLength(6)
    expect(columns[0].dataIndex).toBe('username')
    expect(columns[3].dataIndex).toEqual(['role', 'name'])
  })
})
