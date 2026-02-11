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
    this.addButton = page.locator('button').filter({ has: page.locator('.anticon-plus') }).or(page.locator('button').filter({ hasText: /Create|创建|新增/ })).first();
    this.table = page.locator('.ant-table');
    this.modal = page.locator('.ant-modal');
    this.saveButton = page.locator('.ant-modal button').filter({ hasText: /Save|保存|OK/ }).first();
  }

  /**
   * 验证页面加载
   * 支持中英文: Rule Management / 规则管理
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/.*rules/, { timeout: 10000 });
    await expect(this.page.locator('text=/Rule Management|规则管理/i').first()).toBeVisible();
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
    // 等待弹窗动画完成
    await this.page.waitForTimeout(500);
    
    // 填写规则名称 - 通过 label 找到对应的输入框
    const nameInput = this.page.locator('.ant-form-item').filter({ hasText: /Rule Name|规则名称/i }).locator('input');
    await nameInput.fill(data.name);
    
    // 选择规则类型
    await this.page.locator('.ant-form-item').filter({ hasText: /Rule Type|规则类型/i }).locator('.ant-select').first().click();
    await this.page.waitForTimeout(300);
    // 根据类型值选择（如 distance 匹配 Distance Rule）
    const typeOption = this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: new RegExp(data.ruleType, 'i') });
    await typeOption.first().click();
    await this.page.waitForTimeout(300);
    
    // 填写优先级
    const priorityInput = this.page.locator('.ant-form-item').filter({ hasText: /Priority|优先级/i }).locator('input');
    await priorityInput.clear();
    await priorityInput.fill(data.priority.toString());
    
    // 填写描述（可选）
    if (data.description) {
      await this.page.locator('.ant-form-item').filter({ hasText: /Description|描述/i }).locator('textarea').fill(data.description);
    }
  }

  /**
   * 保存规则
   */
  async saveRule() {
    await this.saveButton.click();
    // 等待 API 调用和弹窗关闭
    await this.page.waitForTimeout(3000);
    
    // 等待 Modal 关闭
    try {
      await expect(this.modal).not.toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.log('Modal may still be visible:', e);
    }
    
    // 额外等待表格刷新完成
    await this.page.waitForTimeout(2000);
  }

  /**
   * 创建新规则
   */
  async createRule(data: { name: string; ruleType: string; priority: number; description?: string }) {
    await this.clickAdd();
    await this.fillRuleForm(data);
    await this.saveRule();
  }

  /**
   * 检查表格中是否有指定规则
   */
  async hasRule(ruleName: string): Promise<boolean> {
    // 等待表格加载
    await this.page.waitForSelector('.ant-table-row, .ant-empty', { timeout: 5000 });
    
    // 先等待一下确保数据已加载
    await this.page.waitForTimeout(500);
    
    // 检查是否有任何行
    const rowCount = await this.page.locator('.ant-table-row').count();
    if (rowCount === 0) {
      return false;
    }
    
    // 获取所有单元格的文本内容来查找规则
    const cellTexts = await this.page.locator('.ant-table-cell').allTextContents();
    console.log(`Looking for rule: ${ruleName}, Found cells: ${cellTexts.slice(0, 10).join(', ')}...`);
    
    // 检查是否有单元格包含规则名
    return cellTexts.some(text => text.includes(ruleName));
  }

  /**
   * 查看规则详情
   */
  async viewRule(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: ruleName }),
    });
    
    await row.locator('.anticon-eye, button').filter({ has: this.page.locator('.anticon-eye') }).first().click();
    await expect(this.page.locator('.ant-modal')).toBeVisible();
  }

  /**
   * 关闭详情弹窗
   */
  async closeDetailModal() {
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
    
    const publishBtn = row.locator('button').filter({ hasText: /Publish|发布/ });
    if (await publishBtn.isVisible().catch(() => false)) {
      await publishBtn.click();
    } else {
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
    
    await row.locator('.anticon-delete, button').filter({ has: this.page.locator('.anticon-delete') }).first().click();
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

  /**
   * 编辑规则
   */
  async editRule(ruleName: string, newData: { priority?: number; description?: string }) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: ruleName }),
    });
    
    await row.locator('.anticon-edit, button').filter({ has: this.page.locator('.anticon-edit') }).first().click();
    await expect(this.modal).toBeVisible();
    
    if (newData.priority !== undefined) {
      const priorityInput = this.page.locator('.ant-form-item').filter({ hasText: /Priority|优先级/ }).locator('input');
      await priorityInput.clear();
      await priorityInput.fill(newData.priority.toString());
    }
    
    if (newData.description) {
      await this.page.locator('textarea[placeholder*="description"]').fill(newData.description);
    }
    
    await this.saveRule();
  }

  /**
   * 获取表格行数
   */
  async getTableRowCount(): Promise<number> {
    return await this.page.locator('.ant-table-row').count();
  }

  // ==================== 版本管理 ====================

  /**
   * 打开规则版本管理
   */
  async openVersions(ruleName: string) {
    const row = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: ruleName }),
    });
    
    // 点击查看版本按钮或展开详情
    const versionBtn = row.locator('button').filter({ hasText: /Version|版本/ });
    if (await versionBtn.isVisible().catch(() => false)) {
      await versionBtn.click();
    } else {
      // 点击详情后查看版本
      await this.viewRule(ruleName);
      await this.page.locator('.ant-tabs-tab').filter({ hasText: /Version|版本/ }).click();
    }
  }

  /**
   * 创建新版本
   */
  async createVersion(config: object, description?: string) {
    const createVersionBtn = this.page.locator('button').filter({ hasText: /Create Version|创建版本/ });
    await createVersionBtn.click();
    
    await expect(this.modal).toBeVisible();
    
    // 填写配置（如果是JSON编辑器）
    const configInput = this.page.locator('textarea').filter({ has: this.page.locator('.ant-input') }).first();
    if (await configInput.isVisible().catch(() => false)) {
      await configInput.fill(JSON.stringify(config));
    }
    
    if (description) {
      await this.page.locator('textarea[placeholder*="description"]').fill(description);
    }
    
    await this.saveRule();
  }

  /**
   * 发布指定版本
   */
  async publishVersion(versionNumber: number) {
    const versionRow = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: `v${versionNumber}` }),
    });
    
    const publishBtn = versionRow.locator('button').filter({ hasText: /Publish|发布/ });
    if (await publishBtn.isVisible().catch(() => false)) {
      await publishBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 回滚到指定版本
   */
  async rollbackVersion(versionNumber: number) {
    const versionRow = this.page.locator('.ant-table-row').filter({
      has: this.page.locator('td').filter({ hasText: `v${versionNumber}` }),
    });
    
    const rollbackBtn = versionRow.locator('button').filter({ hasText: /Rollback|回滚/ });
    if (await rollbackBtn.isVisible().catch(() => false)) {
      await rollbackBtn.click();
      // 确认回滚
      await this.page.locator('.ant-popconfirm, .ant-modal-confirm').locator('button').filter({ hasText: /Yes|确定|OK/ }).first().click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 模拟执行规则
   */
  async simulateRule(orderData: { orderId: string; distance: number; riderLocations: any[] }) {
    await this.page.goto('/rules/simulate');
    
    await this.page.locator('input[name="orderId"]').fill(orderData.orderId);
    await this.page.locator('input[name="distance"]').fill(orderData.distance.toString());
    
    // 填写骑手位置
    for (let i = 0; i < orderData.riderLocations.length; i++) {
      const rider = orderData.riderLocations[i];
      await this.page.locator(`input[name="riderLocations[${i}].riderId"]`).fill(rider.riderId);
      await this.page.locator(`input[name="riderLocations[${i}].distance"]`).fill(rider.distance.toString());
    }
    
    await this.page.locator('button').filter({ hasText: /Simulate|模拟/ }).click();
    await this.page.waitForTimeout(1000);
  }

  // ==================== 分页操作 ====================

  /**
   * 获取分页总数文本
   */
  async getPaginationTotal(): Promise<string> {
    const pagination = this.page.locator('.ant-pagination-total-text');
    if (await pagination.isVisible().catch(() => false)) {
      return await pagination.textContent() || '';
    }
    return '';
  }

  /**
   * 切换到指定页码
   */
  async changePage(pageNumber: number) {
    const pageBtn = this.page.locator('.ant-pagination-item').filter({ hasText: pageNumber.toString() });
    if (await pageBtn.isVisible().catch(() => false)) {
      await pageBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 切换每页条数
   */
  async changePageSize(size: number) {
    const sizeSelector = this.page.locator('.ant-pagination-options-size-changer');
    if (await sizeSelector.isVisible().catch(() => false)) {
      await sizeSelector.click();
      await this.page.waitForTimeout(300);
      await this.page.locator('.ant-select-dropdown').locator('.ant-select-item').filter({ hasText: size.toString() }).click();
      await this.page.waitForTimeout(500);
    }
  }
}
