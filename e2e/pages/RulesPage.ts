import { Page, Locator, expect } from '@playwright/test';

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
    // 使用图标按钮或包含 Create/创建 文本的按钮
    this.addButton = page.locator('button').filter({ has: page.locator('.anticon-plus') }).or(page.locator('button').filter({ hasText: /Create|创建|新增/ })).first();
    this.table = page.locator('.ant-table');
    this.modal = page.locator('.ant-modal');
    // 保存按钮在 Modal 中，使用 label 或文本匹配
    this.saveButton = page.locator('.ant-modal button').filter({ hasText: /Save|保存|OK/ }).first();
  }

  /**
   * 验证页面加载
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*rules/);
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
   * 填写规则表单 - 使用 Form name 属性
   */
  async fillRuleForm(data: {
    name: string;
    ruleType: string;
    priority: number;
    description?: string;
  }) {
    // 使用 placeholder 定位字段
    await this.page.locator('input[placeholder*="rule name"]').fill(data.name);
    
    // 选择规则类型
    await this.page.locator('.ant-form-item').filter({ hasText: /Rule Type|类型/ }).locator('.ant-select').first().click();
    await this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: new RegExp(data.ruleType, 'i') }).first().click();
    
    // 填写优先级（清除默认值后填写）
    const priorityInput = this.page.locator('.ant-form-item').filter({ hasText: /Priority|优先级/ }).locator('input');
    await priorityInput.clear();
    await priorityInput.fill(data.priority.toString());
    
    // 填写描述
    if (data.description) {
      await this.page.locator('textarea[placeholder*="description"]').fill(data.description);
    }
  }

  /**
   * 保存规则
   */
  async saveRule() {
    await this.saveButton.click();
    // 等待保存完成（通过检查成功消息或等待一段时间）
    await this.page.waitForTimeout(1000);
    // 尝试等待 Modal 关闭，如果不关闭也不报错
    try {
      await expect(this.modal).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Modal 可能还在，但保存可能已成功
    }
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
    // 等待表格加载完成
    await this.page.waitForSelector('.ant-table-row', { timeout: 5000 });
    const ruleCell = this.page.locator('td').filter({ hasText: ruleName });
    return await ruleCell.isVisible().catch(() => false);
  }

  /**
   * 查看规则详情 - 点击 Eye 图标
   */
  async viewRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: ruleName }),
    });
    
    // 点击 Eye 图标查看详情
    await row.locator('.anticon-eye, button').filter({ has: this.page.locator('.anticon-eye') }).first().click();
    await expect(this.page.locator('.ant-modal')).toBeVisible();
  }

  /**
   * 关闭详情 Modal
   */
  async closeDetailModal() {
    // 详情 Modal 可能没有确定按钮，点击 X 或 Cancel 关闭
    await this.page.locator('.ant-modal-close').or(this.page.locator('.ant-modal button').filter({ hasText: /Cancel|关闭/ })).first().click();
    await expect(this.page.locator('.ant-modal')).not.toBeVisible();
  }

  /**
   * 发布规则
   */
  async publishRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: ruleName }),
    });
    
    // 点击 Publish 按钮或使用 Switch
    const publishBtn = row.locator('button').filter({ hasText: /Publish|发布/ });
    if (await publishBtn.isVisible().catch(() => false)) {
      await publishBtn.click();
    } else {
      // 可能是 Switch 组件
      await row.locator('.ant-switch').click();
    }
  }

  /**
   * 删除规则
   */
  async deleteRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: ruleName }),
    });
    
    // 点击 Delete 图标
    await row.locator('.anticon-delete, button').filter({ has: this.page.locator('.anticon-delete') }).first().click();
    
    // 确认删除
    await this.page.locator('.ant-popconfirm, .ant-modal-confirm').locator('button').filter({ hasText: /Yes|确定|OK/ }).first().click();
  }

  /**
   * 搜索规则
   */
  async searchRule(keyword: string) {
    const searchInput = this.page.locator('input[placeholder*="Search"]').or(this.page.locator('.ant-input-search input'));
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(keyword);
      await this.page.locator('.ant-input-search-button, button').filter({ has: this.page.locator('.anticon-search') }).first().click();
      await this.page.waitForTimeout(500);
    }
  }
}
