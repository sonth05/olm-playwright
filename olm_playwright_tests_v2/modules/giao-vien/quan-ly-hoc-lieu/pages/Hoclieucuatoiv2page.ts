import { Page, Locator, expect } from '@playwright/test';
import { HocLieuCuaToiPage } from './HocLieuCuaToiPageV1';
import { dismissPopups, safeClick } from '../../../../core/shared-pages/dismissPopups';

export type MaterialStatusTab = 'all' | 'published' | 'unpublished';

export interface HocLieuV2Row {
  stt: string;
  title: string;
  type: string; // VD: "[Kiểm tra]", "[Video]", "[Học liệu game hóa]", "[Kỹ năng, NHCH]"
  status: 'Bản nháp' | 'Đã xuất bản' | string;
  privacy: 'Riêng tư' | 'Công khai' | string;
  grade: string; // Khối lớp, VD "Lớp 12"
  subject: string; // Môn học, VD "Toán"
  course: string; // Khóa học (có thể rỗng)
  viewUrl: string;
  editUrl: string;
}

export class HocLieuCuaToiV2Page {
  readonly page: Page;
  // ---- Header ----
  readonly heading: Locator; // "Học liệu của tôi"
  readonly guideLink: Locator; // "Hướng dẫn tạo học liệu"
  readonly btnCreateNew: Locator; // "Tạo mới học liệu" (mở CreateHocLieuMenu)

  // ---- Tabs trạng thái ----
  readonly tabAll: Locator;
  readonly tabPublished: Locator; // Đã xuất bản
  readonly tabUnpublished: Locator; // Chưa xuất bản
  readonly tabAllCountBadge: Locator;

  // ---- Ô tìm kiếm ----
  readonly searchInput: Locator; // placeholder "Tìm theo tên học liệu"

  // ---- Bộ lọc ----
  readonly filterTypeBtn: Locator; // "Tất cả loại học liệu"
  readonly filterSubjectBtn: Locator; // "Tất cả môn học"
  readonly filterGradeBtn: Locator; // "Tất cả khối lớp"
  readonly btnAdvancedFilter: Locator; // "Bộ lọc nâng cao"
  readonly btnReload: Locator; // "Tải lại"

  // ---- Bảng kết quả ----
  readonly table: Locator;
  readonly tableRows: Locator; // tbody > tr

  // ---- Phân trang ----
  readonly pagination: Locator;
  readonly btnPrevPage: Locator;
  readonly btnNextPage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByText('Học liệu của tôi', { exact: true });
    this.guideLink = page.getByRole('link', { name: /Hướng dẫn tạo học liệu/i });
    this.btnCreateNew = page.getByRole('button', { name: /Tạo mới học liệu/i });

    this.tabAll = page.getByRole('tab', { name: /^Tất cả/i });
    this.tabPublished = page.getByRole('tab', { name: /Đã xuất bản/i });
    this.tabUnpublished = page.getByRole('tab', { name: /Chưa xuất bản/i });
    this.tabAllCountBadge = this.tabAll.locator('[data-slot="badge"]');

    this.searchInput = page.getByPlaceholder('Tìm theo tên học liệu');

    this.filterTypeBtn = page.getByRole('button', { name: /Tất cả loại học liệu/i });
    this.filterSubjectBtn = page.getByRole('button', { name: /Tất cả môn học/i });
    this.filterGradeBtn = page.getByRole('button', { name: /Tất cả khối lớp/i });
    this.btnAdvancedFilter = page.getByRole('button', { name: /Bộ lọc nâng cao/i });
    this.btnReload = page.getByRole('button', { name: /Tải lại/i });

    this.table = page.locator('table');
    this.tableRows = this.table.locator('tbody tr');

