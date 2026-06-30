import { HOC_TAP_URL, THONG_BAO_NEWS_URL, TIN_TUC_URL } from '../config/config';
import { BasePage } from './BasePage';

export class TinTucPage extends BasePage {
  static readonly URL = TIN_TUC_URL;
  static readonly HOC_TAP_URL = HOC_TAP_URL;
  static readonly THONG_BAO_URL = THONG_BAO_NEWS_URL;

  // =========================================================================
  // Selectors — khớp với DOM thực tế của /thongtin và /chu-de-bai-viet/*
  // =========================================================================

  // ── Hero (/thongtin) ──────────────────────────────────────────────────────
  // Hero container là div.mb-3.shadow-sm (phân biệt với section dùng div.shadow-sm.p-3.mb-4)
  // Bên trong có ảnh width="275" và div.media.mb-2
  static readonly HERO_CONTAINER    = 'div.mb-3.shadow-sm.p-3';
  static readonly HERO_MEDIA        = 'div.mb-3.shadow-sm.p-3 div.media.mb-2';
  static readonly HERO_IMG          = 'div.mb-3.shadow-sm.p-3 img[width="275"]';

  // ── Section articles (/thongtin và /chu-de-bai-viet/*) ───────────────────
  // Các bài viết trong section: div.shadow-sm.p-3 > div.media.mb-3
  static readonly SECTION_ARTICLE   = 'div.shadow-sm.p-3 div.media.mb-3';

  // Đếm chung khi chưa biết trang nào
  static readonly ANY_ARTICLE_MEDIA = 'div.media.mb-2, div.media.mb-3';

  // ── Category nav sidebar (/thongtin) ─────────────────────────────────────
  // ul.shadow-sm.p-3.mb-4.bg-white.rounded > li > h4 > a
  static readonly CATEGORY_NAV_ITEM = 'ul.shadow-sm.p-3.mb-4 li h4 a';

  // ── Article links ─────────────────────────────────────────────────────────
  // /thongtin    → href="/bai-viet/..."
  // /chu-de-bai-viet/hoc-tap → href="/tin-tuc/..."
  // Selector bắt cả hai dạng
  static readonly ARTICLE_LINK      = "a.olm-text-link[href*='/bai-viet/'], a.olm-text-link[href*='/tin-tuc/']";

  // ── Sidebar bài mới nhất / tin nổi bật (/thongtin) ───────────────────────
  // div.media.mb-3 bên trong div.sticky-top
  static readonly SIDEBAR_ARTICLE   = '.sticky-top div.media.mb-3';

  // ── Article detail ────────────────────────────────────────────────────────
  static readonly ARTICLE_TITLE     = 'h1, .article-title';

  // ── Pagination (blog học tập) ─────────────────────────────────────────────
  static readonly PAGINATION        = 'ul.pagination';
  static readonly PAGE_LINK         = 'ul.pagination .page-item a.page-link';
  static readonly ACTIVE_PAGE       = 'ul.pagination .page-item.active a.page-link';

  // =========================================================================
  // Navigation
  // =========================================================================

  async open(): Promise<this> {
    await this.navigateTo(TinTucPage.URL);
    await this.ensureSectionsLoaded();
    return this;
  }

  async openHocTap(): Promise<this> {
    await this.navigateTo(TinTucPage.HOC_TAP_URL);
    await this.ensureSectionsLoaded();
    return this;
  }

  async openThongBao(): Promise<this> {
    await this.navigateTo(TinTucPage.THONG_BAO_URL);
    await this.ensureSectionsLoaded();
    return this;
  }

  /**
   * Cuộn hết trang để kích hoạt lazy-load các section bài viết phía dưới
   * (vd: "Thông báo", "Khóa học hè", "Chuyển đổi số Giáo dục", "Thi THPT
   * 2026"…) — nếu chỉ cuộn nhẹ ban đầu, các section này chưa được render
   * nên mọi truy vấn h2.my-3 tương ứng đều không tìm thấy (timeout).
   * Sau khi cuộn hết để trigger load, cuộn lại lên một đoạn vừa phải để
   * giữ trạng thái ổn định cho các thao tác tiếp theo.
   */
  private async ensureSectionsLoaded(): Promise<void> {
    await this.scrollToBottom(8, 400);
    await this.page.evaluate(() => window.scrollTo(0, 300));
    await this.page.waitForTimeout(500);
  }

  isPageLoaded(): boolean {
    const url = this.getCurrentUrl();
    return (
      url.includes('thongtin') ||
      url.includes('chu-de-bai-viet') ||
      url.includes('bai-viet') ||
      url.includes('tin-tuc')
    );
  }

  // =========================================================================
  // Article helpers
  // =========================================================================

