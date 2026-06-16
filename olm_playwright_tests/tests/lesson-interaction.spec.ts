import { test, expect } from '@playwright/test';
import { CoursePage } from '../src/pages/CoursePage';
import { LessonPage } from '../src/pages/LessonPage';
import { SAMPLE_COURSE_URLS, SAMPLE_LESSON_URLS } from '../src/config/testData';

test.describe('Lesson interaction @navigation @regression', () => {
  test('Trang khóa học có tiêu đề @smoke', async ({ page }) => {
    const coursePage = new CoursePage(page);
    await coursePage.open(SAMPLE_COURSE_URLS[1]);
    const title = await coursePage.getTitle();
    expect(title).toBeTruthy();
  });

  test('Lấy danh sách bài học', async ({ page }) => {
    const coursePage = new CoursePage(page);
    await coursePage.open(SAMPLE_COURSE_URLS[1]);
    const lessons = await coursePage.getLessons();
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons[0].lesson_title).toBeTruthy();
    expect(lessons[0].lesson_url).toBeTruthy();
  });

  test('Chiết xuất link bài tập', async ({ page }) => {
    const lessonPage = new LessonPage(page);
    await lessonPage.open(SAMPLE_LESSON_URLS[1]);
    expect(lessonPage.isPageLoaded()).toBeTruthy();
    const exerciseLinks = await lessonPage.getExerciseLinks();
    expect(Array.isArray(exerciseLinks)).toBeTruthy();
  });
});
