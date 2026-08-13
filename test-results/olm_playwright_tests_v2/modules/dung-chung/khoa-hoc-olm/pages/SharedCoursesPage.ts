import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';
import { safeClick, dismissPopups } from '@core/shared-pages/dismissPopups';

/**
 * Interface cho dữ liệu một khóa học trong phần "Khoá học dùng chung"
 */
export interface SharedCourseData {
  title: string;
  lessonCount: number;
  courseUrl: string;
  imageUrl: string;
}

/**
 * Page Object – Phần "Khoá học dùng chung" (Shared Courses Section)
 * 
 * Được hiển thị ở trang chi tiết khóa học hoặc cuối trang chủ.
 * Người dùng có thể:
 * - Xem danh sách các khóa học liên quan
 * - Lọc theo khối lớp (nếu có dropdown "Xếp hạng trong khối")
 * - Click vào khóa học để vào chi tiết
 * 
 * DOM Structure (từ ảnh):
 * ┌────────────────────────────────────────────────────────┐
 * │ Khoá học liên quan                 Xếp hạng trong khối │
 * │ (title)                            (filter dropdown)    │
 * ├────────────────────────────────────────────────────────┤
 * │ [Card 1]  [Card 2]  [Card 3] ...                        │
 * │ (grid hoặc carousel)                                    │
 * └────────────────────────────────────────────────────────┘
 */
export class SharedCoursesPage extends BasePage {
  readonly page: Page;

  // ---- Section Container ----
  readonly sectionContainer: Locator; // Container chính của phần "Khoá học liên quan"
  
  // ---- Section Header ----
  readonly sectionTitle: Locator; // Tiêu đề "Khoá học liên quan"
  readonly filterDropdown: Locator; // Dropdown "Xếp hạng trong khối"
  readonly filterLabel: Locator; // Label bên cạnh dropdown
  
  // ---- Filter Options ----
  readonly filterOptions: Locator; // Tất cả các option trong dropdown (nếu áp dụng)
  
  // ---- Course Cards ----
  readonly courseCards: Locator; // Tất cả các course card
  readonly courseCardsContainer: Locator; // Container chứa các card (grid/carousel)

  constructor(page: Page) {
    super(page);
    this.page = page;

    // ---- Section Container ----
    // Locator cho phần "Khoá học liên quan" - thường có class/id chứa "related", "shared", "dung-chung"
    // Nếu DOM không rõ, có thể thay đổi theo structure thực tế
    this.sectionContainer = page.locator('[data-section="shared-courses"], .shared-courses-section, .khoahoc-dunghung, [class*="xep-hang"]').first();

    // ---- Section Header ----
    // Tiêu đề "Khoá học liên quan"
    this.sectionTitle = this.sectionContainer.locator('h2, h3, .section-title, [class*="title"]').first();

    // Dropdown "Xếp hạng trong khối"
    // Có thể là: select element, button với dropdown, hoặc link
    this.filterDropdown = this.sectionContainer.locator(
      'select, [role="combobox"], .dropdown-toggle, [class*="filter"], [class*="xep-hang"]'
    ).first();

    this.filterLabel = this.sectionContainer.locator(
      'label, .filter-label, [class*="xep-hang"]'
    ).first();

    // ---- Filter Options ----
    this.filterOptions = this.page.locator('[role="option"], .dropdown-item, .filter-item');

    // ---- Course Cards ----
    // Các course card trong phần "Khoá học liên quan"
    // Có thể là: .tw-olm-card-course, .course-card, .card, v.v.
    this.courseCardsContainer = this.sectionContainer.locator(
      '.course-list, .grid, .carousel, [class*="course"], [class*="grid"]'
    ).first();

    this.courseCards = this.sectionContainer.locator(
      '.tw-olm-card-course, .course-card, .card.course, [class*="card-course"], [data-course]'
    );
  }

