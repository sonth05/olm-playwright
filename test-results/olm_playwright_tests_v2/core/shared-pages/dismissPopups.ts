// core/shared-pages/dismissPopups.ts
//
// Module BỊ THIẾU trong repo gốc — được import ở nhiều page object
// (BoSuuTapHocLieuPage.ts, HocLieuCuaToiPage.ts, HocLieuDaXoaPage.ts,
// HocLieuDuocChiaSeCaNhanPage.ts ở v1; Basehoclieuv2page.ts,
// Createhoclieumenu.ts, Hoclieucuatoiv2page.ts ở v2) nhưng file này
// không tồn tại trong bất kỳ commit nào của repo (lỗi TS2307 "Cannot
// find module").
//
// Nội dung dưới đây tái hiện lại logic dismiss-popup tương tự
// BasePage._dismissPopupsInline()/dismissAllNotifications(), nhưng ở
// dạng hàm thuần (nhận `page`/`locator` làm tham số) để dùng được cả ở
// những nơi KHÔNG có sẵn instance BasePage (VD: helper thuần, hoặc các
// class không extends BasePage).
//
// Đặt file này tại: core/shared-pages/dismissPopups.ts (giống hệt cho cả
// olm_playwright_tests_v1 và olm_playwright_tests_v2).

import type { Page, Locator } from '@playwright/test';
import {
  LOGIN_USERNAME_SELECTORS,
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
} from '../../config/constants';

/**
 * Kiểm tra xem hiện có popup/modal nào đang che màn hình hay không
 * (không throw). Dùng bởi waitForWithPopupWatchdog() để quyết định có
 * cần thử tắt popup trước khi kiểm tra lại điều kiện chính hay không.
 */
export async function hasBlockingPopup(page: Page, timeoutMs = 300): Promise<boolean> {
  const selectors = [
    '.modal.show',
    '[class*="modal"][style*="display: block"]',
    '[role="dialog"]',
    '#modal-form-active-mail',
    '#dialogConfirmNotification',
    '.modal-backdrop',
  ];

  for (const sel of selectors) {
    try {
      if (await page.locator(sel).first().isVisible({ timeout: timeoutMs })) {
        return true;
      }
    } catch {
      // selector không khớp hoặc lỗi tạm thời — thử selector kế tiếp
    }
  }
  return false;
}

/**
 * Đóng tất cả popup/modal hiện có trên trang (banner đăng ký thông báo,
 * modal xác thực, modal thay đổi mật khẩu, quảng cáo...).
 *
 * Dùng ở những nơi thao tác KHÔNG đi qua BasePage.navigateTo() (VD: ngay
 * sau khi submit form, sau khi mở dropdown) nên cơ chế dismiss tự động
 * trong navigateTo() không được kích hoạt.
 */
export async function dismissPopups(page: Page): Promise<void> {
  const closeSelectors = [
    // Ưu tiên các nút "đóng vĩnh viễn" trước — set cờ không hiện lại
    'button:has-text("Không hiện lại nữa")',
    'a:has-text("Không hiện lại nữa")',
    'button:has-text("Để sau")',
    'button:has-text("Bỏ qua")',
    'a:has-text("Bỏ qua")',
    'button:has-text("Đóng")',
    // Icon đóng dạng "×"/"✕" — không giới hạn trong <button> vì modal
    // custom (tailwind) thường dùng <span>/<div> có onclick thay vì <button>
    '[aria-label="Close" i]',
    '.close', '.btn-close', '[class*="close-btn"]', '[class*="icon-close"]',
    'span:has-text("×")', 'div[role="button"]:has-text("×")', 'button:has-text("×")',
    'span:has-text("✕")', 'button:has-text("✕")',
  ];

  for (let round = 0; round < 5; round++) {
    let dismissedAny = false;
    for (const sel of closeSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 800 })) {
          await el.click({ force: true, timeout: 2_000 });
          await page.waitForTimeout(300);
          dismissedAny = true;
        }
      } catch {
        // selector không khớp hoặc không click được — thử selector kế tiếp
      }
    }
    if (!dismissedAny) break; // đã dọn sạch, dừng sớm
  }

  // Dọn nốt backdrop còn sót (bootstrap hoặc custom)
  try {
    const backdrop = page.locator('.modal-backdrop, [class*="backdrop"]').first();
    if (await backdrop.isVisible({ timeout: 500 })) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  } catch {
    // không có backdrop
  }
}

