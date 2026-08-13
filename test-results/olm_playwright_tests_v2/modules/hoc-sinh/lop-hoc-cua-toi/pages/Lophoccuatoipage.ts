import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL } from '@config/config';

/**
 * Page Object — "Lớp học của tôi" (view HỌC SINH, giao diện V2 — debug.olm.vn).
 *
 * Khác với LOP_HOC_CUA_TOI_URL hiện có trong config.ts (đó là trang V1 của
 * GIÁO VIÊN, `${DANH_SACH_NHOM_URL}#menu-danh-sach-lop-hoc`) — trang này là
 * URL riêng `/lop-hoc-cua-toi` dành cho HỌC SINH, chỉ tồn tại ở giao diện V2.
 *
 * Cấu trúc trang (theo DOM thực tế đã soát):
 *   - Sidebar icon-nav bên trái: Tổng quan / Bài tập / Lớp học (active) / Khóa học / Cá nhân
 *   - Thanh chip chọn lớp (khi học sinh học nhiều lớp) — data-group="classes"
 *   - Card "Thông tin lớp": GV chủ nhiệm / Sĩ số / Bài tập chưa làm
 *   - Segmented control 4 tab: Bài tập | Thành viên | Học trực tuyến | Thảo luận
 *     (id="segment-hocsinh", mỗi item data-group="segment-lop-hoc", nội dung
 *     tương ứng nằm ở #segment-content-<tab>)
 *   - Tab "Bài tập": filter (trạng thái / môn học / khoảng ngày / tìm kiếm)
 *     + danh sách card bài tập (data-exercise="<id>") + drawer chi tiết
 *     (#drawer-exercise-detail-<id>)
 *   - Tab "Thành viên": toggle Học sinh/Giáo viên (list-member-select-type)
 *     + danh sách card thành viên trong #list-member-hocsinh / #list-member-giaovien
 *   - Tab "Học trực tuyến": card Google Meet / Zoom (chỉ hiện placeholder khi
 *     giáo viên chưa gắn link)
 *
 * LƯU Ý: trang chỉ có nghĩa khi học sinh đã tham gia ít nhất 1 lớp — nếu
 * chưa có lớp nào, khu vực "Thông tin lớp" / segmented control nhiều khả
 * năng không render (chưa xác nhận DOM rỗng — cần bổ sung khi có sample).
 */

export const LOP_HOC_CUA_TOI_HOC_SINH_URL = `${BASE_URL}/lop-hoc-cua-toi`;

export type LopHocCuaToiTab = 'bai-tap' | 'thanh-vien' | 'hoc-truc-tuyen' | 'thao-luan';
export type BaiTapStatusFilter = 'all' | 'not-done' | 'done' | 'expired';
export type ThanhVienType = 'hocsinh' | 'giaovien';

export class LopHocCuaToiPage extends BasePage {
  // ── Sidebar icon-nav (chung cho mọi trang học sinh V2) ────────────────────
  readonly SIDEBAR_LOP_HOC_LINK = 'a[href="/lop-hoc-cua-toi"]';
  readonly SIDEBAR_TONG_QUAN_LINK = 'a[href="/hoc-bai"]';
  readonly SIDEBAR_BAI_TAP_LINK = 'a[href="/bai-tap-duoc-giao"]';
  readonly SIDEBAR_KHOA_HOC_LINK = 'a[href="/khoa-hoc"]';

  // ── Chọn lớp (khi có nhiều lớp) ────────────────────────────────────────────
  readonly CLASS_CHIP = '.tw-classes-chip[data-group="classes"]';
  readonly CLASS_CHIP_SELECTED = '.tw-classes-chip.selected[data-group="classes"]';

  // ── Card "Thông tin lớp" ────────────────────────────────────────────────────
  readonly CLASS_INFO_TITLE = 'span:has-text("Thông tin lớp")';
  readonly GVCN_VALUE = 'span:has-text("GV chủ nhiệm") ~ div span, span:has-text("GV chủ nhiệm")';
  readonly SI_SO_VALUE = 'span:has-text("Sĩ số")';
  readonly BAI_TAP_CHUA_LAM_VALUE = 'span:has-text("Bài tập chưa làm")';

  // ── Segmented control (4 tab) ──────────────────────────────────────────────
  readonly SEGMENT_CONTAINER = '#segment-hocsinh';
  readonly segmentTabButton = (tab: LopHocCuaToiTab) =>
    `#segment-hocsinh button[data-value="${tab}"][data-group="segment-lop-hoc"]`;
  readonly segmentContent = (tab: LopHocCuaToiTab) => `#segment-content-${tab}`;

