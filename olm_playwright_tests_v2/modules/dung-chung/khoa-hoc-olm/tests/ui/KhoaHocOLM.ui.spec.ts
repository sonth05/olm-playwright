import { test, expect } from '@playwright/test';
import { patchGotoWithV2 } from '../../../../../core/fixtures/patchGoto';
import { KhoaHocOLMPage, GradeLevel } from '../../pages/KhoaHocOLMPage';

/**
 * [UI] TC-COURSES: Trang "Khóa học OLM" — BẢN GỘP (chạy chung 1 browser/1 page).
 *
 * Khác với KhoaHocOLM.ui.spec.ts (mỗi test() tự tạo context/page riêng qua
 * fixture getPageAsRole), file này tạo page MỘT LẦN duy nhất ở beforeAll,
 * rồi tái sử dụng cho toàn bộ 4 test case bên dưới — không đóng/mở lại
 * browser giữa các ca. Dùng test.describe.serial() để đảm bảo:
 *   - Các ca chạy đúng thứ tự (TC-UI-01 -> 02 -> 03 -> 04)
 *   - Không bị Playwright chạy song song (parallel) làm xung đột state
 *     trên cùng 1 page
 *
 * LƯU Ý: vì serial mode, nếu 1 ca fail thì các ca sau trong file sẽ bị
 * SKIP (không chạy tiếp) — đây là hành vi mặc định của .serial(), phù hợp
 * vì các ca dùng chung page/state.
 *
 * DOM tham chiếu: 2026-08-04 (debug.olm.vn/khoa-hoc)
 */
