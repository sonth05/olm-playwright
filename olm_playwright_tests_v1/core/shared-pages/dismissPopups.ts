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

/**
 * Đợi điều kiện `check()` trả về true; nếu chưa đạt, mỗi ~2s tự động thử
 * dismissPopups() một lượt rồi kiểm tra lại — tránh trường hợp một popup
 * xuất hiện đúng lúc che mất phần tử đang chờ khiến việc chờ timeout dù
 * về bản chất trang đã sẵn sàng (chỉ là popup che khuất).
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

  while (Date.now() < deadline) {
    if (await check().catch(() => false)) return;
    await dismissPopups(page);
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