import { Page, Locator, expect } from '@playwright/test';

/**
 * 语言切换页面对象
 * 封装语言切换相关的所有操作
 */
export class LanguagePage {
  readonly page: Page;
  readonly languageDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    // 语言切换器 - 在 Header 中，使用 GlobalOutlined 图标
    this.languageDropdown = page.locator('.ant-layout-header').locator('button').filter({
      has: page.locator('[data-icon="global"]'),
    });
  }

  /**
   * 打开语言选择下拉菜单
   */
  async openLanguageMenu() {
    await this.languageDropdown.waitFor({ state: 'visible' });
    await this.languageDropdown.click();
    // 等待下拉菜单出现
    await this.page.locator('.ant-dropdown-menu').waitFor({ state: 'visible' });
  }

  /**
   * 选择指定语言
   * @param language - 语言代码或显示文本
   */
  async selectLanguage(language: string) {
    await this.openLanguageMenu();
    
    // 支持下拉菜单中的语言选项
    const languageOption = this.page.locator('.ant-dropdown-menu-item').filter({
      hasText: language,
    });
    
    await languageOption.waitFor({ state: 'visible' });
    await languageOption.click();
    
    // 等待页面刷新完成
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 切换到中文
   */
  async switchToChinese() {
    await this.selectLanguage(/简体中文|中文|🇨🇳/);
  }

  /**
   * 切换到英文
   */
  async switchToEnglish() {
    await this.selectLanguage(/English|🇺🇸/);
  }

  /**
   * 切换到日文
   */
  async switchToJapanese() {
    await this.selectLanguage(/日本語|🇯🇵/);
  }

  /**
   * 切换到韩文
   */
  async switchToKorean() {
    await this.selectLanguage(/한국어|🇰🇷/);
  }

  /**
   * 获取当前显示的语言
   */
  async getCurrentLanguage(): Promise<string> {
    const text = await this.languageDropdown.textContent();
    return text?.trim() || '';
  }

  /**
   * 验证语言切换成功 - 通过检查特定文本
   * @param expectedText - 期望看到的文本
   */
  async expectLanguageChanged(expectedText: string) {
    await expect(this.page.locator('body')).toContainText(expectedText);
  }

  /**
   * 验证菜单已切换为中文
   */
  async expectChineseMenu() {
    // 检查左侧菜单是否显示中文
    await expect(this.page.locator('.ant-menu')).toContainText('仪表盘');
    await expect(this.page.locator('.ant-menu')).toContainText('派单规则');
    await expect(this.page.locator('.ant-menu')).toContainText('系统用户');
  }

  /**
   * 验证菜单已切换为英文
   */
  async expectEnglishMenu() {
    // 检查左侧菜单是否显示英文
    await expect(this.page.locator('.ant-menu')).toContainText(/Dashboard/i);
    await expect(this.page.locator('.ant-menu')).toContainText(/Rules/i);
    await expect(this.page.locator('.ant-menu')).toContainText(/Users/i);
  }

  /**
   * 验证页面标题已切换
   */
  async expectPageTitle(language: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR') {
    const titles: Record<string, RegExp> = {
      'zh-CN': /仪表盘|智能派单/,
      'en-US': /Dashboard|Smart Dispatch/,
      'ja-JP': /ダッシュボード|スマート派遣/,
      'ko-KR': /대시보드|스마트 배차/,
    };
    
    await expect(this.page).toHaveTitle(titles[language]);
  }
}
