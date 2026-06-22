import { test, expect } from '@playwright/test';
import { TinTucPage } from '../../pages/TinTucPage';

test.describe('Tin tuc @news @smoke', () => {
  test('[Happy] Trang Tin tức @smoke', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.open();
    expect(pageObj.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Blog học tập @smoke', async ({ page }) => {
    const pageObj = new TinTucPage(page);
    await pageObj.openHocTap();
    expect(pageObj.getCurrentUrl()).toContain('hoc-tap');
  });
});