  // ── Tab "Bài tập" ───────────────────────────────────────────────────────────
  readonly FILTER_STATUS_SELECT = '#courseware-status';
  readonly FILTER_SUBJECT_SELECT = '#subject';
  readonly FILTER_DATE_RANGE_INPUT = 'input[name="date-range"]';
  readonly SEARCH_INPUT = 'input[name="query"]';
  readonly EXERCISE_CARD_LIST = '#segment-content-bai-tap .tw-olm-card-exercise';
  readonly exerciseCard = (exerciseId: string) => `[data-exercise="${exerciseId}"]`;
  readonly exerciseDrawer = (exerciseId: string) => `#drawer-exercise-detail-${exerciseId}`;
  readonly DRAWER_CLOSE_BTN = '[data-drawer-close]';

  // ── Tab "Thành viên" ────────────────────────────────────────────────────────
  readonly MEMBER_TYPE_TOGGLE = (type: ThanhVienType) => `.list-member-select-type[data-type="${type}"]`;
  readonly MEMBER_LIST_HOCSINH = '#list-member-hocsinh';
  readonly MEMBER_LIST_GIAOVIEN = '#list-member-giaovien';
  readonly MEMBER_CARD = '.tw-group.tw-relative[class*="tw-rounded-2xl"]';

  // ── Tab "Học trực tuyến" ─────────────────────────────────────────────────────
  readonly ONLINE_MEET_CARD = '#segment-content-hoc-truc-tuyen p:has-text("Google Meet")';
  readonly ONLINE_ZOOM_CARD = '#segment-content-hoc-truc-tuyen p:has-text("Zoom")';

  // ── Navigation ────────────────────────────────────────────────────────────

