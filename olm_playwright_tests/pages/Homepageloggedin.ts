import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { BASE_URL } from '../config/config';

/**
 * Page Object – Trang chủ OLM (trạng thái đã đăng nhập).
 *
 * Dựa trên HTML thực tế của olm.vn (tháng 6/2026):
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  USER CARD (tw-bg-black/10 …)                                    │
 * │   avatar | tên | VIP tag | còn N ngày | Trang giáo viên | Gia hạn│
 * ├──────────────────────────────────────────────────────────────────┤
 * │  NAVBAR (div.navbar)                                              │
 * │   CSKH | ĐK nhận PPT | Lớp học của tôi | Bài đã giao             │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  PROMOTIONAL BANNER (img – ưu đãi gói SVIP)                      │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  TYPICAL COURSES (section – carousel owl)                         │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  LEARNING LIBRARY (kho học liệu – grade selector + cards)         │
 * │   OLM KIDS banner                                                  │
 * │   Segment: Tiểu học / THCS / THPT                                  │
 * │   Grade cards: Lớp 1–12                                            │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  WHY OLM (section – tabs: Học sinh / Phụ huynh / GV / Nhà trường) │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  ECOSYSTEM PRODUCTS (carousel: TKB / ĐGNL / Marker / OLM Class)  │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  NEWS (Dành cho học sinh | Dành cho giáo viên)                    │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  TESTIMONIALS (tabs + marquee)                                    │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  FOOTER                                                           │
 * └──────────────────────────────────────────────────────────────────┘
 */
export class HomePageLoggedIn extends BasePage {

  // ══════════════════════════════════════════════════════════════════
  // A. USER CARD
  // ══════════════════════════════════════════════════════════════════
  /** Card chứa avatar + tên + VIP (tw-bg-black/10) – lấy cái đầu tiên */
  readonly userCard: Locator;

  /** Avatar img – src="/avatars/guest.png" (server đôi khi dùng ảnh thật) */
  readonly userAvatar: Locator;

  /** Tên người dùng (<strong>) trong user card */
  readonly userDisplayName: Locator;

  /** Username handle (<span class="tw-text-accent-light">) */
  readonly userHandle: Locator;

  /** Link tới trang VIP (href="/thong-tin-tai-khoan/vip") */
  readonly vipTag: Locator;

  /** Text "Còn N ngày" */
  readonly vipDaysRemaining: Locator;

  /** Nút "Trang giáo viên" trong user card */
  readonly btnTeacherPage: Locator;

  /** Nút "Gia hạn VIP" trong user card */
  readonly btnExtendVip: Locator;

  // ══════════════════════════════════════════════════════════════════
  // B. QUICK-ACTION NAVBAR (div.navbar)
  // ══════════════════════════════════════════════════════════════════
  /** Nút CSKH (data-toggle="modal" data-target="#modal-contact-customer-service") */
  readonly btnCSKH: Locator;

  /** Link "ĐK nhận PPT" → /dk-nhan-thong-bao */
  readonly linkDKNhanPPT: Locator;

  /** Link "Lớp học của tôi" → /doi-tac/.../danh-sach-nhom */
  readonly linkMyClass: Locator;

  /** Link "Bài đã giao" → /bai-da-giao */
  readonly linkAssignedWork: Locator;

  // ══════════════════════════════════════════════════════════════════
  // C. PROMOTIONAL BANNER
  // ══════════════════════════════════════════════════════════════════
  /** Banner ưu đãi SVIP (img ngay dưới navbar) */
  readonly promoBanner: Locator;

  // ══════════════════════════════════════════════════════════════════
  // D. TYPICAL COURSES (Khóa học tiêu biểu)
  // ══════════════════════════════════════════════════════════════════
  /** Section tiêu đề "Khóa học tiêu biểu" */
  readonly sectionTypicalCourses: Locator;

  /** Carousel owl cho khóa học tiêu biểu */
  readonly carouselTypicalCourses: Locator;

  /** Nút prev carousel */
  readonly carouselPrevBtn: Locator;

  /** Nút next carousel */
  readonly carouselNextBtn: Locator;

  /** Các card khóa học active (owl-item.active) */
  readonly activeCourseCards: Locator;

  // ══════════════════════════════════════════════════════════════════
  // E. LEARNING LIBRARY (Kho học liệu)
  // ══════════════════════════════════════════════════════════════════
  /** Banner OLM KIDS */
  readonly olmKidsBanner: Locator;

  /** Segment tabs cấp học (Tiểu học / THCS / THPT) – mobile */
  readonly gradeSegmentMobile: Locator;

  /** Tab "Khối Tiểu học" trong segment mobile */
  readonly tabTieuHoc: Locator;

  /** Tab "Khối THCS" */
  readonly tabTHCS: Locator;

  /** Tab "Khối THPT" */
  readonly tabTHPT: Locator;

