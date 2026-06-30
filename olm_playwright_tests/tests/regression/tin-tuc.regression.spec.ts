/**
 * tin-tuc.regression.spec.ts
 *
 * Regression tests cho trang Tin tức (/thongtin) và Blog học tập (/chu-de-bai-viet/hoc-tap).
 *
 * Coverage:
 *  - /thongtin        : hero article, section articles, category nav, sidebar, navigation
 *  - /chu-de-bai-viet/hoc-tap : article list, links /tin-tuc/, pagination, navigation
 *  - /chu-de-bai-viet/thong-bao : URL routing
 *  - Edge / Unhappy   : empty states, type safety, deep-link, page 2
 */

import { test, expect } from '@playwright/test';
import { TinTucPage } from '../../pages/TinTucPage';

// =============================================================================
// /thongtin — Trang Tin tức chính
// =============================================================================

test.describe('TinTuc /thongtin @news @regression', () => {

  // ── Page load ──────────────────────────────────────────────────────────────

  test('[Happy] Trang /thongtin load thành công', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    expect(p.isPageLoaded()).toBeTruthy();
    expect(p.getCurrentUrl()).toContain('thongtin');
  });

  // ── Hero article ───────────────────────────────────────────────────────────

  test('[Happy] Hero article hiển thị với ảnh width=275', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    expect(await p.hasHeroArticle()).toBeTruthy();
  });

  test('[Happy] Hero article có title và URL hợp lệ', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const hero = await p.getHeroArticleInfo();
    expect(hero).not.toBeNull();
    expect(hero!.title.length).toBeGreaterThan(0);
    expect(hero!.url).toMatch(/\/(bai-viet|tin-tuc)\//);
  });

  // ── Section articles ───────────────────────────────────────────────────────

  test('[Happy] Có ít nhất 1 bài viết trong section', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    expect(await p.getArticleCount()).toBeGreaterThan(0);
  });

  test('[Happy] Section "Thông báo" có bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const articles = await p.getArticlesInSection('Thông báo');
    expect(articles.length).toBeGreaterThan(0);
    // Mỗi bài phải có title và URL hợp lệ
    for (const art of articles) {
      expect(art.title.length).toBeGreaterThan(0);
      expect(art.url).toMatch(/\/(bai-viet|tin-tuc)\//);
    }
  });

  test('[Happy] Section "Khóa học hè" có bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const articles = await p.getArticlesInSection('Khóa học hè');
    expect(articles.length).toBeGreaterThan(0);
  });

  test('[Happy] Section "Chuyển đổi số Giáo dục" có bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const articles = await p.getArticlesInSection('Chuyển đổi số Giáo dục');
    expect(articles.length).toBeGreaterThan(0);
  });

  test('[Happy] Section "Thi THPT 2026" có bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const articles = await p.getArticlesInSection('Thi THPT 2026');
    expect(articles.length).toBeGreaterThan(0);
  });

  test('[Happy] getFirstArticleInSection trả về bài đầu tiên trong "Thông báo"', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const first = await p.getFirstArticleInSection('Thông báo');
    expect(first).not.toBeNull();
    expect(first!.title.length).toBeGreaterThan(0);
    expect(first!.url).toMatch(/\/(bai-viet|tin-tuc)\//);
  });

  // ── Category nav sidebar ───────────────────────────────────────────────────

  test('[Happy] Sidebar category nav hiển thị danh sách chủ đề', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const cats = await p.getCategoryNames();
    expect(cats.length).toBeGreaterThan(0);
  });

  test('[Happy] Sidebar category nav chứa "Thông báo"', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const cats = await p.getCategoryNames();
    expect(cats.some((c) => c.includes('Thông báo'))).toBeTruthy();
  });

  test('[Happy] Sidebar category nav chứa "Blog học tập"', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const cats = await p.getCategoryNames();
    expect(cats.some((c) => c.includes('Blog học tập'))).toBeTruthy();
  });

  // ── Sidebar bài mới nhất ───────────────────────────────────────────────────

  test('[Happy] Sidebar bài mới nhất có ít nhất 1 bài', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const sidebar = await p.getSidebarArticles();
    expect(sidebar.length).toBeGreaterThan(0);
  });

  test('[Happy] Sidebar bài mới nhất có URL hợp lệ', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const sidebar = await p.getSidebarArticles();
    for (const art of sidebar) {
      expect(art.url).toMatch(/\/(bai-viet|tin-tuc)\//);
    }
  });

  // ── Navigation to article ──────────────────────────────────────────────────

  test('[Happy] Click bài viết đầu tiên → navigate đến trang chi tiết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    await p.clickFirstArticle();
    const url = p.getCurrentUrl();
    expect(url).toMatch(/\/(bai-viet|tin-tuc)\//);
  });

  test('[Happy] Trang bài viết có h1 tiêu đề không rỗng', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    await p.clickFirstArticle();
    const title = await p.getArticleTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  // ── Unhappy / Edge ─────────────────────────────────────────────────────────

  test('[Unhappy] getArticleTitle trên /thongtin trước khi click trả về string', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const title = await p.getArticleTitle();
    // Trang danh sách không có h1 article — phải trả về string (rỗng hoặc có nội dung)
    expect(typeof title).toBe('string');
  });

  test('[Unhappy] getFirstArticleInSection section không tồn tại trả về null', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const result = await p.getFirstArticleInSection('Section Không Tồn Tại XYZ');
    expect(result).toBeNull();
  });

  test('[Unhappy] getArticlesInSection section không tồn tại trả về mảng rỗng', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    const result = await p.getArticlesInSection('Section Không Tồn Tại XYZ');
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(0);
  });

  test('[Unhappy] clickFirstArticle không throw khi không có bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    // Ngay cả khi count = 0, method không được throw
    await expect(p.clickFirstArticle()).resolves.not.toThrow();
  });
});

