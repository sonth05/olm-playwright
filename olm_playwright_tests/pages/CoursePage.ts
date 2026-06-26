import { COURSE_TAB_SELECTORS } from '../config/constants';
import { safeClick } from '../utils/helpers';
import { BasePage } from './BasePage';

export interface LessonInfo {
  lesson_title: string;
  lesson_url: string;
  lesson_type: string;
  topic: string;
  chapter: string;
}

export class CoursePage extends BasePage {
  static readonly COURSE_TITLE = 'h1, .course-title';
  static readonly RESUME_BTN = "xpath=//button[contains(text(),'Tiếp tục học bài')]";

  // Trang /lop-N: grid các môn học
  static readonly COURSE_CARD = '.col-4.p-0.mb-4';

  // Trang chi tiết môn: các khối chủ đề
  // id="cardFolder..." hoặc class chứa cardFolder
  static readonly TOPIC_CARDS = "div[id^='cardFolder']";

  async open(url: string): Promise<this> {
    await this.navigateTo(url);
    return this;
  }

  // -------------------------------------------------------------------------
  // Trang /lop-N — danh sách môn học
  // -------------------------------------------------------------------------

  async getCourseCards(): Promise<{ title: string; url: string; lessonCount: string }[]> {
    try {
      await this.page
        .locator(CoursePage.COURSE_CARD)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return [];
    }

    const cards = await this.page.locator(CoursePage.COURSE_CARD).all();
    const result: { title: string; url: string; lessonCount: string }[] = [];

    for (const card of cards) {
      try {
        const a = card.locator('a[href]').first();
        const title = ((await a.getAttribute('title')) ?? (await a.textContent()) ?? '').trim();
        const url = (await a.getAttribute('href')) ?? '';
        const countEl = card.locator('p.font-xsss').first();
        const lessonCount = countEl ? ((await countEl.textContent()) ?? '').trim() : '';
        if (title) result.push({ title, url, lessonCount });
      } catch {
        continue;
      }
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Trang chi tiết môn học — danh sách bài học
  // -------------------------------------------------------------------------

  async getTitle(): Promise<string> {
    const el = await this.findVisible([CoursePage.COURSE_TITLE], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  /**
   * Click tab "Nội dung" nếu có (một số trang dùng tab layout).
   */
  async clickContentTab(): Promise<this> {
    for (const sel of COURSE_TAB_SELECTORS) {
      const tab = this.page.locator(sel).first();
      if ((await tab.count()) > 0 && (await tab.isVisible())) {
        await safeClick(this.page, tab);
        await this.page.waitForTimeout(1500);
        break;
      }
    }
    return this;
  }

  /**
   * Expand các chapter bị collapse.
   * Theo DOM thực tế, các chapter dùng Bootstrap collapse với data-toggle="collapse".
   * Chỉ click những header chưa expand (aria-expanded="false" hoặc class "collapsed").
   * Không dùng scrollIntoView để tránh timeout trên element ẩn.
   */
  async expandAllChapters(): Promise<this> {
    // Selector chính xác từ DOM thực: h3.collapsible-link.collapsed
    const collapsedHeaders = await this.page
      .locator('h3.collapsible-link.collapsed, .card-header .collapsible-link.collapsed')
      .all();

    for (const el of collapsedHeaders) {
      try {
        await el.click({ timeout: 6000 });
        await this.page.waitForTimeout(200);
      } catch {
        // Bỏ qua nếu không click được
      }
    }
    return this;
  }

  /**
   * Lấy toàn bộ bài học từ trang chi tiết môn học.
   *
   * Cấu trúc DOM thực tế (từ /bg/toan-1):
   *
   * div#cardFolder{id}                     ← Chủ đề (topic)
   *   .card-header > h3.collapsible-link   ← Tên chủ đề
   *   ul.list-group
   *     li#accordion-chapter-{id}          ← Bài (chapter) — chứa .lesson-item bên trong div.col-4
   *       div.col-8 > h4 > a              ← Tên bài
   *       div.col-4 > div
   *         div.lesson-item[data-href]     ← Từng lesson item (PPT, bài tập, v.v.)
   *     li.lesson-item.list-group-item     ← Bài kiểm tra standalone (cuối tuần, v.v.)
   */
  async getLessons(): Promise<LessonInfo[]> {
    await this.clickContentTab();
    await this.page.waitForTimeout(500);

    // Chờ topic cards xuất hiện
    try {
      await this.page
        .locator(CoursePage.TOPIC_CARDS)
        .first()
        .waitFor({ state: 'visible', timeout: 16000 });
    } catch {
      return [];
    }

    await this.expandAllChapters();
    await this.page.waitForTimeout(500);

    const lessons: LessonInfo[] = [];
    const topicCards = await this.page.locator(CoursePage.TOPIC_CARDS).all();

    for (const topicCard of topicCards) {
      // Tên chủ đề từ card-header
      const hdrEl = topicCard.locator('.card-header .collapsible-link, .card-header h3').first();
      const topicName = hdrEl
        ? ((await hdrEl.textContent()) ?? '').trim().replace(/\s+/g, ' ')
        : '';

      const lis = await topicCard.locator('ul.list-group > li').all();

      for (const li of lis) {
        const liId = (await li.getAttribute('id')) ?? '';
        const liClass = (await li.getAttribute('class')) ?? '';

        if (liId.startsWith('accordion-chapter-')) {
          // Lấy tên bài từ div.col-8 > h4 > a (link đầu tiên, không phải link thi đấu)
          const chapterLink = li
            .locator('div.col-8 h4 a:not(.olm-text-three)')
            .first();
          const chapterName = chapterLink
            ? ((await chapterLink.getAttribute('title')) ??
               (await chapterLink.textContent()) ?? '').trim()
            : '';

          // Các lesson item bên trong div.col-4
          const lessonDivs = await li
            .locator('div.col-4 div.lesson-item[data-href]')
            .all();

          for (const div of lessonDivs) {
            const href = (await div.getAttribute('data-href')) ?? '';
            const dataType = (await div.getAttribute('data-type')) ?? '';
            const isPpt = (await div.getAttribute('data-ppt')) === '1';
            const titleAttr =
              (await div.locator('a').first().getAttribute('data-original-title')) ??
              (await div.locator('a').first().getAttribute('ariaa-label')) ??
              '';

            const lessonType = isPpt
              ? 'PPT'
              : this.resolveType(dataType);

            if (href) {
              lessons.push({
                lesson_title: titleAttr || chapterName,
                lesson_url: href,
                lesson_type: lessonType,
                topic: topicName,
                chapter: chapterName,
              });
            }
          }

        } else if (liClass.includes('lesson-item')) {
          // Bài kiểm tra standalone (li.lesson-item.list-group-item)
          const a = li.locator('a[href]').first();
          const title =
            (await a.getAttribute('title')) ?? (await a.textContent()) ?? '';
          const url = (await a.getAttribute('href')) ?? '';
          const dataType = (await li.getAttribute('data-type')) ?? '';

          if (url) {
            lessons.push({
              lesson_title: title.replace(/^\[Kiểm tra\]\s*/i, '').trim(),
              lesson_url: url,
              lesson_type: this.resolveType(dataType),
              topic: topicName,
              chapter: '',
            });
          }
        }
      }
    }

    return lessons;
  }

  /**
   * Chuyển data-type sang tên loại bài học.
   * data-type=3: Trắc nghiệm, 5: Video/PPT, 6: In ra làm,
   * 13: Bài tập tự luận, 14: Kiểm tra, 21: Bài tập online
   */
  private resolveType(dataType: string): string {
    const map: Record<string, string> = {
      '3': 'Trắc nghiệm',
      '5': 'Video/PPT',
      '6': 'In ra làm',
      '13': 'Tự luận',
      '14': 'Kiểm tra',
      '21': 'Bài tập',
    };
    return map[dataType] ?? `type-${dataType}`;
  }

  async getLessonCount(): Promise<number> {
    return (await this.getLessons()).length;
  }

  async clickResumeLearning(): Promise<this> {
    const el = await this.findVisible([CoursePage.RESUME_BTN], 5);
    if (el) await this.jsClick(el);
    return this;
  }
}