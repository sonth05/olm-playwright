import { BasePage } from '@core/shared-pages/BasePage';
import { PHAN_CONG_GIANG_DAY_URL } from '@config/config';

/**
 * Page Object — Phân công giảng dạy (1.1.2).
 * URL: {BASE_URL}/truong-hoc/{slug}/phan-cong-giang-day
 *
 * Trang gồm 2 phần:
 *  A) Thanh điều hướng dùng chung của khu vực quản trị trường (Giới thiệu /
 *     Giáo viên / Thống kê / Lớp học / Khóa học / Thống kê dung lượng /
 *     Bài đã giao / Nâng lớp / Điểm danh / Xếp TKB / Thảo luận trong trường)
 *     — chung UI với các trang quản trị trường khác, KHÔNG lặp lại logic ở
 *     đây ngoài phần điều hướng tối thiểu (switchAdminTab).
 *  B) Bảng "Phân công nhiệm vụ cho giáo viên" (#timetable-schedules).
 *
 * DOM bảng phân công dùng rowspan để gộp ô theo từng "block" 1 giáo viên,
 * số dòng <tr> mỗi block KHÔNG cố định (phụ thuộc số môn đã phân công), nên
 * KHÔNG thể chọn chính xác từng dòng chỉ bằng CSS selector đơn thuần. Cấu
 * trúc 1 block (theo đúng thứ tự DOM):
 *   1. tr[id^="teacher-schedule-{update|create}-{teacherId}"]  — GIÁO VIÊN
 *      (rowspan trùng tổng số dòng của cả block: tên, username, nhóm, nút
 *      "Xóa giáo viên" — dạng span.text-danger.hand HOẶC button, tùy loại
 *      tài khoản GV: GV trường tạo trực tiếp vs GV được thêm qua đối tác).
 *   2. tr[id^="teacher-self-assignment-{teacherId}"]            — TỰ PHÂN CÔNG
 *      (checkbox #checkbox-{teacherId}, nhãn "Cho phép").
 *   3. tr[id^="teacher-boss-{update|create}-{teacherId}"]       — CHỦ NHIỆM LỚP
 *      (input readonly "Chọn lớp chủ nhiệm" — click sẽ mở picker, KHÔNG gõ
 *      trực tiếp; modal picker này ngoài phạm vi HTML đã khảo sát nên
 *      openChooseHomeroomClass() chỉ dừng ở bước click).
 *   4. 0..n tr — mỗi dòng 1 phân công MÔN + LỚP đã có sẵn (input readonly
 *      "Mời chọn môn" + input readonly "Vui lòng chọn lớp tương ứng" + nút
 *      "Xóa" — class btn-schedule-delete).
 *   5. 1 tr cuối cùng của block — dòng THÊM MỚI: <select> chọn Môn (giữ
 *      nguyên <select> gốc phía sau lớp phủ select2 nên selectOption() vẫn
 *      dùng trực tiếp được, không cần thao tác UI select2) + input "Vui
 *      lòng chọn lớp tương ứng" (disabled tới khi đã chọn Môn — cũng mở
 *      picker khi click, không gõ trực tiếp) + nút "Thêm" (btn-schedule-add).
 *
 * Ranh giới của 1 block = từ dòng "boss" tới ngay TRƯỚC dòng
 * tr[id^="teacher-schedule-"] kế tiếp (hoặc hết bảng, nếu là GV cuối cùng).
 * _blockRowRange() dùng evaluateAll() lấy 1 lần toàn bộ id các <tr> trong
 * tbody (thay vì awaited getAttribute() từng dòng) để tính ranh giới này
 * chính xác & nhanh, do rowspan không đáng tin cậy để suy ra số dòng thật.
 *
 * Dùng kết hợp:
 *   const page = new PhanCongGiangDayPage(p);
 *   await page.open();
 *   const blocks = await page.getTeacherBlocks();
 *   const subjects = await page.getSubjectAssignments(blocks[0].bossRowId);
 */

