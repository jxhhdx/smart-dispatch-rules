import request from '@/utils/request'
import type { SystemLog, LoginLog, PaginatedResponse } from '@/types'

export interface LogQueryParams {
  page?: number
  pageSize?: number
  startTime?: string
  endTime?: string
  [key: string]: any
}

export const getSystemLogs = (params?: LogQueryParams): Promise<PaginatedResponse<SystemLog>> => {
  return request.get('/logs/operation', { params })
}

export const getLoginLogs = (params?: LogQueryParams): Promise<PaginatedResponse<LoginLog>> => {
  return request.get('/logs/login', { params })
}
