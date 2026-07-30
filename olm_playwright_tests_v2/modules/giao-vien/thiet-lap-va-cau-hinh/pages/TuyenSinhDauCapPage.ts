import { BasePage } from '@core/shared-pages/BasePage';
import {
  TUYEN_SINH_DAU_CAP_URL,
  TUYEN_SINH_DAU_CAP_TIN_TS_URL,
  TUYEN_SINH_DAU_CAP_DANH_SACH_URL,
} from '@config/config';

/**
 * Page Object — Tuyển sinh đầu cấp (5.1.6).
 * URL: {BASE_URL}/truong-hoc/{slug}/tsdc#menu-school-tsdc
 *
 * Trang có 3 tab điều hướng riêng (`ul.nav.nav-tabs`, KHÔNG phải `#pills-tab`
 * dùng chung của khu vực quản trị trường): "Thiết lập" (mặc định — TRIỂN
 * KHAI ĐẦY ĐỦ ở page object này) / "Tin tuyển sinh" (/tsdc-news) / "Danh
 * sách" (/tsdc-list). 2 tab sau CHƯA có HTML để khảo sát DOM chi tiết —
 * `switchTab()` chỉ điều hướng thô qua URL, chưa có method thao tác riêng.
 *
 * Tab "Thiết lập" gồm các khối, từ trên xuống:
 *   1. Checkbox `#tsdc_active` "Kích hoạt tuyển sinh đầu cấp" — BỊ ẨN
 *      (`style="display:none"`) trong HTML mẫu (trường đã kích hoạt sẵn
 *      nên form không hiện lại control này). Vẫn expose method thao tác vì
 *      selector có thể hiện lại tuỳ trạng thái trường.
 *   2. "Thời gian mở đơn đăng ký": 2 input date-picker (bootstrap
 *      datetimepicker) `name="date_start_time"` / `name="date_end_time"`
 *      + nút "Lưu thời gian tuyển sinh" (#save-time).
 *   3. Input nhúng liên kết Google Form / Office 365 Form (#gform).
 *   4. "Chọn đối tượng tuyển sinh": 13 checkbox khối (`.zone`), value = mã
 *      khối dùng xuyên suốt trang (mn/th/th2..th5/thcs/thcs7..9/thpt/
 *      thpt11/thpt12). Tick 1 khối sẽ hiện cột tương ứng (mặc định
 *      `style="display:none"`) trong bảng tùy chọn thông tin bên dưới VÀ
 *      trong khối link "Trang tuyển sinh" cuối trang.
 *   5. Bảng "Các tùy chọn thông tin đăng ký tuyển sinh" (`#tsdc_setups`):
 *      mỗi DÒNG là 1 trường thông tin (VD: "Họ và tên học sinh", value
 *      "student"), mỗi CỘT là 1 khối — checkbox `.options` trong ô bật/tắt
 *      field đó riêng cho khối tương ứng. Vì `value` của checkbox lặp lại
 *      GIỐNG NHAU trên cả dòng (chỉ khác `class` của `<td>` theo khối) nên
 *      selector phải khoanh vùng theo dòng trước (`tr:has(...)`) rồi mới
 *      lọc theo `td.{zone}`. 2 dòng có nhãn sửa được tại chỗ
 *      (`.edit-label` + input ẩn + link lưu `i.feather-save`):
 *      "Đã hoàn thành chương trình học của trường" (`lb_preschool`) và
 *      "Tải lên file minh chứng" (`lb_uploadfile`).
 *   6. Khối "Trang tuyển sinh": link public theo khối (`?level=...`), mỗi
 *      `<p>` có class trùng mã khối, ẩn/hiện theo checkbox ở bước 4.
 *
 * Dùng kết hợp:
 *   const page = new TuyenSinhDauCapPage(p);
 *   await page.open();
 *   await page.setZoneChecked('th', true);
 *   await page.setFieldOption('th', 'student_code', true);
 *   await page.setRegistrationPeriod('01/08/2026', '31/08/2026');
 *   await page.saveRegistrationPeriod();
 */

