import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'fs';
import {
  authPathForLabel,
  getWorkerAccountByLabel,
  type WorkerAccountLabel,
} from '../global-setup';
import { LoginPage } from '@modules/dung-chung/auth/pages/LoginPage';
import { patchGotoWithV2 } from '../core/fixtures/patchGoto';

// ─── Types ─────────────────────────────────────────────────────────────────
export type AuthFixtures = {
  /**
   * Role/tài khoản dùng cho authenticatedPage/authenticatedContext.
   *
   * FIX: trước đây fixture này chọn tài khoản theo `TEST_WORKER_INDEX % 6`
   * (round-robin) — nghĩa là tài khoản dùng cho 1 test phụ thuộc vào
   * Playwright GÁN NÓ CHO WORKER NÀO, thứ tự đó lại đổi tuỳ số lượng
   * test/worker chạy cùng lúc → mỗi lần chạy có thể ra 1 tài khoản khác,
   * không kiểm soát được.
   *
   * Giờ: mặc định CỐ ĐỊNH 1 role duy nhất cho toàn bộ suite (đọc từ env
   * `AUTH_ROLE`, mặc định 'student_vip' nếu không set) — không còn phụ
   * thuộc worker/số lượng test chạy song song.
   *
   * Muốn 1 file/describe/test cụ thể chạy bằng tài khoản khác, override qua
   * `test.use({ authRole: 'admin' })` (đặt ở đầu file/describe), ví dụ:
   *
   *   import { test, expect } from '../../../../fixtures/auth.fixture';
   *   test.use({ authRole: 'admin' }); // dùng đúng OLM_ADMIN_USERNAME/PASSWORD
   *
   * Các label hợp lệ: 'admin' | 'school' | 'teacher_vip' | 'teacher_no_vip'
   * | 'student_vip' | 'student_no_vip' (khớp WORKER_ACCOUNTS trong
   * global-setup.ts — đây mới là nơi map label → biến env thật).
   */
  authRole: WorkerAccountLabel;
  /** Page đã đăng nhập – dùng storageState của đúng `authRole` ở trên */
  authenticatedPage: Page;
  /** Context đã đăng nhập – khi cần tạo nhiều page trong 1 test */
  authenticatedContext: BrowserContext;
  /** Page trắng – không dùng storageState */
  guestPage: Page;
};

// Role mặc định khi test KHÔNG override qua test.use({ authRole }).
// Đổi qua env AUTH_ROLE=<label> để ghim toàn bộ suite vào 1 tài khoản cụ thể,
// ví dụ: AUTH_ROLE=admin npx playwright test  → mọi authenticatedPage đều
// dùng đúng tài khoản khai báo ở OLM_ADMIN_USERNAME/OLM_ADMIN_PASSWORD.
const DEFAULT_AUTH_ROLE = (process.env.AUTH_ROLE as WorkerAccountLabel | undefined) ?? 'student_vip';

// ─── Fixtures ──────────────────────────────────────────────────────────────
export const test = base.extend<AuthFixtures>({
  // `option: true` → khai báo được qua test.use({ authRole: ... }) ở bất kỳ
  // file/describe nào import fixture này.
  authRole: [DEFAULT_AUTH_ROLE, { option: true }],

  guestPage: async ({ page }, use) => {
    await use(patchGotoWithV2(page));
  },

  authenticatedContext: async ({ browser, authRole }, use) => {
    const authPath = authPathForLabel(authRole);
    if (!fs.existsSync(authPath)) {
      throw new Error(
        `Chưa có auth state tại ${authPath} (role="${authRole}").\n` +
        `Chạy: npx playwright test (để globalSetup tạo auth files trước).\n` +
        `Kiểm tra biến môi trường tương ứng role "${authRole}" đã có trong file .env đang dùng chưa ` +
        `(xem WORKER_ACCOUNTS trong global-setup.ts để biết tên biến).`
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
// FIX: trước đây cũng chọn tài khoản theo TEST_WORKER_INDEX % 6 (round-robin)
// — cùng lỗi như authenticatedPage ở trên. Giờ mặc định dùng DEFAULT_AUTH_ROLE
// (ghim qua env AUTH_ROLE), hoặc truyền `role` rõ ràng khi cần 1 tài khoản cụ
// thể khác cho riêng lần gọi đó.
export async function loginAs(
  page: Page,
  username?: string,
  password?: string,
  role: WorkerAccountLabel = DEFAULT_AUTH_ROLE,
): Promise<boolean> {
  const acc  = getWorkerAccountByLabel(role);
  const user = username ?? acc.username;
  const pass = password ?? acc.password;

  const loginPage = new LoginPage(page);
  return loginPage.login(user, pass);
}

export { expect };