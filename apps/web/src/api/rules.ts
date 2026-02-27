import request from '@/utils/request'
import type { Rule, RuleVersion, PaginatedResponse, PaginationParams } from '@/types'

export const getRuleList = (params?: PaginationParams): Promise<PaginatedResponse<Rule>> => {
  return request.get('/rules', { params })
}

export const getRuleDetail = (id: string): Promise<Rule> => {
  return request.get(`/rules/${id}`)
}

export const createRule = (data: Partial<Rule>): Promise<Rule> => {
  return request.post('/rules', data)
}

export const updateRule = (id: string, data: Partial<Rule>): Promise<Rule> => {
  return request.put(`/rules/${id}`, data)
}

export const deleteRule = (id: string): Promise<void> => {
  return request.delete(`/rules/${id}`)
}

export const updateRuleStatus = (id: string, status: number): Promise<Rule> => {
  return request.put(`/rules/${id}/status`, { status })
}

export const getRuleVersions = (id: string): Promise<RuleVersion[]> => {
  return request.get(`/rules/${id}/versions`)
}

export const createRuleVersion = (id: string, data: Partial<RuleVersion>): Promise<RuleVersion> => {
  return request.post(`/rules/${id}/versions`, data)
}

export const publishVersion = (ruleId: string, versionId: string): Promise<void> => {
  return request.post(`/rules/${ruleId}/versions/${versionId}/publish`)
}

export const rollbackVersion = (ruleId: string, versionId: string): Promise<void> => {
  return request.post(`/rules/${ruleId}/versions/${versionId}/rollback`)
}

export const cloneRule = (id: string): Promise<Rule> => {
  return request.post(`/rules/${id}/clone`)
}

export const exportRule = (id: string): Promise<Blob> => {
  return request.get(`/rules/${id}/export`, { responseType: 'blob' })
}

export const simulateRule = (data: Record<string, any>): Promise<Record<string, any>> => {
  return request.post('/rules/simulate', data)
}
