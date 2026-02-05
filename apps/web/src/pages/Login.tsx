import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import LanguageSwitch from '../components/LanguageSwitch'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useTranslation(['auth', 'common'])

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      await login(values.username, values.password)
      message.success(t('common:message.success'))
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.message || t('auth:error.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card 
        title={t('common:app.name')} 
        style={{ width: 400 }}
        extra={<LanguageSwitch type="button" />}
      >
        <div style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
          {t('auth:login.subtitle')}
        </div>
        <Form onFinish={handleSubmit}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('auth:login.usernamePlaceholder') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth:login.username')}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth:login.passwordPlaceholder') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth:login.password')}
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('auth:login.submit')}
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          {t('common:app.description')}
        </div>
      </Card>
    </div>
  )
}
