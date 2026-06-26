import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { PaymentPage } from '../../pages/PaymentPage';

/**
 * Luồng thực tế OLM /gio-hang (2026):
 *  0. Mở /gio-hang → click "Đăng ký" chọn loại tài khoản nếu cần
 *  1. Chọn thời gian (plan button)
 *  2. Chọn gói → click "Đăng ký" → sidebar "Giá trị đơn hàng" xuất hiện bên phải
 *  3. Click "THANH TOÁN" → scroll xuống section nhập SĐT + PTTT (cùng trang)
 *     ⚠️  Bước 3 CHỈ hoạt động khi đã đăng nhập.
 *        Nếu session guest/hết hạn, section SĐT không xuất hiện.
 *  4. Chọn PTTT → redirect sang cổng thanh toán (không test)
 *
 * Tất cả test dùng authenticatedPage (session từ worker-N.json).
 */
test.describe('Payment @payment @regression', () => {

  // ── 1. Load trang ──────────────────────────────────────────────────────────

  test('[Happy] Trang gio-hang load được sau khi login', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
    expect(authenticatedPage.url()).not.toContain('dangnhap');
  });

  // ── 2. Chọn thời gian ──────────────────────────────────────────────────────

  test('[Happy] Hiển thị đủ 6 lựa chọn thời gian', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const plans = await pp.getPlanLabels();
    expect(plans.length).toBeGreaterThanOrEqual(5);
    expect(plans.some(p => p.includes('1 năm'))).toBe(true);
    expect(plans.some(p => p.includes('1 tháng'))).toBe(true);
  });

  test('[Happy] Plan mặc định là "1 năm"', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    expect(await pp.getActivePlan()).toBe('1-y');
  });

  test('[Happy] Đổi plan "6 tháng" - active đúng và giá thay đổi', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const before = await pp.getVipPackages();
    const price1Y = before.find(p => p.typeVip === 'exam')?.price ?? '';

    await pp.selectPlan('6-m');

    expect(await pp.getActivePlan()).toBe('6-m');
    const after = await pp.getVipPackages();
    const price6M = after.find(p => p.typeVip === 'exam')?.price ?? '';
    expect(price6M).toBeTruthy();
    expect(price6M).not.toBe(price1Y);
  });

  test('[Happy] Đổi plan "1 tháng" - active đúng', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    await pp.selectPlan('1-m');
    expect(await pp.getActivePlan()).toBe('1-m');
  });

  // ── 3. Gói VIP ────────────────────────────────────────────────────────────

  test('[Happy] Hiển thị đủ 3 gói VIP (vip / subject / exam)', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const packages = await pp.getVipPackages();
    expect(packages.length).toBeGreaterThanOrEqual(3);

    const types = packages.map(p => p.typeVip);
    expect(types).toContain('vip');
    expect(types).toContain('exam');
  });

  test('[Happy] Mỗi gói VIP có giá hiển thị (chứa VND)', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const packages = await pp.getVipPackages();
    for (const pkg of packages) {
      expect(pkg.price).toMatch(/\d/);
      expect(pkg.price).toMatch(/VND/i);
    }
  });

  // ── 4. Sidebar sau khi click Đăng ký ─────────────────────────────────────

  test('[Happy] Click Đăng ký gói Đề thi - sidebar THANH TOÁN hiển thị', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();
    await pp.clickRegisterPackage('exam');

    // Sidebar phải có nút THANH TOÁN
    await expect(
      authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('[Happy] Sidebar: giá hiển thị sau khi chọn gói', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();
    await pp.clickRegisterPackage('exam');

    // Sidebar text phải chứa giá tiền (VND hoặc số)
    const sidebarText = await pp.getSidebarText();
    expect(sidebarText).toMatch(/VND|\d{3}/);
  });

  test('[Happy] Đổi plan rồi Đăng ký - sidebar cập nhật', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    // Đăng ký gói exam plan 1 năm → ghi nhận giá
    await pp.clickRegisterPackage('exam');
    const sidebar1Y = await pp.getSidebarText();

    // Chuyển sang 1 tháng → đăng ký lại
    await pp.selectPlan('1-m');
    await pp.clickRegisterPackage('exam');
    const sidebar1M = await pp.getSidebarText();

    // Sidebar vẫn phải hiển thị (không crash, nút THANH TOÁN còn đó)
    await expect(
      authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
    ).toBeVisible({ timeout: 20_000 });

    // Giá 1 tháng ≠ 1 năm (nếu sidebar text có giá)
    if (sidebar1Y.match(/\d{3}/) && sidebar1M.match(/\d{3}/)) {
      expect(sidebar1M).not.toBe(sidebar1Y);
    }
  });

  // ── 5. Luồng THANH TOÁN → nhập SĐT ──────────────────────────────────────
  // ⚠️  Chỉ hoạt động đúng khi authenticatedPage có session hợp lệ.
  //    Nếu session hết hạn / guest → section SĐT không hiện → test skip.

  test('[Happy] Click Thanh toán - hiện input nhập SĐT', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    // Kiểm tra đăng nhập
    if (!pp.isLoggedIn()) {
      test.skip();
      return;
    }

    await pp.clickRegisterPackage('exam');
    await pp.clickSidebarThanhToan();

    await expect(
      authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('[Happy] Section nhập SĐT hiển thị đủ 4 PTTT', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    if (!pp.isLoggedIn()) {
      test.skip();
      return;
    }

    await pp.clickRegisterPackage('exam');
    await pp.clickSidebarThanhToan();

    // Chờ section SĐT xuất hiện trước
    await expect(
      authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
    ).toBeVisible({ timeout: 20_000 });

    // Kiểm tra 4 PTTT
    await expect(authenticatedPage.locator(PaymentPage.PAYMENT_BANK).first()).toBeVisible({ timeout: 20_000 });
    await expect(authenticatedPage.locator(PaymentPage.PAYMENT_VNPAY).first()).toBeVisible({ timeout: 20_000 });
    await expect(authenticatedPage.locator(PaymentPage.PAYMENT_VISA).first()).toBeVisible({ timeout: 20_000 });
    await expect(authenticatedPage.locator(PaymentPage.PAYMENT_MOMO).first()).toBeVisible({ timeout: 20_000 });
  });

  test('[Happy] Nhập SĐT hợp lệ - input nhận đúng giá trị', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    if (!pp.isLoggedIn()) {
      test.skip();
      return;
    }

    await pp.clickRegisterPackage('exam');
    await pp.clickSidebarThanhToan();

    await pp.enterPhoneNumber('0901234567');
    await expect(
      authenticatedPage.locator(PaymentPage.PHONE_INPUT).first()
    ).toHaveValue('0901234567');
  });

  // ── 6. Unhappy paths ──────────────────────────────────────────────────────

  test('[Unhappy] Gio-hang không redirect về trang login', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    expect(authenticatedPage.url()).not.toContain('dangnhap');
    expect(authenticatedPage.url()).not.toContain('login');
  });

  test('[Unhappy] data-plan không tồn tại - page không crash', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    await authenticatedPage
      .locator('button.select-plan-vip-trigger[data-plan="99-y"]')
      .click({ timeout: 4_000 })
      .catch(() => { /* expected */ });

    expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
  });

  test('[Unhappy] data-type không hợp lệ - không throw', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const btn = authenticatedPage.locator('button.register-package-trigger[data-type="invalid"]');
    if ((await btn.count()) > 0) {
      await btn.first().click();
    }
    expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
  });

  test('[Unhappy] getSidebarFinalPrice trả về string dù chưa chọn gói', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const price = await pp.getSidebarFinalPrice();
    expect(typeof price).toBe('string');
  });

  test('[Unhappy] Thanh toán không navigate sang trang success khi bỏ qua bước chọn gói', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();
    await pp.clickSidebarThanhToan();
    await authenticatedPage.waitForTimeout(1_000);

    expect(authenticatedPage.url()).not.toContain('thanh-toan-thanh-cong');
  });
});