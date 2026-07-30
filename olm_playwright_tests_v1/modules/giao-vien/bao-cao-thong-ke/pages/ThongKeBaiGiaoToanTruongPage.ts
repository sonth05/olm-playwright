import { BasePage } from '@core/shared-pages/BasePage';
import { BAI_GIAO_TOAN_TRUONG_URL } from '@config/config';
import { SchoolAdminTab } from '@modules/giao-vien/quan-ly-giao-vien/pages/PhanCongGiangDayPage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Thống kê bài giao toàn trường (3.1).
 * URL: {BASE_URL}/truong-hoc/{slug}/bai-giao
 *
 * Trang gồm 2 phần:
 *  A) Thanh điều hướng dùng chung của khu vực quản trị trường (Giới thiệu /
 *     Giáo viên / Thống kê / Lớp học / Khóa học / Thống kê dung lượng / Bài
 *     đã giao / Nâng lớp / Điểm danh / Xếp TKB / Thảo luận trong trường) —
 *     dùng chung enum SchoolAdminTab với PhanCongGiangDayPage, KHÔNG định
 *     nghĩa lại ở đây. Tab "Bài đã giao" chính là trang này.
 *  B) Bảng "Danh sách bài tập đã giao của trường", kèm bộ filter (năm học /
 *     lớp / môn / tổ giáo viên / giáo viên / khoảng ngày giao / bài đã xóa)
 *     + nút "Xuất thống kê" + phân trang.
 *
 * KHÁC với bảng rowspan của PhanCongGiangDayPage: mỗi dòng `tr.course-item`
 * ở đây ĐỘC LẬP hoàn toàn và tự mang đủ dữ liệu qua data-attributes
 * (data-id, data-expired, data-title, data-url, data-subject, data-group,
 * data-grade) — không cần dò ranh giới block, nên getRows()/getRowById()
 * đơn giản & tin cậy hơn nhiều.
 *
 * Cột "Điểm trung bình" có 2 cấp reset:
 *  - Nút reset TOÀN BẢNG trên header (button.reset-average-multiple), mang
 *    data-coursewares = danh sách id (phân tách bởi dấu phẩy) của TẤT CẢ
 *    bài giao đang hiển thị trên trang hiện tại.
 *  - Icon reset TỪNG DÒNG (i.reset-average) trong ô Điểm trung bình.
 * Cả 2 đều là hành động HỦY DỮ LIỆU ĐIỂM (destructive) — resetRowAverage()/
 * resetAllVisibleAverages() được cung cấp nhưng KHÔNG gọi trong test
 * regression mặc định.
 *
 * Cột "Hành động" — tooltip Bootstrap lưu ở `data-original-title` (thuộc
 * tính `title` gốc bị bootstrap.js xóa rỗng lúc runtime), nên các selector
 * dưới đây bám theo `data-original-title` để không phụ thuộc trạng thái
 * tooltip đã init hay chưa:
 *   - a[data-original-title="Thống kê"]              — biểu đồ mắt, LUÔN có
 *   - a[data-original-title="Thống kê câu hỏi"]       — chỉ bài [Kiểm tra]
 *   - button.btn-edit-courseware                      — sửa bài giao (mở modal)
 *   - button.btn-delete-courseware                    — xóa bài giao (destructive)
 *   - button.copy-link-courseware                     — copy link (đọc qua input ẩn #link-courseware-{id})
 *   - a[data-original-title="Chấm lại bài"]            — chỉ bài [Kiểm tra] có tự động chấm
 *
 * Dùng kết hợp:
 *   const page = new ThongKeBaiGiaoToanTruongPage(p);
 *   await page.open();
 *   const rows = await page.getRows();
 *   const href = await page.viewStatisticsHref(rows[0].id);
 */

export interface CoursewareAssignmentRow {
  id: string;
  title: string;
  /** URL gốc của học liệu (KHÔNG kèm id_courseware), lấy từ data-url */
  url: string;
  /** true nếu data-expired khác '0' VÀ đã qua thời điểm hết hạn (badge "(Hết hạn)" hiển thị cạnh tiêu đề) */
  isExpired: boolean;
  /** Giá trị thô của data-expired: '0' (vô thời hạn) hoặc chuỗi "YYYY-MM-DD HH:mm:ss" */
  expiredRaw: string;
  /** Nhãn môn học (badge màu đầu dòng), VD: "Công nghệ", "Toán", "Kỹ năng sống" */
  subjectBadge: string;
  subjectId: string;
  groupId: string;
  grade: string;
  /** "Kiểm tra" | "Video" | "Luyện tập" | '' (rỗng nếu học liệu không thuộc loại nào ở trên) */
  materialType: string;
  /** Nhãn phụ trong ngoặc sau tiêu đề, VD: "(Thi thử Tốt nghiệp Trung học Phổ thông)", rỗng nếu không có */
  programLabel: string;
  teacherName: string;
  teacherProfileUrl: string;
  className: string;
  classUrl: string;
  assignedDateText: string;
  expiredDateText: string;
  /** Nguyên văn ô "Đã nộp", VD: "2/19 (10.5%)" */
  submittedText: string;
  submittedCount: number | null;
  submittedTotal: number | null;
  /** "Chưa có dữ liệu" hoặc điểm số dạng chuỗi, VD: "0.84" */
  averageScoreText: string;
  /** true nếu ô tiêu đề có badge "Bài làm chưa được nộp" */
  hasUnsubmittedBadge: boolean;
}

export class ThongKeBaiGiaoToanTruongPage extends BasePage {
  static readonly URL = BAI_GIAO_TOAN_TRUONG_URL;

  // ── Thanh điều hướng dùng chung ──────────────────────────────────────
  static readonly ADMIN_TAB_NAV = '#pills-tab';
  static readonly ADMIN_TAB_LINK = '#pills-tab li a';

  // ── Header trang ──────────────────────────────────────────────────────
  static readonly PAGE_HEADING = "h3:has-text('Danh sách bài tập đã giao của trường')";
  static readonly SCHOOL_YEAR_SELECT = 'select.select-school-year';

  // ── Bộ lọc ───────────────────────────────────────────────────────────
  static readonly CLASS_FILTER_SELECT = 'select[name="group"]';
  static readonly SUBJECT_FILTER_SELECT = 'select[name="subject"]';
  static readonly TEACHER_GROUP_FILTER_SELECT = 'select[name="group_teacher"]';
  static readonly TEACHER_FILTER_SELECT = 'select[name="teacher"]';
  static readonly DATE_RANGE_INPUT = 'input.filter-date-range[name="date-range"]';
  static readonly SHOW_DELETED_CHECKBOX = 'input#deleted[name="deleted"]';
  static readonly FILTER_BTN = 'button.submit-filter';
  static readonly EXPORT_STAT_LINK = 'a.export-stat-teacher-zoomlog';

  // ── Phân trang ───────────────────────────────────────────────────────
  static readonly PAGINATION = 'nav ul.pagination.pagination-secondary';
  static readonly PAGINATION_NUMBERED_LINK = `${ThongKeBaiGiaoToanTruongPage.PAGINATION} li.page-item a.page-link[data-page]:not([data-page=""])`;
  static readonly PAGINATION_ACTIVE_LINK = `${ThongKeBaiGiaoToanTruongPage.PAGINATION} li.page-item.active a.page-link`;
  static readonly PAGINATION_LINK_BY_PAGE = (p: number): string =>
    `${ThongKeBaiGiaoToanTruongPage.PAGINATION} a.page-link[data-page="${p}"]`;

  // ── Bảng danh sách bài giao ──────────────────────────────────────────
  static readonly TABLE = 'table.table.table-striped.table-bordered';
  static readonly TABLE_ROWS = `${ThongKeBaiGiaoToanTruongPage.TABLE} tbody tr.course-item`;
  static readonly ROW_BY_ID = (id: string): string => `tr.course-item[data-id="${id}"]`;
  static readonly RESET_AVERAGE_MULTIPLE_BTN = 'button.reset-average-multiple';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(ThongKeBaiGiaoToanTruongPage.URL);
    await this.waitForSelector(ThongKeBaiGiaoToanTruongPage.TABLE, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('/bai-giao');
  }

  async getHeadingText(): Promise<string> {
    const el = await this.findVisible([ThongKeBaiGiaoToanTruongPage.PAGE_HEADING], 8);
    return el ? ((await el.textContent()) ?? '').trim().replace(/\s+/g, ' ') : '';
  }

  /** Chuyển sang 1 tab khác trong thanh điều hướng quản trị trường (xem ghi chú SchoolAdminTab ở PhanCongGiangDayPage) */
  async switchAdminTab(tab: SchoolAdminTab): Promise<this> {
    const link = this.page.locator(ThongKeBaiGiaoToanTruongPage.ADMIN_TAB_LINK).filter({ hasText: tab }).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Header — Năm học
  // ==================================================================

  async selectSchoolYear(year: string): Promise<this> {
    const select = this.page.locator(ThongKeBaiGiaoToanTruongPage.SCHOOL_YEAR_SELECT).first();
    await select.selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    const select = this.page.locator(ThongKeBaiGiaoToanTruongPage.SCHOOL_YEAR_SELECT).first();
    return select.inputValue();
  }

  // ==================================================================
  // Bộ lọc
  // ==================================================================

  async filterByClass(classLabel: string): Promise<this> {
    await this.page.locator(ThongKeBaiGiaoToanTruongPage.CLASS_FILTER_SELECT).selectOption({ label: classLabel });
    return this;
  }

  async filterBySubject(subjectLabel: string): Promise<this> {
    await this.page.locator(ThongKeBaiGiaoToanTruongPage.SUBJECT_FILTER_SELECT).selectOption({ label: subjectLabel });
    return this;
  }

  async filterByTeacherGroup(groupLabel: string): Promise<this> {
    await this.page
      .locator(ThongKeBaiGiaoToanTruongPage.TEACHER_GROUP_FILTER_SELECT)
      .selectOption({ label: groupLabel });
    return this;
  }

  /**
   * <select name="teacher"> hiển thị dạng select2 (class filter-select2) nhưng
   * <select> gốc vẫn còn trong DOM nên selectOption() dùng trực tiếp được,
   * không cần thao tác mở dropdown UI (giống SUBJECT_SELECT2 ở PhanCongGiangDayPage).
   */
  async filterByTeacher(teacherLabel: string): Promise<this> {
    await this.page.locator(ThongKeBaiGiaoToanTruongPage.TEACHER_FILTER_SELECT).selectOption({ label: teacherLabel });
    return this;
  }

  /**
   * Bấm mở widget chọn khoảng ngày giao (#reportrange — thư viện
   * daterangepicker bên thứ 3). Chỉ dừng ở bước mở picker, KHÔNG thao tác
   * chọn ngày trong lịch (ngoài phạm vi page object này — xem ghi chú tương
   * tự ở openChooseHomeroomClass() của PhanCongGiangDayPage).
   */
  async openDateRangePicker(): Promise<this> {
    const input = this.page.locator(ThongKeBaiGiaoToanTruongPage.DATE_RANGE_INPUT).first();
    await this.jsClick(input);
    return this;
  }

  async getDateRangeValue(): Promise<string> {
    return this.page.locator(ThongKeBaiGiaoToanTruongPage.DATE_RANGE_INPUT).first().inputValue();
  }

  async isShowDeletedChecked(): Promise<boolean> {
    return this.page.locator(ThongKeBaiGiaoToanTruongPage.SHOW_DELETED_CHECKBOX).isChecked();
  }

  async toggleShowDeleted(): Promise<this> {
    await this.page.locator(ThongKeBaiGiaoToanTruongPage.SHOW_DELETED_CHECKBOX).click({ force: true });
    return this;
  }

  /** Bấm nút "Lọc" — áp dụng toàn bộ điều kiện lọc đã chọn ở trên */
  async applyFilter(): Promise<this> {
    await this.page.locator(ThongKeBaiGiaoToanTruongPage.FILTER_BTN).click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.waitForSelector(ThongKeBaiGiaoToanTruongPage.TABLE, 15_000);
    return this;
  }

  /** Href của nút "Xuất thống kê" (link tải file, KHÔNG tự động click để tránh side-effect tải file trong test) */
  async getExportStatUrl(): Promise<string | null> {
    return this.page.locator(ThongKeBaiGiaoToanTruongPage.EXPORT_STAT_LINK).first().getAttribute('href');
  }

  // ==================================================================
  // Phân trang
  // ==================================================================

  async getCurrentPage(): Promise<number> {
    const text = await this.page.locator(ThongKeBaiGiaoToanTruongPage.PAGINATION_ACTIVE_LINK).first().textContent();
    return Number((text ?? '').trim()) || 1;
  }

  async getPageNumbers(): Promise<number[]> {
    const texts = await this.page.locator(ThongKeBaiGiaoToanTruongPage.PAGINATION_NUMBERED_LINK).allTextContents();
    return texts.map((t) => Number(t.trim())).filter((n) => !Number.isNaN(n));
  }

  async goToPage(p: number): Promise<this> {
    await this.page.locator(ThongKeBaiGiaoToanTruongPage.PAGINATION_LINK_BY_PAGE(p)).first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.waitForSelector(ThongKeBaiGiaoToanTruongPage.TABLE, 15_000);
    return this;
  }

  // ==================================================================
  // Bảng danh sách bài giao
  // ==================================================================

  getRowLocatorById(id: string): Locator {
    return this.page.locator(ThongKeBaiGiaoToanTruongPage.ROW_BY_ID(id));
  }

  async getRowCount(): Promise<number> {
    return this.page.locator(ThongKeBaiGiaoToanTruongPage.TABLE_ROWS).count();
  }

  private async _parseRow(row: Locator): Promise<CoursewareAssignmentRow> {
    const id = (await row.getAttribute('data-id')) ?? '';
    const expiredRaw = (await row.getAttribute('data-expired')) ?? '0';
    const url = (await row.getAttribute('data-url')) ?? '';
    const subjectId = (await row.getAttribute('data-subject')) ?? '';
    const groupId = (await row.getAttribute('data-group')) ?? '';
    const grade = (await row.getAttribute('data-grade')) ?? '';

    const titleCell = row.locator('td[data-label="Tiêu đề"]');
    const subjectBadge = ((await titleCell.locator('.alert').first().textContent()) ?? '').trim();
    const title = ((await titleCell.locator('a.olm-text-link').first().textContent()) ?? '')
      .replace(/\(Hết hạn\)/, '')
      .trim();
    const isExpired = (await titleCell.locator('small.text-secondary:has-text("Hết hạn")').count()) > 0;
    const hasUnsubmittedBadge = (await titleCell.locator('.alert-warning:has-text("chưa được nộp")').count()) > 0;
    const programLinks = titleCell.locator('a.olm-text-link[target="_blank"]');
    const programLabel =
      (await programLinks.count()) > 0 ? ((await programLinks.first().textContent()) ?? '').trim() : '';

    const materialType = ((await row.locator('td[data-label="Loại học liệu"]').textContent()) ?? '')
      .replace(/[[\]]/g, '')
      .trim();

    const teacherLink = row.locator('td[data-label="Giáo viên giao"] a').first();
    const teacherName = ((await teacherLink.textContent()) ?? '').trim();
    const teacherProfileUrl = (await teacherLink.getAttribute('href')) ?? '';

    const classLink = row.locator('td[data-label="Lớp"] a').first();
    const className = (await classLink.count()) > 0 ? ((await classLink.textContent()) ?? '').trim() : '';
    const classUrl = (await classLink.count()) > 0 ? ((await classLink.getAttribute('href')) ?? '') : '';

    const assignedDateText = ((await row.locator('td[data-label="Ngày giao"]').textContent()) ?? '').trim();
    const expiredDateText = ((await row.locator('td[data-label="Ngày hết hạn"]').textContent()) ?? '').trim();

    const submittedText = ((await row.locator('td[data-label="Đã nộp"]').textContent()) ?? '').trim();
    const submittedMatch = submittedText.match(/(\d+)\s*\/\s*(\d+)/);
    const submittedCount = submittedMatch ? Number(submittedMatch[1]) : null;
    const submittedTotal = submittedMatch ? Number(submittedMatch[2]) : null;

    const averageScoreText = ((await row.locator('td[data-label="Điểm trung bình"]').textContent()) ?? '')
      .trim()
      .replace(/\s+/g, ' ');

    return {
      id,
      title,
      url,
      isExpired,
      expiredRaw,
      subjectBadge,
      subjectId,
      groupId,
      grade,
      materialType,
      programLabel,
      teacherName,
      teacherProfileUrl,
      className,
      classUrl,
      assignedDateText,
      expiredDateText,
      submittedText,
      submittedCount,
      submittedTotal,
      averageScoreText,
      hasUnsubmittedBadge,
    };
  }

  /** Toàn bộ dòng bài giao đang hiển thị trên trang hiện tại (theo đúng thứ tự DOM) */
  async getRows(): Promise<CoursewareAssignmentRow[]> {
    const rows = await this.page.locator(ThongKeBaiGiaoToanTruongPage.TABLE_ROWS).all();
    const result: CoursewareAssignmentRow[] = [];
    for (const row of rows) {
      result.push(await this._parseRow(row));
    }
    return result;
  }

  async getRowById(id: string): Promise<CoursewareAssignmentRow | null> {
    const row = this.getRowLocatorById(id);
    if ((await row.count()) === 0) return null;
    return this._parseRow(row.first());
  }

  async findRowsByTitle(titlePart: string): Promise<CoursewareAssignmentRow[]> {
    const rows = await this.getRows();
    return rows.filter((r) => r.title.includes(titlePart));
  }

  // ==================================================================
  // Hành động trên 1 dòng bài giao
  // ==================================================================

  /** Href nút "Thống kê" (biểu đồ mắt) — LUÔN có ở mọi dòng */
  async viewStatisticsHref(id: string): Promise<string | null> {
    return this.getRowLocatorById(id).locator('a[data-original-title="Thống kê"]').first().getAttribute('href');
  }

  /** Href nút "Thống kê câu hỏi" — chỉ có ở bài loại [Kiểm tra], trả null nếu không có */
  async viewQuestionStatisticsHref(id: string): Promise<string | null> {
    const link = this.getRowLocatorById(id).locator('a[data-original-title="Thống kê câu hỏi"]').first();
    if ((await link.count()) === 0) return null;
    return link.getAttribute('href');
  }

  /** Href nút "Chấm lại bài" (tự động chấm lại) — chỉ có ở bài loại [Kiểm tra] có hỗ trợ tự động chấm */
  async regradeHref(id: string): Promise<string | null> {
    const link = this.getRowLocatorById(id).locator('a[data-original-title="Chấm lại bài"]').first();
    if ((await link.count()) === 0) return null;
    return link.getAttribute('href');
  }

  /** Bấm nút "Chỉnh sửa bài giao" — mở modal sửa (thao tác trong modal ngoài phạm vi page object này) */
  async clickEdit(id: string): Promise<this> {
    await this.jsClick(this.getRowLocatorById(id).locator('button.btn-edit-courseware').first());
    return this;
  }

  /** Bấm nút "Xóa bài giao" — HÀNH ĐỘNG HỦY DỮ LIỆU, chỉ dùng trong test có chủ đích, KHÔNG gọi trong regression mặc định */
  async clickDelete(id: string): Promise<this> {
    await this.jsClick(this.getRowLocatorById(id).locator('button.btn-delete-courseware').first());
    return this;
  }

  /** Bấm nút copy link (kích hoạt toast "đã copy"), trả về giá trị đã copy đọc từ input ẩn cùng dòng */
  async copyLink(id: string): Promise<string> {
    const row = this.getRowLocatorById(id);
    await this.jsClick(row.locator('button.copy-link-courseware').first());
    return this.getLinkValue(id);
  }

  /** Đọc trực tiếp giá trị link chia sẻ từ input ẩn `#link-courseware-{id}`, KHÔNG cần bấm nút copy */
  async getLinkValue(id: string): Promise<string> {
    return this.page.locator(`#link-courseware-${id}`).inputValue();
  }

  /** Reset điểm trung bình của 1 dòng — HÀNH ĐỘNG HỦY DỮ LIỆU ĐIỂM, KHÔNG gọi trong regression mặc định */
  async resetRowAverage(id: string): Promise<this> {
    await this.jsClick(this.getRowLocatorById(id).locator('i.reset-average').first());
    return this;
  }

  /** Danh sách id bài giao sẽ bị ảnh hưởng nếu bấm nút reset toàn bảng (đọc từ data-coursewares, KHÔNG bấm nút) */
  async getResetAverageMultipleTargetIds(): Promise<string[]> {
    const raw = await this.page
      .locator(ThongKeBaiGiaoToanTruongPage.RESET_AVERAGE_MULTIPLE_BTN)
      .first()
      .getAttribute('data-coursewares');
    return (raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Reset điểm trung bình của TẤT CẢ bài giao đang hiển thị trên trang — HÀNH ĐỘNG HỦY DỮ LIỆU ĐIỂM, KHÔNG gọi trong regression mặc định */
  async resetAllVisibleAverages(): Promise<this> {
    await this.jsClick(this.page.locator(ThongKeBaiGiaoToanTruongPage.RESET_AVERAGE_MULTIPLE_BTN).first());
    return this;
  }
}