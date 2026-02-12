import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Select, Input, InputNumber, Button, Space, Row, Col, Tooltip, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, CopyOutlined, HolderOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

// 筛选字段定义 - 可扩展
export interface FilterField {
  key: string
  label: string
  category: 'rider' | 'merchant' | 'order' | 'time' | 'geo' | string
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'list'
  options?: { label: string; value: any }[]
  unit?: string
}

// 条件节点
export interface ConditionNode {
  id: string
  type: 'condition' | 'group'
  field?: string
  operator?: string
  value?: any
  logicType?: 'AND' | 'OR'
  children?: ConditionNode[]
}

// 运算符定义
const OPERATORS: Record<string, { label: string; value: string; types: string[] }[]> = {
  string: [
    { label: 'Equals', value: 'eq', types: ['string', 'select'] },
    { label: 'Not Equals', value: 'ne', types: ['string', 'select'] },
    { label: 'Contains', value: 'contains', types: ['string'] },
    { label: 'Not Contains', value: 'not_contains', types: ['string'] },
    { label: 'Starts With', value: 'starts_with', types: ['string'] },
    { label: 'Ends With', value: 'ends_with', types: ['string'] },
    { label: 'In List', value: 'in', types: ['string', 'list'] },
    { label: 'Not In List', value: 'not_in', types: ['string', 'list'] },
  ],
  number: [
    { label: 'Equals', value: 'eq', types: ['number'] },
    { label: 'Not Equals', value: 'ne', types: ['number'] },
    { label: 'Greater Than', value: 'gt', types: ['number'] },
    { label: 'Greater or Equal', value: 'gte', types: ['number'] },
    { label: 'Less Than', value: 'lt', types: ['number'] },
    { label: 'Less or Equal', value: 'lte', types: ['number'] },
    { label: 'Between', value: 'between', types: ['number'] },
    { label: 'In List', value: 'in', types: ['number', 'list'] },
  ],
  boolean: [
    { label: 'Is True', value: 'true', types: ['boolean'] },
    { label: 'Is False', value: 'false', types: ['boolean'] },
  ],
  date: [
    { label: 'Equals', value: 'eq', types: ['date', 'datetime'] },
    { label: 'Before', value: 'before', types: ['date', 'datetime'] },
    { label: 'After', value: 'after', types: ['date', 'datetime'] },
    { label: 'Between', value: 'between', types: ['date', 'datetime'] },
  ],
}

