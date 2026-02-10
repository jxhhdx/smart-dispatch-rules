import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 模拟 localStorage
const localStorageMock: Record<string, string> = {}

// 模拟 window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

// 模拟 authApi
const mockLogin = vi.fn()
const mockGetProfile = vi.fn()
const mockLogout = vi.fn()

vi.mock('../services/api', () => ({
  authApi: {
    login: (...args: any[]) => mockLogin(...args),
    getProfile: () => mockGetProfile(),
    logout: () => mockLogout(),
  },
}))

// 模拟 zustand persist

vi.mock('zustand/middleware', () => ({
  persist: (config: any) => (set: any, get: any, store: any) => {
    const persistedState = { ...config(set, get, store) }
    return persistedState
  },
  createJSONStorage: () => ({
    getItem: (key: string) => localStorageMock[key] || null,
    setItem: (key: string, value: string) => { localStorageMock[key] = value },
    removeItem: (key: string) => { delete localStorageMock[key] },
  }),
}))

// 导入 store（在 mock 之后）
import { useAuthStore } from './auth'

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])
    window.location.href = ''
    
    // 重置 store 状态
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should login successfully', async () => {
    const mockToken = 'test-token-123'
    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@test.com',
      role: { id: '1', name: '管理员', code: 'admin' },
    }
    
    mockLogin.mockResolvedValue({
      data: {
        access_token: mockToken,
        user: mockUser,
      },
    })
    
    await useAuthStore.getState().login('admin', 'password123')
    
    expect(mockLogin).toHaveBeenCalledWith('admin', 'password123')
    
    const state = useAuthStore.getState()
    expect(state.token).toBe(mockToken)
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should handle login failure', async () => {
    const errorMessage = '用户名或密码错误'
    mockLogin.mockRejectedValue(new Error(errorMessage))
    
    await expect(useAuthStore.getState().login('admin', 'wrongpassword')).rejects.toThrow(errorMessage)
    
    expect(mockLogin).toHaveBeenCalledWith('admin', 'wrongpassword')
    
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should logout successfully', () => {
    // 先设置登录状态
    useAuthStore.setState({
      token: 'test-token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    useAuthStore.getState().logout()
    
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should redirect to login on logout', () => {
    // 先设置登录状态
    useAuthStore.setState({
      token: 'test-token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
    
    useAuthStore.getState().logout()
    
    expect(window.location.href).toBe('/login')
  })

  it('should check auth with valid token', async () => {
    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@test.com',
      role: { id: '1', name: '管理员', code: 'admin' },
    }
    
    useAuthStore.setState({
      token: 'valid-token',
      user: null,
      isAuthenticated: false,
    })
    
    mockGetProfile.mockResolvedValue({
      data: mockUser,
    })
    
    await useAuthStore.getState().checkAuth()
    
    expect(mockGetProfile).toHaveBeenCalled()
    
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should check auth with no token', async () => {
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
    
    await useAuthStore.getState().checkAuth()
    
    expect(mockGetProfile).not.toHaveBeenCalled()
    
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should clear auth on check auth failure', async () => {
    useAuthStore.setState({
      token: 'invalid-token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    mockGetProfile.mockRejectedValue(new Error('Token expired'))
    
    await useAuthStore.getState().checkAuth()
    
    expect(mockGetProfile).toHaveBeenCalled()
    
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should handle login API error with response data', async () => {
    const errorResponse = {
      response: {
        data: {
          code: 401,
          message: '密码错误',
        },
      },
    }
    mockLogin.mockRejectedValue(errorResponse)
    
    await expect(useAuthStore.getState().login('admin', 'wrongpassword')).rejects.toEqual(errorResponse)
    
    expect(mockLogin).toHaveBeenCalledWith('admin', 'wrongpassword')
  })

  it('should handle check auth with expired token', async () => {
    useAuthStore.setState({
      token: 'expired-token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    mockGetProfile.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Token expired' },
      },
    })
    
    await useAuthStore.getState().checkAuth()
    
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should preserve user data structure on login', async () => {
    const mockUser = {
      id: '2',
      username: 'testuser',
      email: 'test@test.com',
      realName: '测试用户',
      avatarUrl: 'https://example.com/avatar.png',
      role: {
        id: '2',
        name: '普通用户',
        code: 'user',
      },
    }
    
    mockLogin.mockResolvedValue({
      data: {
        access_token: 'test-token',
        user: mockUser,
      },
    })
    
    await useAuthStore.getState().login('testuser', 'password')
    
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.user?.realName).toBe('测试用户')
    expect(state.user?.avatarUrl).toBe('https://example.com/avatar.png')
    expect(state.user?.role?.code).toBe('user')
  })
})

