import {
  SACH_GIAO_KHOA_URL,
  TAP_CHI_URL,
  THU_VIEN_SO_URL,
} from '../config/config';
import { BasePage } from './BasePage';

export class ThuVienSoPage extends BasePage {
  static readonly URL = THU_VIEN_SO_URL;
  static readonly SACH_GIAO_KHOA_URL = SACH_GIAO_KHOA_URL;
  static readonly TAP_CHI_URL = TAP_CHI_URL;

  static readonly BANNER = '.banner, .hero, .thu-vien-banner';
  static readonly CTA_SACH_GIAO_KHOA = "a[href*='sach-giao-khoa']";
  static readonly CTA_GOI_HOI_VIEN = "a[href*='gio-hang-thu-vien-so']";
  static readonly CAROUSEL = '.carousel, .slider';
  static readonly FILTER_GRADE_TABS = '.filter-grade a, .tab-grade button, .grade-tab';
  static readonly FILTER_TYPE_TOGGLE = '.filter-type, .toggle-book-type';
  static readonly BOOK_LIST = '.book-item, .book-card, .card';
  static readonly BOOK_LINK = "a[href*='/doc-sach/']";
  static readonly MAGAZINE_LIST = '.magazine-item, .magazine-card, .card';
  static readonly MEMBERSHIP_BADGE = '.badge-hoi-vien, .lock-icon, .badge-member';
  static readonly GOI_HOI_VIEN_CTA = "a[href*='gio-hang-thu-vien-so'], .btn-hoi-vien";

  async open(): Promise<this> {
    await this.navigateTo(ThuVienSoPage.URL);
    return this;
  }

  async openSachGiaoKhoa(grade?: number, bookType?: string): Promise<this> {
    let url = ThuVienSoPage.SACH_GIAO_KHOA_URL;
    const params: string[] = [];
    if (grade) params.push(`grade=${grade}`);
    if (bookType) params.push(`type=${bookType}`);
    if (params.length) url += '?' + params.join('&');
    await this.navigateTo(url);
    return this;
  }

  async openTapChi(): Promise<this> {
    await this.navigateTo(ThuVienSoPage.TAP_CHI_URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('thu-vien-so');
  }

  async getBookCount(): Promise<number> {
    return this.page.locator(ThuVienSoPage.BOOK_LIST).count();
  }

  async getMagazineCount(): Promise<number> {
    return this.page.locator(ThuVienSoPage.MAGAZINE_LIST).count();
  }

  async clickFirstBook(): Promise<this> {
    const links = await this.page.locator(ThuVienSoPage.BOOK_LINK).all();
    if (links.length > 0) await this.jsClick(links[0]);
    return this;
  }

  async hasMembershipBadge(): Promise<boolean> {
    return (await this.page.locator(ThuVienSoPage.MEMBERSHIP_BADGE).count()) > 0;
  }

  isSachGiaoKhoaLoaded(): boolean {
    return this.getCurrentUrl().includes('sach-giao-khoa');
  }

  isTapChiLoaded(): boolean {
    return this.getCurrentUrl().includes('tap-chi');
  }
}
