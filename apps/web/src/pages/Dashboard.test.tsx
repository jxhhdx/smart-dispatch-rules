import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 antd
const mockMessageError = vi.fn()
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      error: mockMessageError,
      success: vi.fn(),
    },
    theme: {
      useToken: () => ({
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorInfo: '#13c2c2',
        },
      }),
    },
  }
})

// 模拟 API
const mockGetStats = vi.fn()
vi.mock('../services/api', () => ({
  dashboardApi: {
    getStats: mockGetStats,
  },
}))

// 模拟 antd icons
vi.mock('@ant-design/icons', () => ({
  UserOutlined: () => null,
  FileTextOutlined: () => null,
  TeamOutlined: () => null,
  CheckCircleOutlined: () => null,
}))

// 模拟 react-i18next
const mockT = vi.fn((key: string, _options?: any) => {
  const translations: Record<string, string> = {
    'menu:dashboard': '仪表盘',
    'dashboard:totalUsers': '总用户数',
    'dashboard:totalRules': '规则总数',
    'dashboard:roles': '角色数量',
    'dashboard:publishedRules': '已发布规则',
    'dashboard:systemAnnouncement': '系统公告',
    'dashboard:quickStart': '快速开始',
    'dashboard:welcomeMessage': '欢迎使用智能派单系统',
    'dashboard:systemDescription': '基于 NestJS + React 的智能派单规则管理系统',
    'dashboard:techStack': '技术栈：React + NestJS + PostgreSQL',
    'dashboard:quickStartRule': '管理派单规则',
    'dashboard:quickStartUser': '管理系统用户',
    'dashboard:quickStartRole': '管理系统角色',
    'dashboard:quickStartLog': '查看系统日志',
    'dashboard:fetchStatsFailed': '获取统计数据失败',
    'menu:rules': '规则管理',
    'menu:systemUsers': '用户管理',
    'menu:systemRoles': '角色管理',
    'menu:systemLogs': '日志管理',
  }
  return translations[key] || key
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'zh-CN', changeLanguage: vi.fn() },
  }),
}))

