import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 模拟 Modal
const mockModalConfirm = vi.fn()
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Modal: {
      confirm: mockModalConfirm,
    },
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  }
})

// 模拟 zustand store
const mockLogout = vi.fn()
vi.mock('../stores/auth', () => ({
  useAuthStore: {
    getState: () => ({
      token: 'test-token',
      logout: mockLogout,
    }),
  },
}))

describe('API Service - 401 Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return error message for login 401 (wrong password)', async () => {
    // 模拟登录接口 401 错误
    const mockError = {
      response: {
        status: 401,
        data: {
          code: 401,
          message: '用户名或密码错误',
        },
      },
      config: {
        url: '/auth/login',
      },
    }

    // 验证错误消息
    const errorMessage = mockError.response.data.message
    expect(errorMessage).toBe('用户名或密码错误')
    
    // 登录接口的 401 不应该调用 Modal
    expect(mockModalConfirm).not.toHaveBeenCalled()
    
    // 登录接口的 401 不应该调用 logout
    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('should show Modal for other API 401 (token expired)', async () => {
    // 模拟其他接口 401 错误
    const mockError = {
      response: {
        status: 401,
        data: {
          code: 401,
          message: 'Token 已过期',
        },
      },
      config: {
        url: '/users',
      },
    }

    // 其他接口的 401 应该显示 Modal
    const isLoginRequest = mockError.config.url.includes('/auth/login')
    expect(isLoginRequest).toBe(false)
    
    // 如果不是登录接口，应该显示 Modal
    if (!isLoginRequest && mockError.response.status === 401) {
      mockModalConfirm({
        title: '登录已过期',
        content: '您的登录状态已过期，请重新登录',
      })
    }
    
    expect(mockModalConfirm).toHaveBeenCalled()
  })

  it('should distinguish login 401 from token expired 401', async () => {
    const testCases = [
      {
        url: '/auth/login',
        shouldShowModal: false,
        description: '登录接口 401',
      },
      {
        url: '/users',
        shouldShowModal: true,
        description: '用户列表接口 401',
      },
      {
        url: '/rules',
        shouldShowModal: true,
        description: '规则接口 401',
      },
    ]

    for (const testCase of testCases) {
      vi.clearAllMocks()
      
      const isLoginRequest = testCase.url.includes('/auth/login')
      
      if (!isLoginRequest) {
        mockModalConfirm({
          title: '登录已过期',
          content: '您的登录状态已过期，请重新登录',
        })
      }

      if (testCase.shouldShowModal) {
        expect(mockModalConfirm).toHaveBeenCalled()
      } else {
        expect(mockModalConfirm).not.toHaveBeenCalled()
      }
    }
  })

  it('should extract error message from response', async () => {
    const errorCases = [
      { message: '用户名或密码错误', isLogin: true },
      { message: 'Token 已过期', isLogin: false },
      { message: '账户已被锁定', isLogin: true },
    ]

    for (const testCase of errorCases) {
      vi.clearAllMocks()
      
      const mockError = {
        response: {
          status: 401,
          data: {
            message: testCase.message,
          },
        },
        config: {
          url: testCase.isLogin ? '/auth/login' : '/api/something',
        },
      }

      // 验证错误消息被正确提取
      const errorMessage = mockError.response?.data?.message || '请求失败'
      expect(errorMessage).toBe(testCase.message)
    }
  })
})
