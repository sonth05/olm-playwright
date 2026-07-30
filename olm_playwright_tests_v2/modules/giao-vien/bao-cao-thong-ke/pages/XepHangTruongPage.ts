import { BasePage } from '@core/shared-pages/BasePage';
import { XEP_HANG_TRUONG_URL } from '@config/config';
import type { Page } from '@playwright/test';

/**
 * Page Object — Xếp hạng trong trường (3.4).
 * URL: {BASE_URL}/truong-hoc/{slug}/xep-hang-thi-dua
 * (slug 'xep-hang-thi-dua' suy ra từ tiêu đề "Xếp hạng thi đua" hiển thị
 * trong trang — xem ghi chú chi tiết ở XEP_HANG_TRUONG_URL trong config.ts,
 * CHƯA verify trực tiếp bằng trình duyệt thật).
 *
 * Trang React (container #react-view-ranking-school), dùng chung component
 * với trang xếp hạng thi đua bên học sinh — chỉ khác `filter.id_group` /
 * props truyền vào (phía trường luôn có `id_school` cố định theo SCHOOL_SLUG).
 * Gồm:
 *  - Banner đầu trang: nhãn "Xếp hạng thi đua" + tên trường.
 *  - 4 tab kỳ xem: Theo tuần / Theo tháng / Theo học kỳ / Theo năm học
 *    (Radix Tabs — `id`/`aria-controls` sinh động theo dạng `radix-:rN:...`
 *    nên các selector bám theo `role="tab"` + text, KHÔNG bám id).
 *  - Select "khoảng thời gian cụ thể" trong kỳ đang chọn (VD: "Tuần này -
 *    29/2026") — Radix Select, trigger là `role="combobox"`.
 *  - Select "phạm vi" (VD: "Toàn trường" hoặc theo từng lớp) — cũng
 *    `role="combobox"`, đứng ngay sau select thời gian.
 *  - Bảng xếp hạng — có empty-state riêng (`data-slot="empty"`) khi kỳ/
 *    phạm vi đang chọn chưa có dữ liệu (trường hợp phổ biến với trường mới).
 *
 * LƯU Ý: vì cả 2 dropdown đều là Radix Select (không phải <select> gốc như
 * các trang bai-giao/phan-cong-giang-day), selectOption() KHÔNG dùng được —
 * phải click mở rồi chọn item theo text, tương tự thao tác picker thủ công
 * đã ghi chú ở PhanCongGiangDayPage.openChooseHomeroomClass().
 *
 * Dùng kết hợp:
 *   const page = new XepHangTruongPage(p);
 *   await page.open();
 *   await page.switchPeriodTab(RankingPeriod.THEO_THANG);
 *   const empty = await page.isEmptyState();
 */

/** 4 tab kỳ xem xếp hạng */
export enum RankingPeriod {
  THEO_TUAN = 'Theo tuần',
  THEO_THANG = 'Theo tháng',
  THEO_HOC_KY = 'Theo học kỳ',
  THEO_NAM_HOC = 'Theo năm học',
}

export class XepHangTruongPage extends BasePage {
  static readonly URL = XEP_HANG_TRUONG_URL;

  static readonly CONTAINER = '#react-view-ranking-school';
  static readonly BANNER_LABEL = `${XepHangTruongPage.CONTAINER} h1:has-text("Xếp hạng thi đua")`;
  static readonly BANNER_SCHOOL_NAME = `${XepHangTruongPage.CONTAINER} p.tw-text-white`;

  // ── Tab kỳ xem ───────────────────────────────────────────────────────
  static readonly PERIOD_TAB_LIST = `${XepHangTruongPage.CONTAINER} [role="tablist"]`;
  static readonly PERIOD_TAB = (period: RankingPeriod): string =>
    `${XepHangTruongPage.PERIOD_TAB_LIST} [role="tab"]:has-text("${period}")`;
  static readonly PERIOD_TAB_ACTIVE = `${XepHangTruongPage.PERIOD_TAB_LIST} [role="tab"][data-state="active"]`;

