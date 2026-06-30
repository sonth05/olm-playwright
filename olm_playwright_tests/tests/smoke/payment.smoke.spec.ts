import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { PaymentPage } from '../../pages/PaymentPage';

/**
 * Smoke tests cho trang Payment (/gio-hang).
 *
 * Mục đích: kiểm tra nhanh rằng trang load được và các section cốt lõi
 * hiển thị đúng — không đi sâu vào từng luồng (đó là việc của regression).
 *
 * Lưu ý: OLM có thể redirect /mua-vip → /gio-hang nếu account đã có VIP.
 */
test.describe('Payment @payment @smoke', () => {

  test('[Happy] Trang Mua VIP load được, không redirect về login', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openMuaVip();

    const url = authenticatedPage.url();

    // Không bị redirect về trang login
    expect(url).not.toContain('dangnhap');

    // URL phải là mua-vip HOẶC gio-hang (redirect khi đã có VIP)
    const isVipPage  = url.includes('mua-vip');
    const isCartPage = url.includes('gio-hang');
    expect(isVipPage || isCartPage).toBe(true);
  });

  test('[Happy] Trang Giỏ hàng (/gio-hang) load được', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    expect(authenticatedPage.url()).toContain('gio-hang');
    expect(authenticatedPage.url()).not.toContain('dangnhap');
  });

  test('[Happy] Section chọn thời gian hiển thị', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    await expect(authenticatedPage.locator(PaymentPage.PLAN_BTN).first())
      .toBeVisible({ timeout: 15_000 });
  });

  test('[Happy] Ít nhất 3 gói VIP có giá hiển thị', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    const packages = await pp.getVipPackages();
    expect(packages.length).toBeGreaterThanOrEqual(3);
    // Mỗi gói có giá > 0
    for (const pkg of packages) {
      expect(PaymentPage.parsePrice(pkg.price)).toBeGreaterThan(0);
    }
  });

  test('[Happy] Nút "Đăng ký" gói exam click được → sidebar Thanh toán hiển thị', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();
    await pp.clickRegisterPackage('exam');

    await expect(
      authenticatedPage.locator(PaymentPage.CONFIRM_PAY_BTN).first()
    ).toBeVisible({ timeout: 15_000 });
  });

});