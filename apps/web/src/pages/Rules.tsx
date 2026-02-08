import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Card, Typography, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ruleApi } from '../services/api'

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
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailRule, setDetailRule] = useState<any>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const { t } = useTranslation(['rule', 'common'])

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
      } else {
        await ruleApi.create(values)
      }
      setModalVisible(false)
      fetchRules(pagination.current, pagination.pageSize)
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

  const columns = [
    { title: t('rule:field.name'), dataIndex: 'name', ellipsis: true },
    { title: t('rule:field.ruleType'), dataIndex: 'ruleType', render: (type: string) => getRuleTypeLabel(type) },
    { title: t('rule:field.priority'), dataIndex: 'priority', width: 100 },
    {
      title: t('rule:field.status'),
      dataIndex: 'status',
      width: 120,
      render: (status: number) => getStatusTag(status),
    },
    {
      title: t('common:table.action'),
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Rule) => (
        <Space size={0}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRule(record)
              form.setFieldsValue(record)
              setModalVisible(true)
            }}
          />
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
        bordered={false}
        title={<Title level={4} style={{ margin: 0 }}>{t('rule:title')}</Title>}
        extra={
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
            showTotal: (total) => `${t('common:table.total')} ${total} ${t('common:table.items')}`,
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
                { value: 'food_delivery', label: 'Food Delivery' },
                { value: 'grocery_delivery', label: 'Grocery Delivery' },
                { value: 'medicine_delivery', label: 'Medicine Delivery' },
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
    </Space>
  )
}
