import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';
import { dismissPopups, safeClick } from '@core/shared-pages/dismissPopups';

/**
 * Loại khóa học / danh mục
 * "Khoá học OLM" = khóa học do OLM biên soạn
 * "Khoá đang học" = khóa học mà người dùng đang tham gia
 */
export type CourseSegment = 'khoa-hoc-olm' | 'khoa-dang-hoc';

/**
 * Khối lớp / Grade levels cho lọc khóa học
 */
export enum GradeLevel {
  MAU_GIAO = 'lop-mau-giao',
  LOP_1 = 'lop-1',
  LOP_2 = 'lop-2',
  LOP_3 = 'lop-3',
  LOP_4 = 'lop-4',
  LOP_5 = 'lop-5',
  LOP_6 = 'lop-6',
  LOP_7 = 'lop-7',
  LOP_8 = 'lop-8',
  LOP_9 = 'lop-9',
  LOP_10 = 'lop-10',
  LOP_11 = 'lop-11',
  LOP_12 = 'lop-12',
}

/**
 * Môn học / Subject filter chips
 */
export enum SubjectFilter {
  ALL = '/lop-X', // Tất cả các môn (dynamic based on selected grade)
  TOAN = '/lop-X-mon-toan', // Toán
  TIENG_VIET = '/lop-X-tieng-viet', // Tiếng Việt
  TIENG_ANH = '/lop-X-tieng-anh', // Tiếng Anh
  TONG_HOP = '/lop-X-tong-hop-mon', // Các môn khác
}

/**
 * Dữ liệu 1 khóa học trên trang
 */
export interface CourseCardData {
  title: string;
  lessonCount: number;
  courseUrl: string;
  imageUrl: string;
}

/**
 * Page Object — Các khóa học OLM (Courses Page).
 * Hiển thị danh sách khóa học theo khối lớp và môn học, có thể lựa chọn
 * giữa "Khoá học OLM" (khóa học công khai do OLM tạo) và "Khoá đang học"
 * (khóa học mà người dùng đang học). Trang này dùng chung cho cả giáo viên
 * và học sinh.
 *
 * DOM tham chiếu (2026-08-04):
 * - Navigation sidebar (trái): các link "Tổng quan", "Bài tập", "Khóa học", "Cá nhân"
 * - Carousel hè (summer courses) ở trên
 * - Segmented control: chọn "Khoá học OLM" hoặc "Khoá đang học"
 * - Grade selector: các nút chọn khối lớp (Mẫu giáo, 1..12)
 * - Subject filter: chips chọn môn học (Tất cả các môn, Toán, Tiếng Việt, v.v.)
 * - Course list: danh sách khóa học dạng grid với course cards
 */
export class KhoaHocOLMPage extends BasePage {
  readonly page: Page;

  // ---- Navigation Sidebar (trái) ----
  readonly navOverview: Locator; // Tổng quan
  readonly navExercises: Locator; // Bài tập
  readonly navCourses: Locator; // Khóa học (current page)
  readonly navProfile: Locator; // Cá nhân

  // ---- Alert Banner ----
  readonly alertBanner: Locator; // Banner "Các khóa học trên OLM được biên soạn..."

  // ---- Summer Course Carousel ----
  readonly summerCourseCarousel: Locator; // Container carousel hè
  readonly carouselPrevBtn: Locator; // Nút "Trước" (owl-prev)
  readonly carouselNextBtn: Locator; // Nút "Sau" (owl-next)

  // ---- Segment Selector (OLM Courses / My Learning Courses) ----
  readonly segmentOLMCourses: Locator; // "Khoá học OLM"
  readonly segmentMyLearningCourses: Locator; // "Khoá đang học"
  readonly segmentSelector: Locator; // Container chứa cả 2 segment

  // ---- Grade Selector ----
  readonly gradeSelector: Locator; // Container chứa tất cả nút chọn khối lớp
  readonly gradeButtons: Locator; // Tất cả các nút grade

  // ---- Subject Filter Chips ----
  readonly subjectFilterContainer: Locator; // Container chứa các chip môn học
  readonly subjectChips: Locator; // Tất cả các chip môn học

  // ---- Course List ----
  readonly courseListContainer: Locator; // Container danh sách khóa học
  readonly courseCards: Locator; // Tất cả các course card

  // ---- Main Content Area ----
  readonly mainContent: Locator; // Khối nội dung chính

