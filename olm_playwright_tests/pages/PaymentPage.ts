import { GIO_HANG_URL } from '../config/config';
import { BasePage } from './BasePage';

/**
 * Luồng thực tế OLM /gio-hang (2026):
 *
 *  Bước 0: Mở /gio-hang
 *  Bước 1 (nếu cần): Trang hiện #box-select-target → click card "Học sinh"
 *                    (.select-target-vip-trigger[data-id-target="student"] button.btn)
 *                    → trang reload, hiện section chọn thời gian + gói VIP
 *  Bước 2: Chọn thời gian (button.select-plan-vip-trigger[data-plan="..."])
 *  Bước 3: Chọn gói VIP → click "Đăng ký" (button.register-package-trigger[data-type="..."])
 *           → sidebar .shopping-cart-value / .checkout-payment xuất hiện bên phải
 *  Bước 4: Click "Thanh toán" (button.confirm-pay)
 *           → scroll xuống section nhập SĐT + PTTT (cùng trang, CHỈ khi đã đăng nhập)
 *  Bước 5: Nhập SĐT → chọn PTTT (.method-pay[data-type="..."]) → redirect cổng TT (không test)
 *
 * ─── Ghi chú DOM thực tế ─────────────────────────────────────────────────────
 *
 * Sidebar "Giá trị đơn hàng":
 *   <div class="shopping-cart-value">
 *     <div class="checkout-payment card px-3 py-4 ...">
 *       <span class="init-price mr-1">1,400,000</span> VND      ← Tổng tiền
 *       <span class="reduced-price mr-1">0</span> VND           ← Giảm
 *       <span class="final-price mr-1">1,400,000</span> VND     ← Phải TT
 *       <button class="... confirm-pay">Thanh toán</button>
 *     </div>
 *   </div>
 *
 * Lưu ý: .init-price / .final-price / .reduced-price chỉ chứa số ("1,400,000"),
 *         text "VND" là text node tách biệt — KHÔNG nằm trong span.
 *
 * Nút THANH TOÁN: text DOM là "Thanh toán" (CSS text-transform: uppercase tạo hiệu ứng in hoa),
 *                 class xác định: confirm-pay
 *
 * PTTT (phương thức thanh toán): .method-pay[data-type="transfer|vn-pay|bank|momo"]
 *   - transfer  → Nộp tiền vào tài khoản ngân hàng của OLM
 *   - vn-pay    → Ví điện tử VNPay
 *   - bank      → Internet Banking, thẻ VISA, Master Card
 *   - momo      → Ví điện tử MoMo
 *
 * data-type-vip trên .price-package: "vip" | "subject" | "exam"
 * data-type trên button.register-package-trigger: "vip" | "subject" | "exam"
 */
export class PaymentPage extends BasePage {
  static readonly GIO_HANG_URL = GIO_HANG_URL;

  // ── Chọn loại tài khoản (#box-select-target) ──────────────────────────────
  /**
   * Nút "Đăng ký" trong card Học sinh.
   * HTML: .select-target-vip-trigger[data-id-target="student"] > .card-body > ... > button.btn
   */
  static readonly ACCOUNT_TYPE_STUDENT_BTN =
    '.select-target-vip-trigger[data-id-target="student"] button.btn';

  /**
   * Fallback: nút "Đăng ký" của loại tài khoản đầu tiên bất kỳ
   * (dùng khi card Học sinh không visible).
   */
  static readonly ACCOUNT_TYPE_ANY_BTN =
    '.select-target-vip-trigger button.btn';

  // ── Chọn thời gian (#box-select-plan) ─────────────────────────────────────
  static readonly PLAN_BTN    = 'button.select-plan-vip-trigger';
  static readonly PLAN_ACTIVE = 'button.select-plan-vip-trigger.active';

