import { BasePage } from '@core/shared-pages/BasePage';
import { THIET_LAP_TRUONG_HOC_URL } from '@config/config';

/** 3 checkbox thiết lập trường học — key ngắn gọn dùng trong test, tránh phải nhớ id số 1/2/3 */
export type ThietLapCheckboxKey = 'choPhepGvcn' | 'congKhaiHoSo' | 'duyetGiaoAn';

export interface VipInfo {
  hanVip: string;
  goiVip: string;
}

export class ThietLapTruongHocPage extends BasePage {
  static readonly URL = THIET_LAP_TRUONG_HOC_URL;

  // ── Heading / card ────────────────────────────────────────────────────────
  static readonly HEADING_THIET_LAP = "h4:has-text('Thiết lập trường học')";
  static readonly HEADING_THONG_TIN_VIP = "h4:has-text('Thông tin VIP')";

  // ── Thông tin VIP ─────────────────────────────────────────────────────────
  static readonly VIP_HAN_VIP_VALUE = "dt:has-text('Hạn vip:') + dd";
  static readonly VIP_GOI_VIP_VALUE = "dt:has-text('Gói vip:') + dd";
  static readonly LINK_GIOI_THIEU_EDIT = "h4:has-text('Giới thiệu') a[title='Thiết lập']";

  // ── 3 checkbox thiết lập (auto-save, không có nút Lưu) ──────────────────
  private static readonly CHECKBOX_SELECTOR: Record<ThietLapCheckboxKey, string> = {
    choPhepGvcn: '.more-options input.more-opts[id="1"]',
    congKhaiHoSo: '.more-options input.more-opts[id="2"]',
    duyetGiaoAn: '.more-options input.more-opts[id="3"]',
  };
  private static readonly CHECKBOX_LABEL: Record<ThietLapCheckboxKey, string> = {
    choPhepGvcn: "label:has-text('Cho phép giáo viên chủ nhiệm Thêm/Sửa/Xóa học sinh trong lớp')",
    congKhaiHoSo: "label:has-text('Công khai hồ sơ, kế hoạch của trường')",
    duyetGiaoAn: "label:has-text('Ban giám hiệu chỉ duyệt giáo án khi tổ chuyên môn đã duyệt')",
  };

  // ── Select "Thiết lập năm học giao bài" ─────────────────────────────────
  static readonly SELECT_NAM_HOC_GIAO_BAI = 'select#school_year_assign_lesson';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(ThietLapTruongHocPage.URL);
    return this;
  }

  /** true nếu đã ở đúng trang giới thiệu trường (URL chứa /truong-hoc/) */
  isPageLoaded(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('/truong-hoc/');
  }

  /** Đợi card "Thiết lập trường học" hiển thị — dùng khi cần gate chắc chắn hơn isPageLoaded() */
  async waitForCardVisible(timeoutMs = 10_000): Promise<boolean> {
    return this.waitForSelector(ThietLapTruongHocPage.HEADING_THIET_LAP, timeoutMs);
  }

  // ==================================================================
  // Thông tin VIP
  // ==================================================================

  /** Đọc "Hạn vip" / "Gói vip" hiển thị ở card Thông tin VIP đầu trang */
  async getVipInfo(): Promise<VipInfo> {
    const hanVip =
      (await this.page.locator(ThietLapTruongHocPage.VIP_HAN_VIP_VALUE).textContent().catch(() => '')) ?? '';
    const goiVip =
      (await this.page.locator(ThietLapTruongHocPage.VIP_GOI_VIP_VALUE).textContent().catch(() => '')) ?? '';
    return { hanVip: hanVip.trim(), goiVip: goiVip.trim() };
  }

  // ==================================================================
  // 3 checkbox thiết lập
  // ==================================================================

  /** true nếu checkbox đang được tick */
  async isCheckboxChecked(key: ThietLapCheckboxKey): Promise<boolean> {
    return this.page.locator(ThietLapTruongHocPage.CHECKBOX_SELECTOR[key]).isChecked();
  }

  /**
   * Đặt trạng thái checkbox theo `checked` mong muốn (click nếu trạng thái
   * hiện tại khác — tránh click thừa làm đổi ngược giá trị).
   * Checkbox auto-save (không có nút "Lưu"): chờ thêm 500ms sau click để
   * request AJAX kịp gửi trước khi test tiếp tục / reload trang kiểm tra lại.
   */
  async setCheckbox(key: ThietLapCheckboxKey, checked: boolean): Promise<this> {
    const checkbox = this.page.locator(ThietLapTruongHocPage.CHECKBOX_SELECTOR[key]);
    const current = await checkbox.isChecked();
    if (current !== checked) {
      // Input thật có thể bị label đè lên (custom-control) — click qua label để chắc chắn ăn
      await this.page.locator(ThietLapTruongHocPage.CHECKBOX_LABEL[key]).click();
      await this.page.waitForTimeout(500);
    }
    return this;
  }

  /** Toggle nhanh — đảo trạng thái hiện tại của checkbox */
  async toggleCheckbox(key: ThietLapCheckboxKey): Promise<this> {
    const current = await this.isCheckboxChecked(key);
    return this.setCheckbox(key, !current);
  }

  // ==================================================================
  // Select "Thiết lập năm học giao bài"
  // ==================================================================

  /** Chọn năm học giao bài theo value (VD: '2025' ứng với label '2025 - 2026') */
  async selectNamHocGiaoBai(value: string): Promise<this> {
    await this.page.locator(ThietLapTruongHocPage.SELECT_NAM_HOC_GIAO_BAI).selectOption(value);
    return this;
  }

  /** Đọc value đang được chọn ở select năm học giao bài */
  async getSelectedNamHocGiaoBai(): Promise<string> {
    return this.page.locator(ThietLapTruongHocPage.SELECT_NAM_HOC_GIAO_BAI).inputValue();
  }

  /** Danh sách toàn bộ option (value + label) của select năm học giao bài */
  async getNamHocGiaoBaiOptions(): Promise<{ value: string; label: string }[]> {
    const options = await this.page.locator(`${ThietLapTruongHocPage.SELECT_NAM_HOC_GIAO_BAI} option`).all();
    const result: { value: string; label: string }[] = [];
    for (const opt of options) {
      const value = (await opt.getAttribute('value')) ?? '';
      const label = ((await opt.textContent()) ?? '').trim();
      if (value) result.push({ value, label });
    }
    return result;
  }
}