    this.pagination = page.getByRole('navigation', { name: /pagination/i });
    this.btnPrevPage = this.pagination.getByRole('button', { name: /previous page/i });
    this.btnNextPage = this.pagination.getByRole('button', { name: /next page/i });
  }

  
  async goto(_url = '/hoc-lieu-cua-toi') {
    const alreadyOnV2 = await this.tabAll.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!alreadyOnV2) {
      const v1Page = new HocLieuCuaToiPage(this.page);
      await v1Page.navigateToHocLieuCuaToi();
      await v1Page.switchToNewVersion();
    }
    await this.table.waitFor({ state: 'visible' });
   
    await dismissPopups(this.page);
  }

  // ------------------------------------------------------------------
  // Tabs trạng thái
  // ------------------------------------------------------------------

  async selectStatusTab(tab: MaterialStatusTab) {
    const map: Record<MaterialStatusTab, Locator> = {
      all: this.tabAll,
      published: this.tabPublished,
      unpublished: this.tabUnpublished,
    };
    // FIX: dùng safeClick thay vì .click() trần — chuyển tab kéo theo bảng
    // reload dữ liệu, có thể trùng lúc 1 toast/thông báo mới xuất hiện che
    // đúng lúc bấm, gây "element intercepts pointer events".
    await safeClick(this.page, map[tab]);
  }

  /** Đọc số lượng trên badge của tab "Tất cả" (chỉ tab này có badge trong DOM mẫu) */
  async getAllTabCount(): Promise<number> {
    const text = (await this.tabAllCountBadge.innerText()).trim();
    return Number(text);
  }

  // ------------------------------------------------------------------
  // Tìm kiếm & bộ lọc
  // ------------------------------------------------------------------

  async searchByTitle(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Mở 1 trong 3 dropdown lọc (loại học liệu/môn học/khối lớp) — popover Radix.
   * TODO: DOM nội dung popover (danh sách option) chưa được capture — hàm chỉ
   * dừng ở bước mở, CẦN bổ sung selector chọn option cụ thể khi có DOM thật.
   */
  async openFilterType() {
    await this.filterTypeBtn.click();
  }

  async openFilterSubject() {
    await this.filterSubjectBtn.click();
  }

  async openFilterGrade() {
    await this.filterGradeBtn.click();
  }

  async openAdvancedFilter() {
    await this.btnAdvancedFilter.click();
  }

  async reload() {
    await safeClick(this.page, this.btnReload);
  }

  // ------------------------------------------------------------------
  // Bảng kết quả
  // ------------------------------------------------------------------

  getRowByIndex(index: number): Locator {
    return this.tableRows.nth(index);
  }

  /** Tìm dòng theo tiêu đề học liệu khớp chính xác (cột "Tên học liệu") */
  getRowByTitle(title: string): Locator {
    return this.tableRows.filter({ has: this.page.getByText(title, { exact: true }) });
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getRowData(row: Locator): Promise<HocLieuV2Row> {
    const cells = row.locator('td');
    const stt = (await cells.nth(0).innerText()).trim();

    const titleCell = cells.nth(1);
    // Badge trạng thái xuất bản = badge đầu tiên (Bản nháp | Đã xuất bản)
    const status = (await titleCell.locator('.tw-badge-outline-sm, .tw-badge-positive_light-sm').first().innerText()).trim();
    // Badge quyền riêng tư = badge thứ 2 (Riêng tư | Công khai)
    const privacy = (await titleCell.locator('.tw-badge-secondary_light-sm, .tw-badge-accent_light-sm').first().innerText()).trim();
    const title = (await titleCell.locator('.tw-cursor-default').innerText()).trim();
    const type = (await titleCell.locator('.tw-text-content-tertiary').innerText()).trim();

    const grade = (await cells.nth(2).innerText()).trim();
    const subject = (await cells.nth(3).innerText()).trim();
    const course = (await cells.nth(4).innerText()).trim();

    const actionCell = cells.nth(5);
    const viewUrl = (await actionCell.getByRole('link').first().getAttribute('href')) ?? '';
    const editUrl = (await actionCell.getByRole('link', { name: /Sửa/i }).getAttribute('href')) ?? '';

    return { stt, title, type, status: status as HocLieuV2Row['status'], privacy: privacy as HocLieuV2Row['privacy'], grade, subject, course, viewUrl, editUrl };
  }

  async getAllRowsData(): Promise<HocLieuV2Row[]> {
    const count = await this.getRowCount();
    const result: HocLieuV2Row[] = [];
    for (let i = 0; i < count; i++) {
      result.push(await this.getRowData(this.getRowByIndex(i)));
    }
    return result;
  }

  // ------------------------------------------------------------------
  // Hành động trên từng dòng
  // ------------------------------------------------------------------

  async viewCourseware(row: Locator) {
    // FIX: check + tắt popup trước khi bấm (link "Xem" gây full navigation
    // sang trang khác — nếu bị popup che đúng lúc bấm, click coi như trượt).
    if (await this.page.locator('.modal.show, [role="dialog"]').first().isVisible({ timeout: 300 }).catch(() => false)) {
      await dismissPopups(this.page);
    }
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      row.getByRole('link').first().click(),
    ]);
    // Trang đích (Xem học liệu) có thể tự bắn popup riêng (VD "Xác thực")
    // không liên quan gì tới bảng danh sách vừa rời khỏi — dọn luôn ở đây.
    await dismissPopups(this.page);
  }

  async editCourseware(row: Locator) {
    if (await this.page.locator('.modal.show, [role="dialog"]').first().isVisible({ timeout: 300 }).catch(() => false)) {
      await dismissPopups(this.page);
    }
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      row.getByRole('link', { name: /Sửa/i }).click(),
    ]);
    // Trang đích (màn soạn học liệu) có thể tự bắn popup riêng — dọn luôn.
    await dismissPopups(this.page);
  }

  async openRowMoreOptions(row: Locator): Promise<void> {
    await safeClick(this.page, row.getByRole('button', { name: /Tùy chọn/i }));
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
    await expect(this.pagination.getByRole('button', { name: String(pageNumber), exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
}