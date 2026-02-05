import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
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

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '已发布', color: 'success' },
  2: { text: '已下线', color: 'error' },
}

const ruleTypeMap: Record<string, string> = {
  distance: '距离规则',
  workload: '负载规则',
  rating: '评分规则',
  urgency: '紧急规则',
  order_value: '订单价值',
  vip_customer: 'VIP客户',
  capability: '能力匹配',
  time_window: '时间窗口',
  composite: '组合规则',
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
        message.success('更新成功')
      } else {
        await ruleApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRules(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await ruleApi.delete(id)
      message.success('删除成功')
      fetchRules(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleViewDetail = async (id: string) => {
    try {
      const res: any = await ruleApi.getDetail(id)
      setDetailRule(res.data)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  const columns = [
    { title: '规则名称', dataIndex: 'name' },
    { title: '规则类型', dataIndex: 'ruleType', render: (type: string) => ruleTypeMap[type] || type },
    { title: '优先级', dataIndex: 'priority' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number) => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>,
    },
    {
      title: '操作',
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
            title="确认删除"
            description="确定要删除该规则吗？"
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
        <h2>规则管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRule(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新建规则
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
        title={editingRule ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true }]}>
            <Select options={Object.entries(ruleTypeMap).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="businessType" label="业务类型">
            <Select
              allowClear
              options={[
                { value: 'food_delivery', label: '外卖配送' },
                { value: 'grocery_delivery', label: '生鲜配送' },
                { value: 'medicine_delivery', label: '药品配送' },
              ]}
            />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="规则详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {detailRule && (
          <div>
            <p><strong>规则名称：</strong>{detailRule.name}</p>
            <p><strong>规则类型：</strong>{ruleTypeMap[detailRule.ruleType]}</p>
            <p><strong>描述：</strong>{detailRule.description || '-'}</p>
            <p><strong>状态：</strong><Tag color={statusMap[detailRule.status]?.color}>{statusMap[detailRule.status]?.text}</Tag></p>
            <p><strong>版本历史：</strong></p>
            {detailRule.versions?.map((v: any) => (
              <div key={v.id} style={{ marginLeft: 20, padding: 10, background: '#f5f5f5', marginBottom: 10, borderRadius: 4 }}>
                <p>版本 {v.version} - {v.status === 1 ? '当前版本' : v.status === 0 ? '草稿' : '已下线'}</p>
                <p style={{ fontSize: 12, color: '#666' }}>{v.description}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
