import { test, expect } from '@playwright/test';
import { KidsCoursePathPage } from '../../kids-zone/pages/KidsCoursePathPage';
import { LessonPage } from '../pages/LessonPage';
import { CHUONG_TRINH_5_TUOI_URL } from '../../../config/config';

test.describe('Kiem tra video @e2e', () => {
	test('Mở bài video từ lộ trình Kids và hiển thị player', async ({ page }) => {
		const coursePath = new KidsCoursePathPage(page);
		await coursePath.open(CHUONG_TRINH_5_TUOI_URL);

		expect(coursePath.isPageLoaded()).toBeTruthy();

		const sections = await coursePath.getSectionItems();
		expect(sections.length).toBeGreaterThan(0);

		await coursePath.clickSectionByPosition(1);
		const links = await coursePath.getLessonLinks();
		expect(links.length).toBeGreaterThan(0);

		const videoLink = links.find((item) => item.isVideo) ?? links[0];
		await coursePath.clickLessonByTitle(videoLink.title);

		const lessonPage = new LessonPage(page);
		expect(lessonPage.isPageLoaded()).toBeTruthy();
		expect(await lessonPage.hasVideo()).toBeTruthy();
	});
});