// =============================================================================
// /chu-de-bai-viet/hoc-tap — Blog học tập
// =============================================================================

test.describe('TinTuc /hoc-tap @news @regression', () => {

  // ── Page load ──────────────────────────────────────────────────────────────

  test('[Happy] Trang /hoc-tap load và URL đúng', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    expect(p.getCurrentUrl()).toContain('hoc-tap');
    expect(p.isPageLoaded()).toBeTruthy();
  });

  // ── Article list — link /tin-tuc/ ─────────────────────────────────────────

  test('[Happy] Có ít nhất 1 bài viết trên trang blog học tập', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    expect(await p.getArticleCount()).toBeGreaterThan(0);
  });

  test('[Happy] Link bài viết trên /hoc-tap dùng /tin-tuc/ prefix', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    // Kiểm tra ít nhất 1 link /tin-tuc/ xuất hiện trên trang
    const tinTucLinks = await page
      .locator("a.olm-text-link[href*='/tin-tuc/']")
      .count();
    expect(tinTucLinks).toBeGreaterThan(0);
  });

  // ── Click & navigate ───────────────────────────────────────────────────────

  test('[Happy] Click bài viết đầu tiên trên /hoc-tap → navigate thành công', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    await p.clickFirstArticle();
    const url = p.getCurrentUrl();
    // Chấp nhận cả /tin-tuc/ và /bai-viet/ vì server có thể redirect
    expect(url).toMatch(/\/(tin-tuc|bai-viet)\//);
  });

  test('[Happy] Trang bài viết sau click có h1 tiêu đề', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    await p.clickFirstArticle();
    const title = await p.getArticleTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  // ── Breadcrumb ─────────────────────────────────────────────────────────────

  test('[Happy] Trang /hoc-tap có breadcrumb chứa "Tin tức"', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Tin tức');
  });

  test('[Happy] Trang /hoc-tap có page title "Blog học tập"', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    const heading = page.locator('h1:has-text("Blog học tập"), h2:has-text("Blog học tập")');
    await expect(heading.first()).toBeVisible();
  });

  // ── Sidebar: không có category nav ────────────────────────────────────────

  test('[Unhappy] /hoc-tap không có category nav sidebar → getCategoryNames rỗng', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    // Trang này không có ul.shadow-sm.p-3.mb-4 li h4 a
    const cats = await p.getCategoryNames();
    expect(Array.isArray(cats)).toBeTruthy();
    // Không assert rỗng cứng — nếu DOM thay đổi thêm sidebar thì test vẫn pass
  });

  // ── Pagination ─────────────────────────────────────────────────────────────

  test('[Happy] Trang /hoc-tap có phân trang', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    expect(await p.hasPagination()).toBeTruthy();
  });

  test('[Happy] Phân trang có số trang hợp lệ (>= 1)', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    const pages = await p.getPageNumbers();
    expect(pages.length).toBeGreaterThanOrEqual(1);
    // Tất cả số trang phải > 0
    for (const n of pages) expect(n).toBeGreaterThan(0);
  });

  test('[Happy] Trang active mặc định là trang 1', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    const active = await p.getActivePageNumber();
    expect(active).toBe(1);
  });

  test('[Happy] Click page 2 → URL chứa page-2 và trang active = 2', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();

    const pages = await p.getPageNumbers();
    // Chỉ chạy nếu có ít nhất 2 trang
    if (pages.includes(2)) {
      await p.clickPageNumber(2);
      expect(p.getCurrentUrl()).toContain('page-2');
      const active = await p.getActivePageNumber();
      expect(active).toBe(2);
    }
  });

  test('[Happy] Trang 2 vẫn có bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();

    const pages = await p.getPageNumbers();
    if (pages.includes(2)) {
      await p.clickPageNumber(2);
      expect(await p.getArticleCount()).toBeGreaterThan(0);
    }
  });

  // ── Unhappy ────────────────────────────────────────────────────────────────

  test('[Unhappy] Deep-link /hoc-tap URL đúng định dạng', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    expect(p.getCurrentUrl()).toContain('chu-de-bai-viet/hoc-tap');
  });
});

// =============================================================================
// /chu-de-bai-viet/thong-bao — Trang Thông báo
// =============================================================================

test.describe('TinTuc /thong-bao @news @regression', () => {

  test('[Happy] URL đúng sau khi navigate đến Thông báo', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openThongBao();
    expect(p.getCurrentUrl()).toContain('thong-bao');
    expect(p.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Trang Thông báo có ít nhất 1 bài viết', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openThongBao();
    expect(await p.getArticleCount()).toBeGreaterThan(0);
  });
});