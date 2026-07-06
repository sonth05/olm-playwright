import { KIDS_URL, BASE_URL } from '../config/config';
import { BasePage } from './BasePage';

/**
 * KidsPage — Page Object cho trang chủ OLM Kids (/kids), khối Mẫu giáo.
 *
 * Cấu trúc trang (theo DOM thực tế olm.vn/kids):
 *   1. Header     — logo "/kids" + avatar/user menu (kids-popup-menu-trigger)
 *   2. Student box — kids-bg-homepage-student: avatar, tên, trường, điểm
 *      thưởng (magic-star), dải huy hiệu (badge-0..badge-6, amount-medal-i)
 *   3. "Khóa học OLM" — danh sách course-card (Toán/Tiếng Anh/Tiếng Việt
 *      Mẫu giáo, chương trình 3-4 tuổi, 5 tuổi…)
 *   4. "Vì sao chọn OLM Kids" — 3 lý do (hình ảnh, học tương tác, kiến thức)
 *   5. Footer     — logo + nav (Về chúng tôi / Liên hệ / Hướng dẫn sử dụng)
 */
export class KidsPage extends BasePage {
  static readonly URL = KIDS_URL;

  // =========================================================================
  // Selectors
  // =========================================================================

  // ── Header ─────────────────────────────────────────────────────────────
  static readonly HEADER_LOGO          = `a[href="https://olm.vn/kids"] img, a[href="${BASE_URL}/kids"] img`;
  static readonly USER_MENU_TRIGGER    = '.kids-popup-menu-trigger';
  static readonly USER_MENU_POPUP      = '.kids-popup-menu';
  static readonly USER_MENU_NAME       = '.kids-popup-menu span.tw-text-20.tw-font-semibold';
  static readonly USER_MENU_INFO_LINK  = '.kids-popup-menu a[href*="/thong-tin-tai-khoan/info"]';
  static readonly USER_MENU_GUIDE_LINK = '.kids-popup-menu a[href*="/bg/hotroolm"]';
  static readonly USER_MENU_LOGOUT     = '.kids-popup-menu a[href*="/dang-xuat"]';

  // ── Student info box (kids-bg-homepage-student) ──────────────────────────
  static readonly STUDENT_BOX          = '.kids-bg-homepage-student';
  static readonly STUDENT_AVATAR       = '.kids-bg-homepage-student img';
  static readonly STUDENT_NAME         = '.kids-bg-homepage-student span.tw-text-secondary-strong.tw-font-black';
  static readonly STUDENT_SCHOOL       = '.kids-bg-homepage-student span.tw-text-16.tw-text-secondary-strong';
  static readonly STUDENT_POINTS_BOX   = '.kids-bg-homepage-student .tw-rounded-full.tw-bg-white';
  static readonly STUDENT_POINTS_VALUE = '.kids-bg-homepage-student .tw-rounded-full.tw-bg-white span.tw-font-black';
  static readonly MEDAL_BADGE          = '.kids-bg-homepage-student img[alt^="badge-"]';
  static readonly MEDAL_AMOUNT         = '.kids-bg-homepage-student [id^="amount-medal-"]';

  // ── Khóa học OLM ───────────────────────────────────────────────────────
  static readonly COURSES_HEADING      = "xpath=//span[contains(text(),'Khóa học OLM')]";
  static readonly COURSE_CARD          = 'a.course-card';
  static readonly COURSE_CARD_TITLE    = 'a.course-card span';
  static readonly COURSE_CARD_IMG      = 'a.course-card img';

  // ── Vì sao chọn OLM Kids ──────────────────────────────────────────────────
  static readonly WHY_CHOOSE_HEADING   = "xpath=//span[contains(text(),'Vì sao chọn OLM Kids')]";
  static readonly WHY_CHOOSE_ITEM      = "xpath=//span[contains(text(),'Vì sao chọn OLM Kids')]/parent::div/div[contains(@class,'tw-flex')]/div[contains(@class,'tw-flex-col')]";

  // ── Footer ─────────────────────────────────────────────────────────────
  static readonly FOOTER               = 'footer';
  static readonly FOOTER_LOGO          = `footer a[href="https://olm.vn/kids"] img, footer a[href="${BASE_URL}/kids"] img`;
  static readonly FOOTER_LINK_ABOUT    = 'footer a[href="/gioi-thieu"]';
  static readonly FOOTER_LINK_CONTACT  = 'footer a[href="/gioi-thieu/lien-he"]';
  static readonly FOOTER_LINK_GUIDE    = 'footer a[href="/bg/hotroolm"]';
  static readonly FOOTER_COPYRIGHT     = 'footer span.tw-text-content-secondary';

  // =========================================================================
  // Navigation
  // =========================================================================

