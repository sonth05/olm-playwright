// modules/giao-vien/hoc-lieu-v1/pages/BoSuuTapHocLieuPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';
import { waitForWithPopupWatchdog, hasBlockingPopup } from '@core/shared-pages/dismissPopups';

/**
 * Page Object — Bộ sưu tập học liệu (2.3.3).
 * Danh sách "Bộ sưu tập của tôi", tạo bộ sưu tập mới, sửa/xóa bộ sưu tập.
 *
 * Dựng từ HTML thực tế có 1 dòng dữ liệu mẫu (collection-item).
 *
 * LƯU Ý — CHƯA CÓ, cần bổ sung khi có thêm HTML/yêu cầu cụ thể:
 * - URL chính xác của trang danh sách (đường dẫn chi tiết 1 bộ sưu tập là
 *   `/bo-suu-tap/<slug>-<id>`, nhưng chưa rõ URL của trang LIST này — tạm
 *   đặt `/bo-suu-tap-hoc-lieu` theo tên file, CẦN xác minh lại trên UI thật).
 * - HTML của modal "Tạo bộ sưu tập" khi bấm nút `btn-add-collection` (chưa
 *   có input tên, nút submit... nên `openCreateCollectionModal()` bên dưới
 *   chỉ dừng ở bước click mở, chưa có `createCollection(name)` đầy đủ).
 * - Xác nhận xóa: chưa rõ `btn-delete-collection` mở modal xác nhận (giống
 *   pattern `.modal.show` các nơi khác) hay dùng `window.confirm()` gốc của
 *   trình duyệt — `deleteCollection()` bên dưới tạm xử lý cả 2 khả năng,
 *   CẦN xác minh lại.
 * - HTML khi danh sách rỗng (chưa có bộ sưu tập nào) — chưa có mẫu để biết
 *   text/selector chính xác của empty-state.
 */

export interface CollectionRow {
  id: string;
  name: string;
  detailUrl: string;
  createdDate: string;
  itemCount: number;
}

export class BoSuuTapHocLieuPage extends BasePage {
  // ---- Sidebar navigation (đã xác nhận từ HTML sidebar thật) ----
  // Href thật đi qua redirector `/olm-url?key=bo-suu-tap-hoc-lieu` nên KHÔNG
  // dùng URL tĩnh để goto/waitForURL — điều hướng qua sidebar rồi chờ
  // PAGE_TITLE render là cách đáng tin cậy duy nhất.
  static readonly MENU_HOC_LIEU = 'button[data-menu-key="hoc-lieu"]';
  // FIX: id="menu-bo-suu-tap-hoc-lieu" bị lặp lại trên trang thật ở 2 phần tử
  // (1 <a class="menu-link" data-menu-index="2.3.3"> trong sidebar thật,
  //  1 <a class="nav-link"> ở widget khác dùng lại cùng id) → bare #id gây
  // "strict mode violation: resolved to 2 elements". Thu hẹp bằng class
  // '.menu-link' để chỉ khớp đúng link sidebar thật.
  static readonly MENU_BO_SUU_TAP = '#menu-bo-suu-tap-hoc-lieu.menu-link';

  // ---- Header ----
  static readonly PAGE_TITLE = 'h3:has-text("Bộ sưu tập của tôi")';
  static readonly GUIDE_LINK = 'a.olm-text-link:has-text("Hướng dẫn tạo đề ma trận")';
  static readonly TAO_BO_SUU_TAP_BTN = 'button.btn-add-collection';

  // ---- Bảng danh sách ----
  static readonly TABLE = '.card-v2 table.table';
  static readonly TABLE_ROWS = 'tr.collection-item';
  static readonly ROW_BY_ID = (id: string) => `tr.collection-item[data-id="${id}"]`;

  // ---- Cột trong 1 dòng ----
  static readonly ROW_NAME_LINK = 'td[data-label="Tên bộ sưu tập"] a.olm-text-link';
  static readonly ROW_NAME_TEXT = 'td[data-label="Tên bộ sưu tập"] h6';
  static readonly ROW_CREATED_DATE = 'td[data-label="Ngày tạo"] span';
  static readonly ROW_ITEM_COUNT = 'td[data-label="Số lượng"] span';
  static readonly ROW_EDIT_BTN = 'button.btn-edit-collection';
  static readonly ROW_DELETE_BTN = 'button.btn-delete-collection';

