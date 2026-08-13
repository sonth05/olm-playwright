import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick, safeFill } from '../../../../core/shared-pages/dismissPopups';
import { HocLieuCuaToiV2Page, ExamModal } from './Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from './Createhoclieumenu';

export class QuanLyHocLieuPage {
  readonly page: Page;

  // ─── Header học liệu: badge, tiêu đề, trạng thái, người tạo ────────────
  /** Badge "Lớp X" — thứ tự cố định trong DOM (badge đầu tiên). */
  readonly gradeBadge: Locator;
  /** Badge môn học (VD "Toán") — badge thứ 2, ngay sau gradeBadge. */
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  readonly materialTypeLabel: Locator;
  readonly creatorName: Locator;

  // Hành động chính ở header
  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;
  readonly publishHintText: Locator;

  // Hàng liên kết phụ (dưới header, phía trên khối Tuần/KCT)
  readonly submissionListLink: Locator;
  readonly shuffleExamLink: Locator;
  readonly statsLink: Locator;
  readonly advancedSettingButton: Locator;
  readonly moreActionsButton: Locator;
  readonly viewContentLink: Locator;

  // Khối Tuần / KCT / Quy tắc viết nội dung
  readonly weeksInput: Locator;
  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  // Khối "Nội dung học liệu": tiêu đề + chế độ soạn + hành động lưu/tải/xem
  readonly contentHeading: Locator;
  readonly tabChooseQuestions: Locator;
  readonly tabMatrixQuestions: Locator;
  readonly downloadButton: Locator;
  readonly previewButton: Locator;
  readonly saveChangeButton: Locator;

  // Cột trái: tìm kiếm & nguồn câu hỏi
  readonly searchQuestionInput: Locator;
  readonly searchButton: Locator;
  readonly tabThisCourse: Locator;
  readonly tabMyCourses: Locator;
  readonly tabOlmCourses: Locator;
  readonly createQuestionButton: Locator;
  readonly importFileButton: Locator;
  readonly questionCountLabel: Locator;
  readonly questionListEmptyState: Locator;

  // Cột phải: thanh tổng điểm + toolbar soạn thảo + vùng nội dung
  readonly totalScoreBadge: Locator;
  readonly scoringMethodSelect: Locator;
  readonly undoButton: Locator;
  readonly redoButton: Locator;
  readonly clearFormatButton: Locator;
  readonly exitSelectionButton: Locator;
  readonly fullscreenButton: Locator;
  readonly editHtmlButton: Locator;
  readonly addSectionButton: Locator;
  readonly addNoteButton: Locator;
  readonly removeAllButton: Locator;
  readonly editorTextbox: Locator;
  readonly editorPlaceholder: Locator;

  // Khối chọn ma trận — `tw-hidden` mặc định, chỉ hiện khi bật tabMatrixQuestions
  readonly createMatrixFromCourseButton: Locator;
  readonly matrixListLink: Locator;
  readonly matrixCodeInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // ── Header ──────────────────────────────────────────────────────────
    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.materialTypeLabel = page.getByText('Đề thi kiểm tra', { exact: true });
    // Tên người tạo là div ngay sau div-bọc-avatar (ảnh + tên không cùng 1
    // thẻ) — đi từ ảnh avatar rồi lấy div anh-em kế tiếp thay vì đoán class
    // (class tw-line-clamp-1 không đủ đặc trưng, dễ trùng chỗ khác).
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');
    this.publishHintText = page.getByText('Xuất bản để có thể bắt đầu giao bài cho học sinh');

    // ── Hàng liên kết phụ ───────────────────────────────────────────────
    this.submissionListLink = page.getByRole('link', { name: 'Danh sách bài làm' });
    this.shuffleExamLink = page.getByRole('link', { name: 'Trộn đề' });
    this.statsLink = page.getByRole('link', { name: 'Thống kê' });
    this.advancedSettingButton = page.getByRole('button', { name: 'Thiết lập nâng cao' });
    this.moreActionsButton = page.getByRole('button', { name: 'Thêm hành động' });
    this.viewContentLink = page.getByRole('link', { name: 'Xem nội dung' });

