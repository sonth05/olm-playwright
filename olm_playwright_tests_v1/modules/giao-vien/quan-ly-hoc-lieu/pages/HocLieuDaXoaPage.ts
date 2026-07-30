// modules/giao-vien/hoc-lieu-v1/pages/HocLieuDaXoaPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';
import { waitForWithPopupWatchdog, hasBlockingPopup } from '@core/shared-pages/dismissPopups';
import { CoursewareType } from './HocLieuCuaToiPage';
import { FilterCoursewareType, SourceCate } from './HocLieuDuocChiaSeCaNhanPage';

/**
 * Page Object — Học liệu đã xóa (2.3.4).
 * Danh sách học liệu đã xóa (khôi phục lại được), tạo mới học liệu, bộ lọc.
 *
 * Dựng từ HTML thực tế CÓ dữ liệu (10 dòng + phân trang).
 *
 * ĐIỂM QUAN TRỌNG phát hiện từ HTML:
 * - Đây KHÔNG phải route riêng — cùng URL/form action với HocLieuCuaToiPage
 *   (`https://olm.vn/hoc-lieu-cua-toi`), chỉ khác ở query param `?deleted=1`
 *   (form có checkbox ẩn `#deleted` value="1" luôn checked, class `d-none`).
 *   Phân trang cũng theo pattern `/hoc-lieu-cua-toi/page-{n}?deleted=1`.
 * - Dropdown "Tạo mới học liệu" và form lọc giống hệt 2 trang đã làm trước
 *   (HocLieuCuaToiPage / HocLieuDuocChiaSeCaNhanPage) nên tái dùng
 *   `CoursewareType`, `FilterCoursewareType`, `SourceCate` thay vì định
 *   nghĩa lại.
 * - Cột "Hành động" ở đây KHÔNG có nút — chỉ có 1 checkbox "Khôi phục" mỗi
 *   dòng (id dạng `restoreCourseWare<id>`). Chưa thấy nút submit hàng loạt
 *   (VD "Khôi phục đã chọn") trong đoạn HTML được gửi — có thể nó chỉ xuất
 *   hiện SAU khi tick ít nhất 1 checkbox. `restoreSelected()` bên dưới tạm
 *   dùng selector phỏng đoán `button:has-text("Khôi phục")` nằm NGOÀI bảng,
 *   CẦN xác minh lại khi có HTML đúng lúc đã tick.
 * - Header `<th>` ghi "Tên học liệu" nhưng `<td data-label="Tên bài">` —
 *   giữ nguyên khác biệt này trong selector `data-label` để đúng DOM thật.
 */

export interface DeletedFilterOptions {
  sourceCate?: SourceCate;
  type?: FilterCoursewareType;
  /** Truyền đúng label hiển thị trong option, VD: "Toán" */
  subject?: string;
  /** Truyền đúng label hiển thị trong option, VD: "Lớp 9" */
  grade?: string;
  title?: string;
  freeCateOnly?: boolean;
  hiddenCateOnly?: boolean;
}

export interface DeletedCoursewareRow {
  id: string;
  stt: string;
  title: string;
  detailUrl: string;
  createdDate: string;
  category: string;
  course: string;
}

export class HocLieuDaXoaPage extends BasePage {
  static readonly URL = '/hoc-lieu-cua-toi?deleted=1';
  static readonly pageUrl = (page: number): string => `/hoc-lieu-cua-toi/page-${page}?deleted=1`;

  // ---- Sidebar navigation (đã xác nhận từ HTML sidebar thật) ----
  static readonly MENU_HOC_LIEU = 'button[data-menu-key="hoc-lieu"]';
  // FIX: id trùng lặp trên trang thật (xem lý giải trong BoSuuTapHocLieuPage.ts
  // - id="menu-bo-suu-tap-hoc-lieu" cũng dính lỗi tương tự, cùng pattern sidebar).
  // Thu hẹp bằng class '.menu-link' để tránh "strict mode violation: resolved to 2 elements".
  static readonly MENU_HOC_LIEU_DA_XOA = '#menu-hoc-lieu-da-xoa.menu-link';

