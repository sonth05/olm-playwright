import { test, expect } from '@playwright/test';
import { CoursePage } from '../pages/CoursePage';
import { LessonPage } from '../pages/LessonPage';
import { SAMPLE_COURSE_URLS, SAMPLE_LESSON_URLS } from '../../../config/testData';
import { BASE_URL } from '../../../config/config';

test.describe('Lesson interaction @navigation @regression @e2e', () => {
	test('Lấy danh sách môn học (lop-1)', async ({ page }) => {
		const coursePage = new CoursePage(page);
		await coursePage.open(SAMPLE_COURSE_URLS[1]);
		const courses = await coursePage.getCourseCards();
		expect(courses.length).toBeGreaterThan(0);
		expect(courses[0].title).toBeTruthy();
		expect(courses[0].url).toBeTruthy();
	});

	test('Lấy danh sách bài học trong khóa học cụ thể', async ({ page }) => {
		const coursePage = new CoursePage(page);
		await coursePage.open(SAMPLE_COURSE_URLS[1]);
		const courses = await coursePage.getCourseCards();
		expect(courses.length).toBeGreaterThan(0);

		const firstCourseUrl = courses[0].url.startsWith('http')
			? courses[0].url
			: `${BASE_URL}${courses[0].url}`;
		await coursePage.open(firstCourseUrl);
		const lessons = await coursePage.getLessons();
		expect(Array.isArray(lessons)).toBeTruthy();
	});

	test('Chiết xuất link bài tập', async ({ page }) => {
		const lessonPage = new LessonPage(page);
		await lessonPage.open(SAMPLE_LESSON_URLS[1]);
		expect(lessonPage.isPageLoaded()).toBeTruthy();
		const exerciseLinks = await lessonPage.getExerciseLinks();
		expect(Array.isArray(exerciseLinks)).toBeTruthy();
	});
});