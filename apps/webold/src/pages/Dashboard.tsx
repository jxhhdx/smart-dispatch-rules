import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Space, theme, message } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { dashboardApi } from '../services/api'

const { Title } = Typography

interface StatsData {
  totalUsers: number
  totalRules: number
  totalRoles: number
  publishedRules: number
}

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'menu'])
  const { token } = theme.useToken()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res: any = await dashboardApi.getStats()
      setStats(res.data)
    } catch (error: any) {
      message.error(t('dashboard:fetchStatsFailed') || '获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statItems = [
    {
      title: t('dashboard:totalUsers'),
      value: stats?.totalUsers ?? 0,
      icon: <UserOutlined style={{ color: token.colorPrimary }} />,
    },
    {
      title: t('dashboard:totalRules'),
      value: stats?.totalRules ?? 0,
      icon: <FileTextOutlined style={{ color: token.colorSuccess }} />,
    },
    {
      title: t('dashboard:roles'),
      value: stats?.totalRoles ?? 0,
      icon: <TeamOutlined style={{ color: token.colorWarning }} />,
    },
    {
      title: t('dashboard:publishedRules'),
      value: stats?.publishedRules ?? 0,
      icon: <CheckCircleOutlined style={{ color: token.colorInfo }} />,
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Title level={4} style={{ margin: 0 }}>{t('menu:dashboard')}</Title>
      
      <Row gutter={[16, 16]}>
        {statItems.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card hoverable loading={loading}>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard:systemAnnouncement')} hoverable>
            <Space direction="vertical">
              <Typography.Text>{t('dashboard:welcomeMessage')}</Typography.Text>
              <Typography.Text type="secondary">
                {t('dashboard:systemDescription')}
              </Typography.Text>
              <Typography.Text type="secondary">
                {t('dashboard:techStack')}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard:quickStart')} hoverable>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>{t('dashboard:quickStartRule', { rules: t('menu:rules') })}</li>
              <li>{t('dashboard:quickStartUser', { users: t('menu:systemUsers') })}</li>
              <li>{t('dashboard:quickStartRole', { roles: t('menu:systemRoles') })}</li>
              <li>{t('dashboard:quickStartLog', { logs: t('menu:systemLogs') })}</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
