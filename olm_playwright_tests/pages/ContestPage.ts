import { CONTEST_URL } from '../config/config';
import { BasePage } from './BasePage';
import type { Locator } from '@playwright/test';

/**
 * ContestPage – Trang Kho đề (olm.vn/contestx)
 *
 * Selectors được lấy trực tiếp từ DOM thực tế của trang contestx.
 *
 * Cấu trúc trang:
 *   - Sidebar trái: danh sách lớp (ul.sidebar-list-grade li a.olm-a)
 *   - Sidebar giữa: tab môn học (ul.sidebar-list-grade.list-group li a.tab-subject-new)
 *   - Nội dung chính:
 *       • Dropdown lọc môn học (.dropdown button.olm-btn-primary.dropdown-toggle)
 *       • Tab content mỗi môn: .tab-pane#contest-tab-{id}
 *       • Mỗi chương: .card.mb-2.w-100#cardFolder{id}
 *         - Header chương: .card-header .collapsible-link
 *         - Danh sách bài: ul.list-group li.list-group-item[id="accordion-chapter-{id}"]
 *           • Tên bài: .col-8 h4 a.text-grey-700
 *           • Nút bài tập: .col-4 .lesson-item a (icon fa-list)
 *           • Nút thi đấu: a.olm-text-three[href*="thi-dau"]
 *           • Nút sách HS:  .lesson-item a[href*="thu-vien-so"]
 */
export class ContestPage extends BasePage {
  static readonly URL = CONTEST_URL;

  // ── Sidebar lớp ──────────────────────────────────────────────────────────
  /** Toàn bộ các item lớp trong sidebar trái */
  static readonly GRADE_SIDEBAR_ITEMS = 'ul.sidebar-list-grade li a.olm-a';
  /** Item lớp đang active */
  static readonly GRADE_ACTIVE        = 'ul.sidebar-list-grade li a.olm-a.active';

  // ── Tab môn học (sidebar giữa) ───────────────────────────────────────────
  /** Toàn bộ tab môn học */
  static readonly SUBJECT_TABS        = 'ul.sidebar-list-grade.list-group li a.tab-subject-new';
  /** Tab môn đang active */
  static readonly SUBJECT_TAB_ACTIVE  = 'ul.sidebar-list-grade.list-group li a.tab-subject-new.active';

  // ── Dropdown lọc môn học (vùng nội dung chính) ──────────────────────────
  /** Nút dropdown môn học */
  static readonly SUBJECT_DROPDOWN_BTN   = '.dropdown button.olm-btn-primary.dropdown-toggle';
  /** Danh sách item trong dropdown */
  static readonly SUBJECT_DROPDOWN_ITEMS = '.dropdown-menu.mh-300-p .dropdown-item';
  /** Item "Tất cả" trong dropdown */
  static readonly SUBJECT_DROPDOWN_ALL   = ".dropdown-menu.mh-300-p a.dropdown-item[href='/contestx?']";

  // ── Tiêu đề danh sách bài kiểm tra ──────────────────────────────────────
  /** h2 hiển thị "Danh sách bài kiểm tra" */
  static readonly SECTION_TITLE = '.col-7 h2';

  // ── Chương (card folder) ─────────────────────────────────────────────────
  /** Mỗi card chương */
  static readonly CHAPTER_CARDS   = '.tab-pane.active .card.mb-2.w-100';
  /** Header có thể click để mở/đóng chương */
  static readonly CHAPTER_HEADERS = '.tab-pane.active .card-header .collapsible-link';
  /** Tên chương (link text bên trong header) */
  static readonly CHAPTER_TITLE   = '.card-header .collapsible-link a.fw-600';