  /**
   * Đếm bài viết hiển thị trên trang.
   * Ưu tiên div.media.mb-3 (section articles).
   * Fallback sang div.media.mb-2 (hero) nếu không có section articles.
   */
  async getArticleCount(): Promise<number> {
    try {
      await this.page
        .locator(TinTucPage.ANY_ARTICLE_MEDIA)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return 0;
    }

    const sectionCount = await this.page
      .locator(TinTucPage.SECTION_ARTICLE)
      .count();

    if (sectionCount > 0) return sectionCount;

    return this.page.locator(TinTucPage.HERO_MEDIA).count();
  }

  /**
   * Kiểm tra hero article (bài nổi bật đầu trang /thongtin).
   * Hero có ảnh width="275" bên trong div.mb-3.shadow-sm.p-3.
   */
  async hasHeroArticle(): Promise<boolean> {
    try {
      await this.page
        .locator(TinTucPage.HERO_CONTAINER)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });

      const heroImg = this.page.locator(TinTucPage.HERO_IMG);
      return (await heroImg.count()) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Lấy tiêu đề và href của hero article.
   */
  async getHeroArticleInfo(): Promise<{ title: string; url: string } | null> {
    try {
      await this.page
        .locator(TinTucPage.HERO_MEDIA)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });

      const heroLink = this.page
        .locator(`${TinTucPage.HERO_MEDIA} a.olm-text-link`)
        .first();

      const title = (await heroLink.getAttribute('title')) ??
                    (await heroLink.textContent()) ?? '';
      const url   = (await heroLink.getAttribute('href')) ?? '';

