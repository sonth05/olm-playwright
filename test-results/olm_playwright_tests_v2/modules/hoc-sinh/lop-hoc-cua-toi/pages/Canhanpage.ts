import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL } from '@config/config';

/**
 * Page Object — "Cá nhân" (view HỌC SINH, giao diện V2 — debug.olm.vn).
 *
 * URL dạng `/thanhvien/<id>` — id là memberId của chính học sinh đang đăng
 * nhập (lấy từ link sidebar "Cá nhân", VD: /thanhvien/16647085625411).
 *
 * Cấu trúc trang (theo DOM thực tế đã soát — bản desktop, ẩn/hiện khác
 * với mobile qua cặp class `lg:tw-hidden` / `tw-hidden lg:tw-flex`,
 * page object dưới đây ưu tiên selector desktop):
 *   - Header: ảnh bìa (wallpaper) + avatar + tên + bio + nút "Cập nhật tài khoản"
 *   - 3 card ngang: "Bạn bè" / "Học bạ" / "Giới thiệu" (link giới thiệu +
 *     nút copy)
 *   - Card "Thành tích": Số bài làm / Điểm trung bình / Thành tích (sao) /
 *     Điểm hỏi đáp (SP · GP)
 *   - Card "Bộ sưu tập huy hiệu": danh sách huy hiệu (ảnh grayscale khi
 *     chưa đạt được, kèm số đếm ở góc dưới mỗi huy hiệu)
 *
 * LƯU Ý:
 *   - Trang có 2 layout riêng biệt cho desktop/mobile trong cùng 1 DOM
 *     (không phải responsive css thuần ẩn/hiện phần tử — 2 khối HTML
 *     header khác nhau hoàn toàn). Test chạy viewport desktop nên page
 *     object này chỉ target khối `tw-hidden lg:tw-flex` (desktop).
 *   - "Học bạ" hiện chỉ có icon minh họa, chưa thấy số liệu cụ thể trong
 *     DOM mẫu — cần thêm DOM khi trang có dữ liệu học bạ thật.
 *   - Số đếm dưới mỗi huy hiệu ("0") có 2 lớp `<span>` chồng nhau (hiệu ứng
 *     viền chữ) — cùng 1 giá trị lặp lại 2 lần, page object chỉ lấy lớp
 *     `.tw-relative` (lớp hiển thị thật, không phải lớp viền).
 */

export const buildThanhVienUrl = (memberId: string): string => `${BASE_URL}/thanhvien/${memberId}`;

export class CaNhanPage extends BasePage {
  // ── Sidebar icon-nav ─────────────────────────────────────────────────────
  readonly SIDEBAR_CA_NHAN_LINK = 'a[href^="/thanhvien/"]';

  // ── Header (desktop) ─────────────────────────────────────────────────────
  readonly HEADER_DESKTOP = '.lg\\:tw-flex.tw-flex-col.tw-items-center.tw-p-3';
  readonly AVATAR_IMG = 'img[data-slot="avatar-image"]';
  readonly DISPLAY_NAME = 'h1.tw-text-32, h1.tw-text-24';
  readonly BIO_TEXT = 'span.tw-text-14.tw-text-content-secondary';
  readonly UPDATE_ACCOUNT_BTN = 'button:has-text("Cập nhật tài khoản")';
  readonly EDIT_AVATAR_BTN = 'button:has(span[style*="edit.svg"])';

  // ── 3 card: Bạn bè / Học bạ / Giới thiệu ────────────────────────────────
  readonly FRIENDS_CARD = 'div:has(> div > h1:has-text("Bạn bè"))';
  readonly FRIENDS_EMPTY_TEXT = 'div:has(> div > h1:has-text("Bạn bè")) span:has-text("Chưa có bạn bè")';
  readonly HOC_BA_CARD = 'div:has(> div > h1:has-text("Học bạ"))';
  readonly INTRO_CARD = 'div:has(> div > h1:has-text("Giới thiệu"))';
  readonly INTRO_LINK_TEXT = 'div:has(> div > h1:has-text("Giới thiệu")) span.tw-break-all';
  readonly INTRO_COPY_BTN = 'button[aria-label="Sao chép liên kết"]';

  // ── Card "Thành tích" ────────────────────────────────────────────────────
  readonly THANH_TICH_CARD = '.tw-olm-card-auth-overview:has-text("Thành tích")';
  readonly SO_BAI_LAM_VALUE = 'span:has-text("Số bài làm") ~ div span, div:has(> span:has-text("Số bài làm")) span.tw-font-bold';
  readonly DIEM_TB_VALUE = 'div:has(> span:has-text("Điểm trung bình")) span.tw-font-bold';
  readonly THANH_TICH_SAO_VALUE = 'div:has(> span:has-text("Thành tích")) span.tw-font-bold';
  readonly DIEM_HOI_DAP_SP_VALUE = 'span:has-text("Điểm hỏi đáp") ~ div span:has-text("SP")';

