import type { Locator } from '@playwright/test';
import { BASE_URL } from '../config/config';
import { CARD_SELECTORS, SKIP_HREFS, SUBJECT_MAP } from '../config/constants';
import { BasePage } from './BasePage';

export interface CourseInfo {
  title: string;
  url: string;
  subject: string;
  lessons: string;
  materials: string;
  status: string;
  image: string;
}

export class LopPage extends BasePage {
  static readonly TAB_KHOA_HOC_CHINH = ".nav-link.active, a[data-tab='primary']";
  static readonly TAB_KHOA_HOC_THAM_KHAO = "a[data-tab='reference']";
  static readonly VIEW_MORE_BTN = 'button.btn-more, a.btn-more, .xem-them';

  async open(grade: number): Promise<this> {
    await this.navigateTo(`${BASE_URL}/lop-${grade}`);
    return this;
  }

  private getSubject(title: string): string {
    const tl = title.toLowerCase();
    for (const [k, v] of Object.entries(SUBJECT_MAP)) {
      if (tl.includes(k)) return v;
    }
    return '';
  }

  async getCourses(): Promise<CourseInfo[]> {
    await this.scrollToBottom();

    let rawCards: Locator[] = [];
    for (const sel of CARD_SELECTORS) {
      const items = await this.page.locator(sel).all();
      if (items.length > 3) {
        rawCards = items;
        break;
      }
    }

    const courses: CourseInfo[] = [];

    for (const card of rawCards) {
      try {
        let href = '';
        let title = '';
        let image = '';

        const link = card.locator('a[href]').first();
        if ((await link.count()) > 0) {
          href = (await link.getAttribute('href')) ?? '';
          title = ((await link.getAttribute('title')) ?? '').trim();
        }

        if (SKIP_HREFS.some((kw) => href.toLowerCase().includes(kw))) continue;

        if (!title) {
          for (const sel of ['h4', 'h3', 'h5', 'h2', '.title', 'strong', 'a']) {
            const el = card.locator(sel).first();
            if ((await el.count()) > 0) {
              const t = ((await el.textContent()) ?? '').trim();
              if (t) {
                title = t;
                break;
              }
            }
          }
        }

        if (!href && !title) continue;

        const img = card.locator('img').first();
        if ((await img.count()) > 0) {
          image =
            (await img.getAttribute('src')) ??
            (await img.getAttribute('data-src')) ??
            '';
        }

        const full = ((await card.textContent()) ?? '').replace(/\s+/g, ' ');
        const mL = full.match(/(\d[\d,.]*)\s*bài\s*học/i);
        const mM = full.match(/\((\d+)\s*tài\s*liệu\)/i);

        let status = '';
        for (const sel of ['.badge', 'button', '.btn', "span[class*='badge']"]) {
          const stEl = card.locator(sel).first();
          if ((await stEl.count()) > 0) {
            const st = ((await stEl.textContent()) ?? '').trim();
            if (st && st.length < 40) {
              status = st;
              break;
            }
          }
        }

        courses.push({
          title,
          url: href,
          subject: this.getSubject(title),
          lessons: mL ? mL[1].replace(/,/g, '') : '',
          materials: mM ? mM[1] : '',
          status,
          image,
        });
      } catch {
        // skip card
      }
    }

    return courses;
  }

  async getCourseCount(): Promise<number> {
    return (await this.getCourses()).length;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('/lop-');
  }
}
