import { BasePage } from '@core/shared-pages/BasePage';
import { THONG_KE_DONG_BO_DTI_URL } from '@config/config';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Thống kê đồng bộ DTI (3.7).
 * URL: {BASE_URL}/truong-hoc/{slug}/thong-ke-dong-bo-dti
 *
 * Trang React (container #react-view-dti-audit-sync) KHÔNG dùng chung thanh
 * điều hướng #pills-tab của các trang quản trị trường khác (khác với
 * ThongKeBaiGiaoToanTruongPage) — chỉ có phần header riêng của trang này,
 * gồm:
 *  - Bộ chọn "Ngày thống kê" (button mở popover lịch dạng Radix — id popover
 *    sinh động `radix-:rN:` nên KHÔNG bám theo id này, chỉ thao tác qua nút
 *    trigger hiển thị ngày đã chọn).
 *  - 2 nút chuyển chế độ xem: "Cấp trường" (mặc định active) / "Cấp người dùng".
 *  - Nút "Tải lại".
 *  - Alert cảnh báo (VD: "Trường chưa cấu hình mã CSDL ngành...") — CHỈ xuất
 *    hiện khi trường chưa thiết lập, không phải lúc nào cũng có.
 *  - Khối "Số HS đang trực tuyến" — biểu đồ theo khung giờ trong ngày đã
 *    chọn, có empty-state riêng khi chưa có dữ liệu.
 *  - Khối bảng "Dữ liệu cấp trường" — cột STT/Chỉ số/Giá trị/Thời điểm đo/
 *    Thời điểm nhận, kèm tổng số bản ghi, có empty-state riêng khi trống.
 *
 * LƯU Ý: popover lịch (chọn "Ngày thống kê") không có trong phạm vi HTML đã
 * khảo sát (chỉ thấy nút trigger, chưa thấy DOM bên trong popover khi mở) —
 * openDatePicker() chỉ dừng ở bước mở, tương tự openChooseHomeroomClass() ở
 * PhanCongGiangDayPage.
 *
 * Dùng kết hợp:
 *   const page = new ThongKeDongBoDTIPage(p);
 *   await page.open();
 *   const total = await page.getSchoolDataTotalRecords();
 */

/** 2 chế độ xem dữ liệu đồng bộ DTI */
export enum DtiScope {
  CAP_TRUONG = 'Cấp trường',
  CAP_NGUOI_DUNG = 'Cấp người dùng',
}

export class ThongKeDongBoDTIPage extends BasePage {
  static readonly URL = THONG_KE_DONG_BO_DTI_URL;

  static readonly CONTAINER = '#react-view-dti-audit-sync';
  static readonly PAGE_HEADING = `${ThongKeDongBoDTIPage.CONTAINER} h1:has-text("Thống kê đồng bộ DTI")`;
  static readonly SCHOOL_NAME = `${ThongKeDongBoDTIPage.CONTAINER} p.tw-text-content-secondary`;

  // ── Bộ chọn ngày + chuyển chế độ xem ────────────────────────────────
  static readonly DATE_PICKER_TRIGGER = 'button[aria-haspopup="dialog"]';
  static readonly SCOPE_BTN = (scope: DtiScope): string => `button:has-text("${scope}")`;
  static readonly RELOAD_BTN = 'button:has-text("Tải lại")';

  // ── Alert cảnh báo cấu hình ─────────────────────────────────────────
  static readonly CONFIG_WARNING_ALERT = '.tw-alert.tw-alert-error';

  // ── Khối "Số HS đang trực tuyến" ─────────────────────────────────────
  static readonly ONLINE_STUDENTS_SECTION_HEADING = 'h2:has-text("Số HS đang trực tuyến")';
  static readonly ONLINE_STUDENTS_SUBTITLE = `${ThongKeDongBoDTIPage.ONLINE_STUDENTS_SECTION_HEADING} ~ p`;
  static readonly ONLINE_STUDENTS_EMPTY_STATE = 'p:has-text("Chưa có dữ liệu học sinh trực tuyến")';

