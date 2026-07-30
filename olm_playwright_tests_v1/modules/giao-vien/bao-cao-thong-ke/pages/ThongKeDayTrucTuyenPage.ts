import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Thống Kê Dạy Trực Tuyến (3.2.5).
 * Hiển thị bảng thống kê số buổi dạy trực tuyến và Zoom/Meet qua hệ thống.
 * Cột: Giáo viên, Số buối dạy, Số lần vào Zoom/Meet qua hệ thống
 * Based on actual HTML structure from olm.vn/.../thong-ke-day-truc-tuyen
 */
export class ThongKeDayTrucTuyenPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Main Container ─────────────────────────────────────────────────────────
  private get pageHeading(): Locator {
    return this.page.locator('h1, h2, .page-title').filter({ hasText: /Thống Kê Dạy Trực Tuyến|Dạy trực tuyến/ });
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

  private get classNameFilter(): Locator {
    return this.page.locator('select[name*="class_name"], input[placeholder*="Nhóm giáo viên"]');
  }

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), button[type="submit"]');
  }

  // ── Tabs (if exists) ───────────────────────────────────────────────────────
  private get tabContainer(): Locator {
    return this.page.locator('[role="tablist"], .nav-tabs');
  }

  private get teacherTab(): Locator {
    return this.page.locator('[role="tab"]:has-text("Giáo viên")');
  }

  private get classTab(): Locator {
    return this.page.locator('[role="tab"]:has-text("Lớp học")');
  }

  private get tabContent(): Locator {
    return this.page.locator('[role="tabpanel"]');
  }

  // ── Main Table ─────────────────────────────────────────────────────────────
  private get dataTable(): Locator {
    return this.page.locator('table').filter({ hasText: /Giáo viên|Số buối/ });
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

  private get lessonCountColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Số buối dạy")');
  }

  private get zoomMeetColumn(): Locator {
    return this.tableHeader.locator('th:has-text("Zoom"), th:has-text("Meet"), th:has-text("hệ thống")');
  }

  // ── Row Data ──────────────────────────────────────────────────────────────
  private getRowByTeacher(teacherName: string): Locator {
    return this.tableBody.locator(`tr:has-text("${teacherName}")`);
  }

  private getTeacherData(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td');
  }

  // ── Statistics Summary ────────────────────────────────────────────────────
  private get summarySection(): Locator {
    return this.page.locator('[class*="summary"], [class*="total"], .alert-info');
  }

  private get totalLessons(): Locator {
    return this.summarySection.locator('text=/Tổng.*buối|Total lessons/i');
  }

  private get totalZoomSessions(): Locator {
    return this.summarySection.locator('text=/Tổng.*Zoom|Total Zoom/i');
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  private get paginationContainer(): Locator {
    return this.page.locator('.pagination, [role="navigation"]').filter({ hasText: /trang|page/ });
  }

  private get pageButtons(): Locator {
    return this.paginationContainer.locator('button, a').filter({ hasText: /\d+/ });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  private get exportButton(): Locator {
    return this.page.locator('button:has-text("Xuất"), button:has-text("Tải")');
  }

  private get downloadButton(): Locator {
    return this.page.locator('[class*="download"], a:has-text("Tải")');
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
   * Set date range filter
   */
  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await this.dateRangeStart.fill(startDate);
    await this.dateRangeEnd.fill(endDate);
  }

  /**
   * Apply filters
   */
  async applyFilters(filters?: { class?: string; className?: string }): Promise<void> {
    if (filters?.class) {
      await this.classFilter.selectOption({ label: filters.class });
    }
    if (filters?.className) {
      await this.classNameFilter.selectOption({ label: filters.className });
    }
    await this.filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to teacher tab
   */
  async switchToTeacherTab(): Promise<void> {
    await this.teacherTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to class tab
   */
  async switchToClassTab(): Promise<void> {
    await this.classTab.click();
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
   * Get teacher online teaching info
   */
  async getTeacherOnlineTeachingInfo(teacherName: string): Promise<Record<string, string> | null> {
    const row = this.getRowByTeacher(teacherName);
    const exists = await row.count() > 0;
    
    if (!exists) return null;
    
    const cells = await row.locator('td').all();
    const info: Record<string, string> = {};
    const columns = ['Giáo viên', 'Số buối dạy', 'Số lần vào Zoom/Meet'];
    
    for (let i = 0; i < cells.length && i < columns.length; i++) {
      const text = await cells[i].textContent();
      info[columns[i]] = text?.trim() || '';
    }
    
    return info;
  }

  /**
   * Get lesson count for teacher
   */
  async getTeacherLessonCount(teacherName: string): Promise<number> {
    const info = await this.getTeacherOnlineTeachingInfo(teacherName);
    if (!info) return 0;
    return parseInt(info['Số buối dạy']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get Zoom/Meet session count for teacher
   */
  async getTeacherZoomMeetCount(teacherName: string): Promise<number> {
    const info = await this.getTeacherOnlineTeachingInfo(teacherName);
    if (!info) return 0;
    return parseInt(info['Số lần vào Zoom/Meet']?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get all lesson counts (column)
   */
  async getAllLessonCounts(): Promise<number[]> {
    const allData = await this.getAllTableData();
    return allData.map(row => parseInt(row[1]?.replace(/[^\d]/g, '') || '0'));
  }

  /**
   * Get all Zoom/Meet counts (column)
   */
  async getAllZoomMeetCounts(): Promise<number[]> {
    const allData = await this.getAllTableData();
    return allData.map(row => parseInt(row[2]?.replace(/[^\d]/g, '') || '0'));
  }

  /**
   * Get total lessons count from summary
   */
  async getTotalLessonsCount(): Promise<number> {
    const text = await this.totalLessons.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get total Zoom/Meet sessions from summary
   */
  async getTotalZoomMeetCount(): Promise<number> {
    const text = await this.totalZoomSessions.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Find teacher with most lessons
   */
  async getTopTeacher(): Promise<string | null> {
    const allData = await this.getAllTableData();
    if (allData.length === 0) return null;
    
    let topTeacher = allData[0][0];
    let maxLessons = parseInt(allData[0][1]?.replace(/[^\d]/g, '') || '0');
    
    for (const row of allData) {
      const lessons = parseInt(row[1]?.replace(/[^\d]/g, '') || '0');
      if (lessons > maxLessons) {
        maxLessons = lessons;
        topTeacher = row[0];
      }
    }
    
    return topTeacher;
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
   * Go to specific page (if paginated)
   */
  async goToPage(pageNumber: number): Promise<void> {
    await this.pageButtons.filter({ hasText: pageNumber.toString() }).click();
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
   * Find teacher in table
   */
  async findTeacher(teacherName: string): Promise<boolean> {
    const row = this.getRowByTeacher(teacherName);
    return await row.count() > 0;
  }

  /**
   * Get average lessons per teacher
   */
  async getAverageLessonsPerTeacher(): Promise<number> {
    const counts = await this.getAllLessonCounts();
    if (counts.length === 0) return 0;
    const sum = counts.reduce((a, b) => a + b, 0);
    return Math.round(sum / counts.length);
  }

  /**
   * Get average Zoom/Meet sessions per teacher
   */
  async getAverageZoomMeetPerTeacher(): Promise<number> {
    const counts = await this.getAllZoomMeetCounts();
    if (counts.length === 0) return 0;
    const sum = counts.reduce((a, b) => a + b, 0);
    return Math.round(sum / counts.length);
  }
}