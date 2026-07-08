import { TOAN_MAU_GIAO_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator } from '@playwright/test';

/**
 * Một bài học bên trong "data-categories" của section-item.
 * VD: {"id":361674,"title":"Hình phẳng","alias":"hinh-phang",
 *      "url":"https://olm.vn/chu-de/hinh-phang-361674","type":5,
 *      "ordered":1,"completed":false,"icon":"question-type-video"}
 */
export interface KidsLessonInfo {
  id: number;
  title: string;
  alias: string;
  url: string;
  type: number;
  ordered: number;
  completed: boolean;
  icon: string; // "question-type-video" | "question-type-luyen-tap-trac-nghiem" | ...
}

/** Một node (nút tròn đánh số) trên lộ trình */
export interface KidsSectionItem {
  dataId: string;
  parentId: string;
  /** Tên chủ đề lớn, VD: "Chủ đề 1: Hình dạng, vị trí" */
  topicTitle: string;
  /** Tên bài cụ thể của node này, VD: "Bài 1: Hình phẳng" */
  sectionName: string;
  /** Số hiển thị trên node (1, 2, 3…) */
  number: string;
  lessons: KidsLessonInfo[];
}

/**
 * KidsCoursePathPage — Page Object cho màn hình lộ trình học (roadmap)
 * bên trong một khóa học OLM Kids, VD: /bg/toan-mau-giao-olm.
 *
 * Cấu trúc:
 *   1. Thanh trạng thái trên cùng (tên khóa học, tên chủ đề hiện tại,
 *      thanh tiến độ %, điểm thưởng — dạng card xanh cố định đầu trang)
 *   2. Lộ trình (roadmap) — chuỗi node tròn đánh số (.section-item),
 *      mỗi node chứa data-categories (JSON) liệt kê toàn bộ bài học con
 *   3. Tooltip nổi tên chủ đề khi hover/chọn 1 node (cờ + tooltip trắng)
 *   4. Popup "Bài N: …" khi click 1 node — danh sách bài học (video/quiz)
 *      + nút "Bắt đầu học" (học từ bài đầu tiên trong node)
 *
 * LƯU Ý: Các selector cho khu vực header (back/topic/progress/points) ở
 * mục 1 được suy ra TỪ ẢNH CHỤP MÀN HÌNH, chưa có DOM thực tế xác nhận —
 * nên dùng các phương án dự phòng (text-based) và CẦN kiểm tra lại bằng
 * cách inspect trực tiếp olm.vn trước khi dùng cho regression nghiêm ngặt.
 * Phần `.section-item` / data-categories / icon bài học đã khớp DOM thật.
 */
export class KidsCoursePathPage extends BasePage {
  static readonly URL = TOAN_MAU_GIAO_URL;

  // =========================================================================
  // Selectors — đã xác nhận khớp DOM thực tế
  // =========================================================================

  // ── Node lộ trình (roadmap) ───────────────────────────────────────────────
  static readonly SECTION_ITEM         = '.section-item';
  static readonly SECTION_ITEM_NUMBER  = '.section-item span.tw-text-content-white';

  // ── Tooltip nổi tên chủ đề (xuất hiện cạnh cờ khi 1 node được chọn) ───────
  static readonly TOPIC_TOOLTIP = 'div.tw-bg-white.tw-rounded-lg.tw-shadow-md span.tw-text-accent-default';

  // ── Icon loại bài học ──────────────────────────────────────────────────
  static readonly LESSON_ICON_VIDEO = 'img[src*="question-type-video"]';
  static readonly LESSON_ICON_QUIZ  = 'img[src*="question-type-luyen-tap-trac-nghiem"]';

  // ── Link bài học (trong popup khi click 1 node) ───────────────────────────
  static readonly LESSON_LINK       = 'a[href*="/chu-de/"]';
  static readonly LESSON_LINK_TITLE = 'a[href*="/chu-de/"] span';

  // =========================================================================
  // Selectors — best-effort theo ảnh chụp màn hình (CẦN xác minh lại DOM)
  // =========================================================================

