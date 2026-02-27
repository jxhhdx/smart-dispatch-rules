import request from '@/utils/request'
import type { Role, Permission, PaginatedResponse, PaginationParams } from '@/types'

export const getRoleList = (params?: PaginationParams): Promise<PaginatedResponse<Role>> => {
  return request.get('/roles', { params })
}

export const getRoleDetail = (id: string): Promise<Role> => {
  return request.get(`/roles/${id}`)
}

export const createRole = (data: Partial<Role>): Promise<Role> => {
  return request.post('/roles', data)
}

export const updateRole = (id: string, data: Partial<Role>): Promise<Role> => {
  return request.put(`/roles/${id}`, data)
}

export const deleteRole = (id: string): Promise<void> => {
  return request.delete(`/roles/${id}`)
}

export const updateRolePermissions = (id: string, permissionIds: string[]): Promise<void> => {
  return request.put(`/roles/${id}/permissions`, { permissionIds })
}

export const getPermissionList = (): Promise<Permission[]> => {
  return request.get('/roles/permissions')
}
