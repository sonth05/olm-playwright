import { REGISTER_URL } from '../config/config';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  static readonly URL = REGISTER_URL;

  static readonly ACCOUNT_TYPE_STUDENT = "xpath=//label[contains(text(),'Học sinh')]";
  static readonly ACCOUNT_TYPE_TEACHER = "xpath=//label[contains(text(),'Giáo viên')]";
  static readonly INPUT_FULLNAME = "input[name='name'], input[placeholder*='Họ tên']";
  static readonly INPUT_USERNAME = "input[name='username']";
  static readonly INPUT_PHONE = "input[name='phone'], input[type='tel']";
  static readonly INPUT_EMAIL = "input[name='email'], input[type='email']";
  static readonly INPUT_PASSWORD = "input[name='password'], input[type='password']";
  static readonly CHECKBOX_NOTIFICATION = "input[type='checkbox']";
  static readonly SUBMIT_BTN = "button[type='submit']";
  static readonly GOOGLE_BTN = "a[href*='google']";
  static readonly SSO_GDDT_BTN = "a[href*='hanoi']";
  static readonly LOGIN_LINK = "a:has-text('Đã có tài khoản')";
  static readonly MODAL_EMAIL_EXISTS = '.modal.show, .modal-content';
  static readonly ERROR_MESSAGE = '.alert-danger, .error-message, .text-danger';

  async open(): Promise<this> {
    await this.navigateTo(RegisterPage.URL);
    return this;
  }

  async selectStudentAccount(): Promise<this> {
    const el = await this.findVisible([RegisterPage.ACCOUNT_TYPE_STUDENT], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async selectTeacherAccount(): Promise<this> {
    const el = await this.findVisible([RegisterPage.ACCOUNT_TYPE_TEACHER], 5);
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