// ─── Khôi phục phiên đăng nhập (session recovery) ──────────────────────────
//
// Nhiều lỗi test trước đây thực chất KHÔNG phải do popup hay do trang tải
// chậm: giữa chừng test, server thu hồi/hết hạn session (dù file
// storageState còn "mới" theo timestamp) → mọi navigate tiếp theo bị
// redirect thẳng về /dangnhap. Vì dismissPopups() không nhận diện được
// trường hợp này (form đăng nhập không phải "popup"), các hàm gọi nó cứ lặp
// lại dismiss vô ích rồi timeout, sinh lỗi khó hiểu như "heading không hiển
// thị"/"table không hiển thị" dù nguyên nhân gốc là bị văng khỏi phiên đăng
// nhập.
//
// Cơ chế dưới đây bổ sung 1 lượt kiểm tra + khôi phục "lần 2" trước khi coi
// là lỗi thật:
//   1. Nếu đang ở /dangnhap: dismissPopups() thêm 1 lượt (phòng trường hợp
//      1 popup đang che chính form đăng nhập).
//   2. Nếu SAU ĐÓ vẫn còn ở /dangnhap: đây là mất phiên thật -> tự điền lại
//      form và đăng nhập bằng tài khoản khôi phục (RECOVERY_USERNAME/
//      RECOVERY_PASSWORD, mặc định fallback OLM_SCHOOL_USERNAME/PASSWORD —
//      cùng tài khoản role.fixture.ts đang dùng cho teacherPage).
// Không throw ở đây — trả về true/false để caller (waitForWithPopupWatchdog,
// page.goto() của từng page object) tự quyết định có thử lại thao tác gốc
// hay để lỗi timeout ban đầu nổi lên.

/** Kiểm tra (không throw) trang hiện tại có đang ở màn đăng nhập hay không. */
export function isOnLoginPage(page: Page): boolean {
  return page.url().includes('/dangnhap');
}

async function fillFirstVisible(page: Page, selectors: string[], value: string): Promise<boolean> {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await el.fill(value).catch(() => {});
      return true;
    }
  }
  return false;
}

async function clickFirstVisible(page: Page, selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await el.click().catch(() => {});
      return true;
    }
  }
  return false;
}

/** Điền + submit form đăng nhập bằng tài khoản khôi phục, đợi rời /dangnhap. */
async function attemptRelogin(page: Page): Promise<boolean> {
  const username = process.env.RECOVERY_USERNAME ?? process.env.OLM_SCHOOL_USERNAME;
  const password = process.env.RECOVERY_PASSWORD ?? process.env.OLM_SCHOOL_PASSWORD;

  if (!username || !password) {
    console.warn(
      '[sessionRecovery] Thiếu RECOVERY_USERNAME/RECOVERY_PASSWORD (hoặc ' +
      'OLM_SCHOOL_USERNAME/PASSWORD dự phòng) trong biến môi trường — bỏ qua đăng nhập lại.'
    );
    return false;
  }

  await fillFirstVisible(page, LOGIN_USERNAME_SELECTORS, username);
  await fillFirstVisible(page, LOGIN_PASSWORD_SELECTORS, password);
  await clickFirstVisible(page, LOGIN_SUBMIT_SELECTORS);

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (!isOnLoginPage(page)) return true;
    await dismissPopups(page);
    await page.waitForTimeout(500);
  }
  return !isOnLoginPage(page);
}