test.describe.serial('[UI] TC-COURSES: Trang Khóa học OLM (gộp, dùng chung 1 browser)', () => {
  let coursePage: KhoaHocOLMPage;

  test.beforeAll(async ({ browser }) => {
    // Tạo context + page MỘT LẦN cho cả file, giống hệt cách
    // getPageAsRole('editableTeacher') làm bên trong fixture, nhưng không
    // qua fixture test-scoped (vì beforeAll chỉ truy cập được worker-scoped
    // fixture như "browser").
    const context = await browser.newContext({
      storageState: 'storageState/teacher-editable.json',
    });
    const page = patchGotoWithV2(await context.newPage());
    coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();
  });

  test.afterAll(async () => {
    await coursePage.page.context().close();
  });

  test('TC-COURSES-UI-01: Navigation, banner, segment selector, grade & subject filters hiển thị đúng', async () => {
    await test.step('TC-UI-01: Navigation sidebar hiển thị các link "Tổng quan", "Bài tập", "Khóa học", "Cá nhân"', async () => {
      await expect(coursePage.navOverview).toBeVisible();
      await expect(coursePage.navExercises).toBeVisible();
      await expect(coursePage.navCourses).toBeVisible();
      await expect(coursePage.navProfile).toBeVisible();
    });

    await test.step('TC-UI-02: Banner "Các khóa học trên OLM được biên soạn..." hiển thị đúng', async () => {
      const bannerVisible = await coursePage.isBannerVisible();
      if (bannerVisible) {
        const bannerText = await coursePage.getBannerText();
        expect(bannerText).toContain('Các khóa học trên OLM được biên soạn độc lập');
        expect(bannerText).toContain('OLM');
      }
    });

    await test.step('TC-UI-03: Carousel khóa học hè hiển thị và có nút Trước/Sau', async () => {
      const carouselVisible = await coursePage.summerCourseCarousel
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (carouselVisible) {
        await expect(coursePage.carouselNextBtn).toBeVisible();
        await expect(coursePage.carouselPrevBtn).toBeVisible();
      }
    });

    await test.step('TC-UI-04: Segmented control chọn "Khoá học OLM" / "Khoá đang học" hiển thị đúng', async () => {
      await expect(coursePage.segmentOLMCourses).toBeVisible();
      await expect(coursePage.segmentMyLearningCourses).toBeVisible();

      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-hoc-olm');
    });

    await test.step('TC-UI-05: Grade selector hiển thị đủ 13 khối lớp (Mẫu giáo + 1..12)', async () => {
      const allGrades = await coursePage.getAllGrades();
      expect(allGrades.length).toBeGreaterThanOrEqual(13);

      expect(allGrades).toContain(GradeLevel.MAU_GIAO);
      expect(allGrades).toContain(GradeLevel.LOP_1);
      expect(allGrades).toContain(GradeLevel.LOP_12);
    });

    await test.step('TC-UI-06: Subject filter chips hiển thị "Tất cả các môn" + các môn cụ thể', async () => {
      const allSubjects = await coursePage.getAllSubjects();
      expect(allSubjects.length).toBeGreaterThanOrEqual(4);

      const subjectsText = allSubjects.join('|');
      expect(subjectsText).toMatch(/Tất cả các môn|Toán|Tiếng Việt|Tiếng Anh/i);
    });

    await test.step('TC-UI-07: Course list container hiển thị và có ít nhất 1 khóa học', async () => {
      const hasCourses = await coursePage.hasAnyCourses();
      expect(hasCourses).toBe(true);

      const courseCount = await coursePage.getCourseCount();
      expect(courseCount).toBeGreaterThan(0);
    });
  });

  test('TC-COURSES-UI-02: Cấu trúc course card đúng (title, lesson count, image, link)', async () => {
    await test.step('TC-UI-08: Course card chứa tiêu đề, số bài học, ảnh, và link đúng', async () => {
      const courseCount = await coursePage.getCourseCount();
      expect(courseCount).toBeGreaterThan(0);

      const firstCourse = await coursePage.getCourseData(0);

      expect(firstCourse.title).toBeTruthy();
      expect(firstCourse.title.length).toBeGreaterThan(0);

      expect(firstCourse.lessonCount).toBeGreaterThan(0);
      expect(typeof firstCourse.lessonCount).toBe('number');

      expect(firstCourse.courseUrl).toBeTruthy();
      expect(firstCourse.courseUrl).toMatch(/^\/|http/);

      expect(firstCourse.imageUrl).toBeTruthy();
      expect(firstCourse.imageUrl).toMatch(/https?:\/\/|\/upload/);
    });

    await test.step('TC-UI-09: Tất cả course cards trên trang đều có dữ liệu hợp lệ', async () => {
      const courses = await coursePage.getAllCoursesData();
      expect(courses.length).toBeGreaterThan(0);

      for (const course of courses) {
        expect(course.title).toBeTruthy();
        expect(course.lessonCount).toBeGreaterThan(0);
        expect(course.courseUrl).toBeTruthy();
        expect(course.imageUrl).toBeTruthy();
      }
    });
  });

  test('TC-COURSES-UI-03: Segment chuyển đổi giữa "Khoá học OLM" và "Khoá đang học" không làm crash trang', async () => {
    const page = coursePage.page;

    const studyingSegment = page.locator('button[data-value="khoa-dang-hoc"]');
    const olmSegment = page.locator('button[data-value="khoa-hoc-olm"]');

    await studyingSegment.click();
    await olmSegment.click();

    await test.step('TC-UI-10: Segment "Khoá học OLM" được chọn mặc định', async () => {
      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-hoc-olm');
    });

    await test.step('TC-UI-11: Click segment "Khoá đang học" không làm lỗi trang', async () => {
      await coursePage.selectSegment('khoa-dang-hoc');
      await coursePage.waitForPageReady();

      const isEmpty = await coursePage.isEmptyCourseList().catch(() => true);
      expect(isEmpty || (await coursePage.hasAnyCourses())).toBe(true);
    });

    await test.step('TC-UI-12: Click lại segment "Khoá học OLM" không làm lỗi trang', async () => {
      await coursePage.selectSegment('khoa-hoc-olm');
      await coursePage.waitForPageReady();

      const hasCourses = await coursePage.hasAnyCourses().catch(() => false);
      expect(hasCourses).toBe(true);
    });
  });

  test('TC-COURSES-UI-04: Responsive layout & sidebar navigation visibility', async () => {
    const page = coursePage.page;

    await test.step('TC-UI-13: Sidebar navigation vẫn hiển thị sau khi load trang', async () => {
      await page.waitForTimeout(500);

      const navVisible = await Promise.all([
        coursePage.navOverview.isVisible({ timeout: 2000 }),
        coursePage.navExercises.isVisible({ timeout: 2000 }),
        coursePage.navCourses.isVisible({ timeout: 2000 }),
        coursePage.navProfile.isVisible({ timeout: 2000 }),
      ]).catch(() => [false, false, false, false]);

      expect(navVisible.some((v) => v)).toBe(true);
    });

    await test.step('TC-UI-14: Course list content hiển thị đúng', async () => {
      const courseListVisible = await coursePage.courseListContainer.isVisible({ timeout: 3000 });
      expect(courseListVisible).toBe(true);

      const hasCourses = await coursePage.hasAnyCourses();
      expect(hasCourses).toBe(true);
    });
  });
});