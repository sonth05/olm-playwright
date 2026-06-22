import { test, expect } from '@playwright/test';
import { LopPage } from '../../pages/LopPage';

test.describe('Hoc bai flow @navigation @regression @e2e', () => {
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