  // ── Card gói VIP (#box-info-package) ──────────────────────────────────────
  /**
   * Hiển thị giá trong mỗi card gói VIP.
   * Attribute data-type-vip: "vip" | "subject" | "exam"
   * Text chứa số và "VND", ví dụ: "1,400,000 VND"
   */
  static readonly PRICE_IN_CARD = '.price-package';

  /**
   * Nút "Đăng ký" bên trong card gói VIP.
   * Attribute data-type: "vip" | "subject" | "exam"
   */
  static readonly REGISTER_PKG_BTN = 'button.register-package-trigger';

  // ── Sidebar "Giá trị đơn hàng" (.shopping-cart-value) ────────────────────
  /**
   * Container sidebar — DOM thực tế:
   *   div.shopping-cart-value > div.checkout-payment.card
   */
  static readonly SIDEBAR_CONTAINER = '.shopping-cart-value';

  /**
   * Nút Thanh toán trong sidebar.
   * Class chính xác: confirm-pay
   * Lưu ý: text DOM là "Thanh toán" (CSS tạo UPPERCASE, không phải text thật)
   */
  static readonly CONFIRM_PAY_BTN = 'button.confirm-pay';

  /**
   * Giá "Số tiền phải thanh toán" — span.final-price
   * Chỉ chứa số (ví dụ "1,400,000"), KHÔNG có "VND".
   */
  static readonly SIDEBAR_FINAL_PRICE = 'span.final-price';

  /**
   * Giá gốc "Tổng tiền" — span.init-price
   * Chỉ chứa số (ví dụ "1,400,000"), KHÔNG có "VND".
   */
  static readonly SIDEBAR_INIT_PRICE = 'span.init-price';

  /**
   * Số tiền được giảm — span.reduced-price
   * Thường là "0" khi không có khuyến mãi.
   */
  static readonly SIDEBAR_REDUCED_PRICE = 'span.reduced-price';

  // ── Section nhập SĐT + PTTT (#box-select-method-pay) ─────────────────────
  /**
   * Input số điện thoại — name="phone" (xác nhận từ HTML)
   */
  static readonly PHONE_INPUT = 'input[name="phone"]';

  /**
   * 4 phương thức thanh toán — dùng data-type để bắt chính xác,
   * không phụ thuộc vào text hiển thị (dễ thay đổi).
   */
  static readonly PAYMENT_BANK  = '.method-pay[data-type="transfer"]';
  static readonly PAYMENT_VNPAY = '.method-pay[data-type="vn-pay"]';
  static readonly PAYMENT_VISA  = '.method-pay[data-type="bank"]';
  static readonly PAYMENT_MOMO  = '.method-pay[data-type="momo"]';

  // ── Section chọn loại tài khoản (ẩn/hiện tùy trạng thái) ─────────────────
  static readonly BOX_SELECT_TARGET = '#box-select-target';
  static readonly BOX_SELECT_PLAN   = '#box-select-plan';
  static readonly BOX_INFO_PACKAGE  = '#box-info-package';
  static readonly BOX_METHOD_PAY    = '#box-select-method-pay';

  // ── Internal helpers ───────────────────────────────────────────────────────

