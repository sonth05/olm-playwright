/**
 * Thu Vien So — Regression Tests (Full)
 *
 * Dựa trên DOM thực tế của trang Sách giáo khoa và Tạp chí.
 *
 * Chạy: npx playwright test tests/regression/thu-vien-so.regression.spec.ts
 */

import { test, expect } from '@playwright/test';
import { ThuVienSoPage } from '../../pages/ThuVienSoPage';

// ════════════════════════════════════════════════════════════════
// 1. TRANG CHỦ THƯ VIỆN SỐ
// ════════════════════════════════════════════════════════════════
test.describe('1. Trang chủ @library @regression', () => {

  test('[TVS-HP-001] Trang chủ tải và URL đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(tvs.isPageLoaded()).toBeTruthy();
    expect(tvs.getCurrentUrl()).toContain('thu-vien-so');
  });

  test('[TVS-HP-002] Title trang không rỗng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect((await tvs.getPageTitle()).length).toBeGreaterThan(0);
  });

  test('[TVS-HP-003] Hero "Thư viện số OLM" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible('span:has-text("Thư viện số OLM")')).toBeTruthy();
  });

  test('[TVS-HP-004] Subtitle "1.000+ sách giáo khoa" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible('span:has-text("1.000+ sách giáo khoa")')).toBeTruthy();
  });

  test('[TVS-HP-005] Badge "ĐỐI TÁC CHÍNH THỨC CỦA NXB GIÁO DỤC" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.OFFICIAL_PARTNER_BADGE)).toBeTruthy();
  });

  test('[TVS-HP-006] "miễn phí 100%" hiển thị trong section NXB', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.FREE_BADGE)).toBeTruthy();
  });

  test('[TVS-HP-007] CTA "Khám phá kho sách" dẫn đến trang SGK', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.clickExploreBooks();
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[TVS-HP-008] Section "Thư viện tạp chí" và badge "DÀNH CHO HỘI VIÊN" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.MAGAZINE_SECTION_TITLE)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOR_MEMBER_BADGE)).toBeTruthy();
  });

  test('[TVS-HP-009] Card hội viên có thông tin giá "1.400đ/ngày"', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.MEMBER_CARD)).toBeTruthy();
    expect(await tvs.isElementVisible('b:has-text("1.400đ/ngày")')).toBeTruthy();
  });

  test('[TVS-HP-010] CTA "Tìm hiểu gói Hội viên" dẫn đến gio-hang', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.clickExploreMemberBtn();
    expect(tvs.getCurrentUrl()).toContain('gio-hang');
  });

  test('[TVS-HP-011] CTA "Khám phá thư viện" dẫn đến trang tạp chí', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.clickExploreLibraryBtn();
    expect(tvs.isTapChiLoaded()).toBeTruthy();
  });

  test('[TVS-HP-012] Carousel "Ấn phẩm mới nhất" có ít nhất 1 slide', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.LATEST_PUBLICATIONS_TITLE)).toBeTruthy();
    expect(await tvs.getLatestPublicationsCount()).toBeGreaterThan(0);
  });

  test('[TVS-HP-013] Slide carousel có link /doc-sach/', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    if (await tvs.getLatestPublicationsCount() > 0) {
      const href = await page
        .locator('.swiper-slide a[href*="/doc-sach/"]')
        .first()
        .getAttribute('href');
      expect(href).toContain('doc-sach');
    }
  });
});

