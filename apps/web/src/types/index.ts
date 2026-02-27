// 通用响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页请求
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 用户
export interface User {
  id: string
  username: string
  email: string
  realName?: string
  phone?: string
  avatarUrl?: string
  roleId?: string
  roleName?: string
  status: number
  lastLoginAt?: string
  createdAt: string
}

export interface UserInfo extends User {
  permissions: string[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

// 角色
export interface Role {
  id: string
  name: string
  code: string
  description?: string
  status: number
  createdAt: string
}

export interface Permission {
  id: string
  name: string
  code: string
  type: string
  parentId?: string
  path?: string
  sortOrder: number
  status: number
  children?: Permission[]
}

// 规则
export interface Rule {
  id: string
  name: string
  description?: string
  ruleType: string
  businessType?: string
  priority: number
  status: number
  currentVersion?: number
  createdByName?: string
  createdAt: string
}

export interface RuleVersion {
  id: string
  ruleId: string
  version: number
  configJson: Record<string, any>
  description?: string
  status: number
  publishedAt?: string
  publishedBy?: string
  createdBy?: string
  createdAt: string
}

export interface RuleCondition {
  id: string
  ruleVersionId: string
  parentId?: string
  conditionType: string
  field?: string
  operator?: string
  value?: string
  valueType: string
  logicType: string
  sortOrder: number
  children?: RuleCondition[]
}

export interface RuleAction {
  id: string
  ruleVersionId: string
  actionType: string
  configJson: Record<string, any>
  sortOrder: number
  createdAt: string
}

// 日志
export interface SystemLog {
  id: string
  username?: string
  action: string
  module: string
  description?: string
  ipAddress?: string
  durationMs?: number
  createdAt: string
}

export interface LoginLog {
  id: string
  username?: string
  loginType: string
  ipAddress?: string
  status: number
  failReason?: string
  createdAt: string
}

// 仪表盘
export interface DashboardStats {
  todayOrders: number
  todayDispatched: number
  todaySuccessRate: number
  todayAvgTime: number
  activeRiders: number
  onlineRiders: number
  activeRules: number
  todayTriggeredRules: number
}

export interface TrendPoint {
  time: string
  value: number
}

export interface DashboardTrends {
  orderTrend: TrendPoint[]
  dispatchTrend: TrendPoint[]
  successRateTrend: TrendPoint[]
}

export interface RuleTriggerStat {
  ruleId: string
  ruleName: string
  triggerCount: number
  successCount: number
  successRate: number
}
