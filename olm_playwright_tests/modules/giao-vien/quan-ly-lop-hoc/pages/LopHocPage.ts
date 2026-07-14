import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL, LOP_HOC_CUA_TOI_URL, LOP_HOC_CUA_TOI_DA_XOA_URL } from '@config/config';

/**
 * Page Object — Lớp học của tôi (1.2.3).
 * URL: {BASE_URL}/doi-tac/{username}/danh-sach-nhom#menu-danh-sach-lop-hoc
 *
 * Lớp GV tự tạo / được giao phụ trách trực tiếp (KHÔNG đi qua quản trị
 * trường) — cùng khái niệm "lớp học" và CÙNG CẤU TRÚC DOM card
 * (`.group-item` với đầy đủ data-attributes) như LopHocCuaTruongPage
 * (1.2.1), nhưng khác toolbar và khác URL gốc:
 *
 *  - Thanh nav trên cùng (#pills-tab) ở màn này CHỈ còn 1 tab "Giới thiệu"
 *    (link quay lại trang giới thiệu trường) — khác hẳn dải tab đầy đủ
 *    (Giáo viên/Thống kê/Lớp học/...) của LopHocCuaTruongPage.
 *  - Toolbar CHỈ có: Thêm lớp học / Lớp đã xóa / Hướng dẫn tạo lớp học.
 *    KHÔNG có "Chuyển lớp về trường quản lý", "Thiết lập năm học mới",
 *    "Kích hoạt VIP cho toàn trường" (những hành động cấp trường, chỉ có ở
 *    LopHocCuaTruongPage).
 *  - Nút "Thêm lớp học" dùng `data-is-school-group="false"` (khác
 *    `"true"` ở trang trường) — cùng class `.trigger-modal-form-group`
 *    nên PHẢI phân biệt bằng attribute này khi 2 trang dùng chung selector
 *    gốc.
 *  - Mỗi card lớp (Zoom/Meet, Thiết lập/Tải về/Sửa/Xóa) giống hệt
 *    LopHocCuaTruongPage — xem SchoolClassCardInfo/getClassCards() ở đó để
 *    biết chi tiết field; ở đây định nghĩa lại kiểu dữ liệu tương đương
 *    (MyClassCardInfo) để 2 page object độc lập, không phụ thuộc lẫn nhau.
 *
 * Dùng kết hợp:
 *   const page = new LopHocCuaToiPage(p);
 *   await page.open();
 *   const classes = await page.getClassCards();
 *   await page.openClassByName('Lớp 12A1');
 */

export interface MyClassCardInfo {
  /** data-id — id lớp, dùng làm khóa tra cứu ổn định nhất */
  id: string;
  /** Tên hiển thị trên link, VD: "Lớp 12A1" */
  name: string;
  url: string;
  memberCount: number;
  /** Tên khối chứa lớp này, VD: "9", "12" (đọc từ data-grade) */
  grade: string;
  /** Rỗng nếu lớp chưa cấu hình Zoom */
  zoomLink: string;
  zoomPassword: string;
  /** Rỗng nếu lớp chưa cấu hình Meet */
  meetLink: string;
}

export class LopHocCuaToiPage extends BasePage {
  static readonly URL = LOP_HOC_CUA_TOI_URL;
  static readonly DELETED_URL = LOP_HOC_CUA_TOI_DA_XOA_URL;

  // ── Nav trên cùng — chỉ còn 1 tab "Giới thiệu" ở màn này ─────────────────
  static readonly LINK_GIOI_THIEU = "#pills-tab a:has-text('Giới thiệu')";

  // ── Toolbar hành động đầu trang ──────────────────────────────────────────
  static readonly BTN_THEM_LOP = 'button.trigger-modal-form-group[data-is-school-group="false"]';
  static readonly LINK_LOP_DA_XOA = "a:has-text('Lớp đã xóa'), a[href*='deleted=1']";
  static readonly LINK_HUONG_DAN_TAO_LOP = "a[href*='dang-ki-tai-khoan-giao-vien-tao-va-quan-ly-lop-hoc']";

  // ── Bộ lọc năm học ────────────────────────────────────────────────────────
  static readonly SELECT_NAM_HOC = 'select.filter-select-auto';

  // ── Khối (nhóm các lớp theo Khối N) ──────────────────────────────────────
  static readonly GRADE_HEADING = 'h5:has(span.d-block)';
  static readonly GRADE_DOWNLOAD_BTN = "a[href*='export-member-grade']";

