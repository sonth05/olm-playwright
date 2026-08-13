import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick, waitForWithPopupWatchdog } from '../../../../core/shared-pages/dismissPopups';
import {
  FilterOptionPopover,
  AdvancedFilterPanel,
  FilterCoursewareTypeV2,
  FilterGradeValue,
} from './Hoclieucuatoiv2page';

export interface HocLieuDuocChiaSeRow {
  stt: string;
  title: string;
  type: string;                    // VD "[Kiểm tra]"
  status: 'Bản nháp' | 'Đã xuất bản' | string;
  privacy: 'Riêng tư' | 'Công khai' | string;
  grade: string;                   // VD "Lớp 12"
  subject: string;                 // VD "Toán"
  course: string;                  // thường trống
  viewUrl: string;                 // href từ nút "Xem"
}

export class HocLieuDuocChiaSeV2Page {
  readonly page: Page;

  // ---- Header ----
  readonly heading: Locator;                // "Học liệu được chia sẻ"
  readonly guideLink: Locator;              // "Hướng dẫn tạo học liệu"

  // ---- Tabs ----
  readonly tabAll: Locator;                 // "Tất cả"
  readonly tabPublished: Locator;           // "Đã xuất bản"
  readonly tabUnpublished: Locator;         // "Chưa xuất bản"
  readonly tabAllCountBadge: Locator;

  // ---- Search ----
  readonly searchInput: Locator;            // placeholder "Tìm theo tên học liệu"

  // ---- Bộ lọc ----
  readonly filterTypeBtn: Locator;
  readonly filterSubjectBtn: Locator;
  readonly filterGradeBtn: Locator;
  readonly btnAdvancedFilter: Locator;
  readonly btnReload: Locator;

  readonly typeFilterPopover: FilterOptionPopover;
  readonly subjectFilterPopover: FilterOptionPopover;
  readonly gradeFilterPopover: FilterOptionPopover;

  // ---- Bảng ----
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly tableHeader: Locator;

  // ---- Phân trang ----
  readonly pagination: Locator;
  readonly btnPrevPage: Locator;
  readonly btnNextPage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tiêu đề
    this.heading = page.locator('div.tw-text-2xl.tw-font-semibold', {
      hasText: 'Học liệu được chia sẻ',
    }).first();

    this.guideLink = page.getByRole('link', { name: /Hướng dẫn tạo học liệu/i });

    // Tabs
    this.tabAll = page.getByRole('tab', { name: /^Tất cả/ });
    this.tabPublished = page.getByRole('tab', { name: /Đã xuất bản/ });
    this.tabUnpublished = page.getByRole('tab', { name: /Chưa xuất bản/ });
    this.tabAllCountBadge = this.tabAll.locator('[data-slot="badge"]');

    // Search
    this.searchInput = page.getByPlaceholder('Tìm theo tên học liệu');

    // Lọc
    this.filterTypeBtn = page.getByRole('button', { name: /Tất cả loại học liệu/i });
    this.filterSubjectBtn = page.getByRole('button', { name: /Tất cả môn học/i });
    this.filterGradeBtn = page.getByRole('button', { name: /Tất cả khối lớp/i });
    this.btnAdvancedFilter = page.getByRole('button', { name: /Bộ lọc nâng cao/i });
    this.btnReload = page.getByRole('button', { name: /Tải lại/i });

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

  async goto() {
    // URL của trang "Học liệu được chia sẻ" (được chia sẻ cá nhân) trong menu là
    // key "hoc-lieu-duoc-chia-se", thường redirect đến phiên bản V2 với ?v=v2.
    await this.page.goto('/hoc-lieu-duoc-chia-se?v=v2');
    // FIX: giống Hoclieudaxoav2page.ts — table.waitFor trần timeout 20s vì
    // popup/thông báo che table lúc kiểm tra. Dùng waitForWithPopupWatchdog
    // để tự dismissPopups() rồi kiểm tra lại theo chu kỳ.
    await dismissPopups(this.page);
    await waitForWithPopupWatchdog(
      this.page,
      () => this.table.isVisible().catch(() => false),
      { label: 'bảng "Học liệu được chia sẻ" hiển thị', timeoutMs: 30_000 },
    );
    await dismissPopups(this.page);
  }