describe('Auth Store Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(localStorageMock).forEach(key => delete localStorageMock[key])
    
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('should persist auth state', () => {
    const authState = {
      token: 'persisted-token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    }
    
    useAuthStore.setState(authState)
    
    const state = useAuthStore.getState()
    expect(state.token).toBe('persisted-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear persisted state on logout', () => {
    useAuthStore.setState({
      token: 'token-to-clear',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
    
    useAuthStore.getState().logout()
    
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})

describe('Auth Store Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('should handle login with empty credentials', async () => {
    mockLogin.mockRejectedValue(new Error('用户名和密码不能为空'))
    
    await expect(useAuthStore.getState().login('', '')).rejects.toThrow('用户名和密码不能为空')
  })

  it('should handle login with network error', async () => {
    mockLogin.mockRejectedValue(new Error('Network Error'))
    
    await expect(useAuthStore.getState().login('admin', 'password')).rejects.toThrow('Network Error')
    
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should handle check auth with network error', async () => {
    useAuthStore.setState({
      token: 'valid-token',
      user: null,
      isAuthenticated: false,
    })
    
    mockGetProfile.mockRejectedValue(new Error('Network Error'))
    
    await useAuthStore.getState().checkAuth()
    
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should handle user without role', async () => {
    const mockUser = {
      id: '3',
      username: 'norole',
      email: 'norole@test.com',
    }
    
    mockLogin.mockResolvedValue({
      data: {
        access_token: 'token',
        user: mockUser,
      },
    })
    
    await useAuthStore.getState().login('norole', 'password')
    
    const state = useAuthStore.getState()
    expect(state.user?.role).toBeUndefined()
    expect(state.isAuthenticated).toBe(true)
  })

  it('should handle concurrent login attempts', async () => {
    const mockUser = { id: '1', username: 'admin', email: 'admin@test.com' }
    
    mockLogin.mockResolvedValue({
      data: {
        access_token: 'token',
        user: mockUser,
      },
    })
    
    // 同时发起多个登录请求
    const loginPromises = [
      useAuthStore.getState().login('admin', 'password1'),
      useAuthStore.getState().login('admin', 'password2'),
    ]
    
    await Promise.allSettled(loginPromises)
    
    expect(mockLogin).toHaveBeenCalledTimes(2)
  })

  it('should maintain state consistency after failed checkAuth', async () => {
    useAuthStore.setState({
      token: 'token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    mockGetProfile.mockRejectedValue(new Error('Server Error'))
    
    await useAuthStore.getState().checkAuth()
    
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
  })
})

describe('Auth Store State Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  })

  it('should transition from unauthenticated to authenticated on login', async () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    
    mockLogin.mockResolvedValue({
      data: {
        access_token: 'token',
        user: { id: '1', username: 'admin', email: 'admin@test.com' },
      },
    })
    
    await useAuthStore.getState().login('admin', 'password')
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('should transition from authenticated to unauthenticated on logout', () => {
    useAuthStore.setState({
      token: 'token',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
    
    useAuthStore.getState().logout()
    
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('should remain unauthenticated on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    
    await expect(useAuthStore.getState().login('admin', 'wrong')).rejects.toThrow()
    
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('should transition to unauthenticated on checkAuth failure', async () => {
    useAuthStore.setState({
      token: 'invalid',
      user: { id: '1', username: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
    })
    
    mockGetProfile.mockRejectedValue(new Error('Unauthorized'))
    
    await useAuthStore.getState().checkAuth()
    
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
