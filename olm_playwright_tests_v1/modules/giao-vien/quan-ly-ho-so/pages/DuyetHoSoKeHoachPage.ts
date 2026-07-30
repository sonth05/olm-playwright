import { BasePage } from '@core/shared-pages/BasePage';
import { DUYET_HO_SO_KE_HOACH_URL } from '@config/config';

/**
 * Page Object — Duyệt hồ sơ, kế hoạch (4.1.2).
 * URL: {BASE_URL}/school-task/lesson-plan-all#menu-lesson-plan-all
 *
 * Khác với HoSoKeHoachPage (4.1.1 — GV tự nộp hồ sơ của mình), trang này là
 * góc nhìn QUẢN TRỊ để duyệt hồ sơ/kế hoạch của TOÀN TRƯỜNG:
 *  - Sidebar thư mục (#folder-plan-type) có ĐẦY ĐỦ 19 danh mục (không có mục
 *    "Gần đây" như 4.1.1), mặc định active "Kế hoạch bài dạy (Giáo án)"
 *    (data-value="1"). Tiêu đề <h2> phía trên bộ filter đổi theo tên mục
 *    đang chọn.
 *  - Bộ filter nhiều hơn 4.1.1: ngoài Năm học / Lớp / Môn / Tuần còn có
 *    Nhóm (#select_group), Giáo viên (#select-teacher — hiển thị dạng
 *    select2 nhưng <select> gốc vẫn còn trong DOM nên selectOption() dùng
 *    trực tiếp được, không cần thao tác UI select2 — giống filterByTeacher()
 *    ở ThongKeBaiGiaoToanTruongPage) và Trạng thái duyệt (#select-verified:
 *    Tất cả trạng thái / Chưa duyệt / Chấp nhận / Từ chối).
 *  - KHÔNG có nút "Thêm mới" (đây là trang duyệt, không phải trang nộp).
 *    Thay vào đó có nút "Tải về báo cáo" (link export) và "Chỉnh sửa chữ ký
 *    (con dấu)" (#open-modal-sign, mở modal — ngoài phạm vi HTML đã khảo
 *    sát nên openEditSignatureModal() chỉ dừng ở bước click).
 *  - State rỗng có message RIÊNG, khác 4.1.1: "Hiện tại giáo viên chưa tạo
 *    giáo án, hồ sơ nào!" (chưa khảo sát HTML của danh sách/bảng duyệt khi
 *    có dữ liệu thật).
 */

/** data-value của từng mục trong sidebar #folder-plan-type (trang duyệt, đủ 19 mục) */
export enum DuyetHoSoFolderType {
  KE_HOACH_BAI_DAY_GIAO_AN = '1',
  LICH_BAO_GIANG = '4',
  BAI_GIANG_DIEN_TU = '17',
  KE_HOACH_GIANG_DAY_PPCT = '7',
  KE_HOACH_TO_BO_MON = '10',
  KY_NANG_SONG = '18',
  KE_HOACH_NHA_TRUONG = '11',
  KE_HOACH_GIAO_DUC = '8',
  KE_HOACH_NGOAI_GIO_CHINH_KHOA = '12',
  GIAO_AN_NGOAI_GIO_CHINH_KHOA = '13',
  SO_BOI_DUONG_CHUYEN_MON = '14',
  SO_GHI_CHEP_SINH_HOAT_CHUYEN_MON = '15',
  BIEN_BAN_SINH_HOAT_CHUYEN_MON = '19',
  HO_SO_DOAN_THE = '16',
  KE_HOACH_CA_NHAN = '2',
  SO_CHU_NHIEM = '3',
  SO_DAU_BAI = '20',
  BANG_TONG_HOP_DANH_GIA_HOC_SINH = '5',
  DE_THI = '6',
  HO_SO_KHAC = '9',
}

/** Giá trị select "Trạng thái" (#select-verified) */
export enum DuyetHoSoVerifyStatus {
  TAT_CA = '-1',
  CHUA_DUYET = '0',
  CHAP_NHAN = '1',
  TU_CHOI = '2',
}

export class DuyetHoSoKeHoachPage extends BasePage {
  static readonly URL = DUYET_HO_SO_KE_HOACH_URL;

  // ── Sidebar thư mục ──────────────────────────────────────────────────────
  static readonly FOLDER_LIST = '#folder-plan-type';
  static readonly FOLDER_ITEM = '#folder-plan-type li.list-group-item';
  static readonly FOLDER_ITEM_BY_VALUE = (value: DuyetHoSoFolderType | string): string =>
    `#folder-plan-type li[data-value="${value}"]`;
  static readonly ACTIVE_FOLDER_ITEM = '#folder-plan-type li.list-group-item.active';

  // ── Tiêu đề (đổi theo mục sidebar đang chọn) ────────────────────────────
  static readonly PAGE_HEADING = '.col-9 > h2';

  // ── Bộ filter ─────────────────────────────────────────────────────────────
  static readonly SCHOOL_YEAR_SELECT = '#select_school_year';
  static readonly GRADE_SELECT = '#select-grade';
  static readonly SUBJECT_SELECT = 'select.subject';
  static readonly WEEK_SELECT = '#select-week';
  static readonly GROUP_SELECT = '#select_group';
  static readonly TEACHER_SELECT = '#select-teacher';
  static readonly VERIFY_STATUS_SELECT = '#select-verified';

  // ── Actions ───────────────────────────────────────────────────────────────
  static readonly EXPORT_REPORT_LINK = 'a.btn:has-text("Tải về báo cáo")';
  static readonly EDIT_SIGNATURE_BUTTON = '#open-modal-sign';

