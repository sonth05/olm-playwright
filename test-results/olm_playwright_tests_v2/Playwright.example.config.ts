import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { REPORTS_DIR } from './config/config';

/**
 * Config riêng để chạy ĐỘC LẬP các test trong example/tests/,
 * không đụng tới testMatch/testIgnore của playwright.config.ts chính.
 *
 * Chạy:
 *   npx playwright test --config=playwright.example.config.ts
 * hoặc thêm script vào package.json:
 *   "test:example": "playwright test --config=playwright.example.config.ts"
 */
export default defineConfig({
  testDir: './example/tests',
  testMatch: ['**/*.spec.ts'],

  fullyParallel: true,
  timeout: 120_000,
  
  expect: { timeout: 30_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(REPORTS_DIR, 'html-example') }],
  ],
  outputDir: path.join(REPORTS_DIR, 'test-results-example'),

  use: {
    baseURL: process.env.BASE_URL ?? 'https://olm.vn',
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1366, height: 768 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    locale: 'vi-VN',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});