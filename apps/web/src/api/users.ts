import request from '@/utils/request'
import type { User, PaginatedResponse, PaginationParams } from '@/types'

export const getUserList = (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
  return request.get('/users', { params })
}

export const getUserDetail = (id: string): Promise<User> => {
  return request.get(`/users/${id}`)
}

export const createUser = (data: Partial<User>): Promise<User> => {
  return request.post('/users', data)
}

export const updateUser = (id: string, data: Partial<User>): Promise<User> => {
  return request.put(`/users/${id}`, data)
}

export const deleteUser = (id: string): Promise<void> => {
  return request.delete(`/users/${id}`)
}

export const updateUserStatus = (id: string, status: number): Promise<User> => {
  return request.put(`/users/${id}/status`, { status })
}
