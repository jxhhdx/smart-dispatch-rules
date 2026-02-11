import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Checkbox, Card, Typography, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { roleApi } from '../services/api'

const { Title } = Typography

interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions?: any[]
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [form] = Form.useForm()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const { t } = useTranslation(['role', 'common'])

  const fetchRoles = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res: any = await roleApi.getList({ page, pageSize })
      setRoles(res.data.list)
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.pageSize,
        total: res.data.pagination.total,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res: any = await roleApi.getPermissions()
      setPermissions(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchRoles(1, pagination.pageSize)
    fetchPermissions()
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      const data = { ...values, permissionIds: selectedPermissions }
      if (editingRole) {
        await roleApi.update(editingRole.id, data)
        setModalVisible(false)
        fetchRoles(pagination.current, pagination.pageSize)
      } else {
        await roleApi.create(data)
        setModalVisible(false)
        // 创建新角色后，刷新第一页以显示新角色
        fetchRoles(1, pagination.pageSize)
      }
    } catch (error: any) {
      // 错误已在 api 拦截器中处理
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await roleApi.delete(id)
      fetchRoles(pagination.current, pagination.pageSize)
    } catch (error: any) {
      // 错误已在 api 拦截器中处理
    }
  }

  const columns = [
    { title: t('role:field.name'), dataIndex: 'name', ellipsis: true },
    { title: t('role:field.code'), dataIndex: 'code' },
    { title: t('role:field.description'), dataIndex: 'description', ellipsis: true },
    { title: t('role:field.userCount'), dataIndex: ['_count', 'users'], width: 120 },
    {
      title: t('common:table.action'),
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Role) => (
        <Space size={0}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRole(record)
              form.setFieldsValue(record)
              setSelectedPermissions(record.permissions?.map(p => p.permission.id) || [])
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
        variant="borderless"
        title={<Title level={4} style={{ margin: 0 }}>{t('role:title')}</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRole(null)
              form.resetFields()
              setSelectedPermissions([])
              setModalVisible(true)
            }}
          >
            {t('role:create')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total) => t('common:table.total', { count: total }),
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={(p) => fetchRoles(p.current, p.pageSize)}
        />
      </Card>

      <Modal
        title={editingRole ? t('role:edit') : t('role:create')}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText={t('common:button.save')}
        cancelText={t('common:button.cancel')}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('role:field.name')}
            rules={[{ required: true, message: t('role:validation.nameRequired') }]}
          >
            <Input placeholder={t('role:placeholder.name')} />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('role:field.code')}
            rules={[
              { required: true, message: t('role:validation.codeRequired') },
              { pattern: /^[a-zA-Z0-9_]+$/, message: t('role:validation.codePattern') }
            ]}
          >
            <Input disabled={!!editingRole} placeholder={t('role:placeholder.code')} />
          </Form.Item>
          <Form.Item name="description" label={t('role:field.description')}>
            <Input.TextArea rows={3} placeholder={t('role:placeholder.description')} />
          </Form.Item>
          <Form.Item label={t('role:permission.title')}>
            <Checkbox.Group
              value={selectedPermissions}
              onChange={(values) => setSelectedPermissions(values as string[])}
            >
              <Space direction="vertical" size={8}>
                {permissions.map(p => (
                  <Checkbox key={p.id} value={p.id}>{p.name}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
