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
import { useAuthStore } from '../stores/auth'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/rules', icon: <FileTextOutlined />, label: '规则管理' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/roles', icon: <TeamOutlined />, label: '角色管理' },
  { key: '/logs', icon: <FileSearchOutlined />, label: '操作日志' },
]

export default function Layout() {
  const [collapsed, _setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: collapsed ? 14 : 18, margin: 0, color: '#1677ff' }}>
            {collapsed ? 'SDR' : '智能派单规则'}
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
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 24 }}>
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
