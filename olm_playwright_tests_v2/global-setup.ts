import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { BASE_URL, HEADLESS } from './config/config';
import {
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
  LOGIN_USERNAME_SELECTORS,
} from './config/constants';

// ─── Danh sách 6 tài khoản (tương ứng 6 workers) ───────────────────────────
// Đã tổ chức lại theo vai trò: admin, school, teacher_vip, teacher_no_vip,
// student_vip, student_no_vip. Thứ tự worker 0 -> 5.
export const WORKER_ACCOUNTS = [
  {
    // worker-0: Admin (Nhân sự OLM)
    username: process.env.OLM_ADMIN_USERNAME          ?? 'fallback_admin',
    password: process.env.OLM_ADMIN_PASSWORD          ?? 'fallback_admin_pass',
    label:    'admin',
  },
  {
    // worker-1: School
    username: process.env.OLM_SCHOOL_USERNAME         ?? 'fallback_school',
    password: process.env.OLM_SCHOOL_PASSWORD         ?? 'fallback_school_pass',
    label:    'school',
  },
  {
    // worker-2: Teacher VIP
    username: process.env.OLM_TEACHER_VIP_USERNAME    ?? 'fallback_teacher_vip',
    password: process.env.OLM_TEACHER_VIP_PASSWORD    ?? 'fallback_teacher_vip_pass',
    label:    'teacher_vip',
  },
  {
    // worker-3: Teacher No VIP
    username: process.env.OLM_TEACHER_NO_VIP_USERNAME ?? 'fallback_teacher_no_vip',
    password: process.env.OLM_TEACHER_NO_VIP_PASSWORD ?? 'fallback_teacher_no_vip_pass',
    label:    'teacher_no_vip',
  },
  {
    // worker-4: Student VIP
    username: process.env.OLM_STUDENT_VIP_USERNAME    ?? 'fallback_student_vip',
    password: process.env.OLM_STUDENT_VIP_PASSWORD    ?? 'fallback_student_vip_pass',
    label:    'student_vip',
  },
  {
    // worker-5: Student No VIP
    username: process.env.OLM_STUDENT_NO_VIP_USERNAME ?? 'fallback_student_no_vip',
    password: process.env.OLM_STUDENT_NO_VIP_PASSWORD ?? 'fallback_student_no_vip_pass',
    label:    'student_no_vip',
  },
] as const;

// Auth file cho worker index i = auth/worker-{i}.json
// auth/user.json vẫn giữ (= worker-0) để không break code cũ
export function authPathForWorker(workerIndex: number): string {
  const dir = path.resolve(__dirname, 'auth');
  return path.join(dir, `worker-${workerIndex}.json`);
}

// ─── Tra cứu tài khoản/đường dẫn auth THEO LABEL (role) ────────────────────
// Đây là NGUỒN CHÂN LÝ DUY NHẤT cho việc "role nào ↔ tài khoản nào". Mọi nơi
// khác (role.fixture.ts, auth.fixture.ts, Apiauth.ts, ...) PHẢI tra cứu qua
// đây bằng label thay vì tự hard-code lại số thứ tự (index) — trước đây mỗi
// nơi tự hard-code 1 con số riêng, dẫn tới lệch nhau mỗi khi WORKER_ACCOUNTS
// đổi thứ tự (đây chính là nguyên nhân gây lẫn tài khoản giữa các role).
export type WorkerAccountLabel = (typeof WORKER_ACCOUNTS)[number]['label'];

const LABEL_TO_INDEX: Record<WorkerAccountLabel, number> = Object.fromEntries(
  WORKER_ACCOUNTS.map((acc, i) => [acc.label, i]),
) as Record<WorkerAccountLabel, number>;

/** Lấy thông tin tài khoản (username/password/label) theo label — throw nếu label không tồn tại. */
export function getWorkerAccountByLabel(label: WorkerAccountLabel) {
  const idx = LABEL_TO_INDEX[label];
  if (idx === undefined) {
    throw new Error(
      `[global-setup] Label tài khoản không hợp lệ: "${label}". ` +
      `Các label hợp lệ: ${WORKER_ACCOUNTS.map((a) => a.label).join(', ')}`,
    );
  }
  return WORKER_ACCOUNTS[idx];
}

