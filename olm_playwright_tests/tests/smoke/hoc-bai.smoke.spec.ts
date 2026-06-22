import { test, expect } from '@playwright/test';
import { HocBaiPage } from '../../pages/HocBaiPage';

test.describe('Hoc bai @navigation @smoke', () => {
  test('Trang Học bài và các cấp học @smoke', async ({ page }) => {
    const hocBaiPage = new HocBaiPage(page);
    await hocBaiPage.open();
    await hocBaiPage.closePopupIfPresent();
    expect(hocBaiPage.isPageLoaded()).toBeTruthy();
    const gradeLinks = await hocBaiPage.getGradeLinks();
    expect(gradeLinks.length).toBeGreaterThan(0);
  });
});