  /** Card lớp học (desktop) - ví dụ lớp 1 */
  gradeCardDesktop(grade: number): Locator {
    return this.page.locator(
      `.tw-hidden.lg\\:tw-flex a[href*="/lop-${grade}"][title*="lớp ${grade}"]`
    ).first();
  }

  /** Card lớp học (mobile) */
  gradeCardMobile(grade: number): Locator {
    return this.page.locator(
      `#grade-level-1-content a[href*="/lop-${grade}"], #grade-level-2-content a[href*="/lop-${grade}"], #grade-level-3-content a[href*="/lop-${grade}"]`
    ).first();
  }

  // ══════════════════════════════════════════════════════════════════
  // F. WHY OLM (tabs: Học sinh / Phụ huynh / GV / Nhà trường)
  // ══════════════════════════════════════════════════════════════════
  /** Section "OLM đáp ứng nhu cầu của mọi đối tượng" */
  readonly sectionWhyOlm: Locator;

  /** Tab "Học sinh" trong segment why */
  readonly tabWhyStudent: Locator;

  /** Tab "Phụ huynh" */
  readonly tabWhyParent: Locator;

  /** Tab "Giáo viên" */
  readonly tabWhyTeacher: Locator;

  /** Tab "Nhà trường" */
  readonly tabWhySchool: Locator;

  /** Content block Học sinh (active theo mặc định) */
  readonly contentWhyStudent: Locator;

  // ══════════════════════════════════════════════════════════════════
  // G. ECOSYSTEM PRODUCTS (carousel)
  // ══════════════════════════════════════════════════════════════════
  readonly sectionEcosystem: Locator;
  readonly carouselEcosystem: Locator;

  // ══════════════════════════════════════════════════════════════════
  // H. NEWS SECTION
  // ══════════════════════════════════════════════════════════════════
  /** Block tin tức "Dành cho học sinh" */
  readonly newsStudentBlock: Locator;

  /** Block tin tức "Dành cho giáo viên" */
  readonly newsTeacherBlock: Locator;

  /** Bài báo đầu tiên trong block học sinh */
  readonly firstStudentArticle: Locator;

  // ══════════════════════════════════════════════════════════════════
  // I. TESTIMONIALS
  // ══════════════════════════════════════════════════════════════════
  readonly sectionTestimonials: Locator;
  readonly testimonialTabStudent: Locator;
  readonly testimonialTabParent: Locator;
  readonly btnViewAllTestimonials: Locator;

  // ══════════════════════════════════════════════════════════════════
  // J. FOOTER
  // ══════════════════════════════════════════════════════════════════
  readonly footer: Locator;
  readonly footerLogo: Locator;
  readonly footerScrollTop: Locator;
  readonly footerFacebook: Locator;
  readonly footerYoutube: Locator;
  readonly footerZalo: Locator;
  readonly footerAppStore: Locator;
  readonly footerGooglePlay: Locator;

