import { BasePage } from '@core/shared-pages/BasePage';
import { BASE_URL } from '@config/config';

/**
 * Page Object — "Khóa học" (view HỌC SINH, giao diện V2 — debug.olm.vn).
 *
 * Khác với CoursePage.ts hiện có (trang V1 /lop-N, dùng class Bootstrap
 * `.col-4.p-0.mb-4`) — đây là trang V2 riêng `/khoa-hoc`, layout hoàn toàn
 * mới (Tailwind), có thêm carousel "Khoá học hè" + phân loại theo khối lớp
 * + môn học + tab "Khoá học OLM" / "Khoá đang học".
 *
 * Cấu trúc trang (theo DOM thực tế đã soát):
 *   - Banner disclaimer (alert) đầu trang
 *   - Carousel "Khoá học hè" (#summer-course-carousel, owl-carousel) — card
 *     dạng `.tw-olm-card-course` bên trong `.owl-item`
 *   - Segmented control 2 tab: "Khoá học OLM" / "Khoá đang học"
 *     (id="segment-select-type-courses", data-group="segment-olm")
 *   - Dải chọn khối lớp (Mẫu giáo, 1-12): a.grade-select-item
 *     (data-group="grade-select-course", href="lop-N")
 *   - Dải chip chọn môn học theo khối đã chọn: a.chip (data-group="chip-subject")
 *   - Danh sách khóa học tương ứng:
 *       + Tab "Khoá học OLM"   → #segment-content-khoa-hoc-olm
 *       + Tab "Khoá đang học"  → #segment-content-khoa-dang-hoc
 *     mỗi khóa là 1 card `.tw-olm-card-course` (không nằm trong owl-item)
 *
 * LƯU Ý:
 *   - Đổi khối lớp / môn học là điều hướng qua <a href> (full page reload),
 *     KHÔNG phải AJAX filter tại chỗ — nên sau khi click cần đợi lại
 *     GRADE_SELECT_ACTIVE / SUBJECT_CHIP_ACTIVE re-render.
 *   - Tab "Khoá đang học" khi học sinh chưa học khóa nào có thể rỗng
 *     (`#segment-content-khoa-dang-hoc` không có card con) — chưa có DOM
 *     mẫu xác nhận có empty-state text hay không.
 */

export const KHOA_HOC_URL = `${BASE_URL}/khoa-hoc`;

export type KhoaHocTab = 'khoa-hoc-olm' | 'khoa-dang-hoc';

export interface CourseCardInfo {
  title: string;
  url: string;
  lessonCountText: string;
}

export class KhoaHocPage extends BasePage {
  // ── Sidebar icon-nav (chung, xem thêm LopHocCuaToiPage) ────────────────────
  readonly SIDEBAR_KHOA_HOC_LINK = 'a[href="/khoa-hoc"]';

  // ── Carousel "Khoá học hè" ───────────────────────────────────────────────
  readonly SUMMER_CAROUSEL = '#summer-course-carousel';
  readonly SUMMER_CAROUSEL_CARD = '#summer-course-carousel .owl-item .tw-olm-card-course';
  readonly SUMMER_CAROUSEL_PREV = '.owl-nav .owl-prev';
  readonly SUMMER_CAROUSEL_NEXT = '.owl-nav .owl-next';

  // ── Segmented control 2 tab ─────────────────────────────────────────────
  readonly SEGMENT_CONTAINER = '#segment-select-type-courses';
  readonly segmentTabButton = (tab: KhoaHocTab) =>
    `#segment-select-type-courses button[data-value="${tab}"][data-group="segment-olm"]`;
  readonly segmentContent = (tab: KhoaHocTab) => `#segment-content-${tab}`;

  // ── Chọn khối lớp ────────────────────────────────────────────────────────
  readonly GRADE_SELECT_ITEM = 'a.grade-select-item[data-group="grade-select-course"]';
  readonly GRADE_SELECT_ACTIVE = 'a.grade-select-item.selected[data-group="grade-select-course"]';
  readonly gradeSelectByHref = (gradeSlug: string) =>
    `a.grade-select-item[data-group="grade-select-course"][href="${gradeSlug}"]`;

  // ── Chọn môn học (chip) ──────────────────────────────────────────────────
  readonly SUBJECT_CHIP = 'a.chip[data-group="chip-subject"]';
  readonly SUBJECT_CHIP_ACTIVE = 'a.chip.selected[data-group="chip-subject"]';

  // ── Danh sách khóa học ───────────────────────────────────────────────────
  readonly courseListContainer = (tab: KhoaHocTab) => `#segment-content-${tab}`;
  readonly courseCard = (tab: KhoaHocTab) => `#segment-content-${tab} .tw-olm-card-course`;

