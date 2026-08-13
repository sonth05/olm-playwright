import { CUOC_THI_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator } from '@playwright/test';

/**
 * Danh mục cuộc thi vui, khớp với thuộc tính data-value của các nút
 * trong thanh tab dạng segmented (`#segment-id button[data-value]`).
 *
 * - TUAN_NAY  → nút "Tuần này", điều hướng sang '/cuoc-thi' (KHÔNG có id_cate)
 * - Các mục còn lại → cùng path, chỉ đổi query '?id_cate={value}'
 */
export enum CuocThiCategory {
  TUAN_NAY = 'tuan-nay',
  TOAN_VUI = '1',
  VAN_HAY = '2',
  FUN_ENGLISH = '3',
}

/**
 * Trạng thái hạn nộp bài hiển thị trên mỗi card cuộc thi:
 * - EXPIRED: "Hết hạn nộp bài" (chữ xám tw-text-content-tertiary)
 * - ACTIVE:  "Hạn nộp - {ngày giờ cụ thể}" (chữ cam tw-text-secondary-default)
 * - NOT_SET: "Hạn nộp - Chưa có hạn nộp" (cùng màu ACTIVE nhưng chưa có ngày)
 */
export enum ContestDeadlineStatus {
  EXPIRED = 'expired',
  ACTIVE = 'active',
  NOT_SET = 'not_set',
}

export interface ContestDeadlineInfo {
  status: ContestDeadlineStatus;
  /** Chuỗi ngày giờ hạn nộp, chỉ có giá trị khi status === ACTIVE */
  text: string | null;
}

export interface ContestCardInfo extends ContestDeadlineInfo {
  title: string;
  description: string;
  detailUrl: string;
}

export class CuocThiPage extends BasePage {
  static readonly URL = CUOC_THI_URL;

  // ── Thanh tab danh mục (segmented) ──────────────────────────────────────
  static readonly SEGMENT_CONTAINER = '#segment-id';
  static readonly SEGMENT_BUTTON = (value: string): string =>
    `#segment-id button[data-value="${value}"]`;
  static readonly SEGMENT_SELECTED = '#segment-id button.selected';

  // ── Card cuộc thi (tw-olm-card-contest) ─────────────────────────────────
  static readonly CARD = '.tw-olm-card-contest';
  static readonly CARD_TITLE = '.tw-text-2xl.tw-text-content-primary.tw-font-semibold';
  static readonly CARD_DESCRIPTION = '.tw-line-clamp-3.tw-text-content-secondary';
  static readonly CARD_DETAIL_LINK = 'a.tw-olm-btn-tertiary-48';
  // Hàng chứa icon lịch + trạng thái hạn nộp, ngay dưới tiêu đề
  static readonly CARD_DEADLINE_ROW = '.tw-flex.tw-items-center.tw-gap-1';
  static readonly CARD_DEADLINE_BOLD = '.tw-font-bold';

  // ── Phân trang ───────────────────────────────────────────────────────────
  static readonly PAGINATION = 'nav ul.pagination';
  static readonly PAGE_LINK = (page: number): string =>
    `nav ul.pagination a.page-link[data-page="${page}"]`;
  static readonly ACTIVE_PAGE_ITEM = 'nav ul.pagination li.page-item.tw-active a.page-link';
  static readonly PREV_BUTTON = 'nav ul.pagination li.page-item a.page-link:has(img[src*="angle-left"])';
  static readonly NEXT_BUTTON = 'nav ul.pagination li.page-item a.page-link:has(img[src*="angle-right"])';

  /**
   * Mở trang cuộc thi vui.
   * @param category - danh mục muốn lọc; bỏ trống hoặc TUAN_NAY = không thêm '?id_cate'
   * @param page - số trang (>1 sẽ thêm '/page-{n}' vào path, giống cấu trúc pagination thật)
   */
  async open(category?: CuocThiCategory, page = 1): Promise<this> {
    let url = CuocThiPage.URL;
    if (page > 1) url += `/page-${page}`;
    if (category && category !== CuocThiCategory.TUAN_NAY) {
      url += `?id_cate=${category}`;
    }
    await this.navigateTo(url);
    // Scroll nhẹ để trigger lazy load
    await this.page.evaluate(() => window.scrollTo(0, 400));
    await this.page.waitForTimeout(800);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('cuoc-thi');
  }

  // ── Tab danh mục ─────────────────────────────────────────────────────────

