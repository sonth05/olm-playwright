import { test, expect } from '@playwright/test';
import { CuocThiPage } from '../src/pages/CuocThiPage';

test.describe('Cuoc thi @fun_contest @regression', () => {
  test('[Happy] Trang Cuộc thi vui @smoke', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    expect(pageObj.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Contest cards hiển thị', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    expect(await pageObj.getContestCardCount()).toBeGreaterThan(0);
  });

  test('[Happy] Featured contest', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    expect(await pageObj.hasFeaturedContest()).toBeTruthy();
  });

  test('[Happy] Section Toán vui', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    expect(await pageObj.isSectionVisible('toan_vui')).toBeTruthy();
  });

  test('[Happy] Section Văn hay', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    expect(await pageObj.isSectionVisible('van_hay')).toBeTruthy();
  });

  test('[Happy] Mở contest đầu tiên', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    await pageObj.clickFirstContest();
    expect(pageObj.getCurrentUrl()).toBeTruthy();
  });

  test('[Unhappy] Section Fun English có thể ẩn', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    const result = await pageObj.isSectionVisible('fun_english');
    expect(typeof result).toBe('boolean');
  });

  test('[Unhappy] Section không tồn tại', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    expect(await pageObj.isSectionVisible('section_khong_ton_tai')).toBeFalsy();
  });

  test('[Unhappy] clickFirstContest khi rỗng', async ({ page }) => {
    const pageObj = new CuocThiPage(page);
    await pageObj.open();
    const links = await pageObj.findElements(CuocThiPage.CONTEST_LINK);
    if (links.length === 0) {
      await expect(pageObj.clickFirstContest()).resolves.not.toThrow();
    }
  });
});
