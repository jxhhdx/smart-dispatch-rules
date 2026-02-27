import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 如果响应 code 不为 0，说明有错误
    if (res.code !== 0) {
      message.error(res.message || '请求失败')
      
      // 401: Token 过期或无效
      if (res.code === 401) {
        Modal.confirm({
          title: '提示',
          content: '登录状态已过期，请重新登录',
          okText: '重新登录',
          cancelText: '取消',
          onOk: () => {
            const userStore = useUserStore()
            userStore.logout()
            router.push('/login')
          }
        })
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res.data
  },
  (error) => {
    let msg = error.message
    if (error.response) {
      switch (error.response.status) {
        case 400:
          msg = '请求参数错误'
          break
        case 401:
          msg = '未授权，请登录'
          break
        case 403:
          msg = '拒绝访问'
          break
        case 404:
          msg = '请求地址不存在'
          break
        case 500:
          msg = '服务器内部错误'
          break
        default:
          msg = `请求失败: ${error.response.status}`
      }
    }
    message.error(msg)
    return Promise.reject(error)
  }
)

export default request