/** Lấy đường dẫn file storageState (auth/worker-N.json) theo label — dùng thay authPathForWorker(index) khi có thể. */
export function authPathForLabel(label: WorkerAccountLabel): string {
  const idx = LABEL_TO_INDEX[label];
  if (idx === undefined) {
    throw new Error(
      `[global-setup] Label tài khoản không hợp lệ: "${label}". ` +
      `Các label hợp lệ: ${WORKER_ACCOUNTS.map((a) => a.label).join(', ')}`,
    );
  }
  return authPathForWorker(idx);
}

// ─── Helper: lấy message từ unknown error ─────────────────────────────────
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ─── Cache session: bỏ qua đăng nhập nếu storageState đã có sẵn & còn "mới" ──
// Trước đây MỌI lần chạy `npx playwright test` đều đăng nhập lại từ đầu cho
// cả 6 (hoặc hơn) tài khoản, dù phiên đăng nhập lần trước vẫn còn hạn dùng
// được — tốn thời gian không cần thiết cho lần chạy tiếp theo ngay sau đó.
// Giờ: nếu file storageState đã tồn tại, còn "mới" (chỉnh sửa lần cuối trong
// vòng AUTH_STATE_MAX_AGE_MIN phút) VÀ có ít nhất 1 cookie đã lưu, thì bỏ
// qua bước đăng nhập, dùng lại session cũ luôn.
// Override qua env:
//   AUTH_STATE_MAX_AGE_MIN=<số phút>  (mặc định 360 = 6 tiếng)
//   FORCE_RELOGIN=true                 (bỏ qua cache, luôn đăng nhập lại)
const AUTH_STATE_MAX_AGE_MIN = Number(process.env.AUTH_STATE_MAX_AGE_MIN ?? 360);
const FORCE_RELOGIN = process.env.FORCE_RELOGIN === 'true';

function isStorageStateFresh(filePath: string): boolean {
  if (FORCE_RELOGIN) return false;
  if (!fs.existsSync(filePath)) return false;

  try {
    const stat = fs.statSync(filePath);
    const ageMin = (Date.now() - stat.mtimeMs) / 60_000;
    if (ageMin > AUTH_STATE_MAX_AGE_MIN) return false;

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // storageState "rỗng" (chưa từng đăng nhập thành công) không có cookie
    // nào — coi như KHÔNG hợp lệ dù file có tồn tại, tránh tái sử dụng 1
    // session chưa từng đăng nhập được.
    return Array.isArray(raw?.cookies) && raw.cookies.length > 0;
  } catch {
    return false; // file hỏng/không đọc được JSON -> coi như không hợp lệ
  }
}

// ─── Dọn video debug cũ trước mỗi lần chạy ─────────────────────────────────
// core/fixtures/V2authoringrole.fixture.ts ghi video của MỌI context (mỗi
// role) vào reports/debug-video/ với tên file random do Playwright tự sinh.
// Trước đây thư mục này KHÔNG bao giờ được dọn — video của tất cả các lần
// chạy trước cứ chồng lên nhau mãi, ngày càng nặng và khó biết video nào
// thuộc lần chạy nào. Giờ dọn sạch thư mục này 1 lần duy nhất ở đầu mỗi lần
// chạy (globalSetup chỉ chạy 1 lần cho toàn bộ suite) — mỗi lần `npx
// playwright test` sẽ luôn bắt đầu với reports/debug-video/ trống, chỉ còn
// lại video của đúng lần chạy đó khi kết thúc.
function cleanupOldDebugVideos(): void {
  const debugVideoDir = path.resolve(__dirname, 'reports/debug-video');
  try {
    if (fs.existsSync(debugVideoDir)) {
      for (const entry of fs.readdirSync(debugVideoDir)) {
        fs.rmSync(path.join(debugVideoDir, entry), { recursive: true, force: true });
      }
    } else {
      fs.mkdirSync(debugVideoDir, { recursive: true });
    }
    console.log(`[globalSetup] 🧹 Đã dọn sạch video debug cũ (${debugVideoDir})`);
  } catch (err) {
    console.warn(`[globalSetup] ⚠ Không dọn được video debug cũ: ${getErrorMessage(err)}`);
  }
}

// ─── Selectors nút đóng modal (theo thứ tự ưu tiên) ──────────────────────
const MODAL_CLOSE_SELECTORS = [
  '.modal.show .modal-header .close',
  '.modal.show .modal-header button.close',
  '.modal.show .modal-header [data-dismiss="modal"]',
  '.modal.show .modal-header .btn-close',
  '.modal.show .close',
  '.modal.show [data-dismiss="modal"]',
  '.modal.show .btn-close',
  'button[aria-label="Close"]',
  '.modal.show button:has-text("×")',
  '.modal.show button:has-text("✕")',
];

