import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL, NHOM_GV_DA_XOA_URL, TO_BO_MON_URL } from '@config/config';

/**
 * Page Object — Nhóm GV đã xoá (1.1.4).
 * URL: {BASE_URL}/truong-hoc/{slug}/to-bo-mon?deleted=1
 *
 * DOM dùng CHUNG component card nhóm với trang "Danh sách nhóm giáo viên"
 * (1.1.1 — NhomGiaoVienPage, Section A): mỗi nhóm vẫn là 1
 * `.card-body:has(a[href*="/nhom/"])`. Khảo sát thực tế cho thấy nút
 * "Khôi phục" (a.restore-group) và "Xóa" (a.delete-group) có thể xuất
 * hiện ĐỒNG THỜI cùng Thiết lập/Tải về/Sửa trên cùng 1 card (không tách
 * biệt tuyệt đối theo trang) — nên page object này chỉ bổ sung thêm các
 * hành động ĐẶC THÙ của danh sách đã xóa (Khôi phục / Xóa vĩnh viễn); các
 * hành động dùng chung khác (Thiết lập, Tải về, Sửa) đã có sẵn ở
 * NhomGiaoVienPage — không lặp lại logic ở đây.
 *
 * Bấm vào tên 1 nhóm (GROUP_CARD_LINK) điều hướng sang trang chi tiết
 * quản lý nhóm ({BASE_URL}/nhom/{slug}.{id}) — TRANG NÀY DÙNG CHUNG với
 * nhóm đang hoạt động và đã được triển khai đầy đủ ở NhomGiaoVienPage
 * (Section B: getMemberRows, switchTab, quickAddMemberInline, các nút
 * Xóa hàng loạt/Thiết lập MK mới/Import/Mời thành viên...). Sau khi mở 1
 * nhóm từ danh sách đã xóa, dùng tiếp 1 instance NhomGiaoVienPage trên
 * CÙNG `page` để thao tác chi tiết, thay vì lặp lại logic đó ở đây:
 *
 *   const daXoaPage = new NhomGiaoVienDaXoaPage(p);
 *   await daXoaPage.open();
 *   await daXoaPage.openGroupByName('Lê Thị Lan');
 *   const detail = new NhomGiaoVienPage(p);           // cùng page, đổi "vai" page object
 *   const members = await detail.getMemberRows();
 */

export interface DeletedGroupCardInfo {
  name: string;
  url: string;
  memberCount: number;
}

export class NhomGiaoVienDaXoaPage extends BasePage {
  static readonly URL = NHOM_GV_DA_XOA_URL;

  // ── Header ──────────────────────────────────────────────────────────
  static readonly PAGE_TITLE = "h5:has-text('Danh sách nhóm giáo viên')";
  /** Link quay lại danh sách nhóm đang hoạt động (không kèm ?deleted=1) */
  static readonly BACK_TO_ACTIVE_LINK = `a[href="${TO_BO_MON_URL}"]`;

  // ── Card nhóm (dùng chung DOM với NhomGiaoVienPage, xem ghi chú đầu file) ─
  static readonly GROUP_CARD = '.card:has(.card-title a[href*="/nhom/"]), .card-body:has(a[href*="/nhom/"])';
  static readonly GROUP_CARD_LINK = '.card-title a[href*="/nhom/"], a.olm-text-link[href*="/nhom/"]';
  static readonly GROUP_CARD_MEMBER_COUNT = '.card-title .fa-user + span, .card-title span.ml-1';
  static readonly GROUP_CARD_BTN_KHOI_PHUC = 'a.restore-group';
  static readonly GROUP_CARD_BTN_XOA = 'a.delete-group';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(NhomGiaoVienDaXoaPage.URL);
    return this;
  }

  isLoaded(): boolean {
    const url = this.getCurrentUrl();
    return url.includes('to-bo-mon') && url.includes('deleted=1');
  }

  async goBackToActiveGroups(): Promise<this> {
    await this.navigateTo(TO_BO_MON_URL);
    return this;
  }

  // ==================================================================
  // Danh sách nhóm đã xóa
  // ==================================================================

  /** Danh sách nhóm giáo viên đã xóa hiển thị trên trang (tên, url, số thành viên) */
  async getDeletedGroupCards(): Promise<DeletedGroupCardInfo[]> {
    const links = await this.page.locator(NhomGiaoVienDaXoaPage.GROUP_CARD_LINK).all();
    const items: DeletedGroupCardInfo[] = [];

    for (const link of links) {
      const name = ((await link.textContent()) ?? '').trim();
      const href = (await link.getAttribute('href')) ?? '';
      if (!name || !href) continue;

      // Số thành viên: span ngay sau icon fa-user, nằm cùng h6.card-title với link
      let memberCount = 0;
      try {
        const card = link.locator('xpath=ancestor::*[contains(@class,"card-body")][1]');
        const countText =
          (await card.locator('.fa-user').locator('xpath=following-sibling::span[1]').textContent()) ?? '0';
        memberCount = parseInt(countText.trim(), 10) || 0;
      } catch {
        memberCount = 0;
      }

      items.push({
        name,
        url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        memberCount,
      });
    }
    return items;
  }

  async getDeletedGroupCount(): Promise<number> {
    return (await this.getDeletedGroupCards()).length;
  }

  /** Tìm 1 nhóm theo tên (khớp 1 phần) trong danh sách đã xóa */
  async findDeletedGroupByName(namePart: string): Promise<DeletedGroupCardInfo | null> {
    const cards = await this.getDeletedGroupCards();
    return cards.find((c) => c.name.includes(namePart)) ?? null;
  }

  private _cardByName(name: string) {
    return this.page.locator(NhomGiaoVienDaXoaPage.GROUP_CARD).filter({ hasText: name }).first();
  }

  /** Bấm "Khôi phục" — phục hồi 1 nhóm giáo viên đã xóa về danh sách hoạt động */
  async restoreGroup(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienDaXoaPage.GROUP_CARD_BTN_KHOI_PHUC).first();
    await this.jsClick(btn);
    return this;
  }

  /** Bấm "Xóa" — xóa vĩnh viễn 1 nhóm (thường kèm modal xác nhận, ngoài phạm vi page object này) */
  async deleteGroupPermanently(name: string): Promise<this> {
    const btn = this._cardByName(name).locator(NhomGiaoVienDaXoaPage.GROUP_CARD_BTN_XOA).first();
    await this.jsClick(btn);
    return this;
  }

  // ==================================================================
  // Mở trang chi tiết 1 nhóm (DOM dùng chung — xem NhomGiaoVienPage Section B)
  // ==================================================================

  /**
   * Bấm vào tên 1 nhóm để mở trang chi tiết quản lý nhóm. Trang đích dùng
   * chung DOM với nhóm đang hoạt động — dùng tiếp `new NhomGiaoVienPage(this.page)`
   * để thao tác chi tiết (getMemberRows, switchTab, các nút thao tác
   * hàng loạt...), KHÔNG lặp lại logic đó ở page object này.
   */
  async openGroupByName(name: string): Promise<this> {
    const link = this.page.locator(NhomGiaoVienDaXoaPage.GROUP_CARD_LINK).filter({ hasText: name }).first();
    await link.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }
}