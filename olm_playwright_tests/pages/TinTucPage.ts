import { HOC_TAP_URL, THONG_BAO_NEWS_URL, TIN_TUC_URL } from '../config/config';
import { BasePage } from './BasePage';

export class TinTucPage extends BasePage {
  static readonly URL = TIN_TUC_URL;
  static readonly HOC_TAP_URL = HOC_TAP_URL;
  static readonly THONG_BAO_URL = THONG_BAO_NEWS_URL;

  // -------------------------------------------------------------------------
  // Selectors theo DOM thực tế của /thongtin và /chu-de-bai-viet/*
  // -------------------------------------------------------------------------

  // Hero article: div.mb-3.shadow-sm.p-3 chứa div.media.mb-2 với ảnh width=275
  // Phân biệt với section articles (ảnh width=120 nằm trong div.shadow-sm.p-3 không có mb-3)
  static readonly HERO_CONTAINER = 'div.mb-3.shadow-sm.p-3';
  static readonly HERO_MEDIA = 'div.mb-3.shadow-sm.p-3 div.media.mb-2';

  // Articles trong các section: div.shadow-sm div.media.mb-3
  static readonly SECTION_ARTICLE = 'div.shadow-sm.p-3 div.media.mb-3';

  // Tất cả article media (cả hero lẫn section) — dùng để đếm chung
  static readonly ANY_ARTICLE_MEDIA = 'div.media.mb-2, div.media.mb-3';

  // Category nav list: ul.shadow-sm li h4 a
  static readonly CATEGORY_NAV_ITEM = 'ul.shadow-sm.p-3 li h4 a';

  // Link bài viết
  static readonly ARTICLE_LINK = "a[href*='/bai-viet/']";

  // Article page
  static readonly ARTICLE_TITLE = 'h1, .article-title';

  async open(): Promise<this> {
    await this.navigateTo(TinTucPage.URL);
    await this.page.evaluate(() => window.scrollTo(0, 300));
    await this.page.waitForTimeout(800);
    return this;
  }

  async openHocTap(): Promise<this> {
    await this.navigateTo(TinTucPage.HOC_TAP_URL);
    await this.page.evaluate(() => window.scrollTo(0, 300));
    await this.page.waitForTimeout(800);
    return this;
  }

  async openThongBao(): Promise<this> {
    await this.navigateTo(TinTucPage.THONG_BAO_URL);
    await this.page.evaluate(() => window.scrollTo(0, 300));
    await this.page.waitForTimeout(800);
    return this;
  }

  isPageLoaded(): boolean {
    return (
      this.getCurrentUrl().includes('thongtin') ||
      this.getCurrentUrl().includes('chu-de-bai-viet') ||
      this.getCurrentUrl().includes('bai-viet')
    );
  }

  /**
   * Đếm bài viết hiển thị trên trang.
   * Ưu tiên đếm div.media.mb-3 (section articles) vì xuất hiện nhiều nhất.
   * Fallback sang div.media.mb-2 (hero) nếu không có section articles.
   */
  async getArticleCount(): Promise<number> {
    // Chờ ít nhất 1 media element xuất hiện
    try {
      await this.page
        .locator(TinTucPage.ANY_ARTICLE_MEDIA)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return 0;
    }

    const sectionCount = await this.page
      .locator(TinTucPage.SECTION_ARTICLE)
      .count();

    if (sectionCount > 0) return sectionCount;

    // Fallback: hero items
    return this.page.locator(TinTucPage.HERO_MEDIA).count();
  }

  /**
   * Kiểm tra hero article (bài nổi bật đầu trang).
   * Hero là div.mb-3.shadow-sm.p-3 chứa media với ảnh width=275.
   */
  async hasHeroArticle(): Promise<boolean> {
    try {
      await this.page
        .locator(TinTucPage.HERO_CONTAINER)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });

      // Xác nhận bên trong có ảnh width=275 (hero ảnh lớn)
      const heroImg = this.page.locator(
        'div.mb-3.shadow-sm.p-3 img[width="275"]'
      );
      return (await heroImg.count()) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Lấy danh sách các chủ đề từ nav sidebar.
   * Selector: ul.shadow-sm li h4 a
   */
  async getCategoryNames(): Promise<string[]> {
    try {
      await this.page
        .locator(TinTucPage.CATEGORY_NAV_ITEM)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return [];
    }

    const items = await this.page.locator(TinTucPage.CATEGORY_NAV_ITEM).all();
    const names: string[] = [];
    for (const item of items) {
      const title = (await item.getAttribute('title')) ?? (await item.textContent()) ?? '';
      if (title.trim()) names.push(title.trim());
    }
    return names;
  }

  /**
   * Lấy bài viết đầu tiên trong một section cụ thể.
   * Tìm h2 chứa section name rồi lấy media.mb-3 tiếp theo.
   */
  async getFirstArticleInSection(sectionTitle: string): Promise<{ title: string; url: string } | null> {
    try {
      const sectionH2 = this.page.locator(
        `h2 a[title="${sectionTitle}"], h2 a:has-text("${sectionTitle}")`
      ).first();

      const sectionContainer = sectionH2.locator(
        'xpath=ancestor::div[1]/following-sibling::div[1]'
      );
      const firstMedia = sectionContainer.locator('div.media.mb-3').first();
      const a = firstMedia.locator('a.olm-text-link').first();
      const title = (await a.getAttribute('title')) ?? (await a.textContent()) ?? '';
      const url = (await a.getAttribute('href')) ?? '';
      return title && url ? { title: title.trim(), url } : null;
    } catch {
      return null;
    }
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