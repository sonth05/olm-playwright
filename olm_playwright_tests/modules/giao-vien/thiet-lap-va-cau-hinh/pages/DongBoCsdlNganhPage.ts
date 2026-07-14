import { BasePage } from '@core/shared-pages/BasePage';
import { DONG_BO_CSDL_NGANH_URL } from '@config/config';

/**
 * Page Object — Đồng bộ csdl ngành (5.1.2).
 * URL: {BASE_URL}/truong-hoc/{slug}/csdl-nganh#menu-dong-bo-csdl-nganh
 *
 * CHÚ Ý: đây là UI React (Tailwind, prefix `tw-`), khác hẳn kiến trúc
 * Bootstrap của các trang quản trị trường còn lại (ThietLapTruongHocPage,
 * ThietLapNamHocMoiPage, ThietLapMonHocPage) — vì vậy selector ở đây dùng
 * text/placeholder/attribute thay vì class Bootstrap quen thuộc.
 *
 * Luồng nghiệp vụ gồm 6 bước hiển thị ở sidebar trái, xử lý TUẦN TỰ —
 * bước sau chỉ mở khoá (bỏ `disabled`) sau khi bước trước hoàn tất:
 *   1. Cấu hình tài khoản CSDL ngành  (page object này triển khai đầy đủ)
 *   2. Đồng bộ môn học
 *   3. Đồng bộ lớp học
 *   4. Đồng bộ giáo viên
 *   5. Phân công giáo viên
 *   6. Đồng bộ học sinh
 * Các bước 2-6 hiện chỉ có `getStepStatus()` để đọc trạng thái khoá/mở —
 * form chi tiết bên trong từng bước sẽ bổ sung khi có yêu cầu cụ thể.
 *
 * Bước 1 gồm 2 hành động độc lập:
 *   - "Tải mã sở và cấp học": gọi API bằng tài khoản CSDL ngành vừa nhập,
 *     nạp option thật cho 2 select "Mã sở"/"Cấp học" (ban đầu rỗng).
 *   - "Lưu cấu hình" (submit form): lưu lại tài khoản + mã sở + cấp học đã chọn.
 *   - "Đồng bộ quản lý trường": chỉ enable sau khi đã lưu cấu hình thành công
 *     (disabled mặc định trong DOM ban đầu).
 *
 * Dùng kết hợp:
 *   const page = new DongBoCsdlNganhPage(p);
 *   await page.open();
 *   await page.fillCredentials('username', 'password');
 *   await page.clickTaiMaSoVaCapHoc();
 *   await page.selectMaSo('001');
 *   await page.selectCapHoc(['Tiểu học', 'THCS']);
 *   await page.clickLuuCauHinh();
 */

export type SyncStepNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type SyncStepStatus = 'active' | 'enabled' | 'disabled';

export interface SelectOptionInfo {
  value: string;
  label: string;
}

export class DongBoCsdlNganhPage extends BasePage {
  static readonly URL = DONG_BO_CSDL_NGANH_URL;

  // ── Heading ───────────────────────────────────────────────────────────────
  static readonly HEADING = "h1:has-text('Đồng bộ dữ liệu OLM với Cơ sở dữ liệu ngành')";
  static readonly SCHOOL_BADGE = "div:has-text('Trường đang thao tác:')";

  // ── Sidebar 6 bước — nút step theo số thứ tự (1-6) trong vòng tròn tw-rounded-full ─
  static readonly STEP_BUTTON = (step: SyncStepNumber): string =>
    `aside button:has(div.tw-rounded-full:text-is("${step}"))`;

  // ── Bước 1 — form ────────────────────────────────────────────────────────
  static readonly INPUT_USERNAME = "input[placeholder='Nhập tên đăng nhập']";
  static readonly INPUT_PASSWORD = "input[placeholder='Nhập mật khẩu']";
  static readonly BTN_TAI_MA_SO = "button:has-text('Tải mã sở và cấp học')";
  static readonly BTN_DONG_BO_QUAN_LY_TRUONG = "button:has-text('Đồng bộ quản lý trường')";
  static readonly SELECT_MA_SO = "label:has-text('Mã sở') select";
  static readonly SELECT_CAP_HOC = "label:has-text('Cấp học') select";
  static readonly BTN_LUU_CAU_HINH = "button[type='submit']:has-text('Lưu cấu hình')";

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(DongBoCsdlNganhPage.URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('/csdl-nganh');
  }

  async waitForFormVisible(timeoutMs = 10_000): Promise<boolean> {
    return this.waitForSelector(DongBoCsdlNganhPage.HEADING, timeoutMs);
  }

