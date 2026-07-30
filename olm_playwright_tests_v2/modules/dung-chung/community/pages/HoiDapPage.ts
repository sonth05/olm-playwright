import { BASE_URL } from '@config/config';
import { BasePage } from '@core/shared-pages/BasePage';

/**
 * Page Object — "Hỏi đáp" giao diện V2 (debug.olm.vn `/hoi-dap`).
 *
 * DOM V2 khác hoàn toàn so với `HoiDapPage.ts` (V1) hiện có trong cùng
 * thư mục — V1 dùng `.sidebar-list-grade`, `.dropdown-menu`, `.card.card-post`,
 * `.nav.nav-tabs` (Bootstrap); V2 dùng Tailwind + select2 + card riêng theo
 * `data-post-id`. Theo convention "fork khi cần" của dự án, file này ĐỨNG
 * RIÊNG (`HoiDapPageV2.ts`) thay vì sửa đè lên `HoiDapPage.ts` — khi V2 lên
 * chính thức thay V1, đổi tên file này thành `HoiDapPage.ts` và xoá bản cũ.
 *
 * Cấu trúc trang (theo DOM thực tế đã soát):
 *   - Banner "Bạn có câu hỏi nào không?" + nút "Đặt câu hỏi"
 *     (`#discuss-create-post-btn`) mở form ẩn `#discuss-create-post-form`
 *   - Filter bar: select "lớp" (`#grade`), select "môn học" (`#subject`),
 *     4 tab lọc (Tất cả / Câu hỏi mới nhất / Câu hỏi hay / Chưa trả lời) —
 *     đều là `<a href>` điều hướng full page, KHÔNG phải AJAX
 *   - Danh sách câu hỏi: mỗi câu hỏi là `#card-question-<postId>`
 *     (`data-post-id`) — có avatar/tên tác giả (kèm badge Admin/VIP nếu có),
 *     tag môn học, nội dung, nút mở trả lời (`#btn-open-replies-<id>`,
 *     đếm số trả lời qua `data-count-answer`), nút bookmark
 *     (`data-typed="mark"`), nút "Trả lời" (`#btn-reply-<id>`)
 *   - Phân trang: `<nav><ul class="pagination">` — link "Trang sau »"
 *   - Sidebar phải: banner VIP, card thống kê cá nhân (Đã hỏi / Đã trả lời /
 *     Tổng điểm / Tuần này) + nút "Câu hỏi của tôi", card xếp hạng
 *     "Thành viên hăng hái" (select khoảng thời gian + danh sách top)
 *   - Nút nổi góc dưới phải: "Đặt câu hỏi" (`#btn-create-post-sidebar`)
 *
 * LƯU Ý:
 *   - Filter theo lớp/môn dùng select2 (ẩn `<select>` gốc) — thao tác qua
 *     UI overlay `.select2-selection`, giống pattern đã dùng ở
 *     LopHocCuaToiPage/BaiTapDuocGiaoPage.
 *   - 4 tab lọc là link điều hướng thật (`https://debug.olm.vn/hoi-dap`,
 *     `/hoi-dap/newq`, `/hoi-dap/cau-hoi-hay`, `/hoi-dap?select=1`), không
 *     phải toggle tại chỗ — click xong cần đợi trang load lại.
 *   - Form tạo câu hỏi (`#discuss-create-post-editor`) là rich-text editor
 *     nhúng (chưa rõ thư viện) — chưa có DOM chi tiết bên trong, page object
 *     mới dừng ở mức mở/đóng form.
 */

export const HOI_DAP_V2_URL = `${BASE_URL}/hoi-dap`;

export type HoiDapFilterTab = 'tat-ca' | 'moi-nhat' | 'cau-hoi-hay' | 'chua-tra-loi';
export type RankingPeriod = 'sweek' | 'smonth' | 'sum_all';

export interface HoiDapAuthorInfo {
  name: string;
  isAdmin: boolean;
  isVip: boolean;
}

const FILTER_TAB_HREF_MATCH: Record<HoiDapFilterTab, string> = {
  'tat-ca': '/hoi-dap',
  'moi-nhat': '/hoi-dap/newq',
  'cau-hoi-hay': '/hoi-dap/cau-hoi-hay',
  'chua-tra-loi': '/hoi-dap?select=1',
};

export class HoiDapPageV2 extends BasePage {
  // ── Banner đặt câu hỏi ───────────────────────────────────────────────────
  readonly BANNER = '#discuss-banner-post-form';
  readonly CREATE_POST_BTN = '#discuss-create-post-btn';
  readonly CREATE_POST_FORM = '#discuss-create-post-form';
  readonly CREATE_POST_EDITOR = '#discuss-create-post-editor';
  readonly FLOATING_CREATE_POST_BTN = '#btn-create-post-sidebar';

  // ── Filter bar ────────────────────────────────────────────────────────────
  readonly GRADE_SELECT = '#grade';
  readonly SUBJECT_SELECT = '#subject';
  readonly filterTab = (tab: HoiDapFilterTab) => `a.filter-tab[href*="${FILTER_TAB_HREF_MATCH[tab]}"]`;
  readonly ACTIVE_FILTER_TAB = 'a.filter-tab.\\!tw-bg-background-default';

  // ── Danh sách câu hỏi ─────────────────────────────────────────────────────
  readonly POSTS_CONTAINER = 'section.posts-container';
  readonly POST_CARD = '[id^="card-question-"]';
  readonly postCard = (postId: string) => `#card-question-${postId}`;
  readonly PAGINATION_NEXT = 'nav .pagination a:has-text("Trang sau")';

