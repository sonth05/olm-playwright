import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Thống Kê Phụ Huynh Sử Dụng App (3.2.6).
 * Hiển thị bảng thống kê phụ huynh sử dụng app OLM.
 * Cột: Lớp học, Tổng số phụ huynh đăng ký, Tỷ lệ phụ huynh đăng ký, Hành động (Xem chi tiết)
 * Based on actual HTML structure from olm.vn/.../thong-ke-phu-huynh
 */
export class ThongKePhuHuynhPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Main Container ─────────────────────────────────────────────────────────
  private get pageHeading(): Locator {
    return this.page.locator('h1, h2, .page-title').filter({ hasText: /Thống Kê Phụ Huynh|Sử dụng app/ });
  }

  private get contentArea(): Locator {
    return this.page.locator('main, .main-content, .container-fluid').first();
  }

  // ── Filter & Update Info ───────────────────────────────────────────────────
  private get updateInfo(): Locator {
    return this.page.locator('[class*="update"], [class*="info"], .alert-info').filter({ hasText: /cập nhật|được hệ thống/ });
  }

  private get dateRangeStart(): Locator {
    return this.page.locator('input[type="date"]').first();
  }

  private get dateRangeEnd(): Locator {
    return this.page.locator('input[type="date"]').nth(1);
  }

  private get gradeFilter(): Locator {
    return this.page.locator('select[name*="grade"], select[name*="khoi"]');
  }

  private get classFilter(): Locator {
    return this.page.locator('select[name*="class"], select[name*="lop"]');
  }

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), button[type="submit"]');
  }

  private get clearFilterButton(): Locator {
    return this.page.locator('button:has-text("Làm mới"), button:has-text("Xóa bộ lọc")');
  }

  // ── Main Table ─────────────────────────────────────────────────────────────
  private get dataTable(): Locator {
    return this.page.locator('table').filter({ hasText: /Lớp|Phụ huynh|Tỷ lệ/ });
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
  private get classColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Lớp")');
  }

  private get totalParentColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Tổng số phụ huynh")');
  }

  private get registeredParentColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Đã đăng ký")');
  }

  private get percentageColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Tỷ lệ")');
  }

  private get actionColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Hành động")');
  }

  // ── Row Data & Actions ────────────────────────────────────────────────────
  private getRowByClass(className: string): Locator {
    return this.tableBody.locator(`tr:has-text("${className}")`);
  }

  private getClassData(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td');
  }

  private getDetailButton(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('button:has-text("Xem"), a:has-text("Xem")').first();
  }

  private getDetailButtonByClass(className: string): Locator {
    return this.getRowByClass(className).locator('button:has-text("Xem"), a:has-text("Xem")').first();
  }

  // ── Statistics Summary ────────────────────────────────────────────────────
  private get summarySection(): Locator {
    return this.page.locator('[class*="summary"], [class*="total"]').filter({ hasText: /Tổng/ });
  }

  private get totalClassesBox(): Locator {
    return this.summarySection.locator('text=/Tổng.*lớp|Total classes/i');
  }

  private get totalParentsBox(): Locator {
    return this.summarySection.locator('text=/Tổng.*phụ huynh|Total parents/i');
  }

  private get totalRegisteredBox(): Locator {
    return this.summarySection.locator('text=/Tổng.*đã đăng ký|Total registered/i');
  }

  // ── Sorting & Pagination ──────────────────────────────────────────────────
  private get sortableHeaders(): Locator {
    return this.tableHeader.locator('th[class*="sort"]');
  }

  private get paginationContainer(): Locator {
    return this.page.locator('.pagination, [role="navigation"]').filter({ hasText: /trang|page/ });
  }

  private get pageButtons(): Locator {
    return this.paginationContainer.locator('button, a').filter({ hasText: /\d+/ });
  }

  private get nextPageButton(): Locator {
    return this.paginationContainer.locator('button:has-text("Tiếp")');
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private get exportButton(): Locator {
    return this.page.locator('button:has-text("Xuất"), button:has-text("Tải")');
  }

  private get refreshButton(): Locator {
    return this.page.locator('button:has-text("Làm mới")');
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded(): Promise<boolean> {
    return await this.pageHeading.isVisible() && await this.dataTable.isVisible();
  }

  /**
   * Get update info message
   */
  async getUpdateInfo(): Promise<string> {
    const text = await this.updateInfo.textContent();
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
  async applyFilters(filters?: { grade?: string; class?: string }): Promise<void> {
    if (filters?.grade) {
      await this.gradeFilter.selectOption({ label: filters.grade });
    }
    if (filters?.class) {
      await this.classFilter.selectOption({ label: filters.class });
    }
    await this.filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.clearFilterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get total number of classes in table
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Get data from specific row by index
   */
  async getRowData(rowIndex: number): Promise<string[]> {
    const cells = await this.getClassData(rowIndex).all();
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
   * Get parent registration info for specific class
   */
  async getClassParentInfo(className: string): Promise<Record<string, string> | null> {
    const row = this.getRowByClass(className);
    const exists = await row.count() > 0;
    
    if (!exists) return null;
    
    const cells = await row.locator('td').all();
    const info: Record<string, string> = {};
    const columns = ['Lớp', 'Tổng số phụ huynh', 'Đã đăng ký', 'Tỷ lệ'];
    
    for (let i = 0; i < cells.length && i < columns.length; i++) {
      const text = await cells[i].textContent();
      info[columns[i]] = text?.trim() || '';
    }
    
    return info;
  }

  /**
   * Get total parents in class
   */
  async getTotalParentsInClass(className: string): Promise<number> {
    const info = await this.getClassParentInfo(className);
    if (!info) return 0;
    return parseInt(info['Tổng số phụ huynh']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get registered parents count for class
   */
  async getRegisteredParentsInClass(className: string): Promise<number> {
    const info = await this.getClassParentInfo(className);
    if (!info) return 0;
    return parseInt(info['Đã đăng ký']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get registration percentage for class
   */
  async getRegistrationPercentage(className: string): Promise<number> {
    const info = await this.getClassParentInfo(className);
    if (!info) return 0;
    return parseInt(info['Tỷ lệ']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * View details for specific class
   */
  async viewClassDetails(className: string): Promise<void> {
    await this.getDetailButtonByClass(className).click();
  }

  /**
   * View details for class by row index
   */
  async viewClassDetailsByIndex(rowIndex: number): Promise<void> {
    await this.getDetailButton(rowIndex).click();
  }

  /**
   * Get all registration percentages
   */
  async getAllRegistrationPercentages(): Promise<number[]> {
    const allData = await this.getAllTableData();
    return allData.map(row => {
      const percent = row[3]?.replace(/[^\d]/g, '') || '0';
      return parseInt(percent);
    });
  }

  /**
   * Get class with lowest registration rate
   */
  async getLowestRegistrationClass(): Promise<string | null> {
    const allData = await this.getAllTableData();
    if (allData.length === 0) return null;
    
    let lowestClass = allData[0][0];
    let lowestPercent = parseInt(allData[0][3]?.replace(/[^\d]/g, '') || '100');
    
    for (const row of allData) {
      const percent = parseInt(row[3]?.replace(/[^\d]/g, '') || '100');
      if (percent < lowestPercent) {
        lowestPercent = percent;
        lowestClass = row[0];
      }
    }
    
    return lowestClass;
  }

  /**
   * Get class with highest registration rate
   */
  async getHighestRegistrationClass(): Promise<string | null> {
    const allData = await this.getAllTableData();
    if (allData.length === 0) return null;
    
    let highestClass = allData[0][0];
    let highestPercent = parseInt(allData[0][3]?.replace(/[^\d]/g, '') || '0');
    
    for (const row of allData) {
      const percent = parseInt(row[3]?.replace(/[^\d]/g, '') || '0');
      if (percent > highestPercent) {
        highestPercent = percent;
        highestClass = row[0];
      }
    }
    
    return highestClass;
  }

  /**
   * Get average registration rate across all classes
   */
  async getAverageRegistrationRate(): Promise<number> {
    const percentages = await this.getAllRegistrationPercentages();
    if (percentages.length === 0) return 0;
    const sum = percentages.reduce((a, b) => a + b, 0);
    return Math.round(sum / percentages.length);
  }

  /**
   * Get total classes from summary
   */
  async getTotalClassesFromSummary(): Promise<number> {
    const text = await this.totalClassesBox.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get total parents from summary
   */
  async getTotalParentsFromSummary(): Promise<number> {
    const text = await this.totalParentsBox.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get total registered from summary
   */
  async getTotalRegisteredFromSummary(): Promise<number> {
    const text = await this.totalRegisteredBox.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
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
   * Go to specific page number
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
   * Find class in table
   */
  async findClass(className: string): Promise<boolean> {
    const row = this.getRowByClass(className);
    return await row.count() > 0;
  }

  /**
   * Get classes with low registration (below threshold)
   */
  async getClassesWithLowRegistration(threshold: number = 50): Promise<string[]> {
    const allData = await this.getAllTableData();
    return allData
      .filter(row => {
        const percent = parseInt(row[3]?.replace(/[^\d]/g, '') || '0');
        return percent < threshold;
      })
      .map(row => row[0]);
  }

  /**
   * Verify class exists and get its full info
   */
  async verifyAndGetClassInfo(className: string): Promise<Record<string, string> | null> {
    return await this.getClassParentInfo(className);
  }
}