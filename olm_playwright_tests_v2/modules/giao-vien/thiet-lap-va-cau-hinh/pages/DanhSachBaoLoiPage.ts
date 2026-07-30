import { BasePage } from '@core/shared-pages/BasePage';
import { DANH_SACH_BAO_LOI_URL } from '@config/config';

/**
 * Page Object — Danh sách báo lỗi (5.2.1).
 * URL: {BASE_URL}/bao-loi-tat-ca-cau-hoi#menu-danh-sach-bao-loi
 *
 * Trang khác hẳn phong cách UI với phần lớn module khác (Bootstrap thuần,
 * KHÔNG dùng Tailwind `tw-*` prefix như DanhSachCauHoiDaXoaPage liền kề).
 *
 * Bố cục:
 *  - Bộ lọc: 2 select (`select[name="status"]`, `select[name="type_feedback"]`)
 *    + nút "Lọc" (`button.submit-filter`, type="button" — filter chạy AJAX,
 *    KHÔNG submit form/navigation mới).
 *  - Mặc định khi vào trang: status = "Chưa xem" (value 0, selected sẵn),
 *    type_feedback = "Loại lỗi (tất cả)" (value -1).
 *  - Dòng "Tổng: <b>N</b>" hiển thị tổng số bản ghi khớp filter hiện tại.
 *  - Bảng kết quả (`#table-list-question table`) — cột đầu là checkbox chọn
 *    hàng loạt (header có `#bulk-feedback-all` để chọn tất cả), theo sau là
 *    10 cột dữ liệu: Trạng thái, ID, ID câu hỏi, Nội dung lỗi, Bài làm HS,
 *    Kỹ năng, ID user, Ngày báo lỗi, Thiết bị, Count.
 *  - `<tbody>` CÓ THỂ rỗng (không có báo lỗi nào khớp filter) — luôn kiểm
 *    tra getRowCount()/isEmpty() trước khi thao tác trên hàng.
 *
 * Dùng kết hợp:
 *   const page = new DanhSachBaoLoiPage(p);
 *   await page.open();
 *   await page.applyFilter({ status: 'daXem' });
 *   const total = await page.getTotalCount();
 *   const rows = await page.getRows();
 */

export type BaoLoiStatus = 'chuaXem' | 'daSua' | 'daXem' | 'phanHoiSai' | 'loiKyThuat';
export type BaoLoiErrorType = 'tatCa' | 'hinhAnh' | 'amThanh' | 'chinhTa' | 'kienThuc' | 'khac';

export interface BaoLoiFilter {
  status?: BaoLoiStatus;
  errorType?: BaoLoiErrorType;
}

export interface BaoLoiRowInfo {
  status: string;
  id: string;
  questionId: string;
  errorContent: string;
  studentAnswer: string;
  skill: string;
  userId: string;
  reportedDate: string;
  device: string;
  count: string;
}

export class DanhSachBaoLoiPage extends BasePage {
  static readonly URL = DANH_SACH_BAO_LOI_URL;

  // ── value map cho 2 select lọc (khớp <option value="..."> trong DOM thật) ──
  private static readonly STATUS_VALUE: Record<BaoLoiStatus, string> = {
    chuaXem: '0',
    daSua: '1',
    daXem: '2',
    phanHoiSai: '3',
    loiKyThuat: '4',
  };
  private static readonly ERROR_TYPE_VALUE: Record<BaoLoiErrorType, string> = {
    tatCa: '-1',
    hinhAnh: '1',
    amThanh: '2',
    chinhTa: '3',
    kienThuc: '4',
    khac: '0',
  };

  // ── Bộ lọc ───────────────────────────────────────────────────────────────
  static readonly SELECT_STATUS = 'select[name="status"]';
  static readonly SELECT_ERROR_TYPE = 'select[name="type_feedback"]';
  static readonly BTN_FILTER = 'button.submit-filter';

