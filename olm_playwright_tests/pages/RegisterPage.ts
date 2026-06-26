import { REGISTER_URL } from '../config/config';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  static readonly URL = REGISTER_URL;

  // Bước chọn loại tài khoản (trang đầu - nếu có)
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

  // Form đăng ký - dựa trên HTML thực tế OLM (placeholder tiếng Việt)
  static readonly INPUT_FULLNAME = "input[placeholder*='họ và tên'], input[placeholder*='Họ tên'], input[name='name'], input[placeholder*='họ tên']";
  static readonly INPUT_USERNAME = "input[placeholder*='tên đăng nhập'], input[name='username'], input[placeholder*='Tên đăng nhập']";
  static readonly INPUT_PHONE   = "input[name='tel'], input[placeholder*='số điện thoại'], input[placeholder*='điện thoại'], input[name='phone']";
  static readonly INPUT_EMAIL   = "input[placeholder*='email'], input[name='email'], input[type='email']";
  static readonly INPUT_PASSWORD = "input[placeholder*='mật khẩu'], input[name='password'], input[type='password']";
  static readonly CHECKBOX_NOTIFICATION = "input[type='checkbox']";
  static readonly SUBMIT_BTN    = "button[type='submit'], button:has-text('Đăng ký')";
  static readonly GOOGLE_BTN    = "a[href*='google']";
  static readonly SSO_GDDT_BTN  = "a[href*='hanoi']";
  // Link về trang đăng nhập - OLM dùng nhiều text khác nhau tùy phiên bản
  static readonly LOGIN_LINK    = "a:has-text('Đăng nhập'), a:has-text('Đã có tài khoản'), a[href*='dangnhap']";
  static readonly MODAL_EMAIL_EXISTS = '.modal.show, .modal-content';
  static readonly ERROR_MESSAGE = '.alert-danger, .error-message, .text-danger';

  async open(): Promise<this> {
    await this.navigateTo(RegisterPage.URL);
    return this;
  }

  async selectStudentAccount(): Promise<this> {
    // OLM có thể không có bước chọn loại tài khoản (form thẳng)
    const el = await this.findVisible([RegisterPage.ACCOUNT_TYPE_STUDENT], 3);
    if (el) await this.jsClick(el);
    return this;
  }

  async selectTeacherAccount(): Promise<this> {
    const el = await this.findVisible([RegisterPage.ACCOUNT_TYPE_TEACHER], 3);
    if (el) await this.jsClick(el);
    return this;
  }

  async fillRegistrationForm(
    fullname: string,
    username: string,
    email: string,
    password: string,
    phone = ''
  ): Promise<this> {
    const fields: [string, string][] = [
      [RegisterPage.INPUT_FULLNAME, fullname],
      [RegisterPage.INPUT_USERNAME, username],
      [RegisterPage.INPUT_EMAIL, email],
      [RegisterPage.INPUT_PASSWORD, password],
    ];

    for (const [selector, value] of fields) {
      if (value) {
        const el = await this.findVisible([selector], 5);
        if (el) await this.jsClearAndType(el, value);
      }
    }

    if (phone) {
      const el = await this.findVisible([RegisterPage.INPUT_PHONE], 5);
      if (el) await this.jsClearAndType(el, phone);
    }

    return this;
  }

  async clickSubmit(): Promise<this> {
    const el = await this.findVisible([RegisterPage.SUBMIT_BTN]);
    if (el) await this.jsClick(el);
    return this;
  }

  isRegistrationSuccessful(): boolean {
    return !this.getCurrentUrl().includes('dang-ky');
  }

  async getErrorMessage(): Promise<string> {
    const el = await this.findVisible([RegisterPage.ERROR_MESSAGE], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async isEmailExistsModalShown(): Promise<boolean> {
    const el = await this.findVisible([RegisterPage.MODAL_EMAIL_EXISTS], 5);
    return el !== null;
  }

  async getFieldValue(selector: string): Promise<string> {
    const el = await this.findVisible([selector], 5);
    return el ? (await el.inputValue()) : '';
  }

  async hasValidationMessage(): Promise<boolean> {
    try {
      if ((await this.page.locator('input:invalid').count()) > 0) return true;
    } catch {
      // ignore
    }
    if (await this.findVisible([RegisterPage.ERROR_MESSAGE], 3)) return true;
    if (await this.isEmailExistsModalShown()) return true;
    return false;
  }
}