import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL } from '@config/config';

/**
 * Page Object — "Bài tập" / Bài tập được giao (view HỌC SINH, giao diện V2 —
 * debug.olm.vn, URL `/bai-tap-duoc-giao`).
 *
 * Đây là bản đầy đủ, thay thế stub `BaiTapDuocGiaoPage` cũ (chỉ có TODO).
 * Về bản chất là "list bài tập" giống hệt tab Bài tập trong
 * `LopHocCuaToiPage`, nhưng:
 *   - Là trang riêng (không nằm trong segmented control của 1 lớp) — gộp
 *     bài tập từ TẤT CẢ các lớp, nên mỗi card có thêm badge tên lớp
 *     (VD: "Lớp 12A1") đứng trước badge môn học.
 *   - Có thêm card "Thống kê" ở đầu trang (Cần làm hôm nay / Tổng số cần
 *     làm / Đã hoàn thành).
 *   - Có thêm filter "Tất cả học liệu" (`#cate` — Lý thuyết/Luyện tập/
 *     Video/Kiểm tra/Hỏi đáp) mà trang "Lớp học của tôi" không có.
 *
 * Cấu trúc trang (theo DOM thực tế đã soát):
 *   - Card "Thống kê": 3 ô (Cần làm hôm nay / Tổng số cần làm / Đã hoàn thành)
 *   - Card "Danh sách bài tập":
 *       + ô tìm kiếm (#search-courseware input[name="query"])
 *       + filter: trạng thái (#courseware-status) / môn học (#subject) /
 *         loại học liệu (#cate) / khoảng ngày (input[name="date-range"])
 *       + danh sách card bài tập (data-exercise="<id>", trong
 *         #my-courseware-container) + drawer chi tiết
 *         (#drawer-exercise-detail-<id>) — cấu trúc drawer giống hệt
 *         LopHocCuaToiPage (Bài học/Giáo viên giao/Giao bài lúc/Hạn nộp bài,
 *         kèm block điểm nếu là bài kiểm tra có chấm điểm)
 */

export const BAI_TAP_DUOC_GIAO_URL = `${BASE_URL}/bai-tap-duoc-giao`;

export type BaiTapStatusFilter = 'all' | 'not-done' | 'done' | 'expired';
export type HocLieuTypeFilter = 'all' | 'ly-thuyet' | 'luyen-tap' | 'video' | 'kiem-tra' | 'hoi-dap';

export interface ThongKeBaiTap {
  canLamHomNay: string;
  tongSoCanLam: string;
  daHoanThanh: string;
}

const CATE_OPTION_VALUE: Record<HocLieuTypeFilter, string> = {
  all: '0',
  'ly-thuyet': '2',
  'luyen-tap': '3',
  video: '5',
  'kiem-tra': '-14',
  'hoi-dap': '12',
};

export class BaiTapDuocGiaoPage extends BasePage {
  // ── Card "Thống kê" ──────────────────────────────────────────────────────
  readonly THONG_KE_TITLE = 'span:has-text("Thống kê")';
  readonly CAN_LAM_HOM_NAY_VALUE = 'div:has(> span:has-text("Cần làm hôm nay")) span.tw-text-24';
  readonly TONG_SO_CAN_LAM_VALUE = 'div:has(> span:has-text("Tổng số cần làm")) span.tw-text-24';
  readonly DA_HOAN_THANH_VALUE = 'div:has(> span:has-text("Đã hoàn thành")) span.tw-text-24';

  // ── Card "Danh sách bài tập" ─────────────────────────────────────────────
  readonly COURSEWARE_CONTAINER = '#my-courseware-container';
  readonly SEARCH_INPUT = '#search-courseware input[name="query"]';
  readonly FILTER_STATUS_SELECT = '#courseware-status';
  readonly FILTER_SUBJECT_SELECT = '#subject';
  readonly FILTER_CATE_SELECT = '#cate';
  readonly FILTER_DATE_RANGE_INPUT = 'input[name="date-range"]';
  readonly EXERCISE_CARD_LIST = '#my-courseware-container .tw-olm-card-exercise';

  readonly exerciseCard = (exerciseId: string) => `[data-exercise="${exerciseId}"]`;
  readonly exerciseDrawer = (exerciseId: string) => `#drawer-exercise-detail-${exerciseId}`;
  readonly DRAWER_CLOSE_BTN = '[data-drawer-close]';

