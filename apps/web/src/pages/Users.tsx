import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Card, Typography, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { userApi, roleApi } from '../services/api'

const { Title } = Typography

interface User {
  id: string
  username: string
  email: string
  realName?: string
  phone?: string
  status: number
  role?: {
    id: string
    name: string
  }
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const { t } = useTranslation(['user', 'common'])

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res: any = await userApi.getList({ page, pageSize })
      setUsers(res.data.list)
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.pageSize,
        total: res.data.pagination.total,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res: any = await roleApi.getList()
      setRoles(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, values)
      } else {
        await userApi.create(values)
      }
      setModalVisible(false)
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error: any) {
      // 错误已在 api 拦截器中处理
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id)
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error: any) {
      // 错误已在 api 拦截器中处理
    }
  }

  const columns = [
    { title: t('user:field.username'), dataIndex: 'username', ellipsis: true },
    { title: t('user:field.email'), dataIndex: 'email', ellipsis: true },
    { title: t('user:field.realName'), dataIndex: 'realName' },
    { title: t('user:field.role'), dataIndex: ['role', 'name'] },
    {
      title: t('user:field.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? t('common:status.enabled') : t('common:status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('common:table.action'),
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space size={0}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record)
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
        title={<Title level={4} style={{ margin: 0 }}>{t('user:title')}</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            {t('user:create')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `${t('common:table.total')} ${total} ${t('common:table.items')}`,
          }}
          onChange={(p) => fetchUsers(p.current, p.pageSize)}
        />
      </Card>

      <Modal
        title={editingUser ? t('user:edit') : t('user:create')}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        okText={t('common:button.save')}
        cancelText={t('common:button.cancel')}
        width={520}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="username"
            label={t('user:field.username')}
            rules={[{ required: true, message: t('user:validation.usernameRequired') }]}
          >
            <Input disabled={!!editingUser} placeholder={t('user:placeholder.username')} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('user:field.email')}
            rules={[
              { required: true, message: t('user:validation.emailRequired') },
              { type: 'email', message: t('user:validation.emailInvalid') }
            ]}
          >
            <Input placeholder={t('user:placeholder.email')} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label={t('user:field.password')}
              rules={[
                { required: true, message: t('user:validation.passwordRequired') },
                { min: 6, message: t('user:validation.passwordLength') }
              ]}
            >
              <Input.Password placeholder={t('user:placeholder.password')} />
            </Form.Item>
          )}
          <Form.Item name="realName" label={t('user:field.realName')}>
            <Input placeholder={t('user:placeholder.realName')} />
          </Form.Item>
          <Form.Item name="phone" label={t('user:field.phone')}>
            <Input placeholder={t('user:placeholder.phone')} />
          </Form.Item>
          <Form.Item name="roleId" label={t('user:field.role')}>
            <Select 
              allowClear
              options={roles.map(r => ({ label: r.name, value: r.id }))}
              placeholder={t('common:form.select')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