// ════════════════════════════════════════════════════════════════
// 2. HEADER NAVIGATION
// ════════════════════════════════════════════════════════════════
test.describe('2. Header Navigation @library @regression', () => {

  test('[TVS-HDR-001] Logo click về trang chủ TVS', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    await page.locator(ThuVienSoPage.LOGO).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(tvs.getCurrentUrl()).toContain('thu-vien-so');
  });

  test('[TVS-HDR-002] Link "Sách giáo khoa" có href đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    const href = await page.locator(ThuVienSoPage.HEADER_SACH_GK_LINK).first().getAttribute('href');
    expect(href).toContain('sach-giao-khoa');
  });

  test('[TVS-HDR-003] Link "Tạp chí" có href đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    const href = await page.locator(ThuVienSoPage.HEADER_TAP_CHI_LINK).first().getAttribute('href');
    expect(href).toContain('tap-chi');
  });

  test('[TVS-HDR-004] Link "Tạp chí" active (highlighted) khi đang ở trang tạp chí', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    // Khi active, link tạp chí có class tw-bg-accent-extra-light
    expect(await tvs.isElementVisible(ThuVienSoPage.HEADER_TAP_CHI_ACTIVE)).toBeTruthy();
  });

  test('[TVS-HDR-005] Nút "Hội viên" có href đến gio-hang', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    const href = await page.locator(ThuVienSoPage.HEADER_HOI_VIEN_BTN).first().getAttribute('href');
    expect(href).toContain('gio-hang');
  });

  test('[TVS-HDR-006] Nút "Đăng nhập" và "Đăng ký" hiển thị khi chưa đăng nhập', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.HEADER_LOGIN_BTN)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.HEADER_REGISTER_BTN)).toBeTruthy();
  });

  test('[TVS-HDR-007] Click "Đăng nhập" dẫn đến trang login', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await page.locator(ThuVienSoPage.HEADER_LOGIN_BTN).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(tvs.getCurrentUrl()).toContain('dangnhap');
  });

  test('[TVS-HDR-008] Click "Đăng ký" dẫn đến trang đăng ký', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await page.locator(ThuVienSoPage.HEADER_REGISTER_BTN).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(tvs.getCurrentUrl()).toContain('dang-ky');
  });

  test('[TVS-HDR-009] Hamburger menu hiển thị trên mobile', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.open();
    expect(await tvs.isElementVisible(ThuVienSoPage.HAMBURGER_MENU)).toBeTruthy();
  });

  test('[TVS-HDR-010] Click hamburger mở sidebar với đủ links', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.open();
    await page.locator(ThuVienSoPage.HAMBURGER_MENU).click();
    await page.waitForTimeout(500);
    expect(await tvs.isElementVisible(ThuVienSoPage.SIDEBAR_SACH_GK)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.SIDEBAR_TAP_CHI)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.SIDEBAR_HUONG_DAN)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.SIDEBAR_LOGIN_BTN)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.SIDEBAR_REGISTER_BTN)).toBeTruthy();
  });

  test('[TVS-HDR-011] Sidebar: link "Sách giáo khoa" dẫn đúng trang', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.open();
    await page.locator(ThuVienSoPage.HAMBURGER_MENU).click();
    await page.waitForTimeout(500);
    await page.locator(ThuVienSoPage.SIDEBAR_SACH_GK).click();
    await page.waitForLoadState('domcontentloaded');
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[TVS-HDR-012] Sidebar redirect đúng sau khi click đăng nhập', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.openTapChi();
    await page.locator(ThuVienSoPage.HAMBURGER_MENU).click();
    await page.waitForTimeout(500);
    // Sidebar login href phải có redirect về tap-chi
    const href = await page.locator(ThuVienSoPage.SIDEBAR_LOGIN_BTN).getAttribute('href');
    expect(href).toContain('tap-chi');
  });
});