// 默认筛选字段
const DEFAULT_FILTER_FIELDS: FilterField[] = [
  // 骑手相关
  { key: 'rider.id', label: 'Rider ID', category: 'rider', type: 'string' },
  { key: 'rider.level', label: 'Rider Level', category: 'rider', type: 'select', options: [
    { label: 'Bronze', value: 'bronze' },
    { label: 'Silver', value: 'silver' },
    { label: 'Gold', value: 'gold' },
    { label: 'Platinum', value: 'platinum' },
  ]},
  { key: 'rider.rating', label: 'Rider Rating', category: 'rider', type: 'number', unit: '★' },
  { key: 'rider.activeOrders', label: 'Active Orders', category: 'rider', type: 'number', unit: 'orders' },
  { key: 'rider.completionRate', label: 'Completion Rate', category: 'rider', type: 'number', unit: '%' },
  { key: 'rider.workHours', label: 'Work Hours Today', category: 'rider', type: 'number', unit: 'h' },
  
  // 商家相关
  { key: 'merchant.id', label: 'Merchant ID', category: 'merchant', type: 'string' },
  { key: 'merchant.type', label: 'Merchant Type', category: 'merchant', type: 'select', options: [
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'Grocery', value: 'grocery' },
    { label: 'Pharmacy', value: 'pharmacy' },
    { label: 'Retail', value: 'retail' },
  ]},
  { key: 'merchant.rating', label: 'Merchant Rating', category: 'merchant', type: 'number', unit: '★' },
  { key: 'merchant.deliveryRange', label: 'Delivery Range', category: 'merchant', type: 'number', unit: 'km' },
  { key: 'merchant.isVip', label: 'VIP Merchant', category: 'merchant', type: 'boolean' },
  
  // 订单相关
  { key: 'order.id', label: 'Order ID', category: 'order', type: 'string' },
  { key: 'order.amount', label: 'Order Amount', category: 'order', type: 'number', unit: '¥' },
  { key: 'order.distance', label: 'Delivery Distance', category: 'order', type: 'number', unit: 'km' },
  { key: 'order.weight', label: 'Order Weight', category: 'order', type: 'number', unit: 'kg' },
  { key: 'order.itemCount', label: 'Item Count', category: 'order', type: 'number', unit: 'items' },
  { key: 'order.productType', label: 'Product Type', category: 'order', type: 'select', options: [
    { label: 'Food', value: 'food' },
    { label: 'Grocery', value: 'grocery' },
    { label: 'Medicine', value: 'medicine' },
    { label: 'Fresh', value: 'fresh' },
    { label: 'Other', value: 'other' },
  ]},
  { key: 'order.isUrgent', label: 'Urgent Order', category: 'order', type: 'boolean' },
  { key: 'order.timeWindow', label: 'Time Window (min)', category: 'order', type: 'number', unit: 'min' },
  { key: 'order.customerLevel', label: 'Customer Level', category: 'order', type: 'select', options: [
    { label: 'Normal', value: 'normal' },
    { label: 'Silver', value: 'silver' },
    { label: 'Gold', value: 'gold' },
    { label: 'Platinum', value: 'platinum' },
    { label: 'Diamond', value: 'diamond' },
  ]},
  
  // 时间相关
  { key: 'time.hourOfDay', label: 'Hour of Day', category: 'time', type: 'number', unit: 'h' },
  { key: 'time.dayOfWeek', label: 'Day of Week', category: 'time', type: 'select', options: [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
  ]},
  { key: 'time.isHoliday', label: 'Is Holiday', category: 'time', type: 'boolean' },
  { key: 'time.isPeakHour', label: 'Is Peak Hour', category: 'time', type: 'boolean' },
  { key: 'time.timeRange', label: 'Time Range', category: 'time', type: 'string' },
  
  // 地理相关
  { key: 'geo.district', label: 'District', category: 'geo', type: 'string' },
  { key: 'geo.businessZone', label: 'Business Zone', category: 'geo', type: 'string' },
  { key: 'geo.specialLocation', label: 'Special Location', category: 'geo', type: 'select', options: [
    { label: 'Hospital', value: 'hospital' },
    { label: 'School', value: 'school' },
    { label: 'Office Building', value: 'office' },
    { label: 'Residential', value: 'residential' },
    { label: 'Shopping Mall', value: 'mall' },
  ]},
  { key: 'geo.weather', label: 'Weather Condition', category: 'geo', type: 'select', options: [
    { label: 'Sunny', value: 'sunny' },
    { label: 'Cloudy', value: 'cloudy' },
    { label: 'Rainy', value: 'rainy' },
    { label: 'Snowy', value: 'snowy' },
    { label: 'Stormy', value: 'stormy' },
  ]},
]

// 按分类组织字段
const groupFieldsByCategory = (fields: FilterField[]) => {
  const groups: Record<string, FilterField[]> = {}
  fields.forEach(field => {
    if (!groups[field.category]) {
      groups[field.category] = []
    }
    groups[field.category].push(field)
  })
  return groups
}

// 分类标签
// 分类标签颜色
const CATEGORY_COLORS: Record<string, string> = {
  rider: 'blue',
  merchant: 'green',
  order: 'orange',
  time: 'purple',
  geo: 'cyan',
}

interface RuleConditionBuilderProps {
  value?: ConditionNode[]
  onChange?: (conditions: ConditionNode[]) => void
  filterFields?: FilterField[]
  maxDepth?: number
}

