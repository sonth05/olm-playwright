import { BasePage } from '@core/shared-pages/BasePage';
import { TUY_CHON_THU_MUC_MAC_DINH_URL } from '@config/config';
import { CayThuMucSidebarItem } from './CayThuMucPage';
import { DuyetHoSoFolderType } from './DuyetHoSoKeHoachPage';

/**
 * Page Object — Tùy chọn thư mục mặc định (4.1.7).
 * URL: {BASE_URL}/school-folder-{SCHOOL_ID}/folder-merge-default#menu-folder-merge-default
 *
 * Cùng SIDEBAR với CayThuMucPage (4.1.6) — dùng chung enum
 * CayThuMucSidebarItem, KHÔNG định nghĩa lại ở đây (mục "Tùy chọn thư mục
 * mặc định" chính là trang này).
 *
 * Nội dung chính: danh sách checkbox (#merge-folder-list) bật/tắt 19 danh
 * mục hồ sơ mặc định của trường — value/thứ tự các checkbox TRÙNG với
 * enum DuyetHoSoFolderType (sidebar #folder-plan-type ở DuyetHoSoKeHoachPage
 * 4.1.2), nên tái dùng luôn enum đó thay vì định nghĩa lại danh sách 19 mục.
 * Mặc định TẤT CẢ đều đã checked.f
 *
 * Ngoài ra có:
 *  - Link "thư mục gốc" → điều hướng sang CayThuMucPage (4.1.6) để
 *    thêm/đổi tên/phân quyền thư mục.
 *  - Link "Vào đây" (#reset-to-default) — khôi phục về mặc định ban đầu.
 *  - Nút "Lưu" (.save-merge).
 */
export class TuyChonThuMucMacDinhPage extends BasePage {
  static readonly URL = TUY_CHON_THU_MUC_MAC_DINH_URL;

  // ── Sidebar (dùng chung với CayThuMucPage — xem CayThuMucSidebarItem) ────
  static readonly SIDEBAR_ITEM_BY_TITLE = (title: CayThuMucSidebarItem | string): string =>
    `.list-group.list-group-flush li.list-group-item a[title="${title}"]`;
  static readonly ACTIVE_SIDEBAR_ITEM = '.list-group.list-group-flush li.list-group-item.active';

  // ── Nội dung ──────────────────────────────────────────────────────────────
  static readonly PAGE_HEADING = 'h3:has-text("Tùy chọn thư mục mặc định")';
  static readonly ROOT_FOLDER_LINK = 'a:has-text("thư mục gốc")';
  static readonly RESET_TO_DEFAULT_LINK = '#reset-to-default';

  static readonly FOLDER_CHECKBOX_LIST = '#merge-folder-list';
  static readonly FOLDER_CHECKBOX_BY_VALUE = (value: DuyetHoSoFolderType | string): string =>
    `#merge-folder-list input.default-folder[value="${value}"]`;
  static readonly ALL_FOLDER_CHECKBOXES = '#merge-folder-list input.default-folder';

  static readonly SAVE_BUTTON = 'button.save-merge';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(TuyChonThuMucMacDinhPage.URL);
    await this.waitForSelector(TuyChonThuMucMacDinhPage.FOLDER_CHECKBOX_LIST, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('folder-merge-default');
  }

  // ==================================================================
  // Sidebar
  // ==================================================================

  async switchSidebarView(item: CayThuMucSidebarItem | string): Promise<this> {
    const link = this.page.locator(TuyChonThuMucMacDinhPage.SIDEBAR_ITEM_BY_TITLE(item)).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getActiveSidebarItem(): Promise<string> {
    const el = this.page.locator(TuyChonThuMucMacDinhPage.ACTIVE_SIDEBAR_ITEM).first();
    return ((await el.textContent()) ?? '').trim();
  }

  // ==================================================================
  // Danh sách checkbox thư mục mặc định
  // ==================================================================

  async isFolderChecked(value: DuyetHoSoFolderType | string): Promise<boolean> {
    return this.page.locator(TuyChonThuMucMacDinhPage.FOLDER_CHECKBOX_BY_VALUE(value)).isChecked();
  }

  /** Bật/tắt 1 checkbox thư mục theo value (dùng enum DuyetHoSoFolderType) */
  async toggleFolder(value: DuyetHoSoFolderType | string): Promise<this> {
    const checkbox = this.page.locator(TuyChonThuMucMacDinhPage.FOLDER_CHECKBOX_BY_VALUE(value));
    await checkbox.click({ force: true });
    return this;
  }

  async checkFolder(value: DuyetHoSoFolderType | string): Promise<this> {
    const checkbox = this.page.locator(TuyChonThuMucMacDinhPage.FOLDER_CHECKBOX_BY_VALUE(value));
    if (!(await checkbox.isChecked())) {
      await checkbox.click({ force: true });
    }
    return this;
  }

  async uncheckFolder(value: DuyetHoSoFolderType | string): Promise<this> {
    const checkbox = this.page.locator(TuyChonThuMucMacDinhPage.FOLDER_CHECKBOX_BY_VALUE(value));
    if (await checkbox.isChecked()) {
      await checkbox.click({ force: true });
    }
    return this;
  }

  /** Danh sách data-title (tên hiển thị) của TẤT CẢ checkbox, theo đúng thứ tự DOM */
  async getAllFolderTitles(): Promise<string[]> {
    const checkboxes = await this.page.locator(TuyChonThuMucMacDinhPage.ALL_FOLDER_CHECKBOXES).all();
    const titles: string[] = [];
    for (const cb of checkboxes) {
      titles.push((await cb.getAttribute('data-title')) ?? '');
    }
    return titles;
  }

  /** Danh sách data-title của các checkbox ĐANG được tích */
  async getCheckedFolderTitles(): Promise<string[]> {
    const checkboxes = await this.page.locator(TuyChonThuMucMacDinhPage.ALL_FOLDER_CHECKBOXES).all();
    const titles: string[] = [];
    for (const cb of checkboxes) {
      if (await cb.isChecked()) {
        titles.push((await cb.getAttribute('data-title')) ?? '');
      }
    }
    return titles;
  }

  async getFolderCheckboxCount(): Promise<number> {
    return this.page.locator(TuyChonThuMucMacDinhPage.ALL_FOLDER_CHECKBOXES).count();
  }

  // ==================================================================
  // Actions
  // ==================================================================

  async getRootFolderLink(): Promise<string | null> {
    return this.page.locator(TuyChonThuMucMacDinhPage.ROOT_FOLDER_LINK).getAttribute('href');
  }

  async goToRootFolder(): Promise<this> {
    await this.jsClick(this.page.locator(TuyChonThuMucMacDinhPage.ROOT_FOLDER_LINK));
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Khôi phục về danh sách thư mục mặc định ban đầu (link "Vào đây") */
  async resetToDefault(): Promise<this> {
    await this.page.locator(TuyChonThuMucMacDinhPage.RESET_TO_DEFAULT_LINK).click();
    return this;
  }

  async save(): Promise<this> {
    await this.page.locator(TuyChonThuMucMacDinhPage.SAVE_BUTTON).click();
    return this;
  }
}