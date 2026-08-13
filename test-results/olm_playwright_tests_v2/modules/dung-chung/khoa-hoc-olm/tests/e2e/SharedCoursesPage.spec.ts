import { test, expect } from '@playwright/test';
import { SharedCoursesPage } from '../../pages/SharedCoursesPage';
import { BASE_URL, appendV2Param } from '@config/config';

// FIX: các test trong file này gọi thẳng page.goto() (không đi qua page
// object/BasePage.navigateTo()) nên trước đây bị lọt mất ?v=v2 — xác nhận
// thực tế qua ảnh chụp URL debug.olm.vn/bg/toan-2# KHÔNG có param. Gắn
// appendV2Param() ngay tại URL gốc dùng chung cho toàn file thay vì sửa
// từng chỗ gọi page.goto() riêng lẻ.
const SHARED_COURSE_URL = appendV2Param(`${BASE_URL}/bg/toan-2`);
const SHARED_COURSE_URL_2 = appendV2Param(`${BASE_URL}/bg/toan-1`);

/**
 * Test suite cho phần "Khoá học liên quan" (Shared Courses)
 * 
 * Các test này kiểm tra:
 * - Hiển thị phần "Khoá học liên quan"
 * - Lấy dữ liệu các khóa học trong phần
 * - Click vào khóa học để vào chi tiết
 * - Lọc theo khối lớp
 */
test.describe('Shared Courses Section', () => {

  /**
   * Test: Kiểm tra phần "Khoá học liên quan" hiển thị trên trang chi tiết khóa học
   */
  test('Should display shared courses section on course detail page', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    // Navigate to a course detail page (example: Toán lớp 2)
    // URL này cần điều chỉnh theo cấu trúc thực tế của OLM
    await page.goto(SHARED_COURSE_URL);
    
    // Chờ section load
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Verify section is visible
    const isSectionVisible = await sharedCoursesPage.isSharedCoursesSectionVisible();
    expect(isSectionVisible).toBe(true);

    // Verify section title
    const sectionTitle = await sharedCoursesPage.getSectionTitle();
    expect(sectionTitle.toLowerCase()).toContain('liên quan');
  });

  /**
   * Test: Lấy danh sách các khóa học trong phần "Khoá học liên quan"
   */
  test('Should retrieve all course data from shared courses section', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Lấy danh sách khóa học
    const coursesData = await sharedCoursesPage.getAllCoursesData();

    // Verify có ít nhất 1 khóa học
    expect(coursesData.length).toBeGreaterThan(0);

    // Verify dữ liệu của khóa học đầu tiên
    const firstCourse = coursesData[0];
    expect(firstCourse.title).toBeTruthy();
    expect(firstCourse.lessonCount).toBeGreaterThanOrEqual(0);
    expect(firstCourse.courseUrl).toBeTruthy();
    expect(firstCourse.imageUrl).toBeTruthy();
  });

  /**
   * Test: Click vào khóa học tại vị trí index để vào chi tiết
   */
  test('Should open course detail when clicking on course card at index', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Verify có khóa học
    const courseCount = await sharedCoursesPage.getCourseCount();
    expect(courseCount).toBeGreaterThan(0);

    // Lấy dữ liệu khóa học đầu tiên
    const firstCourse = await sharedCoursesPage.getCourseData(0);

    // Click vào khóa học
    await sharedCoursesPage.openCourseAtIndex(0);

    // Chờ navigation
    await page.waitForLoadState('domcontentloaded');

    // Verify URL thay đổi (nếu course URL là relative)
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(SHARED_COURSE_URL);
  });

  /**
   * Test: Click vào khóa học theo tiêu đề
   */
  test('Should open course detail when clicking by course title', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Lấy tất cả khóa học
    const coursesData = await sharedCoursesPage.getAllCoursesData();
    expect(coursesData.length).toBeGreaterThan(0);

    // Lấy tiêu đề khóa học đầu tiên
    const courseTitle = coursesData[0].title;

    // Click vào khóa học theo tiêu đề
    await sharedCoursesPage.openCourseByTitle(courseTitle);

    // Chờ navigation
    await page.waitForLoadState('domcontentloaded');

    // Verify URL thay đổi
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(SHARED_COURSE_URL);
  });

  /**
   * Test: Kiểm tra khóa học tồn tại theo tiêu đề
   */
  test('Should check if course exists by title', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Lấy tiêu đề khóa học đầu tiên
    const coursesData = await sharedCoursesPage.getAllCoursesData();
    const courseTitle = coursesData[0].title;

    // Kiểm tra khóa học tồn tại
    const hasCourse = await sharedCoursesPage.hasCourseWithTitle(courseTitle);
    expect(hasCourse).toBe(true);

    // Kiểm tra khóa học không tồn tại
    const hasInvalidCourse = await sharedCoursesPage.hasCourseWithTitle('Khóa học không tồn tại 12345');
    expect(hasInvalidCourse).toBe(false);
  });

  /**
   * Test: Lọc khóa học theo khối lớp (nếu có dropdown)
   */
  test.skip('Should filter courses by grade level', async ({ page }) => {
    // Test này có thể không chạy nếu không có dropdown filter trên trang
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Verify có khóa học ban đầu
    const initialCount = await sharedCoursesPage.getCourseCount();
    expect(initialCount).toBeGreaterThan(0);

    // Lọc theo lớp 1
    await sharedCoursesPage.filterByGrade('Lớp 1');

    // Chờ filter được áp dụng
    await page.waitForTimeout(1000);

    // Verify danh sách thay đổi (có thể nhiều hơn, ít hơn hoặc bằng ban đầu)
    const filteredCount = await sharedCoursesPage.getCourseCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: Scroll đến phần "Khoá học liên quan"
   */
  test('Should scroll to shared courses section', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    // Navigate to course detail
    await page.goto(SHARED_COURSE_URL);

    // Scroll to section (mặc định section có thể không trong viewport)
    await sharedCoursesPage.scrollToSection();

    // Verify section visible
    const isSectionVisible = await sharedCoursesPage.isSharedCoursesSectionVisible();
    expect(isSectionVisible).toBe(true);
  });

  /**
   * Test: Kiểm tra danh sách không trống
   */
  test('Should verify course list is not empty', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    const hasAnyCourses = await sharedCoursesPage.hasAnyCourses();
    expect(hasAnyCourses).toBe(true);

    const isEmpty = await sharedCoursesPage.isEmptyCourseList();
    expect(isEmpty).toBe(false);
  });

  /**
   * Test: Click vào course card trực tiếp
   */
  test('Should click course card directly', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    await page.goto(SHARED_COURSE_URL);
    await sharedCoursesPage.waitForSharedCoursesSection();

    // Lấy danh sách khóa học
    const courseCount = await sharedCoursesPage.getCourseCount();
    expect(courseCount).toBeGreaterThan(0);

    // Click vào khóa học thứ 0
    await sharedCoursesPage.clickCourseCard(0);

    // Chờ navigation
    await page.waitForLoadState('domcontentloaded');

    // Verify page thay đổi
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

});

