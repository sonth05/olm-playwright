import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick, safeFill } from '../../../../../core/shared-pages/dismissPopups';
import { ExamModal } from '../../pages/Hoclieucuatoiv2page';

export const HOC_LIEU_TYPE = {
  EXAM_MIXTURE_V2: '21', // Đề kiểm tra (soạn đề / tạo từ ma trận, có thể hiển thị dạng Đề thi hoặc Luyện tập)
  NHCH: '18', // Dạng bài, kĩ năng (NHCH)
  THEORY: '2', // Lý thuyết tương tác
  VIDEO: '5', // Video Youtube có điểm dừng
  ESSAY: '6', // Đề thi Tự luận
  LINK: '9', // Liên kết
  PDF: '10', // Đề thi trắc nghiệm từ file PDF hoặc Word
  EXAM_STANDARD_MATRIX: '13', // Đề thi trắc nghiệm từ ma trận
  EXAM_MIX: '100', // Đề thi trộn Offline
  PRACTICE_MATRIX: '20', // Đề luyện tập trắc nghiệm từ ma trận
  DOCUMENT: '23', // Tài liệu
  SIMULATION: '24', // Mô phỏng, thí nghiệm ảo
  GAME: 'game', // Game hóa
} as const;

export class CreateHocLieuMenu {
  readonly page: Page;
  readonly triggerBtn: Locator;
  readonly menu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.triggerBtn = page.getByRole('button', { name: /Tạo mới học liệu/i });
    this.menu = page.locator('[cmdk-list]');
  }

  async open() {
    await dismissPopups(this.page);
    await this.triggerBtn.click();
    await this.menu.waitFor({ state: 'visible' });
    // Đóng thêm 1 lần nữa NGAY SAU KHI menu mở — phòng trường hợp popup xuất
    // hiện đúng lúc menu đang mở (che mất item cần chọn ở bước gọi tiếp
    // theo, VD itemByValue(...).click() trong createNew()).
    await dismissPopups(this.page);
  }

  itemByValue(value: string): Locator {
    return this.menu.locator(`[cmdk-item][data-value="${value}"]`);
  }

  itemByLabel(label: string | RegExp): Locator {
    return this.menu.getByRole('option', { name: label });
  }

  /** Mở dropdown và chọn loại học liệu cần tạo, trả về Promise điều hướng nếu có */
  async createNew(value: string) {
    await this.open();
    await safeClick(this.page, this.itemByValue(value));
  }

  /**
   * Mở dropdown, chọn loại học liệu, và trả về modal tương ứng đã visible.
   * 
   * Với value = HOC_LIEU_TYPE.EXAM_MIXTURE_V2 ('21') sẽ trả về ExamModal
   * (dùng riêng cho "Đề kiểm tra", hỗ trợ trường SEO và locator an toàn).
   * Các value còn lại trả về CreateMaterialModal.
   */
  async createNewAndOpenModal(value: string): Promise<CreateMaterialModal | ExamModal> {
    await this.createNew(value);
    if (value === HOC_LIEU_TYPE.EXAM_MIXTURE_V2) {
      const modal = new ExamModal(this.page);
      await modal.dialog.waitFor({ state: 'visible' });
      return modal;
    }
    const modal = new CreateMaterialModal(this.page);
    await modal.dialog.waitFor({ state: 'visible' });
    return modal;
  }
}

