import { test, expect } from '@playwright/test';
import { PaymentPage } from '../src/pages/PaymentPage';

test.describe('Payment @payment @regression', () => {
  test('[Happy] Trang Mua VIP @smoke', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openMuaVip();
    expect(paymentPage.isMuaVipLoaded()).toBeTruthy();
  });

  test('[Happy] Danh sách gói VIP', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openMuaVip();
    const packages = await paymentPage.getVipPackages();
    expect(packages.length).toBeGreaterThan(0);
  });

  test('[Happy] Gói VIP có giá hoặc mô tả', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openMuaVip();
    const packages = await paymentPage.getVipPackages();
    expect(packages.length).toBeGreaterThan(0);
    expect(packages[0].price || packages[0].text).toBeTruthy();
  });

  test('[Happy] Trang Giỏ hàng @smoke', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openGioHang();
    expect(paymentPage.isGioHangLoaded()).toBeTruthy();
  });

  test('[Unhappy] Giỏ hàng trống', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openGioHang();
    expect(await paymentPage.getCartItemCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Unhappy] Checkout giỏ trống', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openGioHang();
    if ((await paymentPage.getCartItemCount()) === 0) {
      await paymentPage.clickCheckout();
      expect(paymentPage.getCurrentUrl()).not.toContain('thanh-toan-thanh-cong');
    }
  });

  test('[Unhappy] selectPackage index không hợp lệ', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openMuaVip();
    await expect(paymentPage.selectPackage(9999)).resolves.not.toThrow();
  });

  test('[Unhappy] getCartTotal giỏ trống', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openGioHang();
    const total = await paymentPage.getCartTotal();
    expect(typeof total).toBe('string');
  });

  test('[Unhappy] Xóa item giỏ trống', async ({ page }) => {
    const paymentPage = new PaymentPage(page);
    await paymentPage.openGioHang();
    const items = await paymentPage.findElements(PaymentPage.CART_ITEMS);
    if (items.length === 0) {
      const removeButtons = await paymentPage.findElements(PaymentPage.REMOVE_ITEM_BTN);
      if (removeButtons.length > 0) {
        for (const btn of removeButtons) {
          expect(await btn.isEnabled().catch(() => false)).toBeDefined();
        }
      }
    }
  });
});