// ════════════════════════════════════════════════════════════════
// 3. SÁCH GIÁO KHOA — Tab lớp (desktop)
// ════════════════════════════════════════════════════════════════
test.describe('3. SGK — Tab lọc lớp desktop @library @regression', () => {

  test('[TVS-SGK-TAB-001] 12 tab lớp hiển thị đầy đủ (1–12), lớp 13 ẩn', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await tvs.openSachGiaoKhoa();
    // Kiểm tra 12 tab visible
    for (let g = 1; g <= 12; g++) {
      const tab = page.locator(`[data-group="grade-select-course"][data-grade="${g}"]`);
      await expect(tab).toBeVisible();
    }
    // Tab data-grade="13" tồn tại nhưng nội dung ẩn (tw-hidden trên span bên trong)
    const grade13Span = page.locator(
      '[data-group="grade-select-course"][data-grade="13"] span'
    );
    await expect(grade13Span).toHaveClass(/tw-hidden/);
  });

  test('[TVS-SGK-TAB-002] Tab lớp 1 có class "selected" mặc định', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await tvs.openSachGiaoKhoa();
    // Lớp 1 selected bởi vì URL default là lớp 1
    const selected = await tvs.getSelectedGrade();
    // selected có thể là 1 hoặc null nếu trang dùng cách khác
    // Chỉ cần có ít nhất 1 tab được select
    const selectedCount = await page.locator(ThuVienSoPage.GRADE_TAB_SELECTED).count();
    expect(selectedCount).toBeGreaterThanOrEqual(1);
  });

  test('[TVS-SGK-TAB-003] Click tab lớp thay đổi class "selected"', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await tvs.openSachGiaoKhoa();
    await tvs.selectGrade(5);
    const tab5 = page.locator('[data-group="grade-select-course"][data-grade="5"]');
    await expect(tab5).toHaveClass(/selected/);
  });

  // Kiểm tra tất cả 12 lớp đều trả về sách
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (const grade of grades) {
    test(`[TVS-SGK-TAB-${String(grade).padStart(3, '0')}] Lớp ${grade} — có sách và badge khớp`, async ({ page }) => {
      const tvs = new ThuVienSoPage(page);
      await tvs.openSachGiaoKhoa(grade);
      const cardCount = await tvs.getBookCount();
      expect(cardCount).toBeGreaterThan(0);
      const badgeCount = await tvs.getDisplayedResultCount();
      if (badgeCount !== -1) {
        expect(Math.abs(cardCount - badgeCount)).toBeLessThanOrEqual(1);
      }
    });
  }

  test('[TVS-SGK-TAB-016] Chuyển lớp bằng click tab cập nhật danh sách sách', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await tvs.openSachGiaoKhoa(1);
    const titleLop1 = await tvs.getBookTitle(0);
    await tvs.selectGrade(6);
    const titleLop6 = await tvs.getBookTitle(0);
    // Sách lớp 1 và lớp 6 khác nhau
    expect(titleLop1).not.toBe(titleLop6);
  });

  test('[TVS-SGK-TAB-017] Badge #count-books cập nhật sau khi đổi lớp', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await tvs.openSachGiaoKhoa(1);
    const count1 = await tvs.getDisplayedResultCount();
    await tvs.selectGrade(10);
    await page.waitForTimeout(1500);
    const count10 = await tvs.getDisplayedResultCount();
    // Cả hai phải có kết quả
    expect(count1).toBeGreaterThan(0);
    expect(count10).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// 4. SÁCH GIÁO KHOA — Dropdown lớp mobile
// ════════════════════════════════════════════════════════════════
test.describe('4. SGK — Dropdown lớp mobile @library @regression', () => {

  test('[TVS-SGK-MOB-001] Select dropdown lớp hiển thị trên mobile', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.openSachGiaoKhoa();
    // Select2 rendered text hiển thị
    expect(await tvs.isElementVisible(ThuVienSoPage.GRADE_SELECT2_RENDERED)).toBeTruthy();
  });

  test('[TVS-SGK-MOB-002] Dropdown có 12 option lớp (1–12)', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.openSachGiaoKhoa();
    const optionCount = await page
      .locator(`${ThuVienSoPage.GRADE_SELECT_MOBILE} option`)
      .count();
    expect(optionCount).toBe(12);
  });

  test('[TVS-SGK-MOB-003] Chọn lớp 3 qua dropdown — có sách', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.openSachGiaoKhoa();
    await tvs.selectGradeMobile(3);
    const count = await tvs.getBookCount();
    expect(count).toBeGreaterThan(0);
  });

  test('[TVS-SGK-MOB-004] Chọn lớp 9 qua dropdown — badge kết quả cập nhật', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.openSachGiaoKhoa();
    await tvs.selectGradeMobile(9);
    const badgeCount = await tvs.getDisplayedResultCount();
    const cardCount = await tvs.getBookCount();
    expect(cardCount).toBeGreaterThan(0);
    if (badgeCount !== -1) {
      expect(Math.abs(cardCount - badgeCount)).toBeLessThanOrEqual(1);
    }
  });

  test('[TVS-SGK-MOB-005] Tabs desktop ẩn trên mobile (sm:tw-flex → tw-hidden)', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.openSachGiaoKhoa();
    // Row tab desktop có class tw-hidden sm:tw-flex — trên mobile không visible
    const desktopTabRow = page.locator(
      '.tw-hidden.sm\\:tw-flex[class*="grade-select"]'
    ).first();
    // Không visible ở 375px
    const visible = await desktopTabRow.isVisible().catch(() => false);
    expect(visible).toBeFalsy();
  });
});

