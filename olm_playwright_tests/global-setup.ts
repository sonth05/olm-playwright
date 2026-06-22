import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_STATE_PATH, BASE_URL, HEADLESS } from './config/config';
import { PASSWORD, USERNAME } from './config/testData';
import {
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
  LOGIN_USERNAME_SELECTORS,
} from './config/constants';

async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const headless = process.env.CI === 'true' ? true : HEADLESS;
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    locale: 'vi-VN',
  });
  const page = await context.newPage();

  await page.goto('/dangnhap', { waitUntil: 'domcontentloaded' });

  for (const sel of LOGIN_USERNAME_SELECTORS) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.fill(USERNAME);
      break;
    }
  }

  for (const sel of LOGIN_PASSWORD_SELECTORS) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.fill(PASSWORD);
      break;
    }
  }

  for (const sel of LOGIN_SUBMIT_SELECTORS) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      break;
    }
  }

  await page.waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 30_000 }).catch(() => {
    console.warn('[globalSetup] Login có thể chưa thành công – vẫn lưu state hiện tại');
  });

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();
  console.log(`[globalSetup] Đã lưu auth state → ${AUTH_STATE_PATH}`);
}

export default globalSetup;
