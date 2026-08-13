import { GIO_HANG_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';

/**
 * Luồng thực tế OLM /gio-hang (2026):
 *
 *  Bước 0: Mở /gio-hang
 *  Bước 1 (nếu cần): Trang hiện #box-select-target → click card "Học sinh"
 *                    (.select-target-vip-trigger[data-id-target="student"] button.btn)
 *                    → trang reload, hiện section chọn thời gian + gói VIP
 *  Bước 2: Chọn thời gian (button.select-plan-vip-trigger[data-plan="..."])
 *  Bước 3: Chọn gói VIP → click "Đăng ký" (button.register-package-trigger[data-type="..."])
 *           → #box-info-package ẩn đi (display:none), sidebar .shopping-cart-value
 *             VÀ section #box-select-method-pay (SĐT + PTTT) xuất hiện NGAY LẬP TỨC
 *             cùng lúc — KHÔNG cần click "Thanh toán" trước.
 *  Bước 4: (chỉ để tham khảo) Nút "Thanh toán" (button.confirm-pay) mặc định
 *           bị `disabled` — chỉ được bật khi đã nhập SĐT hợp lệ. Vì vậy click
 *           vào nó lúc đang disabled KHÔNG có tác dụng gì (browser chặn sự
 *           kiện click trên input/button disabled), không thể dùng để "mở"
 *           section SĐT như trước đây.
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
 *       <button class="... confirm-pay" disabled>Thanh toán</button>
 *     </div>
 *   </div>
 *
 * Lưu ý: .init-price / .final-price / .reduced-price chỉ chứa số ("1,400,000"),
 *         text "VND" là text node tách biệt — KHÔNG nằm trong span.
 *
 * Nút THANH TOÁN: text DOM là "Thanh toán" (CSS text-transform: uppercase tạo hiệu ứng in hoa),
 *                 class xác định: confirm-pay
 *                 MẶC ĐỊNH bị disabled cho tới khi nhập SĐT hợp lệ (xác nhận
 *                 từ DOM thực tế 2026: `disabled=""` ngay sau khi đăng ký gói).
 *
 * Section #box-select-method-pay (SĐT + PTTT):
 *   Xuất hiện NGAY sau khi click "Đăng ký" gói VIP (cùng lúc với sidebar),
 *   KHÔNG cần thao tác nào thêm. Input SĐT có thể đã có giá trị pre-fill
 *   sẵn từ phiên trước đó của user.
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
   * Lưu ý QUAN TRỌNG (2026): nút này mặc định `disabled` cho tới khi nhập
   * SĐT hợp lệ — click vào lúc disabled KHÔNG có tác dụng gì.
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
   * CÓ THỂ đã có value pre-fill sẵn (từ phiên trước của user).
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

  // ── An toàn: chặn điều hướng ra cổng thanh toán thật ─────────────────────

  /**
   * Danh sách domain cổng thanh toán bên ngoài OLM.
   * KHÔNG bao giờ để test thật sự điều hướng tới các domain này — vì
   * button.confirm-pay / .method-pay có thể submit GIAO DỊCH THẬT (đã xác
   * nhận qua thực tế: khi SĐT đã có sẵn giá trị hợp lệ từ phiên trước, click
   * "Thanh toán" điều hướng thẳng sang pay.vnpay.vn / payment.momo.vn /
   * portal.vtcpay.vn — có thể khiến trang bị đóng bởi popup/redirect của
   * bên thứ 3, làm crash page cho toàn bộ các test chạy sau trong cùng worker).
   */
  private static readonly PAYMENT_GATEWAY_DOMAINS = [
    'vnpay.vn',
    'momo.vn',
    'vtcpay.vn',
  ];

  private _gatewayBlockRegistered = false;

  /**
   * Đăng ký chặn (abort) mọi request điều hướng sang domain cổng thanh toán
   * ngoài, và tự đóng ngay bất kỳ tab/popup mới nào được mở (một số cổng
   * thanh toán dùng target="_blank"/window.open thay vì điều hướng cùng tab).
   *
   * Idempotent — gọi nhiều lần chỉ đăng ký handler một lần cho page hiện tại.
   */
  private async _blockExternalPaymentGateways(): Promise<void> {
    if (this._gatewayBlockRegistered) return;
    this._gatewayBlockRegistered = true;

    await this.page.route('**/*', (route) => {
      const url = route.request().url();
      const isGateway = PaymentPage.PAYMENT_GATEWAY_DOMAINS.some((d) => url.includes(d));
      if (isGateway) {
        return route.abort();
      }
      return route.continue();
    });

    // Một số cổng thanh toán mở tab/popup mới (window.open) thay vì điều
    // hướng cùng tab — đóng ngay các tab đó để không ảnh hưởng tới page
    // chính đang được test sử dụng.
    this.page.context().on('page', (newPage) => {
      if (newPage === this.page) return;
      newPage.close().catch(() => {});
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Mở /gio-hang.
   * Nếu trang hiện #box-select-target (chọn loại tài khoản), tự click
   * card "Học sinh" (hoặc card đầu tiên nếu Học sinh không có).
   *
   * Tự động đăng ký chặn điều hướng ra cổng thanh toán ngoài (xem
   * _blockExternalPaymentGateways()) để đảm bảo an toàn — không bao giờ
   * thực hiện giao dịch thật trong lúc chạy test tự động.
   *
   * @param autoSelectAccountType true = tự chọn Học sinh nếu cần (mặc định)
   */
  async openGioHang(autoSelectAccountType = true): Promise<this> {
    await this._blockExternalPaymentGateways();

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
   * Click nút "Đăng ký" của một gói VIP → sidebar "Giá trị đơn hàng"
   * xuất hiện bên phải, nút "Thanh toán" (confirm-pay) hiển thị và ĐANG
   * ENABLED ở bước này (chưa bị khoá).
   *
   * LƯU Ý: section SĐT + PTTT (#box-select-method-pay) CHƯA hiện ra ngay
   * lúc này — nó chỉ được JS hiển thị SAU KHI người dùng click vào nút
   * "Thanh toán" (xem clickSidebarThanhToan()). Xác nhận từ DOM thực tế:
   * input[name="phone"] tồn tại sẵn trong DOM nhưng bị CSS ẩn
   * (visible: hidden) cho tới khi click confirm-pay lần đầu — lúc đó JS
   * mới hiện section lên VÀ đồng thời disable confirm-pay lại để chờ
   * người dùng nhập SĐT hợp lệ.
   *
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

    // Chờ nút Thanh toán xuất hiện trong sidebar (đang enabled ở bước này)
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
   * Kiểm tra sidebar đang hiển thị (có nút Thanh toán, kể cả khi đang disabled).
   */
  async isSidebarVisible(): Promise<boolean> {
    return this.page
      .locator(PaymentPage.CONFIRM_PAY_BTN).first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /**
   * Click nút "Thanh toán" (confirm-pay) trong sidebar.
   *
   * Hành vi thực tế (xác nhận từ DOM 2026): tại thời điểm gọi hàm này —
   * ngay sau clickRegisterPackage() — confirm-pay đang ở trạng thái
   * ENABLED (chưa bị khoá). Click vào nó lần đầu khiến JS:
   *   1. Hiện section "Bước 1: SĐT" + "Bước 2: PTTT" (#box-select-method-pay,
   *      trước đó tồn tại trong DOM nhưng bị CSS ẩn — input[name="phone"]
   *      resolved nhưng "hidden").
   *   2. Đồng thời tự set confirm-pay thành `disabled` để khoá submit cho
   *      tới khi người dùng nhập SĐT hợp lệ.
   *
   * Vì vậy PHẢI thực hiện click này để "mở khoá" section SĐT — không thể
   * bỏ qua bước này như bản sửa trước (đã gây ra lỗi input mãi mãi "hidden"
   * → timeout → cascading "Target page has been closed" ở các test sau).
   */
  async clickSidebarThanhToan(): Promise<this> {
    await this.dismissPopups();

    const btn = this.page.locator(PaymentPage.CONFIRM_PAY_BTN).first();
    if ((await btn.count()) > 0) {
      await btn.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});

      // Click bình thường trước (nút đang enabled ở bước này); nếu vì lý do
      // gì đó bị che/không nhận sự kiện thì fallback sang jsClick (force).
      let clicked = false;
      try {
        await btn.click({ timeout: 5_000 });
        clicked = true;
      } catch {
        // Nếu click fail vì page đã bị đóng (ví dụ SĐT pre-fill hợp lệ từ
        // phiên trước khiến JS tự redirect thẳng sang cổng thanh toán thật
        // và route-block không kịp chặn kiểu top-level navigation), dừng
        // ngay tại đây thay vì cố gọi jsClick trên một page đã chết — tránh
        // "Target page, context or browser has been closed" bị treo tới
        // hết 60s timeout rồi cascade lỗi sang các test chạy sau.
        if (this.page.isClosed()) return this;
      }

      if (!clicked && !this.page.isClosed()) {
        await this.jsClick(btn).catch(() => {});
      }
    }

    if (this.page.isClosed()) return this;

    // Chờ section SĐT thực sự HIỂN THỊ (không chỉ tồn tại trong DOM) —
    // đây chính là điểm khác biệt so với waitForSelector mặc định trước đó.
    // Timeout rút ngắn còn 8s: nếu page bị điều hướng ra ngoài domain OLM,
    // waitForSelector sẽ tự throw ngay (không đợi hết 20s) và catch() ở
    // dưới xử lý êm — không cần chờ lâu vì mục đích chỉ là "chờ nếu còn ở
    // trang gio-hang", không phải điều kiện bắt buộc phải có.
    await this.page
      .waitForSelector(PaymentPage.PHONE_INPUT, { state: 'visible', timeout: 8_000 })
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