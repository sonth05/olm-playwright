import { GIO_HANG_URL, MUA_VIP_URL } from '../config/config';
import { BasePage } from './BasePage';

export class PaymentPage extends BasePage {
  static readonly MUA_VIP_URL = MUA_VIP_URL;
  static readonly GIO_HANG_URL = GIO_HANG_URL;

  static readonly VIP_PACKAGES = '.vip-package, .pricing-card, .card';
  static readonly VIP_PRICE = '.price, .vip-price';
  static readonly VIP_BUY_BTN = '.btn-buy, .btn-mua, button.btn-primary';
  static readonly VIP_DURATION = '.duration, .thoi-han';
  static readonly CART_ITEMS = '.cart-item, .gio-hang-item';
  static readonly CART_TOTAL = '.cart-total, .tong-tien';
  static readonly CHECKOUT_BTN = '.btn-checkout, .btn-thanh-toan';
  static readonly REMOVE_ITEM_BTN = '.btn-remove, .btn-xoa';
  static readonly PAYMENT_METHODS = ".payment-method, input[name='payment']";
  static readonly CONFIRM_PAYMENT_BTN = '.btn-confirm, .btn-xac-nhan';

  async openMuaVip(): Promise<this> {
    await this.navigateTo(PaymentPage.MUA_VIP_URL);
    return this;
  }

  async openGioHang(): Promise<this> {
    await this.navigateTo(PaymentPage.GIO_HANG_URL);
    return this;
  }

  async getVipPackages(): Promise<Array<{ price: string; duration: string; text: string }>> {
    const packages: Array<{ price: string; duration: string; text: string }> = [];
    const cards = await this.page.locator(PaymentPage.VIP_PACKAGES).all();

    for (const card of cards) {
      try {
        let price = '';
        let duration = '';
        const priceEl = card.locator(PaymentPage.VIP_PRICE).first();
        if ((await priceEl.count()) > 0) {
          price = ((await priceEl.textContent()) ?? '').trim();
        }
        const durEl = card.locator(PaymentPage.VIP_DURATION).first();
        if ((await durEl.count()) > 0) {
          duration = ((await durEl.textContent()) ?? '').trim();
        }
        packages.push({
          price,
          duration,
          text: ((await card.textContent()) ?? '').trim().slice(0, 100),
        });
      } catch {
        // skip
      }
    }
    return packages;
  }

  async selectPackage(index = 0): Promise<this> {
    const cards = await this.page.locator(PaymentPage.VIP_PACKAGES).all();
    if (index < cards.length) {
      const btns = cards[index].locator(PaymentPage.VIP_BUY_BTN);
      if ((await btns.count()) > 0) await this.jsClick(btns.first());
    }
    return this;
  }

  async getCartItemCount(): Promise<number> {
    return this.page.locator(PaymentPage.CART_ITEMS).count();
  }

  async getCartTotal(): Promise<string> {
    const el = await this.findVisible([PaymentPage.CART_TOTAL], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async clickCheckout(): Promise<this> {
    const el = await this.findVisible([PaymentPage.CHECKOUT_BTN], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  isMuaVipLoaded(): boolean {
    return this.getCurrentUrl().includes('mua-vip');
  }

  isGioHangLoaded(): boolean {
    return this.getCurrentUrl().includes('gio-hang');
  }
}
