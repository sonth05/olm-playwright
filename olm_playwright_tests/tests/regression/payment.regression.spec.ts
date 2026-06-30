import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { PaymentPage } from '../../pages/PaymentPage';

/**
 * Regression tests cho trang /gio-hang (OLM 2026).
 *
 * Luồng thực tế:
 *  0. Mở /gio-hang → click "Đăng ký" chọn loại tài khoản nếu cần
 *  1. Chọn thời gian (plan button)
 *  2. Chọn gói → click "Đăng ký" → sidebar "Giá trị đơn hàng" xuất hiện
 *  3. Click "Thanh toán" → section SĐT + PTTT hiện (chỉ khi đã đăng nhập)
 *  4. Chọn PTTT → redirect cổng thanh toán (không test)
 *
 * Tất cả test dùng authenticatedPage (storageState từ worker-N.json).
 *
 * ─── Ghi chú DOM quan trọng ───────────────────────────────────────────────
 * • Nút TT trong sidebar: button.confirm-pay (text DOM = "Thanh toán", CSS = THANH TOÁN)
 * • .final-price / .init-price / .reduced-price chỉ chứa SỐ (không có "VND")
 * • .price-package (trong card) chứa đầy đủ "1,400,000 VND"
 * • PTTT dùng data-type: transfer | vn-pay | bank | momo
 */