    // ── Tuần / KCT / Quy tắc viết nội dung ──────────────────────────────
    // Cố tình KHÔNG dùng #category-weeks-<id> (ID gắn cứng theo từng
    // category) — page object này được tái sử dụng cho nhiều đề khác nhau.
    this.weeksInput = page.getByPlaceholder('Nhập các tuần');
    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    // ── Nội dung học liệu: tiêu đề + tab chế độ + hành động ─────────────
    this.contentHeading = page.getByText('Nội dung học liệu', { exact: true });
    this.tabChooseQuestions = page.getByRole('radio', { name: 'Chọn câu hỏi từ học liệu' });
    this.tabMatrixQuestions = page.getByRole('radio', { name: 'Tạo đề từ ma trận' });
    // "Tải bài" là div (không phải <button>) mở dialog — lọc theo
    // aria-haspopup="dialog" + đúng text để không dính "Thiết lập nâng cao"
    // (cũng aria-haspopup="dialog" nhưng khác text).
    this.downloadButton = page.locator('[aria-haspopup="dialog"]').filter({ hasText: 'Tải bài' });
    this.previewButton = page.getByRole('button', { name: 'Xem trước' });
    this.saveChangeButton = page.getByRole('button', { name: 'Lưu thay đổi' });

    // ── Cột trái: tìm kiếm & nguồn câu hỏi ───────────────────────────────
    this.searchQuestionInput = page.getByPlaceholder('Tìm ID câu hỏi');
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' });
    this.tabThisCourse = page.getByRole('tab', { name: 'Học liệu này' });
    this.tabMyCourses = page.getByRole('tab', { name: 'Học liệu của tôi' });
    this.tabOlmCourses = page.getByRole('tab', { name: 'Học liệu OLM' });
    this.createQuestionButton = page.getByRole('button', { name: 'Tạo câu hỏi' });
    this.importFileButton = page.getByRole('button', { name: 'Import từ file' });
    // "<count> câu hỏi" — số lượng được JS bơm vào trước chữ "câu hỏi" nên
    // KHÔNG match exact text, chỉ lọc theo class + hasText phần cố định.
    this.questionCountLabel = page.locator('strong.tw-text-content-tertiary').filter({ hasText: 'câu hỏi' });
    this.questionListEmptyState = page.getByText('Chưa có câu hỏi nào.');

    // ── Cột phải: tổng điểm + toolbar soạn thảo + vùng nội dung ─────────
    this.totalScoreBadge = page.getByText(/Tổng toàn bài:/i);
    // Radix Select giả lập bằng button[role="combobox"] — KHÔNG có <select> thật.
    this.scoringMethodSelect = page.locator('button[role="combobox"]');
    this.undoButton = page.getByRole('button', { name: 'Undo' });
    this.redoButton = page.getByRole('button', { name: 'Redo' });
    this.clearFormatButton = page.getByTitle('Xóa định dạng');
    this.exitSelectionButton = page.getByTitle('Thoát vùng chọn');
    this.fullscreenButton = page.getByTitle('Phóng to tối đa');
    this.editHtmlButton = page.getByTitle('Chỉnh sửa mã HTML');
    this.addSectionButton = page.getByTitle('Thêm phần thi');
    this.addNoteButton = page.getByTitle('Thêm chú giải, chú thích (môn hóa)');
    this.removeAllButton = page.getByTitle('Gỡ tất cả');
    this.editorTextbox = page.locator('[data-lexical-editor="true"]').getByRole('textbox');
    this.editorPlaceholder = page.locator('.ContentEditable__placeholder');

