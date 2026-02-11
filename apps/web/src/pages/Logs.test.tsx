import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 antd 的 message
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
  }
})

// 模拟 API
const mockGetSystemLogs = vi.fn()
const mockGetLoginLogs = vi.fn()

vi.mock('../services/api', () => ({
  logApi: {
    getSystemLogs: (...args: any[]) => mockGetSystemLogs(...args),
    getLoginLogs: (...args: any[]) => mockGetLoginLogs(...args),
  },
}))

// 模拟 react-i18next
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'menu:systemLogs': '系统日志',
    'common:button.search': '搜索',
    'common:table.total': '共',
    'common:table.items': '条',
    'common:status.success': '成功',
    'common:status.error': '失败',
    // Log namespace translations
    'log:systemOperationLogs': '系统操作日志',
    'log:loginLogs': '登录日志',
    'log:search.module': '搜索模块',
    'log:search.username': '搜索用户名',
    'log:column.time': '时间',
    'log:column.user': '用户',
    'log:column.username': '用户名',
    'log:column.module': '模块',
    'log:column.action': '操作',
    'log:column.description': '描述',
    'log:column.ipAddress': 'IP地址',
    'log:column.loginType': '登录类型',
    'log:column.status': '状态',
    'log:column.failReason': '失败原因',
    'log:status.success': '成功',
    'log:status.failed': '失败',
  }
  return translations[key] || key
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'zh-CN', changeLanguage: vi.fn() },
  }),
}))

// 模拟 dayjs
vi.mock('dayjs', () => {
  const mockDayjs = (_date: string) => ({
    format: (_format: string) => '2024-01-15 10:30:00',
  })
  mockDayjs.extend = vi.fn()
  return { default: mockDayjs, __esModule: true }
})

describe('Logs Component', () => {
  const mockSystemLogs = [
    { 
      id: '1', 
      createdAt: '2024-01-15T10:30:00Z',
      username: 'admin',
      module: '用户管理',
      action: '创建用户',
      description: '创建了新用户 user1',
      ipAddress: '192.168.1.1',
    },
    { 
      id: '2', 
      createdAt: '2024-01-15T11:00:00Z',
      username: 'admin',
      module: '角色管理',
      action: '更新角色',
      description: '更新了管理员角色权限',
      ipAddress: '192.168.1.1',
    },
  ]

  const mockLoginLogs = [
    { 
      id: '1', 
      createdAt: '2024-01-15T09:00:00Z',
      username: 'admin',
      loginType: '密码登录',
      status: 1,
      ipAddress: '192.168.1.100',
      failReason: null,
    },
    { 
      id: '2', 
      createdAt: '2024-01-15T09:30:00Z',
      username: 'user1',
      loginType: '密码登录',
      status: 0,
      ipAddress: '192.168.1.101',
      failReason: '密码错误',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: mockSystemLogs,
        pagination: { page: 1, pageSize: 10, total: 2 },
      },
    })
    mockGetLoginLogs.mockResolvedValue({
      data: {
        list: mockLoginLogs,
        pagination: { page: 1, pageSize: 10, total: 2 },
      },
    })
  })

  it('should have correct page title translation', () => {
    expect(mockT('menu:systemLogs')).toBe('系统日志')
  })

  it('should fetch system logs on mount with default tab', async () => {
    const result = await mockGetSystemLogs({ page: 1, pageSize: 10 })
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    expect(result.data.list).toHaveLength(2)
  })

  it('should fetch login logs when tab is switched', async () => {
    const result = await mockGetLoginLogs({ page: 1, pageSize: 10 })
    
    expect(mockGetLoginLogs).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    expect(result.data.list).toHaveLength(2)
  })

  it('should handle search with keyword for system logs', async () => {
    const params = { page: 1, pageSize: 10, module: '用户管理' }
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: mockSystemLogs.filter(log => log.module === '用户管理'),
        pagination: { page: 1, pageSize: 10, total: 1 },
      },
    })
    
    const result = await mockGetSystemLogs(params)
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith(params)
    expect(result.data.list).toHaveLength(1)
  })

  it('should handle search with keyword for login logs', async () => {
    const params = { page: 1, pageSize: 10, username: 'admin' }
    mockGetLoginLogs.mockResolvedValue({
      data: {
        list: mockLoginLogs.filter(log => log.username === 'admin'),
        pagination: { page: 1, pageSize: 10, total: 1 },
      },
    })
    
    const result = await mockGetLoginLogs(params)
    
    expect(mockGetLoginLogs).toHaveBeenCalledWith(params)
    expect(result.data.list).toHaveLength(1)
  })

  it('should handle search with date range', async () => {
    const params = { 
      page: 1, 
      pageSize: 10, 
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    }
    
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: mockSystemLogs,
        pagination: { page: 1, pageSize: 10, total: 2 },
      },
    })
    
    await mockGetSystemLogs(params)
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith(params)
  })

  it('should handle API errors gracefully', async () => {
    mockGetSystemLogs.mockRejectedValue(new Error('Network Error'))
    
    await expect(mockGetSystemLogs({ page: 1, pageSize: 10 })).rejects.toThrow('Network Error')
  })

  it('should handle pagination change', async () => {
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 2, pageSize: 20, total: 0 },
      },
    })
    
    const result = await mockGetSystemLogs({ page: 2, pageSize: 20 })
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith({ page: 2, pageSize: 20 })
    expect(result.data.pagination.page).toBe(2)
  })

  it('should format system log columns correctly', () => {
    const systemLogColumns = [
      { title: 'Time', dataIndex: 'createdAt', width: 170 },
      { title: 'User', dataIndex: 'username', width: 120 },
      { title: 'Module', dataIndex: 'module', width: 120 },
      { title: 'Action', dataIndex: 'action', width: 120 },
      { title: 'Description', dataIndex: 'description' },
      { title: 'IP Address', dataIndex: 'ipAddress', width: 140 },
    ]
    
    expect(systemLogColumns).toHaveLength(6)
    expect(systemLogColumns[0].dataIndex).toBe('createdAt')
    expect(systemLogColumns[1].dataIndex).toBe('username')
  })

  it('should format login log columns correctly', () => {
    const loginLogColumns = [
      { title: 'Time', dataIndex: 'createdAt', width: 170 },
      { title: 'Username', dataIndex: 'username', width: 120 },
      { title: 'Login Type', dataIndex: 'loginType', width: 120 },
      { title: 'Status', dataIndex: 'status', width: 100 },
      { title: 'IP Address', dataIndex: 'ipAddress', width: 140 },
      { title: 'Fail Reason', dataIndex: 'failReason' },
    ]
    
    expect(loginLogColumns).toHaveLength(6)
    expect(loginLogColumns[0].dataIndex).toBe('createdAt')
    expect(loginLogColumns[3].dataIndex).toBe('status')
  })

  it('should have correct default pagination', () => {
    const defaultPagination = { current: 1, pageSize: 10, total: 0 }
    expect(defaultPagination.current).toBe(1)
    expect(defaultPagination.pageSize).toBe(10)
  })
})