  static readonly HEADER_BAR           = 'xpath=//div[.//*[contains(text(),"Chủ đề")]][1]';
  static readonly HEADER_BACK_BUTTON   = 'xpath=//div[contains(@class,"tw-bg-")][.//span[contains(text(),"Chủ đề")]]//a[1] | //button[1]';
  static readonly HEADER_COURSE_NAME   = "xpath=(//span|//a)[contains(@class,'tw-font-bold') or contains(@class,'tw-font-semibold')][1]";
  static readonly HEADER_TOPIC_TITLE   = "xpath=//span[starts-with(normalize-space(text()),'Chủ đề')][1]";
  static readonly HEADER_PROGRESS_TEXT = "xpath=//span[contains(text(),'%')][1]";
  static readonly HEADER_POINTS_TEXT   = "xpath=//*[contains(@class,'tw-bg-accent') or contains(@class,'indigo')]//span[1]";

  // ── Popup "Bài N: …" sau khi click 1 node ─────────────────────────────────
  static readonly LESSON_POPUP             = "xpath=//div[.//a[contains(@href,'/chu-de/')]][1]";
  static readonly LESSON_POPUP_TITLE       = "xpath=//div[.//a[contains(@href,'/chu-de/')]]//*[starts-with(normalize-space(text()),'Bài')][1]";
  static readonly LESSON_POPUP_COMPLETION  = "xpath=//*[contains(text(),'Hoàn thành')][1]";
  static readonly START_LEARNING_BTN       = 'button:has-text("Bắt đầu học"), a:has-text("Bắt đầu học")';
  static readonly NEXT_TOPIC_BTN           = "xpath=//*[starts-with(normalize-space(text()),'Chủ đề') and not(ancestor::*[.//a[contains(@href,'/chu-de/')]])]";

  // =========================================================================
  // Navigation
  // =========================================================================

  async open(url: string = KidsCoursePathPage.URL): Promise<this> {
    await this.navigateTo(url);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('/bg/');
  }

  // =========================================================================
  // Roadmap / section-item helpers
  // =========================================================================

  async getSectionItemCount(): Promise<number> {
    try {
      await this.page
        .locator(KidsCoursePathPage.SECTION_ITEM)
        .first()
        .waitFor({ state: 'attached', timeout: 10_000 });
    } catch {
      return 0;
    }
    return this.page.locator(KidsCoursePathPage.SECTION_ITEM).count();
  }

  /**
   * Đọc toàn bộ node trên lộ trình + parse data-categories (JSON) thành
   * danh sách bài học. Đây là nguồn dữ liệu đáng tin cậy nhất vì không
   * phụ thuộc việc popup có render đúng layout hay không.
   */
  async getSectionItems(): Promise<KidsSectionItem[]> {
    const nodes = await this.findElements(KidsCoursePathPage.SECTION_ITEM, 5);
    const results: KidsSectionItem[] = [];

    for (const node of nodes) {
      const dataId = (await node.getAttribute('data-id')) ?? '';
      const parentId = (await node.getAttribute('data-parent-id')) ?? '';
      const topicTitle = (await node.getAttribute('data-title')) ?? '';
      const sectionName = (await node.getAttribute('data-name')) ?? '';
      const rawCategories = (await node.getAttribute('data-categories')) ?? '[]';
      const numberEl = node.locator('span').first();
      const number = ((await numberEl.textContent()) ?? '').trim();

      let lessons: KidsLessonInfo[] = [];
      try {
        lessons = JSON.parse(rawCategories) as KidsLessonInfo[];
      } catch {
        lessons = [];
      }

      results.push({ dataId, parentId, topicTitle, sectionName, number, lessons });
    }

    return results;
  }

  async getSectionItemByDataId(dataId: string): Promise<Locator> {
    return this.page.locator(`${KidsCoursePathPage.SECTION_ITEM}[data-id="${dataId}"]`).first();
  }

