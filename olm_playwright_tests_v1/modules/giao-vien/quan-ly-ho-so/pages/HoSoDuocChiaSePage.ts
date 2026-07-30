import { BasePage } from '@core/shared-pages/BasePage';
import { HO_SO_DUOC_CHIA_SE_URL } from '@config/config';

/**
 * Page Object — Được chia sẻ (4.1.3).
 * URL: {BASE_URL}/school-task/lesson-plan-shared#menu-lesson-plan-shared
 *
 * Trang đơn giản nhất trong nhóm 4.1.x — KHÔNG có sidebar #folder-plan-type
 * như 4.1.1/4.1.2 (không phân loại theo danh mục hồ sơ), chỉ có:
 *  - Tiêu đề "Hồ sơ nhà trường" (h4).
 *  - Bộ filter 2 select: Năm học (#select_school_year, giống các trang
 *    khác) + Phạm vi chia sẻ (#select-privacy: "Tất cả" / "Công khai trong
 *    tổ chuyên môn" / "Công khai toàn trường" — mặc định "Công khai toàn
 *    trường", value="2").
 *  - State rỗng dạng alert (.alert.alert-success), message RIÊNG của
 *    trang này: 'Thầy cô chưa tạo giáo án nào. Hãy click vào "Thêm mới"
 *    để bắt đầu' — KHÔNG có nút "Thêm mới" thực tế trên trang (khác với
 *    câu chữ trong alert), có thể do đây chỉ là hồ sơ ĐƯỢC chia sẻ (đọc),
 *    không phải nơi tạo mới.
 */

/** Giá trị select "Phạm vi chia sẻ" (#select-privacy) */
export enum HoSoPrivacyScope {
  TAT_CA = '0',
  CONG_KHAI_TO_CHUYEN_MON = '1',
  CONG_KHAI_TOAN_TRUONG = '2',
}

export class HoSoDuocChiaSePage extends BasePage {
  static readonly URL = HO_SO_DUOC_CHIA_SE_URL;

  static readonly PAGE_HEADING = 'h4:has-text("Hồ sơ nhà trường")';

  // ── Bộ filter ─────────────────────────────────────────────────────────────
  static readonly SCHOOL_YEAR_SELECT = '#select_school_year';
  static readonly PRIVACY_SELECT = '#select-privacy';

  static readonly EMPTY_STATE_ALERT = '.alert.alert-success';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(HoSoDuocChiaSePage.URL);
    await this.waitForSelector(HoSoDuocChiaSePage.PAGE_HEADING, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('school-task/lesson-plan-shared');
  }

  // ==================================================================
  // Bộ filter
  // ==================================================================

  /** VD: selectSchoolYear('2025') → chọn "2025 - 2026" */
  async selectSchoolYear(year: string): Promise<this> {
    await this.page.locator(HoSoDuocChiaSePage.SCHOOL_YEAR_SELECT).selectOption(year);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedSchoolYear(): Promise<string> {
    return this.page.locator(HoSoDuocChiaSePage.SCHOOL_YEAR_SELECT).inputValue();
  }

  async selectPrivacyScope(scope: HoSoPrivacyScope | string): Promise<this> {
    await this.page.locator(HoSoDuocChiaSePage.PRIVACY_SELECT).selectOption(scope);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getSelectedPrivacyScope(): Promise<string> {
    return this.page.locator(HoSoDuocChiaSePage.PRIVACY_SELECT).inputValue();
  }

  // ==================================================================
  // Nội dung / trạng thái rỗng
  // ==================================================================

  /**
   * True khi chưa có hồ sơ nào được chia sẻ cho bộ lọc hiện tại (state
   * rỗng — CHƯA khảo sát HTML của danh sách khi có dữ liệu thật).
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.isElementVisible(HoSoDuocChiaSePage.EMPTY_STATE_ALERT, 5_000);
  }

  async getEmptyStateMessage(): Promise<string> {
    const el = this.page.locator(HoSoDuocChiaSePage.EMPTY_STATE_ALERT).first();
    return ((await el.textContent()) ?? '').trim();
  }
}