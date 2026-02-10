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
  const { t } = useTranslation(['dashboard', 'menu'])
  const { token } = theme.useToken()

  const stats = [
    {
      title: t('dashboard:totalUsers'),
      value: 12,
      icon: <UserOutlined style={{ color: token.colorPrimary }} />,
    },
    {
      title: t('dashboard:totalRules'),
      value: 8,
      icon: <FileTextOutlined style={{ color: token.colorSuccess }} />,
    },
    {
      title: t('dashboard:roles'),
      value: 3,
      icon: <TeamOutlined style={{ color: token.colorWarning }} />,
    },
    {
      title: t('dashboard:publishedRules'),
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