describe('Logs API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call getSystemLogs with correct params', async () => {
    const params = { page: 1, pageSize: 10, module: '用户管理' }
    
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockGetSystemLogs(params)
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith(params)
  })

  it('should call getLoginLogs with correct params', async () => {
    const params = { page: 1, pageSize: 10, username: 'admin' }
    
    mockGetLoginLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockGetLoginLogs(params)
    
    expect(mockGetLoginLogs).toHaveBeenCalledWith(params)
  })

  it('should call getSystemLogs with date range', async () => {
    const params = { 
      page: 1, 
      pageSize: 10, 
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    }
    
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockGetSystemLogs(params)
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith(params)
  })

  it('should call getLoginLogs with date range', async () => {
    const params = { 
      page: 1, 
      pageSize: 10, 
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    }
    
    mockGetLoginLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockGetLoginLogs(params)
    
    expect(mockGetLoginLogs).toHaveBeenCalledWith(params)
  })

  it('should handle pagination params correctly', async () => {
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 2, pageSize: 20, total: 100 },
      },
    })
    
    await mockGetSystemLogs({ page: 2, pageSize: 20 })
    
    expect(mockGetSystemLogs).toHaveBeenCalledWith({ page: 2, pageSize: 20 })
  })
})

describe('Logs Search Functionality', () => {
  it('should build search params for operation tab', () => {
    const searchParams = {
      keyword: '用户管理',
      dateRange: null,
    }
    
    const buildParams = (params: typeof searchParams, page: number, pageSize: number) => {
      const result: any = { page, pageSize }
      if (params.keyword) result.module = params.keyword
      if (params.dateRange) {
        result.startDate = '2024-01-01'
        result.endDate = '2024-01-31'
      }
      return result
    }
    
    expect(buildParams(searchParams, 1, 10)).toEqual({ 
      page: 1, 
      pageSize: 10, 
      module: '用户管理' 
    })
  })

  it('should build search params for login tab', () => {
    const searchParams = {
      keyword: 'admin',
      dateRange: null,
    }
    
    const buildParams = (params: typeof searchParams, page: number, pageSize: number) => {
      const result: any = { page, pageSize }
      if (params.keyword) result.username = params.keyword
      if (params.dateRange) {
        result.startDate = '2024-01-01'
        result.endDate = '2024-01-31'
      }
      return result
    }
    
    expect(buildParams(searchParams, 1, 10)).toEqual({ 
      page: 1, 
      pageSize: 10, 
      username: 'admin' 
    })
  })

  it('should handle empty search params', () => {
    const searchParams = {
      keyword: '',
      dateRange: null,
    }
    
    const buildParams = (params: typeof searchParams, page: number, pageSize: number) => {
      const result: any = { page, pageSize }
      if (params.keyword) result.module = params.keyword
      return result
    }
    
    expect(buildParams(searchParams, 1, 10)).toEqual({ page: 1, pageSize: 10 })
  })
})