  // ── 2 select (thời gian cụ thể + phạm vi) ───────────────────────────
  static readonly COMBOBOX_TRIGGER = `${XepHangTruongPage.CONTAINER} button[role="combobox"]`;
  static readonly TIME_RANGE_TRIGGER = `${XepHangTruongPage.COMBOBOX_TRIGGER} >> nth=0`;
  static readonly SCOPE_TRIGGER = `${XepHangTruongPage.COMBOBOX_TRIGGER} >> nth=1`;
  /** Danh sách item khi 1 trong 2 combobox đang mở (Radix Select portal ra ngoài container gốc) */
  static readonly OPEN_LISTBOX_ITEM = '[role="option"]';

  // ── Bảng xếp hạng / empty-state ──────────────────────────────────────
  static readonly EMPTY_STATE = `${XepHangTruongPage.CONTAINER} [data-slot="empty"]`;
  static readonly EMPTY_STATE_TITLE = `${XepHangTruongPage.EMPTY_STATE} [data-slot="empty-title"]`;
  static readonly RANKING_TABLE = `${XepHangTruongPage.CONTAINER} table`;
  static readonly RANKING_TABLE_ROWS = `${XepHangTruongPage.RANKING_TABLE} tbody tr`;

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(XepHangTruongPage.URL);
    await this.waitForSelector(XepHangTruongPage.CONTAINER, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('xep-hang');
  }

  async getSchoolNameText(): Promise<string> {
    const el = await this.findVisible([XepHangTruongPage.BANNER_SCHOOL_NAME], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // ==================================================================
  // Tab kỳ xem
  // ==================================================================

  async switchPeriodTab(period: RankingPeriod): Promise<this> {
    await this.page.locator(XepHangTruongPage.PERIOD_TAB(period)).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getActivePeriodTabText(): Promise<string> {
    const el = this.page.locator(XepHangTruongPage.PERIOD_TAB_ACTIVE).first();
    return ((await el.textContent()) ?? '').trim();
  }

  // ==================================================================
  // 2 select (thời gian cụ thể + phạm vi)
  // ==================================================================

  /** Nhãn khoảng thời gian cụ thể đang chọn, VD: "Tuần này - 29/2026" */
  async getSelectedTimeRangeText(): Promise<string> {
    const el = this.page.locator(XepHangTruongPage.TIME_RANGE_TRIGGER).first();
    return ((await el.textContent()) ?? '').trim();
  }

  /** Nhãn phạm vi đang chọn, VD: "Toàn trường" hoặc tên 1 lớp cụ thể */
  async getSelectedScopeText(): Promise<string> {
    const el = this.page.locator(XepHangTruongPage.SCOPE_TRIGGER).first();
    return ((await el.textContent()) ?? '').trim();
  }

  /** Mở dropdown "thời gian cụ thể" rồi chọn 1 item theo text hiển thị (Radix Select, portal ngoài container) */
  async selectTimeRange(labelText: string): Promise<this> {
    await this.page.locator(XepHangTruongPage.TIME_RANGE_TRIGGER).click();
    await this.page.locator(XepHangTruongPage.OPEN_LISTBOX_ITEM).filter({ hasText: labelText }).first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Mở dropdown "phạm vi" rồi chọn 1 item theo text hiển thị (VD: đổi sang 1 lớp cụ thể) */
  async selectScope(labelText: string): Promise<this> {
    await this.page.locator(XepHangTruongPage.SCOPE_TRIGGER).click();
    await this.page.locator(XepHangTruongPage.OPEN_LISTBOX_ITEM).filter({ hasText: labelText }).first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Bảng xếp hạng / empty-state
  // ==================================================================

  async isEmptyState(): Promise<boolean> {
    return (await this.page.locator(XepHangTruongPage.EMPTY_STATE).count()) > 0;
  }

  async getEmptyStateMessage(): Promise<string> {
    const el = this.page.locator(XepHangTruongPage.EMPTY_STATE_TITLE).first();
    if ((await el.count()) === 0) return '';
    return ((await el.textContent()) ?? '').trim();
  }

  /** Dữ liệu bảng xếp hạng — mảng rỗng nếu đang ở trạng thái empty-state (VD: kỳ/phạm vi chưa có dữ liệu) */
  async getRankingRows(): Promise<string[][]> {
    if (await this.isEmptyState()) return [];
    const rows = this.page.locator(XepHangTruongPage.RANKING_TABLE_ROWS);
    const count = await rows.count();
    const result: string[][] = [];
    for (let i = 0; i < count; i++) {
      const cells = await rows.nth(i).locator('td').allTextContents();
      result.push(cells.map((c) => c.trim()));
    }
    return result;
  }
}