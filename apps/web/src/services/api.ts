import axios from 'axios'
import { Modal, message } from 'antd'
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

// 401 处理状态，避免重复弹窗
let isShowingReLoginModal = false

// 显示重新登录弹窗
const showReLoginModal = () => {
  if (isShowingReLoginModal) return
  isShowingReLoginModal = true
  
  Modal.confirm({
    title: '登录已过期',
    content: '您的登录状态已过期，请重新登录',
    okText: '去登录',
    cancelText: '取消',
    onOk: () => {
      isShowingReLoginModal = false
      useAuthStore.getState().logout()
    },
    onCancel: () => {
      isShowingReLoginModal = false
    },
  })
}

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    // 返回标准化错误对象，包含后端返回的错误信息
    const standardizedError = {
      ...error,
      message: error.response?.data?.message || error.message || '请求失败，请稍后重试',
      code: error.response?.data?.code || status || 500,
      data: error.response?.data,
    }

    // 401 未授权处理
    if (status === 401) {
      if (isLoginRequest) {
        // 登录接口的 401：密码错误，显示错误消息
        message.error(standardizedError.message)
      } else {
        // 其他接口的 401：Token 过期，显示重新登录弹窗
        showReLoginModal()
      }
    } else if (status === 403) {
      // 403 禁止访问
      message.error('没有权限执行此操作')
    } else if (status === 404) {
      // 404 资源不存在
      message.error('请求的资源不存在')
    } else if (status === 422) {
      // 422 验证错误
      message.error(standardizedError.message || '数据验证失败')
    } else if (status >= 500) {
      // 服务器错误
      message.error('服务器错误，请稍后重试')
    } else if (!isLoginRequest && status !== 401) {
      // 其他错误（非登录接口）
      message.error(standardizedError.message)
    }

    return Promise.reject(standardizedError)
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
  getList: (params?: any) => api.get('/roles', { params }),
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
  clone: (id: string) => api.post(`/rules/${id}/clone`),
  export: (ids?: string[], format: string = 'json') =>
    api.get('/rules/export', { params: { ids: ids?.join(','), format } }),
  exportSingle: (id: string, format: string = 'json') =>
    api.get(`/rules/${id}/export`, { params: { format } }),
  import: (rules: any[], conflictStrategy: string = 'skip') =>
    api.post('/rules/import', { rules, conflictStrategy }),
  getVersions: (id: string) => api.get(`/rules/${id}/versions`),
  createVersion: (id: string, data: any) => api.post(`/rules/${id}/versions`, data),
  publishVersion: (ruleId: string, versionId: string) =>
    api.post(`/rules/${ruleId}/versions/${versionId}/publish`),
}

// 条件模板 API
export const templateApi = {
  getList: (params?: { category?: string; keyword?: string }) => api.get('/templates', { params }),
  getDetail: (id: string) => api.get(`/templates/${id}`),
  create: (data: { name: string; description?: string; category?: string; conditions: any }) =>
    api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
}

// 日志管理 API
export const logApi = {
  getSystemLogs: (params?: any) => api.get('/logs/operation', { params }),
  getLoginLogs: (params?: any) => api.get('/logs/login', { params }),
}

// 仪表盘 API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
}

export default api