export default function RuleConditionBuilder({
  value = [],
  onChange,
  filterFields = DEFAULT_FILTER_FIELDS,
  maxDepth = 3,
}: RuleConditionBuilderProps) {
  const { t } = useTranslation('rule')
  const [conditions, setConditions] = useState<ConditionNode[]>(value)
  const groupedFields = groupFieldsByCategory(filterFields)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const updateConditions = useCallback((newConditions: ConditionNode[]) => {
    setConditions(newConditions)
    onChange?.(newConditions)
  }, [onChange])

  // 添加条件
  const addCondition = (parentId?: string) => {
    const newCondition: ConditionNode = {
      id: generateId(),
      type: 'condition',
      field: filterFields[0]?.key,
      operator: 'eq',
      value: '',
    }

    if (!parentId) {
      updateConditions([...conditions, newCondition])
    } else {
      const addToGroup = (nodes: ConditionNode[]): ConditionNode[] => {
        return nodes.map(node => {
          if (node.id === parentId && node.type === 'group') {
            return {
              ...node,
              children: [...(node.children || []), newCondition],
            }
          }
          if (node.children) {
            return { ...node, children: addToGroup(node.children) }
          }
          return node
        })
      }
      updateConditions(addToGroup(conditions))
    }
  }

  // 添加条件组
  const addGroup = (parentId?: string) => {
    const newGroup: ConditionNode = {
      id: generateId(),
      type: 'group',
      logicType: 'AND',
      children: [],
    }

    if (!parentId) {
      updateConditions([...conditions, newGroup])
    } else {
      const addToGroup = (nodes: ConditionNode[]): ConditionNode[] => {
        return nodes.map(node => {
          if (node.id === parentId && node.type === 'group') {
            return {
              ...node,
              children: [...(node.children || []), newGroup],
            }
          }
          if (node.children) {
            return { ...node, children: addToGroup(node.children) }
          }
          return node
        })
      }
      updateConditions(addToGroup(conditions))
    }
  }

  // 删除节点
  const removeNode = (id: string) => {
    const removeFromTree = (nodes: ConditionNode[]): ConditionNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => {
          if (node.children) {
            return { ...node, children: removeFromTree(node.children) }
          }
          return node
        })
    }
    updateConditions(removeFromTree(conditions))
  }

  // 更新节点
  const updateNode = (id: string, updates: Partial<ConditionNode>) => {
    const updateInTree = (nodes: ConditionNode[]): ConditionNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          // 如果切换了字段，重置 operator 和 value
          if (updates.field && updates.field !== node.field) {
            return { ...node, ...updates, operator: undefined, value: undefined }
          }
          return { ...node, ...updates }
        }
        if (node.children) {
          return { ...node, children: updateInTree(node.children) }
        }
        return node
      })
    }
    updateConditions(updateInTree(conditions))
  }

  // 获取字段配置
  const getFieldConfig = (fieldKey: string) => {
    return filterFields.find(f => f.key === fieldKey)
  }

  // 渲染条件值输入
  const renderValueInput = (node: ConditionNode) => {
    const fieldConfig = getFieldConfig(node.field || '')
    const operator = node.operator || 'eq'

    if (!fieldConfig) return null

    // 布尔类型
    if (fieldConfig.type === 'boolean') {
      return (
        <Select
          value={node.value}
          onChange={(value) => updateNode(node.id, { value })}
          style={{ width: 150 }}
          placeholder={t('condition.select')}
        >
          <Select.Option value={true}>{t('condition.true')}</Select.Option>
          <Select.Option value={false}>{t('condition.false')}</Select.Option>
        </Select>
      )
    }

    // 选择类型
    if (fieldConfig.type === 'select' && fieldConfig.options) {
      return (
        <Select
          value={node.value}
          onChange={(value) => updateNode(node.id, { value })}
          style={{ width: 150 }}
          placeholder={t('condition.select')}
          options={fieldConfig.options}
        />
      )
    }

    // 数字类型
    if (fieldConfig.type === 'number') {
      // Between 运算符需要两个值
      if (operator === 'between') {
        return (
          <Space>
            <InputNumber
              value={Array.isArray(node.value) ? node.value[0] : undefined}
              onChange={(v: number | null) => {
                const current = Array.isArray(node.value) ? node.value : [undefined, undefined]
                updateNode(node.id, { value: [v, current[1]] })
              }}
              placeholder={t('condition.min')}
              style={{ width: 100 }}
            />
            <span>-</span>
            <InputNumber
              value={Array.isArray(node.value) ? node.value[1] : undefined}
              onChange={(v: number | null) => {
                const current = Array.isArray(node.value) ? node.value : [undefined, undefined]
                updateNode(node.id, { value: [current[0], v] })
              }}
              placeholder={t('condition.max')}
              style={{ width: 100 }}
            />
            {fieldConfig.unit && <span>{fieldConfig.unit}</span>}
          </Space>
        )
      }

      return (
        <Space>
          <Input
            type="number"
            value={node.value}
            onChange={(e) => updateNode(node.id, { value: Number(e.target.value) })}
            style={{ width: 120 }}
            placeholder={t('condition.value')}
          />
          {fieldConfig.unit && <span>{fieldConfig.unit}</span>}
        </Space>
      )
    }

    // 默认字符串类型
    if (operator === 'in' || operator === 'not_in') {
      return (
        <Select
          mode="tags"
          value={Array.isArray(node.value) ? node.value : node.value ? [node.value] : []}
          onChange={(value) => updateNode(node.id, { value })}
          style={{ width: 200 }}
          placeholder={t('condition.value')}
          tokenSeparators={[',']}
        />
      )
    }

    return (
      <Input
        value={node.value}
        onChange={(e) => updateNode(node.id, { value: e.target.value })}
        style={{ width: 200 }}
        placeholder={t('condition.value')}
      />
    )
  }

  // 递归渲染条件树
  const renderConditionTree = (nodes: ConditionNode[], depth = 0): ReactNode => {
    return nodes.map((node) => {
      if (node.type === 'group') {
        return (
          <Card
            key={node.id}
            size="small"
            style={{
              marginBottom: 8,
              marginLeft: depth * 24,
              backgroundColor: depth % 2 === 0 ? '#f6ffed' : '#e6f7ff',
              border: `1px solid ${depth % 2 === 0 ? '#b7eb8f' : '#91d5ff'}`,
            }}
            title={
              <Space>
                <Select
                  value={node.logicType}
                  onChange={(value) => updateNode(node.id, { logicType: value })}
                  style={{ width: 80 }}
                >
                  <Select.Option value="AND">AND</Select.Option>
                  <Select.Option value="OR">OR</Select.Option>
                </Select>
                <Tag color={node.logicType === 'AND' ? 'blue' : 'orange'}>
                  {node.children?.length || 0} {t('condition.title')}
                </Tag>
              </Space>
            }
            extra={
              <Space>
                {depth < maxDepth - 1 && (
                  <>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addCondition(node.id)}
                    >
                      {t('condition.addCondition')}
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => addGroup(node.id)}
                    >
                      {t('condition.addGroup')}
                    </Button>
                  </>
                )}
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeNode(node.id)}
                />
              </Space>
            }
          >
            {node.children && node.children.length > 0 ? (
              renderConditionTree(node.children, depth + 1)
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
                {t('condition.emptyTip')}
              </div>
            )}
          </Card>
        )
      }

      // 渲染单个条件
      const fieldConfig = getFieldConfig(node.field || '')
      const availableOperators = Object.values(OPERATORS)
        .flat()
        .filter(op => op.types.includes(fieldConfig?.type || 'string'))

      return (
        <Row
          key={node.id}
          gutter={8}
          align="middle"
          style={{
            marginBottom: 8,
            marginLeft: depth * 24,
            padding: '8px 12px',
            backgroundColor: '#fafafa',
            borderRadius: 4,
            border: '1px solid #f0f0f0',
          }}
        >
          <Col flex="20px">
            <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
          </Col>
          <Col flex="180px">
            <Select
              value={node.field}
              onChange={(value) => updateNode(node.id, { field: value })}
              style={{ width: '100%' }}
              placeholder={t('condition.field')}
            >
              {Object.entries(groupedFields).map(([category, fields]) => (
                <Select.OptGroup 
                  key={category} 
                  label={
                    <Tag color={CATEGORY_COLORS[category] || 'default'}>
                      {t(`filterCategory.${category}`, { defaultValue: category })}
                    </Tag>
                  }
                >
                  {fields.map(field => (
                    <Select.Option key={field.key} value={field.key}>
                      {field.label}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Col>
          <Col flex="140px">
            <Select
              value={node.operator}
              onChange={(value) => updateNode(node.id, { operator: value })}
              style={{ width: '100%' }}
              placeholder={t('condition.operator')}
            >
              {availableOperators.map(op => (
                <Select.Option key={op.value} value={op.value}>
                  {op.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col flex="auto">
            {renderValueInput(node)}
          </Col>
          <Col flex="40px">
            <Tooltip title={t('condition.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeNode(node.id)}
              />
            </Tooltip>
          </Col>
        </Row>
      )
    })
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => addCondition()}>
          {t('condition.addCondition')}
        </Button>
        <Button icon={<CopyOutlined />} onClick={() => addGroup()}>
          {t('condition.addGroup')}
        </Button>
      </Space>
      
      {conditions.length > 0 ? (
        <div>{renderConditionTree(conditions)}</div>
      ) : (
        <Card
          style={{ textAlign: 'center', padding: '40px 0', backgroundColor: '#fafafa' }}
        >
          <p style={{ color: '#999', marginBottom: 16 }}>
            {t('condition.emptyTip')}
          </p>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => addCondition()}>
              {t('condition.addCondition')}
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => addGroup()}>
              {t('condition.addGroup')}
            </Button>
          </Space>
        </Card>
      )}
    </div>
  )
}

// 导出辅助函数
export { groupFieldsByCategory, CATEGORY_COLORS, OPERATORS, DEFAULT_FILTER_FIELDS }