  /** Mở trực tiếp /lop-hoc-cua-toi (lớp mặc định — thường là lớp đầu tiên) */
  async open(): Promise<void> {
    await this.navigateTo(LOP_HOC_CUA_TOI_HOC_SINH_URL);
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  /** Mở trực tiếp lớp cụ thể qua id_group (lấy từ data-href của chip) */
  async openByGroupId(idGroup: string): Promise<void> {
    await this.navigateTo(`${LOP_HOC_CUA_TOI_HOC_SINH_URL}?id_group=${idGroup}`);
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  // ── Chọn lớp ──────────────────────────────────────────────────────────────

  /** Lấy tên các lớp hiển thị trên thanh chip (VD: "Lớp 12A1") */
  async getClassChipNames(): Promise<string[]> {
    const chips = await this.findElements(this.CLASS_CHIP);
    const names: string[] = [];
    for (const chip of chips) {
      names.push(((await chip.textContent()) ?? '').trim());
    }
    return names;
  }

  /** Click vào 1 chip lớp theo tên hiển thị (VD: "Lớp 12A1") */
  async selectClassByName(className: string): Promise<void> {
    const chip = this.page.locator(this.CLASS_CHIP).filter({ hasText: className }).first();
    await this.jsClick(chip);
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  // ── Thông tin lớp ─────────────────────────────────────────────────────────

  async getGiaoVienChuNhiem(): Promise<string> {
    const el = await this.findVisible(
      'span.tw-text-18:has-text("GV chủ nhiệm") ~ div span, div:has(> span:has-text("GV chủ nhiệm")) .tw-text-24'
    );
    return ((await el?.textContent()) ?? '').trim();
  }

  async getSiSoText(): Promise<string> {
    const el = await this.findVisible(
      'div:has(> span:has-text("Sĩ số")) span.tw-text-24'
    );
    return ((await el?.textContent()) ?? '').trim();
  }

  async getBaiTapChuaLamText(): Promise<string> {
    const el = await this.findVisible(
      'div:has(> span:has-text("Bài tập chưa làm")) span.tw-text-24'
    );
    return ((await el?.textContent()) ?? '').trim();
  }

  // ── Chuyển tab (segmented control) ───────────────────────────────────────

  async switchTab(tab: LopHocCuaToiTab): Promise<void> {
    const btn = this.page.locator(this.segmentTabButton(tab));
    await this.jsClick(btn);
    await this.waitForSelector(this.segmentContent(tab));
  }

  async isTabActive(tab: LopHocCuaToiTab): Promise<boolean> {
    const btn = this.page.locator(this.segmentTabButton(tab));
    const cls = (await btn.getAttribute('class')) ?? '';
    return cls.includes('selected');
  }

  // ── Tab "Bài tập" ─────────────────────────────────────────────────────────

  async filterByStatus(status: BaiTapStatusFilter): Promise<void> {
    // Trường dùng select2 (UI overlay), select gốc bị ẩn -> set qua select2 combobox
    await this.page.locator(`${this.FILTER_STATUS_SELECT} + span .select2-selection`).click();
    const optionText: Record<BaiTapStatusFilter, string> = {
      all: 'Tất cả bài tập',
      'not-done': 'Bài chưa làm',
      done: 'Đã hoàn thành',
      expired: 'Hết hạn',
    };
    await this.page.locator('.select2-results__option', { hasText: optionText[status] }).click();
  }

  async searchExercise(keyword: string): Promise<void> {
    const input = this.page.locator(this.SEARCH_INPUT);
    await this.jsClearAndType(input, keyword);
    await this.page.keyboard.press('Enter');
  }

  /** Số lượng bài tập đang hiển thị trong tab Bài tập */
  async getExerciseCount(): Promise<number> {
    return this.page.locator(this.EXERCISE_CARD_LIST).count();
  }

  /** Danh sách exerciseId (data-exercise) của các bài tập đang hiển thị */
  async getExerciseIds(): Promise<string[]> {
    const cards = await this.findElements(this.EXERCISE_CARD_LIST);
    const ids: string[] = [];
    for (const card of cards) {
      const id = await card.getAttribute('data-exercise');
      if (id) ids.push(id);
    }
    return ids;
  }

  /** Mở drawer "Chi tiết bài tập" bằng cách click vào card */
  async openExerciseDetail(exerciseId: string): Promise<void> {
    const card = this.page.locator(this.exerciseCard(exerciseId));
    await this.jsClick(card);
    await this.waitForSelector(this.exerciseDrawer(exerciseId));
  }

  async closeExerciseDetail(exerciseId: string): Promise<void> {
    const drawer = this.page.locator(this.exerciseDrawer(exerciseId));
    await this.jsClick(drawer.locator(this.DRAWER_CLOSE_BTN));
  }

  /** Text nút hành động chính trên card (VD: "Làm bài" / "Xem bài làm") */
  async getExerciseActionLabel(exerciseId: string): Promise<string> {
    const btn = this.page
      .locator(this.exerciseCard(exerciseId))
      .locator('a.tw-olm-btn-primary-48, a.tw-olm-btn-tertiary-48')
      .first();
    return ((await btn.textContent()) ?? '').trim();
  }

  // ── Tab "Thành viên" ──────────────────────────────────────────────────────

  async switchMemberType(type: ThanhVienType): Promise<void> {
    await this.jsClick(this.page.locator(this.MEMBER_TYPE_TOGGLE(type)));
  }

  async getMemberCount(type: ThanhVienType): Promise<number> {
    const listSelector = type === 'hocsinh' ? this.MEMBER_LIST_HOCSINH : this.MEMBER_LIST_GIAOVIEN;
    return this.page.locator(`${listSelector} ${this.MEMBER_CARD}`).count();
  }

  async getMemberNames(type: ThanhVienType): Promise<string[]> {
    const listSelector = type === 'hocsinh' ? this.MEMBER_LIST_HOCSINH : this.MEMBER_LIST_GIAOVIEN;
    const cards = await this.findElements(`${listSelector} ${this.MEMBER_CARD} a`);
    const names: string[] = [];
    for (const card of cards) {
      names.push(((await card.textContent()) ?? '').trim());
    }
    return names;
  }

  // ── Tab "Học trực tuyến" ──────────────────────────────────────────────────

  async isMeetLinkConfigured(): Promise<boolean> {
    const placeholder = this.page.locator(
      '#segment-content-hoc-truc-tuyen:has-text("Google Meet") >> text=Thầy/cô chưa thêm đường dẫn học trực tuyến'
    );
    return !(await placeholder.first().isVisible().catch(() => false));
  }

  async isZoomLinkConfigured(): Promise<boolean> {
    const placeholder = this.page.locator(
      '#segment-content-hoc-truc-tuyen:has-text("Zoom") >> text=Thầy/cô chưa thêm đường dẫn học trực tuyến'
    );
    return !(await placeholder.first().isVisible().catch(() => false));
  }
}