  // ---- Nút mở dropdown tạo mới (giống hệt HocLieuCuaToiPage) ----
  static readonly TAO_MOI_BTN = 'button:has-text("Tạo mới học liệu")';
  static readonly DROPDOWN_MENU = '.dropdown-menu.show';
  static readonly GAME_HOA_ITEM = '#demoViewCategoryBuilder .dropdown-item';
  static readonly MODAL = 'div.modal.show, div[role="dialog"]:visible';

  // ---- Form bộ lọc (cùng action với HocLieuCuaToiPage, thêm #deleted ẩn) ----
  static readonly FILTER_FORM = 'form[action="https://olm.vn/hoc-lieu-cua-toi"]';
  static readonly SOURCE_CATE_SELECT = '#source_cate';
  static readonly TYPE_SELECT = '#type';
  static readonly SUBJECT_SELECT = '#id_subject';
  static readonly GRADE_SELECT = '#grade';
  // Scope trong form lọc — sửa lỗi strict-mode violation thực tế đã gặp:
  // `#title` toàn trang khớp CẢ input trong modal "Tạo học liệu" (còn sót
  // lại trong DOM sau khi đóng modal ở test trước) LẪN input form lọc.
  static readonly TITLE_INPUT = `${HocLieuDaXoaPage.FILTER_FORM} #title`;
  static readonly FREE_CATE_CHECKBOX = '#free_cate';
  static readonly HIDDEN_CATE_CHECKBOX = '#hidden_cate';
  /** Checkbox ẩn, luôn checked=1 — không cần thao tác, chỉ để tham chiếu/assert */
  static readonly DELETED_HIDDEN_CHECKBOX = '#deleted';
  static readonly FILTER_SUBMIT_BTN = `${HocLieuDaXoaPage.FILTER_FORM} button[type="submit"]`;

  // ---- Bảng danh sách ----
  static readonly TABLE = '.card-v2 table.table';
  static readonly TABLE_ROWS = 'tr.courseware-item';
  static readonly ROW_BY_ID = (id: string) => `tr.courseware-item[data-id="${id}"]`;
  static readonly ROW_TITLE_LINK = 'td[data-label="Tên bài"] a.olm-text-link';
  static readonly ROW_CREATED_DATE = 'td[data-label="Ngày tạo"]';
  static readonly ROW_CATEGORY = 'td[data-label="Thể loại"]';
  static readonly ROW_COURSE = 'td[data-label="Khóa học"]';
  static readonly ROW_RESTORE_CHECKBOX = 'td[data-label="Hành động"] input[name="restore"]';

  // ---- Hành động khôi phục hàng loạt ----
  // TODO: phỏng đoán — cần xác minh selector thật khi có HTML lúc đã tick checkbox
  static readonly RESTORE_SELECTED_BTN = 'button:has-text("Khôi phục")';

  // ---- Phân trang ----
  static readonly PAGINATION = 'nav ul.pagination';
  static readonly PAGE_LINK = (page: number) => `nav ul.pagination a.page-link[data-page="${page}"]`;
  static readonly ACTIVE_PAGE_ITEM = 'nav ul.pagination li.page-item.active a.page-link';
  static readonly NEXT_PAGE_LINK = 'nav ul.pagination li.page-item:last-child a.page-link';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // ---- Điều hướng ----
  // ==================================================================

