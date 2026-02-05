import { useState, useEffect } from 'react'
import { Table, Tabs, DatePicker, Input, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { logApi } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

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

  const systemLogColumns = [
    { title: '时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: '用户', dataIndex: 'username' },
    { title: '模块', dataIndex: 'module' },
    { title: '操作', dataIndex: 'action' },
    { title: '描述', dataIndex: 'description' },
    { title: 'IP地址', dataIndex: 'ipAddress' },
  ]

  const loginLogColumns = [
    { title: '时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: '用户名', dataIndex: 'username' },
    { title: '登录类型', dataIndex: 'loginType' },
    { title: '状态', dataIndex: 'status', render: (s: number) => s === 1 ? '成功' : '失败' },
    { title: 'IP地址', dataIndex: 'ipAddress' },
    { title: '失败原因', dataIndex: 'failReason' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>操作日志</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Input
          placeholder={activeTab === 'operation' ? '搜索模块' : '搜索用户名'}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
        <RangePicker
          value={searchParams.dateRange}
          onChange={(dates) => setSearchParams({ ...searchParams, dateRange: dates })}
        />
        <Button
          type="primary"
          onClick={() => {
            setPagination({ ...pagination, current: 1 })
            if (activeTab === 'operation') {
              fetchSystemLogs(1, pagination.pageSize)
            } else {
              fetchLoginLogs(1, pagination.pageSize)
            }
          }}
        >
          查询
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="系统操作日志" key="operation">
          <Table
            columns={systemLogColumns}
            dataSource={systemLogs}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={(p) => fetchSystemLogs(p.current, p.pageSize)}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="登录日志" key="login">
          <Table
            columns={loginLogColumns}
            dataSource={loginLogs}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={(p) => fetchLoginLogs(p.current, p.pageSize)}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}
