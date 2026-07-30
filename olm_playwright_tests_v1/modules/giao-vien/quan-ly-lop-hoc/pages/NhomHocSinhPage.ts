import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL, NHOM_HOC_SINH_URL, NHOM_HOC_SINH_DA_XOA_URL } from '@config/config';

/**
 * Page Object — Nhóm học sinh (1.2.2).
 *
 * Bao quát 2 màn hình:
 *  A) DANH SÁCH nhóm học sinh — {BASE_URL}/doi-tac/{username}/danh-sach-nhom?type=6
 *     Nhóm được gom theo từng "Khối" (VD: "Khối 12"), mỗi nhóm là 1 card
 *     (VD: "[ Nhóm ]12A2") với hành động Thiết lập / Tải về / Sửa / Xóa.
 *     Nếu GV chưa tạo/được giao lớp nào → hiển thị thông báo trống.
 *  B) QUẢN LÝ THÀNH VIÊN trong 1 nhóm — {BASE_URL}/lop/{slug}.{id}
 *     Đây thực chất là màn "Lớp học" dùng chung cho mọi loại lớp/nhóm, có
 *     nhiều tab hơn hẳn Nhóm giáo viên (Thành viên lớp học, Thống kê lớp
 *     học, Bài tập, Điểm danh, Giáo viên phụ trách, Duyệt vào lớp, Bảng
 *     điểm, Thảo luận, Sổ điểm Online, Tổng hợp đánh giá, Kết quả rèn
 *     luyện). Bảng thành viên ở đây ĐƠN GIẢN hơn bảng Nhóm giáo viên — chỉ
 *     có STT / Họ và tên / Tên đăng nhập / Hành động (không có Mật khẩu,
 *     Mã định danh, Ngày sinh, VIP, Ngày tạo, Tr.Nhóm, Khóa).
 *
 * So sánh với NhomGiaoVienPage (module quan-ly-giao-vien):
 *  - Toolbar Ở ĐÂY chỉ có 1 tập con: Thêm(chuyển) học sinh vào lớp / Xóa
 *    hàng loạt / Khôi phục / Reset thứ tự thành viên / Lọc học sinh / Mời
 *    thành viên / Tải danh sách — KHÔNG có Thiết lập mật khẩu mới, Đổi
 *    tiền tố, Tạo nhanh danh sách, Import danh sách, Đồng bộ dữ liệu ngành.
 *  - Nút "Sửa"/"Thêm nhóm" của card dùng chung class `.trigger-modal-form-group`
 *    (data-type="6"), khác class `.trigger-modal-form-group-teacher` bên
 *    Nhóm giáo viên.
 *
 * Lưu ý: dòng thành viên trong bảng chưa xác nhận được cấu trúc DOM đầy đủ
 * (bảng mẫu đang rỗng — nhóm 0 thành viên). Selector dòng/dropdown hành
 * động tạm dùng chung `.item-student` + `.dropdown-toggle` (đúng convention
 * đã xác nhận ở Nhóm giáo viên) — CẦN đối chiếu lại khi có DOM mẫu 1 dòng
 * học sinh thật để xác nhận chính xác các item trong dropdown "Tùy chọn".
 */

/** Tab điều hướng trong 1 nhóm/lớp học sinh */
export enum StudentGroupDetailTab {
  THANH_VIEN_LOP_HOC = 'Thành viên lớp học',
  THONG_KE_LOP_HOC = 'Thống kê lớp học',
  BAI_TAP = 'Bài tập',
  DIEM_DANH = 'Điểm danh',
  GIAO_VIEN_PHU_TRACH = 'Giáo viên phụ trách',
  DUYET_VAO_LOP = 'Duyệt vào lớp',
  BANG_DIEM = 'Bảng điểm',
  THAO_LUAN = 'Thảo luận',
  SO_DIEM_ONLINE = 'Sổ điểm Online',
  TONG_HOP_DANH_GIA = 'Tổng hợp đánh giá',
  KET_QUA_REN_LUYEN = 'Kết quả rèn luyện',
}

export interface StudentGroupCardInfo {
  name: string;
  url: string;
  memberCount: number;
  /** Tên khối chứa nhóm này (VD: "Khối 12") — rỗng nếu không xác định được */
  grade: string;
}

export interface StudentMemberRow {
  groupMemberId: string;
  userId: string;
  username: string;
  fullName: string;
}

export class NhomHocSinhPage extends BasePage {
  // ==================================================================
  // A. Danh sách nhóm học sinh — doi-tac/{username}/danh-sach-nhom?type=6
  // ==================================================================
  static readonly LIST_URL = NHOM_HOC_SINH_URL;
  static readonly BTN_THEM_NHOM = "button.trigger-modal-form-group:has-text('Thêm nhóm học sinh')";
  static readonly LINK_LOP_DA_XOA = "a:has-text('Lớp đã xóa'), a[href*='deleted=1']";
  static readonly LINK_HUONG_DAN = "a:has-text('Hướng dẫn tạo lớp học')";
  static readonly SELECT_NAM_HOC = "select:near(:text('Năm học'))";
  static readonly EMPTY_STATE = "text=Thầy(cô) chưa tạo hoặc được giao phụ trách lớp học nào";

