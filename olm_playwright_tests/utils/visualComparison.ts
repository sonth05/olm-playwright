import { expect, type Page } from '@playwright/test';
import path from 'path';
import { SCREENSHOTS_DIR } from '../config/config';

/** Chụp screenshot thủ công vào thư mục screenshots/ */
export async function captureScreenshot(
  page: Page,
  name: string,
  fullPage = false
): Promise<string> {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage });
  return filePath;
}

/** So sánh UI với baseline Playwright snapshot */
export async function compareScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean; maxDiffPixelRatio?: number }
): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: options?.maxDiffPixelRatio ?? 0.05,
    fullPage: options?.fullPage ?? false,
  });
}