/** Tab điều hướng dùng chung ở đầu các trang quản trị trường */
export enum SchoolAdminTab {
  GIOI_THIEU = 'Giới thiệu',
  GIAO_VIEN = 'Giáo viên',
  THONG_KE = 'Thống kê',
  LOP_HOC = 'Lớp học',
  KHOA_HOC = 'Khóa học',
  THONG_KE_DUNG_LUONG = 'Thống kê dung lượng',
  BAI_DA_GIAO = 'Bài đã giao',
  NANG_LOP = 'Nâng lớp',
  DIEM_DANH = 'Điểm danh',
  XEP_TKB = 'Xếp TKB',
  THAO_LUAN_TRONG_TRUONG = 'Thảo luận trong trường',
}

export interface TeacherAssignmentBlock {
  teacherId: string;
  infoRowId: string;
  bossRowId: string;
  /** Tên hiển thị kèm số thứ tự, VD: "1. Nguyễn Văn An" */
  name: string;
  username: string;
  /** Rỗng nếu GV không thuộc nhóm nào */
  group: string;
  /** Value của ô "Chọn lớp chủ nhiệm", rỗng nếu GV chưa là chủ nhiệm lớp nào */
  homeroomClass: string;
}

export interface SubjectAssignmentRow {
  subject: string;
  classes: string;
}

export class PhanCongGiangDayPage extends BasePage {
  static readonly URL = PHAN_CONG_GIANG_DAY_URL;

  // ── Thanh điều hướng dùng chung ──────────────────────────────────────
  static readonly ADMIN_TAB_NAV = '#pills-tab';
  static readonly ADMIN_TAB_LINK = '#pills-tab li a';

  // ── Header trang ──────────────────────────────────────────────────────
  static readonly PAGE_TITLE = "h3:has-text('Phân công nhiệm vụ cho giáo viên')";
  static readonly CTRL_F_NOTE = "small.text-danger:has-text('Ctrl + F')";
  static readonly SCHOOL_YEAR_SELECT = 'select.select-school-year';
  static readonly TEACHER_LIST_FILTER_SELECT =
    "select.custom-select:has(option:has-text('Danh sách giáo viên hiện tại'))";

  // ── Bảng phân công ────────────────────────────────────────────────────
  static readonly TABLE = '#timetable-schedules';
  static readonly TABLE_BODY_ROWS = `${PhanCongGiangDayPage.TABLE} tbody > tr`;
  static readonly HEADER_CHECKBOX_ASSIGN_ALL = '#checkbox-assign-all';
  static readonly HEADER_CHECKBOX_CAN_MANAGE_CLASS = '#checkbox-can-manage-class';

  static readonly TEACHER_INFO_ROW = 'tr[id^="teacher-schedule-"]';
  static readonly DELETE_TEACHER_TRIGGER =
    "span.text-danger.hand:has-text('Xóa giáo viên'), button:has-text('Xóa giáo viên')";
  static readonly SELF_ASSIGNMENT_CHECKBOX = (teacherId: string): string => `#checkbox-${teacherId}`;
  static readonly BOSS_ROW_BY_TEACHER_ID = (teacherId: string): string =>
    `tr[id="teacher-boss-update-${teacherId}"], tr[id="teacher-boss-create-${teacherId}"]`;
  static readonly BOSS_CLASS_INPUT = 'input[placeholder="Chọn lớp chủ nhiệm"]';

  static readonly SUBJECT_DELETE_BTN = 'button.btn-schedule-delete';
  static readonly SUBJECT_ADD_BTN = 'button.btn-schedule-add';
  static readonly SUBJECT_SELECT2 = 'select.select2-hidden-accessible';
  static readonly SUBJECT_INPUT = 'input[placeholder="Mời chọn môn"]';
  static readonly CLASS_INPUT = 'input[placeholder="Vui lòng chọn lớp tương ứng"]';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(PhanCongGiangDayPage.URL);
    await this.waitForSelector(PhanCongGiangDayPage.TABLE, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('phan-cong-giang-day');
  }

