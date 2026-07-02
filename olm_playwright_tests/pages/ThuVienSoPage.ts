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

  // ══════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════
  static readonly LOGO = 'a[href*="thu-vien-so"] img[alt="Logo"]';
  // NOTE: top nav links are NOT inside a <header> tag on this page,
  // so the previous `header a[...]` selectors never matched anything.
  static readonly HEADER_SACH_GK_LINK = 'a[href*="sach-giao-khoa"]:not(#sidebar a, footer a)';
  static readonly HEADER_TAP_CHI_LINK = 'a[href*="tap-chi"]:not(#sidebar a, footer a)';
  /** Link Tạp chí khi đang active (có bg accent-extra-light) */
  static readonly HEADER_TAP_CHI_ACTIVE =
    'a[href*="tap-chi"]:not(#sidebar a, footer a).tw-bg-accent-extra-light';
  static readonly HEADER_HOI_VIEN_BTN = 'a.btn-library-member, a[href*="gio-hang-thu-vien-so"]';
  static readonly HEADER_LOGIN_BTN = 'a[href*="dangnhap"]:not(#sidebar a, footer a)';
  static readonly HEADER_REGISTER_BTN = 'a[href*="dang-ky"]:not(#sidebar a, footer a)';
  static readonly HAMBURGER_MENU = '#btn-menu';
  static readonly SIDEBAR = '#sidebar';
  static readonly OVERLAY = '#overlay';
  /** Sidebar: link SGK */
  static readonly SIDEBAR_SACH_GK = '#sidebar a[href*="sach-giao-khoa"]';
  /** Sidebar: link Tạp chí */
  static readonly SIDEBAR_TAP_CHI = '#sidebar a[href*="tap-chi"]';
  /** Sidebar: link Hướng dẫn */
  static readonly SIDEBAR_HUONG_DAN = '#sidebar a[href*="huong-dan"]';
  /** Sidebar: nút Đăng nhập */
  static readonly SIDEBAR_LOGIN_BTN = '#sidebar a[href*="dangnhap"]';
  /** Sidebar: nút Đăng ký */
  static readonly SIDEBAR_REGISTER_BTN = '#sidebar a[href*="dang-ky"]';

  // ══════════════════════════════════════════════════════════════
  // HOMEPAGE
  // ══════════════════════════════════════════════════════════════
  static readonly HERO_TITLE = 'span.tw-text-accent-default';
  static readonly OFFICIAL_PARTNER_BADGE =
    'span:has-text("ĐỐI TÁC CHÍNH THỨC CỦA NXB GIÁO DỤC")';
  static readonly EXPLORE_BOOKS_BTN = 'a:has-text("Khám phá kho sách")';
  static readonly FREE_BADGE = 'b:has-text("miễn phí 100%")';
  static readonly MAGAZINE_SECTION_TITLE = 'span:has-text("Thư viện tạp chí")';
  static readonly FOR_MEMBER_BADGE = 'span:has-text("DÀNH CHO HỘI VIÊN")';
  static readonly MEMBER_CARD = 'div.tw-bg-sub-violet-default';
  static readonly EXPLORE_MEMBER_BTN = 'a:has-text("Tìm hiểu gói Hội viên")';
  static readonly EXPLORE_LIBRARY_BTN = 'a[href*="tap-chi"]:has-text("Khám phá thư viện")';
  static readonly LATEST_PUBLICATIONS_TITLE = 'span:has-text("Ấn phẩm mới nhất")';
  static readonly SWIPER = '.swiper';
  static readonly SWIPER_SLIDE = '.swiper-slide .card-document-content';
  static readonly CAROUSEL_PREV = '.prev-btn';
  static readonly CAROUSEL_NEXT = '.next-btn';

  // ══════════════════════════════════════════════════════════════
  // SÁCH GIÁO KHOA — selectors từ DOM thực tế
  // ══════════════════════════════════════════════════════════════

  // ── Lọc lớp (desktop: tab, mobile: select) ────────────────────
  /** Tab lớp trên desktop (sm trở lên) — có data-grade="1..12" */
  static readonly GRADE_TAB = '[data-group="grade-select-course"]';
  /** Tab lớp đang được chọn (có class "selected") */
  static readonly GRADE_TAB_SELECTED = '[data-group="grade-select-course"].selected';
  /** Dropdown lớp trên mobile */
  static readonly GRADE_SELECT_MOBILE = 'select#grade-select-2';
  /** Select2 rendered (phần visible trên mobile) */
  static readonly GRADE_SELECT2_RENDERED = '.select2-selection__rendered';

  // ── Tab loại sách ──────────────────────────────────────────────
  /** Radio tab "Sách học sinh" */
  static readonly TAB_SACH_HOC_SINH = '#tab-book-student';
  /** Label / nút "Sách học sinh" (visible) */
  static readonly LABEL_SACH_HOC_SINH = 'label[for="tab-book-student"]';
  /** Radio tab "Sách giáo viên" */
  static readonly TAB_SACH_GIAO_VIEN = '#tab-book-teacher';
  /** Label / nút "Sách giáo viên" (visible) */
  static readonly LABEL_SACH_GIAO_VIEN = 'label[for="tab-book-teacher"]';

  // ── Kết quả & danh sách sách ──────────────────────────────────
  /** Badge "N kết quả" — id cụ thể từ DOM */
  static readonly COUNT_BOOKS_BADGE = '#count-books';
  /** Grid container chứa toàn bộ card sách */
  static readonly BOOK_LIST_CONTAINER = '#list-book-container';
  /** Card sách (nằm trong grid) */
  static readonly BOOK_CARD = '.card-document-content';
  /** Link đến trang đọc sách */
  static readonly BOOK_LINK = "a[href*='/doc-sach/']";
  /** Tên sách trong card */
  static readonly BOOK_CARD_TITLE =
    '.card-document-content span.tw-font-semibold';
  /** Ảnh bìa sách trong card */
  static readonly BOOK_CARD_IMG = '.card-document-content img';
  /** Overlay gradient trên ảnh bìa */
  static readonly BOOK_CARD_OVERLAY = '.card-document-content .tw-absolute.tw-inset-0';

  // ── Banner SGK ────────────────────────────────────────────────
  static readonly SGK_BANNER = 'img[alt="library"][src*="Banner_desktop"]';

  // ── Wrapper trang SGK ─────────────────────────────────────────
  static readonly SGK_VIEW = '#view-digital-book';

  // ══════════════════════════════════════════════════════════════
  // TẠP CHÍ — selectors từ DOM thực tế
  // ══════════════════════════════════════════════════════════════

  /** Wrapper toàn bộ trang tạp chí */
  static readonly TAPCHI_VIEW = '#view-magazines';
  /** Tiêu đề section "Danh mục tạp chí" */
  static readonly TAPCHI_SECTION_TITLE = 'span:has-text("Danh mục tạp chí")';
  /** Card danh mục tạp chí */
  static readonly MAGAZINE_CARD = '.card-collection';
  /** Tên tạp chí trong card */
  static readonly MAGAZINE_CARD_NAME =
    '.card-collection span.tw-text-24.tw-font-semibold';
  /** Số ấn phẩm của tạp chí (vd: "48 ấn phẩm") */
  static readonly MAGAZINE_CARD_COUNT =
    '.card-collection span.tw-text-content-tertiary';
  /** Mô tả tạp chí */
  static readonly MAGAZINE_CARD_DESC =
    '.card-collection span.tw-text-content-secondary';
  /** Ảnh bìa danh mục tạp chí */
  static readonly MAGAZINE_CARD_IMG = '.card-collection img.tw-aspect-\\[200\\/248\\]';
  /** Link vào danh mục tạp chí */
  static readonly MAGAZINE_CARD_LINK = '.card-collection a[href*="/thu-vien-so/"]';
  /** Grid 2 cột tạp chí */
  static readonly MAGAZINE_GRID =
    '.tw-grid.tw-grid-cols-1.lg\\:tw-grid-cols-2';
  /** Ảnh trang trí góc phải */
  static readonly TAPCHI_DECOR_IMG = 'img[alt="decor"]';

  // ══════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════
  static readonly FOOTER = 'footer';
  static readonly FOOTER_LOGO = 'footer img[alt="Logo"]';
  static readonly FOOTER_COMPANY_NAME =
    'footer strong:has-text("Công ty Cổ phần Khoa học")';
  static readonly FOOTER_PARTNER_NXBGD =
    'footer img[alt="Nhà xuất bản Giáo dục Việt Nam"]';
  static readonly FOOTER_FACEBOOK_LINK = 'footer a[href*="facebook.com"]';
  static readonly FOOTER_YOUTUBE_LINK = 'footer a[href*="youtube.com"]';
  static readonly FOOTER_ZALO_LINK = 'footer a[href*="zalo.me"]';
  static readonly FOOTER_COPYRIGHT = 'footer span:has-text("©2013")';
  static readonly FOOTER_NAV_HOME = 'footer a[href*="thu-vien-so"]:has-text("Trang chủ")';
  static readonly FOOTER_NAV_SACH_GK = 'footer a:has-text("Sách giáo khoa")';
  static readonly FOOTER_NAV_TAP_CHI = 'footer a[href*="tap-chi"]';
  static readonly FOOTER_NAV_HOI_VIEN = 'footer a[href*="gio-hang"]';
  static readonly FOOTER_NAV_HDHT = 'footer a[href*="huong-dan"]';
  static readonly FOOTER_SCROLL_TOP = '#scrollToTopBtn';

  // ══════════════════════════════════════════════════════════════
  // PAGE ACTIONS
  // ══════════════════════════════════════════════════════════════

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

  isSachGiaoKhoaLoaded(): boolean {
    return this.getCurrentUrl().includes('sach-giao-khoa');
  }

  isTapChiLoaded(): boolean {
    return this.getCurrentUrl().includes('tap-chi');
  }

  // ── Sách giáo khoa ─────────────────────────────────────────────

  /**
   * Đếm số card sách trong #list-book-container.
   * Dùng container cụ thể để tránh đếm nhầm slide carousel.
   */
  async getBookCount(): Promise<number> {
    try {
      await this.page
        .locator(`${ThuVienSoPage.BOOK_LIST_CONTAINER} ${ThuVienSoPage.BOOK_CARD}`)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return 0;
    }
    return this.page
      .locator(`${ThuVienSoPage.BOOK_LIST_CONTAINER} ${ThuVienSoPage.BOOK_CARD}`)
      .count();
  }

  /**
   * Lấy số kết quả từ #count-books ("11 kết quả" → 11).
   * Trả về -1 nếu không tìm thấy.
   */
  async getDisplayedResultCount(): Promise<number> {
    try {
      const el = this.page.locator(ThuVienSoPage.COUNT_BOOKS_BADGE).first();
      await el.waitFor({ state: 'visible', timeout: 8000 });
      const text = await el.textContent();
      const match = text?.match(/(\d+)\s*kết quả/);
      return match ? parseInt(match[1], 10) : -1;
    } catch {
      return -1;
    }
  }

  /**
   * Lấy tên sách của card thứ N (0-indexed).
   */
  async getBookTitle(index = 0): Promise<string> {
    try {
      const el = this.page
        .locator(`${ThuVienSoPage.BOOK_LIST_CONTAINER} ${ThuVienSoPage.BOOK_CARD_TITLE}`)
        .nth(index);
      return (await el.textContent())?.trim() ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Click tab lớp trên desktop (dùng data-grade attribute).
   */
  async selectGrade(grade: number): Promise<void> {
    const tab = this.page.locator(
      `[data-group="grade-select-course"][data-grade="${grade}"]`
    );
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Chọn lớp trên mobile qua <select>.
   */
  async selectGradeMobile(grade: number): Promise<void> {
    await this.page.selectOption(ThuVienSoPage.GRADE_SELECT_MOBILE, String(grade));
    await this.page.waitForTimeout(1500);
  }

  /**
   * Lấy lớp hiện đang được select (từ tab có class "selected").
   */
  async getSelectedGrade(): Promise<number | null> {
    try {
      const el = this.page.locator(ThuVienSoPage.GRADE_TAB_SELECTED).first();
      const grade = await el.getAttribute('data-grade');
      return grade ? parseInt(grade, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Click tab "Sách học sinh".
   */
  async selectSachHocSinh(): Promise<void> {
    await this.page.locator(ThuVienSoPage.LABEL_SACH_HOC_SINH).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click tab "Sách giáo viên".
   */
  async selectSachGiaoVien(): Promise<void> {
    await this.page.locator(ThuVienSoPage.LABEL_SACH_GIAO_VIEN).click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Kiểm tra radio tab "Sách học sinh" đang được chọn.
   */
  async isSachHocSinhSelected(): Promise<boolean> {
    return this.page.locator(ThuVienSoPage.TAB_SACH_HOC_SINH).isChecked();
  }

  /**
   * Kiểm tra radio tab "Sách giáo viên" đang được chọn.
   */
  async isSachGiaoVienSelected(): Promise<boolean> {
    return this.page.locator(ThuVienSoPage.TAB_SACH_GIAO_VIEN).isChecked();
  }

  async clickFirstBook(): Promise<this> {
    const link = this.page
      .locator(`${ThuVienSoPage.BOOK_LIST_CONTAINER} ${ThuVienSoPage.BOOK_LINK}`)
      .first();
    await this.jsClick(link);
    return this;
  }

  // ── Tạp chí ────────────────────────────────────────────────────

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

  /**
   * Lấy tên tạp chí của card thứ N (0-indexed).
   */
  async getMagazineName(index = 0): Promise<string> {
    try {
      const el = this.page
        .locator(ThuVienSoPage.MAGAZINE_CARD_NAME)
        .nth(index);
      return (await el.textContent())?.trim() ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Lấy số ấn phẩm từ text "N ấn phẩm" của card thứ N.
   * Trả về -1 nếu không parse được.
   */
  async getMagazineIssueCount(index = 0): Promise<number> {
    try {
      const el = this.page
        .locator(ThuVienSoPage.MAGAZINE_CARD_COUNT)
        .nth(index);
      const text = await el.textContent();
      const match = text?.match(/(\d+)\s*ấn phẩm/);
      return match ? parseInt(match[1], 10) : -1;
    } catch {
      return -1;
    }
  }

  async hasMembershipBadge(): Promise<boolean> {
    return (
      (await this.page
        .locator('.badge-hoi-vien, .lock-icon, .badge-member')
        .count()) > 0
    );
  }

  // ── Carousel (Homepage) ────────────────────────────────────────

  async getLatestPublicationsCount(): Promise<number> {
    try {
      await this.page
        .locator(ThuVienSoPage.SWIPER_SLIDE)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return 0;
    }
    return this.page.locator(ThuVienSoPage.SWIPER_SLIDE).count();
  }

  // ── Helpers ────────────────────────────────────────────────────

  async isElementVisible(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page
        .locator(selector)
        .first()
        .waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async scrollToFooter(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.page.waitForTimeout(800);
  }

  async setMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 812 });
  }

  async setDesktopViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 1366, height: 768 });
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * NOTE: dùng page.waitForURL() thay vì page.waitForLoadState('domcontentloaded')
   * sau click(). click() KHÔNG đợi navigation do nó gây ra — nó chỉ đợi sự kiện
   * click được dispatch. Nếu gọi waitForLoadState() ngay sau đó, có khả năng
   * navigation thật sự CHƯA bắt đầu, nên waitForLoadState() trả về ngay lập tức
   * dựa trên trạng thái của trang CŨ (đã "domcontentloaded" từ trước) — dẫn đến
   * assertion URL chạy sớm hơn navigation thật, gây fail giả (race condition).
   * waitForURL() đợi đúng URL đích nên tránh được race này.
   */
  async clickHoiVienBtn(): Promise<this> {
    await this.page.locator(ThuVienSoPage.HEADER_HOI_VIEN_BTN).first().click();
    await this.page.waitForURL(/gio-hang/, { timeout: 15_000 });
    return this;
  }

  async clickExploreBooks(): Promise<this> {
    await this.page.locator(ThuVienSoPage.EXPLORE_BOOKS_BTN).first().click();
    await this.page.waitForURL(/sach-giao-khoa/, { timeout: 15_000 });
    return this;
  }

  async clickExploreMemberBtn(): Promise<this> {
    await this.page.locator(ThuVienSoPage.EXPLORE_MEMBER_BTN).first().click();
    await this.page.waitForURL(/gio-hang/, { timeout: 15_000 });
    return this;
  }

  async clickExploreLibraryBtn(): Promise<this> {
    await this.page.locator(ThuVienSoPage.EXPLORE_LIBRARY_BTN).first().click();
    await this.page.waitForURL(/tap-chi/, { timeout: 15_000 });
    return this;
  }
}