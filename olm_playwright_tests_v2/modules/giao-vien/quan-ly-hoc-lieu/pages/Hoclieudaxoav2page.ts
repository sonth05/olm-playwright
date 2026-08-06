// Hoclieudaxoav2page.ts
import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick } from '../../../../core/shared-pages/dismissPopups';
import {
  FilterOptionPopover,
  AdvancedFilterPanel,
  FilterCoursewareTypeV2,
  FILTER_SUBJECT_VALUE,
  FilterGradeValue,
} from './Hoclieucuatoiv2page';

export interface HocLieuDaXoaRow {
  stt: string;
  title: string;
  type: string;               // VD: "[Kiểm tra]", "[Học liệu game hóa]", "[Kỹ năng, NHCH]"
  deletedStatus: 'Đã xóa';    // luôn là "Đã xóa"
  privacy: 'Riêng tư' | 'Công khai' | string;
  grade: string;              // Khối lớp, VD "Lớp 12"
  subject: string;            // Môn học, VD "Toán"
  course: string;             // Khóa học (thường trống)
}

export class HocLieuDaXoaV2Page {
  readonly page: Page;

  // ---- Header ----
  readonly heading: Locator;                // "Học liệu đã xóa"
  readonly guideLink: Locator;              // "Hướng dẫn tạo học liệu"
  readonly btnBackToOldUI: Locator;         // "Quay lại giao diện cũ"

  // ---- Bộ lọc ----
  readonly filterTypeBtn: Locator;          // "Tất cả loại học liệu"
  readonly filterSubjectBtn: Locator;       // "Tất cả môn học"
  readonly filterGradeBtn: Locator;         // "Tất cả khối lớp"
  readonly btnAdvancedFilter: Locator;      // "Bộ lọc nâng cao"
  readonly btnReload: Locator;              // "Tải lại"

  // ---- Popover bộ lọc (tái sử dụng) ----
  readonly typeFilterPopover: FilterOptionPopover;
  readonly subjectFilterPopover: FilterOptionPopover;
  readonly gradeFilterPopover: FilterOptionPopover;

  // ---- Bảng kết quả ----
  readonly table: Locator;
  readonly tableRows: Locator;             // tbody > tr
  readonly tableHeader: Locator;           // thead

  // ---- Phân trang ----
  readonly pagination: Locator;
  readonly btnPrevPage: Locator;
  readonly btnNextPage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tiêu đề "Học liệu đã xóa" sử dụng selector giống mẫu
    this.heading = page.locator('div.tw-text-2xl.tw-font-semibold', {
      hasText: 'Học liệu đã xóa',
    }).first();

    this.guideLink = page.getByRole('link', { name: /Hướng dẫn tạo học liệu/i });
    this.btnBackToOldUI = page.getByText('Quay lại giao diện cũ', { exact: true });

    // Các nút lọc
    this.filterTypeBtn = page.getByRole('button', { name: /Tất cả loại học liệu/i });
    this.filterSubjectBtn = page.getByRole('button', { name: /Tất cả môn học/i });
    this.filterGradeBtn = page.getByRole('button', { name: /Tất cả khối lớp/i });
    this.btnAdvancedFilter = page.getByRole('button', { name: /Bộ lọc nâng cao/i });
    this.btnReload = page.getByRole('button', { name: /Tải lại/i });

    // Popover bộ lọc
    this.typeFilterPopover = new FilterOptionPopover(page, this.filterTypeBtn);
    this.subjectFilterPopover = new FilterOptionPopover(page, this.filterSubjectBtn);
    this.gradeFilterPopover = new FilterOptionPopover(page, this.filterGradeBtn);

    // Bảng
    this.table = page.locator('table');
    this.tableRows = this.table.locator('tbody tr');
    this.tableHeader = this.table.locator('thead');

