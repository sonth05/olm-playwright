import { expect } from '@playwright/test';
import { test } from '../../../../../fixtures/auth.fixture';
import { KidsCoursePathPage } from '../../pages/KidsCoursePathPage';
import { KIDS_COURSES } from '../../../../../config/config';

test.describe('KidsCoursePath - Đối chiếu chéo giữa các khóa học @kids-zone', () => {

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
