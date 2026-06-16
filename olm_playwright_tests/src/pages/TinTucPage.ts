import { HOC_TAP_URL, THONG_BAO_NEWS_URL, TIN_TUC_URL } from '../config/config';
import { BasePage } from './BasePage';

export class TinTucPage extends BasePage {
  static readonly URL = TIN_TUC_URL;
  static readonly HOC_TAP_URL = HOC_TAP_URL;
  static readonly THONG_BAO_URL = THONG_BAO_NEWS_URL;

  static readonly HERO_ARTICLE = '.hero-article, .featured-article, .article-hero';
  static readonly ARTICLE_LIST = '.article-card, .article-item, .post-card';
  static readonly ARTICLE_LINK = "a[href*='/bai-viet/'], a[href*='/tin-tuc/']";
  static readonly SECTION_THONG_BAO = "a[href*='thong-bao']";
  static readonly SECTION_HOC_SINH = "a[href*='danh-cho-hoc-sinh']";
  static readonly SECTION_PHU_HUYNH = "a[href*='goc-danh-cho-phu-huynh']";
  static readonly BREADCRUMB = '.breadcrumb';
  static readonly ARTICLE_TITLE = 'h1, .article-title';
  static readonly ARTICLE_DATE = '.article-date, .post-date, time';

  async open(): Promise<this> {
    await this.navigateTo(TinTucPage.URL);
    return this;
  }

  async openHocTap(): Promise<this> {
    await this.navigateTo(TinTucPage.HOC_TAP_URL);
    return this;
  }

  async openThongBao(): Promise<this> {
    await this.navigateTo(TinTucPage.THONG_BAO_URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('thongtin');
  }

  async getArticleCount(): Promise<number> {
    return this.page.locator(TinTucPage.ARTICLE_LIST).count();
  }

  async hasHeroArticle(): Promise<boolean> {
    return (await this.findVisible([TinTucPage.HERO_ARTICLE], 5)) !== null;
  }

  async clickFirstArticle(): Promise<this> {
    const links = await this.page.locator(TinTucPage.ARTICLE_LINK).all();
    if (links.length > 0) await this.jsClick(links[0]);
    return this;
  }

  async getArticleTitle(): Promise<string> {
    const el = await this.findVisible([TinTucPage.ARTICLE_TITLE], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }
}