  // ── Navigation ────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.navigateTo(KHOA_HOC_URL);
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  /** Mở thẳng trang khóa học theo khối lớp (VD: "lop-6", "lop-mau-giao") */
  async openByGrade(gradeSlug: string): Promise<void> {
    await this.navigateTo(`${BASE_URL}/${gradeSlug}`);
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  // ── Carousel "Khoá học hè" ───────────────────────────────────────────────

  async getSummerCourseTitles(): Promise<string[]> {
    const cards = await this.findElements(this.SUMMER_CAROUSEL_CARD);
    const titles: string[] = [];
    for (const card of cards) {
      const link = card.locator('a[title]').first();
      titles.push(((await link.getAttribute('title')) ?? '').trim());
    }
    return titles;
  }

  async clickSummerCourseNext(): Promise<void> {
    await this.jsClick(this.page.locator(this.SUMMER_CAROUSEL_NEXT));
  }

  async clickSummerCoursePrev(): Promise<void> {
    await this.jsClick(this.page.locator(this.SUMMER_CAROUSEL_PREV));
  }

  async openSummerCourseByTitle(title: string): Promise<void> {
    const card = this.page
      .locator(this.SUMMER_CAROUSEL_CARD)
      .filter({ has: this.page.locator(`a[title="${title}"]`) })
      .first();
    await this.jsClick(card.locator('a').first());
  }

  // ── Chuyển tab (Khoá học OLM / Khoá đang học) ────────────────────────────

  async switchTab(tab: KhoaHocTab): Promise<void> {
    const btn = this.page.locator(this.segmentTabButton(tab));
    await this.jsClick(btn);
    await this.waitForSelector(this.segmentContent(tab));
  }

  async isTabActive(tab: KhoaHocTab): Promise<boolean> {
    const cls = (await this.page.locator(this.segmentTabButton(tab)).getAttribute('class')) ?? '';
    return cls.includes('selected');
  }

  // ── Chọn khối lớp ────────────────────────────────────────────────────────

  /** Danh sách text các khối lớp hiển thị (VD: "Mẫu giáo", "1", "2", ..., "12") */
  async getGradeOptions(): Promise<string[]> {
    const items = await this.findElements(this.GRADE_SELECT_ITEM);
    const texts: string[] = [];
    for (const item of items) {
      texts.push(((await item.textContent()) ?? '').trim());
    }
    return texts;
  }

  /** Click chọn khối lớp theo text hiển thị (VD: "6") — điều hướng full page */
  async selectGradeByText(gradeText: string): Promise<void> {
    const item = this.page.locator(this.GRADE_SELECT_ITEM).filter({ hasText: gradeText }).first();
    await item.click();
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  async getActiveGradeText(): Promise<string> {
    const el = await this.findVisible(this.GRADE_SELECT_ACTIVE);
    return ((await el?.textContent()) ?? '').trim();
  }

  // ── Chọn môn học ─────────────────────────────────────────────────────────

  async getSubjectChipNames(): Promise<string[]> {
    const chips = await this.findElements(this.SUBJECT_CHIP);
    const names: string[] = [];
    for (const chip of chips) {
      names.push(((await chip.textContent()) ?? '').trim());
    }
    return names;
  }

  /** Click chọn 1 môn học theo tên hiển thị (VD: "Toán") — điều hướng full page */
  async selectSubjectByName(subjectName: string): Promise<void> {
    const chip = this.page.locator(this.SUBJECT_CHIP).filter({ hasText: subjectName }).first();
    await chip.click();
    await this.waitForSelector(this.SEGMENT_CONTAINER);
  }

  async getActiveSubjectName(): Promise<string> {
    const el = await this.findVisible(this.SUBJECT_CHIP_ACTIVE);
    return ((await el?.textContent()) ?? '').trim();
  }

  // ── Danh sách khóa học ───────────────────────────────────────────────────

  async getCourseCount(tab: KhoaHocTab = 'khoa-hoc-olm'): Promise<number> {
    return this.page.locator(this.courseCard(tab)).count();
  }

  async getCourseCards(tab: KhoaHocTab = 'khoa-hoc-olm'): Promise<CourseCardInfo[]> {
    const cards = await this.findElements(this.courseCard(tab));
    const result: CourseCardInfo[] = [];
    for (const card of cards) {
      const link = card.locator('a[title]').first();
      const title = ((await link.getAttribute('title')) ?? '').trim();
      const url = (await link.getAttribute('href')) ?? '';
      const lessonCountText = ((await card.locator('.card-course-action').locator('..').locator('div.tw-text-content-secondary').first().textContent().catch(() => '')) ?? '').trim();
      result.push({ title, url, lessonCountText });
    }
    return result;
  }

  async openCourseByTitle(title: string, tab: KhoaHocTab = 'khoa-hoc-olm'): Promise<void> {
    const card = this.page
      .locator(this.courseCard(tab))
      .filter({ has: this.page.locator(`a[title="${title}"]`) })
      .first();
    await this.jsClick(card.locator('a').first());
  }

  /** Kiểm tra empty-state của tab "Khoá đang học" (chưa có card nào) */
  async isKhoaDangHocEmpty(): Promise<boolean> {
    return (await this.getCourseCount('khoa-dang-hoc')) === 0;
  }
}