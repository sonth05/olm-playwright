<<<<<<< HEAD
import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { authPathForWorker } from '../../global-setup';

// ─── Role → worker slot (khớp WORKER_ACCOUNTS trong global-setup.ts) ───────
const ROLE_WORKER_SLOT: Record<string, number> = {
  student_vip: 0,
  teacher: 1,
  school_admin: 1,
  normal_student: 2,
};

type RoleFixtures = {
  /** Page đăng nhập VIP student (worker-0) */
  studentPage: Page;
  /** Page đăng nhập giáo viên / school (worker-1) — ACCOUNTS.school */
  teacherPage: Page;
  /** Page đăng nhập học sinh thường (worker-2) */
  normalStudentPage: Page;
  /** Context giáo viên — khi cần nhiều tab cùng role */
  teacherContext: BrowserContext;
};

function authPathForRole(role: keyof typeof ROLE_WORKER_SLOT): string {
  const slot = ROLE_WORKER_SLOT[role];
  if (slot === undefined) {
    throw new Error(`Role không hỗ trợ: ${role}`);
  }
  return authPathForWorker(slot);
}

async function createAuthenticatedContext(
  browser: import('@playwright/test').Browser,
  role: keyof typeof ROLE_WORKER_SLOT
): Promise<BrowserContext> {
  const authPath = authPathForRole(role);
  if (!fs.existsSync(authPath)) {
    throw new Error(
      `Chưa có auth state tại ${authPath}.\nChạy npx playwright test để globalSetup tạo auth files.`
    );
  }
  return browser.newContext({ storageState: authPath });
}

export const test = base.extend<RoleFixtures>({
  teacherContext: async ({ browser }, use) => {
    const context = await createAuthenticatedContext(browser, 'teacher');
    await use(context);
    await context.close();
  },

  teacherPage: async ({ teacherContext }, use) => {
    const page = await teacherContext.newPage();
    await use(page);
  },

  studentPage: async ({ browser }, use) => {
    const context = await createAuthenticatedContext(browser, 'student_vip');
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  normalStudentPage: async ({ browser }, use) => {
    const context = await createAuthenticatedContext(browser, 'normal_student');
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };

/** Helper: lấy đường dẫn storageState theo role (dùng ngoài fixture) */
export function storageStateForRole(role: keyof typeof ROLE_WORKER_SLOT): string {
  return authPathForRole(role);
}
=======
export * from '../../fixtures/auth.fixture';
>>>>>>> 4e7989663b3b88d34663e1c2b10ed000bf3f022f
