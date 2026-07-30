import { BasePage } from '@core/shared-pages/BasePage';
import { THIET_LAP_NAM_HOC_MOI_URL } from '@config/config';

/**
 * Page Object — Thiết lập năm học mới (5.1.3).
 * URL: {BASE_URL}/truong-hoc/thiet-lap-nam-hoc-moi#menu-thiet-lap-nam-hoc-moi
 * (CHÚ Ý: KHÔNG có slug trường trong path — khác pattern truongHocUrl của
 * các trang 5.1.x còn lại).
 *
 * Trang gồm 1 bảng "nâng khối" cho MỖI khối (mỗi khối 1 card `.col-lg-6`,
 * layout 2 cột trên 1 hàng, VD: Khối 9→10 | Khối 12→13). Mỗi bảng có:
 *   - 3 checkbox "check all" ở header (Nâng lớp / GV chủ nhiệm / GV bộ môn)
 *   - N dòng (1 dòng/lớp), mỗi dòng lặp lại 3 checkbox tương ứng.
 *
 * QUAN TRỌNG — pattern id 3 checkbox "check all" KHÔNG đồng nhất trong DOM
 * thật (đã verify bằng ảnh chụp + HTML): cột "GV chủ nhiệm" thiếu tiếp vĩ ngữ
 * "-grade" so với 2 cột còn lại:
 *   - Nâng lớp:        #check-all-student-grade-{khoi}
 *   - GV chủ nhiệm:    #check-all-boss-teacher-{khoi}          ← KHÔNG có "-grade-"
 *   - GV bộ môn:       #check-all-subject-teacher-grade-{khoi}
 * → xử lý riêng cho từng cột trong CHECK_ALL_ID, không suy ra bằng 1 pattern chung.
 *
 * Khối đã xử lý xong (VD: Khối 12→13 trong ảnh mẫu) sẽ disable toàn bộ
 * checkbox của khối đó (thuộc tính `disabled` trên input) — dùng
 * `isGradeDisabled()` để biết trước khi thao tác, tránh click vô ích.
 *
 * Dùng kết hợp:
 *   const page = new ThietLapNamHocMoiPage(p);
 *   await page.open();
 *   await page.selectTuNamHoc('2025');
 *   const rows = await page.getClassRows('9');
 *   await page.setCheckAll('9', 'gvBoMon', false);
 *   await page.clickBatDauXuLy();
 */

export type NangLopColumn = 'hocSinh' | 'gvChuNhiem' | 'gvBoMon';

export interface GradeMigrationRow {
  /** Tên lớp hiển thị, VD: "9C", "12A1" */
  className: string;
  hocSinh: boolean;
  gvChuNhiem: boolean;
  gvBoMon: boolean;
  /** true nếu cả 3 checkbox của dòng này đã bị khoá (khối đã xử lý xong) */
  disabled: boolean;
}

export class ThietLapNamHocMoiPage extends BasePage {
  static readonly URL = THIET_LAP_NAM_HOC_MOI_URL;

  // ── Heading / toolbar ────────────────────────────────────────────────────
  static readonly HEADING = "h1:has-text('Thiết lập năm học mới')";
  static readonly LINK_HUONG_DAN = "a:has-text('Hướng dẫn năm học mới')";
  static readonly SELECT_TU_NAM_HOC = "h3:has-text('Từ năm học') + select, select.w-20";
  static readonly TEXT_DEN_NAM_HOC = "h3:has-text('đến năm học')";
  static readonly BTN_BAT_DAU_XU_LY = "button:has-text('Bắt đầu xử lý')";

  // ── Bảng theo khối ───────────────────────────────────────────────────────
  /** Container `.col-lg-6` chứa cả heading "Khối N → M" lẫn bảng của khối đó */
  private static gradeContainer(grade: string): string {
    return `.col-lg-6:has(h4:has-text("Khối ${grade} "))`;
  }

  private static readonly CHECK_ALL_ID: Record<NangLopColumn, (grade: string) => string> = {
    // Xem ghi chú ở đầu file — 3 cột KHÔNG dùng chung 1 pattern id.
    hocSinh: (g) => `#check-all-student-grade-${g}`,
    gvChuNhiem: (g) => `#check-all-boss-teacher-${g}`,
    gvBoMon: (g) => `#check-all-subject-teacher-grade-${g}`,
  };

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(ThietLapNamHocMoiPage.URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('thiet-lap-nam-hoc-moi');
  }

  async waitForTableVisible(timeoutMs = 10_000): Promise<boolean> {
    return this.waitForSelector(ThietLapNamHocMoiPage.HEADING, timeoutMs);
  }

  // ==================================================================
  // Chọn năm học nguồn / bắt đầu xử lý
  // ==================================================================

