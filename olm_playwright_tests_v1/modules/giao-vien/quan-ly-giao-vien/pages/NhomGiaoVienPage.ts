import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL, TO_BO_MON_URL, NHOM_GV_DA_XOA_URL, PHAN_CONG_GIANG_DAY_URL } from '@config/config';

/**
 * Page Object — Nhóm giáo viên (1.1.1).
 *
 * Bao quát 2 màn hình:
 *  A) DANH SÁCH nhóm giáo viên — {BASE_URL}/truong-hoc/{slug}/to-bo-mon
 *     Mỗi nhóm là 1 card (VD: "Giáo viên toàn trường") với các hành động:
 *     Thiết lập / Tải về / Sửa / Xóa, cộng thêm nút Zoom/Meet riêng.
 *  B) QUẢN LÝ THÀNH VIÊN trong 1 nhóm — {BASE_URL}/nhom/{slug}.{id}
 *     Bảng danh sách giáo viên (thêm nhanh / import / lọc / mời / đồng bộ…),
 *     mỗi dòng có checkbox chọn, Tr.Nhóm, Khóa, và dropdown "Tùy chọn"
 *     (Đăng nhập / Phân quyền quản lý / Phân quyền trưởng khối / Phân lớp
 *     phụ trách / Chuyển nhóm / Sửa thông tin giáo viên / Xóa khỏi trường /
 *     Xóa khỏi nhóm).
 *
 * Lưu ý DOM thực tế: các dòng thành viên dùng chung class `.item-student`
 * (tái dùng component từ màn Lớp học), dù đang liệt kê GIÁO VIÊN — giữ
 * nguyên tên selector theo DOM để tránh lệch khi олм đổi UI.
 *
 * Dùng kết hợp:
 *   const page = new NhomGiaoVienPage(p);
 *   await page.open();                         // vào danh sách nhóm
 *   await page.openGroupByName('Giáo viên toàn trường');  // vào quản lý nhóm
 */

/** Hành động trong dropdown "Tùy chọn" của 1 dòng thành viên */
export enum MemberDropdownAction {
  DANG_NHAP = 'Đăng nhập',
  PHAN_QUYEN_QUAN_LY = 'Phân quyền quản lý',
  PHAN_QUYEN_TRUONG_KHOI = 'Phân quyền trưởng khối',
  PHAN_LOP_PHU_TRACH = 'Phân lớp phụ trách',
  CHUYEN_NHOM = 'Chuyển nhóm',
  SUA_THONG_TIN = 'Sửa thông tin giáo viên',
  XOA_KHOI_TRUONG = 'Xóa khỏi trường',
  XOA_KHOI_NHOM = 'Xóa khỏi nhóm',
}

/** Tab điều hướng trong 1 nhóm giáo viên (Quản lý nhóm / Thống kê / Bài tập / Duyệt vào nhóm) */
export enum GroupDetailTab {
  QUAN_LY_NHOM = 'Quản lý nhóm',
  THONG_KE = 'Thống kê',
  BAI_TAP = 'Bài tập',
  DUYET_VAO_NHOM = 'Duyệt vào nhóm',
}

export interface GroupCardInfo {
  name: string;
  url: string;
  memberCount: number;
}

export interface TeacherMemberRow {
  groupMemberId: string; // data-id (VD: 105729553340)
  userId: string; // data-user (VD: 17184386779406)
  username: string;
  fullName: string;
}

export class NhomGiaoVienPage extends BasePage {
  // ==================================================================
  // A. Danh sách nhóm giáo viên — {slug}/to-bo-mon
  // ==================================================================
  static readonly LIST_URL = TO_BO_MON_URL;
  static readonly LIST_TITLE = "h5:has-text('Danh sách nhóm giáo viên')";
  static readonly BTN_PHAN_CONG_GIANG_DAY = "a:has-text('Phân công giảng dạy')";
  static readonly BTN_THEM_NHOM = 'button.trigger-modal-form-group-teacher, .trigger-modal-form-group-teacher';
  static readonly LINK_NHOM_DA_XOA = "a:has-text('Nhóm đã xóa'), a[href*='deleted=1']";

