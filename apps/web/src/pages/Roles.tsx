import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Checkbox, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { roleApi } from '../services/api'

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

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res: any = await roleApi.getList()
      setRoles(res.data)
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
    fetchRoles()
    fetchPermissions()
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      const data = { ...values, permissionIds: selectedPermissions }
      if (editingRole) {
        await roleApi.update(editingRole.id, data)
        message.success('更新成功')
      } else {
        await roleApi.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRoles()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await roleApi.delete(id)
      message.success('删除成功')
      fetchRoles()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const columns = [
    { title: '角色名称', dataIndex: 'name' },
    { title: '角色编码', dataIndex: 'code' },
    { title: '描述', dataIndex: 'description' },
    { title: '用户数', dataIndex: ['_count', 'users'] },
    {
      title: '操作',
      render: (_: any, record: Role) => (
        <Space>
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
            title="确认删除"
            description="确定要删除该角色吗？"
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
        <h2>角色管理</h2>
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
          新建角色
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingRole ? '编辑角色' : '新建角色'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="角色编码"
            rules={[{ required: true }]}
          >
            <Input disabled={!!editingRole} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="权限">
            <Checkbox.Group
              value={selectedPermissions}
              onChange={(values) => setSelectedPermissions(values as string[])}
              options={permissions.map(p => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
