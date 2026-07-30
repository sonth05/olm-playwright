import type { Page, Locator } from '@playwright/test';
import { BasePage } from '../../../../core/shared-pages/BasePage';

/**
 * CauHoiVuiPopup.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Popup "Câu hỏi vui" (Game hoá) có cấu trúc RIÊNG, khác hẳn
 * HocLieuV1FormModal:
 *   - Tiêu đề học liệu (input, không có dấu * hiển thị nhưng vẫn bắt buộc)
 *   - Khối lớp (dropdown, mặc định "Chọn khối lớp")
 *   - Môn học (dropdown, mặc định "Chọn môn học")
 *   - Chọn dạng câu hỏi: 5 card (Chọn đáp án đúng, Nối đáp án, Ghép nhóm,
 *     Sắp xếp, Kéo thả) — phải chọn đúng 1 card trước khi bấm "Tạo học liệu"
 *   - Nút "Hủy Bỏ" / "Tạo học liệu"
 */
export type CauHoiVuiDangCauHoi =
  | 'Chọn đáp án đúng'
  | 'Nối đáp án'
  | 'Ghép nhóm'
  | 'Sắp xếp'
  | 'Kéo thả';

export interface CauHoiVuiFormData {
  tieuDeHocLieu: string;
  khoiLop: string; // VD: 'Lớp 12'
  monHoc: string; // VD: 'Kỹ thuật'
  dangCauHoi: CauHoiVuiDangCauHoi;
}

export class CauHoiVuiPopup extends BasePage {
  static readonly MODAL_TITLE = 'Câu hỏi vui';

  static readonly INPUT_TIEU_DE = [
    'input[placeholder="Nhập tiêu đề học liệu"]',
    'input[placeholder*="tiêu đề học liệu"]',
  ];
  static readonly DROPDOWN_KHOI_LOP = 'text=Chọn khối lớp';
  static readonly DROPDOWN_MON_HOC = 'text=Chọn môn học';

  static readonly BTN_TAO_HOC_LIEU = 'button:has-text("Tạo học liệu")';
  static readonly BTN_HUY_BO = 'button:has-text("Hủy Bỏ")';

  readonly modal: Locator;

  constructor(page: Page) {
    super(page);
    this.modal = page
      .locator('.modal.show, .modal-dialog, [role="dialog"]')
      .filter({ hasText: CauHoiVuiPopup.MODAL_TITLE })
      .last();
  }

  async expectVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async fillTieuDe(value: string): Promise<void> {
    const input = await this.findVisible(CauHoiVuiPopup.INPUT_TIEU_DE, 5);
    if (!input) throw new Error('Không tìm thấy ô "Nhập tiêu đề học liệu"');
    await this.jsClearAndType(input, value);
  }

  private async selectDropdown(placeholderText: string, optionLabel: string): Promise<void> {
    const trigger = this.modal.getByText(placeholderText, { exact: false }).first();
    await this.jsClick(trigger);
    const option = this.page
      .getByRole('option', { name: optionLabel })
      .or(this.page.locator('li, [role="option"], .dropdown-item').filter({ hasText: optionLabel }))
      .first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await this.jsClick(option);
  }

  async selectKhoiLop(label: string): Promise<void> {
    await this.selectDropdown('Chọn khối lớp', label);
  }

  async selectMonHoc(label: string): Promise<void> {
    await this.selectDropdown('Chọn môn học', label);
  }

  /** Chọn 1 trong 5 card dạng câu hỏi */
  async selectDangCauHoi(dang: CauHoiVuiDangCauHoi): Promise<void> {
    const card = this.modal.getByText(dang, { exact: true }).first();
    await card.waitFor({ state: 'visible', timeout: 5_000 });
    await this.jsClick(card);
  }

  async fillAll(data: CauHoiVuiFormData): Promise<void> {
    await this.fillTieuDe(data.tieuDeHocLieu);
    await this.selectKhoiLop(data.khoiLop);
    await this.selectMonHoc(data.monHoc);
    await this.selectDangCauHoi(data.dangCauHoi);
  }

  async clickTaoHocLieu(): Promise<void> {
    const btn = await this.findVisible([CauHoiVuiPopup.BTN_TAO_HOC_LIEU], 5);
    if (!btn) throw new Error('Không tìm thấy nút "Tạo học liệu"');
    await this.jsClick(btn);
  }

  async clickHuyBo(): Promise<void> {
    const btn = await this.findVisible([CauHoiVuiPopup.BTN_HUY_BO], 5);
    if (btn) await this.jsClick(btn);
  }

  async expectClosed(): Promise<void> {
    await this.modal.waitFor({ state: 'hidden', timeout: 15_000 });
  }
}