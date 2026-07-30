import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Điểm danh (1.6.1).
 * Quản lý điểm danh học sinh, có kèm bộ lọc và hỗ trợ Zoom/Meet integration.
 * Based on actual HTML structure from olm.vn/checkin
 */
export class DiemDanhPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ──────────────────────────────────────────────────────────────

  private get yearSelector(): Locator {
    return this.page.locator('select.select-school-year-student-checkin');
  }

  private get gradeFilter(): Locator {
    return this.page.locator('#grade');
  }

  private get classFilter(): Locator {
    return this.page.locator('#filterSpecificGroup');
  }

  private get sessionFilter(): Locator {
    return this.page.locator('#session');
  }

  private get dateFilterInput(): Locator {
    return this.page.locator('#date-filter');
  }

  private get filterButton(): Locator {
    return this.page.locator('#frmFilterDate');
  }

  private get attendanceList(): Locator {
    return this.page.locator('ul.list-group.list-group-flush');
  }

  private get attendanceItems(): Locator {
    return this.page.locator('li.list-group-item');
  }

  private get attendanceLinks(): Locator {
    return this.attendanceItems.locator('a');
  }

  private get noAttendanceMessage(): Locator {
    return this.page.locator('text="Chưa có điểm danh nào", text="Không có dữ liệu"');
  }

  private get pageHeading(): Locator {
    return this.page.locator('h2:has-text("Quản lý điểm danh")');
  }

  // Zoom/Meet Integration selectors
  private get zoomToggle(): Locator {
    return this.page.locator('input[name="zoomEnabled"], input[id*="zoom"], label:has-text("Zoom")');
  }

  private get meetToggle(): Locator {
    return this.page.locator('input[name="meetEnabled"], input[id*="meet"], label:has-text("Meet")');
  }

  private get startSessionButton(): Locator {
    return this.page.locator('button:has-text("Bắt đầu điểm danh"), button:has-text("Start"), button[id*="start"]');
  }

  private get endSessionButton(): Locator {
    return this.page.locator('button:has-text("Kết thúc điểm danh"), button:has-text("End"), button[id*="end"]');
  }

  private get videoPreview(): Locator {
    return this.page.locator('video, .video-preview, [id*="video"]');
  }

  private get sessionStatus(): Locator {
    return this.page.locator('.session-status, [data-status], .badge-status');
  }

  private get presentCount(): Locator {
    return this.page.locator('.present-count, [data-count="present"]');
  }

  private get absentCount(): Locator {
    return this.page.locator('.absent-count, [data-count="absent"]');
  }

  private get lateCount(): Locator {
    return this.page.locator('.late-count, [data-count="late"]');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Open the Điểm danh (Attendance) page.
   * URL: /checkin
   */
  async open(): Promise<void> {
    await this.navigateTo('/checkin');
    await this.waitForSelector('h2:has-text("Quản lý điểm danh")', 10_000);
  }

  /**
   * Wait for attendance list to load.
   */
  async waitForAttendanceListLoad(timeoutMs = 5_000): Promise<boolean> {
    try {
      await Promise.race([
        this.attendanceLinks.first().waitFor({ state: 'attached', timeout: timeoutMs }),
        this.noAttendanceMessage.waitFor({ state: 'visible', timeout: timeoutMs }),
      ]);
      return true;
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

  // ── Grade Selection ────────────────────────────────────────────────────────

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
      if (value && value !== 'all') {
        const text = await opt.textContent();
        if (text) grades.push(text.trim());
      }
    }
    return grades;
  }

  // ── Class Selection ────────────────────────────────────────────────────────

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
      const text = await opt.textContent();
      if (text && text.trim() && !text.includes('Chọn')) {
        classes.push(text.trim());
      }
    }
    return classes;
  }

  // ── Session Selection (Morning/Afternoon/All day) ──────────────────────────

  /**
   * Select session (buổi): Sáng (Morning), Chiều (Afternoon), Cả ngày (All day).
   */
  async selectSession(session: 'all' | 'morning' | 'afternoon' | 'all-day'): Promise<void> {
    const sessionMap: Record<string, string> = {
      all: '0',
      morning: '1', // Sáng
      afternoon: '2', // Chiều
      'all-day': '3', // Cả ngày
    };
    
    const selector = this.sessionFilter;
    if (await selector.isVisible()) {
      await selector.selectOption(sessionMap[session]);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get all available sessions.
   */
  async getAvailableSessions(): Promise<string[]> {
    const options = await this.sessionFilter.locator('option').all();
    const sessions: string[] = [];
    for (const opt of options) {
      const text = await opt.textContent();
      if (text && text.trim() && !text.includes('Chọn')) {
        sessions.push(text.trim());
      }
    }
    return sessions;
  }

  // ── Date Filtering ─────────────────────────────────────────────────────────

  /**
   * Select date for attendance filtering.
   * dateString format: "2026-03-12"
   */
  async selectDate(dateString: string): Promise<void> {
    const input = this.dateFilterInput;
    if (await input.isVisible()) {
      await input.fill(dateString);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get currently selected date.
   */
  async getSelectedDate(): Promise<string | null> {
    return this.dateFilterInput.inputValue();
  }

  /**
   * Clear date filter.
   */
  async clearDateFilter(): Promise<void> {
    await this.dateFilterInput.clear();
    await this.page.waitForTimeout(300);
  }

  // ── Filter Application ─────────────────────────────────────────────────────

  /**
   * Apply all selected filters.
   */
  async applyFilter(): Promise<void> {
    await this.jsClick(this.filterButton);
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Filter attendance by multiple criteria at once.
   */
  async filterAttendance(options: {
    grade?: string;
    className?: string;
    session?: 'all' | 'morning' | 'afternoon' | 'all-day';
    date?: string;
  }): Promise<void> {
    if (options.grade) {
      await this.selectGrade(options.grade);
    }
    if (options.className) {
      await this.selectClass(options.className);
    }
    if (options.session) {
      await this.selectSession(options.session);
    }
    if (options.date) {
      await this.selectDate(options.date);
    }
    await this.applyFilter();
  }

  // ── Attendance List Management ─────────────────────────────────────────────

  /**
   * Get all attendance records (links) from the list.
   */
  async getAttendanceRecords(): Promise<Locator[]> {
    return this.attendanceLinks.all();
  }

  /**
   * Get number of attendance records.
   */
  async getAttendanceCount(): Promise<number> {
    const records = await this.attendanceLinks.all();
    return records.length;
  }

  /**
   * Check if attendance list is empty.
   */
  async isAttendanceListEmpty(): Promise<boolean> {
    const count = await this.getAttendanceCount();
    return count === 0;
  }

  /**
   * Get attendance record text by index.
   * Example: "ĐD 12A1 (2026-03-12) Chiều"
   */
  async getAttendanceRecordText(index = 0): Promise<string | null> {
    const records = await this.attendanceLinks.all();
    if (records.length > index) {
      return records[index].textContent();
    }
    return null;
  }

  /**
   * Get all attendance record texts.
   */
  async getAllAttendanceRecords(): Promise<string[]> {
    const records = await this.attendanceLinks.all();
    const texts: string[] = [];
    for (const record of records) {
      const text = await record.textContent();
      if (text) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Click on an attendance record by index.
   */
  async clickAttendanceRecord(index = 0): Promise<void> {
    const records = await this.attendanceLinks.all();
    if (records.length > index) {
      await this.jsClick(records[index]);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Click on an attendance record by partial text match.
   */
  async clickAttendanceRecordByText(text: string): Promise<void> {
    const record = this.attendanceLinks.locator(`text="${text}"`).first();
    if (await record.isVisible()) {
      await this.jsClick(record);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Find attendance record by class name and date.
   * Returns the record text if found.
   */
  async findAttendanceRecord(className: string, date: string, session?: string): Promise<string | null> {
    const records = await this.getAllAttendanceRecords();
    for (const record of records) {
      if (record.includes(className) && record.includes(date)) {
        if (session && !record.includes(session)) continue;
        return record;
      }
    }
    return null;
  }

  /**
   * Get attendance record URL by index.
   */
  async getAttendanceRecordUrl(index = 0): Promise<string | null> {
    const records = await this.attendanceLinks.all();
    if (records.length > index) {
      return records[index].getAttribute('href');
    }
    return null;
  }

  // ── Utility Methods ────────────────────────────────────────────────────────

  /**
   * Reset all filters to default state.
   */
  async resetFilters(): Promise<void> {
    await this.selectGrade('all');
    await this.selectClass('all');
    await this.selectSession('all');
    await this.clearDateFilter();
    await this.applyFilter();
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

  /**
   * Scroll down to load more attendance records (if using infinite scroll).
   */
  async loadMoreRecords(): Promise<void> {
    await this.scrollToBottom(3, 400);
  }

  /**
   * Get total number of students in selected class.
   * Note: This would need to be extracted from the page if displayed.
   */
  async getTotalStudentCount(): Promise<number | null> {
    const countText = this.page.locator('text="Tổng cộng"').textContent();
    if (countText) {
      const match = await countText.then(text => text?.match(/(\d+)/));
      return match ? parseInt(match[1], 10) : null;
    }
    return null;
  }

  // ── Zoom/Meet Integration ──────────────────────────────────────────────────

  /**
   * Enable Zoom integration for attendance session.
   */
  async enableZoomIntegration(): Promise<void> {
    const toggle = this.zoomToggle;
    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      if (!isChecked) {
        await this.jsClick(toggle);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Disable Zoom integration.
   */
  async disableZoomIntegration(): Promise<void> {
    const toggle = this.zoomToggle;
    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      if (isChecked) {
        await this.jsClick(toggle);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Check if Zoom is enabled.
   */
  async isZoomEnabled(): Promise<boolean> {
    const toggle = this.zoomToggle;
    if (await toggle.isVisible()) {
      return toggle.isChecked();
    }
    return false;
  }

  /**
   * Enable Google Meet integration for attendance session.
   */
  async enableMeetIntegration(): Promise<void> {
    const toggle = this.meetToggle;
    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      if (!isChecked) {
        await this.jsClick(toggle);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Disable Google Meet integration.
   */
  async disableMeetIntegration(): Promise<void> {
    const toggle = this.meetToggle;
    if (await toggle.isVisible()) {
      const isChecked = await toggle.isChecked();
      if (isChecked) {
        await this.jsClick(toggle);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Check if Meet is enabled.
   */
  async isMeetEnabled(): Promise<boolean> {
    const toggle = this.meetToggle;
    if (await toggle.isVisible()) {
      return toggle.isChecked();
    }
    return false;
  }

  /**
   * Start attendance session (with optional video).
   * useVideo: true for Zoom/Meet, false for regular attendance.
   */
  async startAttendanceSession(useVideo = false): Promise<void> {
    if (useVideo) {
      // Enable video integration first
      const isZoomEnabled = await this.isZoomEnabled();
      const isMeetEnabled = await this.isMeetEnabled();
      
      if (!isZoomEnabled && !isMeetEnabled) {
        await this.enableZoomIntegration();
      }
    }

    const btn = this.startSessionButton;
    if (await btn.isVisible()) {
      await this.jsClick(btn);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * End attendance session.
   */
  async endAttendanceSession(): Promise<void> {
    const btn = this.endSessionButton;
    if (await btn.isVisible()) {
      await this.jsClick(btn);
      await this.page.waitForTimeout(1_500);

      // Confirm end session if modal appears
      const confirmBtn = this.page.locator('button:has-text("Xác nhận"), button:has-text("Có")');
      if (await confirmBtn.isVisible()) {
        await this.jsClick(confirmBtn);
        await this.page.waitForTimeout(1_000);
      }
    }
  }

  /**
   * Check if session is currently active.
   */
  async isSessionActive(): Promise<boolean> {
    const status = this.sessionStatus;
    if (await status.isVisible()) {
      const text = await status.textContent();
      return text?.toLowerCase().includes('active') || text?.toLowerCase().includes('đang diễn ra') || false;
    }
    return false;
  }

  /**
   * Get current session status (Active, Ended, Pending, etc.).
   */
  async getSessionStatus(): Promise<string | null> {
    const status = this.sessionStatus;
    if (await status.isVisible()) {
      return status.textContent();
    }
    return null;
  }

  /**
   * Get attendance statistics for current session.
   */
  async getSessionStats(): Promise<{
    present: number;
    absent: number;
    late: number;
  } | null> {
    const presentText = await this.presentCount.textContent();
    const absentText = await this.absentCount.textContent();
    const lateText = await this.lateCount.textContent();

    if (presentText && absentText && lateText) {
      const presentMatch = presentText.match(/(\d+)/);
      const absentMatch = absentText.match(/(\d+)/);
      const lateMatch = lateText.match(/(\d+)/);

      return {
        present: presentMatch ? parseInt(presentMatch[1], 10) : 0,
        absent: absentMatch ? parseInt(absentMatch[1], 10) : 0,
        late: lateMatch ? parseInt(lateMatch[1], 10) : 0,
      };
    }

    return null;
  }

  /**
   * Check if video preview is available (for Zoom/Meet sessions).
   */
  async isVideoPreviewAvailable(): Promise<boolean> {
    try {
      return await this.videoPreview.isVisible({ timeout: 2_000 });
    } catch {
      return false;
    }
  }

  /**
   * Mark student as present in current session.
   * studentName: Full name or partial name of student.
   */
  async markStudentPresent(studentName: string): Promise<void> {
    const checkbox = this.page.locator(`input[value="${studentName}"][type="checkbox"], label:has-text("${studentName}") input[type="checkbox"]`);
    if (await checkbox.isVisible()) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await this.jsClick(checkbox);
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Mark student as absent.
   */
  async markStudentAbsent(studentName: string): Promise<void> {
    const absentBtn = this.page.locator(`button[data-student="${studentName}"][data-status="absent"], button:has-text("${studentName}"):has-text("Vắng")`);
    if (await absentBtn.isVisible()) {
      await this.jsClick(absentBtn);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Mark student as late.
   */
  async markStudentLate(studentName: string): Promise<void> {
    const lateBtn = this.page.locator(`button[data-student="${studentName}"][data-status="late"], button:has-text("${studentName}"):has-text("Muộn")`);
    if (await lateBtn.isVisible()) {
      await this.jsClick(lateBtn);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Save current attendance session.
   */
  async saveAttendanceSession(): Promise<void> {
    const saveBtn = this.page.locator('button:has-text("Lưu"), button:has-text("Save")');
    if (await saveBtn.isVisible()) {
      await this.jsClick(saveBtn);
      await this.page.waitForTimeout(1_500);
    }
  }

  /**
   * Export attendance report (if available).
   */
  async exportAttendanceReport(): Promise<void> {
    const exportBtn = this.page.locator('button:has-text("Xuất"), button:has-text("Export")');
    if (await exportBtn.isVisible()) {
      await this.jsClick(exportBtn);
      await this.page.waitForTimeout(1_000);
    }
  }
}