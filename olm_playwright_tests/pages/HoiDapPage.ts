import { HOI_DAP_URL } from '../config/config';
import { BasePage } from './BasePage';

export class HoiDapPage extends BasePage {
  static readonly URL = HOI_DAP_URL;

  static readonly FILTER_TABS_GRADE = '.filter-grade a, .tab-grade a';
  static readonly FILTER_TABS_SUBJECT = '.filter-subject a, .tag-list a';
  static readonly FILTER_TABS_TYPE = '.nav-tabs .nav-link';
  static readonly TEXTAREA_QUESTION = '.create-post-trigger input[type="text"], .create-post-trigger p[data-placeholder]';
  static readonly SUBMIT_QUESTION = ".btn-ask, button[type='submit']";
  static readonly QUESTION_LIST = 'div.card.card-post';
  static readonly QUESTION_LINK = "a[href*='/cau-hoi/']";
  static readonly ANSWER_LIST = '.card-comment';
  static readonly VOTE_BTN = '.action-comment-trigger[data-typed="like"]';
  static readonly LOAD_MORE_BTN = '.btn-loadmore-comment, .pagination a';
  static readonly VIP_BADGE = '.badge-pill.olm-bg-two';
  static readonly SEARCH_INPUT = "input[type='search'], .search-input";

  async open(): Promise<this> {
    await this.navigateTo(HoiDapPage.URL);
    await this.page.waitForSelector(HoiDapPage.QUESTION_LIST, { timeout: 30000 });
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
      const text = ((await tab.textContent()) ?? '').trim().toLowerCase();
      if (text.includes(tabText.toLowerCase())) {
        await this.jsClick(tab);
        await this.page.waitForLoadState('domcontentloaded');
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