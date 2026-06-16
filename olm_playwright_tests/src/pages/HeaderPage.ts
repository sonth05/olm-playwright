import { BASE_URL } from '../config/config';
import { BasePage } from './BasePage';

export class HeaderPage extends BasePage {
  static readonly URL = BASE_URL;

  static readonly LOGO = 'a.logo, a[href="/"], header a img';
  static readonly NAV_HOC_BAI = "a[href*='/hoc-bai']";
  static readonly NAV_HOI_DAP = "a[href*='/hoi-dap']";
  static readonly NAV_CONTEST = "a[href*='/contestx']";
  static readonly NAV_THU_VIEN = "a[href*='/thu-vien-so']";
  static readonly SEARCH_INPUT = "input[type='search'], input[name='q'], .search-input";
  static readonly SEARCH_TYPE_SELECT = 'select.search-type, .search-select';
  static readonly SEARCH_SUBMIT_BTN = ".search-btn, button[type='submit'].search";
  static readonly MESSAGE_ICON = ".icon-message, a[href*='/messages']";
  static readonly NOTIFICATION_ICON = '.icon-notification, .bell-icon';
  static readonly USER_DROPDOWN = '.user-dropdown, .dropdown-user, .avatar';
  static readonly LOGIN_BTN = "a:has-text('Đăng nhập')";
  static readonly REGISTER_BTN = "a:has-text('Đăng ký')";
  static readonly ANNOUNCEMENT_BAR = '.announcement-bar, .top-banner';

  async open(): Promise<this> {
    await this.navigateTo(HeaderPage.URL);
    return this;
  }

  async clickLogo(): Promise<this> {
    const el = await this.findVisible([HeaderPage.LOGO], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavHocBai(): Promise<this> {
    const el = await this.findVisible([HeaderPage.NAV_HOC_BAI], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavHoiDap(): Promise<this> {
    const el = await this.findVisible([HeaderPage.NAV_HOI_DAP], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavContest(): Promise<this> {
    const el = await this.findVisible([HeaderPage.NAV_CONTEST], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async clickNavThuVienSo(): Promise<this> {
    const el = await this.findVisible([HeaderPage.NAV_THU_VIEN], 5);
    if (el) await this.jsClick(el);
    return this;
  }

  async search(keyword: string): Promise<this> {
    const el = await this.findVisible([HeaderPage.SEARCH_INPUT], 5);
    if (el) {
      await el.fill(keyword);
      const btn = await this.findVisible([HeaderPage.SEARCH_SUBMIT_BTN], 3);
      if (btn) {
        await this.jsClick(btn);
      } else {
        await el.press('Enter');
      }
    }
    return this;
  }

  async isSearchInputPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderPage.SEARCH_INPUT], 5)) !== null;
  }

  async isLoginButtonPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderPage.LOGIN_BTN], 5)) !== null;
  }

  async isUserDropdownPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderPage.USER_DROPDOWN], 5)) !== null;
  }

  async isAnnouncementBarPresent(): Promise<boolean> {
    return (await this.findVisible([HeaderPage.ANNOUNCEMENT_BAR], 5)) !== null;
  }
}
