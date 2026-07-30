import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL, LOP_HOC_CUA_TRUONG_URL, LOP_HOC_CUA_TRUONG_DA_XOA_URL } from '@config/config';
import { SchoolAdminTab } from '@modules/giao-vien/quan-ly-giao-vien/pages/PhanCongGiangDayPage';

/**
 * Page Object — Lớp học của trường (1.2.1).
 * URL: {BASE_URL}/truong-hoc/{slug}/lop-hoc
 *
 * Trang gồm 2 phần:
 *  A) Thanh điều hướng dùng chung của khu vực quản trị trường (Giới thiệu /
 *     Giáo viên / Thống kê / Lớp học / Khóa học / Thống kê dung lượng / Bài
 *     đã giao / Nâng lớp / Điểm danh / Xếp TKB / Thảo luận trong trường) —
 *     dùng chung enum SchoolAdminTab với PhanCongGiangDayPage, KHÔNG định
 *     nghĩa lại ở đây.
 *  B) Toolbar hành động + danh sách LỚP HỌC của trường, gom theo từng
 *     "Khối" (VD: "Khối 9", "Khối 12"). Mỗi lớp là 1 card (`.group-item`)
 *     mang sẵn đầy đủ dữ liệu qua data-attributes (data-id, data-name,
 *     data-grade, data-zoom, data-meet, data-passzoom, ...) — KHÔNG cần dò
 *     ngược DOM như NhomGiaoVienPage/NhomHocSinhPage (những trang không có
 *     data-attributes phong phú bằng), nên getClassCards() ở đây đơn giản
 *     và tin cậy hơn.
 *
 * So sánh với NhomHocSinhPage (nhóm học sinh, cùng khái niệm "lớp" nhưng
 * khác màn hình quản trị: doi-tac/{username}/danh-sach-nhom?type=6):
 *  - Trang NÀY có thêm toolbar riêng: Thêm lớp học / Chuyển lớp về trường
 *    quản lý / Lớp đã xóa / Thiết lập năm học mới / Kích hoạt VIP cho toàn
 *    trường / Hướng dẫn quản lí trường học.
 *  - Mỗi card lớp CÓ THỂ có cấu hình Zoom/Meet riêng (nút "Zoom"/"Meet" để
 *    sửa, và nút "Zoom"/"Meet" dạng play — class `show-meeting-info` — chỉ
 *    hiện khi đã cấu hình link, dùng để xem/khởi chạy phòng học).
 *  - Nút "Sửa" dùng chung class `.trigger-modal-form-group` (data-type="1"),
 *    giống LopHocPage/NhomGiaoVienPage (type=1 = lớp học thường, khác
 *    type=6 = nhóm học sinh bên NhomHocSinhPage).
 *
 * Dùng kết hợp:
 *   const page = new LopHocCuaTruongPage(p);
 *   await page.open();
 *   const classes = await page.getClassCards();
 *   await page.openClassByName('Lớp 12A1');
 */

export interface SchoolClassCardInfo {
  /** data-id — id nhóm/lớp, dùng làm khóa tra cứu ổn định nhất */
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

export class LopHocCuaTruongPage extends BasePage {
  static readonly URL = LOP_HOC_CUA_TRUONG_URL;
  static readonly DELETED_URL = LOP_HOC_CUA_TRUONG_DA_XOA_URL;

  // ── Thanh điều hướng dùng chung (giống PhanCongGiangDayPage) ────────────
  static readonly ADMIN_TAB_NAV = '#pills-tab';
  static readonly ADMIN_TAB_LINK = '#pills-tab li a';

  // ── Toolbar hành động đầu trang ──────────────────────────────────────────
  static readonly BTN_THEM_LOP = 'button.trigger-modal-form-group[data-is-school-group="true"]';
  static readonly BTN_CHUYEN_LOP_VE_TRUONG = 'button.convert-group';
  static readonly LINK_LOP_DA_XOA = "a:has-text('Lớp đã xóa'), a[href*='deleted=1']";
  static readonly LINK_THIET_LAP_NAM_HOC_MOI = "a[href*='thiet-lap-nam-hoc-moi']";
  static readonly BTN_KICH_HOAT_VIP_TOAN_TRUONG = 'button.active-vip-school';
  static readonly LINK_HUONG_DAN_QUAN_LY = "a[href*='dang-ki-tai-khoan-quan-li-truong']";

  // ── Bộ lọc năm học ────────────────────────────────────────────────────────
  static readonly SELECT_NAM_HOC = 'select.filter-select-auto';

  // ── Khối (nhóm các lớp theo Khối N) ──────────────────────────────────────
  static readonly GRADE_HEADING = 'h5:has(span.d-block)';
  static readonly GRADE_DOWNLOAD_BTN = "a[href*='export-member-grade']";

  // ── Card 1 lớp học ────────────────────────────────────────────────────────
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
    await this.navigateTo(LopHocCuaTruongPage.URL);
    return this;
  }

  isListPageLoaded(): boolean {
    return this.getCurrentUrl().includes('/lop-hoc');
  }

  async goToDeletedClasses(): Promise<this> {
    await this.navigateTo(LopHocCuaTruongPage.DELETED_URL);
    return this;
  }