  // ------------------------------------------------------------------
  // Tabs
  // ------------------------------------------------------------------
  async selectTab(tab: 'all' | 'published' | 'unpublished') {
    const map = {
      all: this.tabAll,
      published: this.tabPublished,
      unpublished: this.tabUnpublished,
    };
    await safeClick(this.page, map[tab]);
  }

  async getAllTabCount(): Promise<number> {
    const text = (await this.tabAllCountBadge.innerText()).trim();
    return Number(text);
  }

  // ------------------------------------------------------------------
  // Search & Filter
  // ------------------------------------------------------------------
  async searchByTitle(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.keyboard.press('Enter');
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
  // Bảng
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

  async getRowData(row: Locator): Promise<HocLieuDuocChiaSeRow> {
    const cells = row.locator('td');
    const stt = (await cells.nth(0).innerText()).trim();

    const titleCell = cells.nth(1);
    // Badge trạng thái: "Bản nháp" (outline) hoặc "Đã xuất bản" (positive_light)
    const status = (await titleCell.locator('.tw-badge-outline-sm, .tw-badge-positive_light-sm').first().innerText()).trim();
    // Badge quyền: "Riêng tư" (secondary_light) hoặc "Công khai" (accent_light)
    const privacy = (await titleCell.locator('.tw-badge-secondary_light-sm, .tw-badge-accent_light-sm').first().innerText()).trim();
    const title = (await titleCell.locator('.tw-cursor-default').innerText()).trim();
    const type = (await titleCell.locator('.tw-text-content-tertiary').innerText()).trim();

    const grade = (await cells.nth(2).innerText()).trim();
    const subject = (await cells.nth(3).innerText()).trim();
    const course = (await cells.nth(4).innerText()).trim();

    // Cột hành động (cột thứ 6): link "Xem" đầu tiên (icon eye)
    const actionCell = cells.nth(5);
    const viewUrl = (await actionCell.getByRole('link').first().getAttribute('href')) ?? '';

    return { stt, title, type, status, privacy, grade, subject, course, viewUrl };
  }

  async getAllRowsData(): Promise<HocLieuDuocChiaSeRow[]> {
    const count = await this.getRowCount();
    const result: HocLieuDuocChiaSeRow[] = [];
    for (let i = 0; i < count; i++) {
      result.push(await this.getRowData(this.getRowByIndex(i)));
    }
    return result;
  }

  // ------------------------------------------------------------------
  // Hành động trên dòng
  // ------------------------------------------------------------------
  async viewCourseware(row: Locator) {
    const viewLink = row.getByRole('link').first(); // nút "Xem"
    await safeClick(this.page, viewLink);
    await this.page.waitForLoadState('domcontentloaded');
    await dismissPopups(this.page);
  }

  /**
   * Nút "Tùy chọn" (more actions) trên 1 dòng.
   *
   * CHƯA CÓ ảnh chụp DOM thật của cột hành động ở trang này (khác với trang
   * "Học liệu đã xóa" — đã xác nhận DOM thật). Test UI hiện fail với lỗi
   * "element(s) not found" cho `getByRole('button', { name: /Tùy chọn/i })`
   * trên dòng đầu — nghĩa là nút không có accessible name chứa "Tùy chọn"
   * (rất có thể là nút chỉ có icon 3 chấm, dùng aria-label khác, hoặc
   * `title` thay vì text hiển thị — giống pattern `.dropdown-toggle` dùng ở
   * KhoaHocCuaToiPage/KhoaHocDuocChiaSePage trong cùng dự án).
   *
   * Mở rộng có kiểm soát: thử thêm vài pattern phổ biến làm fallback, nhưng
   * CẦN xác nhận lại bằng ảnh chụp/inspect DOM thật cột "Hành động" của
   * trang "Học liệu được chia sẻ" trước khi coi selector này là final —
   * khác với emptyState (đã xác nhận), đây vẫn là suy đoán.
   */
  rowMoreOptionsButton(row: Locator): Locator {
    return row.locator(
      [
        'button:has-text("Tùy chọn")',
        '[aria-label*="Tùy chọn" i]',
        '[aria-label*="options" i]',
        '[aria-label*="more" i]',
        'button.dropdown-toggle',
        'button[data-slot="dropdown-menu-trigger"]',
      ].join(', '),
    ).first();
  }

  async openMoreOptions(row: Locator) {
    await safeClick(this.page, this.rowMoreOptionsButton(row));
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