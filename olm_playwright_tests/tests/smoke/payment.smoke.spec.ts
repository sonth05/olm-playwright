import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { PaymentPage } from '../../pages/PaymentPage';

test.describe('Payment @payment @smoke', () => {

  /**
   * Lưu ý: OLM redirect /mua-vip → /gio-hang nếu account đã có VIP.
   * Test chỉ kiểm tra page load được (không bị redirect về login),
   * không assert URL cụ thể vì phụ thuộc vào trạng thái VIP của account.
   */
  test('[Happy] Trang Mua VIP @smoke', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openMuaVip();

    const url = authenticatedPage.url();

    // Không bị redirect về trang login
    expect(url).not.toContain('dangnhap');

    // URL phải là mua-vip HOẶC gio-hang (redirect khi đã có VIP)
    const isVipPage    = url.includes('mua-vip');
    const isCartPage   = url.includes('gio-hang');
    expect(isVipPage || isCartPage).toBe(true);
  });

  test('[Happy] Trang Giỏ hàng @smoke', async ({ authenticatedPage }) => {
    const pp = new PaymentPage(authenticatedPage);
    await pp.openGioHang();

    expect(authenticatedPage.url()).toContain('gio-hang');
    expect(authenticatedPage.url()).not.toContain('dangnhap');
  });

});