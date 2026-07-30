// modules/giao-vien/hoc-lieu-v1/pages/HocLieuDuocChiaSeCaNhanPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';
import { waitForWithPopupWatchdog, hasBlockingPopup } from 'core/shared-pages/dismissPopups';
import { CoursewareType } from './HocLieuCuaToiPage';

/**
 * Page Object — Được chia sẻ cá nhân (2.3.2).
 * Trang liệt kê học liệu NGƯỜI KHÁC chia sẻ CHO MÌNH (khác 2.4.4 — Học liệu
 * cá nhân chia sẻ, là học liệu MÌNH chia sẻ cho người khác).
 *
 * Dựng từ HTML thực tế (trang rỗng, chưa có dữ liệu) của
 * https://olm.vn/hoc-lieu-duoc-chia-se — dropdown "Tạo mới học liệu" giống
 * hệt HocLieuCuaToiPage (cùng data-type, cùng #demoViewCategoryBuilder), nên
 * tái dùng enum CoursewareType từ đó thay vì định nghĩa lại.
 *
 * LƯU Ý:
 * - Chưa có HTML mẫu của <tr> khi bảng CÓ dữ liệu, nên TABLE_ROWS/getRowData()
 *   đang dựa vào thứ tự cột trong <thead> (STT, Tên học liệu, Ngày tạo,
 *   Thể loại, Người tạo, Hành động). Cần đối chiếu lại khi có HTML thật.
 * - Chưa rõ selector menu sidebar để điều hướng tới trang này (HTML gửi chỉ
 *   có phần nội dung chính, không có sidebar) — MENU_HOC_LIEU_DUOC_CHIA_SE
 *   bên dưới là phỏng đoán theo pattern của MENU_HOC_LIEU_CUA_TOI, cần xác
 *   minh lại trên UI thật trước khi dùng.
 */

/**
 * Danh sách loại học liệu trong <select id="type"> của form lọc.
 * KHÁC với CoursewareType (dropdown "Tạo mới học liệu"): select lọc có thêm
 * một số loại không tạo mới được ở đây (VD: Đề thi TN từ file ảnh, Đề tiếng
 * anh, Kỹ năng, Bài giảng scorm, Game hóa) và KHÔNG có option cho Tài liệu(23)
 * xuất hiện trùng giá trị 23 với "Tin học và Công nghệ" ở field môn học khác
 * — hai select độc lập, không liên quan.
 */
export enum FilterCoursewareType {
  LY_THUYET_TUONG_TAC = 2,
  LUYEN_TAP_TRAC_NGHIEM = 3,
  VIDEO_YOUTUBE_DIEM_DUNG = 5,
  DE_THI_TU_LUAN = 6,
  LIEN_KET = 9,
  DE_THI_TN_TU_FILE = 10,
  DE_THI_TN_TU_FILE_ANH = 11,
  HOI_VA_DAP = 12,
  DE_THI_TN_TU_MA_TRAN = 13,
  DE_THI_THONG_MINH = 14,
  DE_TIENG_ANH = 15,
  KY_NANG = 16,
  BAI_GIANG_SCORM = 17,
  DANG_BAI_KY_NANG_NHCH = 18,
  GAME_HOA = 19,
  DE_LUYEN_TAP_TN_TU_MA_TRAN = 20,
  DE_THI_THPT = 21,
  DE_THI_TRON_OFFLINE = 100,
  TAI_LIEU = 23,
}

/** Giá trị <select id="source_cate"> — lọc học liệu tự tạo hay sao chép từ khung */
export enum SourceCate {
  HOC_LIEU_TU_TAO = '1',
  HOC_LIEU_SAO_CHEP_TU_KHUNG = '2',
}

export interface FilterOptions {
  /** Tự tạo/Sao chép khung — bỏ trống = "Tất cả" */
  sourceCate?: SourceCate;
  /** Loại học liệu — bỏ trống = "Chọn Loại học liệu" */
  type?: FilterCoursewareType;
  /** Môn học — truyền đúng label hiển thị trong option, VD: "Toán" */
  subject?: string;
  /** Lớp — truyền đúng label hiển thị trong option, VD: "Lớp 9" */
  grade?: string;
  /** Tên học liệu — khớp input#title */
  title?: string;
  /** Checkbox "Học liệu tự do" */
  freeCateOnly?: boolean;
  /** Checkbox "Học liệu ẩn" */
  hiddenCateOnly?: boolean;
}