// Popup ưu tiên đóng trước (xếp theo layer, z-index cao nhất trước)
const NAMED_POPUP_TEXTS = ['Thay đổi mật khẩu', 'Xác thực'];

const NAMED_POPUP_CLOSE_SELECTORS = [
  'button.close',
  'button[aria-label="Close"]',
  '.modal-header .close',
  '[data-dismiss="modal"]',
  'button.btn-close',
  'button:has-text("×")',
  'button:has-text("✕")',
];

/**
 * Đóng 1 popup cụ thể được lọc theo nội dung text (VD: "Xác thực",
 * "Thay đổi mật khẩu"). Trả về true nếu đã tìm thấy & đóng được popup.
 */
async function dismissNamedPopup(
  page: import('@playwright/test').Page,
  text: string,
): Promise<boolean> {
  try {
    const modal = page
      .locator('.modal.show, [class*="modal"][style*="display: block"], [role="dialog"]')
      .filter({ hasText: text })
      .first();

    if (!(await modal.isVisible({ timeout: 3_000 }))) return false;

    for (const sel of NAMED_POPUP_CLOSE_SELECTORS) {
      try {
        const btn = modal.locator(sel).first();
        if (await btn.isVisible({ timeout: 1_000 })) {
          await btn.click({ force: true, timeout: 3_000 });
          await page.waitForTimeout(500);
          return true;
        }
      } catch {
        // thử selector tiếp theo
      }
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return true;
  } catch {
    return false;
  }
}

/**
 * Dismiss tất cả modal đang hiển thị trên trang sau khi đăng nhập lần đầu.
 */
async function dismissAllModals(page: import('@playwright/test').Page, maxAttempts = 5): Promise<void> {
  for (const text of NAMED_POPUP_TEXTS) {
    await dismissNamedPopup(page, text);
  }

  try {
    const notifyBtn = page.locator('#later-noti').first();
    if (await notifyBtn.isVisible({ timeout: 2_000 })) {
      await notifyBtn.click({ timeout: 3_000 });
      await page.waitForTimeout(300);
    }
  } catch {
    // không có popup thông báo, bỏ qua
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let dismissed = false;
    for (const sel of MODAL_CLOSE_SELECTORS) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1_500 })) {
          await btn.click({ force: true, timeout: 3_000 });
          await page.waitForTimeout(500);
          dismissed = true;
          break;
        }
      } catch {
        // selector không khớp, thử cái tiếp theo
      }
    }
    if (!dismissed) break;
  }

  try {
    const backdrop = page.locator('.modal-backdrop').first();
    if (await backdrop.isVisible({ timeout: 1_000 })) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  } catch {
    // không có backdrop
  }
}

// ─── Login helper ──────────────────────────────────────────────────────────
async function loginAndSave(opts: {
  username: string;
  password: string;
  label: string;
  savePath: string;
  headless: boolean;
}): Promise<void> {
  const { username, password, label, savePath, headless } = opts;

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    locale: 'vi-VN',
  });
  const page = await context.newPage();

  try {
    await page.goto('/dangnhap', { waitUntil: 'domcontentloaded', timeout: 25_000 });

    for (const sel of LOGIN_USERNAME_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await el.fill(username);
        break;
      }
    }

    for (const sel of LOGIN_PASSWORD_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await el.fill(password);
        break;
      }
    }

    for (const sel of LOGIN_SUBMIT_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await el.click();
        break;
      }
    }

    // FIX: trước đây chỉ console.warn() rồi VẪN lưu storageState như đăng
    // nhập thành công — kết quả là file state chứa session CHƯA đăng nhập
    // (vẫn đang ở /dangnhap), mọi test dùng lại state này sau đó bị văng về
    // màn đăng nhập ngay lần điều hướng đầu tiên, mà không có lỗi nào chỉ
    // thẳng về nguyên nhân thật (sai tài khoản / thiếu biến môi trường /
    // selector đăng nhập đổi). Giờ throw thật để caller (đã có try/catch
    // fallback cho worker 1..5 và editableTeacher/olmStaff) xử lý đúng, thay
    // vì lẳng lặng để lại 1 file "trông như hợp lệ" nhưng thực chất là rỗng.
    let loginSucceeded = true;
    await page
      .waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 15_000 })
      .catch(() => {
        loginSucceeded = false;
      });

    if (!loginSucceeded) {
      throw new Error(
        `[loginAndSave] ${label}: đăng nhập KHÔNG thành công (vẫn ở trang /dangnhap sau khi submit) — ` +
        `kiểm tra lại username/password (có thể đang dùng giá trị fallback do thiếu biến môi trường) ` +
        `hoặc selector form đăng nhập đã đổi trên DOM thật.`,
      );
    }

    await dismissAllModals(page);

    await context.storageState({ path: savePath });
    console.log(`[globalSetup] ✓ ${label} → ${savePath}`);
  } finally {
    await browser.close();
  }
}

