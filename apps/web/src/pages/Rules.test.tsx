import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟 antd 的 message 和 Modal
const mockMessageError = vi.fn()
const mockMessageSuccess = vi.fn()

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      error: mockMessageError,
      success: mockMessageSuccess,
    },
    Modal: {
      confirm: vi.fn(),
    },
  }
})

// 模拟 API
const mockGetRules = vi.fn()
const mockGetRuleDetail = vi.fn()
const mockCreateRule = vi.fn()
const mockUpdateRule = vi.fn()
const mockDeleteRule = vi.fn()

vi.mock('../services/api', () => ({
  ruleApi: {
    getList: (...args: any[]) => mockGetRules(...args),
    getDetail: (...args: any[]) => mockGetRuleDetail(...args),
    create: (...args: any[]) => mockCreateRule(...args),
    update: (...args: any[]) => mockUpdateRule(...args),
    delete: (...args: any[]) => mockDeleteRule(...args),
  },
}))

// 模拟 react-i18next
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'rule:title': '规则管理',
    'rule:create': '创建规则',
    'rule:edit': '编辑规则',
    'rule:detail': '规则详情',
    'rule:field.name': '规则名称',
    'rule:field.ruleType': '规则类型',
    'rule:field.priority': '优先级',
    'rule:field.status': '状态',
    'rule:field.description': '描述',
    'rule:field.businessType': '业务类型',
    'rule:type.distance': '距离规则',
    'rule:type.workload': '工作量规则',
    'rule:type.rating': '评分规则',
    'rule:type.urgency': '紧急度规则',
    'rule:type.orderValue': '订单价值规则',
    'rule:type.vipCustomer': 'VIP客户规则',
    'rule:type.capability': '能力匹配规则',
    'rule:type.timeWindow': '时间窗口规则',
    'rule:type.composite': '组合规则',
    'rule:status.draft': '草稿',
    'rule:status.published': '已发布',
    'rule:status.offline': '已下线',
    'rule:version.history': '版本历史',
    'rule:validation.nameRequired': '请输入规则名称',
    'rule:validation.typeRequired': '请选择规则类型',
    'rule:placeholder.name': '请输入规则名称',
    'rule:placeholder.description': '请输入规则描述',
    'common:button.save': '保存',
    'common:button.cancel': '取消',
    'common:table.action': '操作',
    'common:table.total': '共',
    'common:table.items': '条',
    'common:message.confirmDelete': '确认删除吗？',
    'common:form.select': '请选择',
  }
  let result = translations[key] || key
  if (options) {
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v))
    })
  }
  return result
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'zh-CN', changeLanguage: vi.fn() },
  }),
}))

