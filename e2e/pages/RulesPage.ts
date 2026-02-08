import { Page, Locator, expect } from '@playwright/test';
import { TestData } from '../utils/test-data';

/**
 * 规则管理页面对象
 */
export class RulesPage {
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
    await expect(this.page).toHaveURL(/.*rules/);
    // 页面标题可能是 "Rules" 或 "Rule Management"
    await expect(this.page.locator('text=Rules').first()).toBeVisible();
  }

  /**
   * 点击添加按钮
   */
  async clickAdd() {
    await this.addButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * 填写规则表单
   */
  async fillRuleForm(data: {
    name: string;
    ruleType: string;
    priority: number;
    description?: string;
  }) {
    await this.page.locator('input#name').fill(data.name);
    
    // 选择规则类型
    await this.page.locator('input#ruleType').click();
    await this.page.locator(`.ant-select-item:has-text("${data.ruleType}")`).click();
    
    // 填写优先级
    await this.page.locator('input#priority').fill(data.priority.toString());
    
    // 填写描述
    if (data.description) {
      await this.page.locator('textarea#description').fill(data.description);
    }
  }

  /**
   * 保存规则
   */
  async saveRule() {
    await this.saveButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  /**
   * 创建新规则（完整流程）
   */
  async createRule(data: {
    name: string;
    ruleType: string;
    priority: number;
    description?: string;
  }) {
    await this.clickAdd();
    await this.fillRuleForm(data);
    await this.saveRule();
  }

  /**
   * 检查表格中是否有指定规则
   */
  async hasRule(ruleName: string): Promise<boolean> {
    const ruleCell = this.page.locator(`text=${ruleName}`);
    return await ruleCell.isVisible().catch(() => false);
  }

  /**
   * 查看规则详情
   */
  async viewRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator(`text=${ruleName}`),
    });
    
    await row.locator('button:has-text("View")').click();
    await expect(this.page.locator('.ant-drawer')).toBeVisible();
  }

  /**
   * 关闭详情抽屉
   */
  async closeDetailDrawer() {
    await this.page.locator('.ant-drawer-close').click();
    await expect(this.page.locator('.ant-drawer')).not.toBeVisible();
  }

  /**
   * 发布规则
   */
  async publishRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator(`text=${ruleName}`),
    });
    
    await row.locator('button:has-text("Publish")').click();
    await this.page.locator(TestData.selectors.common.confirmButton).click();
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator(`text=${ruleName}`),
    });
    
    await row.locator(TestData.selectors.common.deleteButton).click();
    await this.page.locator(TestData.selectors.common.confirmButton).click();
  }
}
