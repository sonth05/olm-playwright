import { test, expect } from '@playwright/test';
import { TinTucPage } from '../../pages/TinTucPage';

test.describe('Tin tuc @news @regression @regression', () => {
  test('[Happy] Danh sách bài viết', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.open();
    expect(await pageObj.getArticleCount()).toBeGreaterThan(0);
  });

  test('[Happy] Hero article', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.open();
    expect(await pageObj.hasHeroArticle()).toBeTruthy();
  });

  test('[Happy] Mở bài viết đầu tiên', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.open();
    await pageObj.clickFirstArticle();
    expect(await pageObj.getArticleTitle()).toBeTruthy();
  });

  test('[Happy] Danh sách blog học tập', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.openHocTap();
    expect(await pageObj.getArticleCount()).toBeGreaterThan(0);
  });

  test('[Happy] Trang Thông báo', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.openThongBao();
    expect(pageObj.getCurrentUrl()).toContain('thong-bao');
  });

  test('[Unhappy] getArticleTitle trước khi click', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.open();
    const title = await pageObj.getArticleTitle();
    expect(typeof title).toBe('string');
  });

  test('[Unhappy] clickFirstArticle khi rỗng', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.open();
    if ((await pageObj.getArticleCount()) === 0) {
      await expect(pageObj.clickFirstArticle()).resolves.not.toThrow();
    }
  });

  test('[Unhappy] Deep link blog học tập', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.openHocTap();
    expect(pageObj.getCurrentUrl()).toContain('hoc-tap');
  });
});
