import { BasePage } from '@core/shared-pages/BasePage';
import {
  BASE_URL,
  DANH_SACH_CAU_HOI_DA_XOA_URL,
  danhSachCauHoiDaXoaPageUrl,
} from '@config/config';

/**
 * Page Object — Danh sách câu hỏi đã bị xóa (5.2.2).
 * URL: {BASE_URL}/danh-sach-cau-hoi-bi-xoa#menu-danh-sach-cau-hoi-bi-xoa
 * Phân trang: {BASE_URL}/danh-sach-cau-hoi-bi-xoa/page-{n} (dataset RẤT lớn —
 * ví dụ thực tế quan sát được lên tới hơn 38.000 trang).
 *
 * Bố cục trang:
 *  1. Bộ lọc (`#elmViewDeletedQuestion` > `.tw-grid.tw-grid-cols-6`) — 8 field
 *     (ID khóa học, ID danh mục, Dạng câu hỏi, Mức độ, Trạng thái, Lớp học,
 *     Câu hỏi lỗi, Môn học) + nút "Lọc". Tất cả field đều optional, filter
 *     rỗng nghĩa là "Tất cả".
 *  2. Danh sách câu hỏi đã xóa — mỗi câu hỏi là 1 "card"
 *     (`.tw-p-3.tw-border.tw-shadow-sm`) gồm:
 *       - Khối thông tin (Tiêu đề / Người tạo / Học liệu) + nút "Sửa câu hỏi"
 *       - Khối preview câu hỏi render qua Web Component (`<type-quiz-x>`,
 *         `<type-select-text>`, `<type-mix>`...) dùng SHADOW DOM (open) —
 *         CHỦ Ý: các selector lấy thông tin (title/creator/material/edit
 *         link) chỉ scope trong khối thông tin phía trên (LIGHT DOM), KHÔNG
 *         động vào phần preview shadow DOM vì nội dung câu hỏi rất đa dạng
 *         theo từng dạng (q_type) và không cần thiết cho việc quản lý danh sách.
 *  3. Phân trang Bootstrap chuẩn (`ul.pagination.pagination-secondary`) —
 *     link "…" (ellipsis) và "»" (next) có `data-page=""` (rỗng), KHÔNG phải
 *     số — cần lọc ra khi tính tổng số trang.
 *
 * Dùng kết hợp:
 *   const page = new DanhSachCauHoiDaXoaPage(p);
 *   await page.open();
 *   await page.applyFilter({ subject: '3', level: '2' }); // Toán, Thông hiểu
 *   const cards = await page.getDeletedQuestionCards();
 *   await page.clickEditQuestion(cards[0].title);
 */

export interface CauHoiDaXoaFilter {
  /** ID khóa học (input#id_course, type number) */
  idCourse?: number | string;
  /** ID danh mục (input#id_category, type number) */
  idCategory?: number | string;
  /** Dạng câu hỏi — value của <option> trong select#q_type (VD: '1' = Trắc nghiệm 4 phương án) */
  qType?: string;
  /** Mức độ câu hỏi — value của <option> trong select#level (1=Nhận biết…4=Vận dụng cao) */
  level?: string;
  /** Trạng thái duyệt — value của <option> trong select#reviewed
   *  (0=Chưa duyệt, 1=Được duyệt, 2=Sử dụng nhưng không được duyệt,
   *   9=Đã sửa chờ duyệt lại, 10=Có lỗi) */
  reviewed?: string;
  /** Lớp học — value của <option> trong select#id_grade (1..12) */
  idGrade?: string;
  /** Câu hỏi lỗi — value của <option> trong select#qerror (1=Có lỗi, 0=Không lỗi) */
  qerror?: string;
  /** Môn học — value của <option> trong select#subject (VD: '3' = Toán) */
  subject?: string;
}

export interface DeletedQuestionCardInfo {
  title: string;
  creator: string;
  materialName: string;
  materialUrl: string;
  /** URL trang sửa câu hỏi, dạng {BASE_URL}/course/cau-hoi/cap-nhat/{id}?deleted=10 */
  editUrl: string;
}

export class DanhSachCauHoiDaXoaPage extends BasePage {
  static readonly URL = DANH_SACH_CAU_HOI_DA_XOA_URL;