  constructor(page: Page) {
    super(page);
    this.page = page;

    // Navigation sidebar
    this.navOverview = page.getByRole('link', { name: /Tổng quan/i }).first();
    this.navExercises = page.getByRole('link', { name: /Bài tập/i }).first();
    this.navCourses = page.getByRole('link', { name: /Khóa học/i }).first();
    this.navProfile = page.getByRole('link', { name: /Cá nhân/i }).first();

    // Alert banner
    this.alertBanner = page.locator('.tw-alert-olm');

    // Summer course carousel
    this.summerCourseCarousel = page.locator('#summer-course-carousel');
    this.carouselPrevBtn = this.summerCourseCarousel
      .locator('..')
      .locator('.owl-nav')
      .locator('.owl-prev');
    this.carouselNextBtn = this.summerCourseCarousel
      .locator('..')
      .locator('.owl-nav')
      .locator('.owl-next');

    // Segment selector
    this.segmentSelector = page.locator('#segment-select-type-courses');
    this.segmentOLMCourses = this.segmentSelector.getByRole('button', { name: /Khoá học OLM/i });
    this.segmentMyLearningCourses = this.segmentSelector.getByRole('button', {
      name: /Khoá đang học/i,
    });

    // Grade selector
    this.gradeSelector = page.locator('[data-group="grade-select-course"]').first().locator('..').locator('..');
    this.gradeButtons = page.locator('a[data-group="grade-select-course"]');

    // Subject filter chips
    this.subjectFilterContainer = page.locator('.view-course-content-subject');
    this.subjectChips = this.subjectFilterContainer.locator('a[data-group="chip-subject"]');

    // Course list
    this.courseListContainer = page.locator('.course-list');
    this.courseCards = this.courseListContainer.locator('.tw-olm-card-course');

    // Main content
    this.mainContent = page.locator('.main-content');
  }

  /**
   * Vào trang Khóa học OLM
   */
  async goto(_url = '/khoa-hoc') {
    // FIX: dùng this.navigateTo() (BasePage) thay vì this.page.goto() thẳng
    // — để tự động được gắn ?v=v2 qua appendV2Param(), thống nhất với mọi
    // page object khác trong project thay vì tự ý bỏ qua bước đó.
    await this.navigateTo(_url);
    await this.mainContent.waitFor({ state: 'visible' });
    await dismissPopups(this.page);
  }
  // ---- Navigation ----

  async clickNavOverview() {
    await safeClick(this.page, this.navOverview);
  }

  async clickNavExercises() {
    await safeClick(this.page, this.navExercises);
  }

  async clickNavProfile() {
    await safeClick(this.page, this.navProfile);
  }

  // ---- Segment Selector ----

  /**
   * Chuyển đổi giữa "Khoá học OLM" và "Khoá đang học"
   */
  async selectSegment(segment: CourseSegment) {
    const map: Record<CourseSegment, Locator> = {
      'khoa-hoc-olm': this.segmentOLMCourses,
      'khoa-dang-hoc': this.segmentMyLearningCourses,
    };
    await safeClick(this.page, map[segment]);
  }

  /**
   * Kiểm tra segment hiện tại đang được chọn
   */
  async getSelectedSegment(): Promise<CourseSegment> {
    // FIX: '.selected' từng match cả <button> lẫn <span class="selected"> con bên trong
    // (strict mode violation) — thu hẹp về button có data-value để lấy đúng 1 phần tử.
    const selected = await this.segmentSelector
      .locator('button.selected[data-value]')
      .getAttribute('data-value');
    return selected as CourseSegment;
  }

  // ---- Grade Selection ----

  /**
   * Chọn khối lớp theo href
   * VD: selectGrade(GradeLevel.LOP_2) -> click vào link "/lop-2"
   */
  async selectGrade(gradeLevel: GradeLevel) {
    const gradeLink = this.page.locator(`a[href="${gradeLevel}"]`).first();
    await safeClick(this.page, gradeLink);
    await this.courseListContainer.waitFor({ state: 'visible' });
  }

  /**
   * Lấy khối lớp hiện tại đang được chọn (có class "selected")
   */
  async getSelectedGrade(): Promise<string> {
    const selectedGrade = await this.gradeButtons.locator('.selected').first().getAttribute('href');
    return selectedGrade ?? '';
  }

  /**
   * Kiểm tra nút grade có trạng thái selected không
   */
  async isGradeSelected(gradeLevel: GradeLevel): Promise<boolean> {
    const gradeBtn = this.page.locator(`a[href="${gradeLevel}"]`).first();
    const classList = await gradeBtn.getAttribute('class');
    return classList?.includes('selected') ?? false;
  }

