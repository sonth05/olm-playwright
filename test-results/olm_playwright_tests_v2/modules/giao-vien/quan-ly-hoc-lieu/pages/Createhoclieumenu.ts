import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick, safeFill } from '../../../../core/shared-pages/dismissPopups';
// FIX: item trong [cmdk-list] (VD data-value="18" – NHCH) đôi khi chưa nằm
// trong viewport của danh sách cuộn (đặc biệt sau khi vừa đóng modal loại
// trước đó) khiến .click() timeout dù phần tử đã tồn tại trong DOM. Cần
// scrollIntoViewIfNeeded() trước khi click, và mở lại menu 1 lần nếu item
// không tìm thấy (phòng trường hợp modal trước dismiss() chưa kịp đóng hẳn
// khiến menu vừa mở bị đóng theo / mất trạng thái).
import { ExamModal, GameQuestionModal } from './Hoclieucuatoiv2page';

export const HOC_LIEU_TYPE = {
  EXAM_MIXTURE_V2: '21',
  NHCH: '18',
  THEORY: '2',
  VIDEO: '5',
  ESSAY: '6',
  LINK: '9',
  PDF: '10',
  EXAM_STANDARD_MATRIX: '13',
  EXAM_MIX: '100',
  PRACTICE_MATRIX: '20',
  DOCUMENT: '23',
  SIMULATION: '24',
  GAME: 'game',
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

    // FIX (lỗi mới): sau khi đóng modal của loại học liệu trước, click vào
    // triggerBtn để mở lại menu không còn tác dụng — [cmdk-list] không bao
    // giờ visible (timeout 20s). Nguyên nhân: modal/backdrop vừa đóng còn
    // đang animation fade-out, che/chặn pointer-events vài trăm ms khiến
    // click "trượt"; hoặc triggerBtn là nút TOGGLE nên nếu menu đang kẹt ở
    // trạng thái mở dở dang từ vòng trước, click tiếp theo sẽ ĐÓNG thay vì
    // MỞ. Trước đây chỉ click 1 lần rồi chờ — không có cơ chế phục hồi.

    // 1. Nếu menu đang lỡ hiển thị sẵn (kẹt từ vòng trước) → đóng hẳn bằng
    //    Escape để đảm bảo click kế tiếp chắc chắn là hành động MỞ.
    if (await this.menu.isVisible({ timeout: 300 }).catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await this.menu.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    }

    // 2. Thử click + chờ menu hiện, retry tối đa 3 lần với dismissPopups()
    //    + nghỉ ngắn giữa các lần (chờ animation đóng modal trước hoàn tất).
    let opened = false;
    for (let attempt = 0; attempt < 3 && !opened; attempt++) {
      try {
        await this.triggerBtn.click({ timeout: 5_000 });
        await this.menu.waitFor({ state: 'visible', timeout: 5_000 });
        opened = true;
      } catch {
        await dismissPopups(this.page);
        await this.page.waitForTimeout(400);
      }
    }

    // 3. Lần cuối cùng: click force, để nếu vẫn lỗi thì báo lỗi thật (đúng
    //    nguyên nhân gốc) thay vì bị nuốt mất trong vòng lặp trên.
    if (!opened) {
      await this.triggerBtn.click({ force: true });
      await this.menu.waitFor({ state: 'visible' });
    }

    await dismissPopups(this.page);
  }

  itemByValue(value: string): Locator {
    return this.menu.locator(`[cmdk-item][data-value="${value}"]`);
  }

  itemByLabel(label: string | RegExp): Locator {
    return this.menu.getByRole('option', { name: label });
  }

  async createNew(value: string) {
    await this.open();
    let item = this.itemByValue(value);

    // Đảm bảo item nằm trong viewport của danh sách cuộn trước khi click.
    // Nếu không tìm thấy/không scroll được (menu có thể đã bị đóng do dư
    // âm của lần dismiss() modal trước), thử mở lại menu 1 lần.
    const scrolled = await item
      .scrollIntoViewIfNeeded({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (!scrolled) {
      await this.open();
      item = this.itemByValue(value);
      await item.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
    }

    await safeClick(this.page, item, 15_000);
  }

  async createNewAndOpenModal(value: string): Promise<CreateMaterialModal | ExamModal | GameQuestionModal> {
    await this.createNew(value);
    if (value === HOC_LIEU_TYPE.EXAM_MIXTURE_V2) {
      const modal = new ExamModal(this.page);
      await modal.dialog.waitFor({ state: 'visible' });
      return modal;
    }
    if (value === HOC_LIEU_TYPE.GAME) {
      const modal = new GameQuestionModal(this.page);
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
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly gradeSelectBtn: Locator;
  readonly subjectSelectBtn: Locator;
  readonly seoKeywordInput: Locator;
  readonly seoTitleInput: Locator;
  readonly seoDescriptionInput: Locator;
  readonly btnCancel: Locator;
  readonly btnSubmit: Locator;
  readonly btnClose: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    // FIX 1: Dùng h2, h1, [role="heading"] để bắt được mọi loại modal (kể cả Game hóa không có h2)
    this.titleHeading = this.dialog.locator('h2, h1, [role="heading"]').first();

    // FIX 2: Thêm .first() để tránh strict mode khi role olmStaff có thêm field SEO cùng placeholder
    this.titleInput = this.dialog.getByPlaceholder('Nhập tiêu đề').first();
    this.descriptionInput = this.dialog.getByPlaceholder('Nhập mô tả').first();

    this.gradeSelectBtn = this.dialog.locator('button[aria-haspopup="dialog"]').nth(0);
    this.subjectSelectBtn = this.dialog.locator('button[aria-haspopup="dialog"]').nth(1);

    this.seoKeywordInput = this.dialog.getByPlaceholder('Nhập từ khóa SEO');
    this.seoTitleInput = this.dialog.getByPlaceholder('Nhập tiêu đề SEO');
    this.seoDescriptionInput = this.dialog.getByPlaceholder('Nhập mô tả SEO');

    // FIX 3: Dùng regex + .first() thay vì exact string (DOM thật có cả 'Hủy' và 'Huỷ')
    this.btnCancel = this.dialog.getByRole('button', { name: /Huỷ|Hủy|Hủy bỏ|Huỷ bỏ|Cancel/i }).first();
    this.btnSubmit = this.dialog.getByRole('button', { name: /Tạo|Tạo đề|Submit|Lưu/i }).first();
    this.btnClose = this.dialog.getByRole('button', { name: /Đóng/i });
  }

  // FIX 4: Dùng toContainText (linh hoạt hơn toHaveText)
  async expectTitle(expected: string | RegExp) {
    await expect(this.titleHeading).toContainText(expected);
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
    await safeClick(this.page, this.exactOption(label));
    await expect(this.gradeSelectBtn.locator('span').first()).toHaveText(label);
  }

  async selectSubject(label: string | RegExp) {
    await safeClick(this.page, this.subjectSelectBtn);
    await this.searchInPopover(label);
    await safeClick(this.page, this.exactOption(label));
    await expect(this.subjectSelectBtn.locator('span').first()).toHaveText(label);
  }

  private async searchInPopover(label: string | RegExp) {
    const query = typeof label === 'string' ? label : label.source;
    const searchInput = this.page.getByPlaceholder('Tìm kiếm...');
    await searchInput.waitFor({ state: 'visible' });
    await safeFill(this.page, searchInput, query);
  }

  /**
   * Locator KHỚP CHÍNH XÁC 1 option trong popover Khối lớp/Môn học — xem
   * docblock chi tiết ở ExamModal.exactOption() (Hoclieucuatoiv2page.ts).
   * Bug substring-match (VD /Toán/i khớp cả "Toán", "BD Toán", "Thực hành
   * Toán", "Toán (tiếng Pháp)"...) xảy ra ở ĐÂY — CreateMaterialModal —
   * với TẤT CẢ 11 loại học liệu còn lại (không riêng "Đề kiểm tra"), vì
   * class này được `CreateHocLieuMenu.createNewAndOpenModal()` dùng chung
   * cho mọi loại ngoại trừ EXAM_MIXTURE_V2/GAME.
   */
  private exactOption(label: string | RegExp): Locator {
    if (typeof label === 'string') {
      return this.page.getByRole('option', { name: label, exact: true });
    }
    const source = label.source.startsWith('^') && label.source.endsWith('$')
      ? label.source
      : `^${label.source}$`;
    return this.page.getByRole('option', { name: new RegExp(source, label.flags) });
  }

  async selectedGradeText(): Promise<string> {
    return (await this.gradeSelectBtn.locator('span').first().innerText()).trim();
  }

  async selectedSubjectText(): Promise<string> {
    return (await this.subjectSelectBtn.locator('span').first().innerText()).trim();
  }

  async expectGradeSelected(expected: string | RegExp) {
    await expect(this.gradeSelectBtn.locator('span').first()).toHaveText(expected);
  }

  async expectSubjectSelected(expected: string | RegExp) {
    await expect(this.subjectSelectBtn.locator('span').first()).toHaveText(expected);
  }

  async fillSeoKeyword(keyword: string) {
    await safeFill(this.page, this.seoKeywordInput, keyword);
  }

  async fillSeoTitle(seoTitle: string) {
    await safeFill(this.page, this.seoTitleInput, seoTitle);
  }

  async fillSeoDescription(seoDescription: string) {
    await safeFill(this.page, this.seoDescriptionInput, seoDescription);
  }

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

  // FIX 5: Thêm method dismiss() để test spec gọi được modal.dismiss()
  async dismiss() {
    await this.cancel();
    await this.dialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    // FIX: đợi backdrop/overlay biến mất hẳn (animation fade-out của modal)
    // trước khi trả quyền điều khiển lại cho vòng lặp — nếu không, lần mở
    // menu "Tạo mới học liệu" kế tiếp có thể bị click "trượt" do overlay
    // còn đang chặn pointer-events.
    await this.page
      .locator('.modal-backdrop, [class*="backdrop"]')
      .first()
      .waitFor({ state: 'hidden', timeout: 3_000 })
      .catch(() => {});
  }
}