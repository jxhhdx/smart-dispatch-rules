import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { userApi, roleApi } from '../services/api'

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
        message.success('更新成功')
      } else {
        await userApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id)
      message.success('删除成功')
      fetchUsers(pagination.current, pagination.pageSize)
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '姓名', dataIndex: 'realName' },
    { title: '角色', dataIndex: ['role', 'name'] },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number) => status === 1 ? '启用' : '禁用',
    },
    {
      title: '操作',
      render: (_: any, record: User) => (
        <Space>
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
            title="确认删除"
            description="确定要删除该用户吗？"
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
        <h2>用户管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUser(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(p) => fetchUsers(p.current, p.pageSize)}
      />

      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, min: 6 }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="realName" label="姓名">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="roleId" label="角色">
            <Select options={roles.map(r => ({ label: r.name, value: r.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
