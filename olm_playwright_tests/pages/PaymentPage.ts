import { GIO_HANG_URL } from '../config/config';
import { BasePage } from './BasePage';

/**
 * Luồng thực tế OLM /gio-hang (2026):
 *
 *  Bước 0: Mở /gio-hang
 *  Bước 1 (nếu cần): Chọn loại tài khoản → click "Đăng ký" (Học sinh)
 *                    → trang reload, hiện section chọn thời gian + gói VIP
 *  Bước 2: Chọn thời gian (plan button .select-plan-vip-trigger)
 *  Bước 3: Chọn gói VIP → click "Đăng ký" (.register-package-trigger)
 *           → sidebar "Giá trị đơn hàng" xuất hiện bên phải
 *  Bước 4: Click "THANH TOÁN" trong sidebar
 *           → scroll xuống section nhập SĐT + chọn PTTT (cùng trang, CHỈ khi đã đăng nhập)
 *  Bước 5: Nhập SĐT → chọn PTTT → redirect sang cổng thanh toán (không test)
 *
 * Sidebar "Giá trị đơn hàng" HTML (xác nhận từ ảnh):
 *   <div class="gio-hang-right"> (hoặc tương tự)
 *     Tổng tiền      800,000 VND
 *     Số tiền được giảm  0 VND
 *     Số tiền phải thanh toán  800,000 VND  ← màu đỏ
 *     [THANH TOÁN]
 *
 * data-type-vip thực tế: "vip" | "subject" | "exam"
 * data-type trên register button: "vip" | "subject" | "exam"
 */
export class PaymentPage extends BasePage {
  static readonly GIO_HANG_URL = GIO_HANG_URL;

  // ── Chọn loại tài khoản ──────────────────────────────────────────────────
  static readonly ACCOUNT_TYPE_REGISTER_BTN =
    '.card-body button.btn.text-white.font-weight-bold';

  // ── Chọn thời gian ────────────────────────────────────────────────────────
  static readonly PLAN_BTN    = 'button.select-plan-vip-trigger';
  static readonly PLAN_ACTIVE = 'button.select-plan-vip-trigger.active';

  // ── Card gói VIP ──────────────────────────────────────────────────────────
  /** Giá trong card — data-type-vip: "vip" | "subject" | "exam" */
  static readonly PRICE_IN_CARD = '.price-package';
  /** Nút "Đăng ký" trong card — data-type: "vip" | "subject" | "exam" */
  static readonly REGISTER_PKG_BTN = 'button.register-package-trigger';

  // ── Sidebar "Giá trị đơn hàng" ───────────────────────────────────────────
  /**
   * Nút THANH TOÁN trong sidebar (xuất hiện sau khi click Đăng ký gói).
   * HTML xác nhận từ ảnh: button màu xanh chứa text "THANH TOÁN"
   */
  static readonly CONFIRM_PAY_BTN =
    'button.confirm-pay, ' +
    'button:has-text("THANH TOÁN"), ' +
    '.btn-thanh-toan, ' +
    'a:has-text("THANH TOÁN")';

  /**
   * Sidebar container — dùng để lấy toàn bộ text sidebar khi không biết class chính xác.
   * Ưu tiên phần tử chứa "Giá trị đơn hàng" hoặc nút THANH TOÁN.
   */
  static readonly SIDEBAR_CONTAINER =
    '.gio-hang-sidebar, .cart-sidebar, .package-vip-sidebar, ' +
    '[class*="sidebar"], [class*="cart-right"], [class*="gio-hang-right"], ' +
    // fallback: div chứa nút THANH TOÁN (chắc chắn là sidebar)
    'div:has(button:has-text("THANH TOÁN")), div:has(.confirm-pay)';

  /**
   * Giá "Số tiền phải thanh toán" (màu đỏ, giá cuối cùng).
   * Thử nhiều selector vì class chính xác chưa xác nhận được từ DOM tĩnh.
   */
  static readonly SIDEBAR_FINAL_PRICE =
    '.final-price, .price-must-pay, .total-must-pay, ' +
    '[class*="final"], [class*="must-pay"], ' +
    // fallback: text màu đỏ trong sidebar container
    '.text-danger, .text-red, [style*="color: red"], [style*="color:#"]';