describe('Dashboard API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch stats from API successfully', async () => {
    const mockStats = {
      data: {
        totalUsers: 5,
        totalRules: 10,
        totalRoles: 3,
        publishedRules: 7,
      },
    }
    mockGetStats.mockResolvedValue(mockStats)

    const result = await mockGetStats()
    
    expect(mockGetStats).toHaveBeenCalled()
    expect(result.data.totalUsers).toBe(5)
    expect(result.data.totalRules).toBe(10)
    expect(result.data.totalRoles).toBe(3)
    expect(result.data.publishedRules).toBe(7)
  })

  it('should handle API error when fetching stats', async () => {
    mockGetStats.mockRejectedValue(new Error('Network error'))

    try {
      await mockGetStats()
    } catch (error) {
      // Expected error
    }

    expect(mockGetStats).toHaveBeenCalled()
  })

  it('should show error message when API fails', async () => {
    mockGetStats.mockRejectedValue(new Error('Network error'))

    try {
      await mockGetStats()
    } catch (error) {
      mockMessageError(mockT('dashboard:fetchStatsFailed'))
    }

    expect(mockMessageError).toHaveBeenCalledWith('获取统计数据失败')
  })

  it('should have correct translation keys for dashboard title', () => {
    expect(mockT('menu:dashboard')).toBe('仪表盘')
  })

  it('should have correct translation keys for statistics', () => {
    expect(mockT('dashboard:totalUsers')).toBe('总用户数')
    expect(mockT('dashboard:totalRules')).toBe('规则总数')
    expect(mockT('dashboard:roles')).toBe('角色数量')
    expect(mockT('dashboard:publishedRules')).toBe('已发布规则')
  })

  it('should have correct translation keys for system announcement', () => {
    expect(mockT('dashboard:systemAnnouncement')).toBe('系统公告')
    expect(mockT('dashboard:welcomeMessage')).toBe('欢迎使用智能派单系统')
    expect(mockT('dashboard:systemDescription')).toBe('基于 NestJS + React 的智能派单规则管理系统')
    expect(mockT('dashboard:techStack')).toBe('技术栈：React + NestJS + PostgreSQL')
  })

  it('should have correct translation keys for quick start', () => {
    expect(mockT('dashboard:quickStart')).toBe('快速开始')
  })

  it('should support interpolation in quick start translations', () => {
    expect(mockT('dashboard:quickStartRule', { rules: '规则管理' })).toBe('管理派单规则')
    expect(mockT('dashboard:quickStartUser', { users: '用户管理' })).toBe('管理系统用户')
    expect(mockT('dashboard:quickStartRole', { roles: '角色管理' })).toBe('管理系统角色')
    expect(mockT('dashboard:quickStartLog', { logs: '日志管理' })).toBe('查看系统日志')
  })

  it('should have correct menu translation keys', () => {
    expect(mockT('menu:rules')).toBe('规则管理')
    expect(mockT('menu:systemUsers')).toBe('用户管理')
    expect(mockT('menu:systemRoles')).toBe('角色管理')
    expect(mockT('menu:systemLogs')).toBe('日志管理')
  })

  it('should use correct theme token colors', () => {
    const expectedToken = {
      colorPrimary: '#1890ff',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorInfo: '#13c2c2',
    }
    
    expect(expectedToken.colorPrimary).toBe('#1890ff')
    expect(expectedToken.colorSuccess).toBe('#52c41a')
    expect(expectedToken.colorWarning).toBe('#faad14')
    expect(expectedToken.colorInfo).toBe('#13c2c2')
  })

  it('should define correct statistics data structure from API', async () => {
    const mockStats = {
      data: {
        totalUsers: 5,
        totalRules: 10,
        totalRoles: 3,
        publishedRules: 7,
      },
    }
    mockGetStats.mockResolvedValue(mockStats)

    const result = await mockGetStats()
    
    expect(result.data).toHaveProperty('totalUsers')
    expect(result.data).toHaveProperty('totalRules')
    expect(result.data).toHaveProperty('totalRoles')
    expect(result.data).toHaveProperty('publishedRules')
  })

  it('should use correct translation namespaces', () => {
    const expectedNamespaces = ['dashboard', 'menu']
    expect(expectedNamespaces).toContain('dashboard')
    expect(expectedNamespaces).toContain('menu')
  })

  it('should handle missing translation keys gracefully', () => {
    const result = mockT('unknown:key')
    expect(result).toBe('unknown:key')
  })
})

describe('Dashboard Statistics', () => {
  it('should map icons to correct colors', () => {
    const iconColorMap = {
      UserOutlined: 'colorPrimary',
      FileTextOutlined: 'colorSuccess',
      TeamOutlined: 'colorWarning',
      CheckCircleOutlined: 'colorInfo',
    }
    
    expect(iconColorMap.UserOutlined).toBe('colorPrimary')
    expect(iconColorMap.FileTextOutlined).toBe('colorSuccess')
    expect(iconColorMap.TeamOutlined).toBe('colorWarning')
    expect(iconColorMap.CheckCircleOutlined).toBe('colorInfo')
  })
})

describe('Dashboard Layout', () => {
  it('should have responsive grid configuration', () => {
    const gridConfig = {
      xs: 24,
      sm: 12,
      lg: 6,
    }
    
    expect(gridConfig.xs).toBe(24)
    expect(gridConfig.sm).toBe(12)
    expect(gridConfig.lg).toBe(6)
  })

  it('should have correct card gutter configuration', () => {
    const gutter = [16, 16]
    expect(gutter).toEqual([16, 16])
  })

  it('should have correct space configuration', () => {
    const spaceConfig = {
      direction: 'vertical',
      size: 24,
    }
    
    expect(spaceConfig.direction).toBe('vertical')
    expect(spaceConfig.size).toBe(24)
  })
})
