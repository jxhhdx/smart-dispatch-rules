import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 添加语言头部
    const lang = localStorage.getItem('i18nextLng') || navigator.language || 'zh-CN'
    config.headers['Accept-Language'] = lang
    config.headers['X-Locale'] = lang
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

// 认证相关 API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  refresh: () => api.post('/auth/refresh'),
}

// 用户管理 API
export const userApi = {
  getList: (params?: any) => api.get('/users', { params }),
  getDetail: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateStatus: (id: string, status: number) =>
    api.put(`/users/${id}/status`, { status }),
}

// 角色管理 API
export const roleApi = {
  getList: () => api.get('/roles'),
  getDetail: (id: string) => api.get(`/roles/${id}`),
  create: (data: any) => api.post('/roles', data),
  update: (id: string, data: any) => api.put(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get('/roles/permissions'),
}

// 规则管理 API
export const ruleApi = {
  getList: (params?: any) => api.get('/rules', { params }),
  getDetail: (id: string) => api.get(`/rules/${id}`),
  create: (data: any) => api.post('/rules', data),
  update: (id: string, data: any) => api.put(`/rules/${id}`, data),
  delete: (id: string) => api.delete(`/rules/${id}`),
  updateStatus: (id: string, status: number) =>
    api.put(`/rules/${id}/status`, { status }),
  getVersions: (id: string) => api.get(`/rules/${id}/versions`),
  createVersion: (id: string, data: any) => api.post(`/rules/${id}/versions`, data),
  publishVersion: (ruleId: string, versionId: string) =>
    api.post(`/rules/${ruleId}/versions/${versionId}/publish`),
}

// 日志管理 API
export const logApi = {
  getSystemLogs: (params?: any) => api.get('/logs/operation', { params }),
  getLoginLogs: (params?: any) => api.get('/logs/login', { params }),
}

export default api
