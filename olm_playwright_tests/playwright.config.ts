import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { REPORTS_DIR } from './config/config';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  // ─── Workers ───────────────────────────────────────────────────────────
  // Giới hạn tối đa bằng số accounts có trong WORKER_ACCOUNTS (hiện = 3)
  // để tránh nhiều worker dùng chung 1 session → rate limit / session conflict.
  // Tăng lên khi bổ sung thêm accounts.
  workers: process.env.WORKERS
    ? Number(process.env.WORKERS)
    : process.env.CI
      ? 2
      : 3,                          // ← đổi từ '50%' xuống 3

  // ─── Timeouts ──────────────────────────────────────────────────────────
  timeout: 120_000,
  expect: { timeout: 30_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(REPORTS_DIR, 'html') }],
    ['./utils/csvReporter.ts'],
  ],
  outputDir: path.join(REPORTS_DIR, 'test-results'),

  use: {
    baseURL: process.env.BASE_URL ?? 'https://olm.vn',
    headless: process.env.CI
      ? process.env.HEADLESS !== 'false'
      : process.env.HEADLESS === 'true',
    viewport: { width: 1366, height: 768 },

    // ─── Timeouts nâng lên để handle olm.vn load chậm ──────────────────
    actionTimeout:     40_000,      // tăng từ 15s → 20s
    navigationTimeout: 120_000,      // tăng từ 30s → 60s

    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    trace:      'retain-on-failure',
    locale:     'vi-VN',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});