  async navigateToHocLieuDaXoa(): Promise<this> {
    const url = this.getCurrentUrl();
    const isOnPage = url.includes('hoc-lieu-cua-toi') && url.includes('deleted=1');
    if (!isOnPage) {
      // Page mới của fixture bắt đầu ở about:blank — phải đảm bảo sidebar
      // đã render trước khi thao tác menu.
      await this.ensurePageLoaded();

      // Đi qua sidebar cho đúng nghiệp vụ (người dùng thật không gõ URL).
      // Nhóm cha "Học liệu cá nhân" là toggle (aria-expanded) — chỉ bấm mở
      // nếu đang đóng, tránh bấm nhầm làm nó ĐÓNG lại.
      const parentToggle = this.page.locator(HocLieuDaXoaPage.MENU_HOC_LIEU);
      await this.scrollSidebarUntilVisible(parentToggle);
      const isExpanded = (await parentToggle.getAttribute('aria-expanded')) === 'true';
      if (!isExpanded) {
        await parentToggle.click();
      }

      const childLink = this.page.locator(HocLieuDaXoaPage.MENU_HOC_LIEU_DA_XOA);
      await this.scrollSidebarUntilVisible(childLink);
      await childLink.waitFor({ state: 'visible', timeout: 10_000 });
      await childLink.click();

      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForURL(/deleted=1/, { timeout: 10_000 }).catch(() => {});

      // FIX (2026-07-28): waitForURL xong không có nghĩa là trang đã sẵn
      // sàng thao tác — nếu có popup thông báo RIÊNG của trang này (chưa
      // từng gặp lúc ensurePageLoaded() còn ở /home nên chưa bị tắt), nút
      // "Tạo mới học liệu" bị che, các bước sau (mở dropdown, đọc bảng...)
      // sẽ đứng lặng rồi timeout. Dùng waitForWithPopupWatchdog(): cứ mỗi
      // ~2s nút này chưa hiện thì tự kiểm tra & tắt popup rồi thử lại.
      await waitForWithPopupWatchdog(
        this.page,
        async () => {
          if (await hasBlockingPopup(this.page, 300)) return false;
          return this.page
            .locator(HocLieuDaXoaPage.TAO_MOI_BTN)
            .isVisible()
            .catch(() => false);
        },
        { label: 'trang "Học liệu đã xóa" hiển thị xong, không còn popup che' }
      ).catch(() => {
        // Giữ hành vi cũ (không throw) — để lỗi lộ ra ở bước thao tác kế
        // tiếp nếu trang thật sự chưa sẵn sàng vì lý do khác popup.
      });
    }
    return this;
  }

