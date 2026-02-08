import { Page, Locator, expect } from '@playwright/test';
import { TestData } from '../utils/test-data';

/**
 * Dashboard 页面对象
 */
export class DashboardPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Dashboard 标题是 h4 级别，使用 text 内容匹配
    // Dashboard 标题是小写的 'dashboard'
    this.dashboardTitle = page.locator('h4, .ant-typography').filter({ hasText: /dashboard/i });
    // 用户菜单按钮（包含 user 图标和管理员文字）
    this.userMenu = page.locator('.ant-layout-header').getByText(/管理员|admin/).first();
    // 登出按钮在下拉菜单中
    this.logoutButton = page.getByRole('menuitem', { name: /Logout|登出/ });
  }

  /**
   * 验证 Dashboard 页面加载
   */
  async expectLoaded() {
    // Dashboard 可能是根路径 / 或 /dashboard
    await expect(this.page).toHaveURL(/.*dashboard|\/$/);
    await expect(this.dashboardTitle).toBeVisible();
  }

  /**
   * 获取统计卡片数量
   */
  async getStatCardCount(): Promise<number> {
    return await this.page.locator('.ant-statistic').count();
  }

  /**
   * 点击左侧菜单
   */
  async clickMenu(menuName: string) {
    await this.page.locator(`text=${menuName}`).first().click();
  }

  /**
   * 导航到用户管理
   */
  async navigateToUsers() {
    await this.clickMenu('systemUsers');
    await expect(this.page).toHaveURL(/.*users/);
  }

  /**
   * 导航到规则管理
   */
  async navigateToRules() {
    await this.clickMenu('rules');
    await expect(this.page).toHaveURL(/.*rules/);
  }

  /**
   * 导航到角色管理
   */
  async navigateToRoles() {
    await this.clickMenu('systemRoles');
    await expect(this.page).toHaveURL(/.*roles/);
  }

  /**
   * 导航到系统日志
   */
  async navigateToLogs() {
    await this.clickMenu('systemLogs');
    await expect(this.page).toHaveURL(/.*logs/);
  }

  /**
   * 执行登出
   */
  async logout() {
    await this.userMenu.click();
    // 等待下拉菜单出现
    await this.logoutButton.waitFor({ state: 'visible' });
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/.*login/);
  }

  /**
   * 截图保存
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `./e2e/screenshots/${name}.png` });
  }
}
