import { test, expect } from '../../../../core/fixtures/role.fixture';
import { ThoiKhoaBieuPage } from '../pages/ThoiKhoaBieuPage';

test.describe('Thời khóa biểu @thoi-khoa-bieu @regression', () => {
  test('GV mở TKB — subdomain tkb.olm.vn load được', async ({ teacherPage: page }) => {
    const tkbPage = new ThoiKhoaBieuPage(page);
    await tkbPage.open();

    expect(tkbPage.isPageLoaded()).toBeTruthy();
    expect(await tkbPage.hasMainContent()).toBe(true);

    const title = await tkbPage.getPageTitleText();
    expect(title.length).toBeGreaterThan(0);
  });
});