  /** Đọc tên trường hiển thị ở badge "Trường đang thao tác: ..." đầu trang */
  async getSchoolBadgeText(): Promise<string> {
    return ((await this.page.locator(DongBoCsdlNganhPage.SCHOOL_BADGE).textContent()) ?? '').trim();
  }

  // ==================================================================
  // Sidebar 6 bước
  // ==================================================================

  /**
   * Trạng thái 1 bước trong luồng:
   *  - 'active': đang là bước hiện tại (nền tw-bg-[#5c5bff]/30, không disabled)
   *  - 'disabled': bị khoá, chưa xử lý tới (thuộc tính disabled + tw-cursor-not-allowed)
   *  - 'enabled': đã hoàn tất/có thể bấm nhưng không phải bước hiện tại
   */
  async getStepStatus(step: SyncStepNumber): Promise<SyncStepStatus> {
    const btn = this.page.locator(DongBoCsdlNganhPage.STEP_BUTTON(step));
    const isDisabled = await btn.isDisabled().catch(() => false);
    if (isDisabled) return 'disabled';

    const classAttr = (await btn.getAttribute('class')) ?? '';
    return classAttr.includes('5c5bff]/30') ? 'active' : 'enabled';
  }

  async clickStep(step: SyncStepNumber): Promise<this> {
    await this.page.locator(DongBoCsdlNganhPage.STEP_BUTTON(step)).click();
    return this;
  }

  // ==================================================================
  // Bước 1 — Cấu hình tài khoản CSDL ngành
  // ==================================================================

  async fillCredentials(username: string, password: string): Promise<this> {
    await this.jsClearAndType(this.page.locator(DongBoCsdlNganhPage.INPUT_USERNAME), username);
    await this.jsClearAndType(this.page.locator(DongBoCsdlNganhPage.INPUT_PASSWORD), password);
    return this;
  }

  /** Bấm "Tải mã sở và cấp học" — gọi API thật bằng tài khoản vừa nhập, nạp option cho 2 select bên dưới */
  async clickTaiMaSoVaCapHoc(): Promise<this> {
    await this.page.locator(DongBoCsdlNganhPage.BTN_TAI_MA_SO).click();
    // Best-effort: đợi select "Mã sở" có ít nhất 1 option ngoài placeholder "Chọn mã sở"
    await this.page
      .locator(`${DongBoCsdlNganhPage.SELECT_MA_SO} option:not([value=""])`)
      .first()
      .waitFor({ state: 'attached', timeout: 15_000 })
      .catch(() => {});
    return this;
  }

  async isDongBoQuanLyTruongEnabled(): Promise<boolean> {
    return !(await this.page.locator(DongBoCsdlNganhPage.BTN_DONG_BO_QUAN_LY_TRUONG).isDisabled());
  }

  async clickDongBoQuanLyTruong(): Promise<this> {
    await this.page.locator(DongBoCsdlNganhPage.BTN_DONG_BO_QUAN_LY_TRUONG).click();
    return this;
  }

  /** Danh sách option select "Mã sở" (đã nạp sau clickTaiMaSoVaCapHoc()), bỏ qua placeholder rỗng */
  async getMaSoOptions(): Promise<SelectOptionInfo[]> {
    return this._readSelectOptions(DongBoCsdlNganhPage.SELECT_MA_SO);
  }

  async selectMaSo(value: string): Promise<this> {
    await this.page.locator(DongBoCsdlNganhPage.SELECT_MA_SO).selectOption(value);
    return this;
  }

  /** Danh sách option select multiple "Cấp học" (đã nạp sau clickTaiMaSoVaCapHoc()) */
  async getCapHocOptions(): Promise<SelectOptionInfo[]> {
    return this._readSelectOptions(DongBoCsdlNganhPage.SELECT_CAP_HOC);
  }

  /** Chọn nhiều cấp học cùng lúc (multi-select — Ctrl/Cmd), truyền vào mảng value */
  async selectCapHoc(values: string[]): Promise<this> {
    await this.page.locator(DongBoCsdlNganhPage.SELECT_CAP_HOC).selectOption(values);
    return this;
  }

  async clickLuuCauHinh(): Promise<this> {
    await this.page.locator(DongBoCsdlNganhPage.BTN_LUU_CAU_HINH).click();
    return this;
  }

  private async _readSelectOptions(selectSelector: string): Promise<SelectOptionInfo[]> {
    const options = await this.page.locator(`${selectSelector} option`).all();
    const result: SelectOptionInfo[] = [];
    for (const opt of options) {
      const value = (await opt.getAttribute('value')) ?? '';
      const label = ((await opt.textContent()) ?? '').trim();
      if (value) result.push({ value, label });
    }
    return result;
  }
}