/** Mã khối/cấp — value gốc của checkbox `.zone`, dùng xuyên suốt toàn trang
 *  (id checkbox, class cột bảng, class đoạn link public đều = `tsdc_{zone}` / `{zone}`). */
export type TsdcZone =
  | 'mn'
  | 'th'
  | 'th2'
  | 'th3'
  | 'th4'
  | 'th5'
  | 'thcs'
  | 'thcs7'
  | 'thcs8'
  | 'thcs9'
  | 'thpt'
  | 'thpt11'
  | 'thpt12';

/** Nhãn hiển thị tương ứng từng khối (đúng theo text label trên trang) */
export const TSDC_ZONE_LABEL: Record<TsdcZone, string> = {
  mn: 'Tuyển sinh Mầm non',
  th: 'Lớp 1',
  th2: 'Lớp 2',
  th3: 'Lớp 3',
  th4: 'Lớp 4',
  th5: 'Lớp 5',
  thcs: 'Lớp 6',
  thcs7: 'Lớp 7',
  thcs8: 'Lớp 8',
  thcs9: 'Lớp 9',
  thpt: 'Lớp 10',
  thpt11: 'Lớp 11',
  thpt12: 'Lớp 12',
};

const TSDC_ZONES: TsdcZone[] = [
  'mn', 'th', 'th2', 'th3', 'th4', 'th5',
  'thcs', 'thcs7', 'thcs8', 'thcs9',
  'thpt', 'thpt11', 'thpt12',
];

/**
 * Mã field (`value` gốc của checkbox `.options`) trong bảng "Các tùy chọn
 * thông tin đăng ký tuyển sinh". Để KIỂU `string` thay vì union literal —
 * bảng có ~87 dòng và có thể được thêm/bớt phía server theo thời gian;
 * dùng union cứng ở đây dễ vỡ mỗi khi trang đổi mà không mang lại nhiều lợi
 * ích autocomplete tương xứng. Xem `TSDC_FIELD_OPTIONS` bên dưới để có danh
 * sách tham chiếu đầy đủ (value + label) đã khảo sát từ HTML thực tế.
 */
export type TsdcFieldOption = string;

/** Danh sách đầy đủ (value, label) các dòng trong bảng tùy chọn thông tin,
 *  khảo sát trực tiếp từ HTML thực tế — dùng để lặp/kiểm tra trong test mà
 *  không cần tự parse lại bảng. Vài label lặp lại (VD: "Năm sinh" của
 *  cha/mẹ/người đỡ đầu, "Điểm TB năm lớp N") — phân biệt bằng `value`. */
