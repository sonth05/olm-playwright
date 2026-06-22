import { LOGIN_WAIT, LOGIN_URL } from '../config/config';
import {
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
  LOGIN_USERNAME_SELECTORS,
} from '../config/constants';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  static readonly URL = LOGIN_URL;

  static readonly FORGOT_PASSWORD_LINK = "a:has-text('Quên mật khẩu')";
  static readonly REGISTER_LINK = "a:has-text('Đăng ký')";
  static readonly GOOGLE_LOGIN_BTN = "a[href*='google']";
  static readonly ERROR_MESSAGE = '.alert-danger, .error-message';

  async open(): Promise<this> {
    await this.navigateTo(LoginPage.URL);
    return this;
  }

  async enterUsername(username: string): Promise<this> {
    const el = await this.findVisible(LOGIN_USERNAME_SELECTORS);
    if (el) await this.jsClearAndType(el, username);
    return this;
  }

  async enterPassword(password: string): Promise<this> {
    const el = await this.findVisible(LOGIN_PASSWORD_SELECTORS);
    if (el) await this.jsClearAndType(el, password);
    return this;
  }

  async clickLogin(): Promise<this> {
    const btn = await this.findVisible(LOGIN_SUBMIT_SELECTORS);
    if (btn) await this.jsClick(btn);
    await this.page.waitForTimeout(LOGIN_WAIT * 1000);
    return this;
  }

  async login(username: string, password: string): Promise<boolean> {
    await this.open();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
    return this.isLoginSuccessful();
  }

  isLoginSuccessful(): boolean {
    return !this.getCurrentUrl().includes('dangnhap');
  }

  async getErrorMessage(): Promise<string> {
    const el = await this.findVisible([LoginPage.ERROR_MESSAGE], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async clickForgotPassword(): Promise<this> {
    const el = await this.findVisible([LoginPage.FORGOT_PASSWORD_LINK], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickRegister(): Promise<this> {
    const el = await this.findVisible([LoginPage.REGISTER_LINK], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async hasValidationBlockingSubmit(): Promise<boolean> {
    try {
      const count = await this.page.locator('input:invalid').count();
      return count > 0;
    } catch {
      return false;
    }
  }

  async hasErrorMessage(): Promise<boolean> {
    const msg = await this.getErrorMessage();
    return Boolean(msg) || (await this.hasValidationBlockingSubmit());
  }
}
