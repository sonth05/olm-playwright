import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { REPORTS_DIR, BASE_URL } from './config/config';
// Import CHỈ để lấy type — cho phép `project.use.authRole` bên dưới được
// TypeScript kiểm tra đúng kiểu (thay vì phải ép kiểu `as any`). Đây là
// import type (biến mất hoàn toàn sau khi compile) nên KHÔNG tạo phụ thuộc
// runtime/circular với fixtures/auth.fixture.ts.
import type { AuthFixtures } from './fixtures/auth.fixture';

// ─── Video ───────────────────────────────────────────────────────────────
// Khi chạy nhắm vào môi trường local/debug (localhost hoặc debug.olm.vn —
// build chưa ổn định, hay là nơi cần debug nhất), LUÔN quay video cho mọi
// test (kể cả pass) để có sẵn video đối chiếu ngay, không phải chạy lại mới
// có. Khi chạy nhắm production (olm.vn thật) chỉ giữ video của test FAIL
// (retain-on-failure) để đỡ tốn dung lượng cho hàng trăm test pass.
//
// LƯU Ý: cấu hình `video` này chỉ áp dụng cho context/page fixture MẶC ĐỊNH
// của Playwright Test. Các context tạo thủ công bằng browser.newContext()
// (VD core/fixtures/V2authoringrole.fixture.ts) KHÔNG tự động thừa hưởng —
// những nơi đó tự khai báo recordVideo riêng làm phương án DỰ PHÒNG, chỉ
// nên cần đến khi video chính ở đây vì lý do nào đó không xuất được.
const ALWAYS_RECORD_VIDEO = /localhost|127\.0\.0\.1|debug\.olm\.vn/i.test(BASE_URL);

export default defineConfig<AuthFixtures>({
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'modules/**/tests/**/*.spec.ts'],
  testIgnore: ['**/node_modules/**', '**/pages/**'],
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
  timeout: 120_000,           // ← giảm từ 120_000 → 60_000
  expect: { timeout: 30_000 },     // ← giảm từ 30_000 → 15_000

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
    video:      ALWAYS_RECORD_VIDEO ? 'on' : 'retain-on-failure',
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
      testIgnore: [/giao-bai-den-lam-bai\.e2e\.spec\.ts$/],
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
      testMatch: [/modules\/cross-role-flows\/tests\/giao-bai-den-lam-bai\.e2e\.spec\.ts$/],
      dependencies: ['chromium'],
      fullyParallel: false,
      workers: 1,
      timeout: 180_000, // luồng giao bài + làm bài dài hơn các test khác
    },
    {
      // ── Project "olm-staff": chạy THỬ RIÊNG bằng 1 tài khoản nhân viên OLM ──
      // Mục đích: trước khi chạy full ma trận 6 tài khoản (project 'chromium'),
      // muốn thử nhanh 1 lượt bằng đúng tài khoản nhân viên OLM (label 'admin'
      // trong WORKER_ACCOUNTS, global-setup.ts) — tài khoản này có nhiều quyền
      // nên phần lớn tính năng không bị chặn quyền, phù hợp để "thử trước".
      //
      // Cách hoạt động: `authRole` là 1 fixture "option" (khai báo
      // `{ option: true }` trong fixtures/auth.fixture.ts) nên có thể override
      // ngay ở cấp project.use — MỌI test dùng authenticatedPage/
      // authenticatedContext (từ fixtures/auth.fixture.ts) khi chạy trong
      // project này sẽ tự động dùng tài khoản 'admin' (nhân viên OLM), KHÔNG
      // cần sửa từng file test, không đụng tới project 'chromium'/'bai-tap'.
      //
      // workers: 1 vì tất cả test dùng CHUNG 1 session/tài khoản — chạy song
      // song nhiều worker cùng 1 tài khoản dễ đụng race-condition (cùng sửa
      // 1 dữ liệu, cùng 1 cookie...).
      //
      // Lưu ý: các test dùng core/fixtures/V2authoringrole.fixture.ts
      // (getPageAsRole) KHÔNG bị ảnh hưởng bởi authRole — role 'olmStaff' của
      // fixture đó đã tự trỏ sẵn tới storageState/olm-staff.json (cùng tài
      // khoản, tạo trong global-setup.ts), không cần cấu hình gì thêm.
      //
      // Chạy: npx playwright test --project=olm-staff [đường-dẫn-file-hoặc-thư-mục]
      // (thêm path để chỉ chạy 1 phần, ví dụ 1 module đang cần thử trước)
      name: 'olm-staff',
      use: { ...devices['Desktop Chrome'], authRole: 'admin' },
      testIgnore: [/giao-bai-den-lam-bai\.e2e\.spec\.ts$/],
      fullyParallel: false,
      workers: 1,
    },
  ],
});