export interface SharedCoursewareRow {
  stt: string;
  title: string;
  createdDate: string;
  category: string;
  creator: string;
}

export class HocLieuDuocChiaSeCaNhanPage extends BasePage {
  static readonly URL = '/hoc-lieu-duoc-chia-se';

  // ---- Sidebar navigation (đã xác nhận từ HTML sidebar thật) ----
  static readonly MENU_HOC_LIEU = 'button[data-menu-key="hoc-lieu"]';
  // FIX: id trùng lặp trên trang thật (xem lý giải trong BoSuuTapHocLieuPage.ts
  // - id="menu-bo-suu-tap-hoc-lieu" cũng dính lỗi tương tự, cùng pattern sidebar).
  // Thu hẹp bằng class '.menu-link' để tránh "strict mode violation: resolved to 2 elements".
  static readonly MENU_HOC_LIEU_DUOC_CHIA_SE = '#menu-hoc-lieu-duoc-chia-se.menu-link';

  // ---- Header ----
  static readonly PAGE_TITLE = 'h3:has-text("Học liệu được chia sẻ")';
  static readonly GUIDE_LINK = 'a.olm-text-link:has-text("Hướng dẫn tạo")';

  // ---- Nút mở dropdown tạo mới (giống hệt HocLieuCuaToiPage) ----
  static readonly TAO_MOI_BTN = 'button:has-text("Tạo mới học liệu")';
  static readonly DROPDOWN_MENU = '.dropdown-menu.show';
  static readonly GAME_HOA_ITEM = '#demoViewCategoryBuilder .dropdown-item';
  static readonly MODAL = 'div.modal.show, div[role="dialog"]:visible';

  // ---- Form bộ lọc ----
  static readonly FILTER_FORM = 'form[action="https://olm.vn/hoc-lieu-duoc-chia-se"]';
  static readonly SOURCE_CATE_SELECT = '#source_cate';
  static readonly TYPE_SELECT = '#type';
  static readonly SUBJECT_SELECT = '#id_subject';
  static readonly GRADE_SELECT = '#grade';
  // Scope trong form lọc — tránh strict-mode violation với input#title của
  // modal "Tạo học liệu" (cùng id, chỉ ẩn bằng CSS chứ không unmount khỏi DOM).
  static readonly TITLE_INPUT = `${HocLieuDuocChiaSeCaNhanPage.FILTER_FORM} #title`;
  static readonly FREE_CATE_CHECKBOX = '#free_cate';
  static readonly HIDDEN_CATE_CHECKBOX = '#hidden_cate';
  static readonly FILTER_SUBMIT_BTN = `${HocLieuDuocChiaSeCaNhanPage.FILTER_FORM} button[type="submit"]`;

  // ---- Bảng danh sách ----
  static readonly TABLE = '.card-v2 table.table';
  static readonly TABLE_ROWS = `${HocLieuDuocChiaSeCaNhanPage.TABLE} tbody tr`;
  static readonly EMPTY_STATE_ALERT = '.alert.alert-info:has-text("Chưa có học liệu nào")';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // ---- Điều hướng ----
  // ==================================================================