  // ── Bài học / đề thi trong chương ───────────────────────────────────────
  /** Toàn bộ li bài trong tất cả chương đang hiển thị */
  static readonly LESSON_ITEMS         = '.tab-pane.active li.list-group-item';
  /** Tên bài (link text) */
  static readonly LESSON_TITLE_LINK    = 'h4 a.text-grey-700';
  /** Nút bài tập (icon list) trong mỗi bài */
  static readonly LESSON_EXERCISE_BTN  = '.lesson-item a[data-toggle="tooltip"]';
  /** Nút thi đấu (icon bolt) */
  static readonly LESSON_BATTLE_BTN    = 'a.olm-text-three[href*="thi-dau"]';
  /** Link sách học sinh */
  static readonly LESSON_TEXTBOOK_LINK = '.lesson-item a[href*="thu-vien-so"]';

  // ── Tab content ──────────────────────────────────────────────────────────
  /** Tab pane đang active */
  static readonly ACTIVE_TAB_PANE = '.tab-content .tab-pane.active';

  // ── Collapse panel (nội dung bên trong chương) ───────────────────────────
  /** Panel collapse đang hiển thị (có class show) */
  static readonly CHAPTER_COLLAPSE_SHOW = '.collapse.show';

  // ──────────────────────────────────────────────────────────────────────────
  async open(): Promise<this> {
    await this.navigateTo(ContestPage.URL);
    return this;
  }

  /** Mở trang với grade cụ thể, ví dụ grade=6 */
  async openWithGrade(grade: number): Promise<this> {
    await this.navigateTo(`${ContestPage.URL}?grade=${grade}`);
    return this;
  }

  /** Mở trang với subject cụ thể, ví dụ subject=3 (Toán) */
  async openWithSubject(subjectId: number): Promise<this> {
    await this.navigateTo(`${ContestPage.URL}?subject=${subjectId}`);
    return this;
  }

  // ── Grade sidebar ─────────────────────────────────────────────────────────
  /** Số lớp hiển thị trong sidebar trái */
  async getGradeCount(): Promise<number> {
    return this.page.locator(ContestPage.GRADE_SIDEBAR_ITEMS).count();
  }

  /** Text lớp đang active (ví dụ "Lớp 6") */
  async getActiveGradeText(): Promise<string> {
    const el = this.page.locator(ContestPage.GRADE_ACTIVE).first();
    return (await el.textContent() ?? '').trim();
  }

  /** Click vào lớp theo số (1–12, 0 = Mẫu giáo) */
  async selectGrade(grade: number): Promise<this> {
    const link = this.page.locator(
      `${ContestPage.GRADE_SIDEBAR_ITEMS}[href*="grade=${grade}"]`
    ).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded');
    return this;
  }

  // ── Subject tabs ─────────────────────────────────────────────────────────
  /** Số tab môn học */
  async getSubjectTabCount(): Promise<number> {
    return this.page.locator(ContestPage.SUBJECT_TABS).count();
  }

  /** Text tab môn đang active */
  async getActiveSubjectTabText(): Promise<string> {
    const el = this.page.locator(ContestPage.SUBJECT_TAB_ACTIVE).first();
    return (await el.textContent() ?? '').trim();
  }

