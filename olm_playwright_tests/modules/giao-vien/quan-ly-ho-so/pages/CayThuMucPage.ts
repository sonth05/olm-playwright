import { BasePage } from '@core/shared-pages/BasePage';
import { CAY_THU_MUC_URL } from '@config/config';

/**
 * Page Object — Cây thư mục (tùy chỉnh) (4.1.6).
 * URL: {BASE_URL}/school-folder-{SCHOOL_ID}#menu-school-folder
 * Drive thư mục tùy chỉnh cấp trường (khác 4.1.5 — cây thư mục cố định
 * theo từng giáo viên do trường quản lý).
 *
 * Trang gồm 2 phần:
 *  A) Sidebar trái (list-group tĩnh, KHÔNG phải #folder-plan-type như
 *     4.1.1/4.1.2) — điều hướng qua các "khu vực" của Drive:
 *     Thư mục gốc / Duyệt hồ sơ, kế hoạch / Tùy chọn thư mục mặc định /
 *     Được chia sẻ với tôi / Gần đây / Thùng rác. Mỗi mục là 1 <a> với
 *     `title` = tên hiển thị và `href` cố định (KHÔNG phải SPA — chuyển
 *     trang thật).
 *  B) Nội dung bên phải:
 *     - Breadcrumb (nav) hiển thị đường dẫn thư mục hiện tại (bắt đầu từ
 *       "Thư mục gốc"), kèm icon chia sẻ thư mục hiện tại (a.share-folder)
 *       và select Năm học (#breadcrumb_select_school_year).
 *     - Toolbar: nút "Thêm mới thư mục" (#new-lesson-folder) + link
 *       "Hướng dẫn" (mở video Youtube, target="_blank").
 *     - State rỗng: 'Các thư mục vẫn chưa có. Hãy click vào "Thêm mới" để
 *       bắt đầu!' (CHƯA khảo sát HTML khi đã có thư mục con thật).
 */

/** Tên hiển thị (title) của từng mục trong sidebar Drive */
export enum CayThuMucSidebarItem {
  THU_MUC_GOC = 'Thư mục gốc',
  DUYET_HO_SO_KE_HOACH = 'Duyệt hồ sơ, kế hoạch',
  TUY_CHON_THU_MUC_MAC_DINH = 'Tùy chọn thư mục mặc định',
  DUOC_CHIA_SE_VOI_TOI = 'Được chia sẻ với tôi',
  GAN_DAY = 'Gần đây',
  THUNG_RAC = 'Thùng rác',
}

export class CayThuMucPage extends BasePage {
  static readonly URL = CAY_THU_MUC_URL;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  static readonly SIDEBAR_LIST = '.list-group.list-group-flush';
  static readonly SIDEBAR_ITEM = '.list-group.list-group-flush li.list-group-item';
  static readonly SIDEBAR_ITEM_BY_TITLE = (title: CayThuMucSidebarItem | string): string =>
    `.list-group.list-group-flush li.list-group-item a[title="${title}"]`;
  static readonly ACTIVE_SIDEBAR_ITEM = '.list-group.list-group-flush li.list-group-item.active';

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  static readonly BREADCRUMB = 'nav[aria-label="breadcrumb"] .breadcrumb';
  static readonly BREADCRUMB_ITEM = 'nav[aria-label="breadcrumb"] .breadcrumb-item';
  static readonly SHARE_FOLDER_BUTTON = 'a.share-folder';
  static readonly SCHOOL_YEAR_SELECT = '#breadcrumb_select_school_year';

  // ── Toolbar ───────────────────────────────────────────────────────────────
  static readonly NEW_FOLDER_BUTTON = '#new-lesson-folder';
  static readonly GUIDE_LINK = 'a:has-text("Hướng dẫn")';

  static readonly EMPTY_STATE_MESSAGE = 'p:has-text("Các thư mục vẫn chưa có")';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(CayThuMucPage.URL);
    await this.waitForSelector(CayThuMucPage.SIDEBAR_LIST, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('school-folder-');
  }

  // ==================================================================
  // Sidebar
  // ==================================================================

  /** Chuyển sang 1 khu vực khác của Drive (VD: CayThuMucSidebarItem.THUNG_RAC) */
  async switchSidebarView(item: CayThuMucSidebarItem | string): Promise<this> {
    const link = this.page.locator(CayThuMucPage.SIDEBAR_ITEM_BY_TITLE(item)).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Tên mục sidebar đang active (mặc định "Thư mục gốc" khi mới vào trang) */
  async getActiveSidebarItem(): Promise<string> {
    const el = this.page.locator(CayThuMucPage.ACTIVE_SIDEBAR_ITEM).first();
    return ((await el.textContent()) ?? '').trim();
  }

  // ==================================================================
  // Breadcrumb
  // ==================================================================

  /** Đường dẫn thư mục hiện tại, theo đúng thứ tự hiển thị (VD: ["Thư mục gốc", "Kế hoạch 2026"]) */
  async getBreadcrumbPath(): Promise<string[]> {
    const items = await this.page.locator(CayThuMucPage.BREADCRUMB_ITEM).all();
    const path: string[] = [];
    for (const item of items) {
      path.push(((await item.textContent()) ?? '').trim());
    }
    return path;
  }

  async clickShareCurrentFolder(): Promise<this> {
    await this.page.locator(CayThuMucPage.SHARE_FOLDER_BUTTON).first().click();
    return this;
  }

  /** VD: selectSchoolYear('2025') → chọn "2025 - 2026" */
  async selectSchoolYear(year: string): Promise<this> {
    await this.page.locator(CayThuMucPage.SCHOOL_YEAR_SELECT).selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    return this.page.locator(CayThuMucPage.SCHOOL_YEAR_SELECT).inputValue();
  }

  // ==================================================================
  // Toolbar
  // ==================================================================

  /**
   * Bấm "Thêm mới thư mục". Modal/form tạo thư mục NGOÀI phạm vi HTML đã
   * khảo sát — method chỉ dừng ở bước click mở.
   */
  async clickNewFolder(): Promise<this> {
    await this.page.locator(CayThuMucPage.NEW_FOLDER_BUTTON).click();
    return this;
  }

  /** Href video hướng dẫn (Youtube, mở tab mới) */
  async getGuideLink(): Promise<string | null> {
    return this.page.locator(CayThuMucPage.GUIDE_LINK).getAttribute('href');
  }

  // ==================================================================
  // Nội dung / trạng thái rỗng
  // ==================================================================

  /**
   * True khi thư mục hiện tại (theo breadcrumb) chưa có thư mục con nào
   * (state rỗng — CHƯA khảo sát HTML danh sách thư mục con khi có dữ liệu thật).
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.isElementVisible(CayThuMucPage.EMPTY_STATE_MESSAGE, 5_000);
  }
}