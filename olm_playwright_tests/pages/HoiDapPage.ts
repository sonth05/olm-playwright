import { HOI_DAP_URL } from '../config/config';
import { BasePage } from './BasePage';

export class HoiDapPage extends BasePage {
  static readonly URL = HOI_DAP_URL;

  static readonly FILTER_TABS_GRADE = '.filter-grade a, .tab-grade a';
  static readonly FILTER_TABS_SUBJECT = '.filter-subject a, .tag-list a';
  static readonly FILTER_TABS_TYPE = '.filter-type a, .nav-tabs a';
  static readonly TEXTAREA_QUESTION = 'textarea, .ask-question textarea';
  static readonly SUBMIT_QUESTION = ".btn-ask, button[type='submit']";
  static readonly QUESTION_LIST = '.question-card, .question-item';
  static readonly QUESTION_LINK = "a[href*='/cau-hoi/']";
  static readonly ANSWER_LIST = '.answer-item, .comment-item';
  static readonly VOTE_BTN = '.btn-vote, .vote-correct';
  static readonly LOAD_MORE_BTN = '.load-more, .btn-more';
  static readonly VIP_BADGE = '.badge-vip, .vip-badge';
  static readonly SEARCH_INPUT = "input[type='search'], .search-input";

  async open(): Promise<this> {
    await this.navigateTo(HoiDapPage.URL);
    return this;
  }

  async filterByGrade(grade: number): Promise<this> {
    const links = await this.page.locator(HoiDapPage.FILTER_TABS_GRADE).all();
    for (const link of links) {
      const text = (await link.textContent()) ?? '';
      if (text.includes(String(grade))) {
        await this.jsClick(link);
        break;
      }
    }
    return this;
  }

  async filterByType(tabText: string): Promise<this> {
    const tabs = await this.page.locator(HoiDapPage.FILTER_TABS_TYPE).all();
    for (const tab of tabs) {
      const text = ((await tab.textContent()) ?? '').toLowerCase();
      if (text.includes(tabText.toLowerCase())) {
        await this.jsClick(tab);
        break;
      }
    }
    return this;
  }

  async getQuestionCount(): Promise<number> {
    return this.page.locator(HoiDapPage.QUESTION_LIST).count();
  }

  async askQuestion(content: string): Promise<this> {
    const textarea = await this.findVisible([HoiDapPage.TEXTAREA_QUESTION], 5);
    if (textarea) {
      await textarea.fill(content);
      const btn = await this.findVisible([HoiDapPage.SUBMIT_QUESTION]);
      if (btn) await this.jsClick(btn);
    }
    return this;
  }

  async clickLoadMore(): Promise<this> {
    const btn = await this.findVisible([HoiDapPage.LOAD_MORE_BTN], 5);
    if (btn) await this.jsClick(btn);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('hoi-dap');
  }
}
