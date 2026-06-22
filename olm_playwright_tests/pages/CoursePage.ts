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
  static readonly COURSE_DESC = '.course-description, .card-body p';
  static readonly RESUME_BTN = "xpath=//button[contains(text(),'Tiếp tục học bài')]";
  static readonly CHAPTER_CARDS = "div.card[id*='cardFolder'], div[id*='cardFolder']";
  static readonly LESSON_ITEMS = "li.lesson-item, li[class*='lesson']";
  static readonly COLLAPSED_HDRS =
    ".card-header[aria-expanded='false'], .card-header.collapsed, button.collapsed, [data-toggle='collapse'].collapsed, [data-bs-toggle='collapse'].collapsed";

  async open(url: string): Promise<this> {
    await this.navigateTo(url);
    return this;
  }

  async getTitle(): Promise<string> {
    const el = await this.findVisible([CoursePage.COURSE_TITLE], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

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

  async expandAllChapters(): Promise<this> {
    const collapsed = await this.page.locator(CoursePage.COLLAPSED_HDRS).all();
    for (const el of collapsed) {
      await safeClick(this.page, el).catch(() => {});
      await this.page.waitForTimeout(300);
    }

    const toggles = await this.page
      .locator(
        "a[href*='#folder'][aria-expanded='false'], a[href*='#cardFolder'][aria-expanded='false']"
      )
      .all();
    for (const el of toggles) {
      await safeClick(this.page, el).catch(() => {});
      await this.page.waitForTimeout(300);
    }

    return this;
  }

  async getLessons(): Promise<LessonInfo[]> {
    await this.clickContentTab();
    await this.expandAllChapters();
    await this.page.waitForTimeout(1000);
    await this.scrollToBottom(0.6);
    await this.expandAllChapters();
    await this.page.waitForTimeout(500);

    const lessons: LessonInfo[] = [];
    const chapterCards = await this.page.locator(CoursePage.CHAPTER_CARDS).all();

    if (chapterCards.length > 0) {
      for (const card of chapterCards) {
        let topicName = '';
        const hdr = card.locator('.card-header').first();
        if ((await hdr.count()) > 0) {
          topicName = ((await hdr.textContent()) ?? '').trim().split('\n')[0];
        }

        const lis = await card.locator('li.list-group-item').all();
        let chapterName = '';

        for (const li of lis) {
          const liId = (await li.getAttribute('id')) ?? '';
          const liClass = (await li.getAttribute('class')) ?? '';

          if (liId.includes('accordion-chapter')) {
            const row = li
              .locator('div.row, div.position-relative, .chapter-title, h6, strong, span')
              .first();
            if ((await row.count()) > 0) {
              chapterName = ((await row.textContent()) ?? '').trim().split('\n')[0];
            } else {
              chapterName = ((await li.textContent()) ?? '').trim().split('\n')[0];
            }
            continue;
          }

          if (liClass.includes('lesson-item')) {
            const lesson = await this.parseLesson(li, topicName, chapterName);
            if (lesson) lessons.push(lesson);
          }
        }
      }
    } else {
      const allLis = await this.page
        .locator("li.lesson-item, li[class*='lesson'], li.list-group-item.font-xs, .lesson-title")
        .all();
      for (const li of allLis) {
        const lesson = await this.parseLesson(li, '', '');
        if (lesson) lessons.push(lesson);
      }
    }

    return lessons;
  }

  private async parseLesson(
    li: import('@playwright/test').Locator,
    topic: string,
    chapter: string
  ): Promise<LessonInfo | null> {
    try {
      const fullText = ((await li.textContent()) ?? '').trim();
      if (!fullText || fullText.length < 3) return null;

      const title = fullText.split('\n')[0].trim();
      let lessonUrl = '';
      const a = li.locator('a[href]').first();
      if ((await a.count()) > 0) {
        lessonUrl = (await a.getAttribute('href')) ?? '';
      }

      let lessonType = '';
      const typeKeywords: Record<string, string> = {
        ppt: 'Slide PPT',
        video: 'Video',
        'bài tập': 'Bài tập',
        'kiểm tra': 'Kiểm tra',
        'trắc nghiệm': 'Trắc nghiệm',
        'cuối tuần': 'Bài tập cuối tuần',
        'cuối chủ đề': 'BT cuối chủ đề',
      };
      for (const [kw, lt] of Object.entries(typeKeywords)) {
        if (fullText.toLowerCase().includes(kw)) {
          lessonType = lt;
          break;
        }
      }

      return { lesson_title: title, lesson_url: lessonUrl, lesson_type: lessonType, topic, chapter };
    } catch {
      return null;
    }
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
