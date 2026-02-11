import { useState, useEffect } from 'react'
import { Table, Tabs, DatePicker, Input, Button, Card, Space, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { logApi } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Title } = Typography

export default function Logs() {
  const [activeTab, setActiveTab] = useState('operation')
  const [systemLogs, setSystemLogs] = useState([])
  const [loginLogs, setLoginLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    dateRange: null as any,
  })
  const { t } = useTranslation(['menu', 'common', 'log'])

  const fetchSystemLogs = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (searchParams.keyword) params.module = searchParams.keyword
      if (searchParams.dateRange) {
        params.startDate = searchParams.dateRange[0].format('YYYY-MM-DD')
        params.endDate = searchParams.dateRange[1].format('YYYY-MM-DD')
      }
      const res: any = await logApi.getSystemLogs(params)
      setSystemLogs(res.data.list)
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.pageSize,
        total: res.data.pagination.total,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLoginLogs = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (searchParams.keyword) params.username = searchParams.keyword
      if (searchParams.dateRange) {
        params.startDate = searchParams.dateRange[0].format('YYYY-MM-DD')
        params.endDate = searchParams.dateRange[1].format('YYYY-MM-DD')
      }
      const res: any = await logApi.getLoginLogs(params)
      setLoginLogs(res.data.list)
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
    if (activeTab === 'operation') {
      fetchSystemLogs()
    } else {
      fetchLoginLogs()
    }
  }, [activeTab])

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    if (activeTab === 'operation') {
      fetchSystemLogs(1, pagination.pageSize)
    } else {
      fetchLoginLogs(1, pagination.pageSize)
    }
  }

  const systemLogColumns = [
    { title: t('log:column.time'), dataIndex: 'createdAt', width: 170, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: t('log:column.user'), dataIndex: 'username', width: 120 },
    { title: t('log:column.module'), dataIndex: 'module', width: 120 },
    { title: t('log:column.action'), dataIndex: 'action', width: 120 },
    { title: t('log:column.description'), dataIndex: 'description', ellipsis: true },
    { title: t('log:column.ipAddress'), dataIndex: 'ipAddress', width: 140 },
  ]

  const loginLogColumns = [
    { title: t('log:column.time'), dataIndex: 'createdAt', width: 170, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: t('log:column.username'), dataIndex: 'username', width: 120 },
    { title: t('log:column.loginType'), dataIndex: 'loginType', width: 120 },
    { title: t('log:column.status'), dataIndex: 'status', width: 100, render: (s: number) => s === 1 ? t('log:status.success') : t('log:status.failed') },
    { title: t('log:column.ipAddress'), dataIndex: 'ipAddress', width: 140 },
    { title: t('log:column.failReason'), dataIndex: 'failReason', ellipsis: true },
  ]

  const tabItems = [
    {
      key: 'operation',
      label: t('log:systemOperationLogs'),
      children: (
        <Table
          columns={systemLogColumns}
          dataSource={systemLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common:table.total', { count: total }),
          }}
          onChange={(p) => fetchSystemLogs(p.current, p.pageSize)}
        />
      ),
    },
    {
      key: 'login',
      label: t('log:loginLogs'),
      children: (
        <Table
          columns={loginLogColumns}
          dataSource={loginLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('common:table.total', { count: total }),
          }}
          onChange={(p) => fetchLoginLogs(p.current, p.pageSize)}
        />
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Title level={4} style={{ margin: 0 }}>{t('menu:systemLogs')}</Title>
      
      <Card variant="borderless">
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Space wrap>
            <Input
              placeholder={activeTab === 'operation' ? t('log:search.module') : t('log:search.username')}
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <RangePicker
              value={searchParams.dateRange}
              onChange={(dates) => setSearchParams({ ...searchParams, dateRange: dates })}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              {t('common:button.search')}
            </Button>
          </Space>
          
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
          />
        </Space>
      </Card>
    </Space>
  )
}