  /**
   * Lấy tất cả các grade levels có trong trang
   */
  async getAllGrades(): Promise<GradeLevel[]> {
    const hrefs = await this.gradeButtons.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute('href')).filter((href) => href !== null),
    );
    return hrefs as GradeLevel[];
  }

  // ---- Subject Filter ----

  /**
   * Chọn môn học theo tên chip
   * VD: selectSubject('Toán') hoặc 'Tiếng Việt'
   */
  async selectSubject(subjectName: string) {
    const subjectChip = this.subjectFilterContainer.getByText(subjectName, { exact: true }).first();
    await safeClick(this.page, subjectChip);
    await this.courseListContainer.waitFor({ state: 'visible' });
  }

  /**
   * Lấy chip môn học hiện tại đang được chọn (có class "selected")
   */
  async getSelectedSubject(): Promise<string> {
    const selectedChip = await this.subjectChips.locator('.selected').first().innerText();
    return selectedChip.trim();
  }

  /**
   * Kiểm tra chip môn học có trạng thái selected không
   */
  async isSubjectSelected(subjectName: string): Promise<boolean> {
    const chip = this.subjectFilterContainer.locator(`a:has-text("${subjectName}")`).first();
    const classList = await chip.getAttribute('class');
    return classList?.includes('selected') ?? false;
  }

  /**
   * Lấy tất cả các môn học có trong trang
   */
  async getAllSubjects(): Promise<string[]> {
    return this.subjectChips.allInnerTexts();
  }

  // ---- Summer Course Carousel ----

  /**
   * Click nút "Tiếp theo" trong carousel khóa học hè
   */
  async clickCarouselNext() {
    await safeClick(this.page, this.carouselNextBtn);
  }

  /**
   * Click nút "Trước" trong carousel khóa học hè
   */
  async clickCarouselPrev() {
    await safeClick(this.page, this.carouselPrevBtn);
  }

  /**
   * Kiểm tra nút "Tiếp theo" có bị vô hiệu hoá không
   */
  async isCarouselNextDisabled(): Promise<boolean> {
    const classList = await this.carouselNextBtn.getAttribute('class');
    return classList?.includes('disabled') ?? false;
  }

  /**
   * Kiểm tra nút "Trước" có bị vô hiệu hoá không
   */
  async isCarouselPrevDisabled(): Promise<boolean> {
    const classList = await this.carouselPrevBtn.getAttribute('class');
    return classList?.includes('disabled') ?? false;
  }

  // ---- Course Cards ----

  /**
   * Lấy số lượng khóa học hiển thị trên trang hiện tại
   */
  async getCourseCount(): Promise<number> {
    return this.courseCards.count();
  }

  /**
   * Lấy dữ liệu khóa học tại vị trí index
   */
  async getCourseData(index: number): Promise<CourseCardData> {
    const card = this.courseCards.nth(index);

    const title = await card.locator('.tw-text-xl.tw-font-semibold').innerText();
    // FIX: '.tw-text-content-secondary'.first() trong card khớp nhiều phần tử
    // (mô tả/subtitle lẫn số bài học) nên .first() có thể không phải phần tử
    // chứa số bài học → parseInt ra NaN. Thu hẹp về đúng div nằm cạnh
    // '.card-course-action' (giống cách KhoaHocPage.ts — trang V2 — đã làm),
    // đồng thời dùng regex \d+ thay vì split(' ')[0] để không phụ thuộc thứ
    // tự chữ/số trong chuỗi hiển thị.
    const lessonCountText = await card
      .locator('.card-course-action')
      .locator('..')
      .locator('div.tw-text-content-secondary')
      .first()
      .innerText();
    const lessonCountMatch = lessonCountText.match(/\d+/);
    const lessonCount = lessonCountMatch ? parseInt(lessonCountMatch[0], 10) : 0;
    const courseUrl = await card.locator('a').first().getAttribute('href');
    const imageUrl = await card.locator('img').first().getAttribute('src');

    return {
      title: title.trim(),
      lessonCount,
      courseUrl: courseUrl ?? '',
      imageUrl: imageUrl ?? '',
    };
  }

  /**
   * Lấy dữ liệu tất cả khóa học trên trang hiện tại
   */
  async getAllCoursesData(): Promise<CourseCardData[]> {
    const count = await this.getCourseCount();
    const courses: CourseCardData[] = [];
    for (let i = 0; i < count; i++) {
      courses.push(await this.getCourseData(i));
    }
    return courses;
  }

  /**
   * Tìm khóa học theo tiêu đề chính xác
   */
  getCourseByTitle(title: string): Locator {
    return this.courseListContainer.locator(`a:has-text("${title}")`).first();
  }

  /**
   * Click vào khóa học để mở chi tiết
   */
  async openCourse(courseIndex: number) {
    const course = this.courseCards.nth(courseIndex);
    const link = course.locator('a').first();
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      safeClick(this.page, link),
    ]);
  }

  /**
   * Click vào khóa học theo tiêu đề
   */
  async openCourseByTitle(title: string) {
    const link = this.getCourseByTitle(title);
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      safeClick(this.page, link),
    ]);
  }

  // ---- Alert Banner ----

  /**
   * Kiểm tra banner thông báo có hiển thị không
   */
  async isBannerVisible(): Promise<boolean> {
    return this.alertBanner.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Lấy nội dung text của banner
   */
  async getBannerText(): Promise<string> {
    return this.alertBanner.innerText();
  }

  // ---- Page State Checks ----

  /**
   * Kiểm tra trang đã load xong hay chưa
   */
  async waitForPageReady() {
    await this.mainContent.waitFor({ state: 'visible' });
    await this.courseListContainer.waitFor({ state: 'visible' });
  }

  /**
   * Kiểm tra có khóa học nào hiển thị không
   */
  async hasAnyCourses(): Promise<boolean> {
    const count = await this.getCourseCount();
    return count > 0;
  }

  /**
   * Kiểm tra danh sách khóa học trống (không có khóa học nào)
   */
  async isEmptyCourseList(): Promise<boolean> {
    const count = await this.getCourseCount();
    return count === 0;
  }
}