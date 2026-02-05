import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Checkbox, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['role', 'common'])

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
        message.success(t('role:message.updateSuccess'))
      } else {
        await roleApi.create(data)
        message.success(t('role:message.createSuccess'))
      }
      setModalVisible(false)
      fetchRoles()
    } catch (error: any) {
      message.error(error.response?.data?.message || t('common:message.error'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await roleApi.delete(id)
      message.success(t('role:message.deleteSuccess'))
      fetchRoles()
    } catch (error: any) {
      message.error(error.response?.data?.message || t('common:message.error'))
    }
  }

  const columns = [
    { title: t('role:field.name'), dataIndex: 'name' },
    { title: t('role:field.code'), dataIndex: 'code' },
    { title: t('role:field.description'), dataIndex: 'description' },
    { title: t('role:field.userCount'), dataIndex: ['_count', 'users'] },
    {
      title: t('common:table.action'),
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
        <h2>{t('role:title')}</h2>
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
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
      />

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
            <Input.TextArea placeholder={t('role:placeholder.description')} />
          </Form.Item>
          <Form.Item label={t('role:permission.title')}>
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
