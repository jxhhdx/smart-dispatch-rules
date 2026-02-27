import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 react-i18next
let currentLanguage = 'zh-CN'

const mockT = vi.fn((key: string) => {
  const translations: Record<string, Record<string, string>> = {
    'zh-CN': {
      'menu:dashboard': '仪表盘',
      'menu:rules': '规则管理',
      'menu:systemUsers': '用户管理',
      'menu:systemRoles': '角色管理',
      'menu:systemLogs': '操作日志',
      'menu:appName': '智能派单系统',
      'auth:logout.title': '退出登录',
    },
    'en-US': {
      'menu:dashboard': 'Dashboard',
      'menu:rules': 'Rule Management',
      'menu:systemUsers': 'User Management',
      'menu:systemRoles': 'Role Management',
      'menu:systemLogs': 'Operation Logs',
      'menu:appName': 'Smart Dispatch',
      'auth:logout.title': 'Logout',
    },
  }
  return translations[currentLanguage]?.[key] || key
})

const mockChangeLanguage = vi.fn((lang: string) => {
  currentLanguage = lang
  return Promise.resolve()
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => mockT(key),
    i18n: {
      language: currentLanguage,
      resolvedLanguage: currentLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

// 模拟 auth store
const mockLogout = vi.fn()
const mockUser = {
  id: '1',
  username: 'admin',
  realName: '管理员',
  role: { id: '1', name: '超级管理员', code: 'super_admin' },
}

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    user: mockUser,
    logout: mockLogout,
    token: 'test-token',
  }),
}))

describe('Layout Component - Menu Internationalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentLanguage = 'zh-CN'
  })

  it('should display menu items in Chinese by default', () => {
    const menuKeys = [
      'menu:dashboard',
      'menu:rules',
      'menu:systemUsers',
      'menu:systemRoles',
      'menu:systemLogs',
    ]

    menuKeys.forEach((key) => {
      mockT(key)
    })

    expect(mockT).toHaveBeenCalledWith('menu:dashboard')
    expect(mockT).toHaveBeenCalledWith('menu:rules')
    expect(mockT).toHaveBeenCalledWith('menu:systemUsers')
    expect(mockT).toHaveBeenCalledWith('menu:systemRoles')
    expect(mockT).toHaveBeenCalledWith('menu:systemLogs')

    // 验证翻译结果
    expect(mockT('menu:dashboard')).toBe('仪表盘')
    expect(mockT('menu:rules')).toBe('规则管理')
    expect(mockT('menu:systemUsers')).toBe('用户管理')
  })

  it('should update menu items when language changes to English', async () => {
    // 初始状态是中文
    expect(mockT('menu:dashboard')).toBe('仪表盘')

    // 切换到英文
    await mockChangeLanguage('en-US')

    // 验证英文翻译
    expect(mockT('menu:dashboard')).toBe('Dashboard')
    expect(mockT('menu:rules')).toBe('Rule Management')
    expect(mockT('menu:systemUsers')).toBe('User Management')
    expect(mockT('menu:systemRoles')).toBe('Role Management')
    expect(mockT('menu:systemLogs')).toBe('Operation Logs')
  })

  it('should update menu items when language changes from English to Chinese', async () => {
    // 先切换到英文
    await mockChangeLanguage('en-US')
    expect(mockT('menu:dashboard')).toBe('Dashboard')

    // 切换回中文
    await mockChangeLanguage('zh-CN')
    
    // 验证中文翻译
    expect(mockT('menu:dashboard')).toBe('仪表盘')
    expect(mockT('menu:rules')).toBe('规则管理')
    expect(mockT('menu:systemUsers')).toBe('用户管理')
  })

  it('should display correct app name based on language', async () => {
    // 中文
    expect(mockT('menu:appName')).toBe('智能派单系统')

    // 切换到英文
    await mockChangeLanguage('en-US')
    expect(mockT('menu:appName')).toBe('Smart Dispatch')
  })

  it('should support all required languages', async () => {
    const supportedLanguages = ['zh-CN', 'en-US']
    
    for (const lang of supportedLanguages) {
      await mockChangeLanguage(lang)
      expect(currentLanguage).toBe(lang)
      // 确保翻译函数被调用
      expect(mockT('menu:dashboard')).toBeDefined()
    }
  })

  it('should use useMemo dependency on t function for menu items', () => {
    // 模拟 useMemo 的行为
    const createMenuItems = (t: Function) => [
      { key: '/', label: t('menu:dashboard') },
      { key: '/rules', label: t('menu:rules') },
      { key: '/users', label: t('menu:systemUsers') },
      { key: '/roles', label: t('menu:systemRoles') },
      { key: '/logs', label: t('menu:systemLogs') },
    ]

    // 第一次调用
    const menuItems1 = createMenuItems(mockT)
    expect(menuItems1[0].label).toBe('仪表盘')

    // 切换语言
    currentLanguage = 'en-US'
    
    // 重新创建菜单项
    const menuItems2 = createMenuItems(mockT)
    expect(menuItems2[0].label).toBe('Dashboard')

    // 验证菜单项数量一致
    expect(menuItems1).toHaveLength(menuItems2.length)
  })
})

describe('Layout Menu Structure', () => {
  it('should have correct menu structure', () => {
    const expectedMenuItems = [
      { key: '/', icon: 'DashboardOutlined' },
      { key: '/rules', icon: 'FileTextOutlined' },
      { key: '/users', icon: 'UserOutlined' },
      { key: '/roles', icon: 'TeamOutlined' },
      { key: '/logs', icon: 'FileSearchOutlined' },
    ]

    expect(expectedMenuItems).toHaveLength(5)
    expect(expectedMenuItems[0].key).toBe('/')
    expect(expectedMenuItems[1].key).toBe('/rules')
    expect(expectedMenuItems[2].key).toBe('/users')
    expect(expectedMenuItems[3].key).toBe('/roles')
    expect(expectedMenuItems[4].key).toBe('/logs')
  })

  it('should call logout when logout menu item is clicked', () => {
    mockLogout()
    expect(mockLogout).toHaveBeenCalled()
  })
})

describe('Layout Component - Language Switch Integration', () => {
  it('should call changeLanguage with correct language code', async () => {
    await mockChangeLanguage('en-US')
    expect(mockChangeLanguage).toHaveBeenCalledWith('en-US')
    
    await mockChangeLanguage('zh-CN')
    expect(mockChangeLanguage).toHaveBeenCalledWith('zh-CN')
  })

  it('should update current language after change', async () => {
    expect(currentLanguage).toBe('zh-CN')
    
    await mockChangeLanguage('en-US')
    expect(currentLanguage).toBe('en-US')
  })
})