  /** Card của 1 nhóm giáo viên trong danh sách (bao ngoài card-body) */
  static readonly GROUP_CARD = '.card:has(.card-title a[href*="/nhom/"]), .card-body:has(a[href*="/nhom/"])';
  static readonly GROUP_CARD_LINK = '.card-title a[href*="/nhom/"], a.olm-text-link[href*="/nhom/"]';
  static readonly GROUP_CARD_MEMBER_COUNT = '.card-title .fa-user + span, .card-title span.ml-1';
  static readonly GROUP_CARD_BTN_THIET_LAP = "a:has-text('Thiết lập')";
  static readonly GROUP_CARD_BTN_TAI_VE = "a:has-text('Tải về')";
  static readonly GROUP_CARD_BTN_SUA = 'a.trigger-modal-form-group-teacher[data-type="1"]';
  /** Chỉ hiển thị khi nhóm đã bị xóa mềm (xuất hiện cùng lúc với Sửa/Xóa trên cùng 1 card) */
  static readonly GROUP_CARD_BTN_KHOI_PHUC = 'a.restore-group';
  static readonly GROUP_CARD_BTN_XOA = 'a.delete-group';
  static readonly GROUP_CARD_BTN_ZOOM = 'button.update-zoom';
  static readonly GROUP_CARD_BTN_MEET = 'button.update-meet';

  // ==================================================================
  // B. Trang quản lý 1 nhóm giáo viên — /nhom/{slug}.{id}
  // ==================================================================
  static readonly DETAIL_TITLE = 'h3.fw-500';
  static readonly DETAIL_SHARE_CODE_INPUT = '#id-group';
  static readonly DETAIL_SHARE_CODE_COPY_BTN = "[data-toggle='copy-text'][data-target='#id-group']";
  static readonly DETAIL_GROUP_SWITCH_SELECT = "select[onchange*='window.location.href']";
  static readonly DETAIL_SUB_NAV = 'ul.nav.nav-tabs li a';

  // ── Toolbar hành động (Quản lý nhóm) ────────────────────────────────
  static readonly BTN_XOA_HANG_LOAT = 'button.btn-delete-multi';
  static readonly LINK_KHOI_PHUC = "a:has-text('Khôi phục')[href*='deleted=1']";
  static readonly BTN_THIET_LAP_MK_MOI = 'button.btn-reset-pass-all';
  static readonly LINK_DOI_TIEN_TO = "a[href*='doi-tien-to']";
  static readonly BTN_TAO_NHANH_DS = 'button.quick-import-member';
  static readonly BTN_IMPORT_DS = 'button.import-file-member';
  static readonly BTN_THEM_CHUYEN_GV = 'button.add-exists-student';
  static readonly BTN_LOC_GV = "button[data-target='#modal-filter-member']";
  static readonly BTN_MOI_THANH_VIEN = 'button.invite-member-with-member';
  static readonly BTN_DONG_BO_NGANH = 'button.btn-sync-data-with-government';
  static readonly BTN_RESET_THU_TU = 'button.btn-reset-order-member';
  static readonly LINK_TAI_DANH_SACH = "a[href*='export-member-group']";

  // ── Bảng thành viên ──────────────────────────────────────────────────
  static readonly TABLE = 'table.table-bordered';
  static readonly SELECT_ALL_CHECKBOX = '#select-all-member';
  /** Dòng "thêm nhanh" luôn ở đầu bảng (STT = 0) */
  static readonly QUICK_ADD_ROW = 'tr.form-add-member.sort-disabled';
  static readonly MEMBER_ROW = 'tr.item-student';
  static readonly MEMBER_ROW_BY_USERNAME = (username: string): string =>
    `tr.item-student[data-username="${username}"]`;
  static readonly MEMBER_CHECKBOX = '.select-member';
  static readonly MEMBER_DROPDOWN_TOGGLE = '.dropdown-toggle';
  static readonly MEMBER_DROPDOWN_MENU = '.dropdown-menu';
  static readonly MEMBER_EDIT_PASSWORD_ICON = '.view-password';
  static readonly MEMBER_SAVE_PASSWORD_ICON = '.btn-save-password i';

