import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ruleApi } from '../services/api'

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
        message.success(t('rule:message.updateSuccess'))
      } else {
        await ruleApi.create(values)
        message.success(t('rule:message.createSuccess'))
      }
      setModalVisible(false)
      fetchRules(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || t('common:message.error'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await ruleApi.delete(id)
      message.success(t('rule:message.deleteSuccess'))
      fetchRules(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || t('common:message.error'))
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const res: any = await ruleApi.getDetail(id)
      setDetailRule(res.data)
      setDetailVisible(true)
    } catch (error) {
      message.error(t('common:message.error'))
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
    { title: t('rule:field.name'), dataIndex: 'name' },
    { title: t('rule:field.ruleType'), dataIndex: 'ruleType', render: (type: string) => getRuleTypeLabel(type) },
    { title: t('rule:field.priority'), dataIndex: 'priority' },
    {
      title: t('rule:field.status'),
      dataIndex: 'status',
      render: (status: number) => getStatusTag(status),
    },
    {
      title: t('common:table.action'),
      width: 200,
      render: (_: any, record: Rule) => (
        <Space>
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>{t('rule:title')}</h2>
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
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(p) => fetchRules(p.current, p.pageSize)}
      />

      <Modal
        title={editingRule ? t('rule:edit') : t('rule:create')}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        okText={t('common:button.save')}
        cancelText={t('common:button.cancel')}
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
            <Input.TextArea placeholder={t('rule:placeholder.description')} />
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
          <div>
            <p><strong>{t('rule:field.name')}:</strong>{detailRule.name}</p>
            <p><strong>{t('rule:field.ruleType')}:</strong>{getRuleTypeLabel(detailRule.ruleType)}</p>
            <p><strong>{t('rule:field.description')}:</strong>{detailRule.description || '-'}</p>
            <p><strong>{t('rule:field.status')}:</strong>{getStatusTag(detailRule.status)}</p>
            <p><strong>{t('rule:version.history')}:</strong></p>
            {detailRule.versions?.map((v: any) => (
              <div key={v.id} style={{ marginLeft: 20, padding: 10, background: '#f5f5f5', marginBottom: 10, borderRadius: 4 }}>
                <p>{t('rule:version.version', { version: v.version })} - {v.status === 1 ? t('rule:status.published') : v.status === 0 ? t('rule:status.draft') : t('rule:status.offline')}</p>
                <p style={{ fontSize: 12, color: '#666' }}>{v.description}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
