// Hoclieudaxoav2page.ts
import { Page, Locator, expect } from '@playwright/test';
import {
  dismissPopups,
  safeClick,
  waitForWithPopupWatchdog,
  recoverFromLoginPage,
} from '../../../../core/shared-pages/dismissPopups';
import { resolveTableDataState, TableDataState } from '../../../../core/shared-pages/tableDataState';
import {
  FilterOptionPopover,
  AdvancedFilterPanel,
  FilterCoursewareTypeV2,
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
  // Thông báo hiển thị khi tài khoản KHÔNG có học liệu nào đã xóa (trống
  // hợp lệ, không phải lỗi). ĐÃ XÁC NHẬN DOM THẬT qua ảnh chụp màn hình
  // (2026-08-07): trang render khối minh họa (ảnh tờ giấy + bút) kèm dòng
  // chữ đậm chính xác là "Chưa có học liệu nào" — KHÔNG render <table> khi ở
  // trạng thái này. Ưu tiên match đúng câu này trước; giữ lại các pattern
  // suy đoán cũ làm fallback phòng khi UI đổi chữ nhẹ ở môi trường khác.
  readonly emptyState: Locator;
  readonly emptyStateHeading: Locator;     // riêng dòng chữ "Chưa có học liệu nào" (đã xác nhận DOM thật)

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
    // ĐÃ BỎ btnBackToOldUI ("Quay lại giao diện cũ") + test tương ứng
    // (2026-08-07, theo yêu cầu) — không còn nút chuyển ngược về V1 ở trang này.

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
    // Dòng chữ đậm đã xác nhận đúng 100% qua ảnh chụp màn hình thật.
    this.emptyStateHeading = page.getByText('Chưa có học liệu nào', { exact: true });

    this.emptyState = page.locator(
      [
        // #1: câu đã xác nhận DOM thật (ưu tiên hàng đầu) — matching cả khoảng trắng
        'text=/Chưa có học liệu nào/i',
        // #2: selector rộng hơn - bất kỳ element nào chứa text này
        'text="Chưa có học liệu nào"',
        // #3: div chứa text (phòng case text nằm trong child element)
        'div:has-text("Chưa có học liệu nào")',
        // Fallback: các pattern suy đoán trước đây, phòng trường hợp UI đổi
        // chữ nhẹ ở môi trường khác (staging/khác role) — chưa xác nhận thật
        // nhưng giữ lại để không bị "bó tay" nếu text đổi.
        'text=/không có (dữ liệu|học liệu)/i',
        'text=/chưa (có|từng xóa) học liệu/i',
        'text=/chưa xóa học liệu nào/i',
        // CSS class fallback
        '.empty-state',
        '[data-testid="empty-state"]',
        '[data-state="empty"]',
        '.tw-text-center', // có thể là div center chứa empty state
      ].join(', '),
    );

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
    // FIX (2026-08-07): trước đây goto() chỉ chờ `table.isVisible()` — điều
    // này giả định NGẦM rằng tài khoản test LUÔN có ít nhất 1 học liệu đã
    // xóa. Với tài khoản KHÔNG có dữ liệu ở mục này (trống hợp lệ), trang
    // có thể không render <table> (thay bằng khối "không có dữ liệu"),
    // khiến điều kiện chờ không bao giờ đạt.
    //
    // Chờ 1 trong 2 điều kiện — ĐÚNG 1 trong 2 trường hợp hợp lệ khi đăng
    // nhập vào 1 tài khoản bất kỳ:
    //   1. table hiển thị (tài khoản CÓ học liệu đã xóa), HOẶC
    //   2. emptyState hiển thị (tài khoản CHƯA xóa học liệu nào)
    // Nếu sau khi hết thời gian chờ (kể cả sau khi đã thử khôi phục đăng
    // nhập lần 2, xem waitForWithPopupWatchdog) vẫn không thấy CẢ 2 -> đây
    // mới thực sự là lỗi -> vẫn throw để test fail rõ.

    // Bước 1: Chờ heading "Học liệu đã xóa" hiển thị (đảm bảo page đã
    // load). Nếu không thấy trong 10s, thử khôi phục đăng nhập lần 2 (phòng
    // trường hợp bị văng về /dangnhap giữa chừng — KHÔNG phải popup nên
    // dismissPopups() thường không xử lý được) rồi chờ lại 1 lần trước khi
    // để bước 2 bên dưới xử lý phần còn lại.
    const headingVisible = await this.heading
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!headingVisible) {
      await recoverFromLoginPage(this.page);
      await dismissPopups(this.page);
      await this.heading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    }

    await dismissPopups(this.page);

    // Bước 2: Chờ table HOẶC emptyState hiển thị. waitForWithPopupWatchdog
    // tự thử khôi phục đăng nhập lần 2 bên trong nếu phát hiện bị văng về
    // /dangnhap — không cần lặp lại logic đó ở đây.
    try {
      await waitForWithPopupWatchdog(
        this.page,
        async () => {
          const [tableVisible, emptyVisible] = await Promise.all([
            this.table.isVisible().catch(() => false),
            // FIX: dùng emptyStateHeading (getByText exact, đã xác nhận DOM
            // thật) thay vì emptyState — emptyState gộp nhiều selector rộng
            // (VD ".tw-text-center") có thể khớp nhầm 1 phần tử KHÔNG PHẢI
            // dòng chữ trống thật ở vị trí đầu tiên trong DOM.
            this.emptyStateHeading.isVisible().catch(() => false),
          ]);
          return tableVisible || emptyVisible;
        },
        {
          label: 'bảng hoặc thông báo trống của trang "Học liệu đã xóa"',
          timeoutMs: 30_000,
        },
      );
    } catch (error) {
      // Chỉ log 1 dòng chẩn đoán ngắn gọn (url hiện tại) — tránh dump toàn
      // bộ HTML/trạng thái ra console, vốn làm log test khó đọc mà không
      // thêm nhiều giá trị so với screenshot/trace đã có sẵn khi fail
      // (screenshot: 'only-on-failure', trace: 'retain-on-failure' trong
      // playwright.config.ts).
      console.error(`[Hoc-lieu-da-xoa] Không tải xong trang — url hiện tại: ${this.page.url()}`);
      throw error;
    }
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

  /**
   * Xác định tài khoản test hiện tại đang ở trường hợp nào: 'has-data' (có
   * ít nhất 1 học liệu đã xóa) hay 'empty' (chưa xóa cái nào — trống hợp lệ).
   * Throw nếu không xác định được (không có dòng nào MÀ cũng không thấy
   * thông báo trống) — xem giải thích chi tiết trong tableDataState.ts.
   *
   * Dùng ở đầu các test phụ thuộc dữ liệu (badge, nút "Khôi phục", phân
   * trang...) để rẽ nhánh đúng, thay vì giả định luôn có sẵn dữ liệu seed.
   */
  async getDataState(): Promise<TableDataState> {
    // FIX: dùng emptyStateHeading thay vì emptyState — cùng lý do như trong
    // goto() ở trên (emptyState.first() có thể khớp nhầm phần tử ẩn).
    return resolveTableDataState(this.tableRows, this.emptyStateHeading, {
      label: 'Bảng "Học liệu đã xóa"',
    });
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