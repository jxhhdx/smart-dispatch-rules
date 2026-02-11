import { Page, Locator, expect } from '@playwright/test';

/**
 * 日志审计页面对象
 */
export class LogsPage {
  readonly page: Page;
  readonly operationTab: Locator;
  readonly loginTab: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('.ant-table');
    this.operationTab = page.locator('.ant-tabs-tab').filter({ hasText: /Operation|操作/ });
    this.loginTab = page.locator('.ant-tabs-tab').filter({ hasText: /Login|登录/ });
  }

  /**
   * 验证页面加载
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*logs/);
    await expect(this.page.locator('text=System Logs').first()).toBeVisible();
  }

  /**
   * 切换到操作日志
   */
  async switchToOperationLogs() {
    if (await this.operationTab.isVisible().catch(() => false)) {
      await this.operationTab.click();
    }
  }

  /**
   * 切换到登录日志
   */
  async switchToLoginLogs() {
    if (await this.loginTab.isVisible().catch(() => false)) {
      await this.loginTab.click();
    }
  }

  /**
   * 搜索日志
   */
  async searchLogs(keyword: string) {
    const searchInput = this.page.locator('input[placeholder*="Search"]').or(this.page.locator('.ant-input-search input'));
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(keyword);
      await this.page.locator('.ant-input-search-button, button').filter({ has: this.page.locator('.anticon-search') }).first().click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 按模块筛选
   */
  async filterByModule(module: string) {
    const moduleSelect = this.page.locator('.ant-form-item').filter({ hasText: /Module|模块/ }).locator('.ant-select').first();
    if (await moduleSelect.isVisible().catch(() => false)) {
      await moduleSelect.click();
      await this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: module }).first().click();
    }
  }

  /**
   * 按动作筛选
   */
  async filterByAction(action: string) {
    const actionSelect = this.page.locator('.ant-form-item').filter({ hasText: /Action|动作/ }).locator('.ant-select').first();
    if (await actionSelect.isVisible().catch(() => false)) {
      await actionSelect.click();
      await this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: action }).first().click();
    }
  }

  /**
   * 按时间范围筛选
   */
  async filterByDateRange(startDate: string, endDate: string) {
    const dateInputs = this.page.locator('input[placeholder*="Date"]').or(this.page.locator('.ant-picker-input input'));
    const count = await dateInputs.count();
    if (count >= 2) {
      await dateInputs.nth(0).fill(startDate);
      await dateInputs.nth(1).fill(endDate);
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * 获取表格行数
   */
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('.ant-table-row').count();
  }

  /**
   * 获取表格数据
   */
  async getTableData(): Promise<string[]> {
    return await this.page.locator('.ant-table-row td:first-child').allTextContents();
  }

  /**
   * 检查是否有日志数据
   */
  async hasLogData(): Promise<boolean> {
    const rows = await this.getTableRowCount();
    return rows > 0;
  }

  /**
   * 查看日志详情
   */
  async viewLogDetail(index: number = 0) {
    const viewButtons = this.page.locator('.anticon-eye, button').filter({ has: this.page.locator('.anticon-eye') });
    if (await viewButtons.nth(index).isVisible().catch(() => false)) {
      await viewButtons.nth(index).click();
      await expect(this.page.locator('.ant-modal')).toBeVisible();
    }
  }

  /**
   * 关闭详情弹窗
   */
  async closeDetailModal() {
    await this.page.locator('.ant-modal-close').or(this.page.locator('.ant-modal button').filter({ hasText: /Cancel|关闭/ })).first().click();
  }
}
