import { test, expect } from '@playwright/test';
import { PaymentPage } from '../../pages/PaymentPage';

test.describe('Payment @payment @smoke', () => {
  test('[Happy] Trang Mua VIP @smoke', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openMuaVip();
    expect(paymentPage.isMuaVipLoaded()).toBeTruthy();
  });

  test('[Happy] Trang Giỏ hàng @smoke', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openGioHang();
    expect(paymentPage.isGioHangLoaded()).toBeTruthy();
  });
});
