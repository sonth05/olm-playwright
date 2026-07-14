import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Kết Quả Giảng Dạy (Thống Kê) (3.2.3).
 * Hiển thị bảng thống kê kết quả giảng dạy theo từng giáo viên.
 * Cột: Giáo viên, Số bài giao, Số lượt giao, Số lượt làm, Tỉ lệ HS làm bài, v.v.
 * Based on actual HTML structure from olm.vn/.../ket-qua-giang-day
 */
export class KetQuaGiangDayThongKePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Main Container ─────────────────────────────────────────────────────────
  private get pageHeading(): Locator {
    return this.page.locator('h1, h2, .page-title').filter({ hasText: /Kết Quả Giảng Dạy|Kết quả giảng dạy/ });
  }

  private get contentArea(): Locator {
    return this.page.locator('main, .main-content, .container-fluid').first();
  }

  // ── Update Info ────────────────────────────────────────────────────────────
  private get lastUpdateInfo(): Locator {
    return this.page.locator('[class*="update"], [class*="modified"], .alert-info').filter({ hasText: /lần cuối|cập nhật|updated/ });
  }

  private get updateMessage(): Locator {
    return this.page.locator('text=/được hệ thống tự động|tự động cập nhật/i');
  }

  // ── Filter Section ─────────────────────────────────────────────────────────
  private get dateRangeStart(): Locator {
    return this.page.locator('input[type="date"]').first();
  }

  private get dateRangeEnd(): Locator {
    return this.page.locator('input[type="date"]').nth(1);
  }

  private get classFilter(): Locator {
    return this.page.locator('select[name*="class"], select[name*="lop"]');
  }

  private get teacherFilter(): Locator {
    return this.page.locator('select[name*="teacher"], select[name*="giao_vien"]');
  }

  private get subjectFilter(): Locator {
    return this.page.locator('select[name*="subject"], select[name*="mon"]');
  }

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), button[type="submit"]');
  }

  // ── Main Table ─────────────────────────────────────────────────────────────
  private get dataTable(): Locator {
    return this.page.locator('table').filter({ hasText: /Giáo viên|Số bài giao/ });
  }

  private get tableHeader(): Locator {
    return this.dataTable.locator('thead');
  }

  private get tableBody(): Locator {
    return this.dataTable.locator('tbody');
  }

  private get tableRows(): Locator {
    return this.tableBody.locator('tr');
  }

  private get tableCells(): Locator {
    return this.tableRows.locator('td, [role="cell"]');
  }

  // ── Column Headers ────────────────────────────────────────────────────────
  private get teacherColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Giáo viên")');
  }

  private get assignmentColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Số bài giao"), th:has-text("Bài giao")');
  }

  private get attemptsColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Số lượt giao")');
  }

  private get completionColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Số lượt làm")');
  }

  private get percentageColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Tỉ lệ")');
  }

  // ── Row Data ──────────────────────────────────────────────────────────────
  private getRowByTeacher(teacherName: string): Locator {
    return this.tableBody.locator(`tr:has-text("${teacherName}")`);
  }

  private getTeacherData(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td');
  }

  // ── Pagination & Sorting ──────────────────────────────────────────────────
  private get paginationContainer(): Locator {
    return this.page.locator('.pagination, [role="navigation"]').filter({ hasText: /trang|page/ });
  }

  private get pageButtons(): Locator {
    return this.paginationContainer.locator('button, a').filter({ hasText: /\d+/ });
  }

  private get nextPageButton(): Locator {
    return this.paginationContainer.locator('button:has-text("Tiếp"), a:has-text("Tiếp")');
  }

  private get prevPageButton(): Locator {
    return this.paginationContainer.locator('button:has-text("Trước"), a:has-text("Trước")');
  }

  private get sortableHeaders(): Locator {
    return this.tableHeader.locator('th[class*="sort"], th[role="columnheader"]');
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private get exportButton(): Locator {
    return this.page.locator('button:has-text("Xuất"), button:has-text("Tải"), a:has-text("Tải")');
  }

  private get downloadButton(): Locator {
    return this.page.locator('[class*="download"], button[title*="tải"]');
  }

  // ── Status Badges ──────────────────────────────────────────────────────────
  private get statusBadges(): Locator {
    return this.tableBody.locator('[class*="badge"], [class*="label"]');
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded(): Promise<boolean> {
    return await this.pageHeading.isVisible() && await this.dataTable.isVisible();
  }

  /**
   * Get last update info message
   */
  async getLastUpdateInfo(): Promise<string> {
    const text = await this.lastUpdateInfo.textContent();
    return text?.trim() || '';
  }

  /**
   * Set date range filter
   */
  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await this.dateRangeStart.fill(startDate);
    await this.dateRangeEnd.fill(endDate);
  }

  /**
   * Apply filters
   */
  async applyFilters(filters?: { class?: string; teacher?: string; subject?: string }): Promise<void> {
    if (filters?.class) {
      await this.classFilter.selectOption({ label: filters.class });
    }
    if (filters?.teacher) {
      await this.teacherFilter.selectOption({ label: filters.teacher });
    }
    if (filters?.subject) {
      await this.subjectFilter.selectOption({ label: filters.subject });
    }
    await this.filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total number of rows in table
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Get data from specific row by index
   */
  async getRowData(rowIndex: number): Promise<string[]> {
    const cells = await this.getTeacherData(rowIndex).all();
    const data: string[] = [];
    
    for (const cell of cells) {
      const text = await cell.textContent();
      data.push(text?.trim() || '');
    }
    
    return data;
  }

  /**
   * Get all table data
   */
  async getAllTableData(): Promise<string[][]> {
    const rows = await this.tableRows.all();
    const allData: string[][] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const rowData = await this.getRowData(i);
      allData.push(rowData);
    }
    
    return allData;
  }

  /**
   * Get teacher info from table
   */
  async getTeacherInfo(teacherName: string): Promise<Record<string, string> | null> {
    const row = this.getRowByTeacher(teacherName);
    const exists = await row.count() > 0;
    
    if (!exists) return null;
    
    const cells = await row.locator('td').all();
    const info: Record<string, string> = {};
    const headers = ['Giáo viên', 'Số bài giao', 'Số lượt giao', 'Số lượt làm', 'Tỉ lệ'];
    
    for (let i = 0; i < cells.length && i < headers.length; i++) {
      const text = await cells[i].textContent();
      info[headers[i]] = text?.trim() || '';
    }
    
    return info;
  }

  /**
   * Get column values for specific header
   */
  async getColumnValues(columnName: string): Promise<string[]> {
    const headerIndex = ['Giáo viên', 'Số bài giao', 'Số lượt giao', 'Số lượt làm', 'Tỉ lệ'].indexOf(columnName);
    
    if (headerIndex === -1) return [];
    
    const values: string[] = [];
    const rows = await this.tableRows.all();
    
    for (const row of rows) {
      const cells = await row.locator('td').all();
      if (cells.length > headerIndex) {
        const text = await cells[headerIndex].textContent();
        values.push(text?.trim() || '');
      }
    }
    
    return values;
  }

  /**
   * Sort table by column
   */
  async sortByColumn(columnName: string): Promise<void> {
    const header = this.tableHeader.locator(`th:has-text("${columnName}")`);
    await header.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to next page (if paginated)
   */
  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to previous page (if paginated)
   */
  async goToPreviousPage(): Promise<void> {
    await this.prevPageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to specific page number
   */
  async goToPage(pageNumber: number): Promise<void> {
    await this.pageButtons.filter({ hasText: pageNumber.toString() }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if table has any data
   */
  async hasData(): Promise<boolean> {
    const rowCount = await this.getRowCount();
    return rowCount > 0;
  }

  /**
   * Export data to file
   */
  async exportData(): Promise<void> {
    await this.exportButton.click();
  }

  /**
   * Search for teacher in table
   */
  async findTeacher(teacherName: string): Promise<boolean> {
    const row = this.getRowByTeacher(teacherName);
    return await row.count() > 0;
  }

  /**
   * Get assignment count for specific teacher
   */
  async getTeacherAssignmentCount(teacherName: string): Promise<number> {
    const info = await this.getTeacherInfo(teacherName);
    if (!info) return 0;
    return parseInt(info['Số bài giao']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get completion rate for specific teacher
   */
  async getTeacherCompletionRate(teacherName: string): Promise<number> {
    const info = await this.getTeacherInfo(teacherName);
    if (!info) return 0;
    return parseInt(info['Tỉ lệ']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get headers of table
   */
  async getTableHeaders(): Promise<string[]> {
    const headers = await this.tableHeader.locator('th').all();
    const headerTexts: string[] = [];
    
    for (const header of headers) {
      const text = await header.textContent();
      headerTexts.push(text?.trim() || '');
    }
    
    return headerTexts;
  }
}