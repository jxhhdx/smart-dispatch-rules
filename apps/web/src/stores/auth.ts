import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

interface User {
  id: string
  username: string
  email: string
  realName?: string
  avatarUrl?: string
  role?: {
    id: string
    name: string
    code: string
  }
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await authApi.login(username, password)
          const { access_token, user } = response.data
          set({ token: access_token, user, isAuthenticated: true })
        } catch (error: any) {
          // 确保错误被传播到调用方
          throw error
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        window.location.href = '/login'
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        try {
          const response = await authApi.getProfile()
          set({ user: response.data, isAuthenticated: true })
        } catch (error) {
          set({ token: null, user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
