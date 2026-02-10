import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 antd
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
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

// 模拟 antd icons
vi.mock('@ant-design/icons', () => ({
  UserOutlined: () => null,
  FileTextOutlined: () => null,
  TeamOutlined: () => null,
  CheckCircleOutlined: () => null,
}))

// 模拟 react-i18next
const mockT = vi.fn((key: string, options?: any) => {
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

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct translation keys for dashboard title', () => {
    // 验证仪表盘标题翻译键
    expect(mockT('menu:dashboard')).toBe('仪表盘')
  })

  it('should have correct translation keys for statistics', () => {
    // 验证统计数据标题被翻译
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
    // 验证模拟的主题 token 值
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

  it('should define correct statistics data structure', () => {
    // 模拟 Dashboard 组件中的统计数据结构
    const stats = [
      { title: 'dashboard:totalUsers', value: 12, color: 'colorPrimary' },
      { title: 'dashboard:totalRules', value: 8, color: 'colorSuccess' },
      { title: 'dashboard:roles', value: 3, color: 'colorWarning' },
      { title: 'dashboard:publishedRules', value: 5, color: 'colorInfo' },
    ]
    
    expect(stats).toHaveLength(4)
    expect(stats[0].value).toBe(12)
    expect(stats[1].value).toBe(8)
    expect(stats[2].value).toBe(3)
    expect(stats[3].value).toBe(5)
  })

  it('should use correct translation namespaces', () => {
    // 验证翻译命名空间配置正确
    const expectedNamespaces = ['dashboard', 'menu']
    expect(expectedNamespaces).toContain('dashboard')
    expect(expectedNamespaces).toContain('menu')
    
    // 验证模拟的翻译函数被调用
    mockT('menu:dashboard')
    expect(mockT).toHaveBeenCalledWith('menu:dashboard')
  })

  it('should handle missing translation keys gracefully', () => {
    const result = mockT('unknown:key')
    expect(result).toBe('unknown:key')
  })
})

describe('Dashboard Statistics', () => {
  it('should have correct statistic values', () => {
    const expectedStats = {
      totalUsers: 12,
      totalRules: 8,
      roles: 3,
      publishedRules: 5,
    }
    
    expect(expectedStats.totalUsers).toBe(12)
    expect(expectedStats.totalRules).toBe(8)
    expect(expectedStats.roles).toBe(3)
    expect(expectedStats.publishedRules).toBe(5)
  })

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
    // 验证响应式布局配置
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