  // ── Card 1 lớp học (giống hệt DOM ở LopHocCuaTruongPage) ─────────────────
  static readonly GROUP_ITEM = '.group-item';
  static readonly GROUP_ITEM_BY_ID = (id: string): string => `.group-item[data-id="${id}"]`;
  static readonly GROUP_ITEM_LINK = '.card-title a[href*="/lop/"]';
  static readonly GROUP_ITEM_MEMBER_COUNT = '.card-title .fa-user + span, .card-title span.ml-1';

  static readonly BTN_THIET_LAP = "a:has-text('Thiết lập')";
  static readonly BTN_TAI_VE = "a:has-text('Tải về')";
  static readonly BTN_SUA = 'a.trigger-modal-form-group[data-type="1"]';
  static readonly BTN_XOA = 'a.delete-group';

  static readonly BTN_EDIT_ZOOM = 'button.update-zoom';
  static readonly BTN_EDIT_MEET = 'button.update-meet';
  /** Nút "Zoom"/"Meet" dạng play — chỉ hiện khi lớp đã có link cấu hình */
  static readonly BTN_SHOW_ZOOM_INFO = 'button.show-meeting-info[data-type="zoom"]';
  static readonly BTN_SHOW_MEET_INFO = 'button.show-meeting-info[data-type="meet"]';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(LopHocCuaToiPage.URL);
    return this;
  }

  isListPageLoaded(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('danh-sach-nhom') && !url.includes('type=6');
  }

  async goToDeletedClasses(): Promise<this> {
    await this.navigateTo(LopHocCuaToiPage.DELETED_URL);
    return this;
  }

  /** Bấm tab "Giới thiệu" duy nhất còn lại trên nav — quay về trang giới thiệu trường */
  async goToSchoolIntro(): Promise<this> {
    const link = await this.findVisible([LopHocCuaToiPage.LINK_GIOI_THIEU], 8);
    if (link) {
      await this.jsClick(link);
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    }
    return this;
  }

  // ==================================================================
  // Toolbar đầu trang
  // ==================================================================

  async hasAddClassButton(): Promise<boolean> {
    return (await this.findVisible([LopHocCuaToiPage.BTN_THEM_LOP], 8)) !== null;
  }

  async clickAddClass(): Promise<this> {
    const btn = await this.findVisible([LopHocCuaToiPage.BTN_THEM_LOP], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  /** Link "Hướng dẫn tạo lớp học" — mở tab mới (target="_blank") */
  async clickGuideLink(): Promise<this> {
    const link = await this.findVisible([LopHocCuaToiPage.LINK_HUONG_DAN_TAO_LOP], 8);
    if (link) await this.jsClick(link);
    return this;
  }

  // ==================================================================
  // Năm học
  // ==================================================================

  async selectSchoolYear(label: string): Promise<this> {
    const select = await this.findVisible([LopHocCuaToiPage.SELECT_NAM_HOC], 8);
    if (select) {
      await select.selectOption({ label });
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    }
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    const select = this.page.locator(LopHocCuaToiPage.SELECT_NAM_HOC).first();
    return select.inputValue();
  }

  // ==================================================================
  // Khối / Danh sách lớp
  // ==================================================================

  /** Tên các khối đang hiển thị, VD: ["Khối 9", "Khối 12"] */
  async getGradeHeadings(): Promise<string[]> {
    const headings = await this.page.locator(LopHocCuaToiPage.GRADE_HEADING).all();
    const result: string[] = [];
    for (const h of headings) {
      const text = ((await h.locator('span.d-block').first().textContent()) ?? '').trim();
      if (text) result.push(text);
    }
    return result;
  }

  /** Tải "DS học sinh - phòng thi" cho cả 1 khối (nút cạnh tiêu đề "Khối N") */
  async downloadGradeExamList(grade: number | string): Promise<this> {
    const link = this.page.locator(`a[href*="export-member-grade/${grade}"]`).first();
    await this.jsClick(link);
    return this;
  }

  /**
   * Toàn bộ lớp học của tôi hiển thị trên trang, đọc trực tiếp từ
   * data-attributes của `.group-item` (không cần dò ngược DOM).
   */
  async getClassCards(): Promise<MyClassCardInfo[]> {
    const items = await this.page.locator(LopHocCuaToiPage.GROUP_ITEM).all();
    const result: MyClassCardInfo[] = [];

    for (const item of items) {
      const id = (await item.getAttribute('data-id')) ?? '';
      if (!id) continue;

      const link = item.locator(LopHocCuaToiPage.GROUP_ITEM_LINK).first();
      const name = ((await link.textContent().catch(() => '')) ?? '').trim();
      const href = (await link.getAttribute('href').catch(() => null)) ?? '';

      const countText =
        (await item.locator(LopHocCuaToiPage.GROUP_ITEM_MEMBER_COUNT).first().textContent().catch(() => '0')) ??
        '0';
      const memberCount = parseInt(countText.trim(), 10) || 0;

      const grade = (await item.getAttribute('data-grade')) ?? '';
      const zoomLink = (await item.getAttribute('data-zoom')) ?? '';
      const zoomPassword = (await item.getAttribute('data-spasszoom')) ?? '';
      const meetLink = (await item.getAttribute('data-meet')) ?? '';

      result.push({
        id,
        name,
        url: href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '',
        memberCount,
        grade,
        zoomLink,
        zoomPassword,
        meetLink,
      });
    }
    return result;
  }

  async getClassCount(): Promise<number> {
    return (await this.getClassCards()).length;
  }

  /** Lọc danh sách lớp theo khối, VD: getClassesByGrade('12') */
  async getClassesByGrade(grade: number | string): Promise<MyClassCardInfo[]> {
    const gradeStr = String(grade);
    return (await this.getClassCards()).filter((c) => c.grade === gradeStr);
  }

  /** true nếu chưa có lớp nào (không có card `.group-item` nào trên trang) */
  async isEmpty(): Promise<boolean> {
    return (await this.getClassCards()).length === 0;
  }

  // ==================================================================
  // Thao tác trên 1 card lớp học (ưu tiên tra theo id — ổn định hơn theo tên)
  // ==================================================================

  private _cardById(id: string) {
    return this.page.locator(LopHocCuaToiPage.GROUP_ITEM_BY_ID(id));
  }

  private _cardByName(name: string) {
    return this.page.locator(LopHocCuaToiPage.GROUP_ITEM).filter({ hasText: name }).first();
  }

  async openClassById(id: string): Promise<this> {
    const link = this._cardById(id).locator(LopHocCuaToiPage.GROUP_ITEM_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async openClassByName(name: string): Promise<this> {
    const link = this.page.locator(LopHocCuaToiPage.GROUP_ITEM_LINK).filter({ hasText: name }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async clickClassSettings(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_THIET_LAP).first();
    await this.jsClick(btn);
    return this;
  }

  async downloadClassList(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_TAI_VE).first();
    await this.jsClick(btn);
    return this;
  }

  async clickEditClass(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_SUA).first();
    await this.jsClick(btn);
    return this;
  }

  async clickDeleteClass(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_XOA).first();
    await this.jsClick(btn);
    return this;
  }

  // ── Zoom / Meet ───────────────────────────────────────────────────────────

  async hasZoomConfigured(id: string): Promise<boolean> {
    const zoom = (await this._cardById(id).getAttribute('data-zoom')) ?? '';
    return zoom.trim().length > 0;
  }

  async hasMeetConfigured(id: string): Promise<boolean> {
    const meet = (await this._cardById(id).getAttribute('data-meet')) ?? '';
    return meet.trim().length > 0;
  }

  /** Bấm nút "Zoom" (bút sửa) — mở modal cấu hình link/mật khẩu Zoom cho lớp */
  async clickEditZoom(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_EDIT_ZOOM).first();
    await this.jsClick(btn);
    return this;
  }

  /** Bấm nút "Meet" (bút sửa) — mở modal cấu hình link Google Meet cho lớp */
  async clickEditMeet(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_EDIT_MEET).first();
    await this.jsClick(btn);
    return this;
  }

  /**
   * Bấm nút "Zoom" dạng play (▶) — chỉ tồn tại khi lớp đã cấu hình Zoom.
   * Dùng hasZoomConfigured() trước khi gọi để tránh click vào nút không tồn tại.
   */
  async clickShowZoomInfo(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_SHOW_ZOOM_INFO).first();
    await this.jsClick(btn);
    return this;
  }

  /**
   * Bấm nút "Meet" dạng play (▶) — chỉ tồn tại khi lớp đã cấu hình Meet.
   * Dùng hasMeetConfigured() trước khi gọi để tránh click vào nút không tồn tại.
   */
  async clickShowMeetInfo(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaToiPage.BTN_SHOW_MEET_INFO).first();
    await this.jsClick(btn);
    return this;
  }
}