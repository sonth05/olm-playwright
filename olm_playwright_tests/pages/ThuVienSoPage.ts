import {
  SACH_GIAO_KHOA_URL,
  TAP_CHI_URL,
  THU_VIEN_SO_URL,
} from '../config/config';
import { BasePage } from './BasePage';

export class ThuVienSoPage extends BasePage {
  static readonly URL = THU_VIEN_SO_URL;
  static readonly SACH_GIAO_KHOA_URL = SACH_GIAO_KHOA_URL;
  static readonly TAP_CHI_URL = TAP_CHI_URL;

  // Selectors chuẩn theo DOM thực tế của trang
  static readonly BOOK_CARD = '.card-document-content';
  static readonly BOOK_LINK = "a[href*='/doc-sach/'], a[href*='/thu-vien-so/']";
  // Card danh mục tạp chí dùng class "card-collection"
  static readonly MAGAZINE_CARD = '.card-collection';
  static readonly MEMBERSHIP_BADGE = '.badge-hoi-vien, .lock-icon, .badge-member';

  // Selector cho badge "N kết quả"
  static readonly RESULT_COUNT_BADGE =
    'span:has-text("kết quả"), div:has-text("kết quả")';

  // Selector lọc lớp: data-grade attribute
  static readonly GRADE_ITEM = '[data-group="grade-select-course"]';

  async open(): Promise<this> {
    await this.navigateTo(ThuVienSoPage.URL);
    return this;
  }

  async openSachGiaoKhoa(grade?: number, bookType?: string): Promise<this> {
    let url = ThuVienSoPage.SACH_GIAO_KHOA_URL;
    const params: string[] = [];
    if (grade !== undefined) params.push(`grade=${grade}`);
    if (bookType) params.push(`type=${bookType}`);
    if (params.length) url += '?' + params.join('&');
    await this.navigateTo(url);
    // Scroll xuống để trigger lazy-load
    await this.page.evaluate(() => window.scrollTo(0, 600));
    await this.page.waitForTimeout(1500);
    return this;
  }

  async openTapChi(): Promise<this> {
    await this.navigateTo(ThuVienSoPage.TAP_CHI_URL);
    await this.page.evaluate(() => window.scrollTo(0, 600));
    await this.page.waitForTimeout(1500);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('thu-vien-so');
  }

  /**
   * Đếm số card sách hiển thị trên trang.
   * Dùng selector chuẩn theo class thực tế: card-document-content
   */
  async getBookCount(): Promise<number> {
    // Chờ ít nhất 1 card xuất hiện hoặc timeout sau 5s
    try {
      await this.page
        .locator(ThuVienSoPage.BOOK_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      // Không có card nào — trả về 0
      return 0;
    }
    return this.page.locator(ThuVienSoPage.BOOK_CARD).count();
  }

  /**
   * Lấy số "N kết quả" từ badge hiển thị trên trang.
   * Trả về -1 nếu không tìm thấy.
   */
  async getDisplayedResultCount(): Promise<number> {
    try {
      // Tìm element chứa "kết quả" — ví dụ "11 kết quả"
      const el = this.page
        .locator('text=/\\d+ kết quả/')
        .first();
      await el.waitFor({ state: 'visible', timeout: 10000 });
      const text = await el.textContent();
      const match = text?.match(/(\d+)\s*kết quả/);
      return match ? parseInt(match[1], 10) : -1;
    } catch {
      return -1;
    }
  }

  async getMagazineCount(): Promise<number> {
    try {
      await this.page
        .locator(ThuVienSoPage.MAGAZINE_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return 0;
    }
    return this.page.locator(ThuVienSoPage.MAGAZINE_CARD).count();
  }

  async clickFirstBook(): Promise<this> {
    const links = await this.page.locator(ThuVienSoPage.BOOK_LINK).all();
    if (links.length > 0) await this.jsClick(links[0]);
    return this;
  }

  async hasMembershipBadge(): Promise<boolean> {
    return (await this.page.locator(ThuVienSoPage.MEMBERSHIP_BADGE).count()) > 0;
  }

  isSachGiaoKhoaLoaded(): boolean {
    return this.getCurrentUrl().includes('sach-giao-khoa');
  }

  isTapChiLoaded(): boolean {
    return this.getCurrentUrl().includes('tap-chi');
  }

  /**
   * Click vào tab lớp theo số (1–12) trên trang Sách giáo khoa.
   * Dùng data-grade attribute.
   */
  async selectGrade(grade: number): Promise<void> {
    const tab = this.page.locator(
      `[data-group="grade-select-course"][data-grade="${grade}"]`
    );
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    // Chờ danh sách re-render
    await this.page.waitForTimeout(1500);
  }
}