  // ── Navigation ────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.navigateTo(HOI_DAP_V2_URL);
    await this.waitForSelector(this.POSTS_CONTAINER);
  }

  // ── Đặt câu hỏi ───────────────────────────────────────────────────────────

  async openCreatePostForm(): Promise<void> {
    await this.jsClick(this.page.locator(this.CREATE_POST_BTN));
    await this.waitForSelector(this.CREATE_POST_FORM);
  }

  async openCreatePostFormFromFloatingButton(): Promise<void> {
    await this.jsClick(this.page.locator(this.FLOATING_CREATE_POST_BTN));
  }

  async isCreatePostFormVisible(): Promise<boolean> {
    return this.page.locator(this.CREATE_POST_FORM).isVisible().catch(() => false);
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  async filterByGrade(gradeText: string): Promise<void> {
    await this.page.locator(`${this.GRADE_SELECT} + span .select2-selection`).click();
    await this.page.locator('.select2-results__option', { hasText: gradeText }).click();
  }

  async filterBySubject(subjectText: string): Promise<void> {
    await this.page.locator(`${this.SUBJECT_SELECT} + span .select2-selection`).click();
    await this.page.locator('.select2-results__option', { hasText: subjectText }).click();
  }

  /** Click 1 trong 4 tab lọc — điều hướng full page (không phải AJAX) */
  async switchFilterTab(tab: HoiDapFilterTab): Promise<void> {
    await this.page.locator(this.filterTab(tab)).first().click();
    await this.waitForSelector(this.POSTS_CONTAINER);
  }

  // ── Danh sách câu hỏi ─────────────────────────────────────────────────────

  async getPostCount(): Promise<number> {
    return this.page.locator(this.POST_CARD).count();
  }

  async getPostIds(): Promise<string[]> {
    const cards = await this.findElements(this.POST_CARD);
    const ids: string[] = [];
    for (const card of cards) {
      const id = await card.getAttribute('data-post-id');
      if (id) ids.push(id);
    }
    return ids;
  }

  async getPostAuthor(postId: string): Promise<HoiDapAuthorInfo> {
    const card = this.page.locator(this.postCard(postId));
    const name = ((await card.locator('a[data-user-popover]').first().textContent()) ?? '').trim();
    const isAdmin = await card.locator('div:has-text("Admin")').first().isVisible().catch(() => false);
    const isVip = await card.locator('img[src*="vip.png"]').first().isVisible().catch(() => false);
    return { name, isAdmin, isVip };
  }

  async getPostContent(postId: string): Promise<string> {
    const el = this.page.locator(`#content-post-${postId}`);
    return ((await el.textContent()) ?? '').trim();
  }

  async getPostTags(postId: string): Promise<string[]> {
    const tags = await this.findElements(`#post-tag-${postId} > *`);
    const texts: string[] = [];
    for (const tag of tags) {
      texts.push(((await tag.textContent()) ?? '').trim());
    }
    return texts;
  }

  async getPostAnswerCount(postId: string): Promise<number> {
    const el = this.page.locator(`#btn-open-replies-${postId}`);
    const attr = await el.getAttribute('data-count-answer');
    return attr ? Number(attr) : 0;
  }

  async openReplies(postId: string): Promise<void> {
    await this.jsClick(this.page.locator(`#btn-open-replies-${postId}`));
  }

  async clickReply(postId: string): Promise<void> {
    await this.jsClick(this.page.locator(`#btn-reply-${postId}`));
  }

  async toggleBookmark(postId: string): Promise<void> {
    const card = this.page.locator(this.postCard(postId));
    await this.jsClick(card.locator('button[data-typed="mark"]'));
  }

  async isBookmarked(postId: string): Promise<boolean> {
    const card = this.page.locator(this.postCard(postId));
    const attr = await card.locator('button[data-typed="mark"]').getAttribute('data-is-follow');
    return attr === '1';
  }

  async goToNextPage(): Promise<void> {
    await this.jsClick(this.page.locator(this.PAGINATION_NEXT));
    await this.waitForSelector(this.POSTS_CONTAINER);
  }

  // ── Sidebar: thống kê cá nhân ─────────────────────────────────────────────

  readonly MY_STATS_CARD = 'div:has(> div > div:has-text("Đã hỏi"))';
  readonly MY_QUESTIONS_LINK_BTN = 'button:has-text("Câu hỏi của tôi")';

  async getMyAskedCount(): Promise<string> {
    const el = await this.findVisible('div:has(div:has-text("Đã hỏi")) + div, div:has-text("Đã hỏi") ~ div');
    return ((await el?.textContent()) ?? '').trim();
  }

  async clickMyQuestions(): Promise<void> {
    await this.jsClick(this.page.locator(this.MY_QUESTIONS_LINK_BTN));
  }

  // ── Sidebar: "Thành viên hăng hái" ────────────────────────────────────────

  readonly RANKING_CARD = 'div:has-text("Thành viên hăng hái")';
  readonly RANKING_PERIOD_SELECT = 'select.ranking-board-order';
  readonly RANKING_MEMBER_ITEM = '.ranking-board-members > div';

  async selectRankingPeriod(periodText: string): Promise<void> {
    await this.page.locator('select.ranking-board-order + span .select2-selection').click();
    await this.page.locator('.select2-results__option', { hasText: periodText }).click();
  }

  async getRankingMemberCount(): Promise<number> {
    return this.page.locator(this.RANKING_MEMBER_ITEM).count();
  }

  async getRankingMemberNames(): Promise<string[]> {
    const items = await this.findElements(`${this.RANKING_MEMBER_ITEM} a`);
    const names: string[] = [];
    for (const item of items) {
      names.push(((await item.textContent()) ?? '').trim());
    }
    return names;
  }
}