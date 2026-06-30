import { HOI_DAP_URL } from '../config/config';
import { BasePage } from './BasePage';

/**
 * Page Object cho trang Hỏi đáp (olm.vn/hoi-dap).
 *
 * Selectors được lấy từ DOM thực tế:
 *
 * Lọc lớp: sidebar bên trái có list <ul class="sidebar-list-grade">
 *   → mỗi lớp là <a href="/hoi-dap?lop=N">
 *
 * Lọc môn: dropdown .dropdown-menu bên trên danh sách câu hỏi
 *   → <a class="dropdown-item" href="/hoi-dap?mon=N">
 *
 * Tab loại câu hỏi: <ul class="nav nav-tabs">
 *   → <a class="nav-link">Tất cả / Mới nhất / Câu hỏi hay / Chưa trả lời / Câu hỏi vip
 *
 * Danh sách câu hỏi: div.card.card-post (mỗi câu hỏi là 1 card)
 *
 * Link câu hỏi: <a href="/cau-hoi/...">
 *
 * Bình luận/đáp án: .card-comment
 *
 * Vote: .action-comment-trigger[data-typed="like"]
 *
 * Load more: button.btn-loadmore-comment hoặc nav.pagination
 *
 * Badge VIP: .badge-pill.olm-bg-two (text = "VIP")
 *
 * Tạo câu hỏi (khi chưa login): .create-post-trigger .form-control (input placeholder)
 *   Khi đã login: mở form tạo bài
 */
export class HoiDapPage extends BasePage {
  static readonly URL = HOI_DAP_URL;

  // ── Sidebar lọc lớp ──────────────────────────────────────────────────────
  /** Link lọc theo lớp: /hoi-dap?lop=N */
  static readonly SIDEBAR_GRADE_LINKS = '.sidebar-list-grade a';

  // ── Tab loại câu hỏi (Tất cả / Mới nhất / Câu hỏi hay / Chưa trả lời / Câu hỏi vip) ──
  static readonly TYPE_TABS = 'ul.nav.nav-tabs .nav-link';

  // ── Dropdown lọc môn học ─────────────────────────────────────────────────
  static readonly SUBJECT_DROPDOWN_BTN = '.dropdown button[data-toggle="dropdown"]';
  static readonly SUBJECT_DROPDOWN_ITEMS = '.dropdown-menu .dropdown-item';

  // ── Danh sách câu hỏi ────────────────────────────────────────────────────
  /** Mỗi câu hỏi là một card  */
  static readonly QUESTION_CARD = 'div.card.card-post';

  /** Link vào chi tiết câu hỏi */
  static readonly QUESTION_LINK = "a[href*='/cau-hoi/']";

  /** Nội dung text trong card */
  static readonly QUESTION_CONTENT = '.card-post-content';

  // ── Bình luận / đáp án ───────────────────────────────────────────────────
  static readonly ANSWER_CARD = '.card-comment';

  /** Nút "Đúng" (vote) bên trong mỗi bình luận */
  static readonly VOTE_BTN = '.action-comment-trigger[data-typed="like"]';

  /** Số đếm vote */
  static readonly VOTE_COUNTER = '.action-comment-trigger[data-typed="like"] .counter';

  // ── Load more câu trả lời ────────────────────────────────────────────────
  static readonly LOAD_MORE_ANSWERS_BTN = 'button.btn-loadmore-comment';

  /** Phân trang (trang sau) */
  static readonly NEXT_PAGE = 'a[href*="trang-sau"]';

  // ── Badge VIP ────────────────────────────────────────────────────────────
  static readonly VIP_BADGE = '.badge-pill.olm-bg-two';

  // ── Tạo câu hỏi ─────────────────────────────────────────────────────────
  /**
   * Input "Trả lời nhanh câu hỏi này" (hiển thị với mọi user).
   * Khi chưa login click vào → redirect dangnhap.
   */
  static readonly QUICK_REPLY_INPUT = '.create-comment-trigger .form-control';

  /**
   * Trigger mở form tạo câu hỏi mới (chỉ hiện khi login).
   * Selector: .create-post-trigger .card (click để mở form).
   */
  static readonly CREATE_POST_TRIGGER = '.create-post-trigger .card';

  /** Input/p[contenteditable] bên trong form tạo câu hỏi (sau khi mở) */
  static readonly CREATE_POST_INPUT = [
    '#form-create-post input[type="text"]',
    '#form-create-post [contenteditable="true"]',
    '#form-create-post textarea',
  ].join(', ');

  /** Nút Xác nhận gửi câu hỏi */
  static readonly SUBMIT_POST_BTN = '.modal-header .btn-submit, #modal-one-post .btn-submit';

  // ── Tag câu hỏi ──────────────────────────────────────────────────────────
  static readonly QUESTION_TAG = '.card-post-tag';

  // ── Thời gian đăng ───────────────────────────────────────────────────────
  static readonly POST_TIME = '.card-body .extra.time';

  // ─────────────────────────────────────────────────────────────────────────
  // Methods
  // ─────────────────────────────────────────────────────────────────────────

