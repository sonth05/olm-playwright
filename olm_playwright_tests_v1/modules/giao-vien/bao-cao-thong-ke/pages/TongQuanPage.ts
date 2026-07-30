import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Tổng Quan (3.2.1).
 * Dashboard hiển thị các thống kê chính về bài giao, giáo viên, học liệu.
 * Based on actual HTML structure from olm.vn/.../thong-ke
 */
export class TongQuanPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Main Container ─────────────────────────────────────────────────────────
  private get pageHeading(): Locator {
    return this.page.locator('h1, h2, .page-title').filter({ hasText: 'Tổng Quan' });
  }

  private get contentArea(): Locator {
    return this.page.locator('main, .main-content, .container-fluid').first();
  }

  // ── Filter & Date Range ────────────────────────────────────────────────────
  private get dateRangeFilter(): Locator {
    return this.page.locator('input[type="date"], .date-range-input');
  }

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), button:has-text("Tìm kiếm")');
  }

  private get schoolYearSelect(): Locator {
    return this.page.locator('select[name*="year"], select[name*="school"]');
  }

  // ── Statistics Cards / Metrics ─────────────────────────────────────────────
  private get statisticsCards(): Locator {
    return this.page.locator('.stat-card, .metric-card, .info-box');
  }

  private cardValue(label: string): Locator {
    return this.page.getByText(label, { exact: false }).locator('..').locator('[class*="value"], [class*="number"], span').first();
  }

  // ── Charts/Graphs ─────────────────────────────────────────────────────────
  private get chartContainers(): Locator {
    return this.page.locator('[role="img"], .chart-container, svg');
  }

  private get barChart(): Locator {
    return this.page.locator('.bar-chart, [class*="bar"], svg').first();
  }

  private get pieChart(): Locator {
    return this.page.locator('.pie-chart, [class*="pie"], svg').nth(1);
  }

  private get lineChart(): Locator {
    return this.page.locator('.line-chart, [class*="line"], svg').nth(2);
  }

  // ── Tab Navigation (if exists) ─────────────────────────────────────────────
  private get tabButtons(): Locator {
    return this.page.locator('[role="tab"], .nav-tab, .tab-button');
  }

  private get activeTab(): Locator {
    return this.page.locator('[role="tab"][aria-selected="true"], .nav-tab.active, .tab-button.active');
  }

  // ── Top 10 Tables (from charts) ────────────────────────────────────────────
  private get topClassTable(): Locator {
    return this.page.locator('table:has-text("lớp"), table:has-text("class")').first();
  }

  private get topTeacherTable(): Locator {
    return this.page.locator('table:has-text("giáo viên"), table:has-text("teacher")').first();
  }

  private get tableRows(): Locator {
    return this.page.locator('tbody tr, [role="row"]');
  }

  private tableData(rowIndex: number): Locator {
    return this.tableRows.nth(rowIndex).locator('td, [role="cell"]');
  }

  // ── Export & Actions ──────────────────────────────────────────────────────
  private get exportButton(): Locator {
    return this.page.locator('button:has-text("Xuất"), button:has-text("Export"), a:has-text("Tải")');
  }

  private get refreshButton(): Locator {
    return this.page.locator('button[title*="Làm mới"], button:has-text("Làm mới")');
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded(): Promise<boolean> {
    return await this.pageHeading.isVisible();
  }

  /**
   * Get total count of statistics cards displayed
   */
  async getStatisticsCardCount(): Promise<number> {
    return await this.statisticsCards.count();
  }

  /**
   * Get value from a specific metric card by label
   * @example getMetricValue("Tổng số bài đã giao") → "128"
   */
  async getMetricValue(label: string): Promise<string> {
    const value = await this.cardValue(label).textContent();
    return value?.trim() || '';
  }

  /**
   * Filter data by date range
   */
  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    const dateInputs = await this.dateRangeFilter.all();
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill(startDate);
      await dateInputs[1].fill(endDate);
      await this.filterButton.click();
    }
  }

  /**
   * Select school year from dropdown
   */
  async selectSchoolYear(year: string): Promise<void> {
    await this.schoolYearSelect.selectOption({ label: year });
  }

  /**
   * Get chart count (total number of charts on page)
   */
  async getChartCount(): Promise<number> {
    return await this.chartContainers.count();
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tabName: string): Promise<void> {
    await this.tabButtons.filter({ hasText: tabName }).click();
  }

  /**
   * Get current active tab name
   */
  async getActiveTabName(): Promise<string | null> {
    return await this.activeTab.textContent();
  }

  /**
   * Get all data from "Top Class" table
   */
  async getTopClassData(): Promise<string[][]> {
    const rows = await this.topClassTable.locator('tbody tr').all();
    const data: string[][] = [];
    
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      data.push(cells.map(cell => cell.trim()));
    }
    
    return data;
  }

  /**
   * Get all data from "Top Teacher" table
   */
  async getTopTeacherData(): Promise<string[][]> {
    const rows = await this.topTeacherTable.locator('tbody tr').all();
    const data: string[][] = [];
    
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      data.push(cells.map(cell => cell.trim()));
    }
    
    return data;
  }

  /**
   * Export data (trigger export button)
   */
  async exportData(): Promise<void> {
    await this.exportButton.click();
  }

  /**
   * Refresh page data
   */
  async refreshData(): Promise<void> {
    await this.refreshButton.click();
    // Wait for data to reload
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify specific metric value matches expected value
   */
  async verifyMetricValue(label: string, expectedValue: string): Promise<boolean> {
    const actualValue = await this.getMetricValue(label);
    return actualValue === expectedValue;
  }

  /**
   * Get all visible statistics cards as objects
   */
  async getAllStatistics(): Promise<{ label: string; value: string }[]> {
    const cards = await this.statisticsCards.all();
    const stats: { label: string; value: string }[] = [];
    
    for (const card of cards) {
      const label = await card.locator('[class*="label"], [class*="title"]').textContent();
      const value = await card.locator('[class*="value"], [class*="number"]').textContent();
      
      if (label && value) {
        stats.push({
          label: label.trim(),
          value: value.trim(),
        });
      }
    }
    
    return stats;
  }

  /**
   * Check if chart is visible and interactive
   */
  async isChartDisplayed(chartIndex: number = 0): Promise<boolean> {
    const charts = await this.chartContainers.all();
    if (chartIndex >= charts.length) return false;
    return await charts[chartIndex].isVisible();
  }
}