  // ---- Modal xác nhận xóa (phỏng đoán theo pattern chung của dự án) ----
  static readonly CONFIRM_DIALOG = 'div.modal.show, div[role="dialog"]:visible';
  static readonly CONFIRM_DELETE_BTN =
    'div.modal.show button:has-text("Xóa"), div[role="dialog"] button:has-text("Xóa"), div.modal.show button:has-text("Đồng ý")';
  static readonly CONFIRM_CANCEL_BTN =
    'div.modal.show button:has-text("Hủy"), div[role="dialog"] button:has-text("Hủy")';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // ---- Điều hướng ----
  // ==================================================================

  async navigateToBoSuuTap(): Promise<this> {
    const isOnPage = this.getCurrentUrl().includes('bo-suu-tap');
    if (!isOnPage) {
      // Page mới của fixture bắt đầu ở about:blank (chưa load trang nào,
      // chỉ có cookie đăng nhập) — phải đảm bảo sidebar đã render trước
      // khi thao tác, nếu không mọi click bên dưới sẽ luôn timeout.
      await this.ensurePageLoaded();

      // Nhóm cha "Học liệu cá nhân" là toggle (aria-expanded) — chỉ bấm mở
      // nếu đang đóng, tránh bấm nhầm làm nó ĐÓNG lại (bug gốc gây timeout
      // ở HocLieuDuocChiaSeCaNhanPage.navigateToHocLieuDuocChiaSe()).
      const parentToggle = this.page.locator(BoSuuTapHocLieuPage.MENU_HOC_LIEU);
      // Menu "Học liệu" có thể nằm dưới các nhóm khác trong sidebar dài —
      // cuộn trong sidebar để đưa nó vào vùng nhìn thấy trước khi thao tác.
      await this.scrollSidebarUntilVisible(parentToggle);
      const isExpanded = (await parentToggle.getAttribute('aria-expanded')) === 'true';
      if (!isExpanded) {
        await parentToggle.click();
      }

      const childLink = this.page.locator(BoSuuTapHocLieuPage.MENU_BO_SUU_TAP);
      await this.scrollSidebarUntilVisible(childLink);
      await childLink.waitFor({ state: 'visible', timeout: 10_000 });
      await childLink.click();

      await this.page.waitForLoadState('domcontentloaded');
      // KHÔNG waitForURL theo path đoán — href thật đi qua redirector
      // `/olm-url?key=...` nên URL cuối chưa chắc chứa "bo-suu-tap". Chờ
      // đúng nội dung trang (PAGE_TITLE) là gate đáng tin cậy hơn.
      //
      // FIX (2026-07-28): trước đây chỉ waitFor({timeout: 15_000}).catch(()
      // => {}) — nếu trang này có popup thông báo RIÊNG (không xuất hiện ở
      // /home nên dismissPopups() lúc ensurePageLoaded() không tắt được),
      // PAGE_TITLE bị che, hết 15s thì catch() nuốt lỗi và coi như "đã
      // xong", khiến các bước sau âm thầm fail trên 1 trang thực chất chưa
      // sẵn sàng. Đổi sang waitForWithPopupWatchdog(): cứ mỗi ~2s tiêu đề
      // chưa hiện thì tự kiểm tra & tắt popup rồi thử lại.
      await waitForWithPopupWatchdog(
        this.page,
        async () => {
          if (await hasBlockingPopup(this.page, 300)) return false;
          return this.page
            .locator(BoSuuTapHocLieuPage.PAGE_TITLE)
            .isVisible()
            .catch(() => false);
        },
        { label: 'trang "Bộ sưu tập của tôi" hiển thị xong, không còn popup che' }
      ).catch(() => {
        // Giữ hành vi cũ: không throw nếu vẫn không đạt được sau khi đã
        // thử tắt popup — để caller tự phát hiện lỗi ở bước thao tác kế
        // tiếp (giống catch() cũ), tránh đổi luồng lỗi ở quá nhiều nơi.
      });
    }
    return this;
  }

