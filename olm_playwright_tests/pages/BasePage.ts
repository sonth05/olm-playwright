import type { Locator, Page } from '@playwright/test';
import { PAGE_LOAD_WAIT, WAIT_TIMEOUT } from '../config/config';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(PAGE_LOAD_WAIT * 1000);
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
        await locator.click({ trial: true, timeout: 3000 }).catch(() => {});
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