export const TSDC_FIELD_OPTIONS: { value: TsdcFieldOption; label: string }[] = [
  { value: 'coso', label: 'Đăng ký học tại cơ sở' },
  { value: 'student', label: 'Họ và tên học sinh' },
  { value: 'user_code', label: 'Số định danh' },
  { value: 'gender', label: 'Giới tính' },
  { value: 'birth_date', label: 'Ngày sinh' },
  { value: 'birth_place', label: 'Nơi sinh' },
  { value: 'nation', label: 'Dân tộc' },
  { value: 'religion', label: 'Tôn giáo' },
  { value: 'student_code', label: 'Mã HS theo CSDL của bộ (10 số)' },
  { value: 'bhyt_code', label: 'Mã thẻ Bảo hiểm y tế' },
  { value: 'priority', label: 'Gia đình diện chính sách' },
  { value: 'health', label: 'Tình trạng sức khỏe' },
  { value: 'height', label: 'Chiều cao' },
  { value: 'weight', label: 'Cân nặng' },
  { value: 'hokhau', label: 'Hộ khẩu thường trú' },
  { value: 'place', label: 'Nơi ở hiện nay' },
  { value: 'sodieutra', label: 'Số điều tra gốc (nếu có)' },
  { value: 'sophocap', label: 'Số phổ cập (nếu có)' },
  { value: 'diabants', label: 'Địa bàn tuyển sinh' },
  { value: 'preschool', label: 'Đã hoàn thành chương trình học của trường' },
  { value: 'preschooldistrict', label: 'Thuộc Tỉnh (TP)' },
  { value: 'preyear', label: 'Năm hoàn thành' },
  { value: 'pregrade', label: 'Học sinh lớp' },
  { value: 'hinhthuc', label: 'Học bán trú' },
  { value: 'father', label: 'Họ tên cha' },
  { value: 'father_bornyear', label: 'Năm sinh (cha)' },
  { value: 'father_job', label: 'Nghề nghiệp (cha)' },
  { value: 'father_mobile', label: 'Điện thoại (cha)' },
  { value: 'mother', label: 'Họ tên mẹ' },
  { value: 'mother_bornyear', label: 'Năm sinh (mẹ)' },
  { value: 'mother_job', label: 'Nghề nghiệp (mẹ)' },
  { value: 'mother_mobile', label: 'Điện thoại (mẹ)' },
  { value: 'sponsor', label: 'Họ tên người đỡ đầu (nếu có)' },
  { value: 'sponsor_bornyear', label: 'Năm sinh (người đỡ đầu)' },
  { value: 'sponsor_job', label: 'Nghề nghiệp (người đỡ đầu)' },
  { value: 'sponsor_mobile', label: 'Điện thoại (người đỡ đầu)' },
  { value: 'th_student_mark', label: 'Điểm kiểm tra định kì cuối năm theo học bạ tiểu học' },
  { value: 'student_nlpc', label: 'Đánh giá năng lực, phẩm chất cuối năm học' },
  { value: 'reg_method', label: 'Đăng ký phương thức xét tuyển' },
  { value: 'ts_method', label: 'Hình thức thi tuyển' },
  { value: 'diem1', label: 'Điểm TB năm lớp 1' },
  { value: 'hocluc1', label: 'Học lực lớp 1' },
  { value: 'hanhkiem1', label: 'Rèn luyện lớp 1' },
  { value: 'diem2', label: 'Điểm TB năm lớp 2' },
  { value: 'hocluc2', label: 'Học lực lớp 2' },
  { value: 'hanhkiem2', label: 'Rèn luyện lớp 2' },
  { value: 'diem3', label: 'Điểm TB năm lớp 3' },
  { value: 'hocluc3', label: 'Học lực lớp 3' },
  { value: 'hanhkiem3', label: 'Rèn luyện lớp 3' },
  { value: 'diem4', label: 'Điểm TB năm lớp 4' },
  { value: 'hocluc4', label: 'Học lực lớp 4' },
  { value: 'hanhkiem4', label: 'Rèn luyện lớp 4' },
  { value: 'diem5', label: 'Điểm TB năm lớp 5' },
  { value: 'hocluc5', label: 'Học lực lớp 5' },
  { value: 'hanhkiem5', label: 'Rèn luyện lớp 5' },
  { value: 'diem6', label: 'Điểm TB năm lớp 6' },
  { value: 'hocluc6', label: 'Học lực lớp 6' },
  { value: 'hanhkiem6', label: 'Rèn luyện lớp 6' },
  { value: 'diem7', label: 'Điểm TB năm lớp 7' },
  { value: 'hocluc7', label: 'Học lực lớp 7' },
  { value: 'hanhkiem7', label: 'Rèn luyện lớp 7' },
  { value: 'diem8', label: 'Điểm TB năm lớp 8' },
  { value: 'hocluc8', label: 'Học lực lớp 8' },
  { value: 'hanhkiem8', label: 'Rèn luyện lớp 8' },
  { value: 'diem9', label: 'Điểm TB năm lớp 9' },
  { value: 'hocluc9', label: 'Học lực lớp 9' },
  { value: 'hanhkiem9', label: 'Rèn luyện lớp 9' },
  { value: 'diemthitoan', label: 'Điểm thi môn Toán' },
  { value: 'diemthivan', label: 'Điểm thi môn Ngữ văn' },
  { value: 'diemthianh', label: 'Điểm thi môn Tiếng Anh' },
  { value: 'diemthi1', label: 'Điểm thi môn 1' },
  { value: 'diemthi2', label: 'Điểm thi môn 2' },
  { value: 'diemthi3', label: 'Điểm thi môn 3' },
  { value: 'anbantru', label: 'Đăng ký ăn bán trú' },
  { value: 'muasgk', label: 'Đăng ký mua sách giáo khoa' },
  { value: 'muadp', label: 'Đăng ký mua đồng phục' },
  { value: 'uploadfile', label: 'Tải lên file minh chứng (được tải lên nhiều lần)' },
  { value: 'upload-hocba', label: 'Tải lên học bạ' },
  { value: 'upload-gks', label: 'Tải lên giấy khai sinh' },
  { value: 'upload-cccd', label: 'Tải lên Căn cước công dân của bố/mẹ hoặc giấy tờ thay thế' },
  { value: 'upload-anh', label: 'Tải lên ảnh 3x4' },
  { value: 'upload-dondk', label: 'Tải lên đơn đăng ký dự tuyển' },
  { value: 'upload-phieuthongtin', label: 'Tải lên phiếu kê khai thông tin học sinh' },
  { value: 'reg-name', label: 'Người khai hồ sơ' },
  { value: 'reg-phone', label: 'Số điện thoại' },
  { value: 'reg-email', label: 'Email liên hệ' },
  { value: 'camket', label: 'Cam kết của phụ huynh' },
];

