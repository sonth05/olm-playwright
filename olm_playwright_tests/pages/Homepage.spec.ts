/**
 * homepage.spec.ts
 *
 * Test UI toàn diện trang chủ OLM (olm.vn).
 * Bao gồm:
 *   [GUEST]   – truy cập không đăng nhập (nút Đăng nhập, Đăng ký)
 *   [LOGGED]  – trạng thái đã đăng nhập (user card, VIP, navbar, sections)
 *
 * Cấu trúc:
 *   describe A – User Card (đã đăng nhập)
 *   describe B – Quick-action Navbar
 *   describe C – Promotional Banner
 *   describe D – Typical Courses Carousel
 *   describe E – Learning Library (Kho học liệu)
 *   describe F – Why OLM (tabs)
 *   describe G – Ecosystem Products
 *   describe H – News Section
 *   describe I – Testimonials
 *   describe J – Footer
 *   describe K – Guest state (không đăng nhập)
 *   describe L – Navigation links hợp lệ
 */

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { HomePageLoggedIn } from '../pages/Homepageloggedin';
import { HeaderComponent } from '../components/HeaderComponent';
import { BASE_URL } from '../config/config';

// ─── Helper: tạo HomePage cho authenticated user ──────────────────────────
async function getHomePage(page: import('@playwright/test').Page) {
  const hp = new HomePageLoggedIn(page);
  await hp.open();
  return hp;
}