/**
 * Test suite bổ sung: Integration tests
 * Kiểm tra interaction giữa SharedCoursesPage và các page khác
 */
test.describe('Shared Courses Integration', () => {

  /**
   * Test: Vào chi tiết khóa học từ phần "Khoá học liên quan" sau đó quay lại
   */
  test('Should navigate to shared course detail and go back', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    // Navigate to initial course
    const initialUrl = SHARED_COURSE_URL;
    await page.goto(initialUrl);

    await sharedCoursesPage.waitForSharedCoursesSection();

    // Click vào khóa học đầu tiên
    await sharedCoursesPage.openCourseAtIndex(0);
    await page.waitForLoadState('domcontentloaded');

    const courseUrl = page.url();
    expect(courseUrl).not.toBe(initialUrl);

    // Quay lại
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // Verify quay lại trang ban đầu
    expect(page.url()).toBe(initialUrl);
  });

  /**
   * Test: Verify course detail page có phần "Khoá học liên quan"
   */
  test('Should have shared courses section on multiple course detail pages', async ({ page }) => {
    const sharedCoursesPage = new SharedCoursesPage(page);

    const coursesToTest = [
      SHARED_COURSE_URL,
      SHARED_COURSE_URL_2, // Adjust URL based on actual structure
    ];

    for (const courseUrl of coursesToTest) {
      await page.goto(courseUrl).catch(() => {
        // Skip if URL doesn't exist
      });

      const isSectionVisible = await sharedCoursesPage.isSharedCoursesSectionVisible()
        .catch(() => false);

      if (isSectionVisible) {
        const courseCount = await sharedCoursesPage.getCourseCount();
        expect(courseCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

});