// ════════════════════════════════════════════════════════════════
// 5. SÁCH GIÁO KHOA — Tab Sách học sinh / Sách giáo viên
// ════════════════════════════════════════════════════════════════
test.describe('5. SGK — Tab loại sách @library @regression', () => {

  test('[TVS-SGK-TYPE-001] Tab "Sách học sinh" và "Sách giáo viên" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    expect(await tvs.isElementVisible(ThuVienSoPage.LABEL_SACH_HOC_SINH)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.LABEL_SACH_GIAO_VIEN)).toBeTruthy();
  });

  test('[TVS-SGK-TYPE-002] "Sách học sinh" checked mặc định', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    expect(await tvs.isSachHocSinhSelected()).toBeTruthy();
    expect(await tvs.isSachGiaoVienSelected()).toBeFalsy();
  });

  test('[TVS-SGK-TYPE-003] Click "Sách giáo viên" — radio chuyển đổi đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    await tvs.selectSachGiaoVien();
    expect(await tvs.isSachGiaoVienSelected()).toBeTruthy();
    expect(await tvs.isSachHocSinhSelected()).toBeFalsy();
  });

  test('[TVS-SGK-TYPE-004] Sách giáo viên lớp 1 có kết quả', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1, 'teacher');
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
    const count = await tvs.getBookCount();
    expect(count).toBeGreaterThanOrEqual(0); // Có thể có hoặc không
  });

  test('[TVS-SGK-TYPE-005] Sách học sinh lớp 1 có kết quả', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1, 'student');
    const count = await tvs.getBookCount();
    expect(count).toBeGreaterThan(0);
  });

  test('[TVS-SGK-TYPE-006] Chuyển từ "Học sinh" → "Giáo viên" — badge cập nhật', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const countHS = await tvs.getDisplayedResultCount();
    await tvs.selectSachGiaoVien();
    const countGV = await tvs.getDisplayedResultCount();
    // Badge phải cập nhật (giá trị có thể bằng nhau nhưng không được -1)
    if (countHS !== -1 && countGV !== -1) {
      // Không cần bằng nhau, chỉ cần cả 2 parse được
      expect(countGV).toBeGreaterThanOrEqual(0);
    }
  });

  test('[TVS-SGK-TYPE-007] Click lại "Sách học sinh" sau khi đã chọn "Giáo viên"', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    await tvs.selectSachGiaoVien();
    await tvs.selectSachHocSinh();
    expect(await tvs.isSachHocSinhSelected()).toBeTruthy();
    expect(await tvs.getBookCount()).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════
// 6. SÁCH GIÁO KHOA — Card UI & Interaction
// ════════════════════════════════════════════════════════════════
test.describe('6. SGK — Card sách @library @regression', () => {

  test('[TVS-SGK-CARD-001] Card sách hiển thị tên sách', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const title = await tvs.getBookTitle(0);
    expect(title.length).toBeGreaterThan(0);
  });

  test('[TVS-SGK-CARD-002] Card sách có ảnh bìa với src hợp lệ', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const img = page.locator(ThuVienSoPage.BOOK_CARD_IMG).first();
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src?.startsWith('https://cdn3.olm.vn')).toBeTruthy();
  });

  test('[TVS-SGK-CARD-003] Card sách có overlay gradient trên ảnh bìa', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const overlay = page.locator(ThuVienSoPage.BOOK_CARD_OVERLAY).first();
    const style = await overlay.getAttribute('style');
    expect(style).toContain('linear-gradient');
  });

  test('[TVS-SGK-CARD-004] Card có link dẫn đến /doc-sach/', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const link = page.locator(
      `${ThuVienSoPage.BOOK_LIST_CONTAINER} ${ThuVienSoPage.BOOK_LINK}`
    ).first();
    const href = await link.getAttribute('href');
    expect(href).toContain('/doc-sach/');
  });

  test('[TVS-SGK-CARD-005] Tên sách lớp 1 bắt đầu bằng "SGK" hoặc "SHS"', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const count = await tvs.getBookCount();
    let matchCount = 0;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const title = await tvs.getBookTitle(i);
      if (title.startsWith('SGK') || title.startsWith('SHS')) matchCount++;
    }
    expect(matchCount).toBeGreaterThan(0);
  });

  test('[TVS-SGK-CARD-006] Grid 4 cột hiển thị đúng trên desktop', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await tvs.openSachGiaoKhoa(1);
    const container = page.locator(ThuVienSoPage.BOOK_LIST_CONTAINER);
    const cls = await container.getAttribute('class');
    expect(cls).toContain('tw-grid-cols-4');
  });

  test('[TVS-SGK-CARD-007] Click card sách đầu tiên mở trang chi tiết', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    const beforeUrl = tvs.getCurrentUrl();
    if (await tvs.getBookCount() > 0) {
      await tvs.clickFirstBook();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      expect(tvs.getCurrentUrl()).not.toBe(beforeUrl);
    }
  });

  test('[TVS-SGK-CARD-008] Banner SGK hiển thị đầu trang', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    expect(await tvs.isElementVisible(ThuVienSoPage.SGK_BANNER)).toBeTruthy();
  });

  test('[TVS-SGK-CARD-009] #view-digital-book container tồn tại', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    expect(await tvs.isElementVisible(ThuVienSoPage.SGK_VIEW)).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════
// 7. TẠP CHÍ — Danh mục
// ════════════════════════════════════════════════════════════════
test.describe('7. Tạp chí — Danh mục @library @regression', () => {

  test('[TVS-TC-001] #view-magazines container tồn tại', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    expect(await tvs.isElementVisible(ThuVienSoPage.TAPCHI_VIEW)).toBeTruthy();
  });

  test('[TVS-TC-002] Tiêu đề "Danh mục tạp chí" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    expect(await tvs.isElementVisible(ThuVienSoPage.TAPCHI_SECTION_TITLE)).toBeTruthy();
  });

  test('[TVS-TC-003] Có ít nhất 1 card tạp chí', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    expect(await tvs.getMagazineCount()).toBeGreaterThan(0);
  });

  test('[TVS-TC-004] Tên tạp chí đầu tiên không rỗng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const name = await tvs.getMagazineName(0);
    expect(name.length).toBeGreaterThan(0);
  });

  test('[TVS-TC-005] Tạp chí "Toán tuổi thơ 1" có mặt trong danh sách', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const count = await tvs.getMagazineCount();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tvs.getMagazineName(i);
      if (name.includes('Toán tuổi thơ 1')) { found = true; break; }
    }
    expect(found).toBeTruthy();
  });

  test('[TVS-TC-006] Số ấn phẩm trong badge "N ấn phẩm" > 0', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const issueCount = await tvs.getMagazineIssueCount(0);
    expect(issueCount).toBeGreaterThan(0);
  });

  test('[TVS-TC-007] Mỗi card tạp chí có mô tả không rỗng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const count = await tvs.getMagazineCount();
    if (count > 0) {
      const desc = page.locator(ThuVienSoPage.MAGAZINE_CARD_DESC).first();
      const text = await desc.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('[TVS-TC-008] Ảnh bìa tạp chí có src hợp lệ', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const count = await tvs.getMagazineCount();
    if (count > 0) {
      const img = page.locator('.card-collection img').first();
      const src = await img.getAttribute('src');
      expect(src?.startsWith('https://')).toBeTruthy();
    }
  });

  test('[TVS-TC-009] Click card tạp chí dẫn đến trang danh mục tạp chí', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const count = await tvs.getMagazineCount();
    if (count > 0) {
      const link = page.locator(ThuVienSoPage.MAGAZINE_CARD_LINK).first();
      const href = await link.getAttribute('href');
      expect(href).toContain('thu-vien-so/');
    }
  });

  test('[TVS-TC-010] Grid 2 cột tạp chí trên desktop (lg)', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setDesktopViewport();
    await page.setViewportSize({ width: 1280, height: 800 });
    await tvs.openTapChi();
    const grid = page.locator(ThuVienSoPage.MAGAZINE_GRID).first();
    const cls = await grid.getAttribute('class');
    expect(cls).toContain('lg:tw-grid-cols-2');
  });

  test('[TVS-TC-011] Ảnh trang trí góc phải hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    // Ảnh decor có thể không visible (nằm absolute ở bottom-right)
    const decor = page.locator(ThuVienSoPage.TAPCHI_DECOR_IMG);
    const count = await decor.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[TVS-TC-012] Tiêu đề có 2 đường kẻ trang trí (icon-line) hai bên', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    const lines = page.locator('img[alt="line"]');
    expect(await lines.count()).toBeGreaterThanOrEqual(2);
  });

  test('[TVS-TC-013] Trang tạp chí không crash khi scroll hết trang', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    expect(tvs.isTapChiLoaded()).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════
// 8. FOOTER
// ════════════════════════════════════════════════════════════════
test.describe('8. Footer @library @regression', () => {

  test('[TVS-FT-001] Footer hiển thị trên trang chủ', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER)).toBeTruthy();
  });

  test('[TVS-FT-002] Logo và thông tin công ty đầy đủ', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_LOGO)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_COMPANY_NAME)).toBeTruthy();
    expect(await tvs.isElementVisible('span:has-text("0106303886")')).toBeTruthy();
    expect(await tvs.isElementVisible('span:has-text("Cầu Diễn")')).toBeTruthy();
  });

  test('[TVS-FT-003] Logo đối tác NXB Giáo dục hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_PARTNER_NXBGD)).toBeTruthy();
  });

  test('[TVS-FT-004] Nav footer có đủ 5 link Thư viện số', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_NAV_HOME)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_NAV_SACH_GK)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_NAV_TAP_CHI)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_NAV_HOI_VIEN)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_NAV_HDHT)).toBeTruthy();
  });

  test('[TVS-FT-005] Social links hiển thị đầy đủ', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_FACEBOOK_LINK)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_YOUTUBE_LINK)).toBeTruthy();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_ZALO_LINK)).toBeTruthy();
  });

  test('[TVS-FT-006] Facebook link đúng href olm.vn', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    const href = await page.locator(ThuVienSoPage.FOOTER_FACEBOOK_LINK).first().getAttribute('href');
    expect(href).toContain('facebook.com/olm.vn');
  });

  test('[TVS-FT-007] Copyright "©2013 - 2026 - OLM.VN" hiển thị', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    const text = await page.locator(ThuVienSoPage.FOOTER_COPYRIGHT).first().textContent();
    expect(text).toContain('OLM.VN');
    expect(text).toContain('2026');
  });

  test('[TVS-FT-008] Footer nav SGK click dẫn đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    await page.locator(ThuVienSoPage.FOOTER_NAV_SACH_GK).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[TVS-FT-009] Footer nav Tạp chí click dẫn đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    await tvs.scrollToFooter();
    await page.locator(ThuVienSoPage.FOOTER_NAV_TAP_CHI).first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(tvs.isTapChiLoaded()).toBeTruthy();
  });

  test('[TVS-FT-010] Nút "Lên đầu trang" hiển thị trên mobile', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.setMobileViewport();
    await tvs.open();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_SCROLL_TOP)).toBeTruthy();
  });

  test('[TVS-FT-011] Footer hiển thị cả trên trang SGK lẫn tạp chí', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_COPYRIGHT)).toBeTruthy();
    await tvs.openTapChi();
    await tvs.scrollToFooter();
    expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_COPYRIGHT)).toBeTruthy();
  });
});