    // Phân trang
    this.pagination = page.getByRole('navigation', { name: /pagination/i });
    this.btnPrevPage = this.pagination.getByRole('button', { name: /previous page/i });
    this.btnNextPage = this.pagination.getByRole('button', { name: /next page/i });
  }

  /**
   * Điều hướng đến trang "Học liệu đã xóa" (V2).
   * Sử dụng URL trực tiếp: `/hoc-lieu-cua-toi?deleted=1&v=v2`.
   */
  async goto() {
    await this.page.goto('/hoc-lieu-cua-toi?deleted=1&v=v2');
    await this.table.waitFor({ state: 'visible' });
    await dismissPopups(this.page);
  }

  // ------------------------------------------------------------------
  // Bộ lọc
  // ------------------------------------------------------------------

  async openFilterType() {
    await this.typeFilterPopover.open();
  }

  async selectFilterType(type: FilterCoursewareTypeV2) {
    await this.typeFilterPopover.selectByValue(type);
  }

  async selectFilterSubject(value: number) {
    await this.subjectFilterPopover.selectByValue(value);
  }

  async selectFilterGrade(value: FilterGradeValue) {
    await this.gradeFilterPopover.selectByValue(value);
  }

  async openAdvancedFilterPanel(): Promise<AdvancedFilterPanel> {
    await dismissPopups(this.page);
    await safeClick(this.page, this.btnAdvancedFilter);
    const panel = new AdvancedFilterPanel(this.page);
    await panel.panel.waitFor({ state: 'visible' });
    return panel;
  }

  async reload() {
    await safeClick(this.page, this.btnReload);
  }

  // ------------------------------------------------------------------
  // Bảng kết quả
  // ------------------------------------------------------------------

  columnHeader(label: string): Locator {
    return this.tableHeader.getByText(label, { exact: true });
  }

  getRowByIndex(index: number): Locator {
    return this.tableRows.nth(index);
  }

  getRowByTitle(title: string): Locator {
    return this.tableRows.filter({ has: this.page.getByText(title, { exact: true }) });
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getTotalRowCountAcrossPages(): Promise<number> {
    const hasPagination = await this.pagination.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!hasPagination) return this.getRowCount();

    const page1Btn = this.pageButton(1);
    if (await page1Btn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.goToPage(1);
    }

    let total = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      total += await this.getRowCount();
      const nextDisabled = await this.btnNextPage.isDisabled().catch(() => true);
      if (nextDisabled) break;
      await this.goToNextPage();
    }
    return total;
  }

  async getRowData(row: Locator): Promise<HocLieuDaXoaRow> {
    const cells = row.locator('td');
    const stt = (await cells.nth(0).innerText()).trim();

    const titleCell = cells.nth(1);
    const deletedStatus = (await titleCell.locator('.tw-badge-outline-sm').first().innerText()).trim() as 'Đã xóa';
    const privacy = (await titleCell.locator('.tw-badge-secondary_light-sm, .tw-badge-accent_light-sm').first().innerText()).trim();
    const title = (await titleCell.locator('.tw-cursor-default').innerText()).trim();
    const type = (await titleCell.locator('.tw-text-content-tertiary').innerText()).trim();

    const grade = (await cells.nth(2).innerText()).trim();
    const subject = (await cells.nth(3).innerText()).trim();
    const course = (await cells.nth(4).innerText()).trim();

    return { stt, title, type, deletedStatus, privacy, grade, subject, course };
  }

  async getAllRowsData(): Promise<HocLieuDaXoaRow[]> {
    const count = await this.getRowCount();
    const result: HocLieuDaXoaRow[] = [];
    for (let i = 0; i < count; i++) {
      result.push(await this.getRowData(this.getRowByIndex(i)));
    }
    return result;
  }

  // ------------------------------------------------------------------
  // Hành động trên dòng
  // ------------------------------------------------------------------

  async restoreCourseware(row: Locator) {
    const restoreBtn = row.getByRole('button', { name: /Khôi phục/i });
    await safeClick(this.page, restoreBtn);
    // Chờ cho dòng biến mất hoặc bảng được tải lại
    await this.page.waitForTimeout(1000);
  }

  // ------------------------------------------------------------------
  // Phân trang
  // ------------------------------------------------------------------

  pageButton(pageNumber: number): Locator {
    return this.pagination.getByRole('button', { name: String(pageNumber), exact: true });
  }

  async goToPage(pageNumber: number) {
    await safeClick(this.page, this.pageButton(pageNumber));
    await this.table.waitFor({ state: 'visible' });
  }

  async goToNextPage() {
    await safeClick(this.page, this.btnNextPage);
    await this.table.waitFor({ state: 'visible' });
  }

  async goToPrevPage() {
    await safeClick(this.page, this.btnPrevPage);
    await this.table.waitFor({ state: 'visible' });
  }

  async expectCurrentPage(pageNumber: number) {
    await expect(
      this.pagination.getByRole('button', { name: String(pageNumber), exact: true })
    ).toHaveAttribute('aria-current', 'page');
  }
}