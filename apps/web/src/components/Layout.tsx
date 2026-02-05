import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, theme } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth'
import LanguageSwitch from './LanguageSwitch'

const { Header, Sider, Content } = AntLayout

export default function Layout() {
  const [collapsed, _setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { t } = useTranslation(['menu', 'auth'])
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: t('menu:dashboard') },
    { key: '/rules', icon: <FileTextOutlined />, label: t('menu:rules') },
    { key: '/users', icon: <UserOutlined />, label: t('menu:systemUsers') },
    { key: '/roles', icon: <TeamOutlined />, label: t('menu:systemRoles') },
    { key: '/logs', icon: <FileSearchOutlined />, label: t('menu:systemLogs') },
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth:logout.title'),
      onClick: logout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: collapsed ? 14 : 18, margin: 0, color: '#1677ff' }}>
            {collapsed ? 'SDR' : t('menu:rules')}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 24, gap: 16 }}>
          <LanguageSwitch />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text">
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user?.realName || user?.username}
              <DownOutlined style={{ marginLeft: 8 }} />
            </Button>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