  /**
   * Chờ section "Khoá học liên quan" hiển thị
   */
  async waitForSharedCoursesSection(): Promise<void> {
    await this.sectionContainer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.warn('SharedCourses section not found or not visible');
    });
  }

  /**
   * Kiểm tra phần "Khoá học liên quan" có hiển thị hay không
   */
  async isSharedCoursesSectionVisible(): Promise<boolean> {
    return this.sectionContainer.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Lấy tiêu đề của section
   */
  async getSectionTitle(): Promise<string> {
    return this.sectionTitle.innerText().catch(() => '');
  }

  /**
   * Lấy số lượng khóa học trong phần "Khoá học liên quan"
   */
  async getCourseCount(): Promise<number> {
    return this.courseCards.count();
  }

  /**
   * Lấy dữ liệu của khóa học tại vị trí index
   */
  async getCourseData(index: number): Promise<SharedCourseData> {
    const card = this.courseCards.nth(index);

    // Lấy tiêu đề khóa học
    const title = await card
      .locator('.tw-text-xl.tw-font-semibold, .course-title, h3, h4')
      .first()
      .innerText()
      .catch(() => '');

    // Lấy số bài học
    // Format có thể là: "355 bài học", "264 bài học", v.v.
    const lessonCountText = await card
      .locator('.tw-text-content-secondary, .lesson-count, .course-meta, p')
      .first()
      .innerText()
      .catch(() => '0');

    // Extract số từ text (VD: "355 bài học" → 355)
    const lessonCount = parseInt(lessonCountText.split(' ')[0], 10) || 0;

    // Lấy URL khóa học
    const courseUrl = await card
      .locator('a[href]')
      .first()
      .getAttribute('href')
      .catch(() => '');

    // Lấy URL hình ảnh khóa học
    const imageUrl = await card
      .locator('img')
      .first()
      .getAttribute('src')
      .catch(() => '');

    return {
      title: title.trim(),
      lessonCount,
      courseUrl: courseUrl ?? '',
      imageUrl: imageUrl ?? '',
    };
  }

  /**
   * Lấy dữ liệu của tất cả các khóa học trong phần
   */
  async getAllCoursesData(): Promise<SharedCourseData[]> {
    const count = await this.getCourseCount();
    const courses: SharedCourseData[] = [];

    for (let i = 0; i < count; i++) {
      courses.push(await this.getCourseData(i));
    }

    return courses;
  }

  /**
   * Lấy course card tại vị trí index
   */
  getCourseCardAtIndex(index: number): Locator {
    return this.courseCards.nth(index);
  }

  /**
   * Tìm khóa học theo tiêu đề
   */
  getCourseByTitle(title: string): Locator {
    return this.courseCards
      .filter({ hasText: title })
      .first();
  }

  /**
   * Click vào khóa học tại vị trí index
   */
  async openCourseAtIndex(index: number): Promise<void> {
    const card = this.courseCards.nth(index);
    const link = card.locator('a[href]').first();

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      safeClick(this.page, link),
    ]);
  }

  /**
   * Click vào khóa học theo tiêu đề
   */
  async openCourseByTitle(title: string): Promise<void> {
    const link = this.getCourseByTitle(title)
      .locator('a[href]')
      .first();

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      safeClick(this.page, link),
    ]);
  }

  /**
   * Click vào khóa học theo index (click trực tiếp vào card)
   */
  async clickCourseCard(index: number): Promise<void> {
    const card = this.courseCards.nth(index);
    await safeClick(this.page, card);
  }

  /**
   * Lọc khóa học theo khối lớp (nếu có dropdown)
   * @param gradeLevel - Tên khối lớp (VD: "Lớp 1", "Lớp 2", v.v.)
   */
  async filterByGrade(gradeLevel: string): Promise<void> {
    // Click vào dropdown
    await safeClick(this.page, this.filterDropdown);

    // Chờ dropdown mở
    await this.page.waitForTimeout(300);

    // Click vào option tương ứng
    const option = this.page.locator(`text="${gradeLevel}"`).first();
    await safeClick(this.page, option);

    // Chờ filter được áp dụng
    await this.page.waitForTimeout(500);
  }

  /**
   * Lấy tất cả các option trong dropdown filter (nếu có)
   */
  async getFilterOptions(): Promise<string[]> {
    const options = await this.filterOptions.allInnerTexts();
    return options.map(text => text.trim());
  }

  /**
   * Kiểm tra khóa học có tồn tại trong phần hay không
   */
  async hasCourseWithTitle(title: string): Promise<boolean> {
    const count = await this.getCourseByTitle(title).count();
    return count > 0;
  }

  /**
   * Kiểm tra phần có khóa học nào không
   */
  async hasAnyCourses(): Promise<boolean> {
    const count = await this.getCourseCount();
    return count > 0;
  }

  /**
   * Kiểm tra danh sách khóa học trống
   */
  async isEmptyCourseList(): Promise<boolean> {
    const count = await this.getCourseCount();
    return count === 0;
  }

  /**
   * Scroll tới phần "Khoá học liên quan"
   */
  async scrollToSection(): Promise<void> {
    await this.sectionContainer.scrollIntoViewIfNeeded();
  }

  /**
   * Dismiss popups nếu có
   */
  async dismissAnyPopups(): Promise<void> {
    await dismissPopups(this.page).catch(() => {
      // Ignore if no popups
    });
  }
}