/** 2 dòng duy nhất có nhãn sửa được tại chỗ (icon bút chì `.edit-label`) */
export type TsdcEditableLabelKey = 'preschool' | 'uploadfile';

export interface TsdcRegistrationPeriod {
  start: string;
  end: string;
}

/** Tab điều hướng riêng của trang Tuyển sinh đầu cấp (`ul.nav.nav-tabs`) */
export type TsdcTab = 'thietLap' | 'tinTuyenSinh' | 'danhSach';

const TSDC_TAB_LABEL: Record<TsdcTab, string> = {
  thietLap: 'Thiết lập',
  tinTuyenSinh: 'Tin tuyển sinh',
  danhSach: 'Danh sách',
};

const TSDC_TAB_URL: Record<TsdcTab, string> = {
  thietLap: TUYEN_SINH_DAU_CAP_URL,
  tinTuyenSinh: TUYEN_SINH_DAU_CAP_TIN_TS_URL,
  danhSach: TUYEN_SINH_DAU_CAP_DANH_SACH_URL,
};

export class TuyenSinhDauCapPage extends BasePage {
  static readonly URL = TUYEN_SINH_DAU_CAP_URL;

  // ── Heading / tab nav ────────────────────────────────────────────────────
  static readonly HEADING = "h2:has-text('Thiết lập trang tuyển sinh đầu cấp')";
  static readonly TAB_NAV = 'ul.nav.nav-tabs';
  static readonly TAB_LINK = `${TuyenSinhDauCapPage.TAB_NAV} a.nav-link`;

  // ── Kích hoạt tuyển sinh đầu cấp (thường ẩn — xem docblock) ──────────────
  static readonly ACTIVE_CHECKBOX = '#tsdc_active';

  // ── Thời gian mở đơn đăng ký ──────────────────────────────────────────────
  static readonly START_DATE_INPUT = 'input[name="date_start_time"]';
  static readonly END_DATE_INPUT = 'input[name="date_end_time"]';
  static readonly SAVE_TIME_BTN = '#save-time';

  // ── Liên kết Google Form ─────────────────────────────────────────────────
  static readonly GFORM_INPUT = '#gform';

  // ── Chọn đối tượng tuyển sinh ─────────────────────────────────────────────
  static zoneCheckboxSelector(zone: TsdcZone): string {
    return `input.zone[value="${zone}"]`;
  }
  static zoneLabelSelector(zone: TsdcZone): string {
    return `label[for="tsdc_${zone}"]`;
  }

