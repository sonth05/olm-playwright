import { CUOC_THI_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';

export class CuocThiPage extends BasePage {
  static readonly URL = CUOC_THI_URL;

  // Container chứa danh sách cuộc thi vui: div.mb-3.shadow-sm.p-3
  static readonly CONTEST_CONTAINER = 'div.mb-3.shadow-sm.p-3';

  // Mỗi cuộc thi là div.media.mb-2 bên trong container
  static readonly CONTEST_ITEM = 'div.media.mb-2';

  // Link bài viết cuộc thi
  static readonly CONTEST_LINK = "a[href*='/bai-viet/']";

  // Selector section theo tên (dùng text matching)
  static readonly SECTION_TOAN_VUI = "xpath=//*[contains(text(),'Toán vui') or contains(text(),'toán vui')]";
  static readonly SECTION_VAN_HAY = "xpath=//*[contains(text(),'Văn hay') or contains(text(),'văn hay')]";
  static readonly SECTION_FUN_ENGLISH = "xpath=//*[contains(text(),'Fun English')]";

  async open(): Promise<this> {
    await this.navigateTo(CuocThiPage.URL);
    // Scroll nhẹ để trigger lazy load
    await this.page.evaluate(() => window.scrollTo(0, 400));
    await this.page.waitForTimeout(800);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('cuoc-thi');
  }

  /**
   * Đếm số cuộc thi vui hiển thị.
   * Mỗi item là div.media.mb-2 bên trong div.mb-3.shadow-sm.p-3.
   */
  async getContestCardCount(): Promise<number> {
    try {
      await this.page
        .locator(CuocThiPage.CONTEST_ITEM)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return 0;
    }
    return this.page.locator(CuocThiPage.CONTEST_ITEM).count();
  }

  /**
   * Kiểm tra container cuộc thi vui hiển thị có nội dung.
   * Thay cho hasFeaturedContest() — dùng container thực tế.
   */
  async hasFeaturedContest(): Promise<boolean> {
    try {
      await this.page
        .locator(CuocThiPage.CONTEST_CONTAINER)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
      const count = await this.page.locator(CuocThiPage.CONTEST_ITEM).count();
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Lấy danh sách cuộc thi: title + url.
   */
  async getContests(): Promise<{ title: string; url: string }[]> {
    await this.getContestCardCount(); // đảm bảo đã chờ load
    const items = await this.page.locator(CuocThiPage.CONTEST_ITEM).all();
    const result: { title: string; url: string }[] = [];

    for (const item of items) {
      try {
        const a = item.locator('a.olm-text-link, h3 a, a[href*="/bai-viet/"]').first();
        const title = (await a.getAttribute('title')) ?? (await a.textContent()) ?? '';
        const url = (await a.getAttribute('href')) ?? '';
        if (title.trim() && url) result.push({ title: title.trim(), url });
      } catch {
        continue;
      }
    }
    return result;
  }

  async clickFirstContest(): Promise<this> {
    const links = await this.page.locator(CuocThiPage.CONTEST_LINK).all();
    if (links.length > 0) await this.jsClick(links[0]);
    return this;
  }

  async isSectionVisible(
    section: 'toan_vui' | 'van_hay' | 'fun_english' | string
  ): Promise<boolean> {
    const mapping: Record<string, string> = {
      toan_vui: CuocThiPage.SECTION_TOAN_VUI,
      van_hay: CuocThiPage.SECTION_VAN_HAY,
      fun_english: CuocThiPage.SECTION_FUN_ENGLISH,
    };
    const selector = mapping[section];
    if (!selector) return false;
    return (await this.findVisible([selector], 5)) !== null;
  }
}