  // ── Bộ lọc (#elmViewDeletedQuestion) ────────────────────────────────────
  static readonly FILTER_FORM = '#elmViewDeletedQuestion';
  static readonly INPUT_ID_COURSE = '#id_course';
  static readonly INPUT_ID_CATEGORY = '#id_category';
  static readonly SELECT_Q_TYPE = '#q_type';
  static readonly SELECT_LEVEL = '#level';
  static readonly SELECT_REVIEWED = '#reviewed';
  static readonly SELECT_ID_GRADE = '#id_grade';
  static readonly SELECT_QERROR = '#qerror';
  static readonly SELECT_SUBJECT = '#subject';
  static readonly BTN_FILTER = `${DanhSachCauHoiDaXoaPage.FILTER_FORM} button:has-text("Lọc")`;

  // ── Card câu hỏi đã xóa ──────────────────────────────────────────────────
  /** Mỗi card là con trực tiếp của `.tw-mt-3` (wrapper danh sách, nằm ngay dưới bộ lọc) */
  static readonly CARD = '.tw-mt-3 > .tw-p-3.tw-border.tw-shadow-sm';
  /** Khối thông tin (Tiêu đề/Người tạo/Học liệu + nút Sửa) — LIGHT DOM, không lẫn shadow DOM preview */
  static readonly CARD_INFO_BLOCK = '.tw-flex.tw-flex-wrap.tw-items-start.tw-justify-between.tw-gap-4';
  static readonly CARD_EDIT_LINK = 'a[href*="/course/cau-hoi/cap-nhat/"]';

  // ── Phân trang ───────────────────────────────────────────────────────────
  static readonly PAGINATION = 'ul.pagination.pagination-secondary';
  static readonly PAGE_LINK = `${DanhSachCauHoiDaXoaPage.PAGINATION} a.page-link`;
  static readonly ACTIVE_PAGE_LINK = `${DanhSachCauHoiDaXoaPage.PAGINATION} li.page-item.active a.page-link`;

  // ==================================================================
  // Điều hướng
  // ==================================================================

  /** Mở trang, mặc định trang 1. Truyền pageNum > 1 để mở thẳng trang tương ứng. */
  async open(pageNum = 1): Promise<this> {
    const url = pageNum > 1 ? danhSachCauHoiDaXoaPageUrl(pageNum) : DanhSachCauHoiDaXoaPage.URL;
    await this.navigateTo(url);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('danh-sach-cau-hoi-bi-xoa');
  }

  // ==================================================================
  // Bộ lọc
  // ==================================================================

  /** Điền các field lọc (KHÔNG bấm "Lọc" — dùng kèm clickFilter() hoặc applyFilter()) */
  async setFilter(filter: CauHoiDaXoaFilter): Promise<this> {
    if (filter.idCourse !== undefined) {
      await this.jsClearAndType(
        this.page.locator(DanhSachCauHoiDaXoaPage.INPUT_ID_COURSE),
        String(filter.idCourse)
      );
    }
    if (filter.idCategory !== undefined) {
      await this.jsClearAndType(
        this.page.locator(DanhSachCauHoiDaXoaPage.INPUT_ID_CATEGORY),
        String(filter.idCategory)
      );
    }
    if (filter.qType !== undefined) {
      await this.page.locator(DanhSachCauHoiDaXoaPage.SELECT_Q_TYPE).selectOption(filter.qType);
    }
    if (filter.level !== undefined) {
      await this.page.locator(DanhSachCauHoiDaXoaPage.SELECT_LEVEL).selectOption(filter.level);
    }
    if (filter.reviewed !== undefined) {
      await this.page.locator(DanhSachCauHoiDaXoaPage.SELECT_REVIEWED).selectOption(filter.reviewed);
    }
    if (filter.idGrade !== undefined) {
      await this.page.locator(DanhSachCauHoiDaXoaPage.SELECT_ID_GRADE).selectOption(filter.idGrade);
    }
    if (filter.qerror !== undefined) {
      await this.page.locator(DanhSachCauHoiDaXoaPage.SELECT_QERROR).selectOption(filter.qerror);
    }
    if (filter.subject !== undefined) {
      await this.page.locator(DanhSachCauHoiDaXoaPage.SELECT_SUBJECT).selectOption(filter.subject);
    }
    return this;
  }

