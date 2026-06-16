import { CUOC_THI_URL } from '../config/config';
import { BasePage } from './BasePage';

export class CuocThiPage extends BasePage {
  static readonly URL = CUOC_THI_URL;

  static readonly FEATURED_CONTEST = '.featured-contest, .hero-card';
  static readonly CONTEST_CARDS = '.contest-card, .card';
  static readonly CONTEST_LINK = "a[href*='/bai-viet/']";
  static readonly SECTION_TOAN_VUI = "xpath=//*[contains(text(),'Toán vui')]";
  static readonly SECTION_VAN_HAY = "xpath=//*[contains(text(),'Văn hay')]";
  static readonly SECTION_FUN_ENGLISH = "xpath=//*[contains(text(),'Fun English')]";

  async open(): Promise<this> {
    await this.navigateTo(CuocThiPage.URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('cuoc-thi');
  }

  async getContestCardCount(): Promise<number> {
    return this.page.locator(CuocThiPage.CONTEST_CARDS).count();
  }

  async hasFeaturedContest(): Promise<boolean> {
    return (await this.findVisible([CuocThiPage.FEATURED_CONTEST], 5)) !== null;
  }

  async clickFirstContest(): Promise<this> {
    const links = await this.page.locator(CuocThiPage.CONTEST_LINK).all();
    if (links.length > 0) await this.jsClick(links[0]);
    return this;
  }

  async isSectionVisible(
    section: 'toan_vui' | 'van_hay' | 'fun_english' | string
  ): Promise<boolean> {
    const mapping: Record<string, string> = {
      toan_vui: CuocThiPage.SECTION_TOAN_VUI,
      van_hay: CuocThiPage.SECTION_VAN_HAY,
      fun_english: CuocThiPage.SECTION_FUN_ENGLISH,
    };
    const selector = mapping[section];
    if (!selector) return false;
    return (await this.findVisible([selector], 5)) !== null;
  }
}
