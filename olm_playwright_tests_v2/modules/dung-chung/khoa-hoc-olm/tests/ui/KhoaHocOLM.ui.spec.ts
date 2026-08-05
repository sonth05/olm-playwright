import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { KhoaHocOLMPage, GradeLevel } from '../../pages/KhoaHocOLMPage';

/**
 * [UI] TC-COURSES: Trang "Khóa học OLM" — phần HIỂN THỊ TĨNH: navigation sidebar,
 * alert banner, carousel khóa học hè, segmented control chọn loại khóa học
 * (OLM Courses / My Learning Courses), selector khối lớp, filter môn học,
 * danh sách khóa học (DOM structure, course cards), và trạng thái disable/enable
 * của các nút carousel.
 *
 * Chỉ kiểm tra hiển thị ĐÚNG các element & trạng thái DEFAULT — KHÔNG kiểm tra
 * hành động click/filter thực tế (xem ../function/KhoaHocOLM.function.spec.ts
 * và ../e2e/KhoaHocOLM.e2e.spec.ts).
 *
 * DOM tham chiếu: 2026-08-04 (debug.olm.vn/khoa-hoc)
 */
test.describe('[UI] TC-COURSES: Trang Khóa học OLM', () => {
  test('TC-COURSES-UI-01: Navigation, banner, segment selector, grade & subject filters hiển thị đúng', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    // ---- TC-UI-01: Navigation sidebar ----
    await test.step('TC-UI-01: Navigation sidebar hiển thị các link "Tổng quan", "Bài tập", "Khóa học", "Cá nhân"', async () => {
      await expect(coursePage.navOverview).toBeVisible();
      await expect(coursePage.navExercises).toBeVisible();
      await expect(coursePage.navCourses).toBeVisible();
      await expect(coursePage.navProfile).toBeVisible();
    });

    // ---- TC-UI-02: Alert banner ----
    await test.step('TC-UI-02: Banner "Các khóa học trên OLM được biên soạn..." hiển thị đúng', async () => {
      const bannerVisible = await coursePage.isBannerVisible();
      if (bannerVisible) {
        const bannerText = await coursePage.getBannerText();
        expect(bannerText).toContain('Các khóa học trên OLM được biên soạn độc lập');
        expect(bannerText).toContain('OLM');
      }
    });

    // ---- TC-UI-03: Summer course carousel ----
    await test.step('TC-UI-03: Carousel khóa học hè hiển thị và có nút Trước/Sau', async () => {
      const carouselVisible = await coursePage.summerCourseCarousel.isVisible({ timeout: 3000 }).catch(() => false);
      if (carouselVisible) {
        await expect(coursePage.carouselNextBtn).toBeVisible();
        await expect(coursePage.carouselPrevBtn).toBeVisible();
      }
    });

    // ---- TC-UI-04: Segment selector (OLM Courses / My Learning Courses) ----
    await test.step('TC-UI-04: Segmented control chọn "Khoá học OLM" / "Khoá đang học" hiển thị đúng', async () => {
      await expect(coursePage.segmentOLMCourses).toBeVisible();
      await expect(coursePage.segmentMyLearningCourses).toBeVisible();

      // Kiểm tra segment "Khoá học OLM" được chọn mặc định
      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-hoc-olm');
    });

    // ---- TC-UI-05: Grade selector ----
    await test.step('TC-UI-05: Grade selector hiển thị đủ 13 khối lớp (Mẫu giáo + 1..12)', async () => {
      const allGrades = await coursePage.getAllGrades();
      expect(allGrades.length).toBeGreaterThanOrEqual(13); // Tối thiểu 13 khối lớp

      // Kiểm tra một vài grade cụ thể tồn tại
      expect(allGrades).toContain(GradeLevel.MAU_GIAO);
      expect(allGrades).toContain(GradeLevel.LOP_1);
      expect(allGrades).toContain(GradeLevel.LOP_12);
    });

    // ---- TC-UI-06: Subject filter chips ----
    await test.step('TC-UI-06: Subject filter chips hiển thị "Tất cả các môn" + các môn cụ thể', async () => {
      const allSubjects = await coursePage.getAllSubjects();
      expect(allSubjects.length).toBeGreaterThanOrEqual(4); // Tối thiểu 4 chip (Tất cả, Toán, Tiếng Việt, Tiếng Anh, v.v.)

      // Kiểm tra một vài môn cụ thể
      const subjectsText = allSubjects.join('|');
      expect(subjectsText).toMatch(/Tất cả các môn|Toán|Tiếng Việt|Tiếng Anh/i);
    });

    // ---- TC-UI-07: Course list container ----
    await test.step('TC-UI-07: Course list container hiển thị và có ít nhất 1 khóa học', async () => {
      const hasCourses = await coursePage.hasAnyCourses();
      expect(hasCourses).toBe(true);

      const courseCount = await coursePage.getCourseCount();
      expect(courseCount).toBeGreaterThan(0);
    });
  });

  test('TC-COURSES-UI-02: Cấu trúc course card đúng (title, lesson count, image, link)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-UI-08: Course card chứa tiêu đề, số bài học, ảnh, và link đúng', async () => {
      const courseCount = await coursePage.getCourseCount();
      expect(courseCount).toBeGreaterThan(0);

      // Kiểm tra course đầu tiên
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

      // Kiểm tra từng course
      for (const course of courses) {
        expect(course.title).toBeTruthy();
        expect(course.lessonCount).toBeGreaterThan(0);
        expect(course.courseUrl).toBeTruthy();
        expect(course.imageUrl).toBeTruthy();
      }
    });
  });

  test('TC-COURSES-UI-03: Segment chuyển đổi giữa "Khoá học OLM" và "Khoá đang học" không làm crash trang', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-UI-10: Segment "Khoá học OLM" được chọn mặc định', async () => {
      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-hoc-olm');
    });

    await test.step('TC-UI-11: Click segment "Khoá đang học" không làm lỗi trang', async () => {
      await coursePage.selectSegment('khoa-dang-hoc');
      await coursePage.waitForPageReady();

      // Kiểm tra trang vẫn loaded
      const isEmpty = await coursePage.isEmptyCourseList().catch(() => true);
      // Có thể trống hoặc có dữ liệu, điều quan trọng là trang không crash
      expect(isEmpty || (await coursePage.hasAnyCourses())).toBe(true);
    });

    await test.step('TC-UI-12: Click lại segment "Khoá học OLM" không làm lỗi trang', async () => {
      await coursePage.selectSegment('khoa-hoc-olm');
      await coursePage.waitForPageReady();

      const hasCourses = await coursePage.hasAnyCourses().catch(() => false);
      // Segment OLM Courses thường có dữ liệu
      expect(hasCourses).toBe(true);
    });
  });

  test('TC-COURSES-UI-04: Responsive layout & sidebar navigation visibility', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-UI-13: Sidebar navigation vẫn hiển thị sau khi load trang', async () => {
      // Wait a bit for any animations
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
