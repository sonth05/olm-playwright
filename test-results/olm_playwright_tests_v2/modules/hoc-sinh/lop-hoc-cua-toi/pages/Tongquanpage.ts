import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL } from '@config/config';

/**
 * Page Object — "Tổng quan" (view HỌC SINH, giao diện V2 — debug.olm.vn,
 * URL `/hoc-bai`). Đây là trang chủ mặc định sau khi học sinh đăng nhập.
 *
 * Cấu trúc trang (theo DOM thực tế đã soát):
 *   - Header chào mừng: avatar + "Xin chào <tên>" + số xu hiện có
 *   - Cột trái:
 *       + Card "Tổng quan": 3 ô Khoá học / Thành tích / Bài tập cần làm
 *       + Card "Bài tập cần làm": tối đa 1 card bài tập (preview) +
 *         link "Xem tất cả" trỏ về /bai-tap-duoc-giao — card bài tập ở
 *         đây dùng LẠI cấu trúc `.tw-olm-card-exercise` giống hệt
 *         BaiTapDuocGiaoPage/LopHocCuaToiPage nhưng KHÔNG có drawer chi
 *         tiết (chỉ là preview, click "Làm bài" đi thẳng ra bài học)
 *       + Card "Tiếp tục khoá học": empty-state khi chưa học khóa nào
 *         (ảnh minh họa + text + nút "Khám phá khoá học")
 *   - Cột phải:
 *       + Card "Thời gian học": tab Radix "Tuần này"/"Tuần trước" + biểu
 *         đồ cột (recharts) số phút học theo ngày trong tuần
 *       + Card "Xếp hạng trong khối": 2 combobox (Khối lớp / Tuần) + danh
 *         sách xếp hạng dạng `<ol>` (rỗng trong DOM mẫu — học sinh chưa
 *         có dữ liệu xếp hạng)
 *
 * LƯU Ý:
 *   - "Xếp hạng trong khối" và "Thời gian học" dùng component Radix UI
 *     (Select/Tabs) — id sinh tự động dạng `radix-:rN:-...` KHÔNG ổn định
 *     giữa các lần render, page object dưới đây tránh phụ thuộc vào các id
 *     này, chỉ dùng role/text.
 *   - Danh sách xếp hạng (`<ol>`) rỗng trong DOM mẫu — chưa rõ cấu trúc
 *     item khi có dữ liệu, cần bổ sung khi có DOM mẫu có xếp hạng thật.
 */

export const HOC_BAI_OVERVIEW_URL = `${BASE_URL}/hoc-bai`;

export type ThoiGianHocRange = 'this-week' | 'last-week';

export interface TongQuanStats {
  khoaHoc: string;
  thanhTich: string;
  baiTapCanLam: string;
}

export class HocBaiOverviewPage extends BasePage {
  // ── Header chào mừng ──────────────────────────────────────────────────────
  readonly GREETING_TEXT = 'strong:has-text("Xin chào")';
  readonly XU_VALUE = 'span:has-text("xu")';

  // ── Card "Tổng quan" ──────────────────────────────────────────────────────
  readonly TONG_QUAN_CARD = '.tw-olm-card-auth-overview:has-text("Tổng quan")';
  readonly KHOA_HOC_STAT_VALUE = 'div:has(> span:has-text("Khoá học")) span.tw-font-bold';
  readonly THANH_TICH_STAT_VALUE = 'div:has(> span:has-text("Thành tích")) span.tw-font-bold';
  readonly BAI_TAP_CAN_LAM_STAT_VALUE = 'div:has(> span:has-text("Bài tập cần làm")) span.tw-font-bold';

  // ── Card "Bài tập cần làm" (preview) ─────────────────────────────────────
  readonly BAI_TAP_CAN_LAM_CARD = '.tw-olm-card-auth-overview:has-text("Bài tập cần làm")';
  readonly BAI_TAP_XEM_TAT_CA_LINK = 'a[href="/bai-tap-duoc-giao"]:has-text("Xem tất cả")';
  readonly PREVIEW_EXERCISE_CARD = '.tw-olm-card-exercise';
  readonly PREVIEW_EXERCISE_TITLE = '.tw-olm-card-exercise h3';
  readonly PREVIEW_EXERCISE_ACTION_BTN = '.tw-olm-card-exercise button.tw-olm-btn-primary-56';

  // ── Card "Tiếp tục khoá học" ──────────────────────────────────────────────
  readonly TIEP_TUC_KHOA_HOC_CARD = '.tw-olm-card-auth-overview:has-text("Tiếp tục khoá học")';
  readonly TIEP_TUC_KHOA_HOC_EMPTY_TEXT = 'p:has-text("Bạn chưa tham gia khoá học nào của OLM")';
  readonly KHAM_PHA_KHOA_HOC_BTN = 'button:has-text("Khám phá khoá học")';

  // ── Card "Thời gian học" ─────────────────────────────────────────────────
  readonly THOI_GIAN_HOC_CARD = '.tw-olm-card-auth-overview:has-text("Thời gian học")';
  readonly thoiGianHocTab = (range: ThoiGianHocRange) =>
    range === 'this-week'
      ? 'button[role="tab"]:has-text("Tuần này")'
      : 'button[role="tab"]:has-text("Tuần trước")';
  readonly THOI_GIAN_HOC_CHART = '.tw-olm-card-auth-overview:has-text("Thời gian học") .recharts-wrapper';

