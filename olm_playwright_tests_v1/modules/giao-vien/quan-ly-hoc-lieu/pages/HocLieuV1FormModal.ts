import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../../core/shared-pages/BasePage';

/**
 * HocLieuV1FormModal.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Page Object cho popup "Tạo học liệu" bản V1 — modal bootstrap-style với:
 *   header: icon 2 ký tự + tên loại học liệu, nút đóng (x)
 *   nút "Chọn khung chương trình"
 *   Tiêu đề *, Mô tả, Từ khóa, Tiêu đề SEO, Mô tả SEO
 *   Chọn lớp, Chọn môn, Chọn bộ sách (KHÔNG bắt buộc — UI có gắn dấu *
 *   nhưng đã verify thực tế: chỉ cần Tiêu đề là bấm "Tạo" thành công, không
 *   validate Lớp/Môn/Bộ sách), ID học liệu thay thế
 *   nút "Tạo" / "Hủy"
 *
 * Dùng chung cho các loại có formType 'full' | 'reduced' | 'document'
 * (xem HocLieuV1Constants.ts). Loại 'reduced' không có Mô tả/Từ khóa,
 * loại 'document' có thêm ô tải file — cả hai được xử lý bằng cách chỉ
 * điền field nào THỰC SỰ tồn tại/visible trong popup (bỏ qua field không có).
 *
 * CẬP NHẬT (2026-07-26): đã verify bằng HTML thật của popup (modal-body +
 * modal-footer, cả 2 loại "Tài liệu" và "Luyện tập trắc nghiệm"). Sửa lại
 * theo DOM thật:
 *  - "Chọn lớp"/"Chọn môn"/"Chọn bộ sách" là <select> HTML chuẩn, có class
 *    cố định `grade_list` / `subject_list` / `book_list` — KHÔNG phải
 *    dropdown tùy biến như suy đoán trước đây. Dùng thẳng selectOption(),
 *    bỏ logic click-mở-list/tìm-theo-label.
 *  - Nút "Tạo"/"Hủy" trong modal-footer có class riêng `.btn-submit` /
 *    `.btn-cancel` (kèm `data-contribute` trên nút Tạo) — dùng class thay
 *    vì so khớp text "Tạo" (tránh đụng nút "Tạo mới học liệu" ở ngoài modal,
 *    cùng pattern đã áp dụng ở HocLieuCuaToiPage.ts).
 */
export interface HocLieuV1FormData {
  tieuDe: string;
  moTa?: string;
  tuKhoa?: string;
  tieuDeSeo?: string;
  moTaSeo?: string;
  idHocLieuThayThe?: string;
}

export class HocLieuV1FormModal extends BasePage {
  // ── Modal root: khớp bootstrap modal đang mở, có chứa nút "Tạo" ─────────
  static readonly MODAL_SELECTORS =
    '.modal.show, .modal-dialog, [role="dialog"]';

  static readonly BTN_CHON_KHUNG_CHUONG_TRINH =
    'button:has-text("Chọn khung chương trình")';

  static readonly INPUT_TIEU_DE = [
    'input[placeholder="Nhập tiêu đề..."]',
    'input[placeholder*="Nhập tiêu đề"]',
  ];
  static readonly TEXTAREA_MO_TA = [
    'textarea[placeholder="Mô tả..."]',
    'textarea[placeholder*="Mô tả"]',
  ];
  static readonly INPUT_TU_KHOA = [
    'input[placeholder="Từ khóa..."]',
    'input[placeholder*="Từ khóa"]',
  ];
  static readonly INPUT_TIEU_DE_SEO = [
    'input[placeholder="Nhập tiêu đề SEO..."]',
    'input[placeholder*="tiêu đề SEO"]',
  ];
  static readonly TEXTAREA_MO_TA_SEO = [
    'textarea[placeholder="Nhập mô tả SEO..."]',
    'textarea[placeholder*="mô tả SEO"]',
  ];
  static readonly INPUT_ID_HOC_LIEU_THAY_THE = [
    'input[placeholder="Nhập ID học liệu thay thế..."]',
    'input[placeholder*="ID học liệu thay thế"]',
  ];
  static readonly FILE_INPUT = 'input[type="file"]';

  // Khớp modal-footer thật: <button class="... btn-submit ..." data-contribute="">Tạo</button>
  static readonly BTN_TAO = 'button.btn-submit';
  static readonly BTN_HUY = 'button.btn-cancel';
  static readonly BTN_CLOSE =
    '.modal button[aria-label="Close"], .modal .close, .modal button:has-text("×")';

  // ── Dropdown: <select> HTML chuẩn, khớp class thật trong DOM ─────────────
  static readonly SELECT_LOP = 'select.grade_list';
  static readonly SELECT_MON = 'select.subject_list';
  static readonly SELECT_BO_SACH = 'select.book_list';

  readonly modal: Locator;

  constructor(page: Page) {
    super(page);
    // Ưu tiên modal đang chứa nút "Tạo" để tránh nhầm với modal khác đang mở nền
    this.modal = page
      .locator(HocLieuV1FormModal.MODAL_SELECTORS)
      .filter({ has: page.locator(HocLieuV1FormModal.BTN_TAO) })
      .last();
  }

