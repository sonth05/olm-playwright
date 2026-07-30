import { REGISTER_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';
import {
  REGISTER_INPUT_FULLNAME,
  REGISTER_INPUT_USERNAME,
  REGISTER_INPUT_PHONE,
  REGISTER_INPUT_EMAIL,
  REGISTER_INPUT_PASSWORD,
  REGISTER_SUBMIT_BTN,
  REGISTER_ERROR_SELECTORS,
} from '@config/constants';

/**
 * RegisterPage — khớp DOM thực tế OLM /dang-ky (inspect 2026-06-29)
 *
 * Form đơn nhất, không có bước chọn loại tài khoản trước:
 *   #name       Nhập họ và tên
 *   #username   Nhập tên đăng nhập
 *   #tel        Nhập số điện thoại
 *   #email      Nhập email
 *   #password   Nhập mật khẩu   (type="password")
 *   #btn-submit-register  "Đăng ký"
 *
 * Error boxes: id="box-error-{field}" — ẩn bằng class "tw-hidden",
 *              hiện khi có lỗi (OLM xóa class tw-hidden đi).
 */
export class RegisterPage extends BasePage {
  static readonly URL = REGISTER_URL;

  // ── Static selectors (string) để dùng trong test trực tiếp ────────────────
  // Dùng selector đơn nhất nhất có thể (id) → ít fragile nhất
  static readonly INPUT_FULLNAME = '#name';
  static readonly INPUT_USERNAME = '#username';
  static readonly INPUT_PHONE   = '#tel';
  static readonly INPUT_EMAIL   = '#email';
  static readonly INPUT_PASSWORD = '#password';
  static readonly SUBMIT_BTN    = '#btn-submit-register';
  static readonly GOOGLE_BTN    = "a[href*='google/redirect']";
  static readonly SSO_GDDT_BTN  = "a[href*='hanoi/redirect']";
  // Link đăng nhập: DOM thực tế: <a href="https://olm.vn/dangnhap">Đăng nhập ngay</a>
  static readonly LOGIN_LINK    = "a[href*='dangnhap']";
  static readonly MODAL_EMAIL_EXISTS = '.modal.show, .modal-content';

  // ── Bước chọn loại tài khoản (nếu OLM có) ────────────────────────────────
  // DOM hiện tại không thấy bước này — selectStudentAccount() là no-op an toàn
  static readonly ACCOUNT_TYPE_STUDENT = [
    "xpath=//label[contains(text(),'Học sinh')]",
    "xpath=//div[contains(text(),'Học sinh')]",
    "xpath=//button[contains(text(),'Học sinh')]",
    ".student-type, [data-type='student']",
  ].join(', ');
  static readonly ACCOUNT_TYPE_TEACHER = [
    "xpath=//label[contains(text(),'Giáo viên')]",
    "xpath=//div[contains(text(),'Giáo viên')]",
    "xpath=//button[contains(text(),'Giáo viên')]",
    ".teacher-type, [data-type='teacher']",
  ].join(', ');

  // ── Navigation ────────────────────────────────────────────────────────────

  async open(): Promise<this> {
    await this.navigateTo(RegisterPage.URL);
    return this;
  }

  // ── Account type selection (safe no-op nếu OLM không có bước này) ─────────

  async selectStudentAccount(): Promise<this> {
    const el = await this.findVisible([RegisterPage.ACCOUNT_TYPE_STUDENT], 2);
    if (el) await this.jsClick(el);
    // Không throw nếu không có element → form đã sẵn sàng
    return this;
  }

  async selectTeacherAccount(): Promise<this> {
    const el = await this.findVisible([RegisterPage.ACCOUNT_TYPE_TEACHER], 2);
    if (el) await this.jsClick(el);
    return this;
  }

  // ── Form fill ─────────────────────────────────────────────────────────────

  async fillRegistrationForm(
    fullname: string,
    username: string,
    email: string,
    password: string,
    phone = ''
  ): Promise<this> {
    // Dùng array từ constants để có fallback nếu id thay đổi
    const fields: [string[], string][] = [
      [REGISTER_INPUT_FULLNAME,  fullname],
      [REGISTER_INPUT_USERNAME,  username],
      [REGISTER_INPUT_EMAIL,     email],
      [REGISTER_INPUT_PASSWORD,  password],
    ];

    for (const [selectors, value] of fields) {
      if (value) {
        const el = await this.findVisible(selectors, 5);
        if (el) {
          await el.click();
          await el.fill(value);
        }
      }
    }

    if (phone) {
      const el = await this.findVisible(REGISTER_INPUT_PHONE, 5);
      if (el) {
        await el.click();
        await el.fill(phone);
      }
    }

    return this;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async clickSubmit(): Promise<this> {
    const el = await this.findVisible(REGISTER_SUBMIT_BTN, 5);
    if (el) await this.jsClick(el);
    return this;
  }

  // ── Validation helpers ────────────────────────────────────────────────────

  /**
   * Kiểm tra có validation error hiển thị không.
   *
   * OLM hiển thị lỗi theo 3 cách:
   *   1. id="box-error-{field}" bị xóa class tw-hidden → visible
   *   2. HTML5 input:invalid (browser native)
   *   3. #box-response-register (lỗi từ server)
   */
  async hasValidationMessage(): Promise<boolean> {
    // Cách 1: OLM error boxes
    for (const sel of REGISTER_ERROR_SELECTORS) {
      try {
        const count = await this.page.locator(sel).count();
        if (count > 0) return true;
      } catch { /* tiếp tục */ }
    }
    // Cách 2: HTML5 constraint validation
    try {
      if ((await this.page.locator('input:invalid').count()) > 0) return true;
    } catch { /* ignore */ }
    // Cách 3: Modal lỗi (email/username trùng)
    if (await this.isEmailExistsModalShown()) return true;
    return false;
  }

  isRegistrationSuccessful(): boolean {
    const url = this.getCurrentUrl();
    // Thành công khi không còn ở trang đăng ký
    return !url.includes('dang-ky') && !url.includes('register');
  }

  async getErrorMessage(): Promise<string> {
    for (const sel of REGISTER_ERROR_SELECTORS) {
      try {
        const el = this.page.locator(sel).first();
        if (await el.isVisible({ timeout: 2_000 })) {
          return ((await el.textContent()) ?? '').trim();
        }
      } catch { /* thử selector tiếp */ }
    }
    return '';
  }

  async isEmailExistsModalShown(): Promise<boolean> {
    const el = await this.findVisible([RegisterPage.MODAL_EMAIL_EXISTS], 3);
    return el !== null;
  }

  async getFieldValue(selector: string): Promise<string> {
    const el = await this.findVisible([selector], 5);
    return el ? (await el.inputValue()) : '';
  }
}