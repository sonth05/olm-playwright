import { ElementHandle } from '@playwright/test';
import { HOC_TAP_URL, THONG_BAO_NEWS_URL, TIN_TUC_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';

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
  // Các bài viết trong section thường là div.shadow-sm.p-3 > div.media.mb-3,
  // nhưng một số section (vd: "Thông báo") hiện render dạng danh sách
  // li.list-group-item thay vì card div.media.mb-3. Selector gộp cả hai
  // dạng để không bỏ sót bài viết khi site thay đổi layout theo section.
  static readonly SECTION_ARTICLE   =
    'div.shadow-sm.p-3 div.media.mb-3, div.shadow-sm.p-3 li.list-group-item';

  // Gộp cả hai dạng bài viết bên trong 1 section (card hoặc list item), dùng
  // cho getArticlesInSection / getFirstArticleInSection sau khi đã khoanh
  // vùng sectionBox.
  static readonly SECTION_ARTICLE_ANY = 'div.media.mb-3, li.list-group-item';

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
   * Cấu trúc DOM thực tế (đã xác nhận qua HTML thật của section "Thông báo"):
   *   <div>...<h2 class="my-3"><a title="Section Name">...</a></h2>...</div>
   *   <div class="shadow-sm p-3 mb-4 bg-white rounded">
   *     <div class="media mb-3">
   *       <a class="olm-text-link" title="..." href="...">...</a>
   *     </div>
   *     <div class="media mb-3">...</div>
   *     ...
   *   </div>
   *
   * Container bài viết ("div.shadow-sm.p-3...") luôn xuất hiện NGAY SAU
   * heading trong document order, nhưng KHÔNG chắc là một
   * following-sibling trực tiếp của ancestor chứa h2 (tuỳ độ sâu wrapper
   * thực tế trên từng section có thể khác nhau). Vì vậy dùng trục XPath
   * `following::` (thay vì `following-sibling::`) để lấy div.shadow-sm.p-3
   * gần nhất theo sau heading, bất kể nó nằm ở cấp lồng nào — tránh bug cũ
   * khiến các section như "Thông báo" bị coi là rỗng dù có bài viết thật.
   *
   * SECTION_ARTICLE_ANY vẫn gộp thêm `li.list-group-item` như một fallback
   * phòng trường hợp có section khác dùng dạng danh sách gọn; card
   * `div.media.mb-3` vẫn là dạng chính và được ưu tiên khớp trước.
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
        'xpath=following::div[contains(@class,"shadow-sm") and contains(@class,"p-3")][1]'
      );

      const firstMedia = sectionBox.locator(TinTucPage.SECTION_ARTICLE_ANY).first();
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
        'xpath=following::div[contains(@class,"shadow-sm") and contains(@class,"p-3")][1]'
      );

      const medias = await sectionBox.locator(TinTucPage.SECTION_ARTICLE_ANY).all();
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
  /**
   * Kiểm tra href có phải link bài viết THẬT hay không.
   *
   * Selector ARTICLE_LINK dùng chung class "olm-text-link" — class này bị
   * tái sử dụng cho cả link chuyên mục gốc trong menu điều hướng
   * (VD: href="/tin-tuc/", href="/thongtin") lẫn các banner/quảng cáo dùng
   * href="#" (VD: banner "XEM NGAY!!" cố định đầu trang). Nếu vô tình click
   * nhầm các link này, kết quả điều hướng sẽ là "/thongtin#" hoặc thậm chí
   * về trang chủ — chứ không phải trang chi tiết bài viết.
   *
   * Mọi URL bài viết thật của OLM đều có dạng "/bai-viet/<slug>-<id số>"
   * hoặc "/tin-tuc/<slug>-<id số>" (id số ở cuối), khác hẳn link chuyên
   * mục gốc (không có slug + id). Dùng đặc điểm này để lọc.
   */
  private isRealArticleHref(href: string | null): href is string {
    return !!href && /\/(bai-viet|tin-tuc)\/[^/?#]+-\d+/.test(href);
  }

  /**
   * Click an toàn vào 1 link bài viết — ưu tiên gọi thẳng DOM API
   * `element.click()` qua JS thay vì click theo toạ độ.
   *
   * jsClick() (dùng chung ở BasePage) click({force:true}) TRƯỚC — force chỉ
   * bỏ qua kiểm tra actionability của Playwright, KHÔNG bỏ qua việc trình
   * duyệt click theo toạ độ thật. Nếu có banner/quảng cáo cố định đè lên
   * đúng vị trí link (rất hay gặp ở /thongtin), trình duyệt sẽ gửi sự kiện
   * click cho banner đó thay vì link bài viết — mà click({force:true})
   * KHÔNG throw lỗi trong trường hợp này, nên nhánh dự phòng gọi
   * `el.click()` bằng JS (mới thực sự click đúng phần tử mục tiêu, không
   * phụ thuộc toạ độ/lớp phủ) sẽ không bao giờ chạy tới.
   *
   * Ở đây đảo ngược thứ tự: gọi `element.click()` bằng JS làm ưu tiên vì nó
   * kích hoạt thẳng handler của chính thẻ <a>, không bị banner che chắn;
   * chỉ fallback sang click theo toạ độ nếu không lấy được element handle.
   */
  /**
   * Click an toàn vào 1 link bài viết — nhận ElementHandle (tham chiếu DOM
   * CỐ ĐỊNH) thay vì Locator.
   *
   * LƯU Ý QUAN TRỌNG (bug đã gặp): Locator lấy từ `.all()` thực chất là
   * "nth-match(selector, i)" — mỗi lần gọi hành động trên nó (vd:
   * `elementHandle()`, `click()`), Playwright RE-QUERY lại toàn bộ selector
   * TẠI THỜI ĐIỂM ĐÓ rồi mới lấy phần tử thứ i. Nếu ta validate href ở một
   * Locator từ `.all()` rồi mới click SAU MỘT NHỊP (scrollIntoView, await…),
   * mà DOM đã thay đổi trong lúc đó (banner/quảng cáo lazy-load chèn thêm
   * phần tử `.olm-text-link` mới phía trước, khiến thứ tự dịch chuyển), thì
   * lúc click, index i có thể trỏ sang MỘT PHẦN TỬ KHÁC hẳn — không còn là
   * phần tử ta đã kiểm tra href hợp lệ ban đầu. Đây là nguyên nhân khiến
   * việc lọc href ở `clickFirstArticle()` không ăn thua nếu vẫn truyền
   * Locator xuống đây.
   *
   * ElementHandle thì khác: nó là tham chiếu tới ĐÚNG node DOM tại thời
   * điểm lấy handle, không re-query theo index nữa — dù trang có chèn thêm
   * phần tử khác, node ta đang cầm vẫn là node đó (trừ khi chính nó bị gỡ
   * khỏi DOM). Click thẳng qua `element.click()` bằng JS trên handle này
   * đảm bảo click đúng phần tử đã validate, không bị lệch do overlay hay
   * do DOM dịch chuyển.
   */
  private async clickArticleLink(handle: ElementHandle<HTMLElement>): Promise<void> {
    await handle.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.evaluate((el) => el.click(), handle);
  }

  async clickFirstArticle(): Promise<this> {
    try {
      await this.page
        .locator(TinTucPage.ARTICLE_LINK)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });

      const links = await this.page.locator(TinTucPage.ARTICLE_LINK).all();

      // Chọn link ĐẦU TIÊN trong danh sách khớp thực sự là bài viết (có
      // slug + id số ở cuối href) — bỏ qua link chuyên mục gốc/banner dùng
      // chung class "olm-text-link" nhưng không dẫn tới bài viết cụ thể.
      //
      // QUAN TRỌNG: lấy elementHandle() NGAY khi vừa xác nhận href hợp lệ,
      // trong cùng một vòng lặp — không giữ lại Locator để dùng sau, vì
      // Locator từ .all() sẽ re-query theo index và có thể trỏ nhầm sang
      // phần tử khác nếu DOM đổi giữa lúc validate và lúc click (xem giải
      // thích chi tiết ở clickArticleLink()).
      let targetHandle: ElementHandle<HTMLElement> | null = null;
      let targetHref: string | null = null;
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (this.isRealArticleHref(href)) {
          targetHandle = (await link.elementHandle().catch(() => null)) as ElementHandle<HTMLElement> | null;
          if (targetHandle) {
            targetHref = href;
            break;
          }
        }
      }

      if (targetHandle && targetHref) {
        const href = targetHref;
        await this.clickArticleLink(targetHandle);

        // QUAN TRỌNG: click chỉ thực hiện thao tác, KHÔNG đợi điều hướng.
        // Nếu gọi getArticleTitle() ngay sau đó, trang có thể vẫn còn ở
        // danh sách cũ (chưa có <h1>) → trả về '' dù bài viết click hoàn
        // toàn hợp lệ. Đợi URL đổi sang trang bài viết (hoặc tối thiểu đợi
        // load state) trước khi trả về.
        await this.page
          .waitForURL((url) => url.toString().includes(href.split('?')[0]), {
            timeout: 15_000,
          })
          .catch(() => {});
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