  /** Click node theo số thứ tự hiển thị trên lộ trình (1-based, theo vị trí DOM) */
  async clickSectionByPosition(position: number): Promise<this> {
    const node = this.page.locator(KidsCoursePathPage.SECTION_ITEM).nth(position - 1);
    await this.jsClick(node);
    await this.page.waitForTimeout(400);
    return this;
  }

  async clickSectionByDataId(dataId: string): Promise<this> {
    const node = await this.getSectionItemByDataId(dataId);
    await this.jsClick(node);
    await this.page.waitForTimeout(400);
    return this;
  }

  // =========================================================================
  // Tooltip helpers (tên chủ đề nổi cạnh cờ)
  // =========================================================================

  async isTopicTooltipVisible(): Promise<boolean> {
    return this.isElementVisible(KidsCoursePathPage.TOPIC_TOOLTIP);
  }

  async getTopicTooltipText(): Promise<string> {
    const el = await this.findVisible([KidsCoursePathPage.TOPIC_TOOLTIP], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  // =========================================================================
  // Lesson popup helpers (sau khi click 1 node)
  // =========================================================================

  async isLessonPopupVisible(): Promise<boolean> {
    return this.isElementVisible(KidsCoursePathPage.LESSON_POPUP);
  }

  async getLessonPopupTitle(): Promise<string> {
    const el = await this.findVisible([KidsCoursePathPage.LESSON_POPUP_TITLE], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async getLessonPopupCompletionText(): Promise<string> {
    const el = await this.findVisible([KidsCoursePathPage.LESSON_POPUP_COMPLETION], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  /** Đếm bài học hiển thị trong popup hiện tại (đường dẫn /chu-de/...) */
  async getLessonLinksCount(): Promise<number> {
    try {
      await this.page
        .locator(KidsCoursePathPage.LESSON_LINK)
        .first()
        .waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      return 0;
    }
    return this.page.locator(KidsCoursePathPage.LESSON_LINK).count();
  }

  /** Lấy danh sách {title, url, isVideo} từ các <a href="/chu-de/..."> trong popup */
  async getLessonLinks(): Promise<Array<{ title: string; url: string; isVideo: boolean }>> {
    const links = await this.findElements(KidsCoursePathPage.LESSON_LINK, 5);
    const results: Array<{ title: string; url: string; isVideo: boolean }> = [];

    for (const link of links) {
      const titleEl = link.locator('span').first();
      const title = ((await titleEl.textContent()) ?? '').trim();
      const url = (await link.getAttribute('href')) ?? '';
      const videoIconCount = await link.locator(KidsCoursePathPage.LESSON_ICON_VIDEO).count();
      results.push({ title, url, isVideo: videoIconCount > 0 });
    }
    return results;
  }

  /** Click 1 bài học cụ thể theo tên hiển thị trong popup (vd: "Hình tròn") */
  async clickLessonByTitle(title: string): Promise<this> {
    const link = this.page
      .locator(KidsCoursePathPage.LESSON_LINK)
      .filter({ hasText: title })
      .first();
    const href = await link.getAttribute('href');
    await this.jsClick(link);
    if (href) {
      await this.page
        .waitForURL((url) => url.toString().includes(href.split('?')[0]), { timeout: 15_000 })
        .catch(() => {});
    }
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.dismissPopups();
    return this;
  }

  /** Nhấn "Bắt đầu học" — học từ bài đầu tiên trong node hiện tại */
  async clickStartLearning(): Promise<this> {
    const btn = this.page.locator(KidsCoursePathPage.START_LEARNING_BTN).first();
    await this.jsClick(btn);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    await this.dismissPopups();
    return this;
  }

  /** Click nút chủ đề kế tiếp hiển thị bên dưới popup (vd: "Chủ đề 2: Các số đến 10") */
  async clickNextTopic(): Promise<this> {
    const btn = this.page.locator(KidsCoursePathPage.NEXT_TOPIC_BTN).first();
    await this.jsClick(btn);
    await this.page.waitForTimeout(400);
    return this;
  }
}