  // ── Section nhập SĐT + PTTT (chỉ sau khi đăng nhập + click THANH TOÁN) ──
  static readonly PHONE_INPUT =
    'input[placeholder*="điện thoại"], input[type="tel"], input[name="phone"]';

  // Text labels của 4 PTTT hiển thị ở trang /gio-hang sau click THANH TOÁN
  static readonly PAYMENT_BANK  = ':text("Nộp tiền vào tài khoản ngân hàng")';
  static readonly PAYMENT_VNPAY = ':text("Ví điện tử VNPay")';
  static readonly PAYMENT_VISA  = ':text("Internet Banking")';
  static readonly PAYMENT_MOMO  = ':text("MoMo")';

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async _waitForPlanSection(timeout = 30_000): Promise<void> {
    await this.page.waitForSelector(PaymentPage.PLAN_BTN, { timeout });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /**
   * Mở /gio-hang.
   * Nếu trang hiện card chọn loại tài khoản, tự click "Đăng ký" đầu tiên.
   */
  async openGioHang(autoSelectAccountType = true): Promise<this> {
    await this.navigateTo(PaymentPage.GIO_HANG_URL);
    await this.page.waitForLoadState('domcontentloaded');

    if (autoSelectAccountType) {
      const planVisible = await this.page
        .locator(PaymentPage.PLAN_BTN).first()
        .isVisible().catch(() => false);

      if (!planVisible) {
        const acctBtn = this.page
          .locator(PaymentPage.ACCOUNT_TYPE_REGISTER_BTN).first();
        if ((await acctBtn.count()) > 0) {
          await acctBtn.waitFor({ state: 'visible', timeout: 20_000 });
          await acctBtn.click();
          await this.page.waitForLoadState('domcontentloaded');
        }
      }
    }

    await this._waitForPlanSection().catch(() => {});
    return this;
  }

  async openMuaVip(): Promise<this> {
    return this.openGioHang();
  }

  isMuaVipLoaded(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('gio-hang') || url.includes('mua-vip') || url.includes('thanh-toan');
  }

  // ── Chọn thời gian ────────────────────────────────────────────────────────

  async getPlanLabels(): Promise<string[]> {
    await this._waitForPlanSection();
    const btns = await this.page.locator(PaymentPage.PLAN_BTN).all();
    const labels: string[] = [];
    for (const btn of btns) {
      labels.push(((await btn.textContent()) ?? '').trim());
    }
    return labels;
  }

  /** @param dataPlan '12-y' | '1-y' | '2-y' | '6-m' | '3-m' | '1-m' */
  async selectPlan(dataPlan: string): Promise<this> {
    await this._waitForPlanSection();
    const btn = this.page.locator(
      `button.select-plan-vip-trigger[data-plan="${dataPlan}"]`
    );
    await btn.waitFor({ state: 'visible', timeout: 20_000 });
    await btn.click();
    await this.page.waitForTimeout(800);
    return this;
  }

  async getActivePlan(): Promise<string> {
    await this.page.waitForSelector(PaymentPage.PLAN_ACTIVE, { timeout: 20_000 });
    return (
      (await this.page.locator(PaymentPage.PLAN_ACTIVE).first().getAttribute('data-plan')) ?? ''
    );
  }

  // ── Gói VIP ───────────────────────────────────────────────────────────────

  async getVipPackages(): Promise<Array<{ typeVip: string; price: string }>> {
    await this.page.waitForSelector(PaymentPage.PRICE_IN_CARD, { timeout: 20_000 });
    const els = await this.page.locator(PaymentPage.PRICE_IN_CARD).all();
    const result: Array<{ typeVip: string; price: string }> = [];
    for (const el of els) {
      result.push({
        typeVip: (await el.getAttribute('data-type-vip')) ?? '',
        price:   ((await el.textContent()) ?? '').trim(),
      });
    }
    return result;
  }

  /**
   * Click nút "Đăng ký" của một gói VIP → sidebar "Giá trị đơn hàng" xuất hiện.
   * @param dataType 'vip' | 'subject' | 'exam'
   */
  async clickRegisterPackage(dataType: 'vip' | 'subject' | 'exam'): Promise<this> {
    const btn = this.page.locator(
      `button.register-package-trigger[data-type="${dataType}"]`
    );
    await btn.first().waitFor({ state: 'visible', timeout: 20_000 });
    await this.jsClick(btn.first());

    // Cuộn xuống để đảm bảo sidebar hiển thị trong viewport
    await this.page.waitForTimeout(600);
    await this.page.evaluate(() => window.scrollBy(0, 200));
    await this.page.waitForTimeout(400);

    // Chờ nút THANH TOÁN xuất hiện trong sidebar
    await this.page
      .waitForSelector(PaymentPage.CONFIRM_PAY_BTN, { timeout: 16_000 })
      .catch(() => {});
    return this;
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────

  /**
   * Lấy toàn bộ text của sidebar "Giá trị đơn hàng".
   * Dùng để kiểm tra sidebar có hiển thị giá trị hợp lệ không.
   */
  async getSidebarText(): Promise<string> {
    // Thử lấy text từ sidebar container
    const container = this.page.locator(PaymentPage.SIDEBAR_CONTAINER).first();
    if ((await container.count()) > 0) {
      return ((await container.textContent().catch(() => '')) ?? '').trim();
    }
    return '';
  }

  /**
   * Lấy giá "Số tiền phải thanh toán" từ sidebar.
   * Thử nhiều selector, fallback sang lấy text toàn sidebar.
   */
  async getSidebarFinalPrice(): Promise<string> {
    // Thử selector cụ thể trước
    const selectors = PaymentPage.SIDEBAR_FINAL_PRICE.split(',').map(s => s.trim());
    for (const sel of selectors) {
      try {
        const el = this.page.locator(sel).first();
        if ((await el.count()) > 0 && await el.isVisible({ timeout: 2_000 })) {
          const text = ((await el.textContent()) ?? '').trim();
          if (text.match(/\d/)) return text;
        }
      } catch { /* tiếp tục thử selector khác */ }
    }
    // Fallback: lấy text toàn sidebar và trả về
    return this.getSidebarText();
  }

  async getSidebarInitPrice(): Promise<string> {
    // "Tổng tiền" là dòng đầu của sidebar
    const rows = await this.page.locator(
      '.gio-hang-sidebar td, [class*="sidebar"] td, div:has(button:has-text("THANH TOÁN")) tr'
    ).all();
    for (const row of rows) {
      const text = ((await row.textContent()) ?? '').trim();
      if (text.match(/\d/) && text.includes('VND')) return text;
    }
    return this.getSidebarText();
  }

  async getSidebarReducedPrice(): Promise<string> {
    const el = this.page.locator('.reduced-price, [class*="reduced"], [class*="giam"]').first();
    if ((await el.count()) > 0) {
      return ((await el.textContent()) ?? '').trim();
    }
    return '';
  }

  /** Click THANH TOÁN trong sidebar → scroll xuống section SĐT (chỉ khi đã đăng nhập) */
  async clickSidebarThanhToan(): Promise<this> {
    const btn = this.page.locator(PaymentPage.CONFIRM_PAY_BTN).first();
    if ((await btn.count()) > 0) {
      await btn.waitFor({ state: 'visible', timeout: 20_000 });
      await this.jsClick(btn);
    }
    // Chờ section SĐT (chỉ xuất hiện khi đã đăng nhập)
    await this.page
      .waitForSelector(PaymentPage.PHONE_INPUT, { timeout: 20_000 })
      .catch(() => {});
    return this;
  }

  // ── Nhập SĐT / PTTT ──────────────────────────────────────────────────────

  async enterPhoneNumber(phone: string): Promise<this> {
    const input = this.page.locator(PaymentPage.PHONE_INPUT).first();
    await input.waitFor({ state: 'visible', timeout: 20_000 });
    await input.fill(phone);
    return this;
  }

  async getVisiblePaymentMethods(): Promise<{
    bank: boolean; vnpay: boolean; visa: boolean; momo: boolean;
  }> {
    return {
      bank:  (await this.page.locator(PaymentPage.PAYMENT_BANK).count())  > 0,
      vnpay: (await this.page.locator(PaymentPage.PAYMENT_VNPAY).count()) > 0,
      visa:  (await this.page.locator(PaymentPage.PAYMENT_VISA).count())  > 0,
      momo:  (await this.page.locator(PaymentPage.PAYMENT_MOMO).count())  > 0,
    };
  }

  /** Kiểm tra đã đăng nhập chưa (dựa vào URL không chứa dangnhap) */
  isLoggedIn(): boolean {
    return !this.getCurrentUrl().includes('dangnhap') &&
           !this.getCurrentUrl().includes('login');
  }
}