import { Row, Col, Card, Statistic } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={12}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="规则总数"
              value={8}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="角色数"
              value={3}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发布规则"
              value={5}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="系统公告">
            <p>欢迎使用智能派单规则管理系统！</p>
            <p>本系统用于管理外卖配送场景下的派单策略规则。</p>
            <p>技术栈：React + NestJS + PostgreSQL</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="快速开始">
            <ul>
              <li>在「规则管理」中创建和配置派单规则</li>
              <li>在「用户管理」中管理系统用户</li>
              <li>在「角色管理」中配置权限角色</li>
              <li>在「操作日志」中查看系统操作记录</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
