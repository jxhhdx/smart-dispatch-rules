import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginRequest, LoginResponse } from '@/types'
import * as authApi from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatarUrl || '')
  const permissions = computed(() => userInfo.value?.permissions || [])

  // Actions
  const login = async (loginForm: LoginRequest) => {
    const res = await authApi.login(loginForm)
    token.value = res.token
    userInfo.value = res.user
    localStorage.setItem('token', res.token)
    return res
  }

  const getUserInfo = async () => {
    const res = await authApi.getProfile()
    userInfo.value = res
    return res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    username,
    avatar,
    permissions,
    login,
    getUserInfo,
    logout,
    hasPermission
  }
})
