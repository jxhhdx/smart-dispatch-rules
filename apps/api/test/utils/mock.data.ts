import * as bcrypt from 'bcryptjs';

/**
 * 测试用的 Mock 数据
 */
export const MockData = {
  /**
   * 测试用户
   */
  users: {
    admin: {
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      get passwordHash() {
        return bcrypt.hashSync(this.password, 10);
      },
    },
    operator: {
      username: 'operator',
      email: 'operator@test.com',
      password: 'operator123',
      get passwordHash() {
        return bcrypt.hashSync(this.password, 10);
      },
    },
    viewer: {
      username: 'viewer',
      email: 'viewer@test.com',
      password: 'viewer123',
      get passwordHash() {
        return bcrypt.hashSync(this.password, 10);
      },
    },
  },

  /**
   * 测试角色
   */
  roles: {
    superAdmin: {
      name: '超级管理员',
      code: 'super_admin',
      description: '系统所有权限',
    },
    operator: {
      name: '操作员',
      code: 'operator',
      description: '日常操作权限',
    },
    viewer: {
      name: '观察员',
      code: 'viewer',
      description: '只读权限',
    },
  },

  /**
   * 测试规则
   */
  rules: {
    distanceRule: {
      name: '就近分配规则',
      ruleType: 'distance',
      priority: 100,
      description: '优先分配给距离最近的骑手',
    },
    workloadRule: {
      name: '负载均衡规则',
      ruleType: 'workload',
      priority: 80,
      description: '根据骑手当前订单数分配',
    },
    ratingRule: {
      name: '评分优先规则',
      ruleType: 'rating',
      priority: 60,
      description: '优先分配给高评分骑手',
    },
  },

  /**
   * 测试权限
   */
  permissions: [
    { name: '系统配置', code: 'system:config', type: 'api' },
    { name: '查看系统日志', code: 'system:log:view', type: 'api' },
    { name: '创建用户', code: 'user:create', type: 'api' },
    { name: '编辑用户', code: 'user:update', type: 'api' },
    { name: '删除用户', code: 'user:delete', type: 'api' },
    { name: '查看用户', code: 'user:view', type: 'api' },
    { name: '创建角色', code: 'role:create', type: 'api' },
    { name: '编辑角色', code: 'role:update', type: 'api' },
    { name: '创建规则', code: 'rule:create', type: 'api' },
    { name: '编辑规则', code: 'rule:update', type: 'api' },
    { name: '发布规则', code: 'rule:publish', type: 'api' },
  ],
};

/**
 * 生成随机测试数据
 */
export function generateRandomUser() {
  const timestamp = Date.now();
  return {
    username: `user_${timestamp}`,
    email: `user_${timestamp}@test.com`,
    password: 'Test123!',
    passwordHash: bcrypt.hashSync('Test123!', 10),
  };
}

/**
 * 生成随机规则
 */
export function generateRandomRule() {
  const timestamp = Date.now();
  const ruleTypes = ['distance', 'workload', 'rating', 'urgency', 'vip'];
  const type = ruleTypes[Math.floor(Math.random() * ruleTypes.length)];
  
  return {
    name: `测试规则_${timestamp}`,
    ruleType: type,
    priority: Math.floor(Math.random() * 100),
    description: `自动生成的测试规则 ${timestamp}`,
  };
}
