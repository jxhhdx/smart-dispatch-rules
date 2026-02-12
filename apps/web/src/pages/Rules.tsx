import { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Card, Typography, Popconfirm, Switch, Tooltip, message, Dropdown, Tabs, Badge, List, Radio } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined, ExportOutlined, DownOutlined, CheckOutlined, CloseOutlined, SettingOutlined, ImportOutlined, SaveOutlined, FolderOpenOutlined, DeleteFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ruleApi, templateApi } from '../services/api'
import RuleConditionBuilder, { ConditionNode } from '../components/RuleConditionBuilder'
import type { RadioChangeEvent } from 'antd';

const { Title } = Typography

interface Rule {
  id: string
  name: string
  description?: string
  ruleType: string
  businessType?: string
  priority: number
  status: number
}

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [advancedModalVisible, setAdvancedModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRule, setDetailRule] = useState<any>(null)
  const [conditions, setConditions] = useState<ConditionNode[]>([])
  const [form] = Form.useForm()
  const [advancedForm] = Form.useForm()
  const [templateForm] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const { t } = useTranslation(['rule', 'common'])

  // 模板管理状态
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)

  // 导入状态
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importConflictStrategy, setImportConflictStrategy] = useState('skip')
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 规则类型选项
  const ruleTypeOptions = [
    { value: 'distance', label: t('rule:type.distance') },
    { value: 'workload', label: t('rule:type.workload') },
    { value: 'rating', label: t('rule:type.rating') },
    { value: 'urgency', label: t('rule:type.urgency') },
    { value: 'order_value', label: t('rule:type.orderValue') },
    { value: 'vip_customer', label: t('rule:type.vipCustomer') },
    { value: 'capability', label: t('rule:type.capability') },
    { value: 'time_window', label: t('rule:type.timeWindow') },
    { value: 'composite', label: t('rule:type.composite') },
  ]

  const fetchRules = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res: any = await ruleApi.getList({ page, pageSize })
      setRules(res.data.list)
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.pageSize,
        total: res.data.pagination.total,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      if (editingRule) {
        await ruleApi.update(editingRule.id, values)
        setModalVisible(false)
        fetchRules(pagination.current, pagination.pageSize)
      } else {
        await ruleApi.create(values)
        setModalVisible(false)
        // 创建新规则后，刷新第一页以显示新规则
        fetchRules(1, pagination.pageSize)
      }
    } catch (error: any) {
      // 错误已在 api 拦截器中处理
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await ruleApi.delete(id)
      fetchRules(pagination.current, pagination.pageSize)
    } catch (error: any) {
      // 错误已在 api 拦截器中处理
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const res: any = await ruleApi.getDetail(id)
      setDetailRule(res.data)
      setDetailVisible(true)
    } catch (error) {
      // 错误已在 api 拦截器中处理
    }
  }

  const getStatusTag = (status: number) => {
    const statusMap: Record<number, { text: string; color: string }> = {
      0: { text: t('rule:status.draft'), color: 'default' },
      1: { text: t('rule:status.published'), color: 'success' },
      2: { text: t('rule:status.offline'), color: 'error' },
    }
    const statusInfo = statusMap[status]
    return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>
  }

  const getRuleTypeLabel = (type: string) => {
    return ruleTypeOptions.find(opt => opt.value === type)?.label || type
  }

    // 切换规则状态
  const handleToggleStatus = async (record: Rule, checked: boolean) => {
    try {
      const newStatus = checked ? 1 : 0
      await ruleApi.updateStatus(record.id, newStatus)
      message.success(checked ? t('rule:message.enableSuccess') : t('rule:message.disableSuccess'))
      fetchRules(pagination.current, pagination.pageSize)
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  // 复制规则
  const handleCloneRule = async (record: Rule) => {
    try {
      const res: any = await ruleApi.clone(record.id)
      message.success(t('rule:message.copySuccess'))
      fetchRules(pagination.current, pagination.pageSize)
      // 打开编辑弹窗
      setEditingRule(res.data)
      form.setFieldsValue(res.data)
      setModalVisible(true)
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  // 导出规则
  const handleExport = async (format: string, ruleId?: string) => {
    try {
      const res: any = ruleId 
        ? await ruleApi.exportSingle(ruleId, format)
        : await ruleApi.export([], format)
      
      if (format === 'csv') {
        // 下载 CSV 文件
        const blob = new Blob([res.data.content], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = res.data.filename
        link.click()
        window.URL.revokeObjectURL(url)
      } else {
        // 下载 JSON 文件
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rules_export_${new Date().toISOString().slice(0, 10)}.json`
        link.click()
        window.URL.revokeObjectURL(url)
      }
      message.success(t('rule:message.exportSuccess'))
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  // 打开高级编辑
  const handleOpenAdvancedEdit = async (record: Rule) => {
    setEditingRule(record)
    advancedForm.setFieldsValue(record)
    
    // 加载规则详情获取条件
    try {
      const res: any = await ruleApi.getDetail(record.id)
      const latestVersion = res.data.versions?.[0]
      if (latestVersion?.conditions) {
        // 转换后端条件格式为组件格式
        const convertedConditions: ConditionNode[] = latestVersion.conditions.map((c: any) => ({
          id: c.id || Math.random().toString(36).substr(2, 9),
          type: 'condition',
          field: c.field,
          operator: c.operator,
          value: c.value,
        }))
        setConditions(convertedConditions)
      } else {
        setConditions([])
      }
    } catch (error) {
      setConditions([])
    }
    
    setAdvancedModalVisible(true)
  }

  // 保存高级编辑
  const handleSaveAdvanced = async () => {
    try {
      const values = await advancedForm.validateFields()
      if (editingRule) {
        await ruleApi.update(editingRule.id, values)
        // 如果有条件，创建新版本
        if (conditions.length > 0) {
          await ruleApi.createVersion(editingRule.id, {
            configJson: { conditions },
            description: t('rule:message.versionDescription'),
            conditions: conditions.map(c => ({
              conditionType: 'simple',
              field: c.field,
              operator: c.operator,
              value: String(c.value),
              valueType: typeof c.value === 'number' ? 'number' : 'string',
              logicType: 'AND',
            })),
          })
        }
        message.success(t('rule:message.updateSuccess'))
        setAdvancedModalVisible(false)
        fetchRules(pagination.current, pagination.pageSize)
      }
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  // 获取模板列表
  const fetchTemplates = async () => {
    setTemplateLoading(true)
    try {
      const res: any = await templateApi.getList()
      setTemplates(res.data || [])
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setTemplateLoading(false)
    }
  }

  // 打开模板选择器
  const handleOpenTemplateModal = () => {
    fetchTemplates()
    setTemplateModalVisible(true)
  }

  // 从模板加载条件
  const handleLoadTemplate = (template: any) => {
    if (template.conditions) {
      const loadedConditions: ConditionNode[] = Array.isArray(template.conditions) 
        ? template.conditions.map((c: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            type: 'condition',
            field: c.field,
            operator: c.operator,
            value: c.value,
          }))
        : [];
      setConditions(loadedConditions)
      message.success(`已加载模板: ${template.name}`)
      setTemplateModalVisible(false)
    }
  }

  // 保存当前条件为模板
  const handleSaveTemplate = async (values: any) => {
    try {
      await templateApi.create({
        name: values.name,
        description: values.description,
        category: 'custom',
        conditions: conditions,
      })
      message.success('模板保存成功')
      setSaveTemplateModalVisible(false)
      templateForm.resetFields()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  // 删除模板
  const handleDeleteTemplate = async (id: string) => {
    try {
      await templateApi.delete(id)
      message.success('模板删除成功')
      fetchTemplates()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  // 处理导入文件选择
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content)
          if (data.rules && Array.isArray(data.rules)) {
            setImportPreview(data.rules.slice(0, 5)) // 只预览前5条
          } else {
            message.error('无效的JSON格式：缺少rules数组')
          }
        } else {
          message.error('请选择JSON格式的文件')
        }
      } catch (error) {
        message.error('文件解析失败')
      }
    }
    
    reader.readAsText(file)
  }

  // 执行导入
  const handleImport = async () => {
    if (!importFile) {
      message.error('请选择要导入的文件')
      return
    }

    setImportLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string
          const data = JSON.parse(content)
          
          if (data.rules && Array.isArray(data.rules)) {
            const result: any = await ruleApi.import(data.rules, importConflictStrategy)
            message.success(`导入完成: 成功${result.success}条, 失败${result.failed}条`)
            if (result.errors && result.errors.length > 0) {
              console.log('导入错误:', result.errors)
            }
            setImportModalVisible(false)
            setImportFile(null)
            setImportPreview([])
            fetchRules(1, pagination.pageSize)
          } else {
            message.error('无效的导入数据')
          }
        } catch (error: any) {
          message.error(error.message || '导入失败')
        } finally {
          setImportLoading(false)
        }
      }
      reader.readAsText(importFile)
    } catch (error) {
      setImportLoading(false)
      message.error('导入失败')
    }
  }

  const columns = [
    { title: t('rule:field.name'), dataIndex: 'name', ellipsis: true },
    { title: t('rule:field.ruleType'), dataIndex: 'ruleType', render: (type: string) => getRuleTypeLabel(type) },
    { title: t('rule:field.priority'), dataIndex: 'priority', width: 100 },
    {
      title: t('rule:field.status'),
      dataIndex: 'status',
      width: 120,
      render: (status: number, record: Rule) => (
        <Space>
          {getStatusTag(status)}
          <Switch
            checked={status === 1}
            onChange={(checked) => handleToggleStatus(record, checked)}
            checkedChildren={<CheckOutlined />}
            unCheckedChildren={<CloseOutlined />}
          />
        </Space>
      ),
    },
    {
      title: t('common:table.action'),
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Rule) => (
        <Space size={0}>
          <Tooltip title={t('rule:action.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
          <Tooltip title={t('rule:action.quickEdit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRule(record)
                form.setFieldsValue(record)
                setModalVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title={t('rule:action.advancedEdit')}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleOpenAdvancedEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t('rule:action.copy')}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCloneRule(record)}
            />
          </Tooltip>
          <Tooltip title={t('rule:action.export')}>
            <Dropdown
              menu={{
                items: [
                  { key: 'json', label: 'Export as JSON', onClick: () => handleExport('json', record.id) },
                  { key: 'csv', label: 'Export as CSV', onClick: () => handleExport('csv', record.id) },
                ],
              }}
            >
              <Button type="text" icon={<ExportOutlined />} />
            </Dropdown>
          </Tooltip>
          <Popconfirm
            title={t('common:message.confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card 
        variant="borderless"
        title={<Title level={4} style={{ margin: 0 }}>{t('rule:title')}</Title>}
        extra={
          <Space>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              导入
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'json', label: '导出为 JSON', onClick: () => handleExport('json') },
                  { key: 'csv', label: '导出为 CSV', onClick: () => handleExport('csv') },
                  { key: 'xlsx', label: '导出为 Excel', onClick: () => handleExport('xlsx') },
                ],
              }}
            >
              <Button icon={<ExportOutlined />}>
                {t('rule:action.export')} <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRule(null)
                form.resetFields()
                setModalVisible(true)
              }}
            >
              {t('rule:create')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common:table.total', { count: total }),
          }}
          onChange={(p) => fetchRules(p.current, p.pageSize)}
        />
      </Card>

      <Modal
        title={editingRule ? t('rule:edit') : t('rule:create')}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        okText={t('common:button.save')}
        cancelText={t('common:button.cancel')}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item 
            name="name" 
            label={t('rule:field.name')} 
            rules={[{ required: true, message: t('rule:validation.nameRequired') }]}
          >
            <Input placeholder={t('rule:placeholder.name')} />
          </Form.Item>
          <Form.Item 
            name="ruleType" 
            label={t('rule:field.ruleType')} 
            rules={[{ required: true, message: t('rule:validation.typeRequired') }]}
          >
            <Select options={ruleTypeOptions} placeholder={t('common:form.select')} />
          </Form.Item>
          <Form.Item name="businessType" label={t('rule:field.businessType')}>
            <Select
              allowClear
              placeholder={t('common:form.select')}
              options={[
                { value: 'food_delivery', label: t('rule:businessType.food_delivery') },
                { value: 'grocery_delivery', label: t('rule:businessType.grocery_delivery') },
                { value: 'medicine_delivery', label: t('rule:businessType.medicine_delivery') },
              ]}
            />
          </Form.Item>
          <Form.Item name="priority" label={t('rule:field.priority')} initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="description" label={t('rule:field.description')}>
            <Input.TextArea rows={3} placeholder={t('rule:placeholder.description')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('rule:detail')}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {detailRule && (
          <Space direction="vertical" style={{ display: 'flex' }}>
            <Typography.Text><strong>{t('rule:field.name')}:</strong> {detailRule.name}</Typography.Text>
            <Typography.Text><strong>{t('rule:field.ruleType')}:</strong> {getRuleTypeLabel(detailRule.ruleType)}</Typography.Text>
            <Typography.Text><strong>{t('rule:field.description')}:</strong> {detailRule.description || '-'}</Typography.Text>
            <Typography.Text><strong>{t('rule:field.status')}:</strong> {getStatusTag(detailRule.status)}</Typography.Text>
            <Typography.Text strong>{t('rule:version.history')}:</Typography.Text>
            {detailRule.versions?.map((v: any) => (
              <Card key={v.id} size="small" style={{ marginLeft: 16 }}>
                <Space direction="vertical" size={4}>
                  <Typography.Text>
                    {t('rule:version.version', { version: v.version })} - 
                    {v.status === 1 ? t('rule:status.published') : v.status === 0 ? t('rule:status.draft') : t('rule:status.offline')}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v.description}</Typography.Text>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Modal>

      {/* Advanced Edit Modal */}
      <Modal
        title={t('rule:advancedEdit.title', { name: editingRule?.name })}
        open={advancedModalVisible}
        onOk={handleSaveAdvanced}
        onCancel={() => setAdvancedModalVisible(false)}
        width={1000}
        okText={t('rule:advancedEdit.save')}
        cancelText={t('rule:advancedEdit.cancel')}
      >
        <Form form={advancedForm} layout="vertical">
          <Tabs
            items={[
              {
                key: 'basic',
                label: t('rule:advancedEdit.basicInfo'),
                children: (
                  <>
                    <Form.Item name="name" label={t('rule:advancedEdit.ruleName')} rules={[{ required: true }]}>
                      <Input placeholder={t('rule:advancedEdit.enterName')} />
                    </Form.Item>
                    <Form.Item name="description" label={t('rule:advancedEdit.description')}>
                      <Input.TextArea rows={3} placeholder={t('rule:advancedEdit.enterDescription')} />
                    </Form.Item>
                    <Form.Item name="priority" label={t('rule:advancedEdit.priority')} initialValue={0}>
                      <Input type="number" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'conditions',
                label: (
                  <span>
                    {t('rule:advancedEdit.conditions')}
                    <Badge count={conditions.length} style={{ marginLeft: 8 }} />
                  </span>
                ),
                children: (
                  <>
                    <Space style={{ marginBottom: 16 }}>
                      <Button icon={<FolderOpenOutlined />} onClick={handleOpenTemplateModal}>
                        从模板加载
                      </Button>
                      <Button icon={<SaveOutlined />} onClick={() => setSaveTemplateModalVisible(true)} disabled={conditions.length === 0}>
                        保存为模板
                      </Button>
                    </Space>
                    <RuleConditionBuilder
                      value={conditions}
                      onChange={setConditions}
                    />
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* Template Selector Modal */}
      <Modal
        title="选择条件模板"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          loading={templateLoading}
          dataSource={templates}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="primary" size="small" onClick={() => handleLoadTemplate(item)}>
                  加载
                </Button>,
                <Popconfirm title="确定删除此模板？" onConfirm={() => handleDeleteTemplate(item.id)}>
                  <Button danger size="small" icon={<DeleteFilled />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={item.description || '无描述'}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无模板' }}
        />
      </Modal>

      {/* Save Template Modal */}
      <Modal
        title="保存条件模板"
        open={saveTemplateModalVisible}
        onOk={() => templateForm.submit()}
        onCancel={() => setSaveTemplateModalVisible(false)}
      >
        <Form form={templateForm} onFinish={handleSaveTemplate} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例如：高优先级骑手筛选" />
          </Form.Item>
          <Form.Item name="description" label="模板描述">
            <Input.TextArea rows={3} placeholder="描述此模板的用途..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="导入规则"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportFile(null)
          setImportPreview([])
        }}
        confirmLoading={importLoading}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Typography.Text strong>选择文件：</Typography.Text>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              style={{ marginLeft: 8 }}
              ref={fileInputRef}
            />
          </div>

          <div>
            <Typography.Text strong>冲突处理策略：</Typography.Text>
            <Radio.Group 
              value={importConflictStrategy} 
              onChange={(e: RadioChangeEvent) => setImportConflictStrategy(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              <Radio value="skip">跳过</Radio>
              <Radio value="overwrite">覆盖</Radio>
              <Radio value="rename">重命名</Radio>
            </Radio.Group>
          </div>

          {importPreview.length > 0 && (
            <div>
              <Typography.Text strong>预览（前5条）：</Typography.Text>
              <List
                size="small"
                bordered
                dataSource={importPreview}
                renderItem={(item: any) => (
                  <List.Item>
                    <Typography.Text>{item.name}</Typography.Text>
                    <Tag>{item.ruleType}</Tag>
                  </List.Item>
                )}
              />
            </div>
          )}
        </Space>
      </Modal>
    </Space>
  )
}
