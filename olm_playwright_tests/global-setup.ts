import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { BASE_URL, HEADLESS } from './config/config';
import {
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
  LOGIN_USERNAME_SELECTORS,
} from './config/constants';

// ─── Danh sách 6 accounts (tương ứng 6 workers) ───────────────────────────
// Mỗi account dùng 1 file auth riêng → không bị conflict session.
// Thêm account mới: chỉ cần thêm object vào mảng bên dưới.
export const WORKER_ACCOUNTS = [
  {
    username: process.env.OLM_VIP_USERNAME      ?? 'hsptolm_dothilananh',
    password: process.env.OLM_VIP_PASSWORD      ?? 'Thanhson2@',
    label:    'vip_student',          // worker-0
  },
  {
    username: process.env.OLM_SCHOOL_USERNAME   ?? 'nguyenthanhson2818',
    password: process.env.OLM_SCHOOL_PASSWORD   ?? 'Thanhsin2@',
    label:    'school',               // worker-1
  },
  {
    username: process.env.OLM_NORMAL_USERNAME   ?? 'hsptolm_tranducanh',
    password: process.env.OLM_NORMAL_PASSWORD   ?? '123456',
    label:    'normal_student',       // worker-2
  },
  {
    username: process.env.OLM_EXTRA1_USERNAME   ?? 'hsptolm_nguyenminhanh',
    password: process.env.OLM_EXTRA1_PASSWORD   ?? '123456',
    label:    'nguyen_minh_anh',      // worker-3
  },
  {
    username: process.env.OLM_EXTRA2_USERNAME   ?? 'hsptolm_lehoangnam',
    password: process.env.OLM_EXTRA2_PASSWORD   ?? '123456',
    label:    'le_hoang_nam',         // worker-4
  },
  {
    username: process.env.OLM_EXTRA3_USERNAME   ?? 'hsptolm_sonthanh',
    password: process.env.OLM_EXTRA3_PASSWORD   ?? '123456',
    label:    'son_thanh',            // worker-5
  },
] as const;

// Auth file cho worker index i = auth/worker-{i}.json
// auth/user.json vẫn giữ (= worker-0) để không break code cũ
export function authPathForWorker(workerIndex: number): string {
  const dir = path.resolve(__dirname, 'auth');
  return path.join(dir, `worker-${workerIndex}.json`);
}

// ─── Selectors nút đóng modal (theo thứ tự ưu tiên) ──────────────────────
const MODAL_CLOSE_SELECTORS = [
  // Bootstrap modal đang hiển thị — nút × trên header
  '.modal.show .modal-header .close',
  '.modal.show .modal-header button.close',
  '.modal.show .modal-header [data-dismiss="modal"]',
  '.modal.show .modal-header .btn-close',
  // Fallback: bất kỳ nút close nào trong modal đang show
  '.modal.show .close',
  '.modal.show [data-dismiss="modal"]',
  '.modal.show .btn-close',
  // Generic aria-label
  'button[aria-label="Close"]',
  // Fallback theo nội dung nút (nút "×"/"✕" không có class/aria-label chuẩn)
  '.modal.show button:has-text("×")',
  '.modal.show button:has-text("✕")',
];

// Popup ưu tiên đóng trước (xếp theo layer, z-index cao nhất trước) —
// 2 popup này luôn xuất hiện chồng nhau ngay sau khi login lần đầu:
//   1. "Thay đổi mật khẩu" (nhắc đổi mật khẩu mặc định)
//   2. "Xác thực" (yêu cầu xác thực email/SĐT)
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

    // Không tìm thấy nút close khớp selector → fallback Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return true;
  } catch {
    return false;
  }
}

/**
 * Dismiss tất cả modal đang hiển thị trên trang sau khi đăng nhập lần đầu.
 * Lặp tối đa maxAttempts lần để xử lý trường hợp modal chồng nhau
 * (VD: "Thay đổi mật khẩu" + "Xác thực" xuất hiện cùng lúc sau login).
 *
 * Thứ tự xử lý:
 *   1. Đóng riêng từng popup có tên (Thay đổi mật khẩu → Xác thực) theo layer.
 *   2. Đóng popup "Đăng ký nhận thông báo" (#later-noti).
 *   3. Vòng lặp generic đóng mọi modal.show còn sót.
 *   4. Backdrop còn sót → Escape.
 */
async function dismissAllModals(page: import('@playwright/test').Page, maxAttempts = 5): Promise<void> {
  // 1. Đóng các popup đặt tên trước (đúng thứ tự layer)
  for (const text of NAMED_POPUP_TEXTS) {
    await dismissNamedPopup(page, text);
  }

  // 2. Dismiss popup "Đăng ký nhận thông báo" (#later-noti) nếu còn sót
  try {
    const notifyBtn = page.locator('#later-noti').first();
    if (await notifyBtn.isVisible({ timeout: 2_000 })) {
      await notifyBtn.click({ timeout: 3_000 });
      await page.waitForTimeout(300);
    }
  } catch {
    // không có popup thông báo, bỏ qua
  }

  // 3. Vòng lặp generic — xử lý mọi modal.show còn lại
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

    if (!dismissed) break; // không còn modal nào visible
  }

  // 4. Nếu backdrop vẫn còn, nhấn Escape để giải phóng trang
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
    await page.goto('/dangnhap', { waitUntil: 'domcontentloaded', timeout: 15_000 });

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

    await page
      .waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 15_000 })
      .catch(() => {
        console.warn(`[globalSetup] ⚠ ${label}: login có thể chưa thành công – vẫn lưu state`);
      });

    // ── Dismiss popup "Thay đổi mật khẩu" / "Xác thực" xuất hiện sau login ─
    await dismissAllModals(page);
    // ─────────────────────────────────────────────────────────────────────────

    await context.storageState({ path: savePath });
    console.log(`[globalSetup] ✓ ${label} → ${savePath}`);
  } finally {
    await browser.close();
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.resolve(__dirname, 'auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const headless = process.env.CI === 'true' ? true : HEADLESS;

  // Login song song cho tất cả 6 accounts
  await Promise.all(
    WORKER_ACCOUNTS.map((acc, i) =>
      loginAndSave({
        ...acc,
        savePath: authPathForWorker(i),
        headless,
      })
    )
  );

  // Giữ auth/user.json (= worker-0) để không break code cũ
  const legacyPath = path.resolve(__dirname, 'auth/user.json');
  const worker0Path = authPathForWorker(0);
  if (fs.existsSync(worker0Path)) {
    fs.copyFileSync(worker0Path, legacyPath);
    console.log(`[globalSetup] ✓ auth/user.json cập nhật từ worker-0`);
  }
}

export default globalSetup;