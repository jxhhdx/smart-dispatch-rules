import { Row, Col, Card, Statistic } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { t } = useTranslation('menu')

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{t('menu:dashboard')}</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={12}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Rules"
              value={8}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Roles"
              value={3}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Published Rules"
              value={5}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="System Announcement">
            <p>Welcome to the Intelligent Dispatch Rule Management System!</p>
            <p>This system is used to manage dispatch strategy rules for food delivery scenarios.</p>
            <p>Tech Stack: React + NestJS + PostgreSQL</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Quick Start">
            <ul>
              <li>Create and configure dispatch rules in {t('menu:rules')}</li>
              <li>Manage system users in {t('menu:systemUsers')}</li>
              <li>Configure permission roles in {t('menu:systemRoles')}</li>
              <li>View system operation logs in {t('menu:systemLogs')}</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
