import type { Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { BASE_URL } from '../config/config';

/**
 * Component tái sử dụng – header/navigation OLM
 *
 * Logo HTML thực tế (2 biến thể responsive, cùng thẻ <a href="https://olm.vn">):
 *   Desktop: <img src=".../images/logo.png" alt="OLM Logo"
 *                 class="tw-h-10 tw-hidden lg:tw-block">   (ẩn < lg, hiện ≥ lg)
 *   Mobile : <img src=".../v2/images/logo-olm.png" alt="OLM Logo"
 *                 class="tw-h-10 lg:tw-hidden">             (hiện < lg, ẩn ≥ lg)
 *   → Cả 2 <img> cùng alt="OLM Logo", chỉ khác nhau bằng class Tailwind
 *   responsive. findVisible() (đã sửa để duyệt mọi match, không chỉ
 *   .first()) sẽ tự chọn đúng biến thể đang hiển thị theo viewport.
 *
 * QUAN TRỌNG — breakpoint lg (1024px):
 *   Dưới lg, KHÔNG chỉ logo đổi biến thể mà toàn bộ <nav> chính cũng bị
 *   ẩn (class="tw-hidden lg:tw-flex ...") và thay bằng nút hamburger
 *   (<button ... lg:tw-hidden data-drawer-open="#drawer-menu-header">).
 *   Vì vậy mọi test nav item (Hỏi đáp, Kho đề, Bài viết...) chỉ đáng tin
 *   cậy ở viewport ≥ 1024px (desktop mặc định của Playwright config).
 *   Test viewport hẹp (768px) chỉ nên assert logo + không overflow ngang,
 *   KHÔNG assert nav item — trừ khi test đó tự mở drawer mobile trước
 *   (xem MOBILE_MENU_BUTTON / openMobileMenu() bên dưới).
 *
 * Top bar (trang chủ, guest):
 *   Về OLM | Hướng dẫn & trợ giúp        Thi đấu | Đánh giá năng lực
 *   → "Thi đấu" và "Đánh giá năng lực" nằm trong top bar, KHÔNG phải nav chính
 *
 * Main nav học sinh:
 *   HỌC BÀI · HỎI BÀI · KIỂM TRA · ĐGNL · THI ĐẤU · THƯ VIỆN SỐ
 *   BÀI VIẾT ▾ · TRANG GIÁO VIÊN · TRỢ GIÚP · VỀ OLM
 *
 * Dropdown "Bài viết":
 *   Toggle <a href="#">Bài viết</a> nằm trong <li class="... dropdown ...">
 *   cùng với <div class="dropdown-menu"> chứa các <a class="dropdown-item">
 *   (VD: "Tin tức" → href="/thongtin").
 *
 *   QUAN TRỌNG: các dropdown khác trên header (VD: "Cuộc thi vui") cũng
 *   dùng chung class ".dropdown-item" cho sub-item của chúng, và các
 *   sub-item này vẫn tồn tại trong DOM (dù đang ẩn) ngay cả khi dropdown
 *   đó chưa được mở. Vì vậy selector cho sub-item "Bài viết" PHẢI được
 *   scope vào đúng <li> chứa toggle "Bài viết" — nếu dùng selector toàn
 *   trang kiểu `a[href*='/cuoc-thi']` sẽ có nguy cơ bắt trúng dropdown-item
 *   ẩn của menu khác và gây fail giả (đã gặp thực tế ở test "Nav Bài viết").
 */
export class HeaderComponent extends BasePage {
  // ── Logo ──────────────────────────────────────────────────────────────────
  /** Cả 2 biến thể (desktop/mobile) cùng alt="OLM Logo" — xem doc phía trên. */
  static readonly LOGO = 'img[alt="OLM Logo"]';

  // ── Mobile nav (< lg / 1024px) ───────────────────────────────────────────
  /** Nút hamburger mở drawer menu, chỉ hiện dưới breakpoint lg. */
  static readonly MOBILE_MENU_BUTTON = 'button[data-drawer-open="#drawer-menu-header"]';
  /** Drawer menu mobile, mở ra sau khi click MOBILE_MENU_BUTTON. */
  static readonly MOBILE_DRAWER = '#drawer-menu-header';

  // ── Top bar ───────────────────────────────────────────────────────────────
  static readonly TOP_VE_OLM            = "a[href*='gioi-thieu']:not(nav a), a[href*='ve-olm']:not(nav a)";
  static readonly TOP_HUONG_DAN         = "a[href*='huong-dan']:not(nav a), a:has-text('Hướng dẫn & trợ giúp')";
  /**
   * Top bar "Thi đấu" – nằm trong .top-bar hoặc .header-top, KHÔNG phải nav chính.
   * Học sinh có thêm "Thi đấu" trong nav; selector này nhắm top bar.
   */
  static readonly TOP_THI_DAU =
    ".top-bar a[href*='dautruong'], .header-top a[href*='dautruong'], " +
    ".top-bar a:has-text('Thi đấu'), .header-top a:has-text('Thi đấu'), " +
    // fallback: bất kỳ link Thi đấu nào trỏ dautruong
    "a[href*='dautruong.olm.vn']";
  static readonly TOP_DANH_GIA_NANG_LUC =
    ".top-bar a[href*='danh-gia-nang-luc'], .header-top a[href*='danh-gia-nang-luc'], " +
    ".top-bar a[href*='dgnl.olm.vn'], .header-top a[href*='dgnl.olm.vn'], " +
    "a[href*='danh-gia-nang-luc']:not(nav a), a:has-text('Đánh giá năng lực')";

  // ── Main nav – GUEST & GIÁO VIÊN ─────────────────────────────────────────
  static readonly NAV_HOI_DAP    = "nav a[href*='/hoi-dap'], .navbar-nav a[href*='/hoi-dap']";
  static readonly NAV_KHO_DE     = "nav a[href*='/contestx'], .navbar-nav a[href*='/contestx'], nav a:has-text('Kho đề')";
  static readonly NAV_CUOC_THI   = "nav a[href*='/cuoc-thi'], .navbar-nav a[href*='/cuoc-thi']";
  static readonly NAV_DAU_TRUONG = "nav a[href*='dautruong.olm.vn'], nav a:has-text('Đấu trường')";
  static readonly NAV_THU_VIEN   = "nav a[href*='/thu-vien-so'], .navbar-nav a[href*='/thu-vien-so']";
  /**
   * "Bài viết" là dropdown toggle (href="#").
   * Selector ưu tiên text-match để không nhầm với sub-items.
   */
  static readonly NAV_BAI_VIET   =
    "nav a:has-text('Bài viết'), .navbar-nav a:has-text('Bài viết')";

  /**
   * <li> (hoặc container tương đương) BAO NGOÀI toggle "Bài viết" — dùng để
   * scope mọi truy vấn sub-item vào đúng dropdown này, tránh bắt nhầm
   * dropdown-item ẩn của các menu khác (VD: "Cuộc thi vui").
   */
  static readonly NAV_BAI_VIET_CONTAINER =
    "li:has(> a:has-text('Bài viết')), " +
    "li:has(> a.dropdown-toggle:has-text('Bài viết')), " +
    ".nav-item:has(> a:has-text('Bài viết'))";

  /** Menu dropdown mở ra khi click "Bài viết" — scope trong container ở trên. */
  static readonly NAV_BAI_VIET_MENU =
    "li:has(> a:has-text('Bài viết')) .dropdown-menu, " +
    ".nav-item:has(> a:has-text('Bài viết')) .dropdown-menu";

  /** Sub-item "Tin tức" trong dropdown "Bài viết" (href thực tế → /thongtin). */
  static readonly NAV_BAI_VIET_TIN_TUC =
    "li:has(> a:has-text('Bài viết')) a.dropdown-item:has-text('Tin tức'), " +
    ".nav-item:has(> a:has-text('Bài viết')) a.dropdown-item:has-text('Tin tức'), " +
    "li:has(> a:has-text('Bài viết')) a[href*='/thongtin'], " +
    ".nav-item:has(> a:has-text('Bài viết')) a[href*='/thongtin']";

  // ── Main nav – CHỈ GIÁO VIÊN ─────────────────────────────────────────────
  static readonly NAV_TRANG_GIAO_VIEN =
    "nav a[href*='/home'], nav a:has-text('Trang giáo viên'), .navbar-nav a:has-text('Trang giáo viên')";

  // ── Main nav – CHỈ HỌC SINH ──────────────────────────────────────────────
  static readonly NAV_HOC_BAI  = "nav a[href='/hoc-bai'], .navbar-nav a[href='/hoc-bai']";
  static readonly NAV_HOI_BAI  = "nav a:has-text('Hỏi bài'), .navbar-nav a:has-text('Hỏi bài')";
  static readonly NAV_KIEM_TRA = "nav a:has-text('Kiểm tra'), .navbar-nav a:has-text('Kiểm tra'), nav a[href*='/contestx']";
  static readonly NAV_DGNL     = "nav a[href*='dgnl.olm.vn'], nav a:has-text('ĐGNL'), .navbar-nav a:has-text('ĐGNL')";
  static readonly NAV_THI_DAU  = "nav a[href*='/thi-dau'], .navbar-nav a[href*='/thi-dau'], nav a:has-text('Thi đấu')";
  static readonly NAV_LOP_HOC  = "nav a[href*='/lop-hoc'], nav a:has-text('Lớp học')";
  static readonly NAV_TRO_GIUP = "nav a[href*='hotroolm'], nav a[href*='/tro-giup'], nav a:has-text('Trợ giúp')";
  static readonly NAV_VE_OLM   = "nav a[href*='gioi-thieu'], nav a[href*='/ve-olm'], nav a:has-text('Về OLM')";

  // ── Auth buttons (chỉ hiện khi CHƯA đăng nhập) ───────────────────────────
  static readonly BTN_DANG_NHAP      = "a:has-text('Đăng nhập'):not(:has-text('CSDL'))";
  static readonly BTN_DANG_KY        = "a.btn:has-text('Đăng ký')";
  static readonly BTN_DANG_NHAP_CSDL = "a:has-text('Đăng nhập bằng CSDL GDĐT')";

  // ── Search ────────────────────────────────────────────────────────────────
  static readonly SEARCH_INPUT = "input[type='search'], input[name='q'], input[placeholder*='Tìm kiếm']";

  // ── Announcement bar ──────────────────────────────────────────────────────
  static readonly ANNOUNCEMENT_BAR = ".announcement-bar, .notice-bar, [class*='announcement'], [class*='notice'], div:has-text('OLM bổ sung mới')";

  constructor(page: Page) {
    super(page);
  }

  async openHome(): Promise<this> {
    await this.navigateTo(BASE_URL); // navigateTo đã tự dismiss popup
    // KHÔNG dùng waitForLoadState('networkidle'): trang olm.vn có request nền
    // liên tục (chat widget, analytics, polling…) nên networkidle gần như
    // không bao giờ đạt được, luôn timeout đủ 30s và ngốn hết ngân sách
    // timeout chung của test (đặc biệt trong e2e flow nhiều bước). Thay
    // bằng chờ ngắn để UI ổn định — navigateTo() đã đợi domcontentloaded +
    // dismiss popup nên không cần chờ thêm nhiều.
    await this.page.waitForTimeout(800);
    return this;
  }

  async clickLogo(): Promise<this> {
    const el = await this.findVisible([HeaderComponent.LOGO], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  /**
   * Mở drawer menu mobile (chỉ tồn tại/khả dụng dưới breakpoint lg).
   * Dùng khi cần kiểm tra nav item ở viewport hẹp — nav chính bị
   * tw-hidden dưới lg nên phải mở drawer trước khi tìm nav item.
   */
  async openMobileMenu(): Promise<this> {
    const btn = await this.findVisible([HeaderComponent.MOBILE_MENU_BUTTON], 5);
    if (btn) await this.jsClick(btn);
    return this;
  }

  async search(keyword: string): Promise<this> {
    const input = await this.findVisible([HeaderComponent.SEARCH_INPUT], 5);
    if (input) {
      await input.fill(keyword);
      await input.press('Enter');
    }
    return this;
  }

  /** Click toggle "Bài viết" để mở dropdown (KHÔNG điều hướng — href="#"). */
  async openBaiVietDropdown(): Promise<this> {
    const el = await this.findVisible([HeaderComponent.NAV_BAI_VIET], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  /**
   * Mở dropdown "Bài viết" rồi click sub-item "Tin tức" (→ /thongtin).
   * Dùng selector đã SCOPE vào đúng dropdown "Bài viết" (xem
   * NAV_BAI_VIET_TIN_TUC) để tránh bắt nhầm dropdown-item ẩn của menu khác.
   */
  async clickBaiVietTinTuc(): Promise<this> {
    await this.openBaiVietDropdown();
    const item = await this.findVisible([HeaderComponent.NAV_BAI_VIET_TIN_TUC], 10);
    if (item) await this.jsClick(item);
    return this;
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return (await this.findVisible([HeaderComponent.BTN_DANG_NHAP], 5)) !== null;
  }

  async isStudentAccount(): Promise<boolean> {
    return (await this.findVisible([HeaderComponent.NAV_HOC_BAI], 3)) !== null;
  }

  async isTeacherAccount(): Promise<boolean> {
    return (await this.findVisible([HeaderComponent.NAV_TRANG_GIAO_VIEN], 3)) !== null;
  }
}