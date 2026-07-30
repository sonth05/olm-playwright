import { BasePage } from '@core/shared-pages/BasePage';
import { THONG_KE_HO_SO_URL } from '@config/config';

/**
 * Page Object — Thống kê (4.1.4).
 * URL: {BASE_URL}/school-task/lesson-plan-static#menu-lesson-plan-static
 * Thống kê hồ sơ, kế hoạch (khác 3.x — thống kê chung của báo cáo thống kê).
 *
 * Trang gồm:
 *  - Tiêu đề "Thống kê kế hoạch bài dạy (giáo án) theo tuần" + nút "Xuất báo
 *    cáo" (link export, mở tab mới — không tự động tải file).
 *  - Filter: Năm học (#select_school_year, KHÔNG có option "Tất cả các năm"
 *    như các trang 4.1.x khác) + Tuần (#select-week).
 *  - Bảng #table_lesson: mỗi dòng là 1 giáo viên, cột STT / Họ tên giáo
 *    viên (link "Xem thống kê chi tiết" trỏ sang
 *    lesson-plan-static-teacher?id_teacher={id}&school_year={year}) / Tên
 *    đăng nhập / Chưa duyệt / Chấp nhận / Từ chối (đều là số đếm).
 *
 * KHÔNG có state rỗng riêng đã khảo sát — bảng luôn liệt kê đủ giáo viên
 * của trường (số liệu = 0 nếu chưa có giáo án), khác các trang 4.1.1-4.1.3
 * (list hồ sơ, có thể rỗng).
 */

export interface TeacherLessonStatRow {
  stt: string;
  teacherName: string;
  teacherDetailUrl: string | null;
  username: string;
  chuaDuyet: string;
  chapNhan: string;
  tuChoi: string;
}

export class ThongKeHoSoPage extends BasePage {
  static readonly URL = THONG_KE_HO_SO_URL;

  static readonly PAGE_HEADING = 'h4:has-text("Thống kê kế hoạch bài dạy")';
  static readonly EXPORT_REPORT_LINK = 'a:has-text("Xuất báo cáo")';

  // ── Bộ filter ─────────────────────────────────────────────────────────────
  static readonly SCHOOL_YEAR_SELECT = '#select_school_year';
  static readonly WEEK_SELECT = '#select-week';

  // ── Bảng thống kê ─────────────────────────────────────────────────────────
  static readonly TABLE = '#table_lesson';
  static readonly TABLE_BODY_ROWS = `${ThongKeHoSoPage.TABLE} tbody > tr`;

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(ThongKeHoSoPage.URL);
    await this.waitForSelector(ThongKeHoSoPage.TABLE, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('school-task/lesson-plan-static');
  }

  async getPageHeading(): Promise<string> {
    const el = await this.findVisible([ThongKeHoSoPage.PAGE_HEADING], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // ==================================================================
  // Bộ filter
  // ==================================================================

  /** VD: selectSchoolYear('2025') → chọn "2025 - 2026" */
  async selectSchoolYear(year: string): Promise<this> {
    await this.page.locator(ThongKeHoSoPage.SCHOOL_YEAR_SELECT).selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    return this.page.locator(ThongKeHoSoPage.SCHOOL_YEAR_SELECT).inputValue();
  }

  /** VD: selectWeek('1') → "Tuần 1"; selectWeek('0') → "Lọc theo tuần" (mặc định, không lọc) */
  async selectWeek(weekValue: string): Promise<this> {
    await this.page.locator(ThongKeHoSoPage.WEEK_SELECT).selectOption(weekValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedWeek(): Promise<string> {
    return this.page.locator(ThongKeHoSoPage.WEEK_SELECT).inputValue();
  }

  // ==================================================================
  // Actions
  // ==================================================================

  /** Href export báo cáo (VD: dùng để verify param query khi đã áp filter, KHÔNG tự động tải file) */
  async getExportReportLink(): Promise<string | null> {
    return this.page.locator(ThongKeHoSoPage.EXPORT_REPORT_LINK).getAttribute('href');
  }

  // ==================================================================
  // Bảng thống kê
  // ==================================================================

  async getRowCount(): Promise<number> {
    return this.page.locator(ThongKeHoSoPage.TABLE_BODY_ROWS).count();
  }

  /** Toàn bộ dữ liệu bảng, theo đúng thứ tự hiển thị */
  async getAllRows(): Promise<TeacherLessonStatRow[]> {
    const rows = await this.page.locator(ThongKeHoSoPage.TABLE_BODY_ROWS).all();
    const result: TeacherLessonStatRow[] = [];

    for (const row of rows) {
      const cells = row.locator('td');
      const nameLink = cells.nth(1).locator('a').first();

      result.push({
        stt: ((await cells.nth(0).textContent()) ?? '').trim(),
        teacherName: ((await nameLink.textContent()) ?? '').trim(),
        teacherDetailUrl: await nameLink.getAttribute('href'),
        username: ((await cells.nth(2).textContent()) ?? '').trim(),
        chuaDuyet: ((await cells.nth(3).textContent()) ?? '').trim(),
        chapNhan: ((await cells.nth(4).textContent()) ?? '').trim(),
        tuChoi: ((await cells.nth(5).textContent()) ?? '').trim(),
      });
    }

    return result;
  }

  /** Lấy dữ liệu 1 dòng theo tên giáo viên (khớp chính xác) */
  async getRowByTeacherName(teacherName: string): Promise<TeacherLessonStatRow | null> {
    const rows = await this.getAllRows();
    return rows.find((r) => r.teacherName === teacherName) ?? null;
  }

  /** Click vào tên giáo viên để mở trang "Xem thống kê chi tiết" (lesson-plan-static-teacher) */
  async openTeacherDetail(teacherName: string): Promise<this> {
    const link = this.page
      .locator(`${ThongKeHoSoPage.TABLE_BODY_ROWS} td a`)
      .filter({ hasText: teacherName })
      .first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }
}