  // ══════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ══════════════════════════════════════════════════════════════════
  constructor(page: Page) {
    super(page);

    // A. User card
    this.userCard          = page.locator('.tw-bg-black\\/10').first();
    this.userAvatar        = page.locator('.tw-bg-black\\/10 img[src*="avatars"]').first();
    this.userDisplayName   = page.locator('.tw-bg-black\\/10 strong').first();
    this.userHandle        = page.locator('.tw-bg-black\\/10 span.tw-text-accent-light').first();
    this.vipTag            = page.locator('a[href*="/thong-tin-tai-khoan/vip"]').first();
    this.vipDaysRemaining  = page.locator('.tw-bg-black\\/10 span.tw-text-accent-light-2').first();
    this.btnTeacherPage    = page.locator('a[href*="olm.vn/home"]:has-text("Trang giáo viên")').first();
    this.btnExtendVip      = page.locator('a[href*="mua-vip"]:has-text("Gia hạn VIP")').first();

    // B. Quick-action navbar
    this.btnCSKH           = page.locator('button[data-target="#modal-contact-customer-service"]').first();
    this.linkDKNhanPPT     = page.locator('a[href*="dk-nhan-thong-bao"]').first();
    this.linkMyClass       = page.locator('a[href*="danh-sach-nhom"]').first();
    this.linkAssignedWork  = page.locator('a[href*="bai-da-giao"]').first();

    // C. Promo banner
    this.promoBanner = page.locator('img[alt*="OLM thông báo"], img[alt*="ưu đãi"]').first();

    // D. Typical courses
    this.sectionTypicalCourses = page.locator('section:has(.typical-courses-carousel)');
    this.carouselTypicalCourses = page.locator('#typical-courses-carousel');
    this.carouselPrevBtn = page.locator('#typical-courses-carousel .owl-prev').first();
    this.carouselNextBtn = page.locator('#typical-courses-carousel .owl-next').first();
    this.activeCourseCards = page.locator('#typical-courses-carousel .owl-item.active .tw-olm-card-course');

    // E. Learning library
    this.olmKidsBanner   = page.locator('a[href*="olm.vn/kids"]');
    this.gradeSegmentMobile = page.locator('#segment-v2-grade-section');
    this.tabTieuHoc      = page.locator('#segment-v2-grade-section [data-type="grade-level-1"]');
    this.tabTHCS         = page.locator('#segment-v2-grade-section [data-type="grade-level-2"]');
    this.tabTHPT         = page.locator('#segment-v2-grade-section [data-type="grade-level-3"]');

    // F. Why OLM
    this.sectionWhyOlm   = page.locator('section:has(#segment-v2-why-section)').first();
    this.tabWhyStudent   = page.locator('#segment-v2-why-section [data-type="student"]').first();
    this.tabWhyParent    = page.locator('#segment-v2-why-section [data-type="parent"]').first();
    this.tabWhyTeacher   = page.locator('#segment-v2-why-section [data-type="teacher"]').first();
    this.tabWhySchool    = page.locator('#segment-v2-why-section [data-type="school"]').first();
    this.contentWhyStudent = page.locator('#student-content').first();

    // G. Ecosystem
    this.sectionEcosystem  = page.locator('#ecosystem-products').locator('..');
    this.carouselEcosystem = page.locator('#ecosystem-products');

    // H. News
    this.newsStudentBlock    = page.locator('a[href*="danh-cho-hoc-sinh"]').locator('../..');
    this.newsTeacherBlock    = page.locator('a[href*="goc-danh-cho-phu-huynh"]').locator('../..');
    this.firstStudentArticle = page.locator('a[href*="danh-cho-hoc-sinh"]').locator('../../..').locator('article').first();

    // I. Testimonials
    this.sectionTestimonials     = page.locator('section:has(#segment-v2-testimonials-section)').first();
    this.testimonialTabStudent   = page.locator('#segment-v2-testimonials-section [data-type="student"]').first();
    this.testimonialTabParent    = page.locator('#segment-v2-testimonials-section [data-type="parent"]').first();
    this.btnViewAllTestimonials  = page.locator('a[href*="phan-hoi-khach-hang"]').first();

    // J. Footer
    this.footer          = page.locator('footer').first();
    this.footerLogo      = page.locator('footer img[alt="OLM"]').first();
    this.footerScrollTop = page.locator('footer button[onclick*="scrollTo"]').first();
    this.footerFacebook  = page.locator('footer a[href*="facebook.com"]').first();
    this.footerYoutube   = page.locator('footer a[href*="youtube.com"]').first();
    this.footerZalo      = page.locator('footer a[href*="zalo.me"]').first();
    this.footerAppStore  = page.locator('footer a[href*="apps.apple.com"]').first();
    this.footerGooglePlay= page.locator('footer a[href*="play.google.com"]').first();
  }

  // ══════════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════════

  async open(): Promise<this> {
    await this.navigateTo(BASE_URL);
    return this;
  }

  /** Lấy tên hiển thị từ user card */
  async getUserDisplayName(): Promise<string> {
    return (await this.userDisplayName.textContent())?.trim() ?? '';
  }

  /** Lấy username handle */
  async getUserHandle(): Promise<string> {
    return (await this.userHandle.textContent())?.trim() ?? '';
  }

  /** Lấy text "Còn N ngày" */
  async getVipDaysText(): Promise<string> {
    return (await this.vipDaysRemaining.textContent())?.trim() ?? '';
  }

  /** Click tab cấp học mobile */
  async switchGradeTab(level: 'tieuHoc' | 'thcs' | 'thpt'): Promise<void> {
    const map = {
      tieuHoc: this.tabTieuHoc,
      thcs: this.tabTHCS,
      thpt: this.tabTHPT,
    };
    await map[level].click();
    await this.page.waitForTimeout(300);
  }

  /** Click tab Why OLM */
  async switchWhyTab(tab: 'student' | 'parent' | 'teacher' | 'school'): Promise<void> {
    const map = {
      student: this.tabWhyStudent,
      parent:  this.tabWhyParent,
      teacher: this.tabWhyTeacher,
      school:  this.tabWhySchool,
    };
    await map[tab].click();
    await this.page.waitForTimeout(400);
  }

  /** Đếm số course card đang active trong carousel */
  async countActiveCourseCards(): Promise<number> {
    return this.activeCourseCards.count();
  }

  /** Click nút next carousel typical courses */
  async clickCarouselNext(): Promise<void> {
    await this.carouselNextBtn.click();
    await this.page.waitForTimeout(400);
  }

  /** Kiểm tra section Why OLM đang hiển thị content đúng tab */
  async getVisibleWhyContent(): Promise<string> {
    const ids = ['student-content', 'parent-content', 'teacher-content', 'school-content'];
    for (const id of ids) {
      const el = this.page.locator(`#${id}`).first();
      if (await el.isVisible({ timeout: 1_000 }).catch(() => false)) {
        return id.replace('-content', '');
      }
    }
    return '';
  }
}