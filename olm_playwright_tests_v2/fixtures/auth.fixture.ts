import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import { authPathForWorker, WORKER_ACCOUNTS } from '../global-setup';
import { LoginPage } from '@modules/dung-chung/auth/pages/LoginPage';
import { patchGotoWithV2 } from '../core/fixtures/patchGoto';

// ─── Types ─────────────────────────────────────────────────────────────────
type AuthFixtures = {
  /** Page đã đăng nhập – dùng storageState theo worker index */
  authenticatedPage: Page;
  /** Context đã đăng nhập – khi cần tạo nhiều page trong 1 test */
  authenticatedContext: BrowserContext;
  /** Page trắng – không dùng storageState */
  guestPage: Page;
};

// ─── Worker index helper ───────────────────────────────────────────────────
// Playwright inject TEST_WORKER_INDEX vào env của mỗi worker.
// Worker 0 → worker-0.json (vip_student)
// Worker 1 → worker-1.json (school)
// Worker 2 → worker-2.json (normal_student)
// Worker 3 → worker-3.json (extra_1)
// Worker 4 → worker-4.json (extra_2)
// Worker 5 → worker-5.json (extra_3)
// Worker 6+ → quay vòng lại từ đầu (% WORKER_ACCOUNTS.length)
function getWorkerAuthPath(): string {
  const idx = Number(process.env.TEST_WORKER_INDEX ?? 0);
  const slot = idx % WORKER_ACCOUNTS.length;   // % 6 = round-robin qua 6 accounts
  return authPathForWorker(slot);
}

// ─── Fixtures ──────────────────────────────────────────────────────────────
export const test = base.extend<AuthFixtures>({
  guestPage: async ({ page }, use) => {
    await use(patchGotoWithV2(page));
  },

  authenticatedContext: async ({ browser }, use) => {
    const authPath = getWorkerAuthPath();
    if (!fs.existsSync(authPath)) {
      throw new Error(
        `Chưa có auth state tại ${authPath}.\n` +
        `Chạy: npx playwright test (để globalSetup tạo auth files trước).\n` +
        `Hoặc kiểm tra account extra_1/extra_2/extra_3 trong .env.`
      );
    }
    const context = await browser.newContext({ storageState: authPath });
    await use(context);
    await context.close();
  },

  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(patchGotoWithV2(page));
    // context đã được đóng bởi authenticatedContext fixture
  },
});

// ─── Helper login thủ công (dùng trong test không dùng fixture) ───────────
export async function loginAs(
  page: Page,
  username?: string,
  password?: string
): Promise<boolean> {
  const idx    = Number(process.env.TEST_WORKER_INDEX ?? 0);
  const slot   = idx % WORKER_ACCOUNTS.length;
  const acc    = WORKER_ACCOUNTS[slot];
  const user   = username ?? acc.username;
  const pass   = password ?? acc.password;

  const loginPage = new LoginPage(page);
  return loginPage.login(user, pass);
}

export { expect };