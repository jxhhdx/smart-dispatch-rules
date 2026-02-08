# Playwright E2E 测试

本项目使用 **Playwright** 进行前端自动化测试。

## 📁 目录结构

```
e2e/
├── tests/                  # 测试用例
│   ├── login.spec.ts      # 登录测试
│   ├── dashboard.spec.ts  # Dashboard 测试
│   ├── users.spec.ts      # 用户管理测试
│   ├── rules.spec.ts      # 规则管理测试
│   └── navigation.spec.ts # 导航流程测试
├── pages/                 # Page Object 模式
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── UsersPage.ts
│   └── RulesPage.ts
├── utils/                 # 工具函数
│   └── test-data.ts
├── fixtures/              # 测试夹具
│   └── auth.fixture.ts
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Playwright
npm install

# 安装浏览器（只需执行一次）
npm run playwright:install:browsers
```

### 2. 运行测试

```bash
# 运行所有测试（无头模式）
npm run test:e2e:ui

# 运行测试（有界面模式）
npm run test:e2e:ui:headed

# 调试模式
npm run test:e2e:ui:debug

# 查看测试报告
npm run test:e2e:ui:report
```

### 3. 运行特定测试

```bash
# 只运行登录测试
npx playwright test login.spec.ts

# 只运行 Dashboard 测试
npx playwright test dashboard.spec.ts

# 在特定浏览器中运行
npx playwright test --project=chromium
```

## 📝 测试覆盖

### 登录功能
- ✅ 正确凭据登录
- ❌ 错误密码登录失败
- ❌ 不存在用户名登录失败
- ❌ 空表单验证
- 👁️ 密码显示/隐藏
- 🔄 保持登录状态

### Dashboard
- 📊 统计卡片显示
- 🧭 左侧菜单导航
- 🌐 语言切换
- 📱 响应式布局
- 👤 用户菜单
- 🚪 登出功能

### 用户管理
- ✅ 创建用户
- ❌ 重复用户名验证
- 🔍 搜索用户
- ✏️ 编辑用户
- 🗑️ 删除用户
- 📄 分页功能
- 📊 表格排序

### 规则管理
- ✅ 创建规则
- ✅ 多种类型规则
- 👁️ 查看详情
- 🚀 发布规则
- ✏️ 编辑规则
- 🗑️ 删除规则
- 🔍 类型筛选

### 全局功能
- 🔄 完整业务流程
- 🔙 浏览器后退
- ⏱️ 页面性能
- 📱 移动端响应式
- 🔒 权限控制

## 🛠️ 配置

### 环境变量

在 `.env` 或 `playwright.config.ts` 中配置：

```typescript
BASE_URL=http://localhost:3000
```

### 浏览器配置

默认测试以下浏览器：
- Chromium (Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

## 📸 截图和录屏

测试失败时自动：
- 截图保存到 `test-results/`
- 录屏保存到 `test-results/`

手动截图：
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

## 🔧 开发指南

### 添加新测试

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('描述测试场景', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  // ... 测试步骤
});
```

### 使用已登录状态

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('使用已登录状态', async ({ loggedInPage }) => {
  const { page, dashboard } = loggedInPage;
  // 已经登录，直接使用
});
```

### 创建 Page Object

```typescript
export class NewPage {
  readonly page: Page;
  readonly someButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someButton = page.locator('text=Click');
  }

  async doSomething() {
    await this.someButton.click();
  }
}
```

## 📊 报告

测试报告包含：
- 测试通过率
- 执行时间
- 截图对比
- 录屏回放
- 追踪日志

## 🐛 调试

### 使用 Playwright Inspector

```bash
npx playwright test --debug
```

### 逐步执行

```bash
npx playwright test --headed --slowmo 1000
```

### 查看浏览器控制台

```typescript
page.on('console', msg => console.log(msg.text()));
```

## 📚 参考

- [Playwright 官方文档](https://playwright.dev/)
- [最佳实践](https://playwright.dev/docs/best-practices)
- [API 参考](https://playwright.dev/docs/api/class-page)