  /** Tiêu đề từng khối (VD: "Khối 12") */
  static readonly GRADE_HEADING = "h5:has(span.d-block)";
  static readonly GRADE_DOWNLOAD_BTN = "a[href*='export-member-grade']";

  static readonly GROUP_CARD = '.card:has(.card-title a[href*="/lop/"]), .card-body:has(a[href*="/lop/"])';
  static readonly GROUP_CARD_LINK = '.card-title a[href*="/lop/"], a.olm-text-link[href*="/lop/"]';
  static readonly GROUP_CARD_BTN_THIET_LAP = "a:has-text('Thiết lập')";
  static readonly GROUP_CARD_BTN_TAI_VE = "a:has-text('Tải về')";
  static readonly GROUP_CARD_BTN_SUA = 'a.trigger-modal-form-group[data-type="6"]';
  static readonly GROUP_CARD_BTN_XOA = 'a.delete-group';

  // ==================================================================
  // B. Trang quản lý 1 nhóm/lớp học sinh — /lop/{slug}.{id}
  // ==================================================================
  static readonly DETAIL_TITLE = 'h3.fw-500';
  static readonly DETAIL_SHARE_CODE_INPUT = '#id-group';
  static readonly DETAIL_SUB_NAV = 'ul.nav.nav-tabs li a';

  // ── Toolbar hành động (Thành viên lớp học) ──────────────────────────
  static readonly BTN_THEM_CHUYEN_HS = 'button.add-exists-student';
  static readonly BTN_XOA_HANG_LOAT = 'button.btn-delete-multi';
  static readonly LINK_KHOI_PHUC = "a:has-text('Khôi phục')[href*='deleted=1']";
  static readonly BTN_RESET_THU_TU = 'button.btn-reset-order-member';
  static readonly BTN_LOC_HS = "button[data-target='#modal-filter-member']";
  static readonly BTN_MOI_THANH_VIEN = 'button.invite-member-with-member';
  static readonly LINK_TAI_DANH_SACH = "a[href*='export-member-group']";

  // ── Bảng thành viên (đơn giản: STT / Họ và tên / Tên đăng nhập / Hành động) ──
  static readonly TABLE = 'table.table-bordered';
  static readonly SELECT_ALL_CHECKBOX = '#select-all-member';
  static readonly MEMBER_ROW = 'tr.item-student';
  static readonly MEMBER_ROW_BY_USERNAME = (username: string): string =>
    `tr.item-student[data-username="${username}"]`;
  static readonly MEMBER_CHECKBOX = '.select-member';
  static readonly MEMBER_DROPDOWN_TOGGLE = '.dropdown-toggle';
  static readonly MEMBER_DROPDOWN_MENU = '.dropdown-menu';