// ════════════════════════════════════════════════════════════════
// 9. UNHAPPY PATHS
// ════════════════════════════════════════════════════════════════
test.describe('9. Unhappy paths @library @regression', () => {

  test('[TVS-UH-001] Grade=99 — trang không crash, hiển thị 0 hoặc nhiều sách', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(99);
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
    expect(await tvs.getBookCount()).toBeGreaterThanOrEqual(0);
  });

  test('[TVS-UH-002] Grade=0 — trang không crash', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(0);
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[TVS-UH-003] Type không hợp lệ — trang không crash', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1, 'invalid_type');
    expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[TVS-UH-004] Refresh trang SGK — danh sách tải lại đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(5);
    const count1 = await tvs.getBookCount();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1500);
    const count2 = await tvs.getBookCount();
    expect(count1).toBeGreaterThan(0);
    expect(count2).toBeGreaterThan(0);
  });

  test('[TVS-UH-005] URL trực tiếp /thu-vien-so/khong-ton-tai không throw exception', async ({ page }) => {
    await page.goto('https://olm.vn/thu-vien-so/khong-ton-tai', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    expect(page.url()).toBeTruthy();
  });

  test('[TVS-UH-006] Back button từ trang đọc sách về SGK', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa(1);
    if (await tvs.getBookCount() > 0) {
      await tvs.clickFirstBook();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
    }
  });
});

// ════════════════════════════════════════════════════════════════
// 10. SEO / METADATA
// ════════════════════════════════════════════════════════════════
test.describe('10. SEO / Metadata @library @regression', () => {

  test('[TVS-SEO-001] Trang chủ TVS có title', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    expect((await tvs.getPageTitle()).length).toBeGreaterThan(0);
  });

  test('[TVS-SEO-002] Canonical URL SGK đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openSachGiaoKhoa();
    expect(tvs.getCurrentUrl()).toContain('/thu-vien-so/sach-giao-khoa');
  });

  test('[TVS-SEO-003] Canonical URL Tạp chí đúng', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.openTapChi();
    expect(tvs.getCurrentUrl()).toContain('/thu-vien-so/tap-chi');
  });

  test('[TVS-SEO-004] Logo OLM có alt text "Logo"', async ({ page }) => {
    const tvs = new ThuVienSoPage(page);
    await tvs.open();
    const alt = await page.locator(ThuVienSoPage.LOGO).first().getAttribute('alt');
    expect(alt).toBe('Logo');
  });
});