import { BASE_URL } from '../../config/config';
import { BasePage } from './BasePage';

/**
 * Header trang chủ olm.vn (giao diện chính - ảnh 1)
 *
 * Layout:
 *   Top bar:  Về OLM | Hướng dẫn & trợ giúp          Thi đấu | Đánh giá năng lực
 *   Main:     [Logo OLM]  Trang giáo viên · Hỏi đáp · Kho đề · Cuộc thi vui
 *                         Đấu trường · Thư viện số · Bài viết ▾      🗨 🔔 👤
 *   (khi chưa đăng nhập thay 👤 bằng Đăng nhập / Đăng ký)
 */
export class HeaderHomePage extends BasePage {
  static readonly URL = BASE_URL; // https://olm.vn

  // ── Top bar ──────────────────────────────────────────────────────────────
  static readonly TOP_VE_OLM        = "a:has-text('Về OLM')";
  static readonly TOP_HUONG_DAN     = "a:has-text('Hướng dẫn')";
  static readonly TOP_THI_DAU       = "a:has-text('Thi đấu')";
  static readonly TOP_DANH_GIA_NL   = "a:has-text('Đánh giá năng lực')";

  // ── Logo ─────────────────────────────────────────────────────────────────
  static readonly LOGO = 'a.logo, a[href="/"], header a img, .logo a';

  // ── Nav chính ─────────────────────────────────────────────────────────────
  static readonly NAV_TRANG_GV      = "a:has-text('Trang giáo viên')";
  static readonly NAV_HOI_DAP       = "a:has-text('Hỏi đáp')";
  static readonly NAV_KHO_DE        = "a:has-text('Kho đề')";
  static readonly NAV_CUOC_THI_VUI  = "a:has-text('Cuộc thi vui')";
  static readonly NAV_DAU_TRUONG    = "a:has-text('Đấu trường')";
  static readonly NAV_THU_VIEN_SO   = "a:has-text('Thư viện số')";
  static readonly NAV_BAI_VIET      = "a:has-text('Bài viết')";

  // ── Auth / User ───────────────────────────────────────────────────────────
  static readonly LOGIN_BTN         = "a:has-text('Đăng nhập')";
  static readonly REGISTER_BTN      = "a:has-text('Đăng ký')";
  static readonly USER_AVATAR       = '.user-dropdown, .avatar, .dropdown-user';
  static readonly MESSAGE_ICON      = ".icon-message, a[href*='/messages'], [aria-label*='tin nhắn']";
  static readonly NOTIFICATION_ICON = ".icon-notification, .bell-icon, [aria-label*='thông báo']";

  // ── Announcement bar ──────────────────────────────────────────────────────
  static readonly ANNOUNCEMENT_BAR  = '.announcement-bar, .top-banner, [class*="announce"]';

  // ── VIP info (chỉ khi đã đăng nhập) ─────────────────────────────────────
  static readonly VIP_BADGE         = '.vip-badge, [class*="vip"]';

  // ─────────────────────────────────────────────────────────────────────────

  async open(): Promise<this> {
    await this.navigateTo(HeaderHomePage.URL);
    return this;
  }

  async clickLogo(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.LOGO], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavTrangGiaoVien(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_TRANG_GV], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavHoiDap(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_HOI_DAP], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavKhoDe(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_KHO_DE], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavCuocThiVui(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_CUOC_THI_VUI], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavDauTruong(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_DAU_TRUONG], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavThuVienSo(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_THU_VIEN_SO], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavBaiViet(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.NAV_BAI_VIET], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickTopThiDau(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.TOP_THI_DAU], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickTopDanhGiaNangLuc(): Promise<this> {
    const el = await this.findVisible([HeaderHomePage.TOP_DANH_GIA_NL], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  // ── Trạng thái ────────────────────────────────────────────────────────────

  async isLoginButtonPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderHomePage.LOGIN_BTN], 5)) !== null;
  }

  async isUserAvatarPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderHomePage.USER_AVATAR], 5)) !== null;
  }

  async isAnnouncementBarPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderHomePage.ANNOUNCEMENT_BAR], 5)) !== null;
  }

  async isVipBadgePresent(): Promise<boolean> {
    return (await this.findVisible([HeaderHomePage.VIP_BADGE], 3)) !== null;
  }
}