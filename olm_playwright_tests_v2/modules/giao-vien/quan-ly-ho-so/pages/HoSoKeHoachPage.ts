import { BasePage } from '@core/shared-pages/BasePage';
import { HO_SO_KE_HOACH_URL } from '@config/config';

/**
 * Page Object — Nộp hồ sơ, kế hoạch (4.1.1).
 * URL: {BASE_URL}/school-task/lesson-plan#menu-lesson-plan
 *
 * Trang gồm 2 phần:
 *  A) Sidebar trái (#folder-plan-type) — danh sách "thư mục" hồ sơ dạng
 *     <li data-value="{value}">, mục đầu tiên "Gần đây" (data-value="0")
 *     mặc định active, các mục còn lại là danh mục cố định do trường quy
 *     định (KHÔNG phải cây thư mục tùy chỉnh — đó là CayThuMucPage/4.1.6).
 *  B) Khu vực nội dung bên phải:
 *     - Nút "Thêm mới" (#new-lesson-plan) để tải lên hồ sơ/kế hoạch mới.
 *     - Bộ filter: Năm học (#select_school_year) / Lớp (#select-grade) /
 *       Môn (select.subject, không có id cố định) / Tuần (#select-week)
 *       + checkbox "Hiển thị tất cả" (#input-options-extra-show_all).
 *     - Danh sách hồ sơ đã tải lên (chưa khảo sát HTML khi có dữ liệu —
 *       hiện chỉ có state rỗng: "Thầy cô tải lên nội dung nào...").
 *
 * LƯU Ý: select Môn không có id/name ổn định để phân biệt với các select
 * khác trên trang nên bám theo class kết hợp `.subject` (dựa trên
 * `class="form-control subject"` trong HTML khảo sát).
 */

/** data-value của từng mục trong sidebar #folder-plan-type */
export enum HoSoFolderType {
  GAN_DAY = '0',
  KE_HOACH_NHA_TRUONG = '11',
  KE_HOACH_NGOAI_GIO_CHINH_KHOA = '12',
  SO_BOI_DUONG_CHUYEN_MON = '14',
  SO_GHI_CHEP_SINH_HOAT_CHUYEN_MON = '15',
  HO_SO_DOAN_THE = '16',
  HO_SO_KHAC = '9',
  BIEN_BAN_SINH_HOAT_CHUYEN_MON = '19',
  SO_DAU_BAI = '20',
}

export class HoSoKeHoachPage extends BasePage {
  static readonly URL = HO_SO_KE_HOACH_URL;

  // ── Sidebar thư mục ──────────────────────────────────────────────────────
  static readonly FOLDER_LIST = '#folder-plan-type';
  static readonly FOLDER_ITEM = '#folder-plan-type li.list-group-item';
  static readonly FOLDER_ITEM_BY_VALUE = (value: HoSoFolderType | string): string =>
    `#folder-plan-type li[data-value="${value}"]`;
  static readonly ACTIVE_FOLDER_ITEM = '#folder-plan-type li.list-group-item.active';

  // ── Khu vực nội dung ─────────────────────────────────────────────────────
  static readonly NEW_BUTTON = '#new-lesson-plan';
  static readonly SCHOOL_YEAR_SELECT = '#select_school_year';
  static readonly GRADE_SELECT = '#select-grade';
  static readonly SUBJECT_SELECT = 'select.subject';
  static readonly WEEK_SELECT = '#select-week';
  static readonly SHOW_ALL_CHECKBOX = '#input-options-extra-show_all';

  static readonly EMPTY_STATE_MESSAGE = 'p:has-text("Thầy cô tải lên nội dung nào")';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(HoSoKeHoachPage.URL);
    await this.waitForSelector(HoSoKeHoachPage.FOLDER_LIST, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('school-task/lesson-plan');
  }

  // ==================================================================
  // Sidebar thư mục
  // ==================================================================

  /** Danh sách tên hiển thị của toàn bộ mục trong sidebar, theo đúng thứ tự DOM */
  async getFolderNames(): Promise<string[]> {
    const items = await this.page.locator(HoSoKeHoachPage.FOLDER_ITEM).all();
    const names: string[] = [];
    for (const item of items) {
      names.push(((await item.textContent()) ?? '').trim());
    }
    return names;
  }

  /** Chọn 1 mục trong sidebar theo data-value (dùng enum HoSoFolderType) */
  async selectFolder(value: HoSoFolderType | string): Promise<this> {
    const item = this.page.locator(HoSoKeHoachPage.FOLDER_ITEM_BY_VALUE(value)).first();
    await this.jsClick(item);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Tên mục sidebar đang active (mặc định "Gần đây" khi mới vào trang) */
  async getActiveFolderName(): Promise<string> {
    const el = this.page.locator(HoSoKeHoachPage.ACTIVE_FOLDER_ITEM).first();
    return ((await el.textContent()) ?? '').trim();
  }

  // ==================================================================
  // Thêm mới
  // ==================================================================

  async clickThemMoi(): Promise<this> {
    await this.page.locator(HoSoKeHoachPage.NEW_BUTTON).click();
    return this;
  }

  // ==================================================================
  // Bộ filter
  // ==================================================================

  /** VD: selectSchoolYear('2025') → chọn "2025 - 2026" */
  async selectSchoolYear(year: string): Promise<this> {
    await this.page.locator(HoSoKeHoachPage.SCHOOL_YEAR_SELECT).selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    return this.page.locator(HoSoKeHoachPage.SCHOOL_YEAR_SELECT).inputValue();
  }

  /** VD: selectGrade('6') → "Lớp 6"; selectGrade('-1') → "Mọi lớp" (mặc định) */
  async selectGrade(gradeValue: string): Promise<this> {
    await this.page.locator(HoSoKeHoachPage.GRADE_SELECT).selectOption(gradeValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedGrade(): Promise<string> {
    return this.page.locator(HoSoKeHoachPage.GRADE_SELECT).inputValue();
  }

  /** VD: selectSubject('3') → "Toán"; selectSubject('-1') → "Mọi môn" (mặc định) */
  async selectSubject(subjectValue: string): Promise<this> {
    await this.page.locator(HoSoKeHoachPage.SUBJECT_SELECT).selectOption(subjectValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSubject(): Promise<string> {
    return this.page.locator(HoSoKeHoachPage.SUBJECT_SELECT).inputValue();
  }

  /** VD: selectWeek('1') → "Tuần 1"; selectWeek('0') → "Lọc theo tuần" (mặc định, không lọc) */
  async selectWeek(weekValue: string): Promise<this> {
    await this.page.locator(HoSoKeHoachPage.WEEK_SELECT).selectOption(weekValue);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedWeek(): Promise<string> {
    return this.page.locator(HoSoKeHoachPage.WEEK_SELECT).inputValue();
  }

  async isShowAllChecked(): Promise<boolean> {
    return this.page.locator(HoSoKeHoachPage.SHOW_ALL_CHECKBOX).isChecked();
  }

  async toggleShowAll(): Promise<this> {
    await this.page.locator(HoSoKeHoachPage.SHOW_ALL_CHECKBOX).click({ force: true });
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Nội dung / trạng thái rỗng
  // ==================================================================

  /**
   * True khi chưa có hồ sơ/kế hoạch nào được tải lên cho bộ lọc hiện tại
   * (state rỗng — CHƯA khảo sát HTML của danh sách khi có dữ liệu thật).
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.isElementVisible(HoSoKeHoachPage.EMPTY_STATE_MESSAGE, 5_000);
  }
}