export class CreateMaterialModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly titleInput: Locator; // Tiêu đề học liệu *
  readonly descriptionInput: Locator; // Mô tả học liệu
  readonly gradeSelectBtn: Locator; // Khối lớp: *
  readonly subjectSelectBtn: Locator; // Môn học: *
  readonly seoKeywordInput: Locator; // Từ khóa SEO (chỉ có ở 1 số loại học liệu, xem docblock lớp)
  readonly seoTitleInput: Locator; // Tiêu đề SEO, tối đa 60 ký tự (chỉ có ở 1 số loại học liệu)
  readonly seoDescriptionInput: Locator; // Mô tả SEO, tối đa 160 ký tự (chỉ có ở 1 số loại học liệu)
  readonly btnCancel: Locator; // Hủy
  readonly btnSubmit: Locator; // Tạo
  readonly btnClose: Locator; // nút "X" đóng modal

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.titleHeading = this.dialog.locator('h2');
    this.titleInput = this.dialog.getByPlaceholder('Nhập tiêu đề');
    this.descriptionInput = this.dialog.getByPlaceholder('Nhập mô tả');
    this.gradeSelectBtn = this.dialog.locator('button[aria-haspopup="dialog"]').nth(0);
    this.subjectSelectBtn = this.dialog.locator('button[aria-haspopup="dialog"]').nth(1);
    this.seoKeywordInput = this.dialog.getByPlaceholder('Nhập từ khóa SEO');
    this.seoTitleInput = this.dialog.getByPlaceholder('Nhập tiêu đề SEO');
    this.seoDescriptionInput = this.dialog.getByPlaceholder('Nhập mô tả SEO');
    this.btnCancel = this.dialog.getByRole('button', { name: /^Hủy$/i });
    this.btnSubmit = this.dialog.getByRole('button', { name: /^Tạo$/i });
    this.btnClose = this.dialog.getByRole('button', { name: /Đóng/i });
  }

  async expectTitle(expected: string | RegExp) {
    await expect(this.titleHeading).toHaveText(expected);
  }

  async fillTitle(title: string) {
    await safeFill(this.page, this.titleInput, title);
  }

  async fillDescription(description: string) {
    await safeFill(this.page, this.descriptionInput, description);
  }

  async selectGrade(label: string | RegExp) {
    await safeClick(this.page, this.gradeSelectBtn);
    await this.searchInPopover(label);
    await safeClick(this.page, this.page.getByRole('option', { name: label }));
    // Xác nhận nút đã cập nhật nhãn (không còn "Chọn khối lớp") — khớp DOM
    // thật đã capture sau khi chọn, đồng thời chờ popover đóng hẳn trước khi
    // thao tác tiếp (VD mở Môn học ngay sau đó).
    await expect(this.gradeSelectBtn.locator('span').first()).toHaveText(label);
  }

  /** Chọn Môn học — cùng cơ chế search-combobox popover, xem docblock selectGrade(). */
  async selectSubject(label: string | RegExp) {
    await safeClick(this.page, this.subjectSelectBtn);
    await this.searchInPopover(label);
    await safeClick(this.page, this.page.getByRole('option', { name: label }));
    await expect(this.subjectSelectBtn.locator('span').first()).toHaveText(label);
  }


  private async searchInPopover(label: string | RegExp) {
    const query = typeof label === 'string' ? label : label.source;
    const searchInput = this.page.getByPlaceholder('Tìm kiếm...');
    await searchInput.waitFor({ state: 'visible' });
    await safeFill(this.page, searchInput, query);
  }

  async selectedGradeText(): Promise<string> {
    return (await this.gradeSelectBtn.locator('span').first().innerText()).trim();
  }

  /** Nhãn hiện tại của nút Môn học (placeholder hoặc giá trị đã chọn, VD "Toán") */
  async selectedSubjectText(): Promise<string> {
    return (await this.subjectSelectBtn.locator('span').first().innerText()).trim();
  }

  /** Xác nhận Khối lớp đã được chọn đúng giá trị (nút không còn hiện placeholder) */
  async expectGradeSelected(expected: string | RegExp) {
    await expect(this.gradeSelectBtn.locator('span').first()).toHaveText(expected);
  }

  /** Xác nhận Môn học đã được chọn đúng giá trị (nút không còn hiện placeholder) */
  async expectSubjectSelected(expected: string | RegExp) {
    await expect(this.subjectSelectBtn.locator('span').first()).toHaveText(expected);
  }

  /** Từ khóa SEO — chỉ dùng cho loại học liệu CÓ khối SEO, xem docblock lớp */
  async fillSeoKeyword(keyword: string) {
    await safeFill(this.page, this.seoKeywordInput, keyword);
  }

  /** Tiêu đề SEO giới hạn 60 ký tự — chỉ dùng cho loại học liệu CÓ khối SEO */
  async fillSeoTitle(seoTitle: string) {
    await safeFill(this.page, this.seoTitleInput, seoTitle);
  }

  /** Mô tả SEO giới hạn 160 ký tự — chỉ dùng cho loại học liệu CÓ khối SEO */
  async fillSeoDescription(seoDescription: string) {
    await safeFill(this.page, this.seoDescriptionInput, seoDescription);
  }

  /** Điền các trường bắt buộc (Tiêu đề, Khối lớp, Môn học) rồi bấm "Tạo" */
  async fillRequiredAndSubmit(options: { title: string; grade: string | RegExp; subject: string | RegExp }) {
    await this.fillTitle(options.title);
    await this.selectGrade(options.grade);
    await this.selectSubject(options.subject);
    await this.submit();
  }

  async submit() {
    await safeClick(this.page, this.btnSubmit);
  }

  async cancel() {
    await safeClick(this.page, this.btnCancel);
  }

  async close() {
    await safeClick(this.page, this.btnClose);
  }
}