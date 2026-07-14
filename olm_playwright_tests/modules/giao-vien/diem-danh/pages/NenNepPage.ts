import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Nền nếp (1.6.2).
 * Quản lý nền nếp (discipline/behavior management) - Add violations and view statistics.
 * Based on actual HTML structure from olm.vn/cipline/add
 */
export class NenNepPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ──────────────────────────────────────────────────────────────

  private get yearSelector(): Locator {
    return this.page.locator('select.select-school-year-student-cipline');
  }

  private get gradeFilter(): Locator {
    return this.page.locator('select[id="grade"]');
  }

  private get classFilter(): Locator {
    return this.page.locator('select.filter-select-auto');
  }

  private get addViolationTab(): Locator {
    return this.page.locator('a.nav-link:has-text("Thêm vi phạm")');
  }

  private get statisticsTab(): Locator {
    return this.page.locator('a.nav-link:has-text("Thống kê nền nếp")');
  }

  private get activeTab(): Locator {
    return this.page.locator('a.nav-link.active');
  }

  private get pageHeading(): Locator {
    return this.page.locator('h2:has-text("Quản lý nền nếp")');
  }

  // Add Violation Form selectors
  private get violationTypeSelect(): Locator {
    return this.page.locator('select[name="violation_type"]');
  }

  private get studentNameInput(): Locator {
    return this.page.locator('input[name="student_name"]');
  }

  private get violationDateInput(): Locator {
    return this.page.locator('input[type="date"][name="violation_date"]');
  }

  private get violationDescriptionTextarea(): Locator {
    return this.page.locator('textarea[name="description"]');
  }

  private get violationSeveritySelect(): Locator {
    return this.page.locator('select[name="severity"]');
  }

  private get violationNoteTextarea(): Locator {
    return this.page.locator('textarea[name="note"]');
  }

  private get submitViolationButton(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Lưu"), button:has-text("Thêm vi phạm")');
  }

  private get cancelButton(): Locator {
    return this.page.locator('button:has-text("Hủy")');
  }

  // Statistics table selectors
  private get statisticsTable(): Locator {
    return this.page.locator('table.statistics-table, table.violation-statistics');
  }

  private get statisticsRows(): Locator {
    return this.statisticsTable.locator('tbody tr');
  }

  private get violationListItems(): Locator {
    return this.page.locator('ul.violation-list li, div.violation-item');
  }

  private get paginationButtons(): Locator {
    return this.page.locator('nav.pagination button, .pagination a');
  }

  private get emptyStateMessage(): Locator {
    return this.page.locator('text="Chưa có vi phạm nào", text="Không có dữ liệu"');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Open the Nền nếp (Discipline) page - Add violation tab by default.
   * URL: /cipline/add
   */
  async openAddViolation(): Promise<void> {
    await this.navigateTo('/cipline/add');
    await this.waitForSelector('h2:has-text("Quản lý nền nếp")', 10_000);
  }

  /**
   * Open the Nền nếp statistics page.
   * URL: /cipline/statistic
   */
  async openStatistics(): Promise<void> {
    await this.navigateTo('/cipline/statistic');
    await this.waitForSelector('h2:has-text("Quản lý nền nếp")', 10_000);
  }

  /**
   * Check if page is fully loaded and ready.
   */
  async isPageReady(): Promise<boolean> {
    try {
      return await this.pageHeading.isVisible({ timeout: 3_000 });
    } catch {
      return false;
    }
  }

  // ── Year Selection ─────────────────────────────────────────────────────────

  /**
   * Select academic year (e.g., "2025 - 2026").
   */
  async selectYear(year: string): Promise<void> {
    const selector = this.yearSelector;
    if (await selector.isVisible()) {
      await selector.selectOption(year);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Get all available years.
   */
  async getAvailableYears(): Promise<string[]> {
    const options = await this.yearSelector.locator('option').all();
    const years: string[] = [];
    for (const opt of options) {
      const text = await opt.textContent();
      if (text && text.trim() && !text.includes('Chọn')) {
        years.push(text.trim());
      }
    }
    return years;
  }

  // ── Grade & Class Filters ──────────────────────────────────────────────────

  /**
   * Select grade/khối (e.g., "Khối 10", "Khối 12").
   */
  async selectGrade(grade: string): Promise<void> {
    const selector = this.gradeFilter;
    if (await selector.isVisible()) {
      await selector.selectOption(grade);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get all available grades.
   */
  async getAvailableGrades(): Promise<string[]> {
    const options = await this.gradeFilter.locator('option').all();
    const grades: string[] = [];
    for (const opt of options) {
      const value = await opt.getAttribute('value');
      const text = await opt.textContent();
      if (value && value !== '' && text && !text.includes('Chọn')) {
        grades.push(text.trim());
      }
    }
    return grades;
  }

  /**
   * Select class/lớp (e.g., "Lớp 12A1", "Lớp 9C").
   */
  async selectClass(className: string): Promise<void> {
    const selector = this.classFilter;
    if (await selector.isVisible()) {
      await selector.selectOption(className);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get all available classes.
   */
  async getAvailableClasses(): Promise<string[]> {
    const options = await this.classFilter.locator('option').all();
    const classes: string[] = [];
    for (const opt of options) {
      const value = await opt.getAttribute('value');
      if (value && !value.includes('disabled')) {
        const text = await opt.textContent();
        if (text && !text.includes('Chọn')) classes.push(text.trim());
      }
    }
    return classes;
  }

  // ── Tab Navigation ────────────────────────────────────────────────────────

  /**
   * Switch to "Thêm vi phạm" (Add Violation) tab.
   */
  async switchToAddViolationTab(): Promise<void> {
    const tab = this.addViolationTab;
    if (await tab.isVisible() && !(await tab.evaluate((el) => el.classList.contains('active')))) {
      await this.jsClick(tab);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Switch to "Thống kê nền nếp" (Statistics) tab.
   */
  async switchToStatisticsTab(): Promise<void> {
    const tab = this.statisticsTab;
    if (await tab.isVisible() && !(await tab.evaluate((el) => el.classList.contains('active')))) {
      await this.jsClick(tab);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Get current active tab name.
   */
  async getActiveTabName(): Promise<string | null> {
    return this.activeTab.textContent();
  }

  /**
   * Check if Add Violation tab is active.
   */
  async isAddViolationTabActive(): Promise<boolean> {
    return this.addViolationTab.evaluate((el) => el.classList.contains('active'));
  }

  /**
   * Check if Statistics tab is active.
   */
  async isStatisticsTabActive(): Promise<boolean> {
    return this.statisticsTab.evaluate((el) => el.classList.contains('active'));
  }

  // ── Add Violation Form ─────────────────────────────────────────────────────

  /**
   * Fill violation type dropdown.
   */
  async selectViolationType(violationType: string): Promise<void> {
    const selector = this.violationTypeSelect;
    if (await selector.isVisible()) {
      await selector.selectOption(violationType);
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Enter student name in the form.
   */
  async enterStudentName(studentName: string): Promise<void> {
    const input = this.studentNameInput;
    if (await input.isVisible()) {
      await this.jsClearAndType(input, studentName);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Select violation date.
   * Format: "2026-03-12"
   */
  async selectViolationDate(dateString: string): Promise<void> {
    const input = this.violationDateInput;
    if (await input.isVisible()) {
      await input.fill(dateString);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Enter violation description.
   */
  async enterViolationDescription(description: string): Promise<void> {
    const textarea = this.violationDescriptionTextarea;
    if (await textarea.isVisible()) {
      await this.jsClearAndType(textarea, description);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Select violation severity (e.g., "Minor", "Major", "Severe").
   */
  async selectSeverity(severity: string): Promise<void> {
    const selector = this.violationSeveritySelect;
    if (await selector.isVisible()) {
      await selector.selectOption(severity);
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Enter additional notes.
   */
  async enterNote(note: string): Promise<void> {
    const textarea = this.violationNoteTextarea;
    if (await textarea.isVisible()) {
      await this.jsClearAndType(textarea, note);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Submit the violation form.
   */
  async submitViolation(): Promise<void> {
    await this.jsClick(this.submitViolationButton);
    await this.page.waitForTimeout(1_500);
  }

  /**
   * Cancel the current form (clears and returns to default state).
   */
  async cancelViolationForm(): Promise<void> {
    const btn = this.cancelButton;
    if (await btn.isVisible()) {
      await this.jsClick(btn);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Add a violation with complete information.
   */
  async addViolation(violationData: {
    grade?: string;
    className?: string;
    violationType: string;
    studentName: string;
    violationDate: string;
    description: string;
    severity?: string;
    note?: string;
  }): Promise<void> {
    // Ensure we're on Add Violation tab
    await this.switchToAddViolationTab();

    // Select filters if provided
    if (violationData.grade) {
      await this.selectGrade(violationData.grade);
      await this.page.waitForTimeout(500);
    }
    if (violationData.className) {
      await this.selectClass(violationData.className);
      await this.page.waitForTimeout(500);
    }

    // Fill form
    await this.selectViolationType(violationData.violationType);
    await this.enterStudentName(violationData.studentName);
    await this.selectViolationDate(violationData.violationDate);
    await this.enterViolationDescription(violationData.description);

    if (violationData.severity) {
      await this.selectSeverity(violationData.severity);
    }
    if (violationData.note) {
      await this.enterNote(violationData.note);
    }

    // Submit
    await this.submitViolation();
  }

  /**
   * Clear all form fields.
   */
  async clearForm(): Promise<void> {
    await this.cancelViolationForm();
  }

  // ── Statistics View ────────────────────────────────────────────────────────

  /**
   * Get all violation records from statistics table.
   */
  async getViolationRecords(): Promise<Locator[]> {
    return this.statisticsRows.all();
  }

  /**
   * Get number of violations displayed.
   */
  async getViolationCount(): Promise<number> {
    const records = await this.violationListItems.all();
    return records.length;
  }

  /**
   * Check if violation list is empty.
   */
  async isViolationListEmpty(): Promise<boolean> {
    return this.emptyStateMessage.isVisible();
  }

  /**
   * Get violation record data by index (for table rows).
   */
  async getViolationRecord(index: number): Promise<Record<string, string>> {
    const rows = await this.statisticsRows.all();
    if (rows.length <= index) return {};

    const cells = await rows[index].locator('td').all();
    const record: Record<string, string> = {};

    // Assuming columns: StudentName, ViolationType, Date, Severity, Description
    const columnNames = ['studentName', 'violationType', 'date', 'severity', 'description'];
    for (let i = 0; i < Math.min(cells.length, columnNames.length); i++) {
      const text = await cells[i].textContent();
      record[columnNames[i]] = text?.trim() || '';
    }

    return record;
  }

  /**
   * Get all violation records as array of objects.
   */
  async getAllViolations(): Promise<Record<string, string>[]> {
    const rows = await this.statisticsRows.all();
    const violations: Record<string, string>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const violation = await this.getViolationRecord(i);
      if (Object.keys(violation).length > 0) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Search/filter violations by student name.
   */
  async searchStudentViolations(studentName: string): Promise<void> {
    const searchInput = this.page.locator('input[placeholder*="Tìm", placeholder*="Tìm kiếm"]');
    if (await searchInput.isVisible()) {
      await this.jsClearAndType(searchInput, studentName);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Sort statistics by column (if sortable).
   */
  async sortByColumn(columnName: string): Promise<void> {
    const header = this.statisticsTable.locator(`th:has-text("${columnName}")`);
    if (await header.isVisible()) {
      await this.jsClick(header);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Get total violations count from header/summary (if available).
   */
  async getTotalViolationsCount(): Promise<number | null> {
    const summaryText = this.page.locator('text="Tổng vi phạm", text="Total"');
    if (await summaryText.isVisible()) {
      const text = await summaryText.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }
    return null;
  }

  /**
   * Get violations by severity (if displayed in stats).
   */
  async getViolationCountBySeverity(severity: string): Promise<number> {
    const rows = await this.statisticsRows.all();
    let count = 0;

    for (const row of rows) {
      const text = await row.textContent();
      if (text?.includes(severity)) count++;
    }

    return count;
  }

  // ── Pagination (if applicable) ─────────────────────────────────────────────

  /**
   * Get all pagination buttons.
   */
  async getPaginationButtons(): Promise<Locator[]> {
    return this.paginationButtons.all();
  }

  /**
   * Go to next page (if pagination exists).
   */
  async goToNextPage(): Promise<void> {
    const nextBtn = this.page.locator('a[rel="next"], button:has-text("Tiếp theo"), button:has-text(">>")');
    if (await nextBtn.isVisible()) {
      await this.jsClick(nextBtn);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Go to previous page (if pagination exists).
   */
  async goToPreviousPage(): Promise<void> {
    const prevBtn = this.page.locator('a[rel="prev"], button:has-text("Quay lại"), button:has-text("<<")');
    if (await prevBtn.isVisible()) {
      await this.jsClick(prevBtn);
      await this.page.waitForTimeout(1_000);
    }
  }

  // ── Export & Actions ───────────────────────────────────────────────────────

  /**
   * Export violations to CSV or Excel (if available).
   */
  async exportViolations(format: 'csv' | 'xlsx' = 'xlsx'): Promise<void> {
    const exportBtn = this.page.locator(`button:has-text("Xuất"), button:has-text("Export")`);
    if (await exportBtn.isVisible()) {
      await this.jsClick(exportBtn);
      await this.page.waitForTimeout(500);

      // Select format if menu appears
      const formatOption = this.page.locator(`text="${format.toUpperCase()}"`);
      if (await formatOption.isVisible()) {
        await this.jsClick(formatOption);
        await this.page.waitForTimeout(1_500);
      }
    }
  }

  /**
   * Delete a violation by index (if delete button available).
   */
  async deleteViolation(index: number): Promise<void> {
    const rows = await this.statisticsRows.all();
    if (rows.length > index) {
      const deleteBtn = rows[index].locator('button[data-action="delete"], button:has-text("Xóa")');
      if (await deleteBtn.isVisible()) {
        await this.jsClick(deleteBtn);
        await this.page.waitForTimeout(800);

        // Confirm deletion if modal appears
        const confirmBtn = this.page.locator('button:has-text("Xác nhận"), button:has-text("Có")');
        if (await confirmBtn.isVisible()) {
          await this.jsClick(confirmBtn);
          await this.page.waitForTimeout(1_000);
        }
      }
    }
  }

  /**
   * Edit a violation by index (if edit available).
   */
  async editViolation(index: number): Promise<void> {
    const rows = await this.statisticsRows.all();
    if (rows.length > index) {
      const editBtn = rows[index].locator('button[data-action="edit"], button:has-text("Sửa")');
      if (await editBtn.isVisible()) {
        await this.jsClick(editBtn);
        await this.page.waitForTimeout(1_000);
      }
    }
  }

  // ── Utility Methods ────────────────────────────────────────────────────────

  /**
   * Reset all filters to default state.
   */
  async resetFilters(): Promise<void> {
    await this.selectGrade('all');
    await this.selectClass('all');
    await this.page.waitForTimeout(800);
  }

  /**
   * Scroll down to load more violations (if using infinite scroll).
   */
  async loadMoreViolations(): Promise<void> {
    await this.scrollToBottom(3, 400);
  }

  /**
   * Wait for data to load (statistics or list).
   */
  async waitForDataLoad(timeoutMs = 5_000): Promise<boolean> {
    try {
      await Promise.race([
        this.statisticsRows.first().waitFor({ state: 'attached', timeout: timeoutMs }),
        this.violationListItems.first().waitFor({ state: 'attached', timeout: timeoutMs }),
        this.emptyStateMessage.waitFor({ state: 'visible', timeout: timeoutMs }),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}