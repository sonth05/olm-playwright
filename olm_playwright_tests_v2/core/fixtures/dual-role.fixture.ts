import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { storageStateForRole } from './role.fixture';
import { patchGotoWithV2 } from './patchGoto';

type DualRoleFixtures = {
  /** Context + page giáo viên (worker-1 / ACCOUNTS.school) */
  teacherContext: BrowserContext;
  teacherPage: Page;
  /** Context + page học sinh VIP (worker-0) */
  studentContext: BrowserContext;
  studentPage: Page;
};

/**
 * Fixture 2 context đồng thời — dùng cho cross-role e2e (GV giao bài ↔ HS làm bài).
 * Mỗi role dùng storageState riêng, không cần logout/login trên cùng 1 page.
 */
export const test = base.extend<DualRoleFixtures>({
  teacherContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: storageStateForRole('teacher'),
    });
    await use(context);
    await context.close();
  },

  teacherPage: async ({ teacherContext }, use) => {
    const page = await teacherContext.newPage();
    await use(patchGotoWithV2(page));
  },

  studentContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: storageStateForRole('student_vip'),
    });
    await use(context);
    await context.close();
  },

  studentPage: async ({ studentContext }, use) => {
    const page = await studentContext.newPage();
    await use(patchGotoWithV2(page));
  },
});

export { expect };