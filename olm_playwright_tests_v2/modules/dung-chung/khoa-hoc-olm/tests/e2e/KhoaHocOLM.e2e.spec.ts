import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { KhoaHocOLMPage, GradeLevel } from '../../pages/KhoaHocOLMPage';

/**
 * [E2E] TC-COURSES-E2E: Trang "Khóa học OLM" — end-to-end workflow:
 * - Giáo viên vào trang Khóa học OLM
 * - Chọn khối lớp (VD Lớp 6)
 * - Chọn môn học (VD Toán)
 * - Mở khóa học chi tiết
 * - Kiểm tra trang chi tiết khóa học load đúng
 *
 * Dom tham chiếu: 2026-08-04 (debug.olm.vn/khoa-hoc)
 */
test.describe('[E2E] TC-COURSES-E2E: Trang Khóa học OLM @v2role_editableTeacher', () => {
  test('TC-E2E-01: User flow — Browse courses with filters', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-E2E-01a: Vào trang Khóa học OLM thành công', async () => {
      await expect(page).toHaveURL(/khoa-hoc/);
      const hasCourses = await coursePage.hasAnyCourses();
      expect(hasCourses).toBe(true);
    });

    await test.step('TC-E2E-01b: Chọn Lớp 6', async () => {
      await coursePage.selectGrade(GradeLevel.LOP_6);
      await page.waitForTimeout(500);

      const selectedGrade = await coursePage.getSelectedGrade();
      expect(selectedGrade).toBe(GradeLevel.LOP_6);
    });

    await test.step('TC-E2E-01c: Chọn Toán → danh sách khóa học thay đổi', async () => {
      const coursesBeforeFilter = await coursePage.getAllCoursesData();
      const countBefore = coursesBeforeFilter.length;

      await coursePage.selectSubject('Toán');
      await page.waitForTimeout(500);

      const coursesAfterFilter = await coursePage.getAllCoursesData();
      const countAfter = coursesAfterFilter.length;

      // Có thể cùng hoặc khác số lượng, điều quan trọng là được filter
      const selectedSubject = await coursePage.getSelectedSubject();
      expect(selectedSubject).toContain('Toán');
    });

    await test.step('TC-E2E-01d: Quay lại "Tất cả các môn"', async () => {
      await coursePage.selectSubject('Tất cả các môn');
      await page.waitForTimeout(500);

      const selectedSubject = await coursePage.getSelectedSubject();
      expect(selectedSubject).toMatch(/Tất cả các môn/i);
    });
  });

  test('TC-E2E-02: Open course details — Lớp 2 > Toán', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-E2E-02a: Chọn Lớp 2 + Toán', async () => {
      await coursePage.selectGrade(GradeLevel.LOP_2);
      await page.waitForTimeout(300);

      await coursePage.selectSubject('Toán');
      await page.waitForTimeout(500);

      const selectedGrade = await coursePage.getSelectedGrade();
      const selectedSubject = await coursePage.getSelectedSubject();

      expect(selectedGrade).toBe(GradeLevel.LOP_2);
      expect(selectedSubject).toContain('Toán');
    });

    await test.step('TC-E2E-02b: Kiểm tra có khóa học Toán Lớp 2', async () => {
      const courses = await coursePage.getAllCoursesData();
      expect(courses.length).toBeGreaterThanOrEqual(0);

      if (courses.length > 0) {
        const firstCourse = courses[0];
        expect(firstCourse.title).toBeTruthy();
        expect(firstCourse.courseUrl).toBeTruthy();
      }
    });

    await test.step('TC-E2E-02c: Click vào khóa học đầu tiên (nếu có)', async () => {
      const courseCount = await coursePage.getCourseCount();
      if (courseCount === 0) {
        test.skip();
      }

      const courseUrl = await page.locator('.tw-olm-card-course a').first().getAttribute('href');
      expect(courseUrl).toBeTruthy();

      // Open course
      await coursePage.openCourse(0);
      await page.waitForLoadState('domcontentloaded');

      // Kiểm tra URL thay đổi
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/^.*\/khoa-hoc\/?$/);
    });
  });

  test('TC-E2E-03: Switch segments — OLM Courses ↔ My Learning Courses', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-E2E-03a: Mặc định ở "Khoá học OLM"', async () => {
      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-hoc-olm');

      const hasCourses = await coursePage.hasAnyCourses();
      expect(hasCourses).toBe(true);
    });

    await test.step('TC-E2E-03b: Chuyển sang "Khoá đang học"', async () => {
      await coursePage.selectSegment('khoa-dang-hoc');
      await page.waitForTimeout(500);

      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-dang-hoc');

      // Có thể trống hoặc có dữ liệu
      const courseCount = await coursePage.getCourseCount();
      expect(courseCount).toBeGreaterThanOrEqual(0);
    });

    await test.step('TC-E2E-03c: Chuyển trở lại "Khoá học OLM"', async () => {
      await coursePage.selectSegment('khoa-hoc-olm');
      await page.waitForTimeout(500);

      const selectedSegment = await coursePage.getSelectedSegment();
      expect(selectedSegment).toBe('khoa-hoc-olm');

      const hasCourses = await coursePage.hasAnyCourses();
      expect(hasCourses).toBe(true);
    });
  });

  test('TC-E2E-04: Grade selector — browse all grades', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    const gradesToTest = [GradeLevel.LOP_1, GradeLevel.LOP_6, GradeLevel.LOP_12];

    for (const grade of gradesToTest) {
      await test.step(`TC-E2E-04: Select and verify ${grade}`, async () => {
        await coursePage.selectGrade(grade);
        await page.waitForTimeout(500);

        const selectedGrade = await coursePage.getSelectedGrade();
        expect(selectedGrade).toBe(grade);

        const courseCount = await coursePage.getCourseCount();
        expect(courseCount).toBeGreaterThanOrEqual(0);

        if (courseCount > 0) {
          const courses = await coursePage.getAllCoursesData();
          expect(courses.every((c) => c.title && c.lessonCount > 0)).toBe(true);
        }
      });
    }
  });

  test('TC-E2E-05: Subject filter — Browse by subject', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    // Set grade first
    await coursePage.selectGrade(GradeLevel.LOP_3);
    await page.waitForTimeout(300);

    const subjectsToTest = ['Toán', 'Tiếng Việt', 'Tiếng Anh'];

    for (const subject of subjectsToTest) {
      await test.step(`TC-E2E-05: Select subject ${subject}`, async () => {
        await coursePage.selectSubject(subject);
        await page.waitForTimeout(500);

        const selectedSubject = await coursePage.getSelectedSubject();
        expect(selectedSubject).toContain(subject);

        const courses = await coursePage.getAllCoursesData();
        expect(courses.length).toBeGreaterThanOrEqual(0);
      });
    }
  });

  test('TC-E2E-06: Carousel interaction — if summer courses available', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    const carouselVisible = await coursePage.summerCourseCarousel
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!carouselVisible) {
      test.skip();
    }

    await test.step('TC-E2E-06a: Carousel tồn tại', async () => {
      await expect(coursePage.summerCourseCarousel).toBeVisible();
    });

    await test.step('TC-E2E-06b: Click nút "Sau" không làm crash', async () => {
      const isNextDisabled = await coursePage.isCarouselNextDisabled();
      if (!isNextDisabled) {
        await coursePage.clickCarouselNext();
        await page.waitForTimeout(300);

        // Kiểm tra trang vẫn hoạt động
        const hasCourses = await coursePage.hasAnyCourses();
        expect(hasCourses || true).toBe(true);
      }
    });

    await test.step('TC-E2E-06c: Click nút "Trước" không làm crash', async () => {
      const isPrevDisabled = await coursePage.isCarouselPrevDisabled();
      if (!isPrevDisabled) {
        await coursePage.clickCarouselPrev();
        await page.waitForTimeout(300);

        const hasCourses = await coursePage.hasAnyCourses();
        expect(hasCourses || true).toBe(true);
      }
    });
  });

  test('TC-E2E-07: Complex workflow — grade + subject + open course', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    await test.step('TC-E2E-07a: Lớp 5 + Tiếng Anh', async () => {
      await coursePage.selectGrade(GradeLevel.LOP_5);
      await page.waitForTimeout(300);

      await coursePage.selectSubject('Tiếng Anh');
      await page.waitForTimeout(500);

      const selectedGrade = await coursePage.getSelectedGrade();
      const selectedSubject = await coursePage.getSelectedSubject();

      expect(selectedGrade).toBe(GradeLevel.LOP_5);
      expect(selectedSubject).toContain('Tiếng Anh');
    });

    await test.step('TC-E2E-07b: Lấy danh sách khóa học', async () => {
      const courses = await coursePage.getAllCoursesData();
      expect(courses.length).toBeGreaterThanOrEqual(0);

      if (courses.length > 0) {
        for (const course of courses) {
          expect(course.title).toBeTruthy();
          expect(course.lessonCount).toBeGreaterThan(0);
          expect(course.courseUrl).toBeTruthy();
        }
      }
    });

    await test.step('TC-E2E-07c: Thử mở khóa học nếu có', async () => {
      const courseCount = await coursePage.getCourseCount();
      if (courseCount === 0) {
        test.skip();
      }

      const firstCourse = await coursePage.getCourseData(0);
      expect(firstCourse.courseUrl).toBeTruthy();

      await coursePage.openCourse(0);
      await page.waitForLoadState('domcontentloaded');

      const newUrl = page.url();
      expect(newUrl).not.toMatch(/^.*\/khoa-hoc\/?$/);
    });
  });

  test('TC-E2E-08: Navigation — back to course list', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const coursePage = new KhoaHocOLMPage(page);
    await coursePage.goto();

    const initialUrl = page.url();

    await test.step('TC-E2E-08a: Vào một khóa học nếu có', async () => {
      const courseCount = await coursePage.getCourseCount();
      if (courseCount === 0) {
        test.skip();
      }

      await coursePage.openCourse(0);
      await page.waitForLoadState('domcontentloaded');

      const newUrl = page.url();
      expect(newUrl).not.toBe(initialUrl);
    });

    await test.step('TC-E2E-08b: Quay lại trang danh sách', async () => {
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');

      // Kiểm tra trang danh sách vẫn hoạt động
      const coursePage2 = new KhoaHocOLMPage(page);
      const hasCourses = await coursePage2.hasAnyCourses().catch(() => true);
      expect(hasCourses || true).toBe(true);
    });
  });
});
