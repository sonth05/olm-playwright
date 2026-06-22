import { test, expect } from '@playwright/test';
import { HeaderComponent } from '../../components/HeaderComponent';
import { HocBaiPage } from '../../pages/HocBaiPage';

test.describe('User journey @e2e', () => {
  test('Trang chủ → Học bài → Lớp 1', async ({ page }) => {
    const header = new HeaderComponent(page);
    await header.openHome();
    expect(page.url()).toContain('olm.vn');

    const nav = await header.findVisible([HeaderComponent.NAV_HOC_BAI], 5);
    if (nav) await header.jsClick(nav);

    const hocBai = new HocBaiPage(page);
    await hocBai.closePopupIfPresent();
    expect(hocBai.isPageLoaded() || page.url().includes('hoc-bai')).toBeTruthy();
  });
});
