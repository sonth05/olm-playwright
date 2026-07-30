import { BASE_URL } from '../../config/config';
import { BasePage } from './BasePage';

/**
 * Header trang khóa học olm.vn – giao diện "trong trường"
 * URL mẫu: /lop-10-mon-toan  hoặc  /hoc-bai
 *
 * Logo HTML thực tế:
 *   <a href="/"> <img class="img-logo" src="/images/logo-white.png" ...> </a>
 *
 * Sidebar lớp:
 *   <li class="active"> <a href="...">Lớp 10</a> </li>
 *   Click sang Lớp 9 → URL thay đổi (vd: /lop-9-mon-toan hoặc ?grade=9)
 *
 * Popup "Đăng ký nhận thông báo" (#later-noti) tự động bị dismiss
 * bởi BasePage.navigateTo() — không cần gọi PopupComponent nữa.
 */
export class HeaderCoursePage extends BasePage {
  static readonly COURSE_URL = `${BASE_URL}/lop-10-mon-toan`;

  // ── Logo ──────────────────────────────────────────────────────────────────
  /** img.img-logo bên trong thẻ <a href="/"> */
  static readonly LOGO =
    'a[href="/"] img.img-logo, ' +
    'a[href="/"] img[class*="logo"], ' +
    'header a img[alt*="OLM"], ' +
    '.navbar-brand img';

  // ── Search bar ────────────────────────────────────────────────────────────
  static readonly SEARCH_INPUT       = "input[placeholder*='Tìm kiếm'], input[type='search']";
  static readonly SEARCH_TYPE_SELECT = "button:has-text('Học liệu'), select.search-type, .search-dropdown, [class*='search-select']";
  static readonly SEARCH_SUBMIT_BTN  = "button[type='submit'], .search-btn, button.btn-search";

  // ── Nav chính ─────────────────────────────────────────────────────────────
  static readonly NAV_HOC_BAI     = ".navbar-nav a[href='/hoc-bai'], nav a[href='/hoc-bai']";
  static readonly NAV_HOI_BAI     = ".navbar-nav a[href*='/hoi-dap'], nav a[href*='/hoi-dap']";
  static readonly NAV_KIEM_TRA    = ".navbar-nav a[href*='/contestx'], nav a[href*='/contestx'], nav a:has-text('Kiểm tra')";
  static readonly NAV_DGNL        = ".navbar-nav a[href*='dgnl.olm.vn'], nav a[href*='dgnl.olm.vn'], nav a:has-text('ĐGNL')";
  static readonly NAV_THI_DAU     = ".navbar-nav a[href*='/thi-dau'], nav a[href*='/thi-dau'], nav a:has-text('Thi đấu')";
  static readonly NAV_THU_VIEN_SO = ".navbar-nav a[href*='/thu-vien-so'], nav a[href*='/thu-vien-so']";
  static readonly NAV_BAI_VIET    = "nav a:has-text('Bài viết'), .navbar-nav a:has-text('Bài viết')";
  static readonly NAV_TRO_GIUP    = ".navbar-nav a[href*='hotroolm'], nav a:has-text('Trợ giúp')";
  static readonly NAV_VE_OLM      = ".navbar-nav a[href*='gioi-thieu'], nav a:has-text('Về OLM')";

  // ── Sidebar lớp ──────────────────────────────────────────────────────────
  /**
   * Sidebar có thể dùng:
   *   <ul class="nav flex-column"> <li class="active"> <a>Lớp 10</a> </li> ...
   *   hoặc  <li class="nav-item active"> ...
   */
  static readonly SIDEBAR_ACTIVE_GRADE =
    // Cấu trúc thực tế: <a class="olm-a active" href="/lop-1">...</a>
    // — không bọc trong .sidebar/aside, không cần li.active.
    'a.olm-a.active, ' +
    '.sidebar li.active a, aside li.active a, ' +
    'ul.nav li.active a, .nav-sidebar li.active a, ' +
    // fallback: <a> đang active trực tiếp
    '.sidebar a.active, aside a.active';