  async navigateToHocLieuDuocChiaSe(): Promise<this> {
    const isOnPage = this.getCurrentUrl().includes('hoc-lieu-duoc-chia-se');
    if (!isOnPage) {
      // Page mới của fixture bắt đầu ở about:blank — phải đảm bảo sidebar
      // đã render trước, nếu không mọi click bên dưới sẽ luôn timeout dù
      // selector đúng hay sai (đây là nguyên nhân GỐC gây fail cả nhóm
      // test "Được chia sẻ cá nhân", không phải do sai id).
      await this.ensurePageLoaded();

      // Nhóm cha "Học liệu cá nhân" là toggle (aria-expanded="true"/"false").
      // BUG GỐC: click mù vào nút cha mà không kiểm tra trạng thái — nếu
      // sidebar đã sẵn ở trạng thái mở (rất thường gặp), click này ĐÓNG
      // submenu lại, khiến #menu-hoc-lieu-duoc-chia-se biến mất khỏi
      // viewport và click kế tiếp treo tới hết 20s timeout.
      const parentToggle = this.page.locator(HocLieuDuocChiaSeCaNhanPage.MENU_HOC_LIEU);
      await this.scrollSidebarUntilVisible(parentToggle);
      const isExpanded = (await parentToggle.getAttribute('aria-expanded')) === 'true';
      if (!isExpanded) {
        await parentToggle.click();
      }

      const childLink = this.page.locator(HocLieuDuocChiaSeCaNhanPage.MENU_HOC_LIEU_DUOC_CHIA_SE);
      await this.scrollSidebarUntilVisible(childLink);
      await childLink.waitFor({ state: 'visible', timeout: 10_000 });
      await childLink.click();

      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForURL(/hoc-lieu-duoc-chia-se/, { timeout: 10000 }).catch(() => {});

      // FIX (2026-07-28): waitForURL xong không đảm bảo trang đã sẵn sàng
      // thao tác — nếu có popup thông báo RIÊNG của trang này (chưa gặp lúc
      // ensurePageLoaded() còn ở /home nên chưa bị dismissPopups() tắt),
      // PAGE_TITLE bị che và các bước sau sẽ đứng lặng rồi timeout. Dùng
      // waitForWithPopupWatchdog(): cứ mỗi ~2s tiêu đề chưa hiện thì tự
      // kiểm tra & tắt popup rồi thử lại.
      await waitForWithPopupWatchdog(
        this.page,
        async () => {
          if (await hasBlockingPopup(this.page, 300)) return false;
          return this.page
            .locator(HocLieuDuocChiaSeCaNhanPage.PAGE_TITLE)
            .isVisible()
            .catch(() => false);
        },
        { label: 'trang "Học liệu được chia sẻ" hiển thị xong, không còn popup che' }
      ).catch(() => {
        // Giữ hành vi cũ (không throw) — để lỗi lộ ra ở bước thao tác kế
        // tiếp nếu trang thật sự chưa sẵn sàng vì lý do khác popup.
      });
    }
    return this;
  }

  // ==================================================================
  // ---- Dropdown "Tạo mới học liệu" (logic giống HocLieuCuaToiPage) ----
  // ==================================================================

  /** Mở dropdown "Tạo mới học liệu" và trả về locator dropdown đang mở */
  async openCreateDropdown(): Promise<Locator> {
    await this.page.locator(HocLieuDuocChiaSeCaNhanPage.TAO_MOI_BTN).click();
    const dropdown = this.page.locator(HocLieuDuocChiaSeCaNhanPage.DROPDOWN_MENU);
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    return dropdown;
  }

  private dropdownItemSelector(type: CoursewareType): string {
    return `a.select-cate-type[data-type="${type}"]`;
  }

  async selectCoursewareType(type: CoursewareType): Promise<this> {
    const item = this.page.locator(this.dropdownItemSelector(type));
    await item.click();
    return this;
  }

  async selectGameHoa(): Promise<this> {
    await this.page.locator(HocLieuDuocChiaSeCaNhanPage.GAME_HOA_ITEM).click();
    return this;
  }

  /** Mở dropdown rồi chọn loại học liệu tương ứng, chờ modal xuất hiện */
  async openCreateModal(type: CoursewareType | 'game-hoa'): Promise<this> {
    await this.openCreateDropdown();
    if (type === 'game-hoa') {
      await this.selectGameHoa();
    } else {
      await this.selectCoursewareType(type);
    }
    await this.page.locator(HocLieuDuocChiaSeCaNhanPage.MODAL).waitFor({ state: 'visible', timeout: 10000 });
    return this;
  }