  async open(): Promise<this> {
    await this.navigateTo(HoiDapPage.URL);
    await this.page.waitForSelector(HoiDapPage.QUESTION_CARD, { timeout: 30_000 });
    // Một số nội dung trong card (thời gian đăng "X giờ trước", tag môn học…)
    // chỉ render sau khi card được cuộn vào viewport (lazy-render). Cuộn nhẹ
    // xuống để các câu hỏi đầu trang hiển thị đầy đủ trước khi test thao tác.
    await this.scrollToBottom(2, 400);
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(300);
    return this;
  }

  /** Lọc theo lớp bằng cách click link trong sidebar. grade = 1..12, 0 = Mẫu giáo, 13 = ĐH */
  async filterByGrade(grade: number): Promise<this> {
    const links = await this.page.locator(HoiDapPage.SIDEBAR_GRADE_LINKS).all();
    for (const link of links) {
      const href = (await link.getAttribute('href')) ?? '';
      if (href.includes(`lop=${grade}`)) {
        await this.jsClick(link);
        await this.page.waitForLoadState('domcontentloaded');
        break;
      }
    }
    return this;
  }

  /** Lọc theo tab loại: 'Tất cả' | 'Mới nhất' | 'Câu hỏi hay' | 'Chưa trả lời' | 'Câu hỏi vip' */
  async filterByType(tabText: string): Promise<this> {
    const tabs = await this.page.locator(HoiDapPage.TYPE_TABS).all();
    for (const tab of tabs) {
      const text = ((await tab.textContent()) ?? '').trim();
      if (text.toLowerCase().includes(tabText.toLowerCase())) {
        await this.jsClick(tab);
        await this.page.waitForLoadState('domcontentloaded');
        break;
      }
    }
    return this;
  }

  /** Lọc theo môn học (mở dropdown rồi click item). subject = tên môn, vd 'Toán', 'Vật lý' */
  async filterBySubject(subject: string): Promise<this> {
    // Mở dropdown
    const dropdownBtn = await this.findVisible([HoiDapPage.SUBJECT_DROPDOWN_BTN], 5);
    if (dropdownBtn) {
      await this.jsClick(dropdownBtn);
      await this.page.waitForTimeout(300);
    }
    // Click item
    const items = await this.page.locator(HoiDapPage.SUBJECT_DROPDOWN_ITEMS).all();
    for (const item of items) {
      const text = ((await item.textContent()) ?? '').trim();
      if (text.toLowerCase().includes(subject.toLowerCase())) {
        await this.jsClick(item);
        await this.page.waitForLoadState('domcontentloaded');
        break;
      }
    }
    return this;
  }

  /** Đếm số card câu hỏi trên trang */
  async getQuestionCount(): Promise<number> {
    return this.page.locator(HoiDapPage.QUESTION_CARD).count();
  }

  /** Lấy text của câu hỏi đầu tiên */
  async getFirstQuestionText(): Promise<string> {
    const first = this.page.locator(HoiDapPage.QUESTION_CONTENT).first();
    return ((await first.textContent()) ?? '').trim();
  }

  /** Click vào câu hỏi thứ N (0-based) để vào trang chi tiết */
  async clickQuestion(index = 0): Promise<this> {
    const links = await this.page.locator(HoiDapPage.QUESTION_LINK).all();
    if (links[index]) {
      await this.jsClick(links[index]);
      await this.page.waitForLoadState('domcontentloaded');
    }
    return this;
  }

  /** Click "Xem thêm câu trả lời" (load more answers) trong card đầu tiên */
  async clickLoadMoreAnswers(): Promise<this> {
    const btn = await this.findVisible([HoiDapPage.LOAD_MORE_ANSWERS_BTN], 5);
    if (btn) {
      await this.jsClick(btn);
      await this.page.waitForTimeout(500);
    }
    return this;
  }

  /** Click sang trang sau (phân trang câu hỏi) */
  async goNextPage(): Promise<this> {
    const btn = await this.findVisible([HoiDapPage.NEXT_PAGE], 5);
    if (btn) {
      await this.jsClick(btn);
      await this.page.waitForLoadState('domcontentloaded');
    }
    return this;
  }

  /** Đếm số đáp án trong card câu hỏi đầu tiên */
  async getAnswerCountInFirstCard(): Promise<number> {
    return this.page.locator(HoiDapPage.ANSWER_CARD).count();
  }

  /** Kiểm tra có badge VIP trên trang không */
  async hasVipBadge(): Promise<boolean> {
    return (await this.page.locator(HoiDapPage.VIP_BADGE).count()) > 0;
  }

  /** Kiểm tra active tab hiện tại */
  async getActiveTabText(): Promise<string> {
    const active = this.page.locator(`${HoiDapPage.TYPE_TABS}.active`).first();
    return ((await active.textContent()) ?? '').trim();
  }

  /** Lấy href của active tab (để kiểm tra URL query) */
  async getActiveTabHref(): Promise<string> {
    const active = this.page.locator(`${HoiDapPage.TYPE_TABS}.active`).first();
    return (await active.getAttribute('href')) ?? '';
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('hoi-dap');
  }
}