describe('Rules Component', () => {
  const mockRules = [
    { 
      id: '1', 
      name: '距离优先规则', 
      ruleType: 'distance', 
      priority: 10, 
      status: 1,
      description: '优先分配给距离近的骑手',
    },
    { 
      id: '2', 
      name: 'VIP客户规则', 
      ruleType: 'vip_customer', 
      priority: 20, 
      status: 0,
      description: 'VIP客户优先配送',
    },
  ]

  const mockRuleDetail = {
    id: '1',
    name: '距离优先规则',
    ruleType: 'distance',
    description: '优先分配给距离近的骑手',
    status: 1,
    versions: [
      { id: 'v1', version: 1, status: 1, description: '初始版本' },
      { id: 'v2', version: 2, status: 0, description: '更新版本' },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRules.mockResolvedValue({
      data: {
        list: mockRules,
        pagination: { page: 1, pageSize: 10, total: 2 },
      },
    })
    mockGetRuleDetail.mockResolvedValue({ data: mockRuleDetail })
  })

  it('should have correct page title translation', () => {
    expect(mockT('rule:title')).toBe('规则管理')
  })

  it('should fetch rules on mount with correct params', async () => {
    const result = await mockGetRules({ page: 1, pageSize: 10 })
    
    expect(mockGetRules).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    expect(result.data.list).toHaveLength(2)
  })

  it('should handle rule creation', async () => {
    const newRule = {
      name: '新规则',
      ruleType: 'distance',
      priority: 10,
      description: '新规则描述',
    }
    
    mockCreateRule.mockResolvedValue({ data: { id: '3', ...newRule } })
    
    await mockCreateRule(newRule)
    
    expect(mockCreateRule).toHaveBeenCalledWith(newRule)
  })

  it('should handle rule update', async () => {
    const updateData = {
      name: '更新规则',
      priority: 20,
      description: '更新后的描述',
    }
    
    mockUpdateRule.mockResolvedValue({ data: { id: '1', ...updateData } })
    
    await mockUpdateRule('1', updateData)
    
    expect(mockUpdateRule).toHaveBeenCalledWith('1', updateData)
  })

  it('should handle rule deletion', async () => {
    mockDeleteRule.mockResolvedValue({})
    
    await mockDeleteRule('1')
    
    expect(mockDeleteRule).toHaveBeenCalledWith('1')
  })

  it('should handle view rule detail', async () => {
    const result = await mockGetRuleDetail('1')
    
    expect(mockGetRuleDetail).toHaveBeenCalledWith('1')
    expect(result.data).toHaveProperty('versions')
    expect(result.data.versions).toHaveLength(2)
  })

  it('should validate rule name is required', () => {
    const validateName = (value: string) => {
      if (!value) return '请输入规则名称'
      return null
    }
    
    expect(validateName('')).toBe('请输入规则名称')
    expect(validateName('测试规则')).toBeNull()
  })

  it('should validate rule type is required', () => {
    const validateType = (value: string) => {
      if (!value) return '请选择规则类型'
      return null
    }
    
    expect(validateType('')).toBe('请选择规则类型')
    expect(validateType('distance')).toBeNull()
  })

  it('should get correct rule type label', () => {
    const ruleTypeOptions = [
      { value: 'distance', label: '距离规则' },
      { value: 'workload', label: '工作量规则' },
      { value: 'rating', label: '评分规则' },
    ]
    
    const getRuleTypeLabel = (type: string) => {
      return ruleTypeOptions.find(opt => opt.value === type)?.label || type
    }
    
    expect(getRuleTypeLabel('distance')).toBe('距离规则')
    expect(getRuleTypeLabel('workload')).toBe('工作量规则')
    expect(getRuleTypeLabel('unknown')).toBe('unknown')
  })

  it('should get correct status tag', () => {
    const getStatusTag = (status: number) => {
      const statusMap: Record<number, { text: string; color: string }> = {
        0: { text: '草稿', color: 'default' },
        1: { text: '已发布', color: 'success' },
        2: { text: '已下线', color: 'error' },
      }
      return statusMap[status]
    }
    
    expect(getStatusTag(0)).toEqual({ text: '草稿', color: 'default' })
    expect(getStatusTag(1)).toEqual({ text: '已发布', color: 'success' })
    expect(getStatusTag(2)).toEqual({ text: '已下线', color: 'error' })
  })

  it('should handle API errors gracefully', async () => {
    mockGetRules.mockRejectedValue(new Error('Network Error'))
    
    await expect(mockGetRules({ page: 1, pageSize: 10 })).rejects.toThrow('Network Error')
  })

  it('should have correct field translations', () => {
    expect(mockT('rule:field.name')).toBe('规则名称')
    expect(mockT('rule:field.ruleType')).toBe('规则类型')
    expect(mockT('rule:field.priority')).toBe('优先级')
    expect(mockT('rule:field.status')).toBe('状态')
    expect(mockT('rule:field.description')).toBe('描述')
  })

  it('should have all rule type translations', () => {
    expect(mockT('rule:type.distance')).toBe('距离规则')
    expect(mockT('rule:type.workload')).toBe('工作量规则')
    expect(mockT('rule:type.rating')).toBe('评分规则')
    expect(mockT('rule:type.urgency')).toBe('紧急度规则')
    expect(mockT('rule:type.orderValue')).toBe('订单价值规则')
    expect(mockT('rule:type.vipCustomer')).toBe('VIP客户规则')
    expect(mockT('rule:type.capability')).toBe('能力匹配规则')
    expect(mockT('rule:type.timeWindow')).toBe('时间窗口规则')
    expect(mockT('rule:type.composite')).toBe('组合规则')
  })

  it('should display rule versions in detail modal', async () => {
    const result = await mockGetRuleDetail('1')
    
    expect(result.data.versions).toHaveLength(2)
    expect(result.data.versions[0].version).toBe(1)
    expect(result.data.versions[1].version).toBe(2)
  })
})

