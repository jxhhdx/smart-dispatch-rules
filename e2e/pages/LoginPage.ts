import { Page, Locator, expect } from '@playwright/test';
import { TestData } from '../utils/test-data';

/**
 * 登录页面对象
 * 封装登录页面的所有操作
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator(TestData.selectors.login.usernameInput).first();
    this.passwordInput = page.locator(TestData.selectors.login.passwordInput);
    this.submitButton = page.locator(TestData.selectors.login.submitButton);
    this.errorMessage = page.locator(TestData.selectors.login.errorMessage);
  }

  /**
   * 访问登录页面
   */
  async goto() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/Login|登录/);
  }

  /**
   * 填写用户名
   */
  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  /**
   * 填写密码
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * 点击登录按钮
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * 执行完整登录流程
   */
  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * 使用管理员账号登录
   */
  async loginAsAdmin() {
    await this.login(
      TestData.credentials.admin.username,
      TestData.credentials.admin.password
    );
  }

  /**
   * 检查是否显示错误信息
   */
  async expectError() {
    await expect(this.errorMessage).toBeVisible();
  }

  /**
   * 检查是否登录成功（跳转到了 Dashboard）
   */
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/.*dashboard/);
    await expect(this.page.locator('text=Dashboard')).toBeVisible();
  }
}
