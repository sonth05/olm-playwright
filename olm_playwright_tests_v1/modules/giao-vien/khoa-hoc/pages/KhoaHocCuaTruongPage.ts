import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Khóa học của trường (2.1.3 - School Courses)
 * Quản lý danh sách khóa học của trường học.
 * URL: /truong-hoc/{school_slug}/khoa-hoc
 * Includes: School course listing, filtering, editing, and management
 */
export class KhoaHocCuaTruong extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ──────────────────────────────────────────────────────────────

  // Navigation Tabs
  private get schoolNavTabs(): Locator {
    return this.page.locator('ul.school-nav-tabs, .nav-tabs');
  }

  private get khhhocTab(): Locator {
    return this.page.locator('a[href*="/khoa-hoc"]:has-text("Khóa học")');
  }

  // Page Heading
  private get pageHeading(): Locator {
    return this.page.locator('h3:has-text("Danh sách khóa học")');
  }

  private get schoolName(): Locator {
    return this.page.locator('span.text-secondary-v2.font-weight-bold');
  }

  // Grade Filter
  private get gradeFilterButton(): Locator {
    return this.page.locator('button.btn.olm-btn-primary:has-text("Lọc theo")');
  }

  private get gradeFilterMenu(): Locator {
    return this.page.locator('div.dropdown-menu');
  }

  private get gradeFilterOptions(): Locator {
    return this.gradeFilterMenu.locator('a.dropdown-item');
  }

  // Show All Courses Checkbox
  private get showAllCoursesCheckbox(): Locator {
    return this.page.locator('input[name="show_all"], #filter-show-all');
  }

  private get showAllCoursesLabel(): Locator {
    return this.page.locator('label:has-text("Hiển thị tất cả khóa học")');
  }

  // Create Course Button
  private get createCourseButton(): Locator {
    return this.page.locator('a.btn.olm-btn-primary:has-text("Tạo khóa học")');
  }

  // Course Items
  private get courseItems(): Locator {
    return this.page.locator('div.course-item');
  }

  // Course Action Buttons
  private get editCourseButton(): Locator {
    return this.page.locator('a[title="Cập nhật khóa học"]');
  }

  private get manageCourseButton(): Locator {
    return this.page.locator('a[title="Quản lý khóa học"]');
  }

  private get deleteCourseButton(): Locator {
    return this.page.locator('a.btn-delete-course');
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

  // Show/Hide Toggle (Checkbox in card)
  private get courseVisibilityCheckbox(): Locator {
    return this.page.locator('input.option-model[data-mm="course"]');
  }

  // Empty State
  private get emptyStateMessage(): Locator {
    return this.page.locator('text="Chưa có khóa học nào", text="Không có dữ liệu"');
  }

  // Pagination
  private get paginationButtons(): Locator {
    return this.page.locator('nav.pagination button, .pagination a');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Open School Courses page.
   * schoolSlug: e.g., "truong-lien-cap-olm-son.41902384"
   */
  async open(schoolSlug: string): Promise<void> {
    await this.navigateTo(`/truong-hoc/${schoolSlug}/khoa-hoc`);
    await this.waitForSelector('h3:has-text("Danh sách khóa học")', 10_000);
  }

  /**
   * Check if page is loaded and ready.
   */
  async isPageReady(): Promise<boolean> {
    try {
      return await this.pageHeading.isVisible({ timeout: 3_000 });
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

  // ── Tab Navigation ────────────────────────────────────────────────────────

  /**
   * Get all navigation tabs.
   */
  async getAllTabs(): Promise<string[]> {
    const tabs = await this.schoolNavTabs.locator('a').all();
    const tabTexts: string[] = [];

    for (const tab of tabs) {
      const text = await tab.textContent();
      if (text) tabTexts.push(text.trim());
    }

    return tabTexts;
  }

  /**
   * Click on specific tab by name.
   */
  async clickTab(tabName: string): Promise<void> {
    const tab = this.schoolNavTabs.locator(`a:has-text("${tabName}")`);
    if (await tab.isVisible()) {
      await this.jsClick(tab);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Verify Khóa học tab is active.
   */
  async isKhoaHocTabActive(): Promise<boolean> {
    return this.khhhocTab.evaluate((el) => el.classList.contains('active') || el.getAttribute('href') === window.location.pathname);
  }

  /**
   * Switch to Khóa học tab if not already there.
   */
  async switchToKhoaHocTab(): Promise<void> {
    const isActive = await this.isKhoaHocTabActive();
    if (!isActive) {
      await this.clickTab('Khóa học');
    }
  }

  // ── School Info ────────────────────────────────────────────────────────────

  /**
   * Get school name.
   */
  async getSchoolName(): Promise<string | null> {
    return this.schoolName.textContent();
  }

  // ── Grade Filter ───────────────────────────────────────────────────────────

  /**
   * Get current grade filter value.
   */
  async getCurrentGradeFilter(): Promise<string | null> {
    return this.gradeFilterButton.textContent();
  }

  /**
   * Get all available grade filter options.
   */
  async getAvailableGradeFilters(): Promise<string[]> {
    await this.jsClick(this.gradeFilterButton);
    await this.page.waitForTimeout(400);

    const options = await this.gradeFilterOptions.all();
    const grades: string[] = [];

    for (const opt of options) {
      const text = await opt.textContent();
      if (text) grades.push(text.trim());
    }

    await this.page.keyboard.press('Escape');
    return grades;
  }

  /**
   * Select grade filter by name.
   */
  async selectGradeFilter(gradeName: string): Promise<void> {
    await this.jsClick(this.gradeFilterButton);
    await this.page.waitForTimeout(400);

    const option = this.gradeFilterMenu.locator(`a.dropdown-item:has-text("${gradeName}")`);
    if (await option.isVisible()) {
      await this.jsClick(option);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Select "Tất cả khối" (All grades).
   */
  async selectAllGrades(): Promise<void> {
    await this.jsClick(this.gradeFilterButton);
    await this.page.waitForTimeout(400);

    const allOption = this.gradeFilterMenu.locator('a.dropdown-item:has-text("Tất cả")');
    if (await allOption.isVisible()) {
      await this.jsClick(allOption);
      await this.page.waitForTimeout(1_000);
    }
  }

  // ── Show All Courses ───────────────────────────────────────────────────────

  /**
   * Check if "Show all courses" is enabled.
   */
  async isShowAllCoursesEnabled(): Promise<boolean> {
    return this.showAllCoursesCheckbox.isChecked();
  }

  /**
   * Toggle "Show all courses" checkbox.
   */
  async toggleShowAllCourses(): Promise<void> {
    const isChecked = await this.showAllCoursesCheckbox.isChecked();
    if (!isChecked) {
      await this.jsClick(this.showAllCoursesCheckbox);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * Enable "Show all courses".
   */
  async enableShowAllCourses(): Promise<void> {
    const isChecked = await this.showAllCoursesCheckbox.isChecked();
    if (!isChecked) {
      await this.jsClick(this.showAllCoursesCheckbox);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * Disable "Show all courses".
   */
  async disableShowAllCourses(): Promise<void> {
    const isChecked = await this.showAllCoursesCheckbox.isChecked();
    if (isChecked) {
      await this.jsClick(this.showAllCoursesCheckbox);
      await this.page.waitForTimeout(1_500);
    }
  }

  // ── Course List & Data Retrieval ───────────────────────────────────────────

  /**
   * Get number of courses displayed.
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
   * Check if course is visible by index.
   */
  async isCoursVisibleByIndex(index = 0): Promise<boolean> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const checkbox = items[index].locator('input.option-model');
      return checkbox.isChecked();
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
      isVisible: await this.isCoursVisibleByIndex(index),
    };
  }

  /**
   * Get all courses data.
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
   * Edit course by index.
   */
  async editCourseByIndex(index = 0): Promise<void> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const editBtn = items[index].locator('a[title="Cập nhật khóa học"]');
      if (await editBtn.isVisible()) {
        await this.jsClick(editBtn);
        await this.page.waitForTimeout(1_500);
      }
    }
  }

  /**
   * Edit course by title.
   */
  async editCourseByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const editBtn = course.locator('a[title="Cập nhật khóa học"]');
    if (await editBtn.isVisible()) {
      await this.jsClick(editBtn);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * Manage course by index.
   */
  async manageCourseByIndex(index = 0): Promise<void> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const manageBtn = items[index].locator('a[title="Quản lý khóa học"]');
      if (await manageBtn.isVisible()) {
        await this.jsClick(manageBtn);
        await this.page.waitForTimeout(1_500);
      }
    }
  }

  /**
   * Manage course by title.
   */
  async manageCourseByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const manageBtn = course.locator('a[title="Quản lý khóa học"]');
    if (await manageBtn.isVisible()) {
      await this.jsClick(manageBtn);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * Delete course by index.
   */
  async deleteCoursedByIndex(index = 0): Promise<void> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const deleteBtn = items[index].locator('a.btn-delete-course');
      if (await deleteBtn.isVisible()) {
        await this.jsClick(deleteBtn);
        await this.page.waitForTimeout(800);

        // Confirm deletion
        const confirmBtn = this.page.locator('button:has-text("Xác nhận"), button:has-text("Có")');
        if (await confirmBtn.isVisible()) {
          await this.jsClick(confirmBtn);
          await this.page.waitForTimeout(1_000);
        }
      }
    }
  }

  /**
   * Delete course by title.
   */
  async deleteCoursedByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const deleteBtn = course.locator('a.btn-delete-course');
    if (await deleteBtn.isVisible()) {
      await this.jsClick(deleteBtn);
      await this.page.waitForTimeout(800);

      const confirmBtn = this.page.locator('button:has-text("Xác nhận"), button:has-text("Có")');
      if (await confirmBtn.isVisible()) {
        await this.jsClick(confirmBtn);
        await this.page.waitForTimeout(1_000);
      }
    }
  }

  /**
   * Toggle course visibility by index.
   */
  async toggleCourseVisibilityByIndex(index = 0): Promise<void> {
    const items = await this.courseItems.all();
    if (items.length > index) {
      const checkbox = items[index].locator('input.option-model');
      if (await checkbox.isVisible()) {
        await this.jsClick(checkbox);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Toggle course visibility by title.
   */
  async toggleCourseVisibilityByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const checkbox = course.locator('input.option-model');
    if (await checkbox.isVisible()) {
      await this.jsClick(checkbox);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Show course by index (enable checkbox).
   */
  async showCourseByIndex(index = 0): Promise<void> {
    const isVisible = await this.isCoursVisibleByIndex(index);
    if (!isVisible) {
      await this.toggleCourseVisibilityByIndex(index);
    }
  }

  /**
   * Hide course by index (disable checkbox).
   */
  async hideCourseByIndex(index = 0): Promise<void> {
    const isVisible = await this.isCoursVisibleByIndex(index);
    if (isVisible) {
      await this.toggleCourseVisibilityByIndex(index);
    }
  }

  /**
   * Click on course to open details/preview.
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
   * Click on course to open details/preview by title.
   */
  async openCourseByTitle(title: string): Promise<void> {
    const course = this.getCourseByTitle(title);
    const courseLink = course.locator('a[href*="/bg/"]').first();
    if (await courseLink.isVisible()) {
      await this.jsClick(courseLink);
      await this.page.waitForTimeout(1_500);
    }
  }

  // ── Create Course ──────────────────────────────────────────────────────────

  /**
   * Click "Tạo khóa học" (Create Course) button.
   */
  async createNewCourse(): Promise<void> {
    const btn = this.createCourseButton;
    if (await btn.isVisible()) {
      await this.jsClick(btn);
      await this.page.waitForTimeout(1_500);
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
   * Reset filters to default (show all grades).
   */
  async resetFilters(): Promise<void> {
    await this.selectAllGrades();
  }

  /**
   * Scroll down to load more courses.
   */
  async loadMoreCourses(): Promise<void> {
    await this.scrollToBottom(3, 400);
  }

  /**
   * Find course by partial title match.
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
   * Check if course exists by title.
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
   * Get all visible courses.
   */
  async getVisibleCourses(): Promise<string[]> {
    const courses = await this.getAllCoursesData();
    return courses
      .filter(c => c.isVisible === true)
      .map(c => c.title as string);
  }

  /**
   * Get all hidden courses.
   */
  async getHiddenCourses(): Promise<string[]> {
    const courses = await this.getAllCoursesData();
    return courses
      .filter(c => c.isVisible === false)
      .map(c => c.title as string);
  }

  /**
   * Get all courses by specific subject.
   * FIXED: Added type guard to check if c.subject is string before calling .includes()
   */
  async getCoursesBySubject(subject: string): Promise<string[]> {
    const courses = await this.getAllCoursesData();
    return courses
      .filter(c => typeof c.subject === 'string' && c.subject.includes(subject))
      .map(c => c.title as string);
  }

  /**
   * Get all courses by specific creator/teacher.
   */
  async getCoursesByCreator(creatorName: string): Promise<string[]> {
    const courses = await this.getAllCoursesData();
    return courses
      .filter(c => c.creator === creatorName)
      .map(c => c.title as string);
  }
}