  private async _waitForPlanSection(timeout = 30_000): Promise<void> {
    await this.page.waitForSelector(PaymentPage.PLAN_BTN, { timeout });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Mở /gio-hang.
   * Nếu trang hiện #box-select-target (chọn loại tài khoản), tự click
   * card "Học sinh" (hoặc card đầu tiên nếu Học sinh không có).
   *
   * @param autoSelectAccountType true = tự chọn Học sinh nếu cần (mặc định)
   */
  async openGioHang(autoSelectAccountType = true): Promise<this> {
    await this.navigateTo(PaymentPage.GIO_HANG_URL);
    await this.page.waitForLoadState('domcontentloaded');

    if (autoSelectAccountType) {
      const planVisible = await this.page
        .locator(PaymentPage.PLAN_BTN).first()
        .isVisible().catch(() => false);

      if (!planVisible) {
        // Ưu tiên card Học sinh; fallback sang card đầu tiên
        const studentBtn = this.page.locator(PaymentPage.ACCOUNT_TYPE_STUDENT_BTN).first();
        const anyBtn     = this.page.locator(PaymentPage.ACCOUNT_TYPE_ANY_BTN).first();
        const btn = (await studentBtn.count()) > 0 ? studentBtn : anyBtn;

        if ((await btn.count()) > 0) {
          // Dismiss popup "Xác thực" (#modal-form-active-mail) ngay trước khi
          // click — popup này hay xuất hiện có delay sau navigateTo() và
          // đứng chắn pointer events trên nút "Đăng ký" gây timeout 20s.
          await this.dismissPopups();
          await btn.waitFor({ state: 'visible', timeout: 20_000 });
          await this.jsClick(btn);
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

  // ── Chọn thời gian ─────────────────────────────────────────────────────────

  /**
   * Lấy danh sách label của tất cả plan button.
   * Ví dụ: ["Trọn đời (12 năm)", "1 năm", "2 năm", "6 tháng", "3 tháng", "1 tháng"]
   */
  async getPlanLabels(): Promise<string[]> {
    await this._waitForPlanSection();
    const btns = await this.page.locator(PaymentPage.PLAN_BTN).all();
    const labels: string[] = [];
    for (const btn of btns) {
      labels.push(((await btn.textContent()) ?? '').trim());
    }
    return labels;
  }

  /**
   * Click plan button theo data-plan.
   * @param dataPlan '12-y' | '1-y' | '2-y' | '6-m' | '3-m' | '1-m'
   */
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

  /**
   * Trả về data-plan của plan đang active.
   * Ví dụ: '1-y'
   */
  async getActivePlan(): Promise<string> {
    await this.page.waitForSelector(PaymentPage.PLAN_ACTIVE, { timeout: 20_000 });
    return (
      (await this.page.locator(PaymentPage.PLAN_ACTIVE).first().getAttribute('data-plan')) ?? ''
    );
  }

  // ── Gói VIP ────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách gói VIP đang hiển thị.
   * Mỗi phần tử: { typeVip: "vip"|"subject"|"exam", price: "1,400,000 VND" }
   * Lưu ý: price lấy từ .price-package, text đầy đủ bao gồm "VND".
   */
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
   * Click nút "Đăng ký" của một gói VIP → sidebar xuất hiện bên phải.
   * @param dataType 'vip' | 'subject' | 'exam'
   */
  async clickRegisterPackage(dataType: 'vip' | 'subject' | 'exam'): Promise<this> {
    const btn = this.page.locator(
      `button.register-package-trigger[data-type="${dataType}"]`
    );
    await btn.first().waitFor({ state: 'visible', timeout: 20_000 });
    await this.jsClick(btn.first());

    // Scroll nhẹ để sidebar vào viewport
    await this.page.waitForTimeout(600);
    await this.page.evaluate(() => window.scrollBy(0, 200));
    await this.page.waitForTimeout(400);

    // Chờ nút Thanh toán xuất hiện trong sidebar
    await this.page
      .waitForSelector(PaymentPage.CONFIRM_PAY_BTN, { timeout: 16_000 })
      .catch(() => {});
    return this;
  }

  // ── Sidebar "Giá trị đơn hàng" ────────────────────────────────────────────

  /**
   * Lấy toàn bộ text của sidebar.
   * Hữu ích để assert sidebar có hiển thị hay không (chứa "VND", "Thanh toán"...).
   */
  async getSidebarText(): Promise<string> {
    const container = this.page.locator(PaymentPage.SIDEBAR_CONTAINER).first();
    if ((await container.count()) > 0) {
      return ((await container.textContent().catch(() => '')) ?? '').trim();
    }
    return '';
  }

  /**
   * Lấy giá "Số tiền phải thanh toán" từ span.final-price.
   * Trả về dạng "1,400,000" (chỉ số, KHÔNG có "VND").
   * Fallback: trả về text toàn sidebar.
   */
  async getSidebarFinalPrice(): Promise<string> {
    const el = this.page.locator(PaymentPage.SIDEBAR_FINAL_PRICE).first();
    if ((await el.count()) > 0) {
      try {
        await el.waitFor({ state: 'visible', timeout: 5_000 });
        return ((await el.textContent()) ?? '').trim();
      } catch { /* fallback */ }
    }
    return this.getSidebarText();
  }

  /**
   * Lấy giá gốc "Tổng tiền" từ span.init-price.
   * Trả về dạng "1,400,000" (chỉ số, KHÔNG có "VND").
   */
  async getSidebarInitPrice(): Promise<string> {
    const el = this.page.locator(PaymentPage.SIDEBAR_INIT_PRICE).first();
    if ((await el.count()) > 0) {
      try {
        await el.waitFor({ state: 'visible', timeout: 5_000 });
        return ((await el.textContent()) ?? '').trim();
      } catch { /* fallback */ }
    }
    return '';
  }

  /**
   * Lấy số tiền được giảm từ span.reduced-price.
   * Trả về dạng "0" khi không có khuyến mãi.
   */
  async getSidebarReducedPrice(): Promise<string> {
    const el = this.page.locator(PaymentPage.SIDEBAR_REDUCED_PRICE).first();
    if ((await el.count()) > 0) {
      try {
        const text = ((await el.textContent()) ?? '').trim();
        return text || '0';
      } catch { /* fallback */ }
    }
    return '0';
  }

  /**
   * Kiểm tra sidebar đang hiển thị (có nút Thanh toán).
   */
  async isSidebarVisible(): Promise<boolean> {
    return this.page
      .locator(PaymentPage.CONFIRM_PAY_BTN).first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /**
   * Click nút Thanh toán trong sidebar → section SĐT scroll ra (khi đã đăng nhập).
   * Lưu ý: text DOM là "Thanh toán", CSS mới render thành "THANH TOÁN".
   */
  async clickSidebarThanhToan(): Promise<this> {
    await this.dismissPopups();
    const btn = this.page.locator(PaymentPage.CONFIRM_PAY_BTN).first();
    if ((await btn.count()) > 0) {
      await btn.waitFor({ state: 'visible', timeout: 20_000 });
      await this.jsClick(btn);
    }
    // Chờ section nhập SĐT xuất hiện (chỉ khi đã đăng nhập)
    await this.page
      .waitForSelector(PaymentPage.PHONE_INPUT, { timeout: 20_000 })
      .catch(() => {});
    return this;
  }

  // ── Section nhập SĐT / PTTT ───────────────────────────────────────────────

  async enterPhoneNumber(phone: string): Promise<this> {
    const input = this.page.locator(PaymentPage.PHONE_INPUT).first();
    await input.waitFor({ state: 'visible', timeout: 20_000 });
    await input.fill(phone);
    return this;
  }

  /**
   * Kiểm tra section PTTT (#box-select-method-pay) có hiển thị hay không.
   */
  async isPaymentMethodSectionVisible(): Promise<boolean> {
    return this.page
      .locator(PaymentPage.BOX_METHOD_PAY)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  /**
   * Kiểm tra từng PTTT có hiển thị.
   * Dùng data-type để bắt chính xác, không phụ thuộc text.
   */
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

  // ── Utility ────────────────────────────────────────────────────────────────

  /** Kiểm tra đã đăng nhập chưa (dựa vào URL không chứa dangnhap/login) */
  isLoggedIn(): boolean {
    return !this.getCurrentUrl().includes('dangnhap') &&
           !this.getCurrentUrl().includes('login');
  }

  /**
   * Chuyển đổi chuỗi giá "1,400,000" → number 1400000.
   * Dùng để so sánh giá trị số học giữa plan / package khác nhau.
   */
  static parsePrice(priceStr: string): number {
    return parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
  }
}