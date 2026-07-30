import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Khóa học được chia sẻ (2.1.2 - Shared Courses)
 * Quản lý khóa học được chia sẻ từ người dùng khác.
 * URL: /bg/?shared=1 or similar shared filter
 * Includes: Shared courses viewing, filtering, and management
 */
export class KhoaHocDuocChiaS extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ──────────────────────────────────────────────────────────────

  // Search & Filter
  private get searchInput(): Locator {
    return this.page.locator('input[placeholder="Tìm kiếm khóa học..."]');
  }

  private get gradeFilterSelect(): Locator {
    return this.page.locator('select.style1-select');
  }

  private get searchButton(): Locator {
    return this.page.locator('button.btn-primary-v2:has-text("Tìm kiếm")');
  }

  // Course Type Filter Dropdown (for Shared courses context)
  private get courseTypeDropdown(): Locator {
    return this.page.locator('button.btn.olm-btn-primary.dropdown-toggle').first();
  }

  private get courseTypeMenu(): Locator {
    return this.page.locator('div.dropdown-menu').first();
  }

  // Grade Filter Dropdown
  private get gradeDropdown(): Locator {
    return this.page.locator('button.btn.olm-btn-primary.dropdown-toggle').nth(1);
  }

  private get gradeMenu(): Locator {
    return this.page.locator('div.dropdown-menu.mh-300-p').first();
  }

  private get gradeOptions(): Locator {
    return this.gradeMenu.locator('a.dropdown-item');
  }

  // Subject Filter Dropdown
  private get subjectDropdown(): Locator {
    return this.page.locator('button.btn.olm-btn-primary.dropdown-toggle').nth(2);
  }

  private get subjectMenu(): Locator {
    return this.page.locator('div.dropdown-menu.mh-300-p').nth(1);
  }

  private get subjectOptions(): Locator {
    return this.subjectMenu.locator('a.dropdown-item');
  }

  // Course Items
  private get courseItems(): Locator {
    return this.page.locator('div.course-item');
  }

  // Course Action Buttons (Shared courses may have limited actions)
  private get viewCourseButton(): Locator {
    return this.page.locator('a[href*="/bg/"], a.course-link');
  }

  private get courseCard(): Locator {
    return this.page.locator('div.card-v2');
  }

  // Course Details in Card
  private get courseTitle(): Locator {
    return this.page.locator('div.card-body h4 a');
  }

  private get courseCreator(): Locator {
    return this.page.locator('div.card-body .fw-600.font-xsss');
  }

  private get courseTag(): Locator {
    return this.page.locator('div.card-body a[class*="alert"]');
  }

  private get coursePrice(): Locator {
    return this.page.locator('span:has-text("Miễn phí"), span:has-text("VND")');
  }

  // Shared Badge (if exists)
  private get sharedBadge(): Locator {
    return this.page.locator('span:has-text("Được chia sẻ"), span:has-text("Shared")');
  }

  // Pagination
  private get paginationButtons(): Locator {
    return this.page.locator('nav.pagination button, .pagination a');
  }

  // Empty State
  private get emptyStateMessage(): Locator {
    return this.page.locator('text="Chưa có khóa học nào", text="Không có khóa học được chia sẻ", text="Không có dữ liệu"');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Open Shared Courses page.
   * URL: /bg/ (with shared filter or context)
   */
  async open(): Promise<void> {
    await this.navigateTo('/bg/');
    await this.waitForSelector('input[placeholder="Tìm kiếm khóa học..."]', 10_000);
  }

  /**
   * Open Shared Courses with specific filter.
   * Filter: shared=1 or specific context
   */
  async openSharedCourses(): Promise<void> {
    await this.navigateTo('/bg/?shared=1');
    await this.waitForSelector('input[placeholder="Tìm kiếm khóa học..."]', 10_000);
  }

  /**
   * Check if page is loaded and ready.
   */
  async isPageReady(): Promise<boolean> {
    try {
      return await this.searchInput.isVisible({ timeout: 3_000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for course list to load.
   */
  async waitForCourseListLoad(timeoutMs = 5_000): Promise<boolean> {
    try {
      await Promise.race([
        this.courseItems.first().waitFor({ state: 'attached', timeout: timeoutMs }),
        this.emptyStateMessage.waitFor({ state: 'visible', timeout: timeoutMs }),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  // ── Grade Filter ───────────────────────────────────────────────────────────

  /**
   * Get all available grades.
   */
  async getAvailableGrades(): Promise<string[]> {
    await this.jsClick(this.gradeDropdown);
    await this.page.waitForTimeout(400);

    const options = await this.gradeOptions.all();
    const grades: string[] = [];

    for (const opt of options) {
      const text = await opt.textContent();
      if (text && !text.includes('Tất cả')) {
        grades.push(text.trim());
      }
    }

    await this.page.keyboard.press('Escape');
    return grades;
  }

  /**
   * Select grade/khối.
   */
  async selectGrade(grade: string): Promise<void> {
    await this.jsClick(this.gradeDropdown);
    await this.page.waitForTimeout(400);

    const option = this.gradeMenu.locator(`a.dropdown-item:has-text("${grade}")`);
    if (await option.isVisible()) {
      await this.jsClick(option);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Select "Tất cả" grades.
   */
  async selectAllGrades(): Promise<void> {
    await this.jsClick(this.gradeDropdown);
    await this.page.waitForTimeout(400);

    const allOption = this.gradeMenu.locator('a.dropdown-item:has-text("Tất cả")');
    if (await allOption.isVisible()) {
      await this.jsClick(allOption);
      await this.page.waitForTimeout(800);
    }
  }

  // ── Subject Filter ─────────────────────────────────────────────────────────

  /**
   * Get all available subjects.
   */
  async getAvailableSubjects(): Promise<string[]> {
    await this.jsClick(this.subjectDropdown);
    await this.page.waitForTimeout(400);

    const options = await this.subjectOptions.all();
    const subjects: string[] = [];

    for (const opt of options) {
      const text = await opt.textContent();
      if (text && !text.includes('Tất cả')) {
        subjects.push(text.trim());
      }
    }

    await this.page.keyboard.press('Escape');
    return subjects;
  }

  /**
   * Select subject/môn học.
   */
  async selectSubject(subject: string): Promise<void> {
    await this.jsClick(this.subjectDropdown);
    await this.page.waitForTimeout(400);

    const option = this.subjectMenu.locator(`a.dropdown-item:has-text("${subject}")`);
    if (await option.isVisible()) {
      await this.jsClick(option);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Select "Tất cả" subjects.
   */
  async selectAllSubjects(): Promise<void> {
    await this.jsClick(this.subjectDropdown);
    await this.page.waitForTimeout(400);

    const allOption = this.subjectMenu.locator('a.dropdown-item:has-text("Tất cả")');
    if (await allOption.isVisible()) {
      await this.jsClick(allOption);
      await this.page.waitForTimeout(800);
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  /**
   * Search shared courses by keyword.
   */
  async searchCourses(keyword: string): Promise<void> {
    await this.jsClearAndType(this.searchInput, keyword);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current search keyword.
   */
  async getSearchKeyword(): Promise<string> {
    return this.searchInput.inputValue();
  }

  /**
   * Clear search input.
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  /**
   * Apply filter (click search button).
   */
  async applyFilter(): Promise<void> {
    await this.jsClick(this.searchButton);
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Perform complete search with filters.
   */
  async filterCourses(options: {
    keyword?: string;
    grade?: string;
    subject?: string;
  }): Promise<void> {
    if (options.grade) {
      await this.selectGrade(options.grade);
    }
    if (options.subject) {
      await this.selectSubject(options.subject);
    }
    if (options.keyword) {
      await this.searchCourses(options.keyword);
    }
    await this.applyFilter();
  }

  // ── Course List Management ─────────────────────────────────────────────────

  /**
   * Get number of shared courses displayed.
   */
  async getCourseCount(): Promise<number> {
    const items = await this.courseItems.all();
    return items.length;
  }

  /**
   * Check if course list is empty.
   */
  async isCourseListEmpty(): Promise<boolean> {
    return this.emptyStateMessage.isVisible();
  }

  /**
   * Get all course titles.
   */
  async getAllCourseTitles(): Promise<string[]> {
    const titles = await this.courseTitle.all();
    const titleTexts: string[] = [];

    for (const title of titles) {
      const text = await title.textContent();
      if (text) titleTexts.push(text.trim());
    }

    return titleTexts;
  }

  /**
   * Get course title by index.
   */
  async getCourseTitleByIndex(index = 0): Promise<string | null> {
    const titles = await this.courseTitle.all();
    if (titles.length > index) {
      return titles[index].textContent();
    }
    return null;
  }

  /**
   * Get course creator by index.
   */
  async getCourseCreatorByIndex(index = 0): Promise<string | null> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const creator = items[index].locator('.fw-600.font-xsss');
      return creator.textContent();
    }
    return null;
  }

  /**
   * Get course subject/tag by index.
   */
  async getCourseSubjectByIndex(index = 0): Promise<string | null> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const tag = items[index].locator('a[class*="alert"]');
      return tag.textContent();
    }
    return null;
  }

  /**
   * Check if course is marked as shared.
   */
  async isSharedCourseByIndex(index = 0): Promise<boolean> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const badge = items[index].locator('span:has-text("Được chia sẻ"), span:has-text("Shared")');
      return badge.isVisible();
    }
    return false;
  }

  /**
   * Get course by title (returns card locator).
   */
  getCourseByTitle(title: string): Locator {
    return this.page.locator(`div.course-item:has(h4 a:has-text("${title}"))`);
  }

  /**
   * Get course data by index as object.
   */
  async getCourseDataByIndex(index = 0): Promise<Record<string, string | null | boolean>> {
    return {
      title: await this.getCourseTitleByIndex(index),
      creator: await this.getCourseCreatorByIndex(index),
      subject: await this.getCourseSubjectByIndex(index),
      isShared: await this.isSharedCourseByIndex(index),
    };
  }

  /**
   * Get all shared courses data.
   */
  async getAllCoursesData(): Promise<Record<string, string | null | boolean>[]> {
    const count = await this.getCourseCount();
    const data: Record<string, string | null | boolean>[] = [];

    for (let i = 0; i < count; i++) {
      const courseData = await this.getCourseDataByIndex(i);
      data.push(courseData);
    }

    return data;
  }

  // ── Course Actions ─────────────────────────────────────────────────────────

  /**
   * Open/View shared course by index.
   */
  async openCourseByIndex(index = 0): Promise<void> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const courseLink = items[index].locator('a[href*="/bg/"]').first();
      if (await courseLink.isVisible()) {
        await this.jsClick(courseLink);
        await this.page.waitForTimeout(1_500);
      }
    }
  }

  /**
   * Open/View shared course by title.
   */
  async openCourseByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const courseLink = course.locator('a[href*="/bg/"]').first();
    if (await courseLink.isVisible()) {
      await this.jsClick(courseLink);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * Get course URL by index.
   */
  async getCourseUrlByIndex(index = 0): Promise<string | null> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const courseLink = items[index].locator('a[href*="/bg/"]').first();
      return courseLink.getAttribute('href');
    }
    return null;
  }

  /**
   * Enroll/Join shared course (if button available).
   */
  async enrollCourseByIndex(index = 0): Promise<void> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const enrollBtn = items[index].locator('button:has-text("Tham gia"), button:has-text("Đăng ký"), button:has-text("Join")');
      if (await enrollBtn.isVisible()) {
        await this.jsClick(enrollBtn);
        await this.page.waitForTimeout(1_000);
      }
    }
  }

  /**
   * Enroll/Join shared course by title.
   */
  async enrollCourseByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const enrollBtn = course.locator('button:has-text("Tham gia"), button:has-text("Đăng ký"), button:has-text("Join")');
    if (await enrollBtn.isVisible()) {
      await this.jsClick(enrollBtn);
      await this.page.waitForTimeout(1_000);
    }
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  /**
   * Get all pagination buttons.
   */
  async getPaginationButtons(): Promise<Locator[]> {
    return this.paginationButtons.all();
  }

  /**
   * Go to next page.
   */
  async goToNextPage(): Promise<void> {
    const nextBtn = this.page.locator('a[rel="next"], button:has-text("Tiếp theo"), button:has-text(">>")');
    if (await nextBtn.isVisible()) {
      await this.jsClick(nextBtn);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Go to previous page.
   */
  async goToPreviousPage(): Promise<void> {
    const prevBtn = this.page.locator('a[rel="prev"], button:has-text("Quay lại"), button:has-text("<<")');
    if (await prevBtn.isVisible()) {
      await this.jsClick(prevBtn);
      await this.page.waitForTimeout(1_000);
    }
  }

  // ── Utility Methods ────────────────────────────────────────────────────────

  /**
   * Reset all filters to default.
   */
  async resetFilters(): Promise<void> {
    await this.clearSearch();
    await this.selectAllGrades();
    await this.selectAllSubjects();
    await this.applyFilter();
  }

  /**
   * Scroll down to load more courses.
   */
  async loadMoreCourses(): Promise<void> {
    await this.scrollToBottom(3, 400);
  }

  /**
   * Find shared course by partial title match.
   */
  async findCourseByTitleMatch(partialTitle: string): Promise<string | null> {
    const allTitles = await this.getAllCourseTitles();
    for (const title of allTitles) {
      if (title.includes(partialTitle)) {
        return title;
      }
    }
    return null;
  }

  /**
   * Check if shared course exists by title.
   */
  async courseExists(title: string): Promise<boolean> {
    const course = this.getCourseByTitle(title);
    try {
      return await course.isVisible({ timeout: 1_000 });
    } catch {
      return false;
    }
  }

  /**
   * Get all courses shared by specific creator.
   */
  async getCoursesByCreator(creatorName: string): Promise<string[]> {
    const courses = await this.getAllCoursesData();
    return courses
      .filter(c => c.creator === creatorName)
      .map(c => c.title as string);
  }

  /**
   * Get all courses for specific subject.
   * FIXED: Added type guard to check if c.subject is string before calling .includes()
   */
  async getCoursesBySubject(subject: string): Promise<string[]> {
    const courses = await this.getAllCoursesData();
    return courses
      .filter(c => typeof c.subject === 'string' && c.subject.includes(subject))
      .map(c => c.title as string);
  }
}