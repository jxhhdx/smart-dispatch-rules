// 共享类型定义

export interface User {
  id: string;
  username: string;
  email: string;
  realName?: string;
  phone?: string;
  avatarUrl?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId?: string;
  path?: string;
  sortOrder: number;
  status: number;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  ruleType: string;
  businessType?: string;
  priority: number;
  status: number;
  effectiveTime?: Date;
  expireTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleVersion {
  id: string;
  ruleId: string;
  version: number;
  configJson: any;
  description?: string;
  status: number;
  publishedAt?: Date;
  createdAt: Date;
}

export interface PaginationResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}
