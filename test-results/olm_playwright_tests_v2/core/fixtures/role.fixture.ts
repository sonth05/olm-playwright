import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { authPathForLabel, type WorkerAccountLabel } from '../../global-setup';
import { patchGotoWithV2 } from './patchGoto';

// ─── Role (dùng trong test) → label tài khoản (khớp WORKER_ACCOUNTS trong
// global-setup.ts) ───────────────────────────────────────────────────────
// FIX: trước đây map cứng sang SỐ (0,1,2) theo thứ tự worker CŨ. Khi
// WORKER_ACCOUNTS trong global-setup.ts được tổ chức lại theo 6 role
// (admin=0, school=1, teacher_vip=2, teacher_no_vip=3, student_vip=4,
// student_no_vip=5), các số cũ ở đây KHÔNG được cập nhật theo → 'student_vip'
// trỏ nhầm sang worker-0 (thực chất là tài khoản admin), 'normal_student' trỏ
// nhầm sang worker-2 (thực chất là teacher_vip). Đây là nguyên nhân chính
// khiến test chạy lẫn tài khoản khác role. Giờ tra cứu qua LABEL (tên) thay
// vì số, để không bao giờ lệch dù global-setup.ts đổi thứ tự index.
const ROLE_TO_ACCOUNT_LABEL: Record<string, WorkerAccountLabel> = {
  student_vip: 'student_vip',
  teacher: 'teacher_vip',
  school_admin: 'school',
  normal_student: 'student_no_vip',
};

type RoleFixtures = {
  /** Page đăng nhập học sinh VIP — dùng đúng tài khoản OLM_STUDENT_VIP_* */
  studentPage: Page;
  /** Page đăng nhập giáo viên VIP — dùng đúng tài khoản OLM_TEACHER_VIP_* */
  teacherPage: Page;
  /** Page đăng nhập học sinh KHÔNG VIP — dùng đúng tài khoản OLM_STUDENT_NO_VIP_* */
  normalStudentPage: Page;
  /** Context giáo viên — khi cần nhiều tab cùng role */
  teacherContext: BrowserContext;
};

function authPathForRole(role: keyof typeof ROLE_TO_ACCOUNT_LABEL): string {
  const label = ROLE_TO_ACCOUNT_LABEL[role];
  if (label === undefined) {
    throw new Error(`Role không hỗ trợ: ${role}`);
  }
  return authPathForLabel(label);
}

async function createAuthenticatedContext(
  browser: import('@playwright/test').Browser,
  role: keyof typeof ROLE_TO_ACCOUNT_LABEL
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
    await use(patchGotoWithV2(page));
  },

  studentPage: async ({ browser }, use) => {
    const context = await createAuthenticatedContext(browser, 'student_vip');
    const page = await context.newPage();
    await use(patchGotoWithV2(page));
    await context.close();
  },

  normalStudentPage: async ({ browser }, use) => {
    const context = await createAuthenticatedContext(browser, 'normal_student');
    const page = await context.newPage();
    await use(patchGotoWithV2(page));
    await context.close();
  },
});

export { expect };

/** Helper: lấy đường dẫn storageState theo role (dùng ngoài fixture) */
export function storageStateForRole(role: keyof typeof ROLE_TO_ACCOUNT_LABEL): string {
  return authPathForRole(role);
}