  /**
   * Chuyển sang 1 tab khác trong thanh điều hướng quản trị trường
   * (dùng chung enum SchoolAdminTab với PhanCongGiangDayPage).
   */
  async switchAdminTab(tab: SchoolAdminTab): Promise<this> {
    const link = this.page.locator(LopHocCuaTruongPage.ADMIN_TAB_LINK).filter({ hasText: tab }).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Toolbar đầu trang
  // ==================================================================

  async hasAddClassButton(): Promise<boolean> {
    return (await this.findVisible([LopHocCuaTruongPage.BTN_THEM_LOP], 8)) !== null;
  }

  async clickAddClass(): Promise<this> {
    const btn = await this.findVisible([LopHocCuaTruongPage.BTN_THEM_LOP], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  /** Mở modal "Chuyển lớp về trường quản lý" (chuyển lớp từ GV cá nhân về trường) */
  async clickConvertClassToSchoolManaged(): Promise<this> {
    const btn = await this.findVisible([LopHocCuaTruongPage.BTN_CHUYEN_LOP_VE_TRUONG], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickSetupNewSchoolYear(): Promise<this> {
    const link = await this.findVisible([LopHocCuaTruongPage.LINK_THIET_LAP_NAM_HOC_MOI], 8);
    if (link) await this.jsClick(link);
    return this;
  }

  async clickActivateVipForSchool(): Promise<this> {
    const btn = await this.findVisible([LopHocCuaTruongPage.BTN_KICH_HOAT_VIP_TOAN_TRUONG], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  /** Link "Hướng dẫn quản lí trường học" — mở tab mới (target="_blank") */
  async clickGuideLink(): Promise<this> {
    const link = await this.findVisible([LopHocCuaTruongPage.LINK_HUONG_DAN_QUAN_LY], 8);
    if (link) await this.jsClick(link);
    return this;
  }

  // ==================================================================
  // Năm học
  // ==================================================================

  async selectSchoolYear(label: string): Promise<this> {
    const select = await this.findVisible([LopHocCuaTruongPage.SELECT_NAM_HOC], 8);
    if (select) {
      await select.selectOption({ label });
      await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    }
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    const select = this.page.locator(LopHocCuaTruongPage.SELECT_NAM_HOC).first();
    return select.inputValue();
  }

  // ==================================================================
  // Khối / Danh sách lớp
  // ==================================================================

  /** Tên các khối đang hiển thị, VD: ["Khối 9", "Khối 12"] */
  async getGradeHeadings(): Promise<string[]> {
    const headings = await this.page.locator(LopHocCuaTruongPage.GRADE_HEADING).all();
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
   * Toàn bộ lớp học của trường hiển thị trên trang, đọc trực tiếp từ
   * data-attributes của `.group-item` (không cần dò ngược DOM).
   */
  async getClassCards(): Promise<SchoolClassCardInfo[]> {
    const items = await this.page.locator(LopHocCuaTruongPage.GROUP_ITEM).all();
    const result: SchoolClassCardInfo[] = [];

    for (const item of items) {
      const id = (await item.getAttribute('data-id')) ?? '';
      if (!id) continue;

      const link = item.locator(LopHocCuaTruongPage.GROUP_ITEM_LINK).first();
      const name = ((await link.textContent().catch(() => '')) ?? '').trim();
      const href = (await link.getAttribute('href').catch(() => null)) ?? '';

      const countText =
        (await item.locator(LopHocCuaTruongPage.GROUP_ITEM_MEMBER_COUNT).first().textContent().catch(() => '0')) ??
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
  async getClassesByGrade(grade: number | string): Promise<SchoolClassCardInfo[]> {
    const gradeStr = String(grade);
    return (await this.getClassCards()).filter((c) => c.grade === gradeStr);
  }

  // ==================================================================
  // Thao tác trên 1 card lớp học (ưu tiên tra theo id — ổn định hơn theo tên)
  // ==================================================================

  private _cardById(id: string) {
    return this.page.locator(LopHocCuaTruongPage.GROUP_ITEM_BY_ID(id));
  }

  private _cardByName(name: string) {
    return this.page.locator(LopHocCuaTruongPage.GROUP_ITEM).filter({ hasText: name }).first();
  }

  async openClassById(id: string): Promise<this> {
    const link = this._cardById(id).locator(LopHocCuaTruongPage.GROUP_ITEM_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async openClassByName(name: string): Promise<this> {
    const link = this.page.locator(LopHocCuaTruongPage.GROUP_ITEM_LINK).filter({ hasText: name }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async clickClassSettings(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_THIET_LAP).first();
    await this.jsClick(btn);
    return this;
  }

  async downloadClassList(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_TAI_VE).first();
    await this.jsClick(btn);
    return this;
  }

  async clickEditClass(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_SUA).first();
    await this.jsClick(btn);
    return this;
  }

  async clickDeleteClass(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_XOA).first();
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
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_EDIT_ZOOM).first();
    await this.jsClick(btn);
    return this;
  }

  /** Bấm nút "Meet" (bút sửa) — mở modal cấu hình link Google Meet cho lớp */
  async clickEditMeet(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_EDIT_MEET).first();
    await this.jsClick(btn);
    return this;
  }

  /**
   * Bấm nút "Zoom" dạng play (▶) — chỉ tồn tại khi lớp đã cấu hình Zoom.
   * Dùng hasZoomConfigured() trước khi gọi để tránh click vào nút không tồn tại.
   */
  async clickShowZoomInfo(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_SHOW_ZOOM_INFO).first();
    await this.jsClick(btn);
    return this;
  }

  /**
   * Bấm nút "Meet" dạng play (▶) — chỉ tồn tại khi lớp đã cấu hình Meet.
   * Dùng hasMeetConfigured() trước khi gọi để tránh click vào nút không tồn tại.
   */
  async clickShowMeetInfo(id: string): Promise<this> {
    const btn = this._cardById(id).locator(LopHocCuaTruongPage.BTN_SHOW_MEET_INFO).first();
    await this.jsClick(btn);
    return this;
  }
}