    // ── Khối chọn ma trận (ẩn cho tới khi bật tabMatrixQuestions) ───────
    this.createMatrixFromCourseButton = page.getByRole('button', { name: 'Tạo ma trận mới từ khóa học' });
    this.matrixListLink = page.getByRole('link', { name: 'ma trận đã tạo' });
    this.matrixCodeInput = page.getByPlaceholder('Chọn hoặc nhập mã ma trận');
  }

  /**
   * Điều hướng đến trang quản lý học liệu cụ thể (URL đầy đủ, VD
   * "https://debug.olm.vn/chu-de/<slug>-<id>") và đợi khối "Nội dung học
   * liệu" hiển thị. Tự dismissPopups() sau khi vào trang — popup "Xác
   * thực"/"Thay đổi mật khẩu" có thể che nội dung ngay sau navigate, giống
   * quy ước ở BaseHocLieuV2Page.gotoDirectly().
   */
  async goto(url: string) {
    await this.page.goto(url);
    await dismissPopups(this.page);
    await this.contentHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Đợi trang "Quản lý học liệu" sẵn sàng SAU KHI đã ở đúng trang rồi (không
   * điều hướng/goto gì cả) — dùng cho trường hợp vừa được đưa tới đây qua
   * luồng tạo học liệu thật (menu "Tạo mới học liệu" -> modal -> bấm "Tạo"),
   * chứ không phải page.goto() tới 1 URL học liệu có sẵn từ trước.
   */
  async waitForReady() {
    await dismissPopups(this.page);
    await this.contentHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  static async createNewMaterial(
    page: Page,
    type: string,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<QuanLyHocLieuPage> {
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(type);
    // GAME (Game hóa) dùng GameQuestionModal, shape khác hẳn (không có
    // titleInput dạng chung/selectGrade/selectSubject như ExamModal/
    // CreateMaterialModal) — TODO: bổ sung nhánh riêng cho GAME khi có DOM
    // xác nhận cách chọn Khối lớp/Môn học của dropdown Bootstrap tuỳ biến.
    if (!('titleInput' in modal) || !('selectGrade' in modal)) {
      throw new Error(
        `[createNewMaterial] Loại học liệu "${type}" dùng modal chưa được hỗ trợ đầy đủ trong helper này (VD GAME) — cần bổ sung nhánh riêng.`,
      );
    }
    const commonModal = modal as ExamModal;
    await commonModal.titleInput.fill(options.title);
    await commonModal.selectGrade(options.grade);
    await commonModal.selectSubject(options.subject);
    await commonModal.submit();

    const hocLieuPage = new QuanLyHocLieuPage(page);
    await hocLieuPage.waitForReady();
    return hocLieuPage;
  }

  /**
   * Tạo mới 1 học liệu "Đề kiểm tra" (EXAM_MIXTURE_V2) — wrapper mỏng gọi
   * createNewMaterial() để giữ tương thích ngược với các spec file đang dùng
   * tên method này (quan-ly-hoc-lieu.*.spec.ts).
   */
  static async createNewExam(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<QuanLyHocLieuPage> {
    return QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.EXAM_MIXTURE_V2, options);
  }

  /** Chuyển đổi qua tab "Chọn câu hỏi từ học liệu" */
  async selectChooseQuestionsMode() {
    await safeClick(this.page, this.tabChooseQuestions);
  }

  /** Chuyển đổi qua tab "Tạo đề từ ma trận" */
  async selectMatrixMode() {
    await safeClick(this.page, this.tabMatrixQuestions);
  }

  /** Tìm kiếm câu hỏi theo ID trong ngân hàng câu hỏi */
  async searchQuestionById(questionId: string) {
    await safeFill(this.page, this.searchQuestionInput, questionId);
    await safeClick(this.page, this.searchButton);
  }

  /** Click nút "Tạo câu hỏi" mới */
  async clickCreateQuestion() {
    await safeClick(this.page, this.createQuestionButton);
  }

  /** Click nút "Import từ file" */
  async clickImportFile() {
    await safeClick(this.page, this.importFileButton);
  }

  /** Thêm phần thi mới vào đề */
  async clickAddSection() {
    await safeClick(this.page, this.addSectionButton);
  }

  /** Thêm chú giải, chú thích vào đề */
  async clickAddNote() {
    await safeClick(this.page, this.addNoteButton);
  }

  /** Lưu thay đổi học liệu */
  async saveChanges() {
    await safeClick(this.page, this.saveChangeButton);
  }

  /** Nhập nội dung cấu trúc đề thi vào vùng soạn thảo lexical */
  async typeExamContent(text: string) {
    await this.editorTextbox.click();
    await this.editorTextbox.fill(text);
  }

  /** Nhập giá trị "Tuần" hiển thị học liệu */
  async fillWeeks(value: string) {
    await safeFill(this.page, this.weeksInput, value);
  }

  /** Bấm nút "Xuất bản" ở header */
  async publish() {
    await safeClick(this.page, this.publishButton);
  }

  /** Mở dialog "Chia sẻ" */
  async openShareDialog() {
    await safeClick(this.page, this.shareButton);
  }

  /** Mở dialog "Thiết lập nâng cao" */
  async openAdvancedSetting() {
    await safeClick(this.page, this.advancedSettingButton);
  }

  /** Mở menu "Thêm hành động" (nút "...") */
  async openMoreActionsMenu() {
    await safeClick(this.page, this.moreActionsButton);
  }

  /** Đọc text hiện tại của tiêu đề học liệu */
  async getTitleText(): Promise<string> {
    return (await this.titleText.innerText()).trim();
  }

  /** Assert badge Lớp/Môn hiển thị đúng giá trị mong đợi */
  async expectGradeAndSubject(grade: string | RegExp, subject: string | RegExp) {
    await expect(this.gradeBadge).toHaveText(grade);
    await expect(this.subjectBadge).toHaveText(subject);
  }
}