  static readonly EMPTY_STATE_MESSAGE = 'p:has-text("Hiện tại giáo viên chưa tạo giáo án, hồ sơ nào")';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(DuyetHoSoKeHoachPage.URL);
    await this.waitForSelector(DuyetHoSoKeHoachPage.FOLDER_LIST, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('school-task/lesson-plan-all');
  }

  async getPageHeading(): Promise<string> {
    const el = await this.findVisible([DuyetHoSoKeHoachPage.PAGE_HEADING], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // ==================================================================
  // Sidebar thư mục
  // ==================================================================

  /** Danh sách tên hiển thị của toàn bộ mục trong sidebar, theo đúng thứ tự DOM */
  async getFolderNames(): Promise<string[]> {
    const items = await this.page.locator(DuyetHoSoKeHoachPage.FOLDER_ITEM).all();
    const names: string[] = [];
    for (const item of items) {
      names.push(((await item.textContent()) ?? '').trim());
    }
    return names;
  }

  /** Chọn 1 mục trong sidebar theo data-value (dùng enum DuyetHoSoFolderType) */
  async selectFolder(value: DuyetHoSoFolderType | string): Promise<this> {
    const item = this.page.locator(DuyetHoSoKeHoachPage.FOLDER_ITEM_BY_VALUE(value)).first();
    await this.jsClick(item);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Tên mục sidebar đang active (mặc định "Kế hoạch bài dạy (Giáo án)" khi mới vào trang) */
  async getActiveFolderName(): Promise<string> {
    const el = this.page.locator(DuyetHoSoKeHoachPage.ACTIVE_FOLDER_ITEM).first();
    return ((await el.textContent()) ?? '').trim();
  }

  // ==================================================================
  // Bộ filter
  // ==================================================================

  /** VD: selectSchoolYear('2025') → chọn "2025 - 2026" */
  async selectSchoolYear(year: string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.SCHOOL_YEAR_SELECT).selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    return this.page.locator(DuyetHoSoKeHoachPage.SCHOOL_YEAR_SELECT).inputValue();
  }

  /** VD: selectGrade('6') → "Lớp 6"; selectGrade('-1') → "Mọi lớp" (mặc định) */
  async selectGrade(gradeValue: string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.GRADE_SELECT).selectOption(gradeValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedGrade(): Promise<string> {
    return this.page.locator(DuyetHoSoKeHoachPage.GRADE_SELECT).inputValue();
  }

  /**
   * VD: selectSubject('3') → "Toán"; selectSubject('0') → "Tất cả môn học"
   * (mặc định trang này — KHÁC 4.1.1 mặc định là "Mọi môn" value="-1").
   */
  async selectSubject(subjectValue: string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.SUBJECT_SELECT).selectOption(subjectValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSubject(): Promise<string> {
    return this.page.locator(DuyetHoSoKeHoachPage.SUBJECT_SELECT).inputValue();
  }

  /** VD: selectWeek('1') → "Tuần 1"; selectWeek('0') → "Lọc theo tuần" (mặc định, không lọc) */
  async selectWeek(weekValue: string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.WEEK_SELECT).selectOption(weekValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedWeek(): Promise<string> {
    return this.page.locator(DuyetHoSoKeHoachPage.WEEK_SELECT).inputValue();
  }

  /** VD: selectGroup('6244925182') → "Giáo viên toàn trường"; '0' → "Tất cả các nhóm" (mặc định) */
  async selectGroup(groupValue: string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.GROUP_SELECT).selectOption(groupValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedGroup(): Promise<string> {
    return this.page.locator(DuyetHoSoKeHoachPage.GROUP_SELECT).inputValue();
  }

  /**
   * Lọc theo giáo viên bằng nhãn hiển thị (VD: "Nguyễn Văn An"). <select>
   * gốc vẫn còn trong DOM dù UI hiển thị dạng select2 nên selectOption()
   * dùng trực tiếp được, không cần mở dropdown.
   */
  async filterByTeacher(teacherLabel: string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.TEACHER_SELECT).selectOption({ label: teacherLabel });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedTeacherLabel(): Promise<string> {
    const el = this.page.locator('#select2-select-teacher-container').first();
    return ((await el.textContent()) ?? '').trim();
  }

  async selectVerifyStatus(status: DuyetHoSoVerifyStatus | string): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.VERIFY_STATUS_SELECT).selectOption(status);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedVerifyStatus(): Promise<string> {
    return this.page.locator(DuyetHoSoKeHoachPage.VERIFY_STATUS_SELECT).inputValue();
  }

  // ==================================================================
  // Actions
  // ==================================================================

  /** Href export báo cáo (VD: dùng để verify param query khi đã áp filter, KHÔNG tự động tải file) */
  async getExportReportLink(): Promise<string | null> {
    return this.page.locator(DuyetHoSoKeHoachPage.EXPORT_REPORT_LINK).getAttribute('href');
  }

  /**
   * Mở modal "Chỉnh sửa chữ ký (con dấu)". Modal này NGOÀI phạm vi HTML đã
   * khảo sát — method chỉ dừng ở bước click mở modal.
   */
  async openEditSignatureModal(): Promise<this> {
    await this.page.locator(DuyetHoSoKeHoachPage.EDIT_SIGNATURE_BUTTON).click();
    return this;
  }

  // ==================================================================
  // Nội dung / trạng thái rỗng
  // ==================================================================

  /**
   * True khi chưa có giáo viên nào tạo giáo án/hồ sơ cho bộ lọc hiện tại
   * (state rỗng — CHƯA khảo sát HTML của bảng duyệt khi có dữ liệu thật).
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.isElementVisible(DuyetHoSoKeHoachPage.EMPTY_STATE_MESSAGE, 5_000);
  }
}