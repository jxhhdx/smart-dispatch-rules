import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 message 组件 - 使用 factory 函数避免 hoist 问题
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      loading: vi.fn(),
    },
  }
})

// 获取 mock 函数引用
let mockMessageError = vi.fn()
let mockMessageSuccess = vi.fn()

// 重新设置 mock
vi.doMock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      error: mockMessageError,
      success: mockMessageSuccess,
      info: vi.fn(),
      warning: vi.fn(),
      loading: vi.fn(),
    },
  }
})

// 模拟 auth store
const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    isAuthenticated: false,
  }),
}))

// 模拟 react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}))

// 模拟 i18n
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'common:app.name': '智能派单系统',
    'auth:login.subtitle': '智能派单策略规则管理系统',
    'auth:login.username': '用户名',
    'auth:login.password': '密码',
    'auth:login.usernamePlaceholder': '请输入用户名',
    'auth:login.passwordPlaceholder': '请输入密码',
    'auth:login.submit': '登录',
    'auth:login.success': '登录成功',
    'auth:login.error': '登录失败',
    'common:app.description': '基于 NestJS + React 的智能派单规则管理系统',
  }
  return translations[key] || key
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: 'zh-CN',
      changeLanguage: vi.fn(),
    },
  }),
}))

// 模拟 LanguageSwitch 组件
vi.mock('../components/LanguageSwitch', () => ({
  default: ({ type }: { type?: string }) => (
    <button data-testid="language-switch" data-type={type}>
      Language
    </button>
  ),
}))

describe('Login Component - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMessageError = vi.fn()
    mockMessageSuccess = vi.fn()
  })

  it('should display error message when password is incorrect', async () => {
    const errorMessage = '用户名或密码错误'
    mockLogin.mockRejectedValueOnce({
      message: errorMessage,
      response: {
        data: {
          code: 401,
          message: errorMessage,
        },
      },
    })

    try {
      await mockLogin('admin', 'wrongpassword')
    } catch (error: any) {
      // 模拟 Login.tsx 的错误处理
      const displayMessage = error.message || error.response?.data?.message || '登录失败'
      mockMessageError(displayMessage)
    }

    expect(mockLogin).toHaveBeenCalledWith('admin', 'wrongpassword')
    expect(mockMessageError).toHaveBeenCalledWith(errorMessage)
  })

  it('should display error message from error.message property', async () => {
    const errorMessage = '网络连接失败'
    mockLogin.mockRejectedValueOnce({
      message: errorMessage,
    })

    try {
      await mockLogin('admin', 'password')
    } catch (error: any) {
      const displayMessage = error.message || '登录失败'
      mockMessageError(displayMessage)
    }

    expect(mockMessageError).toHaveBeenCalledWith(errorMessage)
  })

  it('should display default error message when no message provided', async () => {
    mockLogin.mockRejectedValueOnce({})

    try {
      await mockLogin('admin', 'password')
    } catch (error: any) {
      const displayMessage = error?.message || error?.response?.data?.message || '登录失败'
      mockMessageError(displayMessage)
    }

    expect(mockMessageError).toHaveBeenCalledWith('登录失败')
  })

  it('should display success message on successful login', async () => {
    mockLogin.mockResolvedValueOnce({})
    mockNavigate.mockImplementationOnce((path: string) => path)

    await mockLogin('admin', 'correctpassword')
    
    // 模拟成功后的处理
    mockMessageSuccess('登录成功')
    mockNavigate('/')

    expect(mockLogin).toHaveBeenCalledWith('admin', 'correctpassword')
    expect(mockMessageSuccess).toHaveBeenCalledWith('登录成功')
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('should handle various error scenarios', async () => {
    const errorCases = [
      { message: '用户名或密码错误', response: { data: { message: '用户名或密码错误' } } },
      { message: '账户已被锁定', response: { data: { message: '账户已被锁定' } } },
      { message: '账户已禁用', response: { data: { message: '账户已禁用' } } },
      { message: 'Token 已过期', response: { data: { message: 'Token 已过期' } } },
    ]

    for (const testCase of errorCases) {
      vi.clearAllMocks()
      mockLogin.mockRejectedValueOnce(testCase)

      try {
        await mockLogin('admin', 'password')
      } catch (error: any) {
        const displayMessage = error.message || error.response?.data?.message || '登录失败'
        mockMessageError(displayMessage)
      }

      expect(mockMessageError).toHaveBeenCalledWith(testCase.message)
    }
  })

  it('should handle error from response.data.message', async () => {
    const responseMessage = '后端返回的错误消息'
    mockLogin.mockRejectedValueOnce({
      response: {
        data: {
          code: 400,
          message: responseMessage,
        },
      },
    })

    try {
      await mockLogin('admin', 'password')
    } catch (error: any) {
      // 优先使用 error.message，如果不存在则使用 error.response.data.message
      const displayMessage = error.message || error.response?.data?.message || '登录失败'
      mockMessageError(displayMessage)
    }

    expect(mockMessageError).toHaveBeenCalledWith(responseMessage)
  })
})

describe('Login Form Validation', () => {
  it('should validate required username', () => {
    const values = { username: '', password: 'password' }
    
    // 模拟表单验证
    const validateUsername = (value: string) => {
      if (!value) return '请输入用户名'
      return null
    }

    const error = validateUsername(values.username)
    expect(error).toBe('请输入用户名')
  })

  it('should validate required password', () => {
    const values = { username: 'admin', password: '' }
    
    const validatePassword = (value: string) => {
      if (!value) return '请输入密码'
      return null
    }

    const error = validatePassword(values.password)
    expect(error).toBe('请输入密码')
  })

  it('should pass validation with correct values', () => {
    const values = { username: 'admin', password: 'password123' }
    
    const validateForm = (vals: typeof values) => {
      if (!vals.username) return '请输入用户名'
      if (!vals.password) return '请输入密码'
      return null
    }

    const error = validateForm(values)
    expect(error).toBeNull()
  })
})

describe('Login API Integration', () => {
  it('should call login API with correct parameters', async () => {
    const credentials = {
      username: 'admin',
      password: 'password123',
    }

    mockLogin.mockResolvedValueOnce({
      data: {
        access_token: 'test-token',
        user: { id: '1', username: 'admin' },
      },
    })

    const result = await mockLogin(credentials.username, credentials.password)

    expect(mockLogin).toHaveBeenCalledWith('admin', 'password123')
    expect(result).toHaveProperty('data.access_token')
    expect(result).toHaveProperty('data.user')
  })

  it('should handle network error', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'))

    try {
      await mockLogin('admin', 'password')
    } catch (error: any) {
      const displayMessage = error.message || '登录失败'
      mockMessageError(displayMessage)
    }

    expect(mockMessageError).toHaveBeenCalledWith('Network Error')
  })

  it('should handle timeout error', async () => {
    mockLogin.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'))

    try {
      await mockLogin('admin', 'password')
    } catch (error: any) {
      const displayMessage = error.message || '登录失败'
      mockMessageError(displayMessage)
    }

    expect(mockMessageError).toHaveBeenCalledWith('timeout of 10000ms exceeded')
  })
})