  // ==================================================================
  // A. Danh sách nhóm giáo viên — actions
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(NhomGiaoVienPage.LIST_URL);
    return this;
  }

  isListPageLoaded(): boolean {
    return this.getCurrentUrl().includes('to-bo-mon');
  }

  async hasAddGroupButton(): Promise<boolean> {
    return (await this.findVisible([NhomGiaoVienPage.BTN_THEM_NHOM], 8)) !== null;
  }

  async clickAddGroup(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_THEM_NHOM], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async goToPhanCongGiangDay(): Promise<this> {
    const link = await this.findVisible([NhomGiaoVienPage.BTN_PHAN_CONG_GIANG_DAY], 8);
    if (link) {
      await this.jsClick(link);
    } else {
      await this.navigateTo(PHAN_CONG_GIANG_DAY_URL);
    }
    return this;
  }

  async goToDeletedGroups(): Promise<this> {
    await this.navigateTo(NHOM_GV_DA_XOA_URL);
    return this;
  }

  /** Danh sách nhóm giáo viên hiển thị trên trang (tên, url, số thành viên) */
  async getGroupCards(): Promise<GroupCardInfo[]> {
    const links = await this.page.locator(NhomGiaoVienPage.GROUP_CARD_LINK).all();
    const items: GroupCardInfo[] = [];

    for (const link of links) {
      const name = ((await link.textContent()) ?? '').trim();
      const href = (await link.getAttribute('href')) ?? '';
      if (!name || !href) continue;

      // Số thành viên: span ngay sau icon fa-user, nằm cùng h6.card-title với link
      let memberCount = 0;
      try {
        const card = link.locator('xpath=ancestor::*[contains(@class,"card-body")][1]');
        const countText = (await card.locator('.fa-user').locator('xpath=following-sibling::span[1]').textContent()) ?? '0';
        memberCount = parseInt(countText.trim(), 10) || 0;
      } catch {
        memberCount = 0;
      }

      items.push({
        name,
        url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        memberCount,
      });
    }
    return items;
  }

  /** Mở trang quản lý 1 nhóm giáo viên theo tên hiển thị trên card */
  async openGroupByName(name: string): Promise<this> {
    const link = this.page.locator(NhomGiaoVienPage.GROUP_CARD_LINK).filter({ hasText: name }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  private _cardByName(name: string) {
    return this.page.locator(NhomGiaoVienPage.GROUP_CARD).filter({ hasText: name }).first();
  }

  async clickGroupSettings(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienPage.GROUP_CARD_BTN_THIET_LAP).first();
    await this.jsClick(btn);
    return this;
  }

  async downloadGroupList(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienPage.GROUP_CARD_BTN_TAI_VE).first();
    await this.jsClick(btn);
    return this;
  }

  async clickEditGroup(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienPage.GROUP_CARD_BTN_SUA).first();
    await this.jsClick(btn);
    return this;
  }

  async clickDeleteGroup(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienPage.GROUP_CARD_BTN_XOA).first();
    await this.jsClick(btn);
    return this;
  }

  /** Chỉ dùng được khi card đang hiển thị nút "Khôi phục" (nhóm đã bị xóa mềm) */
  async clickRestoreGroup(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienPage.GROUP_CARD_BTN_KHOI_PHUC).first();
    await this.jsClick(btn);
    return this;
  }

  // ==================================================================
  // B. Trang quản lý 1 nhóm giáo viên — actions
  // ==================================================================

  isGroupDetailLoaded(): boolean {
    return this.getCurrentUrl().includes('/nhom/');
  }

  async getGroupTitle(): Promise<string> {
    const el = await this.findVisible([NhomGiaoVienPage.DETAIL_TITLE], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  /** Mã chia sẻ nhóm (VD: olm-1.401318959) */
  async getShareCode(): Promise<string> {
    const input = this.page.locator(NhomGiaoVienPage.DETAIL_SHARE_CODE_INPUT).first();
    return ((await input.getAttribute('value')) ?? '').trim();
  }

  async switchTab(tab: GroupDetailTab): Promise<this> {
    const link = this.page.locator(NhomGiaoVienPage.DETAIL_SUB_NAV).filter({ hasText: tab }).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Danh sách thành viên (giáo viên) trong bảng — không tính dòng "thêm nhanh" */
  async getMemberRows(): Promise<TeacherMemberRow[]> {
    const rows = await this.page.locator(NhomGiaoVienPage.MEMBER_ROW).all();
    const result: TeacherMemberRow[] = [];
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
    return this.page.locator(NhomGiaoVienPage.MEMBER_ROW_BY_USERNAME(username));
  }

  async selectMember(username: string): Promise<this> {
    const checkbox = this._rowByUsername(username).locator(NhomGiaoVienPage.MEMBER_CHECKBOX).first();
    await checkbox.check({ force: true });
    return this;
  }

  async selectAllMembers(): Promise<this> {
    const checkbox = await this.findVisible([NhomGiaoVienPage.SELECT_ALL_CHECKBOX], 8);
    if (checkbox) await checkbox.check({ force: true });
    return this;
  }

  async deleteSelectedMembers(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_XOA_HANG_LOAT], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async resetPasswordAllMembers(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_THIET_LAP_MK_MOI], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async goToChangeUsernamePrefix(): Promise<this> {
    const link = await this.findVisible([NhomGiaoVienPage.LINK_DOI_TIEN_TO], 8);
    if (link) await this.jsClick(link);
    return this;
  }

  async clickQuickCreateMembers(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_TAO_NHANH_DS], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickImportMembers(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_IMPORT_DS], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickAddExistingMember(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_THEM_CHUYEN_GV], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async openFilterMembersModal(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_LOC_GV], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickInviteMember(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_MOI_THANH_VIEN], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickSyncWithGovernmentData(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_DONG_BO_NGANH], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async clickResetMemberOrder(): Promise<this> {
    const btn = await this.findVisible([NhomGiaoVienPage.BTN_RESET_THU_TU], 8);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async downloadMemberList(): Promise<this> {
    const link = await this.findVisible([NhomGiaoVienPage.LINK_TAI_DANH_SACH], 8);
    if (link) await this.jsClick(link);
    return this;
  }

  /** Bật tắt checkbox "Tr.Nhóm" (nhóm trưởng / tổ trưởng) của 1 thành viên */
  async toggleTruongNhom(username: string): Promise<this> {
    const checkbox = this._rowByUsername(username).locator('.check-role-boss').first();
    await checkbox.click({ force: true });
    return this;
  }

  async isTruongNhomChecked(username: string): Promise<boolean> {
    const checkbox = this._rowByUsername(username).locator('.check-role-boss').first();
    return checkbox.isChecked();
  }

  /** Bật tắt checkbox "Khóa" (khóa/mở khóa tài khoản) của 1 thành viên */
  async toggleKhoaTaiKhoan(username: string): Promise<this> {
    const checkbox = this._rowByUsername(username).locator('.check-block').first();
    await checkbox.click({ force: true });
    return this;
  }

  async isKhoaTaiKhoanChecked(username: string): Promise<boolean> {
    const checkbox = this._rowByUsername(username).locator('.check-block').first();
    return checkbox.isChecked();
  }

  /** Mở dropdown "Tùy chọn" của 1 dòng thành viên */
  async openMemberActionMenu(username: string): Promise<this> {
    const toggle = this._rowByUsername(username).locator(NhomGiaoVienPage.MEMBER_DROPDOWN_TOGGLE).first();
    await this.jsClick(toggle);
    return this;
  }

  /** Mở dropdown rồi bấm 1 hành động cụ thể (VD: "Xóa khỏi nhóm") */
  async clickMemberAction(username: string, action: MemberDropdownAction): Promise<this> {
    await this.openMemberActionMenu(username);
    const row = this._rowByUsername(username);
    const item = row.locator(NhomGiaoVienPage.MEMBER_DROPDOWN_MENU).getByText(action, { exact: true }).first();
    await item.waitFor({ state: 'visible', timeout: 5_000 });
    await this.jsClick(item);
    return this;
  }

  /** Sửa mật khẩu 1 thành viên trực tiếp trên dòng (bấm icon bút → gõ → lưu) */
  async updateMemberPassword(username: string, newPassword: string): Promise<this> {
    const row = this._rowByUsername(username);
    const editIcon = row.locator(NhomGiaoVienPage.MEMBER_EDIT_PASSWORD_ICON).first();
    await this.jsClick(editIcon);

    const input = row.locator('input[name="password"]').first();
    await input.waitFor({ state: 'visible', timeout: 5_000 });
    await this.jsClearAndType(input, newPassword);

    const saveIcon = row.locator(NhomGiaoVienPage.MEMBER_SAVE_PASSWORD_ICON).first();
    await this.jsClick(saveIcon);
    return this;
  }

  /**
   * Thêm nhanh 1 giáo viên qua dòng đầu bảng (STT = 0): điền Họ và tên /
   * Tên đăng nhập / Mật khẩu rồi bấm "Lưu".
   */
  async quickAddMemberInline(fullName: string, username: string, password: string): Promise<this> {
    const row = this.page.locator(NhomGiaoVienPage.QUICK_ADD_ROW).first();
    await row.locator('input[name="name"]').fill(fullName);
    await row.locator('input[name="username"]').fill(username);
    await row.locator('input[name="password"]').fill(password);

    const saveBtn = row.locator("button:has-text('Lưu')").first();
    await this.jsClick(saveBtn);
    return this;
  }
}