import type { Page, Locator } from '@playwright/test';
import { BASE_URL } from '../../config/config';

/**
 * Lớp cơ sở cho tất cả Page Object.
 *
 * KHÔNG import PopupComponent ở đây để tránh circular dependency:
 *   BasePage ← PopupComponent extends BasePage
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /**
   * Goto URL + tự dismiss popup sau khi load.
   *
   * waitUntil: 'commit' (thay vì 'domcontentloaded') — một số trang
   * (VD: /hoi-dap) đã ghi nhận trường hợp sự kiện 'domcontentloaded'
   * không bao giờ fire dù nội dung trang đã render đầy đủ (nghi do
   * script nền/kết nối third-party — VD request gtag/js bị "canceled" —
   * khiến trạng thái load của trang không "settle" được). 'commit' chỉ
   * đợi navigation được commit (response bắt đầu), không phụ thuộc vào
   * lifecycle event có thể bị treo này, nên tránh được timeout giả.
   *
   * Sau khi commit, vẫn thử đợi 'domcontentloaded' thêm một khoảng ngắn
   * (best-effort, KHÔNG throw nếu quá timeout) để _dismissPopupsInline()
   * có cơ hội chạy trên DOM đã settle trong trường hợp bình thường.
   * Readiness thật sự của từng trang nên do page object tự
   * waitForSelector() phần tử đặc trưng (VD: HoiDapPage.open() đợi
   * QUESTION_CARD) — đây mới là gate đáng tin cậy nhất.
   *
   * timeout tăng lên 45_000 (từ 20_000) vì olm.vn production
   * thường load 20-40s trên các trang nặng (/thongtin, /gio-hang, /hoi-dap).
   * Có thể override qua env NAV_TIMEOUT (đơn vị ms).
   */
  async navigateTo(url: string): Promise<void> {
    const timeout = Number(process.env.NAV_TIMEOUT ?? 45_000);

    await this.page.goto(url, { waitUntil: 'commit', timeout });

    // Best-effort: cho DOM một khoảng thời gian giới hạn để settle trước
    // khi chạy popup-dismiss, nhưng không để bước này làm navigateTo() fail.
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});

    await this._dismissPopupsInline();
    await this.dismissAllNotifications();
  }

  async goHome(): Promise<void> {
    await this.navigateTo(BASE_URL);
  }

  // ── Element helpers ───────────────────────────────────────────────────────

  /**
   * Thử lần lượt các selector; trả về Locator đầu tiên visible trong timeout.
   * Nhận cả string[] (array) lẫn string (selector đơn).
   *
   * QUAN TRỌNG: nếu một selector khớp NHIỀU element (VD: logo desktop +
   * logo mobile cùng dùng alt="OLM Logo", ẩn/hiện qua CSS responsive
   * tw-hidden/lg:tw-hidden), hàm này duyệt qua TỪNG element khớp thay vì
   * chỉ lấy .first() — tránh false negative khi element đầu tiên trong DOM
   * bị ẩn ở viewport hiện tại nhưng một element khác cùng selector vẫn
   * đang hiển thị.
   * (Bug thực tế: test "Logo phải hiển thị ở 768px" fail vì .first() luôn
   * lấy trúng <img> logo desktop — bị tw-hidden dưới breakpoint lg — dù
   * <img> logo mobile ngay cạnh đó đang hiển thị bình thường.)
   *
   * Trả về null nếu không tìm thấy element nào visible trong toàn bộ
   * danh sách selector, sau khi đã đợi tối đa timeoutSec.
   */
  async findVisible(selectors: string | string[], timeoutSec = 5): Promise<Locator | null> {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    const deadline = Date.now() + timeoutSec * 1_000;

    while (true) {
      for (const sel of list) {
        try {
          const loc = this.page.locator(sel);
          const count = await loc.count();
          for (let i = 0; i < count; i++) {
            const el = loc.nth(i);
            if (await el.isVisible().catch(() => false)) {
              return el;
            }
          }
        } catch {
          // selector không khớp hoặc lỗi tạm thời, thử selector kế tiếp
        }
      }

      if (Date.now() >= deadline) break;
      await this.page.waitForTimeout(200); // poll nhẹ, tránh spin CPU
    }

    return null;
  }

  /**
   * Trả về danh sách tất cả Locator khớp selector (đã render trên DOM,
   * không lọc theo visible). Dùng khi cần lặp qua nhiều element cùng lúc,
   * VD: lấy danh sách link sidebar lớp học trong HocBaiPage.getGradeLinks().
   */
  async findElements(selector: string, timeoutSec = 5): Promise<Locator[]> {
    const loc = this.page.locator(selector);
    try {
      await loc.first().waitFor({ state: 'attached', timeout: timeoutSec * 1_000 });
    } catch {
      return [];
    }
    return loc.all();
  }

  /**
   * Scroll xuống đáy trang nhiều lần để trigger lazy-load (infinite scroll).
   * Dừng sớm nếu scrollHeight không tăng thêm nữa (đã chạm đáy thật).
   */
  async scrollToBottom(maxScrolls = 10, pauseMs = 400): Promise<void> {
    let lastHeight = 0;
    for (let i = 0; i < maxScrolls; i++) {
      const height = await this.page.evaluate(() => document.body.scrollHeight);
      if (height === lastHeight && i > 0) break; // đã chạm đáy, không tăng thêm
      lastHeight = height;

      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.waitForTimeout(pauseMs);
    }
  }

  /** Click qua force để tránh bị che bởi overlay/header cố định */
  async jsClick(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click({ force: true }).catch(async () => {
      await this.page.evaluate(
        (el) => (el as HTMLElement).click(),
        await locator.elementHandle()
      );
    });
  }

  /**
   * Clear field và type giá trị mới.
   * Dùng fill() của Playwright (xóa trước, gõ sau) — an toàn hơn triple-click.
   */
  async jsClearAndType(locator: Locator, value: string): Promise<void> {
    await locator.click();
    await locator.fill(value);
  }

  /** Wait an toàn – không throw nếu quá timeout */
  async waitForSelector(selector: string, timeoutMs = 5_000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  /** Kiểm tra element có visible không (không throw) */
  async isElementVisible(selector: string, timeoutMs = 3_000): Promise<boolean> {
    try {
      return await this.page.locator(selector).first().isVisible({ timeout: timeoutMs });
    } catch {
      return false;
    }
  }

  // ── URL / title helpers ───────────────────────────────────────────────────

  getCurrentUrl(): string {
    return this.page.url();
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  // ── Internal popup dismiss ────────────────────────────────────────────────

  /**
   * Public wrapper cho _dismissPopupsInline().
   * Dùng ở những nơi không đi qua navigateTo() (VD: ngay sau khi submit
   * form login, popup "Thay đổi mật khẩu"/"Xác thực" xuất hiện mà KHÔNG
   * kèm theo page.goto() mới nên navigateTo() không tự kích hoạt dismiss).
   */
  async dismissPopups(): Promise<void> {
    await this._dismissPopupsInline();
    await this.dismissAllNotifications();
  }

  /**
   * Dọn TẤT CẢ banner/modal thông báo, xác thực, quảng cáo… có thể che
   * giao diện hoặc chặn click — kể cả các modal custom (Tailwind) KHÔNG
   * dùng class ".modal"/"role=dialog" như _dismissPopupsInline() yêu cầu.
   *
   * VD: modal "Xác thực" (xác thực Email/SĐT) hiện ngay sau khi đăng nhập
   * thành công — chỉ có nút đóng dạng `<span>×</span>` lồng trong một thẻ
   * tuỳ ý, không khớp selector `.modal.show`/`[role="dialog"]`.
   *
   * Chạy lặp tối đa `maxRounds` vòng, mỗi vòng thử lần lượt các kiểu nút
   * đóng phổ biến (ưu tiên "Không hiện lại nữa"/"Bỏ qua" trước vì các nút
   * này thường lưu cờ để KHÔNG hiện lại ở các bước/test sau, hiệu quả hơn
   * nút "×" chỉ đóng tạm thời). Dừng sớm nếu một vòng không đóng được gì.
   *
   * Public — gọi trực tiếp từ bất kỳ test spec / page object nào trước khi
   * assert, không chỉ trong luồng login.
   */
  async dismissAllNotifications(maxRounds = 5): Promise<void> {
    const dismissSelectors = [
      // Ưu tiên các nút "đóng vĩnh viễn" trước — set cờ không hiện lại
      'button:has-text("Không hiện lại nữa")',
      'a:has-text("Không hiện lại nữa")',
      'button:has-text("Để sau")',
      'button:has-text("Bỏ qua")',
      'a:has-text("Bỏ qua")',
      'button:has-text("Đóng")',
      // Icon đóng dạng "×"/"✕" — KHÔNG giới hạn trong <button> vì modal
      // custom (tailwind) thường dùng <span>/<div> có onclick thay vì <button>
      '[aria-label="Close" i]',
      '.close', '.btn-close', '[class*="close-btn"]', '[class*="icon-close"]',
      'span:has-text("×")', 'div[role="button"]:has-text("×")', 'button:has-text("×")',
      'span:has-text("✕")', 'button:has-text("✕")',
    ];

    for (let round = 0; round < maxRounds; round++) {
      let dismissedAny = false;
      for (const sel of dismissSelectors) {
        try {
          const el = this.page.locator(sel).first();
          if (await el.isVisible({ timeout: 800 })) {
            await el.click({ force: true, timeout: 2_000 });
            await this.page.waitForTimeout(350);
            dismissedAny = true;
          }
        } catch {
          // selector không khớp hoặc không click được, thử selector kế tiếp
        }
      }
      if (!dismissedAny) break; // đã dọn sạch, dừng sớm
    }

    // Dọn nốt backdrop còn sót (bootstrap hoặc custom)
    try {
      const backdrop = this.page.locator('.modal-backdrop, [class*="backdrop"]').first();
      if (await backdrop.isVisible({ timeout: 500 })) {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch {
      // không có backdrop
    }
  }

  /**
   * Dismiss tất cả popup/modal theo đúng thứ tự layer.
   *
   * Thứ tự:
   *   1. Popup "Thay đổi mật khẩu" (z-index cao nhất — phải đóng trước)
   *   2. Popup "Xác thực" (email/SĐT)
   *   2b. Modal "Xác thực tài khoản" theo id cố định (#modal-form-active-mail)
   *   3. Popup "Đăng ký nhận thông báo" (#later-noti)
   *   4. Các modal VIP / thông báo còn lại
   *   5. Backdrop còn sót
   */
  private async _dismissPopupsInline(): Promise<void> {

    // ── 1. Popup "Thay đổi mật khẩu" ────────────────────────────────────────
    try {
      const changePassModal = this.page.locator(
        '.modal.show, [class*="modal"][style*="display: block"], [role="dialog"]'
      ).filter({ hasText: 'Thay đổi mật khẩu' }).first();

      if (await changePassModal.isVisible({ timeout: 3_000 })) {
        const closeSelectors = [
          'button.close', 'button[aria-label="Close"]',
          '.modal-header .close', '[data-dismiss="modal"]',
          'button.btn-close', 'button:has-text("×")', 'button:has-text("✕")',
        ];
        let closed = false;
        for (const sel of closeSelectors) {
          try {
            const btn = changePassModal.locator(sel).first();
            if (await btn.isVisible({ timeout: 1_000 })) {
              await btn.click({ force: true, timeout: 3_000 });
              await this.page.waitForTimeout(500);
              closed = true;
              break;
            }
          } catch { /* thử tiếp */ }
        }
        if (!closed) {
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(500);
        }
      }
    } catch { /* không có popup Thay đổi mật khẩu */ }

    // ── 2. Popup "Xác thực" ──────────────────────────────────────────────────
    try {
      const xacThucModal = this.page.locator(
        '.modal.show, [class*="modal"][style*="display: block"], [role="dialog"]'
      ).filter({ hasText: 'Xác thực' }).first();

      if (await xacThucModal.isVisible({ timeout: 3_000 })) {
        const closeSelectors = [
          'button.close', 'button[aria-label="Close"]',
          '.modal-header .close', '[data-dismiss="modal"]',
          'button.btn-close', 'button:has-text("×")', 'button:has-text("✕")',
        ];
        let closed = false;
        for (const sel of closeSelectors) {
          try {
            const btn = xacThucModal.locator(sel).first();
            if (await btn.isVisible({ timeout: 1_000 })) {
              await btn.click({ force: true, timeout: 3_000 });
              await this.page.waitForTimeout(500);
              closed = true;
              break;
            }
          } catch { /* thử tiếp */ }
        }
        if (!closed) {
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(500);
        }
      }
    } catch { /* không có popup Xác thực */ }

    // ── 2b. Modal "Xác thực tài khoản" theo id cố định (#modal-form-active-mail) ─
    // Modal này thường xuất hiện ở /gio-hang, /dangnhap... và đứng chắn
    // pointer events trên các nút bên dưới (VD: nút "Đăng ký" chọn gói VIP)
    // ngay cả khi không chứa text "Xác thực" (đôi khi chỉ có icon/hình).
    try {
      const activeMailModal = this.page.locator('#modal-form-active-mail').first();
      if (await activeMailModal.isVisible({ timeout: 2_000 })) {
        const closeSelectors = [
          'button.close', 'button[aria-label="Close"]',
          '.modal-header .close', '[data-dismiss="modal"]',
          'button.btn-close', 'button:has-text("×")', 'button:has-text("✕")',
        ];
        let closed = false;
        for (const sel of closeSelectors) {
          try {
            const btn = activeMailModal.locator(sel).first();
            if (await btn.isVisible({ timeout: 1_000 })) {
              await btn.click({ force: true, timeout: 3_000 });
              await this.page.waitForTimeout(500);
              closed = true;
              break;
            }
          } catch { /* thử tiếp */ }
        }
        if (!closed) {
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(500);
        }
      }
    } catch { /* không có #modal-form-active-mail */ }

    // ── 3. Popup "Đăng ký nhận thông báo" (#later-noti) ─────────────────────
    try {
      const notifyPopup = this.page.locator('#dialogConfirmNotification').first();
      if (await notifyPopup.isVisible({ timeout: 3_000 })) {
        const btn = this.page.locator('#later-noti').first();
        await btn.click({ timeout: 4_000 });
        await this.page.waitForTimeout(400);
      }
    } catch { /* không có popup thông báo */ }

    // ── 4. Các modal show còn lại ────────────────────────────────────────────
    for (let attempt = 0; attempt < 3; attempt++) {
      let dismissed = false;
      const closeSelectors = [
        '.modal.show .modal-header .close',
        '.modal.show [data-dismiss="modal"]',
        '.modal.show .btn-close',
        '.modal.show button[aria-label="Close"]',
        '.modal.show button.close',
      ];
      for (const sel of closeSelectors) {
        try {
          const btn = this.page.locator(sel).first();
          if (await btn.isVisible({ timeout: 1_000 })) {
            await btn.click({ force: true, timeout: 3_000 });
            await this.page.waitForTimeout(400);
            dismissed = true;
            break;
          }
        } catch { /* không có */ }
      }
      if (!dismissed) break;
    }

    // ── 5. Backdrop còn sót ──────────────────────────────────────────────────
    try {
      const backdrop = this.page.locator('.modal-backdrop').first();
      if (await backdrop.isVisible({ timeout: 1_000 })) {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
      }
    } catch { /* không có backdrop */ }
  }
}