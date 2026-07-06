import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { REPORTS_DIR } from './config/config';

export default defineConfig({
<<<<<<< HEAD
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'modules/**/tests/**/*.spec.ts'],
  testIgnore: ['**/node_modules/**', '**/pages/**'],
=======
  testDir: './modules',
>>>>>>> 4e7989663b3b88d34663e1c2b10ed000bf3f022f
  globalSetup: './global-setup.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  // ─── Workers ───────────────────────────────────────────────────────────
  // Tăng lên 6 workers tương ứng 6 accounts trong WORKER_ACCOUNTS.
  // Mỗi worker dùng 1 session riêng biệt → không conflict.
  workers: process.env.WORKERS
    ? Number(process.env.WORKERS)
    : process.env.CI
      ? 3
      : 6,                          // ← tăng từ 3 → 6

  // ─── Timeouts (giảm xuống 1/2 so với bản gốc) ─────────────────────────
  timeout: 60_000,           // ← giảm từ 120_000 → 60_000
  expect: { timeout: 15_000 },     // ← giảm từ 30_000 → 15_000

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

    // ─── Timeouts giảm xuống 1/2 so với bản gốc ────────────────────────
    actionTimeout:     20_000,      // ← giảm từ 40_000 → 20_000
    navigationTimeout: 60_000,      // ← giảm từ 120_000 → 60_000

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
      // ── Project chính: smoke + regression + 3 file e2e nhẹ ───────────────
      // Loại trừ Giao-bai-lam-bai.e2e.spec.ts (phần "bài tập") ra khỏi đây —
      // file đó nặng, dùng 2 account (giáo viên + học sinh) chạy nối tiếp
      // 1 luồng giao bài → làm bài thật, nên cần tách riêng và chạy SAU CÙNG
      // để không giành worker/account với các test nhanh khác.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/Giao-bai-lam-bai\.e2e\.spec\.ts$/],
    },
    {
      // ── Project "bài tập": chỉ chứa Giao-bai-lam-bai.e2e.spec.ts ─────────
      // dependencies: ['chromium'] → Playwright LUÔN chạy hết toàn bộ
      // project 'chromium' trước, sau đó mới bắt đầu project này.
      // workers: 1 + fullyParallel: false → chạy tuần tự, không phân luồng,
      // vì test này tự đăng nhập/đăng xuất giáo viên rồi học sinh trên
      // CÙNG MỘT page tuần tự — chạy song song dễ vướng race-condition.
      name: 'bai-tap',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [/cross-role-flows\/tests\/Giao-bai-lam-bai\.e2e\.spec\.ts$/],
      dependencies: ['chromium'],
      fullyParallel: false,
      workers: 1,
      timeout: 180_000, // luồng giao bài + làm bài dài hơn các test khác
    },
  ],
});