/**
 * Bao quát "lần 2" khi phát hiện đang bị kẹt ở trang đăng nhập ngoài dự
 * kiến. Xem giải thích đầy đủ ở khối comment phía trên. Idempotent — gọi
 * lại khi không ở /dangnhap sẽ trả về true ngay, không làm gì thêm.
 */
export async function recoverFromLoginPage(page: Page): Promise<boolean> {
  if (!isOnLoginPage(page)) return true;

  console.warn('[sessionRecovery] Đang ở trang đăng nhập ngoài dự kiến — thử khôi phục (dismiss popup lần 2 + đăng nhập lại)...');

  await dismissPopups(page);
  if (!isOnLoginPage(page)) return true;

  const relogged = await attemptRelogin(page);
  if (relogged) {
    console.log('[sessionRecovery] Đăng nhập lại thành công — tiếp tục thao tác ban đầu.');
    await dismissPopups(page);
  } else {
    console.warn('[sessionRecovery] Không thể đăng nhập lại — trang vẫn ở /dangnhap.');
  }
  return relogged;
}

/**
 * Đợi điều kiện `check()` trả về true; nếu chưa đạt, mỗi ~2s tự động thử
 * dismissPopups() một lượt rồi kiểm tra lại — tránh trường hợp một popup
 * xuất hiện đúng lúc che mất phần tử đang chờ khiến việc chờ timeout dù
 * về bản chất trang đã sẵn sàng (chỉ là popup che khuất).
 *
 * Nếu phát hiện trang đang ở /dangnhap (mất phiên giữa chừng), thử
 * recoverFromLoginPage() một lần thay vì chỉ dismissPopups() — xem chi tiết
 * trong khối comment "Khôi phục phiên đăng nhập" phía trên.
 *
 * Throw Error nếu quá `timeoutMs` mà vẫn không đạt điều kiện.
 */
export async function waitForWithPopupWatchdog(
  page: Page,
  check: () => Promise<boolean>,
  options: { label?: string; timeoutMs?: number; intervalMs?: number } = {}
): Promise<void> {
  const { label = 'điều kiện mong đợi', timeoutMs = 20_000, intervalMs = 2_000 } = options;
  const deadline = Date.now() + timeoutMs;
  let loginRecoveryAttempted = false;

  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return;

    if (isOnLoginPage(page) && !loginRecoveryAttempted) {
      // Chỉ thử khôi phục đăng nhập 1 lần trong cả vòng đợi này — tránh lặp
      // đăng nhập liên tục nếu tài khoản khôi phục cũng không hoạt động.
      loginRecoveryAttempted = true;
      await recoverFromLoginPage(page);
    } else {
      await dismissPopups(page);
    }
    await page.waitForTimeout(intervalMs);
  }

  throw new Error(`Timeout đợi: ${label}`);
}

/**
 * Click an toàn: nếu lần click đầu bị chặn bởi popup/overlay, tự động
 * dismissPopups() rồi thử lại một lần (force: true) trước khi bỏ cuộc.
 */
export async function safeClick(page: Page, locator: Locator, timeoutMs = 10_000): Promise<void> {
  try {
    await locator.click({ timeout: timeoutMs });
  } catch {
    await dismissPopups(page);
    await locator.click({ timeout: timeoutMs, force: true });
  }
}

/**
 * Fill an toàn: nếu bị popup/overlay chặn, tự động dismissPopups() rồi
 * thử lại (click force + fill) trước khi bỏ cuộc.
 */
export async function safeFill(
  page: Page,
  locator: Locator,
  value: string,
  timeoutMs = 10_000
): Promise<void> {
  try {
    await locator.click({ timeout: timeoutMs });
    await locator.fill(value);
  } catch {
    await dismissPopups(page);
    await locator.click({ timeout: timeoutMs, force: true });
    await locator.fill(value);
  }
}