  /** Click vào tab môn theo tên (ví dụ "Toán 6") */
  async selectSubjectTab(tabTextPartial: string): Promise<this> {
    const tabs = this.page.locator(ContestPage.SUBJECT_TABS);
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const text = (await tabs.nth(i).textContent() ?? '').trim();
      if (text.includes(tabTextPartial)) {
        await this.jsClick(tabs.nth(i));
        await this.page.waitForTimeout(500);
        return this;
      }
    }
    return this;
  }

  // ── Subject dropdown (lọc môn) ───────────────────────────────────────────
  /** Text hiện tại của dropdown môn học (ví dụ "Toán") */
  async getSubjectDropdownText(): Promise<string> {
    const el = this.page.locator(ContestPage.SUBJECT_DROPDOWN_BTN).first();
    return (await el.textContent() ?? '').trim();
  }

  /** Mở dropdown môn học */
  async openSubjectDropdown(): Promise<this> {
    const btn = this.page.locator(ContestPage.SUBJECT_DROPDOWN_BTN).first();
    await this.jsClick(btn);
    await this.page.waitForTimeout(300);
    return this;
  }

  /** Số môn trong dropdown */
  async getSubjectDropdownItemCount(): Promise<number> {
    return this.page.locator(ContestPage.SUBJECT_DROPDOWN_ITEMS).count();
  }

  /** Chọn môn học từ dropdown theo tên (ví dụ "Tiếng Anh") */
  async selectSubjectFromDropdown(subjectName: string): Promise<this> {
    await this.openSubjectDropdown();
    const items = this.page.locator(ContestPage.SUBJECT_DROPDOWN_ITEMS);
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const text = (await items.nth(i).textContent() ?? '').trim();
      if (text.includes(subjectName)) {
        await this.jsClick(items.nth(i));
        await this.page.waitForLoadState('domcontentloaded');
        return this;
      }
    }
    return this;
  }

  // ── Chapters ──────────────────────────────────────────────────────────────
  /** Số chương hiển thị trong tab đang active */
  async getChapterCount(): Promise<number> {
    return this.page.locator(ContestPage.CHAPTER_CARDS).count();
  }

  /** Lấy danh sách tên chương */
  async getChapterTitles(): Promise<string[]> {
    const titles: string[] = [];
    const els = this.page.locator(ContestPage.CHAPTER_TITLE);
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      titles.push((await els.nth(i).textContent() ?? '').trim());
    }
    return titles;
  }

  /** Click header chương để toggle collapse (theo index) */
  async toggleChapter(index: number): Promise<this> {
    const headers = this.page.locator(ContestPage.CHAPTER_HEADERS);
    const count = await headers.count();
    if (index < count) {
      await this.jsClick(headers.nth(index));
      await this.page.waitForTimeout(400);
    }
    return this;
  }

  // ── Lesson items ─────────────────────────────────────────────────────────
  /** Tổng số bài/đề trong tất cả chương đang hiển thị */
  async getLessonCount(): Promise<number> {
    return this.page.locator(ContestPage.LESSON_ITEMS).count();
  }

  /** Lấy tên bài theo index */
  async getLessonTitle(index: number): Promise<string> {
    const item = this.page.locator(ContestPage.LESSON_ITEMS).nth(index);
    const link = item.locator(ContestPage.LESSON_TITLE_LINK).first();
    return (await link.textContent() ?? '').trim();
  }

  /** Click nút bài tập đầu tiên của bài theo index */
  async clickExerciseBtn(lessonIndex: number): Promise<this> {
    const item = this.page.locator(ContestPage.LESSON_ITEMS).nth(lessonIndex);
    const btn = item.locator(ContestPage.LESSON_EXERCISE_BTN).first();
    if (await btn.count() > 0) {
      await this.jsClick(btn);
    }
    return this;
  }

  /** Lấy href của link bài tập đầu tiên trong bài theo index */
  async getExerciseHref(lessonIndex: number): Promise<string> {
    const item = this.page.locator(ContestPage.LESSON_ITEMS).nth(lessonIndex);
    const btn = item.locator(ContestPage.LESSON_EXERCISE_BTN).first();
    return (await btn.getAttribute('href') ?? '');
  }

  /** Số nút bài tập trong một bài (một bài có thể có nhiều đề) */
  async getExerciseBtnCountForLesson(lessonIndex: number): Promise<number> {
    const item = this.page.locator(ContestPage.LESSON_ITEMS).nth(lessonIndex);
    return item.locator(ContestPage.LESSON_EXERCISE_BTN).count();
  }

  /** Kiểm tra bài có nút thi đấu không */
  async hasLessonBattleBtn(lessonIndex: number): Promise<boolean> {
    const item = this.page.locator(ContestPage.LESSON_ITEMS).nth(lessonIndex);
    return (await item.locator(ContestPage.LESSON_BATTLE_BTN).count()) > 0;
  }

  /** Kiểm tra bài có link sách học sinh không */
  async hasTextbookLink(lessonIndex: number): Promise<boolean> {
    const item = this.page.locator(ContestPage.LESSON_ITEMS).nth(lessonIndex);
    return (await item.locator(ContestPage.LESSON_TEXTBOOK_LINK).count()) > 0;
  }

  // ── isPageLoaded ──────────────────────────────────────────────────────────
  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('contestx');
  }
}