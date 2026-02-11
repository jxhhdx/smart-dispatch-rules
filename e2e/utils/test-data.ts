/**
 * Playwright 测试数据
 */

export const TestData = {
  /**
   * 登录凭据
   */
  credentials: {
    admin: {
      username: 'admin',
      password: 'admin123',
    },
    invalid: {
      username: 'invaliduser',
      password: 'wrongpassword',
    },
  },

  /**
   * 测试用户数据
   */
  users: {
    newUser: {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!',
      realName: '测试用户',
    },
  },

  /**
   * 测试规则数据
   */
  rules: {
    newRule: {
      name: `规则_${Date.now()}`,
      ruleType: 'distance',
      priority: 50,
      description: '自动创建的测试规则',
    },
  },

  /**
   * 页面标题
   */
  pageTitles: {
    login: 'Login',
    dashboard: 'Dashboard',
    users: 'User Management',
    roles: 'Role Management',
    rules: 'Rule Management',
    logs: 'System Logs',
  },

  /**
   * 选择器
   */
  selectors: {
    login: {
      usernameInput: 'input[type="text"]',
      passwordInput: 'input[type="password"]',
      submitButton: 'button[type="submit"]',
      errorMessage: '.ant-form-item-explain-error',
    },
    menu: {
      dashboard: 'text=Dashboard',
      users: 'text=Users',
      roles: 'text=Roles',
      rules: 'text=Rules',
      logs: 'text=Logs',
      logout: 'text=Logout',
    },
    common: {
      addButton: 'button:has-text("Add")',
      saveButton: 'button:has-text("Save")',
      deleteButton: 'button:has-text("Delete")',
      confirmButton: '.ant-popconfirm-buttons button:has-text("Yes")',
      tableRow: '.ant-table-row',
      modal: '.ant-modal',
      notification: '.ant-notification-notice',
    },
  },
};

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 生成随机邮箱
 */
export function generateRandomEmail(): string {
  return `test_${generateRandomString()}@example.com`;
}

/**
 * 生成随机手机号
 */
export function generateRandomPhone(): string {
  return `1${Math.floor(Math.random() * 9 + 1)}${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
}

/**
 * 生成随机日期范围
 */
export function generateDateRange(days: number = 7): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * 等待指定时间
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
