/**
 * tin-tuc.smoke.spec.ts
 *
 * Smoke tests nhanh cho trang Tin tức và Blog học tập.
 * Chạy trước regression để xác nhận 3 trang core load được.
 */

import { test, expect } from '@playwright/test';
import { TinTucPage } from '../../pages/TinTucPage';

test.describe('TinTuc @news @smoke', () => {

  test('[Happy] /thongtin load thành công @smoke', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    expect(p.isPageLoaded()).toBeTruthy();
    expect(p.getCurrentUrl()).toContain('thongtin');
  });

  test('[Happy] /thongtin có hero article @smoke', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    expect(await p.hasHeroArticle()).toBeTruthy();
  });

  test('[Happy] /thongtin có ít nhất 1 bài viết trong section @smoke', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.open();
    expect(await p.getArticleCount()).toBeGreaterThan(0);
  });

  test('[Happy] /hoc-tap load thành công và URL đúng @smoke', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    expect(p.getCurrentUrl()).toContain('hoc-tap');
    expect(p.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] /hoc-tap có bài viết với link /tin-tuc/ @smoke', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openHocTap();
    expect(await p.getArticleCount()).toBeGreaterThan(0);
    // Xác nhận selector ARTICLE_LINK bắt được link /tin-tuc/
    const count = await page
      .locator("a.olm-text-link[href*='/tin-tuc/']")
      .count();
    expect(count).toBeGreaterThan(0);
  });

  test('[Happy] /thong-bao navigate đúng URL @smoke', async ({ page }) => {
    const p = new TinTucPage(page);
    await p.openThongBao();
    expect(p.getCurrentUrl()).toContain('thong-bao');
  });
});