  async open(): Promise<this> {
    await this.navigateTo(KidsPage.URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('/kids');
  }

  // =========================================================================
  // Header / user menu helpers
  // =========================================================================

  async openUserMenu(): Promise<this> {
    const trigger = this.page.locator(KidsPage.USER_MENU_TRIGGER).first();
    await this.jsClick(trigger);
    await this.page.waitForTimeout(300);
    return this;
  }

  async isUserMenuVisible(): Promise<boolean> {
    return this.isElementVisible(KidsPage.USER_MENU_POPUP);
  }

  async getUserMenuName(): Promise<string> {
    const el = await this.findVisible([KidsPage.USER_MENU_NAME], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // =========================================================================
  // Student info box helpers
  // =========================================================================

  async isStudentBoxVisible(): Promise<boolean> {
    return this.isElementVisible(KidsPage.STUDENT_BOX);
  }

  async getStudentName(): Promise<string> {
    const el = await this.findVisible([KidsPage.STUDENT_NAME], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async getStudentSchool(): Promise<string> {
    const el = await this.findVisible([KidsPage.STUDENT_SCHOOL], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async getStudentPoints(): Promise<number> {
    const el = await this.findVisible([KidsPage.STUDENT_POINTS_VALUE], 5);
    if (!el) return 0;
    const text = ((await el.textContent()) ?? '').trim();
    const n = parseInt(text, 10);
    return isNaN(n) ? 0 : n;
  }

  /** Đếm số huy hiệu (badge) hiển thị trên dải medal */
  async getMedalCount(): Promise<number> {
    return this.page.locator(KidsPage.MEDAL_BADGE).count();
  }

  /** Lấy danh sách số lượng (amount) tương ứng từng huy hiệu, theo thứ tự badge-0..n */
  async getMedalAmounts(): Promise<number[]> {
    const els = await this.findElements(KidsPage.MEDAL_AMOUNT, 5);
    const amounts: number[] = [];
    for (const el of els) {
      const text = ((await el.textContent()) ?? '').trim();
      const n = parseInt(text, 10);
      amounts.push(isNaN(n) ? 0 : n);
    }
    return amounts;
  }

  // =========================================================================
  // "Khóa học OLM" helpers
  // =========================================================================

  async hasCoursesHeading(): Promise<boolean> {
    return this.isElementVisible(KidsPage.COURSES_HEADING);
  }

  async getCourseCount(): Promise<number> {
    try {
      await this.page
        .locator(KidsPage.COURSE_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return 0;
    }
    return this.page.locator(KidsPage.COURSE_CARD).count();
  }

  async getCourses(): Promise<Array<{ title: string; url: string }>> {
    const cards = await this.findElements(KidsPage.COURSE_CARD, 5);
    const results: Array<{ title: string; url: string }> = [];
    for (const card of cards) {
      const titleEl = card.locator('span').first();
      const title = ((await titleEl.getAttribute('title')) ??
        (await titleEl.textContent()) ?? '').trim();
      const url = (await card.getAttribute('href')) ?? '';
      if (title && url) results.push({ title, url });
    }
    return results;
  }

  async clickCourseByTitle(title: string): Promise<this> {
    const card = this.page
      .locator(KidsPage.COURSE_CARD)
      .filter({ hasText: title })
      .first();
    await this.jsClick(card);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.dismissPopups();
    return this;
  }

  async clickFirstCourse(): Promise<this> {
    const card = this.page.locator(KidsPage.COURSE_CARD).first();
    const href = await card.getAttribute('href');
    await this.jsClick(card);
    if (href) {
      await this.page
        .waitForURL((url) => url.toString().includes(href.split('?')[0]), { timeout: 15_000 })
        .catch(() => {});
    }
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.dismissPopups();
    return this;
  }

  // =========================================================================
  // "Vì sao chọn OLM Kids" helpers
  // =========================================================================

  async hasWhyChooseSection(): Promise<boolean> {
    return this.isElementVisible(KidsPage.WHY_CHOOSE_HEADING);
  }

  async getWhyChooseReasonsCount(): Promise<number> {
    try {
      return await this.page.locator(KidsPage.WHY_CHOOSE_ITEM).count();
    } catch {
      return 0;
    }
  }

  // =========================================================================
  // Footer helpers
  // =========================================================================

  async isFooterVisible(): Promise<boolean> {
    return this.isElementVisible(KidsPage.FOOTER);
  }

  async clickFooterAbout(): Promise<this> {
    const link = this.page.locator(KidsPage.FOOTER_LINK_ABOUT).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async clickFooterContact(): Promise<this> {
    const link = this.page.locator(KidsPage.FOOTER_LINK_CONTACT).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async clickFooterGuide(): Promise<this> {
    const link = this.page.locator(KidsPage.FOOTER_LINK_GUIDE).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getFooterCopyrightText(): Promise<string> {
    const el = await this.findVisible([KidsPage.FOOTER_COPYRIGHT], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }
}