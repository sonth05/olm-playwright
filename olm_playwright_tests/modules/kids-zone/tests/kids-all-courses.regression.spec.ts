/**
 * kids-all-courses.regression.spec.ts
 */

import { expect } from '@playwright/test';
import { test } from '../../../fixtures/auth.fixture';
import { KidsCoursePathPage } from '../pages/KidsCoursePathPage';
import { KIDS_COURSES } from '../../../config/config';

for (const course of KIDS_COURSES) {
	test.describe(`KidsCoursePath - "${course.name}" @kids-course-path @regression`, () => {

		test(`[Happy] "${course.name}" load thành công`, async ({ authenticatedPage }) => {
			const p = new KidsCoursePathPage(authenticatedPage);
			await p.open(course.url);

			expect(p.isPageLoaded()).toBeTruthy();
			expect(authenticatedPage.url()).not.toContain('dangnhap');
		});

		test(`[Happy] "${course.name}" có ít nhất 1 node trên lộ trình`, async ({ authenticatedPage }) => {
			const p = new KidsCoursePathPage(authenticatedPage);
			await p.open(course.url);

			expect(await p.getSectionItemCount()).toBeGreaterThan(0);
		});

		test(`[Happy] "${course.name}" - data-id của các node không trùng lặp`, async ({ authenticatedPage }) => {
			const p = new KidsCoursePathPage(authenticatedPage);
			await p.open(course.url);

			const items = await p.getSectionItems();
			test.skip(items.length === 0, `Khóa "${course.name}" không có node nào`);

			const ids = items.map((i) => i.dataId);
			expect(new Set(ids).size).toBe(ids.length);
		});

		test(`[Happy] "${course.name}" - mỗi node có data-categories hợp lệ`, async ({ authenticatedPage }) => {
			const p = new KidsCoursePathPage(authenticatedPage);
			await p.open(course.url);

			const items = await p.getSectionItems();
			expect(items.length).toBeGreaterThan(0);

			for (const item of items) {
				expect(item.dataId.length).toBeGreaterThan(0);
				expect(item.topicTitle.length).toBeGreaterThan(0);
				expect(item.sectionName.length).toBeGreaterThan(0);
				expect(Array.isArray(item.lessons)).toBe(true);
				expect(item.lessons.length).toBeGreaterThan(0);

				for (const lesson of item.lessons) {
					expect(lesson.title.length).toBeGreaterThan(0);
					expect(lesson.url).toMatch(/^https?:\/\/.*\/chu-de\//);
					expect(typeof lesson.completed).toBe('boolean');
				}
			}
		});

		test(`[Happy] "${course.name}" - click node đầu tiên mở popup khớp số bài học`, async ({ authenticatedPage }) => {
			const p = new KidsCoursePathPage(authenticatedPage);
			await p.open(course.url);

			const items = await p.getSectionItems();
			test.skip(items.length === 0, `Khóa "${course.name}" không có node nào`);

			const firstItem = items[0];
			await p.clickSectionByPosition(1);

			const linksCount = await p.getLessonLinksCount();
			expect(linksCount).toBe(firstItem.lessons.length);
		});

		test(`[Happy] "${course.name}" - click 1 bài học điều hướng đúng URL /chu-de/`, async ({ authenticatedPage }) => {
			const p = new KidsCoursePathPage(authenticatedPage);
			await p.open(course.url);

			const items = await p.getSectionItems();
			test.skip(items.length === 0 || items[0].lessons.length === 0, `Khóa "${course.name}" không có bài học để click`);

			const targetLesson = items[0].lessons[0];
			await p.clickSectionByPosition(1);
			await p.clickLessonByTitle(targetLesson.title);

			expect(authenticatedPage.url()).toContain('/chu-de/');
		});
	});
}

test.describe('KidsCoursePath - Đối chiếu chéo giữa các khóa học @kids-course-path @regression', () => {

	test('[Happy] Mỗi khóa học có topicTitle khác nhau (không trùng nội dung)', async ({ authenticatedPage }) => {
		const p = new KidsCoursePathPage(authenticatedPage);
		const allFirstTopics: string[] = [];

		for (const course of KIDS_COURSES) {
			await p.open(course.url);
			const items = await p.getSectionItems();
			if (items.length > 0) {
				allFirstTopics.push(items[0].topicTitle);
			}
		}

		expect(allFirstTopics.length).toBeGreaterThan(0);
		expect(new Set(allFirstTopics).size).toBe(allFirstTopics.length);
	});

	test('[Unhappy] URL khóa học không trùng lặp trong cấu hình', async () => {
		const urls = KIDS_COURSES.map((c) => c.url);
		expect(new Set(urls).size).toBe(urls.length);
	});
});