  // ── Bảng kết quả ─────────────────────────────────────────────────────────
  static readonly TABLE_CONTAINER = '#table-list-question';
  static readonly TABLE = `${DanhSachBaoLoiPage.TABLE_CONTAINER} table`;
  static readonly TABLE_ROWS = `${DanhSachBaoLoiPage.TABLE} tbody tr`;
  static readonly SELECT_ALL_CHECKBOX = '#bulk-feedback-all';
  static readonly ROW_CHECKBOX = `${DanhSachBaoLoiPage.TABLE_ROWS} td input[type="checkbox"]`;

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(DanhSachBaoLoiPage.URL);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('bao-loi-tat-ca-cau-hoi');
  }

  // ==================================================================
  // Bộ lọc
  // ==================================================================

  /** Chọn Trạng thái (KHÔNG bấm "Lọc" — dùng kèm clickFilter() hoặc applyFilter()) */
  async filterByStatus(status: BaoLoiStatus): Promise<this> {
    await this.page.locator(DanhSachBaoLoiPage.SELECT_STATUS).selectOption(DanhSachBaoLoiPage.STATUS_VALUE[status]);
    return this;
  }

  /** Chọn Loại lỗi (KHÔNG bấm "Lọc" — dùng kèm clickFilter() hoặc applyFilter()) */
  async filterByErrorType(errorType: BaoLoiErrorType): Promise<this> {
    await this.page
      .locator(DanhSachBaoLoiPage.SELECT_ERROR_TYPE)
      .selectOption(DanhSachBaoLoiPage.ERROR_TYPE_VALUE[errorType]);
    return this;
  }

  /** Bấm nút "Lọc" — chạy AJAX (button type="button"), đợi networkidle best-effort
   *  để bảng kịp render lại thay vì đợi navigation (không có navigation mới). */
  async clickFilter(): Promise<this> {
    await this.jsClick(this.page.locator(DanhSachBaoLoiPage.BTN_FILTER));
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    return this;
  }

  /** Chọn Trạng thái/Loại lỗi (field nào có truyền mới đổi) + bấm "Lọc" trong 1 lần gọi */
  async applyFilter(filter: BaoLoiFilter): Promise<this> {
    if (filter.status !== undefined) await this.filterByStatus(filter.status);
    if (filter.errorType !== undefined) await this.filterByErrorType(filter.errorType);
    await this.clickFilter();
    return this;
  }

  // ==================================================================
  // Kết quả
  // ==================================================================

  /** Tổng số bản ghi khớp filter hiện tại, đọc từ dòng "Tổng: <b>N</b>" */
  async getTotalCount(): Promise<number> {
    const text =
      (await this.page
        .locator('div', { hasText: 'Tổng:' })
        .locator('b')
        .first()
        .textContent()
        .catch(() => null)) ?? '0';
    return parseInt(text.trim(), 10) || 0;
  }

  /** Số hàng đang hiển thị trong bảng (trang hiện tại) */
  async getRowCount(): Promise<number> {
    return this.page.locator(DanhSachBaoLoiPage.TABLE_ROWS).count();
  }

  async isEmpty(): Promise<boolean> {
    return (await this.getRowCount()) === 0;
  }

  /** Đọc toàn bộ hàng báo lỗi đang hiển thị. Cột đầu tiên (checkbox) bị bỏ qua khi map dữ liệu. */
  async getRows(): Promise<BaoLoiRowInfo[]> {
    const rows = await this.page.locator(DanhSachBaoLoiPage.TABLE_ROWS).all();
    const result: BaoLoiRowInfo[] = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      // cells[0] = ô checkbox (không có text) → dữ liệu bắt đầu từ cells[1]
      result.push({
        status: (cells[1] ?? '').trim(),
        id: (cells[2] ?? '').trim(),
        questionId: (cells[3] ?? '').trim(),
        errorContent: (cells[4] ?? '').trim(),
        studentAnswer: (cells[5] ?? '').trim(),
        skill: (cells[6] ?? '').trim(),
        userId: (cells[7] ?? '').trim(),
        reportedDate: (cells[8] ?? '').trim(),
        device: (cells[9] ?? '').trim(),
        count: (cells[10] ?? '').trim(),
      });
    }
    return result;
  }

  // ==================================================================
  // Chọn hàng loạt
  // ==================================================================

  /** Bấm checkbox "chọn tất cả" ở header bảng */
  async toggleSelectAll(): Promise<this> {
    await this.jsClick(this.page.locator(DanhSachBaoLoiPage.SELECT_ALL_CHECKBOX));
    return this;
  }

  /** Bấm checkbox của 1 hàng theo chỉ số (0-based) */
  async toggleRow(index: number): Promise<this> {
    const checkbox = this.page.locator(DanhSachBaoLoiPage.ROW_CHECKBOX).nth(index);
    await this.jsClick(checkbox);
    return this;
  }
}