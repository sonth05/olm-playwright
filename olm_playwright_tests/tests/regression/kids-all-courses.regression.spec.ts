/**
 * kids-all-courses.regression.spec.ts
 *
 * Regression test loop qua TẤT CẢ khóa học Mẫu giáo OLM Kids
 * (Toán, Tiếng Anh, Tiếng Việt, Chương trình 5 tuổi, Chương trình 3-4 tuổi).
 *
 * Mục đích: đảm bảo MỌI khóa học đều dùng chung 1 cấu trúc lộ trình
 * (.section-item + data-categories) hợp lệ — không chỉ riêng Toán Mẫu giáo.
 *
 * Coverage cho từng khóa học:
 *  - Trang lộ trình load thành công, URL đúng
 *  - Có ít nhất 1 node (.section-item) trên lộ trình
 *  - data-id của các node không trùng lặp
 *  - Mỗi node có data-categories parse được, mỗi bài học có title/url hợp lệ
 *  - Click node đầu tiên → popup hiển thị đủ số bài học khớp data-categories
 *  - Click 1 bài học cụ thể điều hướng đúng URL /chu-de/...
 *
 * Lưu ý: các test này lặp qua KIDS_COURSES nên tổng thời gian chạy sẽ dài hơn
 * (5 khóa x nhiều bước). Có thể tách riêng vào 1 project/tag để chạy
 * nightly thay vì mỗi lần regression thông thường nếu cần tối ưu tốc độ.
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { KidsCoursePathPage } from '../../pages/KidsCoursePathPage';
import { KIDS_COURSES } from '../../config/config';

for (const course of KIDS_COURSES) {
  test.describe(`KidsCoursePath - "${course.name}" @kids-course-path @regression`, () => {

    // ── Page load ────────────────────────────────────────────────────────

    test(`[Happy] "${course.name}" load thành công`, async ({ authenticatedPage }) => {
      const p = new KidsCoursePathPage(authenticatedPage);
      await p.open(course.url);

      expect(p.isPageLoaded()).toBeTruthy();
      expect(authenticatedPage.url()).not.toContain('dangnhap');
    });

    // ── Section items (node lộ trình) ───────────────────────────────────

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

    // ── Click node → popup bài học ──────────────────────────────────────

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
      test.skip(
        items.length === 0 || items[0].lessons.length === 0,
        `Khóa "${course.name}" không có bài học để click`
      );

      const targetLesson = items[0].lessons[0];
      await p.clickSectionByPosition(1);
      await p.clickLessonByTitle(targetLesson.title);

      expect(authenticatedPage.url()).toContain('/chu-de/');
    });
  });
}

// =============================================================================
// Tổng hợp: đối chiếu chéo giữa các khóa học
// =============================================================================

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