import { test as base, expect, type Page } from '@playwright/test';
import fs from 'fs';
import { AUTH_STATE_PATH } from '../config/config';
import { LoginPage } from '../pages/LoginPage';
import { PASSWORD, USERNAME } from '../config/testData';

type AuthFixtures = {
  /** Page đã đăng nhập sẵn (dùng storageState) */
  authenticatedPage: Page;
  /** Page trắng – không dùng storageState */
  guestPage: Page;
};

export const test = base.extend<AuthFixtures>({
  guestPage: async ({ page }, use) => {
    await use(page);
  },

  authenticatedPage: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_STATE_PATH)) {
      throw new Error(
        `Chưa có auth state tại ${AUTH_STATE_PATH}. Chạy globalSetup hoặc npm test trước.`
      );
    }
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

/** Helper đăng nhập thủ công trong test */
export async function loginAs(page: Page, username = USERNAME, password = PASSWORD): Promise<boolean> {
  const loginPage = new LoginPage(page);
  return loginPage.login(username, password);
}

export { expect };
