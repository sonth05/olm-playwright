import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PopupComponent } from '../components/PopupComponent';
import { LOGIN_URL } from '../config/config';
import {
  LOGIN_USERNAME_SELECTORS,
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
} from '../config/constants';

export class LoginPage extends BasePage {
  // ── Selectors (khớp DOM thực tế olm.vn/dangnhap) ─────────────────────────
  // <input id="username" name="username" placeholder="Tên đăng nhập hoặc Email">
  // <input id="password" name="password" type="password" placeholder="Mật khẩu">
  static readonly ERROR_MESSAGE = [
    '.alert-danger',
    '.error-message',
    '[class*="error"]',
    'p.text-danger',
    '.invalid-feedback',
    '.tw-text-error-default:not(.tw-hidden)',
  ];

  static readonly SUCCESS_INDICATORS = [
    // Sau login thành công: user card trang chủ hoặc nav học sinh
    '.tw-bg-black\\/10',
    'nav a[href="/hoc-bai"]',
    'a[href*="/thong-tin-tai-khoan"]',
  ];

  private readonly popupHelper: PopupComponent;

  constructor(page: Page) {
    super(page);
    this.popupHelper = new PopupComponent(page);
  }

  async open(): Promise<this> {
    await this.navigateTo(LOGIN_URL);
    return this;
  }

  // ── Core methods (tên mới — dùng trong login() và fixtures) ───────────────

  async fillUsername(username: string): Promise<this> {
    const el = await this.findVisible(LOGIN_USERNAME_SELECTORS, 8);
    if (el) await el.fill(username);
    return this;
  }

  async fillPassword(password: string): Promise<this> {
    const el = await this.findVisible(LOGIN_PASSWORD_SELECTORS, 5);
    if (el) await el.fill(password);
    return this;
  }

  async submit(): Promise<this> {
    const btn = await this.findVisible(LOGIN_SUBMIT_SELECTORS, 5);
    if (btn) await btn.click();
    return this;
  }

  async isLoggedIn(): Promise<boolean> {
    return (await this.findVisible(LoginPage.SUCCESS_INDICATORS, 4)) !== null;
  }

  // ── Alias methods (dùng trong regression spec) ────────────────────────────
  // login.regression.spec.ts gọi enterUsername / enterPassword / clickLogin /
  // isLoginSuccessful — các alias này map 1-1 sang method gốc.

  /** Alias của fillUsername() — dùng trong regression tests */
  async enterUsername(username: string): Promise<this> {
    return this.fillUsername(username);
  }

  /** Alias của fillPassword() — dùng trong regression tests */
  async enterPassword(password: string): Promise<this> {
    return this.fillPassword(password);
  }

  /** Alias của submit() — dùng trong regression tests */
  async clickLogin(): Promise<this> {
    return this.submit();
  }

  /**
   * Kiểm tra login có thành công không.
   * Sync check: nếu URL không còn chứa 'dangnhap' → đã redirect → thành công.
   * Dùng trong regression: expect(loginPage.isLoginSuccessful()).toBeFalsy()
   */
  isLoginSuccessful(): boolean {
    return !this.getCurrentUrl().includes('dangnhap');
  }

  // ── Full login flow ───────────────────────────────────────────────────────

  /**
   * Thực hiện đăng nhập đầy đủ.
   * @returns true nếu redirect khỏi trang login (coi là thành công)
   */
  async login(username: string, password: string): Promise<boolean> {
    await this.open();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();

    // Một số tài khoản test bị yêu cầu xác thực Email/SĐT ngay sau khi đăng
    // nhập — modal "Xác thực" hiện chồng lên trang đích và có thể khiến
    // waitForURL("không chứa dangnhap") timeout nếu chỉ chờ 1 lần, vì modal
    // không tự đóng. Nên poll liên tục: mỗi vòng vừa dọn popup vừa check URL,
    // thay vì waitForURL thuần.
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      await this.dismissAllNotifications(1);
      if (!this.getCurrentUrl().includes('dangnhap')) break;
      await this.page.waitForTimeout(500);
    }

    if (this.getCurrentUrl().includes('dangnhap')) return false;

    // Dọn sạch toàn bộ popup còn lại trên trang đích (đổi mật khẩu, xác
    // thực, VIP, thông báo…) trước khi các bước/test sau thao tác tiếp.
    await this.dismissPopups();
    await this.popupHelper.dismissAll();
    return true;
  }

  async getErrorMessage(): Promise<string | null> {
    const el = await this.findVisible(LoginPage.ERROR_MESSAGE, 3);
    return el ? el.innerText() : null;
  }
}