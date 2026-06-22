import { CONTEST_URL } from '../config/config';
import { BasePage } from './BasePage';

export class ContestPage extends BasePage {
  static readonly URL = CONTEST_URL;

  static readonly CONTEST_CARDS = '.contest-card, .exam-card, .card';
  static readonly CONTEST_TITLE = '.contest-title, .card-title, h5';
  static readonly START_EXAM_BTN = '.btn-start, .btn-exam, button.btn-primary';
  static readonly FILTER_GRADE = "select[name='grade'], .filter-grade";
  static readonly FILTER_SUBJECT = "select[name='subject'], .filter-subject";
  static readonly FILTER_DIFFICULTY = "select[name='difficulty'], .filter-difficulty";
  static readonly SEARCH_INPUT = "input[type='search'], input[name='q']";
  static readonly VIEW_MORE_BTN = '.btn-more, .xem-them';
  static readonly TIMER = '.timer, .countdown, .exam-timer';
  static readonly QUESTION_LIST = '.question, .exam-question';
  static readonly SUBMIT_EXAM_BTN = '.btn-submit, .nop-bai';
  static readonly RESULT_SCORE = '.score, .result-score, .diem-so';

  async open(): Promise<this> {
    await this.navigateTo(ContestPage.URL);
    return this;
  }

  async getContestCount(): Promise<number> {
    return this.page.locator(ContestPage.CONTEST_CARDS).count();
  }

  async searchContest(keyword: string): Promise<this> {
    const el = await this.findVisible([ContestPage.SEARCH_INPUT], 5);
    if (el) await el.fill(keyword);
    return this;
  }

  async startExam(index = 0): Promise<this> {
    const cards = await this.page.locator(ContestPage.CONTEST_CARDS).all();
    if (index < cards.length) {
      const btn = cards[index].locator(ContestPage.START_EXAM_BTN).first();
      if ((await btn.count()) > 0) await this.jsClick(btn);
    }
    return this;
  }

  async getQuestionCount(): Promise<number> {
    return this.page.locator(ContestPage.QUESTION_LIST).count();
  }

  async submitExam(): Promise<this> {
    const el = await this.findVisible([ContestPage.SUBMIT_EXAM_BTN], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async getScore(): Promise<string> {
    const el = await this.findVisible([ContestPage.RESULT_SCORE], 10);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('contestx');
  }
}
