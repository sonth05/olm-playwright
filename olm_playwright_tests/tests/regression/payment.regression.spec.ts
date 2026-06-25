import { Page, Locator, expect } from '@playwright/test';

export class PaymentPage {
  readonly page: Page;

  // Duration tabs
  readonly durationTabs: Locator;
  readonly tronDoiTab: Locator;
  readonly motNamTab: Locator;
  readonly haiNamTab: Locator;
  readonly sauThangTab: Locator;
  readonly baThangTab: Locator;
  readonly motThangTab: Locator;

  // VIP Packages
  readonly tronGoiPackage: Locator;
  readonly theoMonPackage: Locator;
  readonly deThiPackage: Locator;
  readonly packageCards: Locator;

  // Package details
  readonly priceElements: Locator;
  readonly dangKyButtons: Locator;

  // Cart & Checkout
  readonly cartIcon: Locator;
  readonly cartItemCount: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  readonly emptyCartMessage: Locator;

  // Subject dropdown (for THEO MÔN)
  readonly subjectDropdown: Locator;

  // Role selection
  readonly roleButtons: Locator;

  // Payment methods
  readonly paymentMethods: Locator;

  constructor(page: Page) {
    this.page = page;

    // Duration tabs
    this.durationTabs = page.locator('button, [role="tab"]').filter({ hasText: /năm|tháng|Trọn đời/i });
    this.tronDoiTab = page.getByRole('tab', { name: /Trọn đời \(12 năm\)/i });
    this.motNamTab = page.getByRole('tab', { name: '1 năm' });
    this.haiNamTab = page.getByRole('tab', { name: '2 năm' });
    this.sauThangTab = page.getByRole('tab', { name: '6 tháng' });
    this.baThangTab = page.getByRole('tab', { name: '3 tháng' });
    this.motThangTab = page.getByRole('tab', { name: '1 tháng' });

    // Packages
    this.packageCards = page.locator('div').filter({ has: page.locator('h3, .package-name, [class*="TRỌN GÓI"], [class*="THEO MÔN"], [class*="ĐỀ THI"]') });
    this.tronGoiPackage = page.locator('div').filter({ hasText: /TRỌN GÓI/i }).first();
    this.theoMonPackage = page.locator('div').filter({ hasText: /THEO MÔN/i }).first();
    this.deThiPackage = page.locator('div').filter({ hasText: /ĐỀ THI/i }).first();

    this.priceElements = page.locator('.price, [class*="VND"], [class*="price"], text=/[0-9.]+(?:,[0-9]+)?\s*VND/i');
    this.dangKyButtons = page.getByRole('button', { name: /Đăng ký/i });

    // Cart
    this.cartIcon = page.locator('a[href*="gio-hang"], [class*="cart"]');
    this.cartItemCount = page.locator('[class*="cart-count"], text=/[0-9]+\s*(sản phẩm|món)/i');
    this.cartTotal = page.locator('[class*="tong-tien"], [class*="total"], text=/Tổng tiền|phải thanh toán/i');
    this.checkoutButton = page.getByRole('button', { name: /THANH TOÁN|Tiếp tục|Checkout/i });
    this.emptyCartMessage = page.getByText(/giỏ hàng trống|không có sản phẩm/i);

    // Subject selection
    this.subjectDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /Chọn môn học/i });

    // Role
    this.roleButtons = page.locator('button, a').filter({ hasText: /Học sinh|Giáo viên|Nhà trường/i });

    // Payment
    this.paymentMethods = page.locator('img[alt*="VNPay"], img[alt*="MoMo"], .payment-method');
  }

  /** Mở trang mua VIP */
  async openMuaVip() {
    await this.page.goto('https://olm.vn/gio-hang', { waitUntil: 'domcontentloaded' });
    // Hoặc click menu nếu cần
    // await this.page.getByText('Mua VIP').click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Chọn thời gian gói */
  async selectDuration(duration: string) {
    const tab = this.page.getByRole('tab', { name: new RegExp(duration, 'i') });
    await tab.click({ timeout: 10000 });
    await this.page.waitForTimeout(800); // Chờ giá cập nhật
  }

  /** Chọn gói theo tên */
  async selectPackageByName(name: 'TRỌN GÓI' | 'THEO MÔN' | 'ĐỀ THI') {
    let card: Locator;
    if (name === 'TRỌN GÓI') card = this.tronGoiPackage;
    else if (name === 'THEO MÔN') card = this.theoMonPackage;
    else card = this.deThiPackage;

    await card.scrollIntoViewIfNeeded();
    await card.click();
  }

  /** Chọn gói theo index */
  async selectPackage(index: number) {
    const cards = await this.packageCards.count();
    if (index >= cards) {
      console.warn(`Index ${index} vượt quá số gói (${cards}). Chọn gói cuối cùng.`);
      index = cards - 1;
    }
    await this.packageCards.nth(index).click();
  }

  /** Chọn môn học cho gói THEO MÔN */
  async selectSubject(subject: string) {
    await this.subjectDropdown.click();
    await this.page.getByRole('option', { name: new RegExp(subject, 'i') }).click();
  }

  /** Click nút Đăng ký */
  async clickDangKy() {
    await this.dangKyButtons.first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Mở giỏ hàng */
  async openGioHang() {
    await this.cartIcon.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Click Thanh Toán */
  async clickCheckout() {
    await this.checkoutButton.click();
  }

  /** Lấy danh sách gói VIP */
  async getVipPackages() {
    return await this.packageCards.evaluateAll((cards) => {
      return cards.map((card) => {
        const priceEl = card.querySelector('.price, [class*="VND"], strong, b') as HTMLElement;
        return {
          name: card.querySelector('h3, strong, [class*="title"]')?.textContent?.trim() || '',
          price: priceEl?.textContent?.trim() || '',
          text: card.textContent?.trim().substring(0, 150) || ''
        };
      });
    });
  }

  /** Số lượng item trong giỏ */
  async getCartItemCount(): Promise<number> {
    const countText = await this.cartItemCount.textContent();
    if (!countText) return 0;
    const match = countText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /** Tổng tiền giỏ hàng */
  async getCartTotal(): Promise<string> {
    return (await this.cartTotal.textContent())?.trim() || '0 VND';
  }

  /** Chọn vai trò (Học sinh / Giáo viên / Nhà trường) */
  async selectRole(role: 'hoc-sinh' | 'giao-vien' | 'nha-truong') {
    const roleText = {
      'hoc-sinh': 'Học sinh',
      'giao-vien': 'Giáo viên',
      'nha-truong': 'Nhà trường'
    }[role];

    await this.roleButtons.filter({ hasText: roleText }).first().click();
  }

  /** Kiểm tra có hiển thị phương thức thanh toán không */
  async isPaymentMethodVisible(): Promise<boolean> {
    return await this.paymentMethods.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  /** Kiểm tra tổng tiền bên phải */
  async getOrderTotal(): Promise<string> {
    const totalLocator = this.page.locator('text=Tổng tiền').locator('..').locator('text=/[0-9.]+/');
    return (await totalLocator.textContent())?.trim() || '';
  }
}