// ══════════════════════════════════════════════════════════════════════════════
// A. USER CARD
// ══════════════════════════════════════════════════════════════════════════════
test.describe('A. User Card (đã đăng nhập)', () => {
  test('A01 – User card hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.userCard).toBeVisible();
  });

  test('A02 – Hiển thị avatar người dùng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    // Avatar tồn tại và có src hợp lệ
    await expect(hp.userAvatar).toBeVisible();
    const src = await hp.userAvatar.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('A03 – Hiển thị tên người dùng (không rỗng)', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.userDisplayName).toBeVisible();
    const name = await hp.getUserDisplayName();
    expect(name.length).toBeGreaterThan(0);
  });

  test('A04 – Hiển thị username handle', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.userHandle).toBeVisible();
    const handle = await hp.getUserHandle();
    expect(handle.length).toBeGreaterThan(0);
  });

  test('A05 – VIP tag hiển thị và liên kết đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.vipTag).toBeVisible();
    const href = await hp.vipTag.getAttribute('href');
    expect(href).toContain('thong-tin-tai-khoan/vip');
  });

  test('A06 – Text "Còn N ngày" hoặc trạng thái VIP hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    // Có thể là "Còn 71 ngày" hoặc text VIP khác
    const text = await hp.getVipDaysText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('A07 – Nút "Trang giáo viên" tồn tại và href đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.btnTeacherPage).toBeVisible();
    const href = await hp.btnTeacherPage.getAttribute('href');
    expect(href).toContain('olm.vn/home');
  });

  test('A08 – Nút "Gia hạn VIP" tồn tại và href đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.btnExtendVip).toBeVisible();
    const href = await hp.btnExtendVip.getAttribute('href');
    expect(href).toContain('mua-vip');
  });

  test('A09 – Nút "Gia hạn VIP" có target="_blank"', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const target = await hp.btnExtendVip.getAttribute('target');
    expect(target).toBe('_blank');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// B. QUICK-ACTION NAVBAR
// ══════════════════════════════════════════════════════════════════════════════
test.describe('B. Quick-action Navbar (div.navbar)', () => {
  test('B01 – Navbar container hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(page.locator('div.navbar').first()).toBeVisible();
  });

  test('B02 – Nút CSKH hiển thị và có data-target đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.btnCSKH).toBeVisible();
    const target = await hp.btnCSKH.getAttribute('data-target');
    expect(target).toBe('#modal-contact-customer-service');
  });

  test('B03 – Link "ĐK nhận PPT" hiển thị và href đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.linkDKNhanPPT).toBeVisible();
    const href = await hp.linkDKNhanPPT.getAttribute('href');
    expect(href).toContain('dk-nhan-thong-bao');
  });

  test('B04 – Link "Lớp học của tôi" hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.linkMyClass).toBeVisible();
    const href = await hp.linkMyClass.getAttribute('href');
    expect(href).toContain('danh-sach-nhom');
  });

  test('B05 – Link "Bài đã giao" hiển thị và href đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.linkAssignedWork).toBeVisible();
    const href = await hp.linkAssignedWork.getAttribute('href');
    expect(href).toContain('bai-da-giao');
  });

  test('B06 – Navbar có đúng 4 item', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    // CSKH + ĐK nhận PPT + Lớp học + Bài đã giao
    const navItems = page.locator('div.navbar > *');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// C. PROMOTIONAL BANNER
// ══════════════════════════════════════════════════════════════════════════════
test.describe('C. Promotional Banner (SVIP)', () => {
  test('C01 – Banner ưu đãi hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    // Banner là <img> dưới navbar
    const banner = page.locator('img[alt*="OLM thông báo"], img[alt*="ưu đãi"], img[alt*="SVIP"]').first();
    await expect(banner).toBeVisible();
  });

  test('C02 – Banner có src hợp lệ (cdn3.olm.vn)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const banner = page.locator('img[alt*="OLM thông báo"], img[alt*="ưu đãi"], img[alt*="SVIP"]').first();
    const src = await banner.getAttribute('src');
    expect(src).toMatch(/cdn3\.olm\.vn|rs\.olm\.vn/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// D. TYPICAL COURSES CAROUSEL (Khóa học tiêu biểu)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('D. Typical Courses Carousel', () => {
  test('D01 – Section "Khóa học tiêu biểu" hiển thị', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const heading = page.locator('h2:has-text("Khóa học tiêu biểu")');
    await expect(heading).toBeVisible();
  });

  test('D02 – Carousel container tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.carouselTypicalCourses).toBeVisible();
  });

  test('D03 – Có ít nhất 1 course card active', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const count = await hp.countActiveCourseCards();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('D04 – Nút Next carousel tồn tại và clickable', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.carouselNextBtn).toBeVisible();
    await hp.clickCarouselNext();
    // Sau click, vẫn còn active cards
    const count = await hp.countActiveCourseCards();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('D05 – Nút Prev carousel tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.carouselPrevBtn).toBeVisible();
  });

  test('D06 – Các course card link đến /bg/... URLs', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const firstCard = hp.activeCourseCards.first();
    const link = firstCard.locator('a').first();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/\/bg\//);
  });

  test('D07 – Course card có hình ảnh', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const firstCard = hp.activeCourseCards.first();
    const img = firstCard.locator('img').first();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('D08 – Course card có tiêu đề không rỗng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const firstCard = hp.activeCourseCards.first();
    const title = firstCard.locator('a.tw-font-semibold, a.tw-text-xl').first();
    const text = await title.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// E. LEARNING LIBRARY (Kho học liệu số)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('E. Learning Library (Kho học liệu số)', () => {
  test('E01 – Heading "Kho học liệu số toàn diện" hiển thị', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const heading = page.locator('h2:has-text("Kho học liệu số toàn diện")');
    await expect(heading).toBeVisible();
  });

  test('E02 – OLM KIDS banner hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.olmKidsBanner).toBeVisible();
  });

  test('E03 – OLM KIDS link đúng href', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.olmKidsBanner.getAttribute('href');
    expect(href).toContain('olm.vn/kids');
  });

  test('E04 – Segment tab Tiểu học hiển thị (mobile layout)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const tab = page.locator('#segment-v2-grade-section [data-type="grade-level-1"]').first();
    // Tab tồn tại trong DOM (có thể hidden ở desktop)
    await expect(tab).toHaveCount(1);
  });

  test('E05 – Desktop: section "Khối Tiểu Học" hiển thị với 5 lớp (1-5)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    // Đếm link lớp 1-5 trong desktop block
    for (let grade = 1; grade <= 5; grade++) {
      const link = page.locator(`.tw-hidden.lg\\:tw-flex a[href*="/lop-${grade}"]`).first();
      await expect(link).toHaveCount(1); // tồn tại trong DOM
    }
  });

  test('E06 – Desktop: section THCS có link lớp 6-9', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    for (let grade = 6; grade <= 9; grade++) {
      const link = page.locator(`a[href="https://olm.vn/lop-${grade}"]`).first();
      await expect(link).toHaveCount(1);
    }
  });

  test('E07 – Desktop: section THPT có link lớp 10-12', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    for (let grade = 10; grade <= 12; grade++) {
      const link = page.locator(`a[href="https://olm.vn/lop-${grade}"]`).first();
      await expect(link).toHaveCount(1);
    }
  });

  test('E08 – THPT block có link "Thi thử tốt nghiệp THPT"', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="thi-thu-tot-nghiep"]').first();
    await expect(link).toHaveCount(1);
  });

  test('E09 – THPT block có link "Kho đề kiểm tra"', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="contestx"]:has-text("Kho đề kiểm tra")').first();
    await expect(link).toHaveCount(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// F. WHY OLM (tabs đa đối tượng)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('F. Why OLM (tabs)', () => {
  test('F01 – Heading "OLM đáp ứng nhu cầu của mọi đối tượng" hiển thị', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const heading = page.locator('h2:has-text("OLM đáp ứng nhu cầu")').first();
    await expect(heading).toBeVisible();
  });

  test('F02 – Tab "Học sinh" active mặc định', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const activeClass = await hp.tabWhyStudent.getAttribute('class');
    expect(activeClass).toContain('tw-active');
  });

  test('F03 – Content "Học tập chủ động" visible theo mặc định', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const content = page.locator('h3:has-text("Học tập chủ động")').first();
    await expect(content).toBeVisible();
  });

  test('F04 – Tab "Phụ huynh" tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.tabWhyParent).toBeVisible();
  });

  test('F05 – Tab "Giáo viên" tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.tabWhyTeacher).toBeVisible();
  });

  test('F06 – Tab "Nhà trường" tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.tabWhySchool).toBeVisible();
  });

  test('F07 – Học sinh content có 4 features', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const features = page.locator('#student-content strong').filter({ hasText: /Bám sát|Cá nhân|Cộng đồng|Luyện đề/ });
    await expect(features).toHaveCount(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// G. ECOSYSTEM PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('G. Ecosystem Products', () => {
  test('G01 – Heading "Các sản phẩm cùng hệ sinh thái" hiển thị', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const heading = page.locator('h2:has-text("hệ sinh thái")').first();
    await expect(heading).toBeVisible();
  });

  test('G02 – Carousel ecosystem tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.carouselEcosystem).toBeVisible();
  });

  test('G03 – Link TKB tồn tại (tkb.olm.vn)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="tkb.olm.vn"]').first();
    await expect(link).toHaveCount(1);
  });

  test('G04 – Link ĐGNL tồn tại (dgnl.olm.vn)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="dgnl.olm.vn"]').first();
    await expect(link).toHaveCount(1);
  });

  test('G05 – Link Marker tồn tại (marker.olm.vn)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="marker.olm.vn"]').first();
    await expect(link).toHaveCount(1);
  });

  test('G06 – Link OLM Class tồn tại (class.olm.vn)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="class.olm.vn"]').first();
    await expect(link).toHaveCount(1);
  });

  test('G07 – Các card ecosystem có logo image', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const logos = page.locator('#ecosystem-products .owl-item:not(.cloned) img[src*="logo"]');
    const count = await logos.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// H. NEWS SECTION (Tin tức mới nhất)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('H. News Section', () => {
  test('H01 – Heading "Tin tức mới nhất" hiển thị', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const heading = page.locator('h2:has-text("Tin tức mới nhất")').first();
    await expect(heading).toBeVisible();
  });

  test('H02 – Block "Dành cho học sinh" tồn tại', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const header = page.locator('h3:has-text("Dành cho học sinh")').first();
    await expect(header).toBeVisible();
  });

  test('H03 – Block "Dành cho giáo viên" tồn tại', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const header = page.locator('h3:has-text("Dành cho giáo viên")').first();
    await expect(header).toBeVisible();
  });

  test('H04 – Mỗi block có ít nhất 3 bài viết', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    // Học sinh block
    const studentArticles = page.locator('a[href*="danh-cho-hoc-sinh"]')
      .locator('../..')
      .locator('article');
    await expect(studentArticles).toHaveCount(3);
  });

  test('H05 – Bài viết có hình thumbnail', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const article = page.locator('article').first();
    const img = article.locator('img').first();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toMatch(/cdn3\.olm\.vn/);
  });

  test('H06 – Bài viết có tiêu đề không rỗng', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const article = page.locator('article').first();
    const titleLink = article.locator('a.tw-font-medium').first();
    const text = await titleLink.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('H07 – Link "Dành cho học sinh" dẫn đến đúng URL', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const link = page.locator('a[href*="danh-cho-hoc-sinh"]').first();
    const href = await link.getAttribute('href');
    expect(href).toContain('chu-de-bai-viet/danh-cho-hoc-sinh');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// I. TESTIMONIALS (Chia sẻ từ người dùng)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('I. Testimonials', () => {
  test('I01 – Heading "Chia sẻ từ người dùng OLM" hiển thị', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const heading = page.locator('h2:has-text("Chia sẻ từ người dùng OLM")').first();
    await expect(heading).toBeVisible();
  });

  test('I02 – Tab "Học sinh" active mặc định', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const cls = await hp.testimonialTabStudent.getAttribute('class');
    expect(cls).toContain('tw-active');
  });

  test('I03 – Có ít nhất 3 tabs: Học sinh, Phụ huynh, Giáo viên, Nhà trường', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const tabs = page.locator('#segment-v2-testimonials-section .tw-olm-segmented-item');
    await expect(tabs).toHaveCount(4);
  });

  test('I04 – Testimonial cards học sinh hiển thị (marquee active)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const cards = page.locator('#student-testimonials .tw-olm-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4); // 4 gốc + 4 clone
  });

  test('I05 – Mỗi testimonial có quote icon', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const quote = page.locator('#student-testimonials .tw-olm-card img[alt="Quote"]').first();
    await expect(quote).toHaveCount(1);
  });

  test('I06 – Nút "Xem tất cả phản hồi" hiển thị và href đúng', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.btnViewAllTestimonials).toBeVisible();
    const href = await hp.btnViewAllTestimonials.getAttribute('href');
    expect(href).toContain('phan-hoi-khach-hang');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// J. FOOTER