  // ── Khối bảng "Dữ liệu cấp trường" ──────────────────────────────────
  static readonly SCHOOL_DATA_SECTION_HEADING = 'h2:has-text("Dữ liệu cấp trường")';
  static readonly SCHOOL_DATA_TOTAL_LABEL = `${ThongKeDongBoDTIPage.SCHOOL_DATA_SECTION_HEADING} ~ span:has-text("Tổng:")`;
  static readonly SCHOOL_DATA_TABLE = 'table.tw-w-full';
  static readonly SCHOOL_DATA_TABLE_ROWS = `${ThongKeDongBoDTIPage.SCHOOL_DATA_TABLE} tbody tr`;
  static readonly SCHOOL_DATA_EMPTY_STATE = 'p:has-text("Không có dữ liệu đồng bộ cho ngày đã chọn")';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(ThongKeDongBoDTIPage.URL);
    await this.waitForSelector(ThongKeDongBoDTIPage.CONTAINER, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('thong-ke-dong-bo-dti');
  }

  async getHeadingText(): Promise<string> {
    const el = await this.findVisible([ThongKeDongBoDTIPage.PAGE_HEADING], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async getSchoolName(): Promise<string> {
    const el = await this.findVisible([ThongKeDongBoDTIPage.SCHOOL_NAME], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // ==================================================================
  // Bộ chọn ngày + chuyển chế độ xem
  // ==================================================================

  /** Ngày thống kê đang chọn, hiển thị ngay trên nút trigger (VD: "13/07/2026") */
  async getSelectedDateText(): Promise<string> {
    const el = this.page.locator(ThongKeDongBoDTIPage.DATE_PICKER_TRIGGER).first();
    return ((await el.textContent()) ?? '').trim();
  }

  /** Bấm mở popover chọn ngày — KHÔNG thao tác chọn ngày trong lịch (xem ghi chú đầu file) */
  async openDatePicker(): Promise<this> {
    await this.jsClick(this.page.locator(ThongKeDongBoDTIPage.DATE_PICKER_TRIGGER).first());
    return this;
  }

  async switchScope(scope: DtiScope): Promise<this> {
    await this.page.locator(ThongKeDongBoDTIPage.SCOPE_BTN(scope)).first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async reload(): Promise<this> {
    await this.page.locator(ThongKeDongBoDTIPage.RELOAD_BTN).first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Alert cảnh báo cấu hình
  // ==================================================================

  async hasConfigWarning(): Promise<boolean> {
    return (await this.page.locator(ThongKeDongBoDTIPage.CONFIG_WARNING_ALERT).count()) > 0;
  }

  async getConfigWarningText(): Promise<string> {
    const el = this.page.locator(ThongKeDongBoDTIPage.CONFIG_WARNING_ALERT).first();
    if ((await el.count()) === 0) return '';
    return ((await el.textContent()) ?? '').trim();
  }

  // ==================================================================
  // Khối "Số HS đang trực tuyến"
  // ==================================================================

  async getOnlineStudentsSubtitle(): Promise<string> {
    const el = this.page.locator(ThongKeDongBoDTIPage.ONLINE_STUDENTS_SUBTITLE).first();
    return ((await el.textContent()) ?? '').trim();
  }

  async isOnlineStudentsEmpty(): Promise<boolean> {
    return (await this.page.locator(ThongKeDongBoDTIPage.ONLINE_STUDENTS_EMPTY_STATE).count()) > 0;
  }

  // ==================================================================
  // Khối bảng "Dữ liệu cấp trường"
  // ==================================================================

  /** Tổng số bản ghi hiển thị cạnh tiêu đề bảng, VD: "Tổng: 0 bản ghi" → 0 */
  async getSchoolDataTotalRecords(): Promise<number> {
    const text = ((await this.page.locator(ThongKeDongBoDTIPage.SCHOOL_DATA_TOTAL_LABEL).first().textContent()) ?? '')
      .trim();
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  async isSchoolDataEmpty(): Promise<boolean> {
    return (await this.page.locator(ThongKeDongBoDTIPage.SCHOOL_DATA_EMPTY_STATE).count()) > 0;
  }

  async getSchoolDataTableHeaders(): Promise<string[]> {
    const headers = this.page.locator(`${ThongKeDongBoDTIPage.SCHOOL_DATA_TABLE} thead td`);
    return headers.allTextContents();
  }

  /** Dữ liệu bảng "Dữ liệu cấp trường" — mảng rỗng nếu đang ở trạng thái empty-state */
  async getSchoolDataRows(): Promise<string[][]> {
    if (await this.isSchoolDataEmpty()) return [];
    const rows = this.page.locator(ThongKeDongBoDTIPage.SCHOOL_DATA_TABLE_ROWS);
    const count = await rows.count();
    const result: string[][] = [];
    for (let i = 0; i < count; i++) {
      const cells = await rows.nth(i).locator('td').allTextContents();
      result.push(cells.map((c) => c.trim()));
    }
    return result;
  }
}