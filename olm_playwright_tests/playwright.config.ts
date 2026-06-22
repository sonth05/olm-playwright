import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const reportsDir = path.join(__dirname, 'reports');

export default defineConfig({
  testDir: './tests',

  // Tất cả test chạy song song — kể cả test trong cùng 1 file
  // An toàn vì mỗi test dùng { page } fixture độc lập, không share state
  fullyParallel: true,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  // Số worker chạy song song:
  // - Local: 50% số CPU cores (máy 8 core → 4 workers)
  // - CI: 2 workers (tránh quá tải)
  // - Override thủ công: WORKERS=3 npx playwright test
  workers: process.env.WORKERS
    ? Number(process.env.WORKERS)
    : process.env.CI
    ? 2
    : '50%',

  timeout: 120_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(reportsDir, 'html') }],
    ['./src/utils/csvReporter.ts'],
  ],
  outputDir: path.join(reportsDir, 'test-results'),

  use: {
    baseURL: 'https://olm.vn',
    headless: process.env.CI
      ? process.env.HEADLESS !== 'false'
      : process.env.HEADLESS === 'true',
    viewport: { width: 1366, height: 768 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    locale: 'vi-VN',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
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
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});