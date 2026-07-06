import { BasePage } from '../../../pages/BasePage';
import { BASE_URL } from '../../../config/config';

export interface LopHocItem {
  name: string;
  url: string;
}

/**
 * Page Object — Quản lý lớp học (1.2).
 * URL thực tế redirect: /doi-tac/{username}/danh-sach-nhom#menu-danh-sach-lop-hoc
 */
export class LopHocPage extends BasePage {
  static readonly LIST_URL = `${BASE_URL}/olm-url?key=danh-sach-lop-hoc`;
  static readonly BTN_THEM_LOP = "button:has-text('Thêm lớp học')";
  static readonly INPUT_TIM_KIEM = "input[placeholder*='Tìm kiếm nhanh']";
  static readonly CLASS_ROW =
    'table tbody tr, .list-group-item, [data-id-group], a[href*="/lop/."]';

  async open(): Promise<this> {
    await this.navigateTo(LopHocPage.LIST_URL);
    return this;
  }

  isPageLoaded(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('danh-sach-nhom') || url.includes('danh-sach-lop-hoc');
  }

  async hasAddClassButton(): Promise<boolean> {
    return (await this.findVisible([LopHocPage.BTN_THEM_LOP], 8)) !== null;
  }

  async clickAddClass(): Promise<this> {
    const btn = await this.findVisible([LopHocPage.BTN_THEM_LOP], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  /** Danh sách link lớp học (href chứa /lop/.) */
  async getClassLinks(): Promise<LopHocItem[]> {
    const links = await this.page.locator('a[href*="/lop/."]').all();
    const items: LopHocItem[] = [];
    const seen = new Set<string>();

    for (const link of links) {
      const href = (await link.getAttribute('href')) ?? '';
      const name = ((await link.textContent()) ?? '').trim();
      if (!href || !name || seen.has(href)) continue;
      seen.add(href);
      items.push({
        name,
        url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
      });
    }
    return items;
  }

  async searchClass(keyword: string): Promise<this> {
    const input = await this.findVisible([LopHocPage.INPUT_TIM_KIEM], 5);
    if (input) {
      await input.fill(keyword);
      await this.page.waitForTimeout(800);
    }
    return this;
  }
}