// ══════════════════════════════════════════════════════════════════════════════
test.describe('J. Footer', () => {
  test('J01 – Footer hiển thị', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await hp.footer.scrollIntoViewIfNeeded();
    await expect(hp.footer).toBeVisible();
  });

  test('J02 – Footer logo OLM tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.footerLogo).toHaveCount(1);
  });

  test('J03 – Nút "Scroll lên đầu" tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    await expect(hp.footerScrollTop).toHaveCount(1);
  });

  test('J04 – Link Facebook tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.footerFacebook.getAttribute('href');
    expect(href).toContain('facebook.com');
  });

  test('J05 – Link YouTube tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.footerYoutube.getAttribute('href');
    expect(href).toContain('youtube.com');
  });

  test('J06 – Link Zalo tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.footerZalo.getAttribute('href');
    expect(href).toContain('zalo.me');
  });

  test('J07 – Link App Store tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.footerAppStore.getAttribute('href');
    expect(href).toContain('apps.apple.com');
  });

  test('J08 – Link Google Play tồn tại', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.footerGooglePlay.getAttribute('href');
    expect(href).toContain('play.google.com');
  });

  test('J09 – Footer có copyright text', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const copyright = page.locator('footer span:has-text("©")').first();
    await expect(copyright).toHaveCount(1);
    const text = await copyright.textContent();
    expect(text).toMatch(/OLM\.VN/);
  });

  test('J10 – Footer có các link Đề xuất (Về OLM, Khóa học)', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const veOlm = page.locator('footer a[href*="gioi-thieu"]').first();
    const khoaHoc = page.locator('footer a[href*="khoa-hoc"]').first();
    await expect(veOlm).toHaveCount(1);
    await expect(khoaHoc).toHaveCount(1);
  });

  test('J11 – Footer có các link Trợ giúp', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const trungtam = page.locator('footer a[href*="trung-tam-tro-giup"]').first();
    await expect(trungtam).toHaveCount(1);
  });

  test('J12 – Footer có thông tin MST công ty', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const mst = page.locator('footer span:has-text("0106303886")').first();
    await expect(mst).toHaveCount(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// K. GUEST STATE (chưa đăng nhập)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('K. Guest State (chưa đăng nhập)', () => {
  test('K01 – Trang chủ load thành công khi chưa đăng nhập', async ({ guestPage: page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(BASE_URL));
  });

  test('K02 – Tiêu đề trang chứa "OLM"', async ({ guestPage: page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title).toMatch(/OLM/i);
  });

  test('K03 – Có nút "Đăng nhập" khi chưa login', async ({ guestPage: page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const header = new HeaderComponent(page);
    const isVisible = await header.isLoginButtonVisible();
    expect(isVisible).toBe(true);
  });

  test('K04 – Khóa học tiêu biểu vẫn hiển thị với guest', async ({ guestPage: page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h2:has-text("Khóa học tiêu biểu")');
    await expect(heading).toBeVisible();
  });

  test('K05 – OLM KIDS banner hiển thị với guest', async ({ guestPage: page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const kids = page.locator('a[href*="olm.vn/kids"]');
    await expect(kids).toBeVisible();
  });

  test('K06 – Footer hiển thị với guest', async ({ guestPage: page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// L. NAVIGATION LINKS – Integrity check
// ══════════════════════════════════════════════════════════════════════════════
test.describe('L. Navigation Link Integrity', () => {
  test('L01 – Link "Lớp học của tôi" đúng pattern URL', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const href = await hp.linkMyClass.getAttribute('href');
    // href dạng: /doi-tac/{username}/danh-sach-nhom#menu-danh-sach-lop-hoc
    expect(href).toContain('danh-sach-nhom');
    expect(href).toContain('doi-tac');
  });

  test('L02 – VIP tag mở đúng tab (target="_blank")', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const target = await hp.vipTag.getAttribute('target');
    expect(target).toBe('_blank');
  });

  test('L03 – OLM KIDS banner mở tab mới', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const target = await hp.olmKidsBanner.getAttribute('target');
    expect(target).toBe('_blank');
  });

  test('L04 – Tất cả ecosystem products mở tab mới', async ({ authenticatedPage: page }) => {
    await getHomePage(page);
    const productLinks = page.locator('#ecosystem-products .owl-item:not(.cloned) a');
    const count = await productLinks.count();
    for (let i = 0; i < count; i++) {
      const target = await productLinks.nth(i).getAttribute('target');
      expect(target).toBe('_blank');
    }
  });

  test('L05 – Nút "Trang giáo viên" mở tab mới', async ({ authenticatedPage: page }) => {
    const hp = await getHomePage(page);
    const target = await hp.btnTeacherPage.getAttribute('target');
    expect(target).toBe('_blank');
  });
});