  // ── Card "Xếp hạng trong khối" ────────────────────────────────────────────
  readonly XEP_HANG_CARD = '.tw-olm-card-auth-overview:has-text("Xếp hạng trong khối")';
  readonly XEP_HANG_KHOI_SELECT = '.tw-olm-card-auth-overview:has-text("Xếp hạng trong khối") button[role="combobox"]';
  readonly XEP_HANG_LIST = '.tw-olm-card-auth-overview:has-text("Xếp hạng trong khối") ol';
  readonly XEP_HANG_LIST_ITEM = '.tw-olm-card-auth-overview:has-text("Xếp hạng trong khối") ol > li';

  // ── Navigation ────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.navigateTo(HOC_BAI_OVERVIEW_URL);
    await this.waitForSelector(this.GREETING_TEXT);
  }

  // ── Header ────────────────────────────────────────────────────────────────

  async getGreetingText(): Promise<string> {
    const el = await this.findVisible(this.GREETING_TEXT);
    return ((await el?.textContent()) ?? '').trim();
  }

  async getXuAmount(): Promise<string> {
    const el = await this.findVisible(this.XU_VALUE);
    return ((await el?.textContent()) ?? '').trim();
  }

  // ── Card "Tổng quan" ──────────────────────────────────────────────────────

  async getTongQuanStats(): Promise<TongQuanStats> {
    const khoaHoc = await this._readValue(this.KHOA_HOC_STAT_VALUE);
    const thanhTich = await this._readValue(this.THANH_TICH_STAT_VALUE);
    const baiTapCanLam = await this._readValue(this.BAI_TAP_CAN_LAM_STAT_VALUE);
    return { khoaHoc, thanhTich, baiTapCanLam };
  }

  private async _readValue(selector: string): Promise<string> {
    const el = await this.findVisible(selector);
    return ((await el?.textContent()) ?? '').trim();
  }

  // ── Card "Bài tập cần làm" ────────────────────────────────────────────────

  async getPreviewExerciseCount(): Promise<number> {
    return this.page.locator(`${this.BAI_TAP_CAN_LAM_CARD} ${this.PREVIEW_EXERCISE_CARD}`).count();
  }

  async getPreviewExerciseTitle(): Promise<string> {
    const el = await this.findVisible(`${this.BAI_TAP_CAN_LAM_CARD} ${this.PREVIEW_EXERCISE_TITLE}`);
    return ((await el?.textContent()) ?? '').trim();
  }

  async clickPreviewExerciseAction(): Promise<void> {
    await this.jsClick(
      this.page.locator(`${this.BAI_TAP_CAN_LAM_CARD} ${this.PREVIEW_EXERCISE_ACTION_BTN}`).first()
    );
  }

  /** Click "Xem tất cả" để sang trang /bai-tap-duoc-giao đầy đủ */
  async goToAllExercises(): Promise<void> {
    await this.jsClick(this.page.locator(this.BAI_TAP_XEM_TAT_CA_LINK).first());
  }

  // ── Card "Tiếp tục khoá học" ──────────────────────────────────────────────

  async isTiepTucKhoaHocEmpty(): Promise<boolean> {
    return this.page.locator(this.TIEP_TUC_KHOA_HOC_EMPTY_TEXT).isVisible().catch(() => false);
  }

  async clickKhamPhaKhoaHoc(): Promise<void> {
    await this.jsClick(this.page.locator(this.KHAM_PHA_KHOA_HOC_BTN));
  }

  // ── Card "Thời gian học" ─────────────────────────────────────────────────

  async switchThoiGianHocTab(range: ThoiGianHocRange): Promise<void> {
    await this.jsClick(this.page.locator(this.thoiGianHocTab(range)));
  }

  async isThoiGianHocTabActive(range: ThoiGianHocRange): Promise<boolean> {
    const attr = await this.page.locator(this.thoiGianHocTab(range)).getAttribute('aria-selected');
    return attr === 'true';
  }

  async isThoiGianHocChartVisible(): Promise<boolean> {
    return this.page.locator(this.THOI_GIAN_HOC_CHART).isVisible().catch(() => false);
  }

  // ── Card "Xếp hạng trong khối" ────────────────────────────────────────────

  /** index 0 = combobox Khối lớp, index 1 = combobox Tuần */
  async openXepHangSelect(index: 0 | 1): Promise<void> {
    await this.jsClick(this.page.locator(this.XEP_HANG_KHOI_SELECT).nth(index));
  }

  async selectXepHangOption(optionText: string): Promise<void> {
    // Radix Select render option ra ngoài DOM tree (portal) khi mở — dùng role=option toàn trang
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async getXepHangSelectedValue(index: 0 | 1): Promise<string> {
    const el = this.page.locator(this.XEP_HANG_KHOI_SELECT).nth(index).locator('span[data-slot="select-value"]');
    return ((await el.textContent()) ?? '').trim();
  }

  async getXepHangCount(): Promise<number> {
    return this.page.locator(this.XEP_HANG_LIST_ITEM).count();
  }

  async isXepHangEmpty(): Promise<boolean> {
    return (await this.getXepHangCount()) === 0;
  }
}