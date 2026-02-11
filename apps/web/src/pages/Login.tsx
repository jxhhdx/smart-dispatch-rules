import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Space, theme, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import LanguageSwitch from '../components/LanguageSwitch'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useTranslation(['auth', 'common'])
  const { token } = theme.useToken()

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success(t('auth:login.success') || '登录成功')
      navigate('/')
    } catch (error: any) {
      // 显示错误消息 - 优先使用后端返回的错误消息
      const errorMessage = error.message || error.response?.data?.message || t('auth:login.error') || '登录失败，请检查用户名和密码'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #722ed1 100%)`,
      }}
    >
      <Card 
        style={{ 
          width: 420,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadow,
        }}
        variant="borderless"
      >
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0, color: token.colorPrimary }}>
            {t('common:app.name')}
          </Title>
          <Text type="secondary">{t('auth:login.subtitle')}</Text>
        </Space>
        
        <Form 
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('auth:login.usernamePlaceholder') }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder={t('auth:login.username')}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth:login.passwordPlaceholder') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder={t('auth:login.password')}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('auth:login.submit')}
            </Button>
          </Form.Item>
        </Form>
        
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('common:app.description')}
          </Text>
          <LanguageSwitch type="button" />
        </Space>
      </Card>
    </div>
  )
}