  /** Bấm nút "Lọc" — trang có thể submit lại (query string) hoặc gọi AJAX tùy môi trường,
   *  nên đợi domcontentloaded best-effort thay vì giả định luôn có navigation mới. */
  async clickFilter(): Promise<this> {
    await this.jsClick(this.page.locator(DanhSachCauHoiDaXoaPage.BTN_FILTER));
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  /** Điền filter + bấm "Lọc" trong 1 lần gọi */
  async applyFilter(filter: CauHoiDaXoaFilter): Promise<this> {
    await this.setFilter(filter);
    await this.clickFilter();
    return this;
  }

  // ==================================================================
  // Danh sách câu hỏi đã xóa
  // ==================================================================

  /** Đọc toàn bộ card câu hỏi đã xóa hiển thị trên trang hiện tại (không tự phân trang) */
  async getDeletedQuestionCards(): Promise<DeletedQuestionCardInfo[]> {
    const cards = await this.page.locator(DanhSachCauHoiDaXoaPage.CARD).all();
    const result: DeletedQuestionCardInfo[] = [];

    for (const card of cards) {
      const infoBlock = card.locator(DanhSachCauHoiDaXoaPage.CARD_INFO_BLOCK).first();

      const title = (
        (await infoBlock.locator('span:has-text("Tiêu đề:") strong').first().textContent().catch(() => '')) ?? ''
      ).trim();
      const creator = (
        (await infoBlock.locator('span:has-text("Người tạo:") strong').first().textContent().catch(() => '')) ?? ''
      ).trim();

      const materialLink = infoBlock.locator('span:has-text("Học liệu:") a').first();
      const materialName = ((await materialLink.textContent().catch(() => '')) ?? '').trim();
      const materialHref = (await materialLink.getAttribute('href').catch(() => '')) ?? '';

      const editLink = card.locator(DanhSachCauHoiDaXoaPage.CARD_EDIT_LINK).first();
      const editHref = (await editLink.getAttribute('href').catch(() => '')) ?? '';

      result.push({
        title,
        creator,
        materialName,
        materialUrl: materialHref ? (materialHref.startsWith('http') ? materialHref : `${BASE_URL}${materialHref}`) : '',
        editUrl: editHref ? (editHref.startsWith('http') ? editHref : `${BASE_URL}${editHref}`) : '',
      });
    }
    return result;
  }

  /** Tổng số câu hỏi đã xóa hiển thị trên trang hiện tại (không phải tổng toàn hệ thống) */
  async getDeletedQuestionCount(): Promise<number> {
    return this.page.locator(DanhSachCauHoiDaXoaPage.CARD).count();
  }

  /** Tìm 1 câu hỏi theo tiêu đề (khớp 1 phần) trong danh sách hiện tại trên trang */
  async findQuestionByTitle(titlePart: string): Promise<DeletedQuestionCardInfo | null> {
    const cards = await this.getDeletedQuestionCards();
    return cards.find((c) => c.title.includes(titlePart)) ?? null;
  }

  /** Bấm "Sửa câu hỏi" ứng với 1 tiêu đề (khớp 1 phần, lấy card đầu tiên khớp) */
  async clickEditQuestion(titlePart: string): Promise<this> {
    const card = this.page.locator(DanhSachCauHoiDaXoaPage.CARD).filter({ hasText: titlePart }).first();
    const editLink = card.locator(DanhSachCauHoiDaXoaPage.CARD_EDIT_LINK).first();
    await editLink.waitFor({ state: 'visible', timeout: 10_000 });
    await this.jsClick(editLink);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Phân trang
  // ==================================================================

  /** Số trang hiện tại — ưu tiên đọc từ `li.active` trên UI, fallback parse URL (/page-{n}) */
  async getCurrentPage(): Promise<number> {
    const activeText =
      (await this.page.locator(DanhSachCauHoiDaXoaPage.ACTIVE_PAGE_LINK).first().textContent().catch(() => null)) ??
      '';
    const fromUi = parseInt(activeText.trim(), 10);
    if (!Number.isNaN(fromUi)) return fromUi;

    const match = this.getCurrentUrl().match(/page-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /** Tổng số trang — lấy số lớn nhất trong các `data-page` (bỏ qua "…"/"»" có data-page rỗng) */
  async getTotalPages(): Promise<number> {
    const dataPages = await this.page
      .locator(DanhSachCauHoiDaXoaPage.PAGE_LINK)
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute('data-page'))
          .filter((v): v is string => !!v && /^\d+$/.test(v))
          .map(Number)
      );
    return dataPages.length ? Math.max(...dataPages) : 1;
  }

  /** Điều hướng thẳng tới 1 số trang cụ thể (đi qua URL — an toàn với dataset cực lớn) */
  async goToPage(pageNum: number): Promise<this> {
    await this.navigateTo(danhSachCauHoiDaXoaPageUrl(pageNum));
    return this;
  }

  /** Bấm nút "»" (trang kế tiếp) trên thanh phân trang, nếu có */
  async goToNextPage(): Promise<this> {
    const nextArrow = this.page
      .locator(DanhSachCauHoiDaXoaPage.PAGINATION)
      .locator('a.page-link')
      .filter({ hasText: '»' })
      .first();
    await this.jsClick(nextArrow);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }
}