      return title && url ? { title: title.trim(), url } : null;
    } catch {
      return null;
    }
  }

  /**
   * Lấy danh sách tên chủ đề từ sidebar category nav (/thongtin).
   * Selector: ul.shadow-sm.p-3.mb-4 li h4 a
   */
  async getCategoryNames(): Promise<string[]> {
    try {
      await this.page
        .locator(TinTucPage.CATEGORY_NAV_ITEM)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return [];
    }

    const items = await this.page.locator(TinTucPage.CATEGORY_NAV_ITEM).all();
    const names: string[] = [];
    for (const item of items) {
      const name =
        (await item.getAttribute('title')) ??
        (await item.textContent()) ??
        '';
      if (name.trim()) names.push(name.trim());
    }
    return names;
  }

  /**
   * Lấy bài viết đầu tiên trong một section theo tên tiêu đề section.
   *
   * Cấu trúc DOM thực tế:
   *   <div>
   *     <h2 class="my-3"><a title="Section Name">...</a></h2>
   *   </div>
   *   <div class="shadow-sm p-3 mb-4 bg-white rounded">
   *     <div class="media mb-3">...</div>
   *   </div>
   *
   * Dùng XPath lên ancestor div.my-3 rồi sang sibling div.shadow-sm.
   */
  async getFirstArticleInSection(
    sectionTitle: string
  ): Promise<{ title: string; url: string } | null> {
    try {
      const sectionH2Link = this.page
        .locator(
          `h2.my-3 a[title="${sectionTitle}"], h2.my-3 a:has-text("${sectionTitle}")`
        )
        .first();

      // Lên div chứa h2.my-3, rồi lấy div.shadow-sm kế tiếp
      const sectionBox = sectionH2Link.locator(
        'xpath=ancestor::div[contains(@class,"my-3")]/following-sibling::div[contains(@class,"shadow-sm")][1]'
      );

      const firstMedia = sectionBox.locator('div.media.mb-3').first();
      const link = firstMedia.locator('a.olm-text-link').first();

      const title =
        (await link.getAttribute('title')) ??
        (await link.textContent()) ??
        '';
      const url = (await link.getAttribute('href')) ?? '';

      return title && url ? { title: title.trim(), url } : null;
    } catch {
      return null;
    }
  }

  /**
   * Lấy tất cả bài viết trong một section.
   */
  async getArticlesInSection(
    sectionTitle: string
  ): Promise<Array<{ title: string; url: string }>> {
    try {
      const sectionH2Link = this.page
        .locator(
          `h2.my-3 a[title="${sectionTitle}"], h2.my-3 a:has-text("${sectionTitle}")`
        )
        .first();

      const sectionBox = sectionH2Link.locator(
        'xpath=ancestor::div[contains(@class,"my-3")]/following-sibling::div[contains(@class,"shadow-sm")][1]'
      );

      const medias = await sectionBox.locator('div.media.mb-3').all();
      const results: Array<{ title: string; url: string }> = [];

      for (const media of medias) {
        const link = media.locator('a.olm-text-link').first();
        const title =
          (await link.getAttribute('title')) ??
          (await link.textContent()) ??
          '';
        const url = (await link.getAttribute('href')) ?? '';
        if (title.trim() && url) {
          results.push({ title: title.trim(), url });
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Click bài viết đầu tiên trên trang.
   * Bắt cả link /bai-viet/ (thongtin) lẫn /tin-tuc/ (hoc-tap).
   */
  async clickFirstArticle(): Promise<this> {
    try {
      await this.page
        .locator(TinTucPage.ARTICLE_LINK)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });

      const links = await this.page.locator(TinTucPage.ARTICLE_LINK).all();
      if (links.length > 0) {
        const href = await links[0].getAttribute('href');
        await this.jsClick(links[0]);

        // QUAN TRỌNG: jsClick() chỉ thực hiện click, KHÔNG đợi điều hướng.
        // Nếu gọi getArticleTitle() ngay sau đó, trang có thể vẫn còn ở
        // danh sách cũ (chưa có <h1>) → trả về '' dù bài viết click hoàn
        // toàn hợp lệ. Đợi URL đổi sang trang bài viết (hoặc tối thiểu đợi
        // load state) trước khi trả về.
        if (href) {
          await this.page
            .waitForURL((url) => url.toString().includes(href.split('?')[0]), {
              timeout: 15_000,
            })
            .catch(() => {});
        }
        await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
        await this.dismissPopups();
        // Trang danh sách trước đó đã scrollTo(0, 300) — nếu là SPA điều
        // hướng không reload, vị trí cuộn này có thể giữ nguyên sang trang
        // chi tiết khiến <h1> tiêu đề (thường nằm gần đầu trang) chưa được
        // tìm đúng vị trí. Cuộn lại lên đầu để đảm bảo getArticleTitle()
        // luôn xuất phát từ trạng thái nhất quán.
        await this.page.evaluate(() => window.scrollTo(0, 0));
        await this.page.waitForTimeout(400);
      }
    } catch {
      // Không có article nào, không throw
    }
    return this;
  }

  /**
   * Lấy tiêu đề trang bài viết sau khi navigate.
   * Thử cuộn lên/xuống nếu chưa tìm thấy ngay lần đầu — một số trang bài
   * viết render <h1> chậm hơn phần còn lại của layout, hoặc vị trí cuộn kế
   * thừa từ trang danh sách khiến lần thử đầu chưa khớp đúng phần tử.
   */
  async getArticleTitle(): Promise<string> {
    let el = await this.findVisible([TinTucPage.ARTICLE_TITLE], 5);

    if (!el) {
      // Thử 1: đảm bảo đang ở đầu trang
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.page.waitForTimeout(500);
      el = await this.findVisible([TinTucPage.ARTICLE_TITLE], 3);
    }

    if (!el) {
      // Thử 2: cuộn xuống một đoạn rồi lên lại — kích hoạt lazy-render
      // (giống pattern đã gặp ở HoiDapPage) trước khi kết luận không có
      await this.scrollToBottom(2, 300);
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.page.waitForTimeout(500);
      el = await this.findVisible([TinTucPage.ARTICLE_TITLE], 4);
    }

    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // =========================================================================
  // Sidebar helpers (/thongtin)
  // =========================================================================

  /**
   * Lấy danh sách bài mới nhất / tin nổi bật từ sidebar.
   */
  async getSidebarArticles(): Promise<Array<{ title: string; url: string }>> {
    try {
      await this.page
        .locator(TinTucPage.SIDEBAR_ARTICLE)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return [];
    }

    const medias = await this.page.locator(TinTucPage.SIDEBAR_ARTICLE).all();
    const results: Array<{ title: string; url: string }> = [];

    for (const media of medias) {
      const link = media.locator('a.olm-text-link').first();
      const title =
        (await link.getAttribute('title')) ??
        (await link.textContent()) ??
        '';
      const url = (await link.getAttribute('href')) ?? '';
      if (title.trim() && url) {
        results.push({ title: title.trim(), url });
      }
    }
    return results;
  }

  // =========================================================================
  // Pagination helpers (/chu-de-bai-viet/hoc-tap)
  // =========================================================================

  async hasPagination(): Promise<boolean> {
    try {
      await this.page
        .locator(TinTucPage.PAGINATION)
        .first()
        .waitFor({ state: 'visible', timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  async getPageNumbers(): Promise<number[]> {
    if (!(await this.hasPagination())) return [];

    const links = await this.page.locator(TinTucPage.PAGE_LINK).all();
    const nums: number[] = [];
    for (const link of links) {
      const text = ((await link.textContent()) ?? '').trim();
      const n = parseInt(text, 10);
      if (!isNaN(n)) nums.push(n);
    }
    return nums;
  }

  async getActivePageNumber(): Promise<number | null> {
    try {
      const active = this.page.locator(TinTucPage.ACTIVE_PAGE).first();
      const text = ((await active.textContent()) ?? '').trim();
      const n = parseInt(text, 10);
      return isNaN(n) ? null : n;
    } catch {
      return null;
    }
  }

  async clickPageNumber(n: number): Promise<this> {
    const link = this.page
      .locator(`${TinTucPage.PAGE_LINK}`)
      .filter({ hasText: String(n) })
      .first();
    await this.jsClick(link);
    await this.page.waitForTimeout(800);
    return this;
  }
}