  // ==================================================================
  // ---- Tạo bộ sưu tập ----
  // ==================================================================

  /**
   * Bấm nút "Tạo bộ sưu tập". Chưa có HTML của modal nên chỉ dừng ở bước
   * mở — bổ sung điền tên + submit khi có selector thật của modal.
   */
  async openCreateCollectionModal(): Promise<this> {
    await this.page.locator(BoSuuTapHocLieuPage.TAO_BO_SUU_TAP_BTN).click();
    return this;
  }

  // ==================================================================
  // ---- Bảng danh sách ----
  // ==================================================================

  getCollectionRows(): Locator {
    return this.page.locator(BoSuuTapHocLieuPage.TABLE_ROWS);
  }

  getRowById(id: string): Locator {
    return this.page.locator(BoSuuTapHocLieuPage.ROW_BY_ID(id));
  }

  getRowByName(name: string): Locator {
    return this.getCollectionRows().filter({
      has: this.page.locator(BoSuuTapHocLieuPage.ROW_NAME_TEXT, { hasText: name }),
    });
  }

  /** Đọc dữ liệu 1 dòng: id, tên, url chi tiết, ngày tạo, số lượng học liệu */
  async getRowData(row: Locator): Promise<CollectionRow> {
    const id = (await row.getAttribute('data-id')) ?? '';
    const nameLink = row.locator(BoSuuTapHocLieuPage.ROW_NAME_LINK);
    const name = (await row.locator(BoSuuTapHocLieuPage.ROW_NAME_TEXT).innerText()).trim();
    const detailUrl = (await nameLink.getAttribute('href')) ?? '';
    const createdDate = (await row.locator(BoSuuTapHocLieuPage.ROW_CREATED_DATE).innerText()).trim();
    const countText = (await row.locator(BoSuuTapHocLieuPage.ROW_ITEM_COUNT).innerText()).trim();

    return {
      id,
      name,
      detailUrl,
      createdDate,
      itemCount: Number(countText) || 0,
    };
  }

  /** Đọc toàn bộ danh sách bộ sưu tập đang hiển thị */
  async getAllCollectionsData(): Promise<CollectionRow[]> {
    const rows = await this.getCollectionRows().all();
    const result: CollectionRow[] = [];
    for (const row of rows) {
      result.push(await this.getRowData(row));
    }
    return result;
  }

  /** Mở trang chi tiết bộ sưu tập bằng cách click vào tên */
  async openCollectionDetail(row: Locator): Promise<this> {
    await row.locator(BoSuuTapHocLieuPage.ROW_NAME_LINK).click();
    await this.page.waitForLoadState('domcontentloaded');
    return this;
  }

  // ==================================================================
  // ---- Sửa / Xóa ----
  // ==================================================================

  /** Bấm nút sửa (icon bút chì) trên 1 dòng */
  async clickEditCollection(row: Locator): Promise<this> {
    await row.locator(BoSuuTapHocLieuPage.ROW_EDIT_BTN).click();
    return this;
  }

  /**
   * Bấm nút xóa (icon dấu X) trên 1 dòng rồi xác nhận.
   * TODO: xác minh xem có modal xác nhận thật hay dùng window.confirm() —
   * nếu là confirm() gốc trình duyệt, cần đăng ký `page.on('dialog', ...)`
   * TRƯỚC khi gọi hàm này (Playwright tự động dismiss dialog nếu không có
   * listener, nên đoạn xử lý modal bên dưới có thể không bao giờ chạy tới).
   */
  async deleteCollection(row: Locator): Promise<this> {
    await row.locator(BoSuuTapHocLieuPage.ROW_DELETE_BTN).click();

    const confirmDialog = this.page.locator(BoSuuTapHocLieuPage.CONFIRM_DIALOG);
    const hasConfirmDialog = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasConfirmDialog) {
      await this.page.locator(BoSuuTapHocLieuPage.CONFIRM_DELETE_BTN).click();
      await confirmDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }

    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }
}