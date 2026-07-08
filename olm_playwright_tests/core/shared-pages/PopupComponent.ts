import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Component tái sử dụng – popup/modal/overlay */
export class PopupComponent extends BasePage {
  static readonly POPUP     = '.modal.show, .popup-vip, .modal-dialog';
  static readonly CLOSE_BTN = '.modal .close, .modal .btn-close, button[aria-label="Close"]';

  // Popup "Đăng ký nhận thông báo" – id chính xác từ HTML
  static readonly NOTIFY_POPUP       = '#dialogConfirmNotification';
  static readonly NOTIFY_DISMISS_BTN = '#later-noti';

  constructor(page: Page) {
    super(page);
  }

  async closeIfPresent(timeoutSec = 3): Promise<boolean> {
    const closeBtn = await this.findVisible([PopupComponent.CLOSE_BTN], timeoutSec);
    if (closeBtn) {
      await this.jsClick(closeBtn);
      return true;
    }
    return false;
  }

  async isVisible(): Promise<boolean> {
    return (await this.findVisible([PopupComponent.POPUP], 2)) !== null;
  }

  /**
   * Dismiss tất cả popup/overlay có thể che header/nav.
   * Gọi ngay sau khi navigate, trước khi thao tác với bất kỳ element nào.
   *
   * Xử lý:
   *   1. Popup "Đăng ký nhận thông báo" (#dialogConfirmNotification) – click #later-noti
   *   2. Các modal VIP / close button thông thường
   *   3. Backdrop còn lại
   */
  async dismissAll(): Promise<void> {
    // 1. Popup thông báo – dùng đúng id từ HTML
    try {
      const notifyPopup = this.page.locator(PopupComponent.NOTIFY_POPUP).first();
      if (await notifyPopup.isVisible({ timeout: 6_000 })) {
        const dismissBtn = this.page.locator(PopupComponent.NOTIFY_DISMISS_BTN).first();
        await dismissBtn.click({ timeout: 6_000 });
        await this.page.waitForTimeout(400);
      }
    } catch {
      // popup không xuất hiện, bỏ qua
    }

    // 2. Modal VIP hoặc modal thông thường có nút close
    await this.closeIfPresent(2);

    // 3. Backdrop còn sót
    try {
      const backdrop = this.page.locator('.modal-backdrop').first();
      if (await backdrop.isVisible({ timeout: 2_000 })) {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch {
      // không có backdrop, bỏ qua
    }
  }
}