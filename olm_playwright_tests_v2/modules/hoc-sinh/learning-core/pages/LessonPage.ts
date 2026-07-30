import type { Locator } from '@playwright/test';
import { LESSON_COL_SELECTORS } from '@config/constants';
import { BasePage } from '@core/shared-pages/BasePage';

export class LessonPage extends BasePage {
  static readonly VIDEO_PLAYER = "iframe[src*='youtube'], video, .video-player";
  static readonly EXERCISE_FRAME =
    '#quizz, .list-question-container, .exercise-container, .question-container';
  static readonly SUBMIT_BTN =
    "button.btn-save, button.btn-done, button[type='submit'], .btn-submit, .nop-bai";
  static readonly NEXT_BTN =
    '.btn-next, .next-question, button.btn-next-question, button[onclick*="nextQuestion"]';
  static readonly RESULT_PANEL =
    '.result-panel, .score-panel, .score-box, [class*="result-score"], div:has-text("điểm")';
  static readonly PROGRESS_BAR = '.progress-bar, progress';

  async open(url: string): Promise<this> {
    await this.navigateTo(url);
    return this;
  }

  async getExerciseLinks(): Promise<Array<[string, string]>> {
    const exerciseLinks: Array<[string, string]> = [];

    let cols: Locator[] = [];
    for (const sel of LESSON_COL_SELECTORS) {
      const elements = await this.page.locator(sel).all();
      if (elements.length >= 2) {
        cols = elements;
        break;
      }
    }

    if (cols.length === 0) {
      try {
        const linksElements = await this.page.locator('.card-body a[href]').all();
        for (const a of linksElements) {
          const href = (await a.getAttribute('href')) ?? '';
          const text = ((await a.textContent()) ?? '').trim();
          if (href && href.includes('chu-de') && text && !exerciseLinks.some(([, u]) => u === href)) {
            exerciseLinks.push([text, href]);
          }
        }
      } catch {
        // ignore
      }
      return exerciseLinks;
    }

    for (const col of cols) {
      try {
        let headerText = '';
        for (const hSel of ['h5', 'h6', 'strong', 'b', '.font-weight-bold']) {
          const headerEl = col.locator(hSel).first();
          if ((await headerEl.count()) > 0) {
            headerText = ((await headerEl.textContent()) ?? '').trim();
            break;
          }
        }

        if (!headerText) {
          const fullText = ((await col.textContent()) ?? '').trim();
          if (fullText) headerText = fullText.split('\n')[0].trim();
        }

        if (
          headerText.toLowerCase().includes('giáo viên') ||
          headerText.toLowerCase().includes('teacher')
        ) {
          continue;
        }

        const aTags = await col.locator('a[href]').all();
        for (const a of aTags) {
          const href = (await a.getAttribute('href')) ?? '';
          const text = ((await a.textContent()) ?? '').trim();
          if (
            !href ||
            ['javascript:', '#', '/lop-', '/bg/'].some((skip) => href.includes(skip))
          ) {
            continue;
          }
          if (text && !exerciseLinks.some(([, u]) => u === href)) {
            exerciseLinks.push([text, href]);
          }
        }
      } catch {
        // ignore
      }
    }

    return exerciseLinks;
  }

  async hasVideo(): Promise<boolean> {
    return (await this.findVisible([LessonPage.VIDEO_PLAYER], 5)) !== null;
  }

  async hasExercises(): Promise<boolean> {
    return (await this.findVisible([LessonPage.EXERCISE_FRAME], 5)) !== null;
  }

  async clickSubmit(): Promise<this> {
    const el = await this.findVisible([LessonPage.SUBMIT_BTN], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNextQuestion(): Promise<this> {
    const el = await this.findVisible([LessonPage.NEXT_BTN], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async getResult(): Promise<string> {
    const el = await this.findVisible([LessonPage.RESULT_PANEL], 5);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('chu-de');
  }
}
