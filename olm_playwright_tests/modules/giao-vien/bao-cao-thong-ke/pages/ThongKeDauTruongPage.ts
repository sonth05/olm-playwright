import { BasePage } from '@core/shared-pages/BasePage';
import { DAU_TRUONG_URL } from '@config/config';
import type { BrowserContext, Page } from '@playwright/test';

/**
 * Page Object — Thống kê đấu trường (3.3).
 * Khác với các trang 3.1/3.4/3.7 còn lại trong module này: mục sidebar
 * "Thống kê Đấu trường" KHÔNG ở lại olm.vn mà điều hướng sang MIỀN KHÁC
 * (dautruong.olm.vn — "Đấu trường OLM"), thường mở ở TAB MỚI (target="_blank").
 *
 * Nguồn thông tin cho page object này CHỈ LÀ ẢNH CHỤP MÀN HÌNH trang đích
 * (dautruong.olm.vn), KHÔNG có HTML thực tế như 3 trang còn lại — vì vậy:
 *  - Class/id cụ thể của DOM CHƯA được xác nhận, các selector dưới đây dùng
 *    role/text (ổn định hơn khi đoán DOM) thay vì bám class suy đoán.
 *  - Selector của MỤC SIDEBAR "Thống kê Đấu trường" bên trong olm.vn (nơi
 *    bấm để mở trang này) cũng CHƯA có trong phạm vi HTML đã khảo sát —
 *    openFromSidebar() dưới đây là best-effort (bấm theo text), cần verify
 *    lại selector thật khi có điều kiện truy cập trình duyệt + xem DOM.
 *
 * Trang đích (dautruong.olm.vn) hiển thị:
 *  - Header: dropdown "Hỗ trợ", logo "Thám hiểm vũ trụ", nút "Đăng ký"/"Đăng nhập".
 *  - Heading "Thử thách đang diễn ra".
 *  - 3 tab lọc theo khối: Tất cả / Khối Tiểu học / Khối THCS.
 *  - Danh sách card thử thách (VD: "Đấu trường OLM lớp 1...", "...lớp 2...").
 *
 * Dùng kết hợp:
 *   const page = new ThongKeDauTruongPage(p);
 *   await page.openDirect();               // mở thẳng bằng URL, ổn định nhất
 *   const titles = await page.getChallengeTitles();
 *
 * Hoặc mô phỏng đúng luồng người dùng thật (bấm từ sidebar olm.vn, hứng tab mới):
 *   const dauTruongPage = await ThongKeDauTruongPage.openFromSidebar(context, teacherPage);
 */

/** 3 tab lọc thử thách theo khối lớp */
export enum ChallengeGradeTab {
  TAT_CA = 'Tất cả',
  KHOI_TIEU_HOC = 'Khối Tiểu học',
  KHOI_THCS = 'Khối THCS',
}

export class ThongKeDauTruongPage extends BasePage {
  static readonly URL = DAU_TRUONG_URL;

  // ── Sidebar bên olm.vn (mục mở trang này) — CHƯA xác nhận selector thật, chỉ đoán theo text ──
  static readonly SIDEBAR_LINK_TEXT = 'Thống kê Đấu trường';

  // ── Header trang đích ────────────────────────────────────────────────
  static readonly LOGO = 'text=Thám hiểm vũ trụ';
  static readonly DANG_KY_BTN = 'button:has-text("Đăng ký"), a:has-text("Đăng ký")';
  static readonly DANG_NHAP_BTN = 'button:has-text("Đăng nhập"), a:has-text("Đăng nhập")';

  // ── Nội dung "Thử thách đang diễn ra" ────────────────────────────────
  static readonly PAGE_HEADING = 'h1:has-text("Thử thách đang diễn ra"), h2:has-text("Thử thách đang diễn ra")';
  static readonly GRADE_TAB = (tab: ChallengeGradeTab): string => `text="${tab}"`;
  static readonly CHALLENGE_CARD = '[class*="challenge"], [class*="card"]';
  static readonly CHALLENGE_CARD_BADGE = 'text=Thử thách OLM';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // Điều hướng
  // ==================================================================

  /** Mở thẳng dautruong.olm.vn bằng URL — cách ổn định nhất, KHÔNG phụ thuộc selector sidebar chưa xác nhận */
  async openDirect(): Promise<this> {
    await this.navigateTo(ThongKeDauTruongPage.URL);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('dautruong.olm.vn');
  }

  /**
   * Mô phỏng đúng luồng người dùng thật: bấm mục "Thống kê Đấu trường" trong
   * sidebar quản trị trường (olm.vn) và hứng tab mới mở ra (target="_blank").
   * BEST-EFFORT: selector sidebar chỉ đoán theo text hiển thị (xem ghi chú
   * đầu file) — nếu sidebar thật không khớp, dùng openDirect() thay thế.
   *
   * @param context BrowserContext hiện tại (dùng để bắt sự kiện 'page' — tab mới)
   * @param originPage Page đang đứng ở trang quản trị trường (nơi có sidebar)
   */
  static async openFromSidebar(context: BrowserContext, originPage: Page): Promise<ThongKeDauTruongPage> {
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 15_000 }),
      originPage.locator(`text=${ThongKeDauTruongPage.SIDEBAR_LINK_TEXT}`).first().click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return new ThongKeDauTruongPage(newPage);
  }

  // ==================================================================
  // Nội dung trang
  // ==================================================================

  async getHeadingText(): Promise<string> {
    const el = await this.findVisible([ThongKeDauTruongPage.PAGE_HEADING], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async switchGradeTab(tab: ChallengeGradeTab): Promise<this> {
    await this.page.locator(ThongKeDauTruongPage.GRADE_TAB(tab)).first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getChallengeCardCount(): Promise<number> {
    return this.page.locator(ThongKeDauTruongPage.CHALLENGE_CARD).count();
  }

  /** Tiêu đề các card thử thách đang hiển thị, VD: ["Đấu trường OLM lớp 1 ...", "Đấu trường OLM lớp 2 ..."] */
  async getChallengeTitles(): Promise<string[]> {
    const cards = this.page.locator(ThongKeDauTruongPage.CHALLENGE_CARD);
    const count = await cards.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await cards.nth(i).textContent()) ?? '';
      titles.push(text.trim().replace(/\s+/g, ' '));
    }
    return titles;
  }

  async isLoggedOut(): Promise<boolean> {
    return (await this.page.locator(ThongKeDauTruongPage.DANG_NHAP_BTN).count()) > 0;
  }
}