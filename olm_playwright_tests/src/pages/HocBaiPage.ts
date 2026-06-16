import { HOC_BAI_URL, BASE_URL } from '../config/config';
import { BasePage } from './BasePage';

export class HocBaiPage extends BasePage {
  static readonly URL = HOC_BAI_URL;

  static readonly SIDEBAR_GRADE_LINKS = "a[href*='/lop-']";
  static readonly SECTION_TIEU_HOC =
    "xpath=//h3[contains(text(),'Tiểu học')] | //strong[contains(text(),'Tiểu học')]";
  static readonly SECTION_THCS =
    "xpath=//h3[contains(text(),'THCS')] | //strong[contains(text(),'THCS')]";
  static readonly SECTION_THPT =
    "xpath=//h3[contains(text(),'THPT')] | //strong[contains(text(),'THPT')]";
  static readonly POPUP_VIP = '.modal.show, .popup-vip';
  static readonly POPUP_CLOSE_BTN = '.modal .close, .modal .btn-close';

  async open(): Promise<this> {
    await this.navigateTo(HocBaiPage.URL);
    return this;
  }

  async getGradeLinks(): Promise<Array<{ text: string; url: string }>> {
    const elements = await this.findElements(HocBaiPage.SIDEBAR_GRADE_LINKS);
    const links: Array<{ text: string; url: string }> = [];
    for (const el of elements) {
      const href = (await el.getAttribute('href')) ?? '';
      const text = ((await el.textContent()) ?? '').trim();
      if (href && text) links.push({ text, url: href });
    }
    return links;
  }

  async navigateToGrade(grade: number): Promise<this> {
    await this.navigateTo(`${BASE_URL}/lop-${grade}`);
    return this;
  }

  async closePopupIfPresent(): Promise<this> {
    const closeBtn = await this.findVisible([HocBaiPage.POPUP_CLOSE_BTN], 3);
    if (closeBtn) await this.jsClick(closeBtn);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('hoc-bai');
  }

  async isSectionVisible(section: 'tieu_hoc' | 'thcs' | 'thpt'): Promise<boolean> {
    const selectorMap = {
      tieu_hoc: HocBaiPage.SECTION_TIEU_HOC,
      thcs: HocBaiPage.SECTION_THCS,
      thpt: HocBaiPage.SECTION_THPT,
    };
    const sel = selectorMap[section];
    if (!sel) return false;
    return (await this.findVisible([sel], 5)) !== null;
  }
}