  // ── Navigation ────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.navigateTo(BAI_TAP_DUOC_GIAO_URL);
    await this.waitForSelector(this.COURSEWARE_CONTAINER);
  }

  // ── Thống kê ──────────────────────────────────────────────────────────────

  async getThongKe(): Promise<ThongKeBaiTap> {
    const canLamHomNay = await this._readStat(this.CAN_LAM_HOM_NAY_VALUE);
    const tongSoCanLam = await this._readStat(this.TONG_SO_CAN_LAM_VALUE);
    const daHoanThanh = await this._readStat(this.DA_HOAN_THANH_VALUE);
    return { canLamHomNay, tongSoCanLam, daHoanThanh };
  }

  private async _readStat(selector: string): Promise<string> {
    const el = await this.findVisible(selector);
    return ((await el?.textContent()) ?? '').trim();
  }

  // ── Tìm kiếm / filter ────────────────────────────────────────────────────

  async searchExercise(keyword: string): Promise<void> {
    const input = this.page.locator(this.SEARCH_INPUT);
    await this.jsClearAndType(input, keyword);
    await this.page.keyboard.press('Enter');
  }

  async filterByStatus(status: BaiTapStatusFilter): Promise<void> {
    await this.page.locator(`${this.FILTER_STATUS_SELECT} + span .select2-selection`).click();
    const optionText: Record<BaiTapStatusFilter, string> = {
      all: 'Tất cả bài tập',
      'not-done': 'Bài chưa làm',
      done: 'Đã hoàn thành',
      expired: 'Hết hạn',
    };
    await this.page.locator('.select2-results__option', { hasText: optionText[status] }).click();
  }

  async filterBySubjectName(subjectName: string): Promise<void> {
    await this.page.locator(`${this.FILTER_SUBJECT_SELECT} + span .select2-selection`).click();
    await this.page.locator('.select2-results__option', { hasText: subjectName }).click();
  }

  async filterByHocLieuType(type: HocLieuTypeFilter): Promise<void> {
    await this.page.locator(`${this.FILTER_CATE_SELECT} + span .select2-selection`).click();
    const optionText: Record<HocLieuTypeFilter, string> = {
      all: 'Tất cả học liệu',
      'ly-thuyet': 'Lý thuyết',
      'luyen-tap': 'Luyện tập',
      video: 'Video',
      'kiem-tra': 'Kiểm tra',
      'hoi-dap': 'Hỏi đáp',
    };
    await this.page.locator('.select2-results__option', { hasText: optionText[type] }).click();
  }

  /** Lấy option value tương ứng với 1 loại học liệu (dùng khi cần assert trực tiếp trên <select>) */
  getHocLieuOptionValue(type: HocLieuTypeFilter): string {
    return CATE_OPTION_VALUE[type];
  }

  // ── Danh sách bài tập ─────────────────────────────────────────────────────

  async getExerciseCount(): Promise<number> {
    return this.page.locator(this.EXERCISE_CARD_LIST).count();
  }

  async getExerciseIds(): Promise<string[]> {
    const cards = await this.findElements(this.EXERCISE_CARD_LIST);
    const ids: string[] = [];
    for (const card of cards) {
      const id = await card.getAttribute('data-exercise');
      if (id) ids.push(id);
    }
    return ids;
  }

  /** Tên lớp hiển thị trên badge đầu tiên của card (VD: "Lớp 12A1") */
  async getExerciseClassBadge(exerciseId: string): Promise<string> {
    const badge = this.page
      .locator(this.exerciseCard(exerciseId))
      .locator('span.tw-bg-secondary-light.tw-text-secondary-default')
      .first();
    return ((await badge.textContent()) ?? '').trim().replace(/\s+/g, ' ');
  }

  /** Tên môn học hiển thị trên badge thứ 2 của card */
  async getExerciseSubjectBadge(exerciseId: string): Promise<string> {
    const badge = this.page
      .locator(this.exerciseCard(exerciseId))
      .locator('span.tw-bg-accent-light.tw-text-accent-default')
      .first();
    return ((await badge.textContent()) ?? '').trim();
  }

  async getExerciseTitle(exerciseId: string): Promise<string> {
    const title = this.page
      .locator(this.exerciseCard(exerciseId))
      .locator('a.tw-text-lg.tw-text-content-primary.tw-font-semibold')
      .first();
    return ((await title.textContent()) ?? '').trim();
  }

  /** Text nút hành động chính trên card (VD: "Làm bài" / "Xem bài làm") */
  async getExerciseActionLabel(exerciseId: string): Promise<string> {
    const btn = this.page
      .locator(this.exerciseCard(exerciseId))
      .locator('a.tw-olm-btn-primary-48, a.tw-olm-btn-tertiary-48')
      .first();
    return ((await btn.textContent()) ?? '').trim();
  }

  async clickExerciseAction(exerciseId: string): Promise<void> {
    const btn = this.page
      .locator(this.exerciseCard(exerciseId))
      .locator('a.tw-olm-btn-primary-48, a.tw-olm-btn-tertiary-48')
      .first();
    await this.jsClick(btn);
  }

  // ── Drawer chi tiết bài tập ──────────────────────────────────────────────

  async openExerciseDetail(exerciseId: string): Promise<void> {
    const card = this.page.locator(this.exerciseCard(exerciseId));
    await this.jsClick(card);
    await this.waitForSelector(this.exerciseDrawer(exerciseId));
  }

  async closeExerciseDetail(exerciseId: string): Promise<void> {
    const drawer = this.page.locator(this.exerciseDrawer(exerciseId));
    await this.jsClick(drawer.locator(this.DRAWER_CLOSE_BTN));
  }

  private _drawerField(exerciseId: string, label: string) {
    return `${this.exerciseDrawer(exerciseId)} div:has(> span:has-text("${label}")) span.tw-text-content-primary`;
  }

  async getDrawerGiaoVienGiao(exerciseId: string): Promise<string> {
    const el = await this.findVisible(this._drawerField(exerciseId, 'Giáo viên giao'));
    return ((await el?.textContent()) ?? '').trim();
  }

  async getDrawerHanNopBai(exerciseId: string): Promise<string> {
    const el = await this.findVisible(this._drawerField(exerciseId, 'Hạn nộp bài'));
    return ((await el?.textContent()) ?? '').trim();
  }

  async getDrawerGiaoBaiLuc(exerciseId: string): Promise<string> {
    const el = await this.findVisible(this._drawerField(exerciseId, 'Giao bài lúc'));
    return ((await el?.textContent()) ?? '').trim();
  }

  /** Cảnh báo "Quá hạn làm bài" trong drawer (nếu bài đã hết hạn) */
  async hasQuaHanWarning(exerciseId: string): Promise<boolean> {
    return this.page
      .locator(`${this.exerciseDrawer(exerciseId)} span:has-text("Quá hạn làm bài")`)
      .isVisible()
      .catch(() => false);
  }
}