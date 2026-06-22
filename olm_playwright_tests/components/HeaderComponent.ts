import type { Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { BASE_URL } from '../config/config';

/** Component tái sử dụng – header/navigation */
export class HeaderComponent extends BasePage {
  static readonly LOGO = 'a.logo, a[href="/"], header a img';
  static readonly NAV_HOC_BAI = "a[href*='/hoc-bai']";
  static readonly NAV_HOI_DAP = "a[href*='/hoi-dap']";
  static readonly NAV_CONTEST = "a[href*='/contestx']";
  static readonly NAV_THU_VIEN = "a[href*='/thu-vien-so']";
  static readonly SEARCH_INPUT = "input[type='search'], input[name='q'], .search-input";
  static readonly LOGIN_BTN = "a:has-text('Đăng nhập')";

  constructor(page: Page) {
    super(page);
  }

  async openHome(): Promise<this> {
    await this.navigateTo(BASE_URL);
    return this;
  }

  async clickLogo(): Promise<this> {
    const el = await this.findVisible([HeaderComponent.LOGO], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async search(keyword: string): Promise<this> {
    const input = await this.findVisible([HeaderComponent.SEARCH_INPUT], 5);
    if (input) {
      await input.fill(keyword);
      await input.press('Enter');
    }
    return this;
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return (await this.findVisible([HeaderComponent.LOGIN_BTN], 5)) !== null;
  }
}