  // ── Card "Bộ sưu tập huy hiệu" ───────────────────────────────────────────
  readonly BADGE_COLLECTION_CARD = '.tw-olm-card-auth-overview:has-text("Bộ sưu tập huy hiệu")';
  readonly BADGE_ITEM = '.tw-olm-card-auth-overview:has-text("Bộ sưu tập huy hiệu") img[alt]';
  readonly badgeCountByIndex = (index: number) =>
    `.tw-olm-card-auth-overview:has-text("Bộ sưu tập huy hiệu") .tw-relative.tw-select-none >> nth=${index} >> span.tw-relative`;

  // ── Navigation ────────────────────────────────────────────────────────────

  async open(memberId: string): Promise<void> {
    await this.navigateTo(buildThanhVienUrl(memberId));
    await this.waitForSelector(this.DISPLAY_NAME);
  }

  // ── Header ────────────────────────────────────────────────────────────────

  async getDisplayName(): Promise<string> {
    const el = await this.findVisible(this.DISPLAY_NAME);
    return ((await el?.textContent()) ?? '').trim();
  }

  async getBioText(): Promise<string> {
    const el = await this.findVisible(this.BIO_TEXT);
    return ((await el?.textContent()) ?? '').trim();
  }

  async clickUpdateAccount(): Promise<void> {
    await this.jsClick(this.page.locator(this.UPDATE_ACCOUNT_BTN).first());
  }

  // ── 3 card ngang ─────────────────────────────────────────────────────────

  async isFriendsListEmpty(): Promise<boolean> {
    return this.page.locator(this.FRIENDS_EMPTY_TEXT).isVisible().catch(() => false);
  }

  async getIntroLink(): Promise<string> {
    const el = await this.findVisible(this.INTRO_LINK_TEXT);
    return ((await el?.textContent()) ?? '').trim();
  }

  async copyIntroLink(): Promise<void> {
    await this.jsClick(this.page.locator(this.INTRO_COPY_BTN));
  }

  // ── Card "Thành tích" ────────────────────────────────────────────────────

  async getSoBaiLam(): Promise<string> {
    const el = await this.findVisible(
      'div:has(> span:has-text("Số bài làm")) span.tw-font-bold'
    );
    return ((await el?.textContent()) ?? '').trim();
  }

  async getDiemTrungBinh(): Promise<string> {
    const el = await this.findVisible(this.DIEM_TB_VALUE);
    return ((await el?.textContent()) ?? '').trim();
  }

  async getThanhTichSao(): Promise<string> {
    const el = await this.findVisible(this.THANH_TICH_SAO_VALUE);
    return ((await el?.textContent()) ?? '').trim();
  }

  /** Trả về { sp, gp } của "Điểm hỏi đáp" */
  async getDiemHoiDap(): Promise<{ sp: string; gp: string }> {
    const container = this.page.locator(
      'div:has(> span:has-text("Điểm hỏi đáp"))'
    ).first();
    const values = container.locator('span.tw-font-bold');
    const count = await values.count();
    const sp = count > 0 ? ((await values.nth(0).textContent()) ?? '').trim() : '';
    const gp = count > 1 ? ((await values.nth(1).textContent()) ?? '').trim() : '';
    return { sp, gp };
  }

  // ── Bộ sưu tập huy hiệu ──────────────────────────────────────────────────

  async getBadgeCount(): Promise<number> {
    return this.page.locator(this.BADGE_ITEM).count();
  }

  /** Lấy danh sách alt (số thứ tự huy hiệu, VD: "1".."7") theo đúng thứ tự hiển thị */
  async getBadgeAlts(): Promise<string[]> {
    const items = await this.findElements(this.BADGE_ITEM);
    const alts: string[] = [];
    for (const item of items) {
      alts.push((await item.getAttribute('alt')) ?? '');
    }
    return alts;
  }

  /** Kiểm tra huy hiệu tại vị trí index đã đạt được hay chưa (grayscale = chưa đạt) */
  async isBadgeUnlocked(index: number): Promise<boolean> {
    const img = this.page.locator(this.BADGE_ITEM).nth(index);
    const cls = (await img.getAttribute('class')) ?? '';
    return !cls.includes('tw-grayscale');
  }

  async getBadgeCountLabel(index: number): Promise<string> {
    const el = await this.findVisible(this.badgeCountByIndex(index));
    return ((await el?.textContent()) ?? '').trim();
  }
}