  /** Chờ popup đúng loại học liệu hiển thị, xác định qua text header (VD: 'Đề thi THPT') */
  async expectVisible(headerTitle: string): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 10_000 });
    await this.modal.getByText(headerTitle, { exact: false }).first().waitFor({
      state: 'visible',
      timeout: 10_000,
    });
  }

  private scoped(selectors: string | string[]): Locator[] {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    return list.map((sel) => this.modal.locator(sel).first());
  }

  private async fillIfVisible(selectors: string[], value: string, timeoutSec = 2): Promise<void> {
    for (const loc of this.scoped(selectors)) {
      if (await loc.isVisible({ timeout: timeoutSec * 1_000 }).catch(() => false)) {
        await this.jsClearAndType(loc, value);
        return;
      }
    }
  }

  /**
   * Điền các field text/textarea đang tồn tại trong popup. Field không có
   * trong data (undefined) hoặc không tồn tại trong DOM sẽ được bỏ qua —
   * nhờ vậy dùng chung được cho cả formType 'full' lẫn 'reduced'/'document'.
   */
  async fillCommonFields(data: HocLieuV1FormData): Promise<void> {
    await this.fillIfVisible(HocLieuV1FormModal.INPUT_TIEU_DE, data.tieuDe, 5);

    if (data.moTa !== undefined) {
      await this.fillIfVisible(HocLieuV1FormModal.TEXTAREA_MO_TA, data.moTa);
    }
    if (data.tuKhoa !== undefined) {
      await this.fillIfVisible(HocLieuV1FormModal.INPUT_TU_KHOA, data.tuKhoa);
    }
    if (data.tieuDeSeo !== undefined) {
      await this.fillIfVisible(HocLieuV1FormModal.INPUT_TIEU_DE_SEO, data.tieuDeSeo);
    }
    if (data.moTaSeo !== undefined) {
      await this.fillIfVisible(HocLieuV1FormModal.TEXTAREA_MO_TA_SEO, data.moTaSeo);
    }
    if (data.idHocLieuThayThe !== undefined) {
      await this.fillIfVisible(HocLieuV1FormModal.INPUT_ID_HOC_LIEU_THAY_THE, data.idHocLieuThayThe);
    }
  }

  /** Chỉ dùng cho loại "Tài liệu" — tải 1 file PDF/Word/PPT */
  async uploadFile(filePath: string): Promise<void> {
    const input = this.modal.locator(HocLieuV1FormModal.FILE_INPUT).first();
    await input.setInputFiles(filePath);
  }

  // ── Dropdown: Chọn lớp / Chọn môn / Chọn bộ sách ─────────────────────────
  //
  // Đã verify bằng HTML thật: cả 3 đều là <select class="form-control ..."
  // grade_list/subject_list/book_list"> — thẻ <select> HTML chuẩn, dùng
  // selectOption({ label }) trực tiếp, không cần click mở list.
  private async selectRealDropdown(selectLocatorSelector: string, optionLabel: string): Promise<void> {
    const select = this.modal.locator(selectLocatorSelector).first();
    // Modal-body có scroll riêng (class 'scroll-bar'), select "Chọn lớp"/
    // "Chọn môn"/"Chọn bộ sách" nằm phía dưới các field Tiêu đề/Mô tả/SEO...
    // nên có thể đang ở ngoài vùng đang cuộn tới của modal-body dù DOM đã
    // attach/visible. scrollIntoViewIfNeeded() dùng hành vi cuộn gốc của
    // trình duyệt — tự tìm ĐÚNG container cha đang overflow để cuộn (không
    // chỉ cuộn window), nên xử lý được cả trường hợp modal dài phải cuộn mới
    // thấy select.
    await select.scrollIntoViewIfNeeded().catch(() => {});
    await select.waitFor({ state: 'visible', timeout: 5_000 });
    await select
      .selectOption({ label: optionLabel })
      .catch(() => select.selectOption(optionLabel));
  }

  /** Chọn lớp (không bắt buộc) → <select class="grade_list">, VD: 'Lớp 12' */
  async selectLop(label: string): Promise<void> {
    await this.selectRealDropdown(HocLieuV1FormModal.SELECT_LOP, label);
  }

  /** Chọn môn (không bắt buộc) → <select class="subject_list">, VD: 'Kỹ thuật' */
  async selectMon(label: string): Promise<void> {
    await this.selectRealDropdown(HocLieuV1FormModal.SELECT_MON, label);
  }

  /** Chọn bộ sách: → <select class="book_list">, VD: 'Cánh diều' */
  async selectBoSach(label: string): Promise<void> {
    await this.selectRealDropdown(HocLieuV1FormModal.SELECT_BO_SACH, label);
  }

  /**
   * Chọn cả 3 dropdown bắt buộc/tùy chọn còn lại (Lớp/Môn/Bộ sách) rồi bấm
   * "Tạo" — dùng khi các field text (Tiêu đề, SEO...) đã điền sẵn nhưng
   * dropdown chưa chọn và nút "Tạo" chưa bấm.
   */
  async chonDropdownVaTao(options: { lop: string; mon: string; boSach?: string }): Promise<void> {
    await this.selectLop(options.lop);
    await this.selectMon(options.mon);
    if (options.boSach) {
      await this.selectBoSach(options.boSach);
    }
    await this.clickTao();
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async clickTao(): Promise<void> {
    const btn = await this.findVisible([HocLieuV1FormModal.BTN_TAO], 5);
    if (!btn) throw new Error('Không tìm thấy nút "Tạo" trong popup học liệu V1');
    await this.jsClick(btn);
  }

  async clickHuy(): Promise<void> {
    const btn = await this.findVisible([HocLieuV1FormModal.BTN_HUY], 5);
    if (btn) await this.jsClick(btn);
  }

  async close(): Promise<void> {
    const btn = await this.findVisible([HocLieuV1FormModal.BTN_CLOSE], 3);
    if (btn) await this.jsClick(btn);
  }

  /** Sau khi nhấn Tạo, popup phải đóng lại (tạo thành công) */
  async expectClosed(): Promise<void> {
    await this.modal.waitFor({ state: 'hidden', timeout: 15_000 });
  }
}