test.describe('Payment @payment @regression', () => {

  // ── GROUP 1: Load trang ───────────────────────────────────────────────────

  test.describe('Load trang /gio-hang', () => {

    test('[Happy] Trang gio-hang load được sau khi login', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
      expect(authenticatedPage.url()).not.toContain('dangnhap');
    });

    test('[Happy] Section chọn thời gian (#box-select-plan) hiển thị', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      await expect(authenticatedPage.locator(PaymentPage.BOX_SELECT_PLAN))
        .toBeVisible({ timeout: 20_000 });
    });

    test('[Happy] Section chọn gói VIP (#box-info-package) hiển thị', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      await expect(authenticatedPage.locator(PaymentPage.BOX_INFO_PACKAGE))
        .toBeVisible({ timeout: 20_000 });
    });

    test('[Unhappy] Gio-hang không redirect về trang login', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      expect(authenticatedPage.url()).not.toContain('dangnhap');
      expect(authenticatedPage.url()).not.toContain('login');
    });

  });

  // ── GROUP 2: Chọn thời gian ───────────────────────────────────────────────

  test.describe('Chọn thời gian (plan)', () => {

    test('[Happy] Hiển thị đủ tối thiểu 5 lựa chọn thời gian', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      const plans = await pp.getPlanLabels();
      expect(plans.length).toBeGreaterThanOrEqual(5);
    });

    test('[Happy] Danh sách plan chứa "1 năm" và "1 tháng"', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      const plans = await pp.getPlanLabels();
      expect(plans.some(p => p.includes('1 năm'))).toBe(true);
      expect(plans.some(p => p.includes('1 tháng'))).toBe(true);
    });

    test('[Happy] Plan mặc định là "1 năm" (data-plan="1-y")', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      expect(await pp.getActivePlan()).toBe('1-y');
    });

    test('[Happy] Chọn plan "6 tháng" → active đúng', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      await pp.selectPlan('6-m');
      expect(await pp.getActivePlan()).toBe('6-m');
    });

    test('[Happy] Chọn plan "1 tháng" → active đúng', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      await pp.selectPlan('1-m');
      expect(await pp.getActivePlan()).toBe('1-m');
    });

    test('[Happy] Chọn plan "2 năm" → active đúng', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      await pp.selectPlan('2-y');
      expect(await pp.getActivePlan()).toBe('2-y');
    });

    test('[Happy] Đổi plan "6 tháng" → giá gói exam thay đổi so với "1 năm"', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // Lấy giá lúc plan 1 năm (mặc định)
      const before = await pp.getVipPackages();
      const price1Y = before.find(p => p.typeVip === 'exam')?.price ?? '';

      // Chuyển sang 6 tháng
      await pp.selectPlan('6-m');

      const after = await pp.getVipPackages();
      const price6M = after.find(p => p.typeVip === 'exam')?.price ?? '';

      expect(price6M).toBeTruthy();
      // Giá 6 tháng phải khác 1 năm
      expect(PaymentPage.parsePrice(price6M)).not.toBe(PaymentPage.parsePrice(price1Y));
    });

    test('[Happy] Chọn plan "Trọn đời" (12-y) → active đúng', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      await pp.selectPlan('12-y');
      expect(await pp.getActivePlan()).toBe('12-y');
    });

    test('[Unhappy] data-plan không tồn tại ("99-y") → page không crash', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // Click button không tồn tại → nên không tìm thấy, không throw crash
      await authenticatedPage
        .locator('button.select-plan-vip-trigger[data-plan="99-y"]')
        .click({ timeout: 4_000 })
        .catch(() => { /* expected: element not found */ });

      // Trang vẫn phải ở /gio-hang và không crash
      expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
    });

  });

  // ── GROUP 3: Gói VIP ──────────────────────────────────────────────────────

  test.describe('Gói VIP (package cards)', () => {

    test('[Happy] Hiển thị đủ 3 gói VIP: vip, subject, exam', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      const packages = await pp.getVipPackages();
      expect(packages.length).toBeGreaterThanOrEqual(3);

      const types = packages.map(p => p.typeVip);
      expect(types).toContain('vip');
      expect(types).toContain('subject');
      expect(types).toContain('exam');
    });

    test('[Happy] Mỗi gói VIP có giá hiển thị (chứa số và VND)', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      const packages = await pp.getVipPackages();
      for (const pkg of packages) {
        // .price-package text đầy đủ bao gồm số và "VND"
        expect(pkg.price).toMatch(/\d/);
        expect(pkg.price).toMatch(/VND/i);
      }
    });

    test('[Happy] Gói VIP (all) có giá cao hơn gói Đề thi', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      const packages = await pp.getVipPackages();
      const vipPkg  = packages.find(p => p.typeVip === 'vip');
      const examPkg = packages.find(p => p.typeVip === 'exam');

      expect(vipPkg).toBeDefined();
      expect(examPkg).toBeDefined();

      const vipPrice  = PaymentPage.parsePrice(vipPkg!.price);
      const examPrice = PaymentPage.parsePrice(examPkg!.price);

      // Gói VIP đầy đủ luôn đắt hơn hoặc bằng gói chỉ Đề thi
      expect(vipPrice).toBeGreaterThanOrEqual(examPrice);
    });

    test('[Happy] Mỗi gói VIP có nút "Đăng ký" riêng', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // 3 nút: data-type = vip, subject, exam
      for (const dataType of ['vip', 'subject', 'exam']) {
        await expect(
          authenticatedPage.locator(`button.register-package-trigger[data-type="${dataType}"]`).first()
        ).toBeVisible({ timeout: 10_000 });
      }
    });

    test('[Unhappy] data-type không hợp lệ → không throw, page không crash', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      const btn = authenticatedPage.locator('button.register-package-trigger[data-type="invalid"]');
      if ((await btn.count()) > 0) {
        await btn.first().click();
      }
      // Trang vẫn ổn định
      expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
    });

  });

  // ── GROUP 4: Sidebar "Giá trị đơn hàng" ──────────────────────────────────

  test.describe('Sidebar "Giá trị đơn hàng"', () => {

    test('[Happy] Click Đăng ký gói Đề thi → sidebar hiển thị', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();
      await pp.clickRegisterPackage('exam');

      await expect(
        authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
      ).toBeVisible({ timeout: 20_000 });
    });

    test('[Happy] Click Đăng ký gói VIP all → sidebar hiển thị', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();
      await pp.clickRegisterPackage('vip');

      await expect(
        authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
      ).toBeVisible({ timeout: 20_000 });
    });

    test('[Happy] Sidebar: text toàn sidebar chứa "VND"', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();
      await pp.clickRegisterPackage('exam');

      const sidebarText = await pp.getSidebarText();
      expect(sidebarText).toMatch(/VND/);
    });

    test('[Happy] Sidebar: span.final-price chứa số (chỉ số, không có VND)', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();
      await pp.clickRegisterPackage('exam');

      await authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
        .waitFor({ state: 'visible', timeout: 20_000 });

      const finalPrice = await pp.getSidebarFinalPrice();
      // final-price chỉ chứa số (ví dụ "800,000"), KHÔNG phải "800,000 VND"
      expect(finalPrice).toMatch(/\d{3}/);
      // KHÔNG chứa "VND" vì VND là text node tách biệt
      expect(finalPrice).not.toMatch(/VND/i);
    });

    test('[Happy] Sidebar: span.init-price chứa số', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();
      await pp.clickRegisterPackage('exam');

      await authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
        .waitFor({ state: 'visible', timeout: 20_000 });

      const initPrice = await pp.getSidebarInitPrice();
      expect(initPrice).toMatch(/\d{3}/);
    });

    test('[Happy] Sidebar: final-price bằng init-price khi không có giảm giá', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();
      await pp.clickRegisterPackage('exam');

      await authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
        .waitFor({ state: 'visible', timeout: 20_000 });

      const finalPrice   = await pp.getSidebarFinalPrice();
      const initPrice    = await pp.getSidebarInitPrice();
      const reducedPrice = await pp.getSidebarReducedPrice();

      // Khi reduced = 0, final phải = init
      if (reducedPrice === '0') {
        expect(PaymentPage.parsePrice(finalPrice))
          .toBe(PaymentPage.parsePrice(initPrice));
      }
    });

    test('[Happy] Sidebar: final-price của gói exam khớp giá trong card', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // Lấy giá từ card trước
      const packages  = await pp.getVipPackages();
      const examInCard = packages.find(p => p.typeVip === 'exam')?.price ?? '';
      expect(examInCard).toMatch(/\d/);

      // Click đăng ký
      await pp.clickRegisterPackage('exam');
      await authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
        .waitFor({ state: 'visible', timeout: 20_000 });

      // So sánh số: .price-package có "VND", .final-price chỉ có số
      const finalPrice   = await pp.getSidebarFinalPrice();
      const numInCard    = PaymentPage.parsePrice(examInCard);
      const numSidebar   = PaymentPage.parsePrice(finalPrice);
      expect(numSidebar).toBe(numInCard);
    });

    test('[Happy] Đổi plan 1m → Đăng ký → sidebar giá khác plan 1y', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // Gói exam plan 1 năm (mặc định)
      await pp.clickRegisterPackage('exam');
      await authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
        .waitFor({ state: 'visible', timeout: 20_000 });
      const final1Y = await pp.getSidebarFinalPrice();

      // Chuyển sang 1 tháng, đăng ký lại
      await pp.selectPlan('1-m');
      await pp.clickRegisterPackage('exam');
      await authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
        .waitFor({ state: 'visible', timeout: 20_000 });
      const final1M = await pp.getSidebarFinalPrice();

      // Sidebar vẫn hiển thị (không crash)
      expect(await pp.isSidebarVisible()).toBe(true);

      // Giá 1 tháng nhỏ hơn 1 năm
      const price1Y = PaymentPage.parsePrice(final1Y);
      const price1M = PaymentPage.parsePrice(final1M);
      if (price1Y > 0 && price1M > 0) {
        expect(price1M).toBeLessThan(price1Y);
      }
    });

    test('[Unhappy] getSidebarFinalPrice trả về string dù chưa chọn gói', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // Chưa click Đăng ký → sidebar chưa có → fallback trả về ''
      const price = await pp.getSidebarFinalPrice();
      expect(typeof price).toBe('string');
    });

    test('[Unhappy] Thanh toán không navigate sang trang success khi bỏ qua chọn gói', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      // Click Thanh toán mà không click Đăng ký gói trước
      await pp.clickSidebarThanhToan();
      await authenticatedPage.waitForTimeout(1_000);

      expect(authenticatedPage.url()).not.toContain('thanh-toan-thanh-cong');
    });

  });

  // ── GROUP 5: Luồng THANH TOÁN → nhập SĐT ────────────────────────────────
  // ⚠️  Chỉ hoạt động khi authenticatedPage có session hợp lệ + đã đăng nhập.

  test.describe('Luồng Thanh toán & nhập SĐT', () => {

    test('[Happy] Click Thanh toán → section SĐT (#box-select-method-pay) hiển thị', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toBeVisible({ timeout: 20_000 });
    });

    test('[Happy] Section PTTT hiển thị sau click Thanh toán', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toBeVisible({ timeout: 20_000 });

      expect(await pp.isPaymentMethodSectionVisible()).toBe(true);
    });

    test('[Happy] Hiển thị đủ 4 PTTT với đúng data-type', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toBeVisible({ timeout: 20_000 });

      // Dùng data-type để bắt chính xác, không phụ thuộc text
      await expect(authenticatedPage.locator(PaymentPage.PAYMENT_BANK).first())
        .toBeVisible({ timeout: 15_000 });
      await expect(authenticatedPage.locator(PaymentPage.PAYMENT_VNPAY).first())
        .toBeVisible({ timeout: 15_000 });
      await expect(authenticatedPage.locator(PaymentPage.PAYMENT_VISA).first())
        .toBeVisible({ timeout: 15_000 });
      await expect(authenticatedPage.locator(PaymentPage.PAYMENT_MOMO).first())
        .toBeVisible({ timeout: 15_000 });
    });

    test('[Happy] getVisiblePaymentMethods trả về đủ 4 PTTT = true', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toBeVisible({ timeout: 20_000 });

      const methods = await pp.getVisiblePaymentMethods();
      expect(methods.bank).toBe(true);
      expect(methods.vnpay).toBe(true);
      expect(methods.visa).toBe(true);
      expect(methods.momo).toBe(true);
    });

    test('[Happy] PTTT "Nộp tiền vào ngân hàng" có data-type="transfer"', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toBeVisible({ timeout: 20_000 });

      // Kiểm tra data-type attribute cụ thể
      const el = authenticatedPage.locator(PaymentPage.PAYMENT_BANK).first();
      await expect(el).toBeVisible({ timeout: 10_000 });
      expect(await el.getAttribute('data-type')).toBe('transfer');
    });

    test('[Happy] Nhập SĐT hợp lệ → input nhận đúng giá trị', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await pp.enterPhoneNumber('0901234567');
      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toHaveValue('0901234567');
    });

    test('[Happy] SĐT 10 số được nhận → không bị trim hay format', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await pp.enterPhoneNumber('0987654321');
      const input = authenticatedPage.locator(PaymentPage.PHONE_INPUT).first();
      const value = await input.inputValue();
      expect(value).toBe('0987654321');
    });

    test('[Unhappy] Không nhập SĐT → chưa thể tiếp tục (button disabled hoặc không redirect)', async ({ authenticatedPage }) => {
      const pp = new PaymentPage(authenticatedPage);
      await pp.openGioHang();

      if (!pp.isLoggedIn()) { test.skip(); return; }

      await pp.clickRegisterPackage('exam');
      await pp.clickSidebarThanhToan();

      await expect(
        authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
      ).toBeVisible({ timeout: 20_000 });

      // Không nhập SĐT, kiểm tra không bị redirect sang cổng thanh toán
      await authenticatedPage.waitForTimeout(1_000);
      expect(authenticatedPage.url()).not.toContain('vnpay');
      expect(authenticatedPage.url()).not.toContain('momo');
      expect(authenticatedPage.url()).not.toContain('checkout');
    });

  });

  // ── GROUP 6: parsePrice utility ───────────────────────────────────────────

  test.describe('Utility: PaymentPage.parsePrice', () => {

    test('[Happy] parsePrice("1,400,000 VND") trả về 1400000', () => {
      expect(PaymentPage.parsePrice('1,400,000 VND')).toBe(1_400_000);
    });

    test('[Happy] parsePrice("800,000") trả về 800000', () => {
      expect(PaymentPage.parsePrice('800,000')).toBe(800_000);
    });

    test('[Happy] parsePrice("0") trả về 0', () => {
      expect(PaymentPage.parsePrice('0')).toBe(0);
    });

    test('[Unhappy] parsePrice chuỗi rỗng trả về 0 (không throw)', () => {
      expect(PaymentPage.parsePrice('')).toBe(0);
    });

  });

});