  async goToPage(page: number): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.page.locator(HocLieuDaXoaPage.PAGE_LINK(page)).click(),
    ]);
    await this.dismissPopups();
    return this;
  }

  async getCurrentPage(): Promise<number> {
    const text = (await this.page.locator(HocLieuDaXoaPage.ACTIVE_PAGE_ITEM).innerText()).trim();
    return Number(text) || 1;
  }

  // ==================================================================
  // ---- Dropdown "Tạo mới học liệu" (logic giống HocLieuCuaToiPage) ----
  // ==================================================================

  async openCreateDropdown(): Promise<Locator> {
    await this.page.locator(HocLieuDaXoaPage.TAO_MOI_BTN).click();
    const dropdown = this.page.locator(HocLieuDaXoaPage.DROPDOWN_MENU);
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    return dropdown;
  }

  private dropdownItemSelector(type: CoursewareType): string {
    return `a.select-cate-type[data-type="${type}"]`;
  }

  async selectCoursewareType(type: CoursewareType): Promise<this> {
    await this.page.locator(this.dropdownItemSelector(type)).click();
    return this;
  }

  async selectGameHoa(): Promise<this> {
    await this.page.locator(HocLieuDaXoaPage.GAME_HOA_ITEM).click();
    return this;
  }

  async openCreateModal(type: CoursewareType | 'game-hoa'): Promise<this> {
    await this.openCreateDropdown();
    if (type === 'game-hoa') {
      await this.selectGameHoa();
    } else {
      await this.selectCoursewareType(type);
    }
    await this.page.locator(HocLieuDaXoaPage.MODAL).waitFor({ state: 'visible', timeout: 10000 });
    return this;
  }

  // ==================================================================
  // ---- Bộ lọc ----
  // ==================================================================

  async fillFilter(options: DeletedFilterOptions): Promise<this> {
    if (options.sourceCate) {
      await this.page.locator(HocLieuDaXoaPage.SOURCE_CATE_SELECT).selectOption(options.sourceCate);
    }
    if (options.type !== undefined) {
      await this.page.locator(HocLieuDaXoaPage.TYPE_SELECT).selectOption(String(options.type));
    }
    if (options.subject) {
      await this.page.locator(HocLieuDaXoaPage.SUBJECT_SELECT).selectOption({ label: options.subject });
    }
    if (options.grade) {
      await this.page.locator(HocLieuDaXoaPage.GRADE_SELECT).selectOption({ label: options.grade });
    }
    if (options.title) {
      await this.page.locator(HocLieuDaXoaPage.TITLE_INPUT).fill(options.title);
    }
    if (options.freeCateOnly) {
      await this.page.locator(HocLieuDaXoaPage.FREE_CATE_CHECKBOX).check();
    }
    if (options.hiddenCateOnly) {
      await this.page.locator(HocLieuDaXoaPage.HIDDEN_CATE_CHECKBOX).check();
    }
    return this;
  }

  async submitFilter(): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.page.locator(HocLieuDaXoaPage.FILTER_SUBMIT_BTN).click(),
    ]);
    await this.dismissPopups();
    return this;
  }

  async filterList(options: DeletedFilterOptions): Promise<this> {
    await this.fillFilter(options);
    await this.submitFilter();
    return this;
  }

  // ==================================================================
  // ---- Bảng danh sách ----
  // ==================================================================

  getTableRows(): Locator {
    return this.page.locator(HocLieuDaXoaPage.TABLE_ROWS);
  }

  getRowById(id: string): Locator {
    return this.page.locator(HocLieuDaXoaPage.ROW_BY_ID(id));
  }

  getRowByTitle(title: string): Locator {
    return this.getTableRows().filter({ hasText: title });
  }

  async getRowData(row: Locator): Promise<DeletedCoursewareRow> {
    const id = (await row.getAttribute('data-id')) ?? '';
    const stt = (await row.locator('td[data-label="STT"]').innerText()).trim();
    const titleLink = row.locator(HocLieuDaXoaPage.ROW_TITLE_LINK);
    const title = (await titleLink.innerText()).trim();
    const detailUrl = (await titleLink.getAttribute('href')) ?? '';
    const createdDate = (await row.locator(HocLieuDaXoaPage.ROW_CREATED_DATE).innerText()).trim();
    const category = (await row.locator(HocLieuDaXoaPage.ROW_CATEGORY).innerText()).trim();
    const course = (await row.locator(HocLieuDaXoaPage.ROW_COURSE).innerText()).trim();

    return { id, stt, title, detailUrl, createdDate, category, course };
  }

  async getAllRowsData(): Promise<DeletedCoursewareRow[]> {
    const rows = await this.getTableRows().all();
    const result: DeletedCoursewareRow[] = [];
    for (const row of rows) {
      result.push(await this.getRowData(row));
    }
    return result;
  }

  // ==================================================================
  // ---- Khôi phục học liệu ----
  // ==================================================================

  /**
   * Tick checkbox "Khôi phục" trên 1 dòng theo id, KHÔNG tự submit.
   *
   * Checkbox dùng pattern Bootstrap custom-checkbox: <input> thật bị ẩn
   * bằng CSS, chỉ <label> hiển thị đè lên trên — click thẳng vào input dễ
   * bị "intercept" bởi label/header sticky khi cuộn dòng vào giữa viewport
   * (đã gặp thực tế: header-wrapper sticky che mất input khi dòng cuộn tới
   * gần đỉnh trang). scrollIntoViewIfNeeded + { force: true } bỏ qua bước
   * kiểm tra "actionability" (visible/stable/không bị che) của Playwright,
   * tương đương cách người dùng thật vẫn bấm trúng nhờ label lồng đúng vị trí.
   */
  async checkRestore(id: string): Promise<this> {
    const checkbox = this.getRowById(id).locator(HocLieuDaXoaPage.ROW_RESTORE_CHECKBOX);
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.check({ force: true });
    return this;
  }

  /**
   * Bấm nút khôi phục hàng loạt sau khi đã tick checkbox.
   * TODO: xác minh lại selector nút — chưa có HTML lúc nút này xuất hiện
   * (có thể chỉ hiện sau khi tick ít nhất 1 checkbox, dạng floating bar).
   */
  async restoreSelected(): Promise<this> {
    await this.page.locator(HocLieuDaXoaPage.RESTORE_SELECTED_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  /** Luồng đầy đủ: tick checkbox khôi phục theo id → bấm khôi phục */
  async restoreCourseware(id: string): Promise<this> {
    await this.checkRestore(id);
    await this.restoreSelected();
    return this;
  }
}