  // ── Bảng "Các tùy chọn thông tin đăng ký tuyển sinh" ─────────────────────
  static readonly FIELD_TABLE_CONTAINER = '#tsdc_setups';
  static readonly FIELD_TABLE_ROWS = '#tsdc_setups table tbody tr';
  static zoneColumnHeaderSelector(zone: TsdcZone): string {
    return `#tsdc_setups table thead th.${zone}`;
  }
  /** Ô checkbox của 1 field trong 1 khối cụ thể. Khoanh vùng theo dòng
   *  (`tr:has(...)`) trước vì `value` lặp lại giống nhau trên cả dòng —
   *  chỉ `<td class="{zone}">` mới phân biệt được đúng khối cần thao tác. */
  static fieldCheckboxSelector(zone: TsdcZone, field: TsdcFieldOption): string {
    return `${TuyenSinhDauCapPage.FIELD_TABLE_ROWS}:has(input.options[value="${field}"]) td.${zone} input.options`;
  }
  static fieldRowSelector(field: TsdcFieldOption): string {
    return `${TuyenSinhDauCapPage.FIELD_TABLE_ROWS}:has(input.options[value="${field}"])`;
  }

  // ── Nhãn sửa được tại chỗ (preschool / uploadfile) ───────────────────────
  static editLabelSpanSelector(key: TsdcEditableLabelKey): string {
    return `#lb_${key}`;
  }
  static editLabelInputSelector(key: TsdcEditableLabelKey): string {
    return `div[data-lb="${key}"] input`;
  }
  static editLabelSaveSelector(key: TsdcEditableLabelKey): string {
    return `div[data-lb="${key}"] a`;
  }