  async selectTuNamHoc(value: string): Promise<this> {
    await this.page.locator(ThietLapNamHocMoiPage.SELECT_TU_NAM_HOC).selectOption(value);
    return this;
  }

  async getSelectedTuNamHoc(): Promise<string> {
    return this.page.locator(ThietLapNamHocMoiPage.SELECT_TU_NAM_HOC).inputValue();
  }

  /** VD: "đến năm học 2026-2027" — đọc nguyên văn text hiển thị bên cạnh select */
  async getDenNamHocText(): Promise<string> {
    return ((await this.page.locator(ThietLapNamHocMoiPage.TEXT_DEN_NAM_HOC).textContent()) ?? '').trim();
  }

  /** Nút "Bắt đầu xử lý" — kích hoạt nâng khối thật với các lựa chọn hiện tại. CHÚ Ý: đây là hành động ghi dữ liệu thật, cân nhắc kỹ trước khi gọi trên môi trường không phải test riêng. */
  async clickBatDauXuLy(): Promise<this> {
    await this.page.locator(ThietLapNamHocMoiPage.BTN_BAT_DAU_XU_LY).click();
    return this;
  }

  // ==================================================================
  // Bảng nâng khối theo từng khối
  // ==================================================================

  /** true nếu bảng khối này đã bị khoá toàn bộ (đã xử lý xong ở lần chạy trước) */
  async isGradeDisabled(grade: string): Promise<boolean> {
    const checkAll = this.page.locator(
      `${ThietLapNamHocMoiPage.gradeContainer(grade)} ${ThietLapNamHocMoiPage.CHECK_ALL_ID.hocSinh(grade)}`
    );
    return checkAll.isDisabled().catch(() => false);
  }

  async isCheckAllChecked(grade: string, column: NangLopColumn): Promise<boolean> {
    const selector = `${ThietLapNamHocMoiPage.gradeContainer(grade)} ${ThietLapNamHocMoiPage.CHECK_ALL_ID[column](grade)}`;
    return this.page.locator(selector).isChecked();
  }

  /**
   * Set trạng thái checkbox "check all" của 1 cột trong 1 khối (click qua
   * label liền kề để tránh input bị custom-control CSS che, giống pattern
   * dùng ở ThietLapTruongHocPage.setCheckbox()). Không làm gì nếu khối đã
   * bị khoá (isGradeDisabled() === true) — click vào input disabled sẽ
   * không có tác dụng và có thể khiến Playwright timeout chờ actionability.
   */
  async setCheckAll(grade: string, column: NangLopColumn, checked: boolean): Promise<this> {
    if (await this.isGradeDisabled(grade)) return this;

    const current = await this.isCheckAllChecked(grade, column);
    if (current !== checked) {
      const id = ThietLapNamHocMoiPage.CHECK_ALL_ID[column](grade).slice(1); // bỏ '#'
      await this.page
        .locator(`${ThietLapNamHocMoiPage.gradeContainer(grade)} label[for="${id}"]`)
        .click();
      await this.page.waitForTimeout(300);
    }
    return this;
  }

  /**
   * Đọc toàn bộ dòng (1 dòng/lớp) của 1 khối, kèm trạng thái 3 checkbox và
   * cờ disabled — dùng để assert dữ liệu hiển thị đúng hoặc kiểm tra khối
   * đã xử lý xong chưa cho phép thao tác tiếp.
   */
  async getClassRows(grade: string): Promise<GradeMigrationRow[]> {
    const rows = await this.page
      .locator(`${ThietLapNamHocMoiPage.gradeContainer(grade)} tbody tr`)
      .all();

    const result: GradeMigrationRow[] = [];
    for (const row of rows) {
      const className = ((await row.locator('td').nth(0).textContent()) ?? '').trim();
      const hocSinhInput = row.locator('td').nth(1).locator('input[type="checkbox"]');
      const gvChuNhiemInput = row.locator('td').nth(2).locator('input[type="checkbox"]');
      const gvBoMonInput = row.locator('td').nth(3).locator('input[type="checkbox"]');

      result.push({
        className,
        hocSinh: await hocSinhInput.isChecked(),
        gvChuNhiem: await gvChuNhiemInput.isChecked(),
        gvBoMon: await gvBoMonInput.isChecked(),
        disabled: await hocSinhInput.isDisabled().catch(() => false),
      });
    }
    return result;
  }

  /** Đọc tiêu đề nguyên văn của 1 khối, VD: "Khối 9 → 10" */
  async getGradeHeadingText(grade: string): Promise<string> {
    return (
      (await this.page.locator(`${ThietLapNamHocMoiPage.gradeContainer(grade)} h4`).textContent()) ?? ''
    ).trim();
  }
}