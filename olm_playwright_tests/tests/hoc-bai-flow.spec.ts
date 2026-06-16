import { test, expect } from '@playwright/test';
import { HocBaiPage } from '../src/pages/HocBaiPage';
import { LopPage } from '../src/pages/LopPage';

test.describe('Hoc bai flow @navigation @regression', () => {
  test('Trang Học bài và các cấp học @smoke', async ({ page }) => {
    const hocBaiPage = new HocBaiPage(page);
    await hocBaiPage.open();
    await hocBaiPage.closePopupIfPresent();
    expect(hocBaiPage.isPageLoaded()).toBeTruthy();
    const gradeLinks = await hocBaiPage.getGradeLinks();
    expect(gradeLinks.length).toBeGreaterThan(0);
    const tieuHoc = await hocBaiPage.isSectionVisible('tieu_hoc');
    const thcs = await hocBaiPage.isSectionVisible('thcs');
    expect(tieuHoc || thcs).toBeTruthy();
  });

  test('Điều hướng lớp và danh sách khóa học', async ({ page }) => {
    const lopPage = new LopPage(page);
    await lopPage.open(1);
    expect(lopPage.isPageLoaded()).toBeTruthy();
    const courses = await lopPage.getCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0].title).toBeTruthy();
    expect(courses[0].url).toBeTruthy();
  });
});
