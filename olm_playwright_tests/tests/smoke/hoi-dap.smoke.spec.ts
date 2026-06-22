import { test, expect } from '@playwright/test';
import { HoiDapPage } from '../../pages/HoiDapPage';

test.describe('Hoi dap @hoi_dap @smoke', () => {
  test('[Happy] Trang Hỏi đáp @smoke', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    expect(hoiDapPage.isPageLoaded()).toBeTruthy();
  });
});