// ─── Login (có cache) — bỏ qua nếu storageState đã "mới" ──────────────────
async function loginAndSaveMaybeCached(opts: {
  username: string;
  password: string;
  label: string;
  savePath: string;
  headless: boolean;
}): Promise<void> {
  if (isStorageStateFresh(opts.savePath)) {
    console.log(
      `[globalSetup] ⚡ ${opts.label}: dùng lại session cũ còn hạn (< ${AUTH_STATE_MAX_AGE_MIN} phút) ` +
      `→ bỏ qua đăng nhập. (path=${opts.savePath}, ép đăng nhập lại bằng FORCE_RELOGIN=true)`,
    );
    return;
  }
  await loginAndSave(opts);
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.resolve(__dirname, 'auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  cleanupOldDebugVideos();

  const headless = process.env.CI === 'true' ? true : HEADLESS;

  // ── Login CÙNG LÚC nhiều browser (thay vì lần lượt 1 browser 1) ────────
  // Mỗi lần gọi loginAndSave() tự launch 1 chromium.launch() RIÊNG (browser
  // process riêng) — trước đây các lệnh gọi này được `await` LẦN LƯỢT trong
  // vòng for, nên dù mỗi worker có browser riêng, chúng vẫn chạy TUẦN TỰ
  // (worker 2 phải đợi worker 1 login xong mới bắt đầu), tổng thời gian =
  // tổng thời gian của cả 6 lần login cộng lại. Giờ dùng Promise.allSettled
  // để TẤT CẢ browser cùng chạy song song — tổng thời gian ≈ thời gian của
  // lần login CHẬM NHẤT, không phải tổng cộng.
  //
  // worker-0 vẫn là fallback cuối cùng cho các worker khác nếu chúng login
  // thất bại (xem xử lý bên dưới) — nhưng vì giờ chạy song song, không thể
  // "chờ worker-0 xong trước rồi mới bắt đầu worker khác" như code cũ nữa;
  // thay vào đó tất cả cùng chạy, rồi mới xét fallback SAU KHI có kết quả.
  const acc0 = WORKER_ACCOUNTS[0];
  const primaryPath = authPathForWorker(0);

  console.log(`[globalSetup] 🔐 Đăng nhập song song ${WORKER_ACCOUNTS.length} tài khoản (worker-0..${WORKER_ACCOUNTS.length - 1})...`);
  const workerResults = await Promise.allSettled(
    WORKER_ACCOUNTS.map((acc, i) =>
      loginAndSaveMaybeCached({ ...acc, savePath: authPathForWorker(i), headless }),
    ),
  );

  // worker-0 là fallback cuối cùng cho MỌI worker/role khác (xem các
  // copyFileSync(primaryPath, ...) bên dưới) — nếu nó thất bại (và không có
  // cache cũ để dùng), throw thẳng để Playwright dừng hẳn suite kèm lỗi rõ
  // ràng, thay vì để lỗi lan âm thầm sang hàng chục test không liên quan.
  if (workerResults[0].status === 'rejected') {
    throw workerResults[0].reason;
  }

  for (let i = 1; i < WORKER_ACCOUNTS.length; i++) {
    const result = workerResults[i];
    if (result.status === 'rejected') {
      const acc = WORKER_ACCOUNTS[i];
      console.warn(
        `[globalSetup] ⚠ Không thể login worker-${i} (${acc.label}), ` +
        `fallback copy state từ worker-0. Lỗi: ${getErrorMessage(result.reason)}`
      );
      fs.copyFileSync(primaryPath, authPathForWorker(i));
    }
  }

  // Giữ auth/user.json (= worker-0) để không break code cũ
  const legacyPath = path.resolve(__dirname, 'auth/user.json');
  if (fs.existsSync(primaryPath)) {
    fs.copyFileSync(primaryPath, legacyPath);
    console.log(`[globalSetup] ✓ auth/user.json cập nhật từ worker-0`);
  }

  // ── storageState/*.json cho V2authoringrole.fixture.ts ─────────────────
  // Fixture "Soạn học liệu V2" cần 5 file riêng cho 5 role. Trước đây toàn bộ
  // copy từ worker-0 (học sinh). Nay login riêng bằng tài khoản thật cho
  // editableTeacher và olmStaff. Các role còn lại tạm copy từ worker-0 (admin).
  // 2 login riêng này (teacherVip/admin) cũng chạy SONG SONG với nhau bằng
  // Promise.allSettled thay vì lần lượt, cùng lý do như phần worker ở trên.
  if (/debug\.olm\.vn/.test(BASE_URL)) {
    const stateDir = path.resolve(__dirname, 'storageState');
    if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });

    // 3 role chưa có tài khoản riêng: tạm copy từ worker-0
    const fallbackRoles = [
      'teacher-non-editable.json',
      'teacher-olm-source.json',
      'teacher-non-olm-source.json',
    ];
    for (const file of fallbackRoles) {
      fs.copyFileSync(primaryPath, path.join(stateDir, file));
    }

    const teacherVip = WORKER_ACCOUNTS[2]; // teacher_vip
    const admin = WORKER_ACCOUNTS[0]; // admin
    const teacherEditablePath = path.join(stateDir, 'teacher-editable.json');
    const olmStaffPath = path.join(stateDir, 'olm-staff.json');

    const [editableResult, olmStaffResult] = await Promise.allSettled([
      loginAndSaveMaybeCached({
        ...teacherVip,
        label: 'editableTeacher',
        savePath: teacherEditablePath,
        headless,
      }),
      loginAndSaveMaybeCached({
        ...admin,
        label: 'olmStaff',
        savePath: olmStaffPath,
        headless,
      }),
    ]);

    if (editableResult.status === 'fulfilled') {
      console.log(`[globalSetup] ✅ editableTeacher ← teacher_vip (${teacherVip.username})`);
    } else {
      console.warn(
        `[globalSetup] ⚠ Fallback editableTeacher về worker-0. Lỗi: ${getErrorMessage(editableResult.reason)}`
      );
      fs.copyFileSync(primaryPath, teacherEditablePath);
    }

    if (olmStaffResult.status === 'fulfilled') {
      console.log(`[globalSetup] ✅ olmStaff ← admin (${admin.username})`);
    } else {
      console.warn(
        `[globalSetup] ⚠ Fallback olmStaff về worker-0. Lỗi: ${getErrorMessage(olmStaffResult.reason)}`
      );
      fs.copyFileSync(primaryPath, olmStaffPath);
    }

    console.warn(
      '[globalSetup] ⚠ Debug env: storageState/ đã sẵn sàng. ' +
      'editableTeacher: teacher_vip, olmStaff: admin. ' +
      'Các role còn lại dùng state admin (chưa có tài khoản riêng).'
    );
  } else {
    // FIX: trước đây khối tạo storageState/*.json bị bỏ qua HOÀN TOÀN không
    // 1 dòng log nào khi BASE_URL không khớp debug.olm.vn — mọi test dùng
    // V2authoringrole.fixture.ts (getPageAsRole) sau đó mở context với file
    // storageState/*.json CŨ (từ lần chạy trước, có thể đã hết hạn) hoặc
    // KHÔNG TỒN TẠI, mà không ai biết lý do vì globalSetup "chạy xong bình
    // thường". Log rõ ràng ở đây để không còn là lỗi im lặng.
    console.warn(
      `[globalSetup] ⚠ BASE_URL="${BASE_URL}" không khớp debug.olm.vn — ` +
      'BỎ QUA việc tạo mới storageState/*.json (editableTeacher, olmStaff, ...). ' +
      'Mọi test dùng V2authoringrole.fixture.ts (getPageAsRole) sẽ dùng file storageState/ ' +
      'CŨ nếu có, hoặc lỗi "no such file" nếu chưa từng chạy debug env lần nào — ' +
      'set đúng BASE_URL/ENV_FILE trỏ tới debug.olm.vn trước khi chạy các test module hoc-lieu-v2.'
    );
  }
}

export default globalSetup;