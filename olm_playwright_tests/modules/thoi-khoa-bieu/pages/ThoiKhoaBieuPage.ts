import { BasePage } from '../../../pages/BasePage';

/**
 * Page Object — Xếp thời khóa biểu (1.8).
 * App TKB nằm trên subdomain riêng: https://tkb.olm.vn/
 */
export class ThoiKhoaBieuPage extends BasePage {
  static readonly TKB_URL = 'https://tkb.olm.vn/';
  static readonly PAGE_TITLE_KEYWORD = 'Thời khóa biểu';
  static readonly MAIN_CONTENT = 'main, #app, .tkb-container, body';

  async open(): Promise<this> {
    await this.navigateTo(ThoiKhoaBieuPage.TKB_URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('tkb.olm.vn');
  }

  async getPageTitleText(): Promise<string> {
    return (await this.page.title()) ?? '';
  }

  async hasMainContent(): Promise<boolean> {
    const el = await this.findVisible([ThoiKhoaBieuPage.MAIN_CONTENT], 10);
    return el !== null;
  }
}