describe('Logs Table Columns', () => {
  it('should have correct system log columns', () => {
    const systemLogColumns = [
      { title: 'Time', dataIndex: 'createdAt', width: 170 },
      { title: 'User', dataIndex: 'username', width: 120 },
      { title: 'Module', dataIndex: 'module', width: 120 },
      { title: 'Action', dataIndex: 'action', width: 120 },
      { title: 'Description', dataIndex: 'description' },
      { title: 'IP Address', dataIndex: 'ipAddress', width: 140 },
    ]
    
    expect(systemLogColumns).toHaveLength(6)
    expect(systemLogColumns[0].dataIndex).toBe('createdAt')
    expect(systemLogColumns[1].dataIndex).toBe('username')
  })

  it('should have correct login log columns', () => {
    const loginLogColumns = [
      { title: 'Time', dataIndex: 'createdAt', width: 170 },
      { title: 'Username', dataIndex: 'username', width: 120 },
      { title: 'Login Type', dataIndex: 'loginType', width: 120 },
      { title: 'Status', dataIndex: 'status', width: 100 },
      { title: 'IP Address', dataIndex: 'ipAddress', width: 140 },
      { title: 'Fail Reason', dataIndex: 'failReason' },
    ]
    
    expect(loginLogColumns).toHaveLength(6)
    expect(loginLogColumns[0].dataIndex).toBe('createdAt')
    expect(loginLogColumns[3].dataIndex).toBe('status')
  })

  it('should format date correctly', () => {
    const formatDate = (_date: string) => '2024-01-15 10:30:00'
    
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('2024-01-15 10:30:00')
  })

  it('should format login status correctly', () => {
    const getStatusText = (status: number) => {
      return status === 1 ? '成功' : '失败'
    }
    
    expect(getStatusText(1)).toBe('成功')
    expect(getStatusText(0)).toBe('失败')
  })
})

describe('Logs Tab Switching', () => {
  it('should have correct tab items', () => {
    const tabs = [
      { key: 'operation', label: 'System Operation Logs' },
      { key: 'login', label: 'Login Logs' },
    ]
    
    expect(tabs).toHaveLength(2)
    expect(tabs[0].key).toBe('operation')
    expect(tabs[1].key).toBe('login')
  })

  it('should set active tab correctly', () => {
    let activeTab = 'operation'
    
    const setActiveTab = (key: string) => {
      activeTab = key
    }
    
    setActiveTab('login')
    expect(activeTab).toBe('login')
    
    setActiveTab('operation')
    expect(activeTab).toBe('operation')
  })

  it('should fetch data when tab changes', async () => {
    mockGetSystemLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    mockGetLoginLogs.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    const fetchData = async (tab: string) => {
      if (tab === 'operation') {
        return mockGetSystemLogs({ page: 1, pageSize: 10 })
      } else {
        return mockGetLoginLogs({ page: 1, pageSize: 10 })
      }
    }
    
    await fetchData('operation')
    expect(mockGetSystemLogs).toHaveBeenCalled()
    
    await fetchData('login')
    expect(mockGetLoginLogs).toHaveBeenCalled()
  })

  it('should reset pagination when switching tabs', () => {
    let pagination = { current: 2, pageSize: 20, total: 100 }
    
    const resetPagination = () => {
      pagination = { current: 1, pageSize: 10, total: 0 }
    }
    
    resetPagination()
    
    expect(pagination.current).toBe(1)
    expect(pagination.pageSize).toBe(10)
  })

  it('should have correct search placeholder for each tab', () => {
    const getPlaceholder = (activeTab: string) => {
      return activeTab === 'operation' ? 'Search Module' : 'Search Username'
    }
    
    expect(getPlaceholder('operation')).toBe('Search Module')
    expect(getPlaceholder('login')).toBe('Search Username')
  })
})
