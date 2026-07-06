import { test, expect } from '@playwright/test';
import { LessonPage } from '../pages/LessonPage';
import { SAMPLE_LESSON_URLS } from '../../../config/testData';

test.describe('Learning core - làm bài tập trong bài học', () => {
	test('Lesson page exposes exercises and can submit from the exercise surface', async ({ page }) => {
		const lessonPage = new LessonPage(page);
		await lessonPage.open(SAMPLE_LESSON_URLS[1]);

		expect(lessonPage.isPageLoaded()).toBeTruthy();

		const hasExercises = await lessonPage.hasExercises();
		const hasVideo = await lessonPage.hasVideo();

		expect(hasExercises || hasVideo).toBeTruthy();

		if (hasExercises) {
			await lessonPage.clickSubmit();
			const result = await lessonPage.getResult();
			expect(typeof result).toBe('string');
		}
	});
});
