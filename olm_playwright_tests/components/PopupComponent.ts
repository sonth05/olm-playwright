import type { Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

/** Component tái sử dụng – popup/modal VIP */
export class PopupComponent extends BasePage {
  static readonly POPUP = '.modal.show, .popup-vip, .modal-dialog';
  static readonly CLOSE_BTN = '.modal .close, .modal .btn-close, button[aria-label="Close"]';

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
}