  // ── Khối "Trang tuyển sinh" (link public) ────────────────────────────────
  static readonly PUBLIC_LINK_ROOT = "p:has-text('Link trang tuyển sinh của trường:') a";
  static publicLinkZoneSelector(zone: TsdcZone): string {
    return `p.${zone} a`;
  }

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(TuyenSinhDauCapPage.URL);
    return this;
  }

  /** true nếu URL đang ở đúng trang Tuyển sinh đầu cấp (bất kỳ tab con nào) */
  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('/tsdc');
  }

  /** Đợi phần "Thiết lập" hiển thị — dùng khi cần gate chắc chắn hơn isPageLoaded() */
  async waitForSettingsVisible(timeoutMs = 10_000): Promise<boolean> {
    return this.waitForSelector(TuyenSinhDauCapPage.HEADING, timeoutMs);
  }

  /** Chuyển tab. CHỈ 'thietLap' có method thao tác chi tiết trong class này —
   *  2 tab còn lại điều hướng qua URL trực tiếp vì chưa khảo sát DOM. */
  async switchTab(tab: TsdcTab): Promise<this> {
    const link = this.page.locator(TuyenSinhDauCapPage.TAB_LINK).filter({ hasText: TSDC_TAB_LABEL[tab] }).first();
    if (await link.count()) {
      await this.jsClick(link);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    } else {
      await this.navigateTo(TSDC_TAB_URL[tab]);
    }
    return this;
  }

  /** Đọc tab đang active (class 'active' trên <a class="nav-link active">) */
  async getActiveTab(): Promise<TsdcTab | null> {
    for (const tab of Object.keys(TSDC_TAB_LABEL) as TsdcTab[]) {
      const classAttr =
        (await this.page
          .locator(TuyenSinhDauCapPage.TAB_LINK)
          .filter({ hasText: TSDC_TAB_LABEL[tab] })
          .first()
          .getAttribute('class')) ?? '';
      if (classAttr.includes('active')) return tab;
    }
    return null;
  }

  // ==================================================================
  // Kích hoạt tuyển sinh đầu cấp
  // ==================================================================

  /** true nếu checkbox "Kích hoạt tuyển sinh đầu cấp" đang được tick.
   *  LƯU Ý: checkbox này thường bị ẩn (`display:none`) khi trường đã kích
   *  hoạt sẵn — isChecked() vẫn đọc được giá trị dù input không visible. */
  async isActivated(): Promise<boolean> {
    return this.page.locator(TuyenSinhDauCapPage.ACTIVE_CHECKBOX).isChecked();
  }

  /** Set trạng thái kích hoạt — dùng {force:true} vì control có thể đang ẩn */
  async setActivated(checked: boolean): Promise<this> {
    const checkbox = this.page.locator(TuyenSinhDauCapPage.ACTIVE_CHECKBOX);
    if (checked) await checkbox.check({ force: true });
    else await checkbox.uncheck({ force: true });
    return this;
  }

  // ==================================================================
  // Thời gian mở đơn đăng ký
  // ==================================================================

  /**
   * Điền ngày bắt đầu/kết thúc tuyển sinh. Input dùng bootstrap
   * datetimepicker — plugin có thể set `readonly` tại runtime khiến
   * `.fill()` thông thường không ăn; nếu vậy fallback set value trực tiếp
   * qua DOM rồi bắn event 'input'/'change' để JS lắng nghe (nếu có) vẫn
   * nhận được thay đổi. Định dạng ngày theo đúng định dạng picker hiển thị
   * trên trang thật (CHƯA verify — có thể là dd/mm/yyyy).
   */
  async setRegistrationPeriod(startDate: string, endDate: string): Promise<this> {
    await this._setDateInput(TuyenSinhDauCapPage.START_DATE_INPUT, startDate);
    await this._setDateInput(TuyenSinhDauCapPage.END_DATE_INPUT, endDate);
    return this;
  }

  private async _setDateInput(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector);
    try {
      await this.jsClearAndType(input, value);
    } catch {
      await input.evaluate((el, v) => {
        (el as HTMLInputElement).value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    }
  }

  async getRegistrationPeriod(): Promise<TsdcRegistrationPeriod> {
    const start = await this.page.locator(TuyenSinhDauCapPage.START_DATE_INPUT).inputValue();
    const end = await this.page.locator(TuyenSinhDauCapPage.END_DATE_INPUT).inputValue();
    return { start, end };
  }

  /** Bấm "Lưu thời gian tuyển sinh" — chờ thêm 500ms cho request AJAX kịp gửi */
  async saveRegistrationPeriod(): Promise<this> {
    await this.page.locator(TuyenSinhDauCapPage.SAVE_TIME_BTN).click();
    await this.page.waitForTimeout(500);
    return this;
  }

  // ==================================================================
  // Liên kết Google Form
  // ==================================================================

  async setGoogleFormLink(url: string): Promise<this> {
    await this.jsClearAndType(this.page.locator(TuyenSinhDauCapPage.GFORM_INPUT), url);
    return this;
  }

  async getGoogleFormLink(): Promise<string> {
    return this.page.locator(TuyenSinhDauCapPage.GFORM_INPUT).inputValue();
  }

  // ==================================================================
  // Chọn đối tượng tuyển sinh (13 checkbox khối)
  // ==================================================================

  async isZoneChecked(zone: TsdcZone): Promise<boolean> {
    return this.page.locator(TuyenSinhDauCapPage.zoneCheckboxSelector(zone)).isChecked();
  }

  /**
   * Set trạng thái tick 1 khối. Tick/bỏ tick sẽ toggle hiện/ẩn cột tương
   * ứng trong bảng tùy chọn thông tin + đoạn link public cuối trang — chờ
   * thêm 300ms để JS kịp xử lý trước khi thao tác tiếp trên cột đó.
   */
  async setZoneChecked(zone: TsdcZone, checked: boolean): Promise<this> {
    const checkbox = this.page.locator(TuyenSinhDauCapPage.zoneCheckboxSelector(zone));
    const current = await checkbox.isChecked();
    if (current !== checked) {
      if (checked) await checkbox.check({ force: true });
      else await checkbox.uncheck({ force: true });
      await this.page.waitForTimeout(300);
    }
    return this;
  }

  /** Toàn bộ khối đang được tick, theo đúng thứ tự TSDC_ZONES */
  async getCheckedZones(): Promise<TsdcZone[]> {
    const result: TsdcZone[] = [];
    for (const zone of TSDC_ZONES) {
      if (await this.isZoneChecked(zone)) result.push(zone);
    }
    return result;
  }

  /** true nếu cột của khối đang hiển thị trong bảng tùy chọn thông tin
   *  (cột mặc định `display:none` cho tới khi khối được tick ở fieldset) */
  async isZoneColumnVisible(zone: TsdcZone): Promise<boolean> {
    return this.isElementVisible(TuyenSinhDauCapPage.zoneColumnHeaderSelector(zone));
  }

  // ==================================================================
  // Bảng "Các tùy chọn thông tin đăng ký tuyển sinh"
  // ==================================================================

  async isFieldOptionChecked(zone: TsdcZone, field: TsdcFieldOption): Promise<boolean> {
    return this.page.locator(TuyenSinhDauCapPage.fieldCheckboxSelector(zone, field)).isChecked();
  }

  /** Bật/tắt 1 field thông tin cho 1 khối cụ thể. Khối phải đang được tick
   *  (cột hiển thị) thì checkbox mới thao tác được — không tự động gọi
   *  setZoneChecked() ở đây để tránh side-effect ngoài ý muốn của caller. */
  async setFieldOption(zone: TsdcZone, field: TsdcFieldOption, checked: boolean): Promise<this> {
    const checkbox = this.page.locator(TuyenSinhDauCapPage.fieldCheckboxSelector(zone, field));
    const current = await checkbox.isChecked();
    if (current !== checked) {
      if (checked) await checkbox.check({ force: true });
      else await checkbox.uncheck({ force: true });
    }
    return this;
  }

  /** Đọc trạng thái checkbox của 1 field trên TOÀN BỘ khối hiện có (kể cả khối đang ẩn cột) */
  async getFieldOptionStateAllZones(field: TsdcFieldOption): Promise<Record<TsdcZone, boolean>> {
    const result = {} as Record<TsdcZone, boolean>;
    for (const zone of TSDC_ZONES) {
      result[zone] = await this.isFieldOptionChecked(zone, field);
    }
    return result;
  }

  /** Tổng số dòng field đang render trong bảng (không phụ thuộc khối nào đang hiện cột) */
  async getFieldRowCount(): Promise<number> {
    return this.page.locator(TuyenSinhDauCapPage.FIELD_TABLE_ROWS).count();
  }

  // ==================================================================
  // Nhãn sửa được tại chỗ (preschool / uploadfile)
  // ==================================================================

  async getEditableLabelText(key: TsdcEditableLabelKey): Promise<string> {
    const text = await this.page.locator(TuyenSinhDauCapPage.editLabelSpanSelector(key)).textContent();
    return (text ?? '').trim();
  }

  /** Bấm icon bút chì để hiện input, điền giá trị mới, rồi bấm icon lưu (feather-save) */
  async setEditableLabelText(key: TsdcEditableLabelKey, value: string): Promise<this> {
    await this.page.locator(`${TuyenSinhDauCapPage.editLabelSpanSelector(key)} i.feather-edit`).click();
    await this.jsClearAndType(this.page.locator(TuyenSinhDauCapPage.editLabelInputSelector(key)), value);
    await this.page.locator(TuyenSinhDauCapPage.editLabelSaveSelector(key)).click();
    return this;
  }

  // ==================================================================
  // Khối "Trang tuyển sinh" (link public)
  // ==================================================================

  /** Link public gốc (không kèm ?level=) — luôn hiển thị */
  async getPublicLink(): Promise<string> {
    return (await this.page.locator(TuyenSinhDauCapPage.PUBLIC_LINK_ROOT).getAttribute('href')) ?? '';
  }

  /** Link public theo khối — trả về null nếu khối chưa được tick (đoạn <p> tương ứng đang ẩn) */
  async getPublicLinkForZone(zone: TsdcZone): Promise<string | null> {
    const visible = await this.isElementVisible(`p.${zone}`);
    if (!visible) return null;
    return this.page.locator(TuyenSinhDauCapPage.publicLinkZoneSelector(zone)).getAttribute('href');
  }
}