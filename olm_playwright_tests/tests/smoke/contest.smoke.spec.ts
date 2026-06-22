import { test, expect } from '@playwright/test';
import { ContestPage } from '../../pages/ContestPage';

test.describe('Contest @contest @smoke', () => {
  test('[Happy] Trang Kho đề tải thành công @smoke', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    expect(contestPage.isPageLoaded()).toBeTruthy();
  });
});
