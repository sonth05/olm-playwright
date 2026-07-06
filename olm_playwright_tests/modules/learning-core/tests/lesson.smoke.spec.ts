import { test, expect } from '@playwright/test';
import { CoursePage } from '../pages/CoursePage';
import { SAMPLE_COURSE_URLS } from '../../../config/testData';

test.describe('Lesson @navigation @smoke', () => {
	test('Trang khóa học có tiêu đề @smoke', async ({ page }) => {
		const coursePage = new CoursePage(page);
		await coursePage.open(SAMPLE_COURSE_URLS[1]);
		const title = await coursePage.getTitle();
		expect(title).toBeTruthy();
	});
});