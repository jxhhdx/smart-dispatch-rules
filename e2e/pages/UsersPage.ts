import { Page, Locator, expect } from '@playwright/test';
import { TestData } from '../utils/test-data';

/**
 * 用户管理页面对象
 */
export class UsersPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly modal: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.locator(TestData.selectors.common.addButton);
    this.table = page.locator('.ant-table');
    this.modal = page.locator(TestData.selectors.common.modal);
    this.saveButton = page.locator(TestData.selectors.common.saveButton);
  }

  /**
   * 验证页面加载
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*users/);
    await expect(this.page.locator('h2:has-text("Users")')).toBeVisible();
  }

  /**
   * 点击添加按钮
   */
  async clickAdd() {
    await this.addButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * 填写用户表单
   */
  async fillUserForm(data: {
    username: string;
    email: string;
    password: string;
    realName?: string;
  }) {
    await this.page.locator('input#username').fill(data.username);
    await this.page.locator('input#email').fill(data.email);
    await this.page.locator('input#password').fill(data.password);
    
    if (data.realName) {
      await this.page.locator('input#realName').fill(data.realName);
    }
  }

  /**
   * 选择角色
   */
  async selectRole(roleName: string) {
    await this.page.locator('.ant-select').first().click();
    await this.page.locator(`.ant-select-item:has-text("${roleName}")`).click();
  }

  /**
   * 保存用户
   */
  async saveUser() {
    await this.saveButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  /**
   * 创建新用户（完整流程）
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string;
    realName?: string;
    roleName?: string;
  }) {
    await this.clickAdd();
    await this.fillUserForm(data);
    if (data.roleName) {
      await this.selectRole(data.roleName);
    }
    await this.saveUser();
  }

  /**
   * 在表格中搜索用户
   */
  async searchUser(username: string) {
    const searchInput = this.page.locator('.ant-input-search input');
    await searchInput.fill(username);
    await this.page.locator('.ant-input-search-button').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查表格中是否有指定用户
   */
  async hasUser(username: string): Promise<boolean> {
    const userCell = this.page.locator(`text=${username}`);
    return await userCell.isVisible().catch(() => false);
  }

  /**
   * 删除用户
   */
  async deleteUser(username: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator(`text=${username}`),
    });
    
    await row.locator(TestData.selectors.common.deleteButton).click();
    await this.page.locator(TestData.selectors.common.confirmButton).click();
  }

  /**
   * 获取表格行数
   */
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('.ant-table-row').count();
  }
}
