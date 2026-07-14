import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Thống Kê Học Liệu (3.2.4).
 * Hiển thị bảng thống kê các loại học liệu theo giáo viên.
 * Cột: Giáo viên, Số cộ hội, Số video, Lý thuyết, Luyện tập, Bài đánh giá, Bài kiểm tra, Bài NHCH, Tổng
 * Based on actual HTML structure from olm.vn/.../thong-ke-hoc-lieu
 */
export class ThongKeHocLieuPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Main Container ─────────────────────────────────────────────────────────
  private get pageHeading(): Locator {
    return this.page.locator('h1, h2, .page-title').filter({ hasText: /Thống Kê Học Liệu|Thống kê học liệu/ });
  }

  private get contentArea(): Locator {
    return this.page.locator('main, .main-content, .container-fluid').first();
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

  private get subjectFilter(): Locator {
    return this.page.locator('select[name*="subject"], select[name*="mon"]');
  }

  private get typeFilter(): Locator {
    return this.page.locator('select[name*="type"], select[name*="loai"]');
  }

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), button[type="submit"]');
  }

  // ── Main Table ─────────────────────────────────────────────────────────────
  private get dataTable(): Locator {
    return this.page.locator('table').filter({ hasText: /Giáo viên|Số cộ/ });
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

  // ── Column Headers ────────────────────────────────────────────────────────
  private get teacherColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Giáo viên")');
  }

  private get videoColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Video"), th:has-text("video")');
  }

  private get theoryColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Lý thuyết")');
  }

  private get practiceColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Luyện tập")');
  }

  private get assessmentColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Bài đánh giá")');
  }

  private get testColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Bài kiểm tra")');
  }

  private get examColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Bài NHCH")');
  }

  private get totalColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Tổng")').last();
  }

  // ── Row Data ──────────────────────────────────────────────────────────────
  private getRowByTeacher(teacherName: string): Locator {
    return this.tableBody.locator(`tr:has-text("${teacherName}")`);
  }

  private getTeacherData(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td');
  }

  // ── Sorting & Pagination ──────────────────────────────────────────────────
  private get sortableHeaders(): Locator {
    return this.tableHeader.locator('th[class*="sort"], th[role="columnheader"]');
  }

  private get paginationContainer(): Locator {
    return this.page.locator('.pagination, [role="navigation"]').filter({ hasText: /trang|page/ });
  }

  private get pageButtons(): Locator {
    return this.paginationContainer.locator('button, a').filter({ hasText: /\d+/ });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private get exportButton(): Locator {
    return this.page.locator('button:has-text("Xuất"), button:has-text("Tải"), a:has-text("Tải")');
  }

  private get refreshButton(): Locator {
    return this.page.locator('button:has-text("Làm mới"), button[title*="làm mới"]');
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded(): Promise<boolean> {
    return await this.pageHeading.isVisible() && await this.dataTable.isVisible();
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
  async applyFilters(filters?: { class?: string; subject?: string; type?: string }): Promise<void> {
    if (filters?.class) {
      await this.classFilter.selectOption({ label: filters.class });
    }
    if (filters?.subject) {
      await this.subjectFilter.selectOption({ label: filters.subject });
    }
    if (filters?.type) {
      await this.typeFilter.selectOption({ label: filters.type });
    }
    await this.filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total number of rows
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
   * Get teacher learning materials info
   */
  async getTeacherMaterialsInfo(teacherName: string): Promise<Record<string, string> | null> {
    const row = this.getRowByTeacher(teacherName);
    const exists = await row.count() > 0;
    
    if (!exists) return null;
    
    const cells = await row.locator('td').all();
    const info: Record<string, string> = {};
    const columns = ['Giáo viên', 'Số cộ hội', 'Số video', 'Lý thuyết', 'Luyện tập', 'Bài đánh giá', 'Bài kiểm tra', 'Bài NHCH', 'Tổng'];
    
    for (let i = 0; i < cells.length && i < columns.length; i++) {
      const text = await cells[i].textContent();
      info[columns[i]] = text?.trim() || '';
    }
    
    return info;
  }

  /**
   * Get count of specific material type
   */
  async getMaterialCount(teacherName: string, materialType: string): Promise<number> {
    const info = await this.getTeacherMaterialsInfo(teacherName);
    if (!info) return 0;
    
    const typeKey = materialType.toLowerCase();
    const value = info[materialType]?.replace(/[^\d]/g, '') || '0';
    return parseInt(value);
  }

  /**
   * Get total materials for teacher
   */
  async getTeacherTotalMaterials(teacherName: string): Promise<number> {
    const info = await this.getTeacherMaterialsInfo(teacherName);
    if (!info) return 0;
    return parseInt(info['Tổng']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get column values for specific material type
   */
  async getColumnValues(columnName: string): Promise<string[]> {
    const headers = ['Giáo viên', 'Số cộ hội', 'Số video', 'Lý thuyết', 'Luyện tập', 'Bài đánh giá', 'Bài kiểm tra', 'Bài NHCH', 'Tổng'];
    const headerIndex = headers.indexOf(columnName);
    
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
   * Get material breakdown (count by type) across all teachers
   */
  async getMaterialBreakdown(): Promise<Record<string, number>> {
    const headers = ['Số cộ hội', 'Số video', 'Lý thuyết', 'Luyện tập', 'Bài đánh giá', 'Bài kiểm tra', 'Bài NHCH'];
    const breakdown: Record<string, number> = {};
    
    for (const header of headers) {
      const values = await this.getColumnValues(header);
      const total = values.reduce((sum, val) => {
        const num = parseInt(val.replace(/[^\d]/g, '') || '0');
        return sum + num;
      }, 0);
      breakdown[header] = total;
    }
    
    return breakdown;
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
   * Go to specific page
   */
  async goToPage(pageNumber: number): Promise<void> {
    await this.pageButtons.filter({ hasText: pageNumber.toString() }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if table has data
   */
  async hasData(): Promise<boolean> {
    return await this.getRowCount() > 0;
  }

  /**
   * Export data
   */
  async exportData(): Promise<void> {
    await this.exportButton.click();
  }

  /**
   * Refresh page data
   */
  async refreshData(): Promise<void> {
    await this.refreshButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get table headers
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

  /**
   * Search for teacher in table
   */
  async findTeacher(teacherName: string): Promise<boolean> {
    const row = this.getRowByTeacher(teacherName);
    return await row.count() > 0;
  }

  /**
   * Get teachers with most materials
   */
  async getTopTeachers(limit: number = 5): Promise<string[]> {
    const allData = await this.getAllTableData();
    const sorted = allData
      .map((row, idx) => ({
        name: row[0],
        total: parseInt(row[row.length - 1]?.replace(/[^\d]/g, '') || '0'),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
    
    return sorted.map(item => item.name);
  }
}