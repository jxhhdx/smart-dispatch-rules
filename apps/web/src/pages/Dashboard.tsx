import { Row, Col, Card, Statistic, Typography, Space, theme } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Title } = Typography

export default function Dashboard() {
  const { t } = useTranslation('menu')
  const { token } = theme.useToken()

  const stats = [
    {
      title: 'Total Users',
      value: 12,
      icon: <UserOutlined style={{ color: token.colorPrimary }} />,
    },
    {
      title: 'Total Rules',
      value: 8,
      icon: <FileTextOutlined style={{ color: token.colorSuccess }} />,
    },
    {
      title: 'Roles',
      value: 3,
      icon: <TeamOutlined style={{ color: token.colorWarning }} />,
    },
    {
      title: 'Published Rules',
      value: 5,
      icon: <CheckCircleOutlined style={{ color: token.colorInfo }} />,
    },
  ]

  return (
    <Space direction="vertical" size={24} style={{ display: 'flex' }}>
      <Title level={4} style={{ margin: 0 }}>{t('menu:dashboard')}</Title>
      
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card hoverable>
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
          <Card title="System Announcement" hoverable>
            <Space direction="vertical">
              <Typography.Text>Welcome to the Intelligent Dispatch Rule Management System!</Typography.Text>
              <Typography.Text type="secondary">
                This system is used to manage dispatch strategy rules for food delivery scenarios.
              </Typography.Text>
              <Typography.Text type="secondary">
                Tech Stack: React + NestJS + PostgreSQL
              </Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Start" hoverable>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Create and configure dispatch rules in {t('menu:rules')}</li>
              <li>Manage system users in {t('menu:systemUsers')}</li>
              <li>Configure permission roles in {t('menu:systemRoles')}</li>
              <li>View system operation logs in {t('menu:systemLogs')}</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
