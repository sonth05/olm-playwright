import { test, expect } from '@playwright/test';
import { HeaderPage } from '../../pages/HeaderPage';

test.describe('Header @header @smoke', () => {
  test('[Happy] Trang chủ tải thành công @smoke', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    expect(headerPage.getCurrentUrl()).toContain('olm.vn');
  });
});