  // ── Announcement bar ──────────────────────────────────────────────────────
  static readonly ANNOUNCEMENT_BAR =
    '[class*="announce"], [class*="notice"], [class*="banner"], ' +
    '.alert-bar, .top-bar, div:has-text("OLM bổ sung mới"), div:has-text("OLM Class")';

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Mở trang khóa học.
   * BasePage.navigateTo() đã tự dismiss popup thông báo → không cần PopupComponent.
   */
  async openCoursePage(url = HeaderCoursePage.COURSE_URL): Promise<this> {
    await this.navigateTo(url); // tự dismiss popup
    await this.page.waitForTimeout(1200);
    // Gọi thêm một lần nữa phòng popup xuất hiện muộn sau khi trang ổn định
    // (TRƯỚC ĐÂY: gọi this._dismissOlmPopups() — method này KHÔNG TỒN TẠI,
    // gây TypeError runtime làm fail TOÀN BỘ test trong file này. Đã sửa
    // thành this.dismissPopups() — wrapper public có thật trong BasePage.)
    await this.dismissPopups();
    // Banner "Đăng ký nhận thông báo" đôi khi hiện trễ hơn nữa (sau khi JS
    // phân tích/đo lường hành vi xong) và đè lên dropdown tìm kiếm — chờ
    // thêm rồi dismiss lại lần 2 để chắc chắn không còn che giao diện.
    await this.page.waitForTimeout(1500);
    await this.dismissPopups();
    return this;
  }

  async clickLogo(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.LOGO], 5);
    if (el) await this.jsClick(el);
    await this.page.waitForTimeout(1200);
    return this;
  }

  async search(keyword: string): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.SEARCH_INPUT], 5);
    if (el) {
      await el.fill(keyword);
      const btn = await this.findVisible([HeaderCoursePage.SEARCH_SUBMIT_BTN], 3);
      if (btn) await this.jsClick(btn);
      else await el.press('Enter');
    }
    return this;
  }

  async selectSearchType(type: string): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.SEARCH_TYPE_SELECT], 5);
    if (el) await el.selectOption({ label: type }).catch(() => {});
    return this;
  }

  async clickNavHocBai(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.NAV_HOC_BAI], 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(1200);
    }
    return this;
  }

  async clickNavHoiBai(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.NAV_HOI_BAI], 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(1200);
    }
    return this;
  }

  async clickNavKiemTra(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.NAV_KIEM_TRA], 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(1200);
    }
    return this;
  }

  async clickNavDGNL(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.NAV_DGNL], 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(1200);
    }
    return this;
  }

  async clickNavThiDau(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.NAV_THI_DAU], 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(2000);
    }
    return this;
  }

  async clickNavThuVienSo(): Promise<this> {
    const el = await this.findVisible([HeaderCoursePage.NAV_THU_VIEN_SO], 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(1200);
    }
    return this;
  }

  async clickSidebarGrade(gradeName: string): Promise<this> {
    const selectors = [
      // Cấu trúc thực tế: <a class="olm-a" href="/lop-N" title="/lop-N"><span>Lớp N</span></a>
      `a.olm-a:has-text('${gradeName}')`,
      `.sidebar a:has-text('${gradeName}')`,
      `.grade-sidebar a:has-text('${gradeName}')`,
      `aside a:has-text('${gradeName}')`,
      `ul.nav a:has-text('${gradeName}')`,
      `li a:has-text('${gradeName}')`,
    ];
    const el = await this.findVisible(selectors, 5);
    if (el) {
      await this.jsClick(el);
      await this.page.waitForTimeout(1500);
      // Dọn lại popup/banner có thể xuất hiện trễ sau khi điều hướng sang lớp khác
      await this.dismissPopups();
    }
    return this;
  }

  async isSearchInputPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderCoursePage.SEARCH_INPUT], 5)) !== null;
  }

  async isSearchTypeSelectPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderCoursePage.SEARCH_TYPE_SELECT], 5)) !== null;
  }

  async isAnnouncementBarPresent(): Promise<boolean> {
    const byText = this.page.getByText('OLM', { exact: false }).first();
    const bySelector = await this.findVisible([HeaderCoursePage.ANNOUNCEMENT_BAR], 3);
    return (await byText.isVisible().catch(() => false)) || bySelector !== null;
  }

  /**
   * Trả về text của link lớp đang active trong sidebar.
   * HTML: <li class="active"><a href="...">Lớp 10</a></li>
   */
  async getActiveGradeText(): Promise<string | null> {
    const el = await this.findVisible([HeaderCoursePage.SIDEBAR_ACTIVE_GRADE], 5);
    return el ? (await el.textContent())?.trim() ?? null : null;
  }
}