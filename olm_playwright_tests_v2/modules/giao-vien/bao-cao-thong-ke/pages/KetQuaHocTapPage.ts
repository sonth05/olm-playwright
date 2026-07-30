import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Kết Quả Học Tập (3.2.2).
 * Thống kê kết quả học tập của toàn trường.
 * Hiển thị các chỉ số: Tổng bài giao, Tổng lượt giao, Tổng hoàn thành, Tỉ lệ, v.v.
 * Based on actual HTML structure from olm.vn/.../ket-qua-hoc-tap
 */
export class KetQuaHocTapPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Main Container ─────────────────────────────────────────────────────────
  private get pageHeading(): Locator {
    return this.page.locator('h1, h2, .page-title').filter({ hasText: 'Kết Quả Học Tập' });
  }

  private get contentArea(): Locator {
    return this.page.locator('main, .main-content, .container-fluid').first();
  }

  // ── Update Info ────────────────────────────────────────────────────────────
  private get lastUpdateInfo(): Locator {
    return this.page.locator('[class*="update"], [class*="modified"]').filter({ hasText: /lần cuối|updated|cập nhật/ });
  }

  private get updateMessage(): Locator {
    return this.page.locator('[class*="info"], [class*="message"]').filter({ hasText: /cập nhật|hệ thống|phút|giờ/ });
  }

  // ── Date & Filter ──────────────────────────────────────────────────────────
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

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), button[type="submit"]');
  }

  private get filterClearButton(): Locator {
    return this.page.locator('button:has-text("Làm mới"), button:has-text("Xóa bộ lọc")');
  }

  // ── Statistics Boxes (Tổng số bài đã giao, v.v.) ────────────────────────────
  private get statisticsBoxes(): Locator {
    return this.page.locator('[class*="box"], [class*="card"], [class*="stat"]').filter({ hasText: /Tổng|lượt|hoàn/ });
  }

  private get boxTitle(): Locator {
    return this.statisticsBoxes.locator('[class*="label"], [class*="title"], span').first();
  }

  private get boxValue(): Locator {
    return this.statisticsBoxes.locator('[class*="value"], [class*="number"], strong, h3').first();
  }

  private get boxPercentage(): Locator {
    return this.statisticsBoxes.locator('[class*="percent"], [class*="rate"], span:has-text("%")');
  }

  // ── Statistics Data Points (Individual metrics) ────────────────────────────
  private get totalAssignmentBox(): Locator {
    return this.page.locator('text=/Tổng số bài đã giao|Total assignments/i').locator('..');
  }

  private get totalAttemptsBox(): Locator {
    return this.page.locator('text=/Tổng số lượt đã giao|Total attempts/i').locator('..');
  }

  private get completedBox(): Locator {
    return this.page.locator('text=/Tổng số bài hoàn thành|Completed/i').locator('..');
  }

  private get percentageCompletedBox(): Locator {
    return this.page.locator('text=/Tỉ lệ hoàn thành|Completion rate/i').locator('..');
  }

  private get averageScoreBox(): Locator {
    return this.page.locator('text=/Điểm trung bình|Average score/i').locator('..');
  }

  // ── Status Indicators ──────────────────────────────────────────────────────
  private get statusBadges(): Locator {
    return this.page.locator('[class*="badge"], [class*="label"]').filter({ hasText: /thành công|cảnh báo|lỗi|warning|error/i });
  }

  private get successBadge(): Locator {
    return this.page.locator('[class*="badge-success"], [class*="success"]').first();
  }

  private get warningBadge(): Locator {
    return this.page.locator('[class*="badge-warning"], [class*="warning"]').first();
  }

  private get errorBadge(): Locator {
    return this.page.locator('[class*="badge-danger"], [class*="error"]').first();
  }

  // ── Action Buttons ────────────────────────────────────────────────────────
  private get exportButton(): Locator {
    return this.page.locator('button:has-text("Tải"), button:has-text("Xuất"), a:has-text("Tải")');
  }

  private get downloadButton(): Locator {
    return this.page.locator('[class*="download"], button[title*="tải"]');
  }

  private get moreDetailsButton(): Locator {
    return this.page.locator('button:has-text("Chi tiết"), a:has-text("Chi tiết")');
  }

  // ── Methods ────────────────────────────────────────────────────────────────

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded(): Promise<boolean> {
    return await this.pageHeading.isVisible();
  }

  /**
   * Get last update time
   */
  async getLastUpdateTime(): Promise<string> {
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
   * Apply filters and get results
   */
  async applyFilters(classValue?: string, subjectValue?: string): Promise<void> {
    if (classValue) {
      await this.classFilter.selectOption({ label: classValue });
    }
    if (subjectValue) {
      await this.subjectFilter.selectOption({ label: subjectValue });
    }
    await this.filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.filterClearButton.click();
  }

  /**
   * Get total number of statistics boxes
   */
  async getStatisticsBoxCount(): Promise<number> {
    return await this.statisticsBoxes.count();
  }

  /**
   * Get value from specific metric box
   * @example getValue("Tổng số bài đã giao") → "145"
   */
  async getValue(metricLabel: string): Promise<string> {
    const box = this.page.locator(`text="${metricLabel}"`).locator('..');
    const value = await box.locator('[class*="value"], [class*="number"], strong').textContent();
    return value?.trim().replace(/[^\d]/g, '') || '';
  }

  /**
   * Get percentage from metric box
   * @example getPercentage("Tỉ lệ hoàn thành") → "85"
   */
  async getPercentage(metricLabel: string): Promise<string> {
    const box = this.page.locator(`text="${metricLabel}"`).locator('..');
    const percent = await box.locator('[class*="percent"], span:has-text("%")').textContent();
    return percent?.trim().replace(/[^\d]/g, '') || '';
  }

  /**
   * Get total assignments count
   */
  async getTotalAssignments(): Promise<number> {
    const value = await this.totalAssignmentBox.locator('[class*="value"], strong').textContent();
    return parseInt(value?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get total attempts count
   */
  async getTotalAttempts(): Promise<number> {
    const value = await this.totalAttemptsBox.locator('[class*="value"], strong').textContent();
    return parseInt(value?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get completion rate percentage
   */
  async getCompletionRate(): Promise<number> {
    const value = await this.percentageCompletedBox.locator('[class*="percent"], span').textContent();
    return parseInt(value?.replace(/[^\d]/g, '') || '0');
  }

  /**
   * Get average score
   */
  async getAverageScore(): Promise<number> {
    const value = await this.averageScoreBox.locator('[class*="value"], strong').textContent();
    return parseFloat(value?.replace(/[^\d.]/g, '') || '0');
  }

  /**
   * Get all statistics data as object
   */
  async getAllStatistics(): Promise<Record<string, string>> {
    const stats: Record<string, string> = {};
    const boxes = await this.statisticsBoxes.all();
    
    for (const box of boxes) {
      const title = await box.locator('[class*="label"], [class*="title"]').textContent();
      const value = await box.locator('[class*="value"], [class*="number"]').textContent();
      
      if (title) {
        stats[title.trim()] = value?.trim() || '';
      }
    }
    
    return stats;
  }

  /**
   * Check if there are warning indicators
   */
  async hasWarnings(): Promise<boolean> {
    return await this.warningBadge.isVisible();
  }

  /**
   * Check if there are error indicators
   */
  async hasErrors(): Promise<boolean> {
    return await this.errorBadge.isVisible();
  }

  /**
   * Check if all metrics show success status
   */
  async isAllSuccessful(): Promise<boolean> {
    const hasWarning = await this.warningBadge.isVisible().catch(() => false);
    const hasError = await this.errorBadge.isVisible().catch(() => false);
    return !hasWarning && !hasError;
  }

  /**
   * Export statistics data
   */
  async exportData(): Promise<void> {
    await this.exportButton.click();
  }

  /**
   * View more details
   */
  async viewMoreDetails(): Promise<void> {
    await this.moreDetailsButton.click();
  }

  /**
   * Verify specific metric value
   */
  async verifyMetricValue(metricLabel: string, expectedValue: string): Promise<boolean> {
    const actualValue = await this.getValue(metricLabel);
    return actualValue === expectedValue.replace(/[^\d]/g, '');
  }

  /**
   * Wait for data to update
   */
  async waitForDataUpdate(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
  }
}