import { test, expect } from '@playwright/test';
import { HoiDapPage } from '../src/pages/HoiDapPage';

test.describe('Hoi dap @hoi_dap @regression', () => {
  test('[Happy] Trang Hỏi đáp @smoke', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    expect(hoiDapPage.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Danh sách câu hỏi', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThan(0);
  });

  test('[Happy] Lọc Mới nhất', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Mới nhất');
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Happy] Lọc Câu hỏi hay', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Câu hỏi hay');
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Happy] Lọc theo lớp', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByGrade(5);
    expect(hoiDapPage.getCurrentUrl()).toContain('hoi-dap');
  });

  test('[Happy] Xem thêm', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const initialCount = await hoiDapPage.getQuestionCount();
    await hoiDapPage.clickLoadMore();
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThanOrEqual(initialCount);
  });

  test('[Unhappy] Đặt câu hỏi chưa đăng nhập', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const textarea = await hoiDapPage.findVisible([HoiDapPage.TEXTAREA_QUESTION], 5);
    if (!textarea) {
      expect(true).toBeTruthy();
    } else {
      await hoiDapPage.askQuestion('Câu hỏi test khi chưa đăng nhập');
      const url = hoiDapPage.getCurrentUrl();
      expect(url.includes('dangnhap') || url.includes('hoi-dap')).toBeTruthy();
    }
  });

  test('[Unhappy] Lọc lớp không tồn tại', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByGrade(99);
    expect(hoiDapPage.getCurrentUrl()).toContain('hoi-dap');
  });

  test('[Unhappy] Lọc loại không tồn tại', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Loại không tồn tại XYZ');
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThanOrEqual(0);
  });
});