  /** Trả về danh sách text các nhãn hiển thị trong dropdown hiện đang mở */
  async getDropdownLabels(): Promise<string[]> {
    const items = this.page.locator(
      `${HocLieuDuocChiaSeCaNhanPage.DROPDOWN_MENU} a.select-cate-type .col-11`
    );
    return items.allInnerTexts();
  }

  // ==================================================================
  // ---- Bộ lọc ----
  // ==================================================================

  /** Điền các trường trong form lọc theo options, KHÔNG submit */
  async fillFilter(options: FilterOptions): Promise<this> {
    if (options.sourceCate) {
      await this.page.locator(HocLieuDuocChiaSeCaNhanPage.SOURCE_CATE_SELECT).selectOption(options.sourceCate);
    }
    if (options.type !== undefined) {
      await this.page
        .locator(HocLieuDuocChiaSeCaNhanPage.TYPE_SELECT)
        .selectOption(String(options.type));
    }
    if (options.subject) {
      await this.page
        .locator(HocLieuDuocChiaSeCaNhanPage.SUBJECT_SELECT)
        .selectOption({ label: options.subject });
    }
    if (options.grade) {
      await this.page
        .locator(HocLieuDuocChiaSeCaNhanPage.GRADE_SELECT)
        .selectOption({ label: options.grade });
    }
    if (options.title) {
      await this.page.locator(HocLieuDuocChiaSeCaNhanPage.TITLE_INPUT).fill(options.title);
    }
    if (options.freeCateOnly) {
      await this.page.locator(HocLieuDuocChiaSeCaNhanPage.FREE_CATE_CHECKBOX).check();
    }
    if (options.hiddenCateOnly) {
      await this.page.locator(HocLieuDuocChiaSeCaNhanPage.HIDDEN_CATE_CHECKBOX).check();
    }
    return this;
  }

  /** Bấm nút "Lọc" và chờ trang tải lại kết quả (form submit GET → reload) */
  async submitFilter(): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.page.locator(HocLieuDuocChiaSeCaNhanPage.FILTER_SUBMIT_BTN).click(),
    ]);
    await this.dismissPopups();
    return this;
  }

  /** Luồng đầy đủ: điền filter → submit */
  async filterList(options: FilterOptions): Promise<this> {
    await this.fillFilter(options);
    await this.submitFilter();
    return this;
  }

  // ==================================================================
  // ---- Bảng danh sách ----
  // ==================================================================

  getTableRows(): Locator {
    return this.page.locator(HocLieuDuocChiaSeCaNhanPage.TABLE_ROWS);
  }

  getRowByTitle(title: string): Locator {
    return this.getTableRows().filter({ hasText: title });
  }

  async isEmptyState(): Promise<boolean> {
    return this.page.locator(HocLieuDuocChiaSeCaNhanPage.EMPTY_STATE_ALERT).isVisible().catch(() => false);
  }

  /**
   * Đọc dữ liệu 1 dòng theo thứ tự cột <thead>: STT, Tên học liệu, Ngày tạo,
   * Thể loại, Người tạo (bỏ qua cột "Hành động").
   * TODO: đối chiếu lại index cột khi có HTML <tr> thật — hiện suy ra từ
   * <thead>, chưa kiểm chứng với dữ liệu thực tế (rowspan/cột ẩn nếu có).
   */
  async getRowData(row: Locator): Promise<SharedCoursewareRow> {
    const cells = row.locator('td');
    return {
      stt: (await cells.nth(0).innerText()).trim(),
      title: (await cells.nth(1).innerText()).trim(),
      createdDate: (await cells.nth(2).innerText()).trim(),
      category: (await cells.nth(3).innerText()).trim(),
      creator: (await cells.nth(4).innerText()).trim(),
    };
  }

  /** Đọc toàn bộ danh sách học liệu đang hiển thị trong bảng */
  async getAllRowsData(): Promise<SharedCoursewareRow[]> {
    const rows = await this.getTableRows().all();
    const result: SharedCoursewareRow[] = [];
    for (const row of rows) {
      result.push(await this.getRowData(row));
    }
    return result;
  }
}