  async getTitle(): Promise<string> {
    const el = await this.findVisible([PhanCongGiangDayPage.PAGE_TITLE], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  /**
   * Chuyển sang 1 tab khác trong thanh điều hướng quản trị trường.
   * LƯU Ý: tab "Nâng lớp" điều hướng sang miền URL khác
   * ({BASE_URL}/doi-tac/{username}/thiet-lap), không thuộc {slug}/... như
   * các tab còn lại — vẫn bấm bình thường qua link, KHÔNG cần xử lý riêng.
   */
  async switchAdminTab(tab: SchoolAdminTab): Promise<this> {
    const link = this.page.locator(PhanCongGiangDayPage.ADMIN_TAB_LINK).filter({ hasText: tab }).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Header — Năm học / Danh sách hiện tại-đã xóa
  // ==================================================================

  async selectSchoolYear(year: string): Promise<this> {
    const select = this.page.locator(PhanCongGiangDayPage.SCHOOL_YEAR_SELECT).first();
    await select.selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    const select = this.page.locator(PhanCongGiangDayPage.SCHOOL_YEAR_SELECT).first();
    return select.inputValue();
  }

  /** show=false → chuyển sang "Danh sách giáo viên bị xóa" (value="1") */
  async showActiveTeachers(show = true): Promise<this> {
    const select = this.page.locator(PhanCongGiangDayPage.TEACHER_LIST_FILTER_SELECT).first();
    await select.selectOption(show ? '0' : '1');
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getTeacherListFilterValue(): Promise<string> {
    const select = this.page.locator(PhanCongGiangDayPage.TEACHER_LIST_FILTER_SELECT).first();
    return select.inputValue();
  }

  /** Checkbox "Tất cả" ở đầu cột TỰ PHÂN CÔNG — bật/tắt tự phân công cho toàn bộ GV cùng lúc */
  async toggleAssignAllHeaderCheckbox(): Promise<this> {
    const checkbox = this.page.locator(PhanCongGiangDayPage.HEADER_CHECKBOX_ASSIGN_ALL);
    await checkbox.click({ force: true });
    return this;
  }

  /** Checkbox "Quyền thêm/sửa/xoá HS của lớp" ở đầu cột CHỦ NHIỆM LỚP — mặc định đang bật (checked) */
  async isManageClassPermissionChecked(): Promise<boolean> {
    return this.page.locator(PhanCongGiangDayPage.HEADER_CHECKBOX_CAN_MANAGE_CLASS).isChecked();
  }

  async toggleManageClassPermission(): Promise<this> {
    const checkbox = this.page.locator(PhanCongGiangDayPage.HEADER_CHECKBOX_CAN_MANAGE_CLASS);
    await checkbox.click({ force: true });
    return this;
  }

  // ==================================================================
  // Danh sách block giáo viên
  // ==================================================================

  private _extractTeacherId(infoRowId: string): string {
    return infoRowId.replace(/^teacher-schedule-(update|create)-/, '');
  }

  /**
   * Toàn bộ block giáo viên trong bảng, theo đúng thứ tự hiển thị.
   * Không tính số dòng phân công môn (xem getSubjectAssignments()).
   */
  async getTeacherBlocks(): Promise<TeacherAssignmentBlock[]> {
    const infoRows = await this.page.locator(PhanCongGiangDayPage.TEACHER_INFO_ROW).all();
    const blocks: TeacherAssignmentBlock[] = [];

    for (const infoRow of infoRows) {
      const infoRowId = (await infoRow.getAttribute('id')) ?? '';
      if (!infoRowId) continue;
      const teacherId = this._extractTeacherId(infoRowId);

      const name = ((await infoRow.locator('.font-weight-bolder').first().textContent()) ?? '').trim();

      const infoLines = infoRow.locator('.font-weight-light');
      const lineCount = await infoLines.count();
      const username = lineCount > 0 ? ((await infoLines.nth(0).textContent()) ?? '').trim() : '';
      const groupRaw = lineCount > 1 ? ((await infoLines.nth(1).textContent()) ?? '').trim() : '';
      const group = groupRaw.replace(/^Nhóm:\s*/, '').replace(/,\s*$/, '');

      const bossRow = this.page.locator(PhanCongGiangDayPage.BOSS_ROW_BY_TEACHER_ID(teacherId)).first();
      const bossRowId = (await bossRow.getAttribute('id')) ?? '';
      const homeroomClass = (
        (await bossRow.locator(PhanCongGiangDayPage.BOSS_CLASS_INPUT).first().getAttribute('value')) ?? ''
      ).trim();

      blocks.push({ teacherId, infoRowId, bossRowId, name, username, group, homeroomClass });
    }
    return blocks;
  }

  async getTeacherCount(): Promise<number> {
    return (await this.getTeacherBlocks()).length;
  }

  /** Tìm block giáo viên theo tên hiển thị (khớp 1 phần, VD: "Nguyễn Văn An" — không cần số thứ tự đứng trước) */
  async findTeacherBlockByName(namePart: string): Promise<TeacherAssignmentBlock | null> {
    const blocks = await this.getTeacherBlocks();
    return blocks.find((b) => b.name.includes(namePart)) ?? null;
  }

  // ==================================================================
  // Thao tác trên 1 block giáo viên
  // ==================================================================

  async toggleSelfAssignment(teacherId: string): Promise<this> {
    const checkbox = this.page.locator(PhanCongGiangDayPage.SELF_ASSIGNMENT_CHECKBOX(teacherId));
    await checkbox.click({ force: true });
    return this;
  }

  async isSelfAssignmentChecked(teacherId: string): Promise<boolean> {
    return this.page.locator(PhanCongGiangDayPage.SELF_ASSIGNMENT_CHECKBOX(teacherId)).isChecked();
  }

  /** Bấm ô "Chọn lớp chủ nhiệm" — mở picker (thao tác trong picker ngoài phạm vi page object này) */
  async openChooseHomeroomClass(teacherId: string): Promise<this> {
    const bossRow = this.page.locator(PhanCongGiangDayPage.BOSS_ROW_BY_TEACHER_ID(teacherId)).first();
    const input = bossRow.locator(PhanCongGiangDayPage.BOSS_CLASS_INPUT).first();
    await this.jsClick(input);
    return this;
  }

  async deleteTeacher(infoRowId: string): Promise<this> {
    const row = this.page.locator(`tr[id="${infoRowId}"]`);
    const trigger = row.locator(PhanCongGiangDayPage.DELETE_TEACHER_TRIGGER).first();
    await this.jsClick(trigger);
    return this;
  }

  // ==================================================================
  // Phân công MÔN + LỚP (dòng con trong 1 block, ranh giới không cố định)
  // ==================================================================

  /**
   * Xác định vị trí (index trong TABLE_BODY_ROWS) của các dòng thuộc 1
   * block, tính từ ngay SAU dòng "boss" tới TRƯỚC dòng
   * tr[id^="teacher-schedule-"] kế tiếp (hoặc hết bảng).
   * Dùng evaluateAll() để lấy toàn bộ id các <tr> trong 1 lần round-trip,
   * tránh awaited getAttribute() lặp lại trên hàng chục dòng (bảng có thể
   * có 30+ GV × tối đa ~5-6 dòng/GV).
   */
  private async _blockRowRange(bossRowId: string): Promise<{ start: number; end: number }> {
    const ids = await this.page
      .locator(PhanCongGiangDayPage.TABLE_BODY_ROWS)
      .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).id || ''));

    const bossIdx = ids.indexOf(bossRowId);
    const start = bossIdx === -1 ? -1 : bossIdx + 1;
    let end = ids.length;
    if (start !== -1) {
      for (let i = start; i < ids.length; i++) {
        if (ids[i].startsWith('teacher-schedule-')) {
          end = i;
          break;
        }
      }
    }
    return { start, end };
  }

  /** Các dòng MÔN + LỚP đã phân công sẵn (KHÔNG tính dòng "Thêm" cuối block) */
  async getSubjectAssignments(bossRowId: string): Promise<SubjectAssignmentRow[]> {
    const { start, end } = await this._blockRowRange(bossRowId);
    if (start === -1) return [];

    const allRows = this.page.locator(PhanCongGiangDayPage.TABLE_BODY_ROWS);
    const result: SubjectAssignmentRow[] = [];

    for (let i = start; i < end; i++) {
      const row = allRows.nth(i);
      const isExisting = (await row.locator(PhanCongGiangDayPage.SUBJECT_DELETE_BTN).count()) > 0;
      if (!isExisting) continue; // dòng "Thêm" cuối cùng — bỏ qua

      const subject = ((await row.locator(PhanCongGiangDayPage.SUBJECT_INPUT).first().getAttribute('value')) ?? '').trim();
      const classes = ((await row.locator(PhanCongGiangDayPage.CLASS_INPUT).first().getAttribute('value')) ?? '').trim();
      result.push({ subject, classes });
    }
    return result;
  }

  /** Dòng "Thêm" luôn là dòng cuối cùng của block (chứa nút btn-schedule-add) */
  private async _addRowLocator(bossRowId: string) {
    const { end } = await this._blockRowRange(bossRowId);
    return this.page.locator(PhanCongGiangDayPage.TABLE_BODY_ROWS).nth(end - 1);
  }

  /**
   * Chọn Môn cho dòng "Thêm" của 1 GV. <select> gốc của select2 vẫn còn
   * trong DOM nên selectOption() dùng trực tiếp được (không cần mở dropdown
   * UI). Sau khi chọn Môn, ô "Vui lòng chọn lớp tương ứng" hết disabled
   * nhưng vẫn readonly — chọn Lớp cần thao tác qua picker (ngoài phạm vi
   * page object này, xem ghi chú đầu file).
   */
  async selectSubjectForNewAssignment(bossRowId: string, subjectLabel: string): Promise<this> {
    const addRow = await this._addRowLocator(bossRowId);
    const select = addRow.locator(PhanCongGiangDayPage.SUBJECT_SELECT2).first();
    await select.selectOption({ label: subjectLabel });
    return this;
  }

  /** Bấm ô "Vui lòng chọn lớp tương ứng" của dòng "Thêm" — mở picker chọn lớp */
  async openChooseClassForNewAssignment(bossRowId: string): Promise<this> {
    const addRow = await this._addRowLocator(bossRowId);
    const input = addRow.locator(PhanCongGiangDayPage.CLASS_INPUT).first();
    await this.jsClick(input);
    return this;
  }

  async clickAddSubjectAssignment(bossRowId: string): Promise<this> {
    const addRow = await this._addRowLocator(bossRowId);
    await this.jsClick(addRow.locator(PhanCongGiangDayPage.SUBJECT_ADD_BTN));
    return this;
  }

  /** Xóa 1 dòng phân công môn đã có sẵn, theo index (0 = dòng đầu tiên trong block) */
  async deleteSubjectAssignment(bossRowId: string, index = 0): Promise<this> {
    const { start, end } = await this._blockRowRange(bossRowId);
    if (start === -1) return this;

    const allRows = this.page.locator(PhanCongGiangDayPage.TABLE_BODY_ROWS);
    let seen = 0;
    for (let i = start; i < end; i++) {
      const row = allRows.nth(i);
      const deleteBtn = row.locator(PhanCongGiangDayPage.SUBJECT_DELETE_BTN);
      if ((await deleteBtn.count()) === 0) continue;
      if (seen === index) {
        await this.jsClick(deleteBtn);
        return this;
      }
      seen++;
    }
    return this;
  }
}