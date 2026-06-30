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

    // ── Đọc toàn bộ dữ liệu bằng page.evaluate() ─────────────────────────
    // KHÔNG dùng locator.all() rồi gọi getAttribute() tuần tự từng phần tử:
    // các locator lấy qua .all() là nth-index snapshot tại thời điểm gọi,
    // nếu DOM thay đổi/lazy-load thêm bớt phần tử ở giữa (rất hay xảy ra khi
    // vừa expandAllChapters() xong), getAttribute() trên 1 nth-locator có
    // thể chờ vô thời hạn một phần tử không còn khớp đúng vị trí → timeout
    // 60s như đã gặp. evaluate() đọc toàn bộ DOM hiện có trong MỘT lần gọi
    // đồng bộ phía browser, không phụ thuộc actionability/staleness của
    // Playwright nên nhanh và an toàn hơn hẳn.
    //
    // Cũng xử lý luôn trường hợp DOM không còn div.lesson-item[data-href]
    // trong div.col-4 (một số bài chỉ có link trực tiếp ở div.col-8 h4 a)
    // bằng cách fallback lấy chính link đó làm 1 bài học.
    const lessons: LessonInfo[] = await this.page.evaluate(() => {
      const typeMap: Record<string, string> = {
        '3': 'Trắc nghiệm',
        '5': 'Video/PPT',
        '6': 'In ra làm',
        '13': 'Tự luận',
        '14': 'Kiểm tra',
        '21': 'Bài tập',
      };
      const resolveType = (dataType: string | null): string => {
        if (!dataType) return '';
        return typeMap[dataType] ?? `type-${dataType}`;
      };

      const result: LessonInfo[] = [];
      const topicCards = Array.from(document.querySelectorAll('div[id^="cardFolder"]'));

      for (const topicCard of topicCards) {
        const hdrEl = topicCard.querySelector('.card-header .collapsible-link, .card-header h3');
        const topicName = (hdrEl?.textContent ?? '').trim().replace(/\s+/g, ' ');

        const lis = Array.from(topicCard.querySelectorAll('ul.list-group > li'));

        for (const li of lis) {
          const liId = li.getAttribute('id') ?? '';
          const liClass = li.getAttribute('class') ?? '';

          if (liId.startsWith('accordion-chapter-')) {
            const chapterLinkEl = li.querySelector('div.col-8 h4 a:not(.olm-text-three)');
            const chapterName = (
              chapterLinkEl?.getAttribute('title') ?? chapterLinkEl?.textContent ?? ''
            ).trim();
            const chapterHref = chapterLinkEl?.getAttribute('href') ?? '';

            const lessonDivs = Array.from(
              li.querySelectorAll('div.col-4 div.lesson-item[data-href]')
            );

            if (lessonDivs.length > 0) {
              for (const div of lessonDivs) {
                const href = div.getAttribute('data-href') ?? '';
                const dataType = div.getAttribute('data-type');
                const isPpt = div.getAttribute('data-ppt') === '1';
                const aEl = div.querySelector('a');
                const titleAttr =
                  aEl?.getAttribute('data-original-title') ??
                  aEl?.getAttribute('aria-label') ??
                  '';

                if (href) {
                  result.push({
                    lesson_title: titleAttr || chapterName,
                    lesson_url: href,
                    lesson_type: isPpt ? 'PPT' : resolveType(dataType),
                    topic: topicName,
                    chapter: chapterName,
                  });
                }
              }
            } else if (chapterHref) {
              // Fallback: không có div.lesson-item[data-href] trong col-4,
              // dùng thẳng link ở div.col-8 h4 a làm 1 bài học.
              result.push({
                lesson_title: chapterName,
                lesson_url: chapterHref,
                lesson_type: '',
                topic: topicName,
                chapter: chapterName,
              });
            }
          } else if (liClass.includes('lesson-item')) {
            // Bài kiểm tra standalone (li.lesson-item.list-group-item)
            const aEl = li.querySelector('a[href]');
            const title = (aEl?.getAttribute('title') ?? aEl?.textContent ?? '').trim();
            const url = aEl?.getAttribute('href') ?? '';
            const dataType = li.getAttribute('data-type');

            if (url) {
              result.push({
                lesson_title: title.replace(/^\[Kiểm tra\]\s*/i, '').trim(),
                lesson_url: url,
                lesson_type: resolveType(dataType),
                topic: topicName,
                chapter: '',
              });
            }
          }
        }
      }

      return result;
    });

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