  /**
   * Bấm vào tab danh mục tương ứng (điều hướng qua onclick window.location.href
   * của chính trang, không phải SPA route).
   */
  async selectCategory(category: CuocThiCategory): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(this.page.locator(CuocThiPage.SEGMENT_BUTTON(category))),
    ]);
    await this.dismissPopups();
    return this;
  }

  /** Trả về data-value của tab đang được chọn (class "selected"), null nếu không có */
  async getActiveCategory(): Promise<string | null> {
    const selected = this.page.locator(CuocThiPage.SEGMENT_SELECTED).first();
    if ((await selected.count()) === 0) return null;
    return selected.getAttribute('data-value');
  }

  async isCategoryTabVisible(category: CuocThiCategory): Promise<boolean> {
    return this.isElementVisible(CuocThiPage.SEGMENT_BUTTON(category));
  }

  // ── Danh sách card cuộc thi ──────────────────────────────────────────────

  /**
   * Đếm số card cuộc thi hiển thị trên trang hiện tại.
   */
  async getContestCardCount(): Promise<number> {
    try {
      await this.page.locator(CuocThiPage.CARD).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      return 0;
    }
    return this.page.locator(CuocThiPage.CARD).count();
  }

  async hasFeaturedContest(): Promise<boolean> {
    return (await this.getContestCardCount()) > 0;
  }

  /** Đọc trạng thái + nội dung hạn nộp từ một card cụ thể */
  private async getCardDeadline(card: Locator): Promise<ContestDeadlineInfo> {
    const row = card.locator(CuocThiPage.CARD_DEADLINE_ROW).first();
    const rowText = ((await row.textContent().catch(() => '')) ?? '').trim();

    if (rowText.includes('Hết hạn nộp bài')) {
      return { status: ContestDeadlineStatus.EXPIRED, text: null };
    }

    const boldText = (
      (await row.locator(CuocThiPage.CARD_DEADLINE_BOLD).first().textContent().catch(() => '')) ?? ''
    ).trim();

    if (!boldText || boldText === 'Chưa có hạn nộp') {
      return { status: ContestDeadlineStatus.NOT_SET, text: null };
    }

    return { status: ContestDeadlineStatus.ACTIVE, text: boldText };
  }

  /**
   * Lấy danh sách cuộc thi: title + mô tả + link chi tiết + trạng thái hạn nộp.
   */
  async getContests(): Promise<ContestCardInfo[]> {
    await this.getContestCardCount(); // đảm bảo đã chờ load
    const cards = await this.page.locator(CuocThiPage.CARD).all();
    const result: ContestCardInfo[] = [];

    for (const card of cards) {
      try {
        const title = ((await card.locator(CuocThiPage.CARD_TITLE).first().textContent()) ?? '').trim();
        const description = (
          (await card.locator(CuocThiPage.CARD_DESCRIPTION).first().textContent()) ?? ''
        ).trim();
        const detailUrl =
          (await card.locator(CuocThiPage.CARD_DETAIL_LINK).first().getAttribute('href')) ?? '';
        const deadline = await this.getCardDeadline(card);

        if (title) result.push({ title, description, detailUrl, ...deadline });
      } catch {
        continue;
      }
    }
    return result;
  }

  async clickFirstContest(): Promise<this> {
    const links = await this.page.locator(CuocThiPage.CARD_DETAIL_LINK).all();
    if (links.length > 0) await this.jsClick(links[0]);
    return this;
  }

  async clickContestByIndex(index: number): Promise<this> {
    const links = await this.page.locator(CuocThiPage.CARD_DETAIL_LINK).all();
    if (index >= 0 && index < links.length) await this.jsClick(links[index]);
    return this;
  }

  // ── Phân trang ───────────────────────────────────────────────────────────

  async getCurrentPage(): Promise<number> {
    const text = ((await this.page.locator(CuocThiPage.ACTIVE_PAGE_ITEM).first().textContent()) ?? '').trim();
    return Number(text) || 1;
  }

  async goToPage(page: number): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(this.page.locator(CuocThiPage.PAGE_LINK(page)).first()),
    ]);
    await this.dismissPopups();
    return this;
  }

  async goToNextPage(): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(this.page.locator(CuocThiPage.NEXT_BUTTON).first()),
    ]);
    await this.dismissPopups();
    return this;
  }

  async goToPrevPage(): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(this.page.locator(CuocThiPage.PREV_BUTTON).first()),
    ]);
    await this.dismissPopups();
    return this;
  }

  private async isNavButtonDisabled(selector: string): Promise<boolean> {
    const cls = (await this.page.locator(selector).first().getAttribute('class').catch(() => '')) ?? '';
    return cls.includes('tw-disabled');
  }

  async isPrevPageDisabled(): Promise<boolean> {
    return this.isNavButtonDisabled(CuocThiPage.PREV_BUTTON);
  }

  async isNextPageDisabled(): Promise<boolean> {
    return this.isNavButtonDisabled(CuocThiPage.NEXT_BUTTON);
  }
}