  // ==================================================================
  // A. Danh sách nhóm học sinh — actions
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(NhomHocSinhPage.LIST_URL);
    return this;
  }

  isListPageLoaded(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('danh-sach-nhom') && url.includes('type=6');
  }

  async hasAddGroupButton(): Promise<boolean> {
    return (await this.findVisible([NhomHocSinhPage.BTN_THEM_NHOM], 8)) !== null;
  }

  async clickAddGroup(): Promise<this> {
    const btn = await this.findVisible([NhomHocSinhPage.BTN_THEM_NHOM], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async goToDeletedGroups(): Promise<this> {
    await this.navigateTo(NHOM_HOC_SINH_DA_XOA_URL);
    return this;
  }

  /** true nếu GV chưa được tạo/giao phụ trách lớp/nhóm nào (trang trống) */
  async isEmpty(): Promise<boolean> {
    return (await this.findVisible([NhomHocSinhPage.EMPTY_STATE], 5)) !== null;
  }

  /** Chọn năm học trong dropdown "Năm học" (VD: "2025 - 2026") */
  async selectSchoolYear(label: string): Promise<this> {
    const select = await this.findVisible([NhomHocSinhPage.SELECT_NAM_HOC], 8);
    if (select) await select.selectOption({ label });
    return this;
  }

  /**
   * Danh sách nhóm học sinh, gom theo khối. Duyệt DOM tuần tự: mỗi lần gặp
   * heading "Khối N" thì các card ngay sau đó (tới heading tiếp theo)
   * thuộc khối đó.
   */
  async getGroupCards(): Promise<StudentGroupCardInfo[]> {
    const links = await this.page.locator(NhomHocSinhPage.GROUP_CARD_LINK).all();
    const items: StudentGroupCardInfo[] = [];

    for (const link of links) {
      const name = ((await link.textContent()) ?? '').trim();
      const href = (await link.getAttribute('href')) ?? '';
      if (!name || !href) continue;

      let memberCount = 0;
      let grade = '';
      try {
        const card = link.locator('xpath=ancestor::*[contains(@class,"card-body")][1]');
        const countText =
          (await card.locator('.fa-user').locator('xpath=following-sibling::span[1]').textContent()) ?? '0';
        memberCount = parseInt(countText.trim(), 10) || 0;

        const gradeHeading = card.locator(
          'xpath=preceding::h5[.//span[contains(@class,"d-block")]][1]//span[contains(@class,"d-block")]'
        );
        grade = ((await gradeHeading.textContent().catch(() => '')) ?? '').trim();
      } catch {
        // giữ giá trị mặc định nếu không parse được
      }

      items.push({
        name,
        url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        memberCount,
        grade,
      });
    }
    return items;
  }

  async openGroupByName(name: string): Promise<this> {
    const link = this.page.locator(NhomHocSinhPage.GROUP_CARD_LINK).filter({ hasText: name }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  private _cardByName(name: string) {
    return this.page.locator(NhomHocSinhPage.GROUP_CARD).filter({ hasText: name }).first();
  }

  async clickGroupSettings(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomHocSinhPage.GROUP_CARD_BTN_THIET_LAP).first();
    await this.jsClick(btn);
    return this;
  }

  async downloadGroupList(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomHocSinhPage.GROUP_CARD_BTN_TAI_VE).first();
    await this.jsClick(btn);
    return this;
  }

  async clickEditGroup(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomHocSinhPage.GROUP_CARD_BTN_SUA).first();
    await this.jsClick(btn);
    return this;
  }

  async clickDeleteGroup(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomHocSinhPage.GROUP_CARD_BTN_XOA).first();
    await this.jsClick(btn);
    return this;
  }

  /** Tải DS học sinh - phòng thi cho cả 1 khối (nút cạnh tiêu đề "Khối N") */
  async downloadGradeExamList(grade: number | string): Promise<this> {
    const link = this.page.locator(`a[href*="export-member-grade/${grade}"]`).first();
    await this.jsClick(link);
    return this;
  }

  // ==================================================================
  // B. Trang quản lý 1 nhóm/lớp học sinh — actions
  // ==================================================================

  isGroupDetailLoaded(): boolean {
    return this.getCurrentUrl().includes('/lop/');
  }

  async getGroupTitle(): Promise<string> {
    const el = await this.findVisible([NhomHocSinhPage.DETAIL_TITLE], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async getShareCode(): Promise<string> {
    const input = this.page.locator(NhomHocSinhPage.DETAIL_SHARE_CODE_INPUT).first();
    return ((await input.getAttribute('value')) ?? '').trim();
  }

  async switchTab(tab: StudentGroupDetailTab): Promise<this> {
    const link = this.page.locator(NhomHocSinhPage.DETAIL_SUB_NAV).filter({ hasText: tab }).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getMemberRows(): Promise<StudentMemberRow[]> {
    const rows = await this.page.locator(NhomHocSinhPage.MEMBER_ROW).all();
    const result: StudentMemberRow[] = [];
    for (const row of rows) {
      const groupMemberId = (await row.getAttribute('data-id')) ?? '';
      const userId = (await row.getAttribute('data-user')) ?? '';
      const username = (await row.getAttribute('data-username')) ?? '';
      const fullName = (await row.getAttribute('data-name')) ?? '';
      if (!username) continue;
      result.push({ groupMemberId, userId, username, fullName });
    }
    return result;
  }

  async getMemberCount(): Promise<number> {
    return (await this.getMemberRows()).length;
  }

  private _rowByUsername(username: string) {
    return this.page.locator(NhomHocSinhPage.MEMBER_ROW_BY_USERNAME(username));
  }

  async selectMember(username: string): Promise<this> {
    const checkbox = this._rowByUsername(username).locator(NhomHocSinhPage.MEMBER_CHECKBOX).first();
    await checkbox.check({ force: true });
    return this;
  }

  async selectAllMembers(): Promise<this> {
    const checkbox = await this.findVisible([NhomHocSinhPage.SELECT_ALL_CHECKBOX], 8);
    if (checkbox) await checkbox.check({ force: true });
    return this;
  }

  async deleteSelectedMembers(): Promise<this> {
    const btn = await this.findVisible([NhomHocSinhPage.BTN_XOA_HANG_LOAT], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickAddOrMoveStudent(): Promise<this> {
    const btn = await this.findVisible([NhomHocSinhPage.BTN_THEM_CHUYEN_HS], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async openFilterMembersModal(): Promise<this> {
    const btn = await this.findVisible([NhomHocSinhPage.BTN_LOC_HS], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickInviteMember(): Promise<this> {
    const btn = await this.findVisible([NhomHocSinhPage.BTN_MOI_THANH_VIEN], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickResetMemberOrder(): Promise<this> {
    const btn = await this.findVisible([NhomHocSinhPage.BTN_RESET_THU_TU], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async downloadMemberList(): Promise<this> {
    const link = await this.findVisible([NhomHocSinhPage.LINK_TAI_DANH_SACH], 8);
    if (link) await this.jsClick(link);
    return this;
  }

  /** Mở dropdown "Hành động" của 1 dòng học sinh */
  async openMemberActionMenu(username: string): Promise<this> {
    const toggle = this._rowByUsername(username).locator(NhomHocSinhPage.MEMBER_DROPDOWN_TOGGLE).first();
    await this.jsClick(toggle);
    return this;
  }
}