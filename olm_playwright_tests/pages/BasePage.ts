import type { Locator, Page } from '@playwright/test';
import { PAGE_LOAD_WAIT, WAIT_TIMEOUT } from '../config/config';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Điều hướng đến URL và tự động dismiss popup thông báo OLM.
   * Popup "#dialogConfirmNotification" / "#later-noti" xuất hiện sau khi load
   * và chặn mọi thao tác nếu không được dismiss trước.
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForTimeout(PAGE_LOAD_WAIT * 1000);
    await this._dismissOlmPopups();
  }

  /**
   * Dismiss các popup/overlay chuẩn của OLM.
   * Gọi sau mỗi lần navigate hoặc khi cần đảm bảo UI không bị che.
   */
  async _dismissOlmPopups(): Promise<void> {
    // 1. Popup "Đăng ký nhận thông báo" (#later-noti)
    try {
      const laterBtn = this.page.locator('#later-noti').first();
      if (await laterBtn.isVisible({ timeout: 6_000 })) {
        await laterBtn.click({ timeout: 6_000 });
        await this.page.waitForTimeout(400);
      }
    } catch { /* popup không xuất hiện */ }

    // 2. Modal VIP hoặc modal thông thường có nút close
    try {
      const closeBtn = this.page.locator(
        '.modal.show .close, .modal.show .btn-close, .modal.show button[aria-label="Close"]'
      ).first();
      if (await closeBtn.isVisible({ timeout: 3_000 })) {
        await closeBtn.click({ timeout: 4_000 });
        await this.page.waitForTimeout(300);
      }
    } catch { /* không có modal */ }

    // 3. Backdrop còn sót → Escape
    try {
      const backdrop = this.page.locator('.modal-backdrop').first();
      if (await backdrop.isVisible({ timeout: 1600 })) {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch { /* không có backdrop */ }
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async findVisible(selectors: string[], timeoutSec?: number): Promise<Locator | null> {
    const timeoutMs = (timeoutSec ?? WAIT_TIMEOUT) * 1000;
    for (const sel of selectors) {
      const locator = this.page.locator(sel).first();
      try {
        await locator.waitFor({ state: 'visible', timeout: timeoutMs });
        return locator;
      } catch {
        continue;
      }
    }
    return null;
  }

  async findClickable(selectors: string[], timeoutSec?: number): Promise<Locator | null> {
    const timeoutMs = (timeoutSec ?? WAIT_TIMEOUT) * 1000;
    for (const sel of selectors) {
      const locator = this.page.locator(sel).first();
      try {
        await locator.waitFor({ state: 'visible', timeout: timeoutMs });
        await locator.click({ trial: true, timeout: 6000 }).catch(() => {});
        return locator;
      } catch {
        continue;
      }
    }
    return null;
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async findElements(selector: string): Promise<Locator[]> {
    return this.page.locator(selector).all();
  }

  async jsClick(locator: Locator): Promise<void> {
    await locator.evaluate((el) => (el as HTMLElement).click());
  }

  async jsClearAndType(locator: Locator, text: string): Promise<void> {
    await locator.evaluate((el) => {
      (el as HTMLInputElement).value = '';
    });
    await locator.fill(text);
  }

  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  async scrollToBottom(pauseSec = 0.8): Promise<void> {
    let last = await this.page.evaluate(() => document.body.scrollHeight);
    while (true) {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.waitForTimeout(pauseSec * 1000);
      const now = await this.page.evaluate(() => document.body.scrollHeight);
      if (now === last) break;
      last = now;
    }
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(300);
  }

  async isElementPresent(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  async waitForUrlContains(text: string, timeoutSec?: number): Promise<void> {
    await this.page.waitForURL((url) => url.toString().includes(text), {
      timeout: (timeoutSec ?? WAIT_TIMEOUT) * 1000,
    });
  }

  async waitForUrlNotContains(text: string, timeoutSec?: number): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        (t) => !window.location.href.includes(t),
        text,
        { timeout: (timeoutSec ?? WAIT_TIMEOUT) * 1000 }
      );
      return true;
    } catch {
      return false;
    }
  }
}