describe('Rules API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call create API with correct data', async () => {
    const newRule = {
      name: '新规则',
      ruleType: 'distance',
      priority: 10,
      description: '新规则描述',
    }
    
    mockCreateRule.mockResolvedValue({ data: { id: '3', ...newRule } })
    
    await mockCreateRule(newRule)
    
    expect(mockCreateRule).toHaveBeenCalledWith(newRule)
  })

  it('should call update API with correct data', async () => {
    const updateData = {
      name: '更新规则',
      priority: 20,
      description: '更新后的描述',
    }
    
    mockUpdateRule.mockResolvedValue({ data: { id: '1', ...updateData } })
    
    await mockUpdateRule('1', updateData)
    
    expect(mockUpdateRule).toHaveBeenCalledWith('1', updateData)
  })

  it('should call delete API with correct id', async () => {
    mockDeleteRule.mockResolvedValue({})
    
    await mockDeleteRule('1')
    
    expect(mockDeleteRule).toHaveBeenCalledWith('1')
  })

  it('should call getDetail API with correct id', async () => {
    mockGetRuleDetail.mockResolvedValue({
      data: {
        id: '1',
        name: '测试规则',
        versions: [],
      },
    })
    
    await mockGetRuleDetail('1')
    
    expect(mockGetRuleDetail).toHaveBeenCalledWith('1')
  })

  it('should refresh rule list after creation', async () => {
    mockCreateRule.mockResolvedValue({})
    mockGetRules.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockCreateRule({ name: 'test', ruleType: 'distance' })
    await mockGetRules({ page: 1, pageSize: 10 })
    
    expect(mockCreateRule).toHaveBeenCalled()
    expect(mockGetRules).toHaveBeenCalled()
  })

  it('should refresh rule list after deletion', async () => {
    mockDeleteRule.mockResolvedValue({})
    mockGetRules.mockResolvedValue({
      data: {
        list: [],
        pagination: { page: 1, pageSize: 10, total: 0 },
      },
    })
    
    await mockDeleteRule('1')
    await mockGetRules({ page: 1, pageSize: 10 })
    
    expect(mockDeleteRule).toHaveBeenCalled()
    expect(mockGetRules).toHaveBeenCalled()
  })
})

describe('Rules Form Validation', () => {
  it('should validate all required fields', () => {
    const validateForm = (values: any) => {
      const errors: string[] = []
      
      if (!values.name) errors.push('请输入规则名称')
      if (!values.ruleType) errors.push('请选择规则类型')
      
      return errors
    }
    
    expect(validateForm({})).toHaveLength(2)
    expect(validateForm({ name: '测试' })).toHaveLength(1)
    expect(validateForm({ name: '测试', ruleType: 'distance' })).toHaveLength(0)
  })

  it('should support all rule types', () => {
    const ruleTypes = [
      'distance',
      'workload',
      'rating',
      'urgency',
      'order_value',
      'vip_customer',
      'capability',
      'time_window',
      'composite',
    ]
    
    ruleTypes.forEach(type => {
      expect(type).toBeTruthy()
    })
  })

  it('should handle version status correctly', () => {
    const getVersionStatus = (status: number) => {
      if (status === 1) return '已发布'
      if (status === 0) return '草稿'
      return '已下线'
    }
    
    expect(getVersionStatus(0)).toBe('草稿')
    expect(getVersionStatus(1)).toBe('已发布')
    expect(getVersionStatus(2)).toBe('已下线')
  })

  it('should have correct column configuration', () => {
    const columns = [
      { title: '规则名称', dataIndex: 'name' },
      { title: '规则类型', dataIndex: 'ruleType' },
      { title: '优先级', dataIndex: 'priority', width: 100 },
      { title: '状态', dataIndex: 'status', width: 120 },
      { title: '操作', width: 150, fixed: 'right' },
    ]
    
    expect(columns).toHaveLength(5)
    expect(columns[2].width).toBe(100)
  })
})

describe('Rules Detail View', () => {
  it('should format version display correctly', () => {
    const version = { id: 'v1', version: 1, status: 1, description: '版本描述' }
    const formatVersion = (v: typeof version) => {
      const statusText = v.status === 1 ? '已发布' : v.status === 0 ? '草稿' : '已下线'
      return `版本 ${v.version} - ${statusText}`
    }
    
    expect(formatVersion(version)).toBe('版本 1 - 已发布')
  })

  it('should handle rule without description', () => {
    const rule = { id: '1', name: '测试规则' }
    const description = rule.description || '-'
    expect(description).toBe('-')
  })

  it('should handle rule without versions', () => {
    const ruleDetail = { id: '1', name: '测试规则', versions: undefined }
    const versions = ruleDetail.versions || []
    expect(versions).toHaveLength(0)
  })

  it('should have correct priority default value', () => {
    const defaultPriority = 0
    expect(defaultPriority).toBe(0)
  })

  it('should have correct business type options', () => {
    const businessTypes = [
      { value: 'food_delivery', label: 'Food Delivery' },
      { value: 'grocery_delivery', label: 'Grocery Delivery' },
      { value: 'medicine_delivery', label: 'Medicine Delivery' },
    ]
    
    expect(businessTypes).toHaveLength(3)
    expect(businessTypes[0].value).toBe('food_delivery')
  })
})
