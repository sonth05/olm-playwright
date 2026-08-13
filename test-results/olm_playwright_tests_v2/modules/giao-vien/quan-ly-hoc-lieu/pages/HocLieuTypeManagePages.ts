import { Page, Locator } from '@playwright/test';
import { dismissPopups, safeClick, safeFill } from '../../../../core/shared-pages/dismissPopups';
import { QuanLyHocLieuPage } from './QuanLyHocLieuPage';
import { HOC_LIEU_TYPE } from './Createhoclieumenu';

/**
 * Page Object cho trang "Quản lý học liệu" của 6/13 loại học liệu còn lại
 * (ngoài "Đề kiểm tra" — đã có riêng ở QuanLyHocLieuPage.ts), đối chiếu với
 * DOM thực tế thu thập ngày 2026-08-12 (mỗi loại 1 category test rời:
 * NHCH=3025340708, THEORY=3025341625, VIDEO=3025342414, ESSAY=3025343929,
 * LINK=3025344676, PDF=3025345986).
 *
 * Tách RIÊNG từng class thay vì tái dùng QuanLyHocLieuPage (vốn là DOM
 * riêng của "Đề kiểm tra") vì nội dung trang quản lý khác nhau hoàn toàn
 * theo từng loại — đúng như TODO đã ghi trong QuanLyHocLieuPage.createNewMaterial().
 *
 * Các phần header/hàng liên kết phụ dưới đây CHỈ khai báo locator có thật
 * trong DOM đã xem — KHÔNG suy đoán thêm cho phần chưa xác nhận (VD DOM của
 * NHCH không có hàng liên kết phụ "Danh sách bài làm/Thống kê/..." nên class
 * NhchManagePage không khai báo các locator đó).
 */

// ─────────────────────────────────────────────────────────────────────────
// 1) NHCH — Dạng bài, kĩ năng (type_cate=18)
// ─────────────────────────────────────────────────────────────────────────
export class NhchManagePage {
  readonly page: Page;

  readonly gradeBadge: Locator;
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  readonly materialTypeLabel: Locator;
  readonly creatorName: Locator;

  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;
  readonly publishHintText: Locator;

  /** Switch "Cho phép làm như đề thi" — role switch, mặc định aria-checked=false */
  readonly allowAsExamSwitch: Locator;
  readonly allowAsExamLabel: Locator;
  /** Nút info cạnh switch, tooltip cảnh báo học sinh không thấy câu hỏi khi bật */
  readonly allowAsExamInfoButton: Locator;

  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  readonly contentHeading: Locator;
  readonly downloadButton: Locator;
  readonly previewButton: Locator;
  readonly saveChangeButton: Locator;

  readonly searchQuestionInput: Locator;
  readonly searchButton: Locator;
  readonly tabThisCourse: Locator;
  readonly tabMyCourses: Locator;
  readonly tabOlmCourses: Locator;
  readonly createQuestionButton: Locator;
  readonly importFileButton: Locator;
  readonly questionListEmptyState: Locator;

  /** Khối rỗng bên phải khi CHƯA thêm câu hỏi nào từ kho vào ("empty-insert-question") */
  readonly emptyContentHeading: Locator;
  readonly emptyContentSubtext: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.materialTypeLabel = page.getByText('Dạng bài, kĩ năng (NHCH)', { exact: true });
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');
    this.publishHintText = page.getByText('Xuất bản để có thể bắt đầu giao bài cho học sinh');

    this.allowAsExamSwitch = page.getByRole('switch');
    this.allowAsExamLabel = page.getByText('Cho phép làm như đề thi', { exact: true });
    this.allowAsExamInfoButton = page.getByRole('button', {
      name: 'Học liệu này không cho phép học sinh nhìn thấy câu hỏi. Nếu chọn, chức năng sẽ bị vô hiệu hoá.',
    });

    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    this.contentHeading = page.getByText('Nội dung học liệu', { exact: true });
    this.downloadButton = page.locator('[aria-haspopup="dialog"]').filter({ hasText: 'Tải bài' });
    this.previewButton = page.getByRole('button', { name: 'Xem trước' });
    this.saveChangeButton = page.getByRole('button', { name: 'Lưu thay đổi' });

    this.searchQuestionInput = page.getByPlaceholder('Tìm ID câu hỏi');
    this.searchButton = page.getByRole('button', { name: 'Tìm kiếm' });
    this.tabThisCourse = page.getByRole('tab', { name: 'Học liệu này' });
    this.tabMyCourses = page.getByRole('tab', { name: 'Học liệu của tôi' });
    this.tabOlmCourses = page.getByRole('tab', { name: 'Học liệu OLM' });
    this.createQuestionButton = page.getByRole('button', { name: 'Tạo câu hỏi' });
    this.importFileButton = page.getByRole('button', { name: 'Import từ file' });
    this.questionListEmptyState = page.getByText('Chưa có câu hỏi nào.');

    this.emptyContentHeading = page.getByText('Chưa thêm câu hỏi', { exact: true });
    this.emptyContentSubtext = page.getByText('Tạo/thêm câu hỏi từ kho học liệu bên trái');
  }

  async waitForReady() {
    await dismissPopups(this.page);
    await this.contentHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Bật/tắt switch "Cho phép làm như đề thi" */
  async toggleAllowAsExam() {
    await safeClick(this.page, this.allowAsExamSwitch);
  }

  static async createNew(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<NhchManagePage> {
    await QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.NHCH, options);
    const p = new NhchManagePage(page);
    await p.waitForReady();
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2) THEORY — Lý thuyết tương tác (type_cate=2)
// ─────────────────────────────────────────────────────────────────────────
export class TheoryManagePage {
  readonly page: Page;

  readonly gradeBadge: Locator;
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  readonly materialTypeLabel: Locator;
  readonly creatorName: Locator;

  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;

  // Hàng liên kết phụ — KHÔNG có "Trộn đề" (chỉ Đề kiểm tra mới có)
  readonly submissionListLink: Locator;
  readonly statsLink: Locator;
  readonly advancedSettingButton: Locator;
  readonly copyLinkButton: Locator;
  readonly moreActionsButton: Locator;
  readonly viewContentLink: Locator;

  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  // Chế độ soạn nội dung: Soạn thảo nội dung / Tải lên tệp PDF, Word, PPT
  readonly modeComposeContent: Locator;
  readonly modeUploadFile: Locator;
  readonly downloadButton: Locator;
  readonly previewButton: Locator;
  readonly saveChangeButton: Locator;

  readonly searchQuestionInput: Locator;
  readonly tabThisCourse: Locator;
  readonly tabMyCourses: Locator;
  readonly tabOlmCourses: Locator;
  readonly createQuestionButton: Locator;
  readonly importFileButton: Locator;

  // Editor song ngữ bên phải
  readonly layoutToggleTab: Locator;
  readonly layoutToggle2Ben: Locator;
  readonly paneTabOriginal: Locator;
  readonly paneTabBilingual: Locator;
  readonly editorTextbox: Locator;
  readonly editorPlaceholder: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.materialTypeLabel = page.getByText('Lý thuyết', { exact: true });
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');

    this.submissionListLink = page.getByRole('link', { name: 'Danh sách bài làm' });
    this.statsLink = page.getByRole('link', { name: 'Thống kê' });
    this.advancedSettingButton = page.getByRole('button', { name: 'Thiết lập nâng cao' });
    this.copyLinkButton = page.getByRole('button', { name: 'Sao chép link học liệu' });
    this.moreActionsButton = page.getByRole('button', { name: 'Thêm hành động' });
    this.viewContentLink = page.getByRole('link', { name: 'Xem nội dung' });

    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    this.modeComposeContent = page.getByRole('radio', { name: 'Soạn thảo nội dung' });
    this.modeUploadFile = page.getByRole('radio', { name: 'Tải lên tệp PDF, Word, PPT' });
    this.downloadButton = page.locator('[aria-haspopup="dialog"]').filter({ hasText: 'Tải bài' });
    this.previewButton = page.getByRole('button', { name: 'Xem trước' });
    this.saveChangeButton = page.getByRole('button', { name: 'Lưu thay đổi' });

    this.searchQuestionInput = page.getByPlaceholder('Tìm ID câu hỏi');
    this.tabThisCourse = page.getByRole('tab', { name: 'Học liệu này' });
    this.tabMyCourses = page.getByRole('tab', { name: 'Học liệu của tôi' });
    this.tabOlmCourses = page.getByRole('tab', { name: 'Học liệu OLM' });
    this.createQuestionButton = page.getByRole('button', { name: 'Tạo câu hỏi' });
    this.importFileButton = page.getByRole('button', { name: 'Import từ file' });

    this.layoutToggleTab = page.getByTitle('Chế độ tab');
    this.layoutToggle2Ben = page.getByTitle('Xếp 2 bên');
    this.paneTabOriginal = page.getByRole('tab', { name: 'Bản gốc' });
    this.paneTabBilingual = page.getByRole('tab', { name: 'Song ngữ' });
    this.editorTextbox = page.locator('.theory-editor [data-lexical-editor="true"]').getByRole('textbox');
    this.editorPlaceholder = page.locator('.theory-editor .ContentEditable__placeholder');
  }

  async waitForReady() {
    await dismissPopups(this.page);
    await this.editorTextbox.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Nhập nội dung bài giảng lý thuyết (bản gốc) */
  async typeTheoryContent(text: string) {
    await this.editorTextbox.click();
    await this.editorTextbox.fill(text);
  }

  /** Chuyển sang tab "Song ngữ" */
  async switchToBilingualPane() {
    await safeClick(this.page, this.paneTabBilingual);
  }

  static async createNew(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<TheoryManagePage> {
    await QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.THEORY, options);
    const p = new TheoryManagePage(page);
    await p.waitForReady();
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 3) VIDEO — Video Youtube có điểm dừng (type_cate=5)
// ─────────────────────────────────────────────────────────────────────────
export class VideoManagePage {
  readonly page: Page;

  readonly gradeBadge: Locator;
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  readonly materialTypeLabel: Locator;
  readonly creatorName: Locator;

  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;

  readonly submissionListLink: Locator;
  readonly statsLink: Locator;
  readonly advancedSettingButton: Locator;
  readonly copyLinkButton: Locator;
  readonly moreActionsButton: Locator;
  readonly viewContentLink: Locator;

  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  readonly createVideoHeading: Locator;
  readonly guideLink: Locator;
  /** Nút "Lưu thay đổi" ở đầu khối tạo video — vô hiệu hoá tới khi có video */
  readonly saveChangeButton: Locator;

  readonly youtubeUrlInput: Locator;
  readonly videoRequiredBadge: Locator;
  readonly videoFileInput: Locator;
  readonly chooseVideoFileButton: Locator;

  readonly tabAttachedLecture: Locator;
  readonly tabSummary: Locator;
  readonly tabAutoTranscript: Locator;
  readonly attachmentUploadLabel: Locator;
  readonly chooseAttachmentFileButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.materialTypeLabel = page.getByText('Video', { exact: true });
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');

    this.submissionListLink = page.getByRole('link', { name: 'Danh sách bài làm' });
    this.statsLink = page.getByRole('link', { name: 'Thống kê' });
    this.advancedSettingButton = page.getByRole('button', { name: 'Thiết lập nâng cao' });
    this.copyLinkButton = page.getByRole('button', { name: 'Sao chép link học liệu' });
    this.moreActionsButton = page.getByRole('button', { name: 'Thêm hành động' });
    this.viewContentLink = page.getByRole('link', { name: 'Xem nội dung' });

    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    this.createVideoHeading = page.getByText('Tạo học liệu video', { exact: true });
    this.guideLink = page.getByRole('link', { name: 'Hướng dẫn' });
    this.saveChangeButton = page.getByRole('button', { name: 'Lưu thay đổi' });

    this.youtubeUrlInput = page.locator('input[name="youtube_url"]');
    this.videoRequiredBadge = page.getByText('BẮT BUỘC', { exact: true });
    this.videoFileInput = page.locator('input[type="file"][accept*="video"]');
    // "Chọn tệp" xuất hiện 2 lần (video bắt buộc + tài liệu đính kèm) — nút
    // đầu tiên gắn với khối "Tải lên video bài giảng".
    this.chooseVideoFileButton = page.getByRole('button', { name: 'Chọn tệp' }).first();

    this.tabAttachedLecture = page.getByRole('tab', { name: 'Bài giảng đính kèm' });
    this.tabSummary = page.getByRole('tab', { name: 'Tóm tắt bài giảng' });
    this.tabAutoTranscript = page.getByRole('tab', { name: 'Tạo transcript (Tự động)' });
    this.attachmentUploadLabel = page.getByText('Tải lên file tài liệu đính kèm (nếu có)');
    this.chooseAttachmentFileButton = page.getByRole('button', { name: 'Chọn tệp' }).last();
  }

  async waitForReady() {
    await dismissPopups(this.page);
    await this.createVideoHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Dán liên kết Youtube và bấm Enter */
  async fillYoutubeUrl(url: string) {
    await safeFill(this.page, this.youtubeUrlInput, url);
    await this.youtubeUrlInput.press('Enter');
  }

  static async createNew(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<VideoManagePage> {
    await QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.VIDEO, options);
    const p = new VideoManagePage(page);
    await p.waitForReady();
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 4) ESSAY — Đề thi tự luận (type_cate=6)
// ─────────────────────────────────────────────────────────────────────────
export class EssayManagePage {
  readonly page: Page;

  readonly gradeBadge: Locator;
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  readonly materialTypeLabel: Locator;
  readonly creatorName: Locator;

  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;

  readonly submissionListLink: Locator;
  readonly statsLink: Locator;
  readonly advancedSettingButton: Locator;
  readonly moreActionsButton: Locator;
  readonly viewContentLink: Locator;

  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  /** Tab "Đề bài" / "Đáp án/Hướng dẫn giải" — segment control ở đầu khối nội dung */
  readonly tabQuestion: Locator;
  readonly tabAnswer: Locator;
  readonly saveChangeButtonHeader: Locator;

  readonly modeComposeContent: Locator;
  readonly modeUploadFile: Locator;
  readonly downloadButton: Locator;
  readonly previewButton: Locator;
  readonly saveChangeButtonMode: Locator;

  /** Vùng soạn "Đề bài" — hiển thị mặc định */
  readonly questionEditorTextbox: Locator;
  /** Vùng soạn "Đáp án/Hướng dẫn giải" — ẩn (`display:none`) tới khi chọn tabAnswer */
  readonly answerEditorTextbox: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.materialTypeLabel = page.getByText('Đề thi tự luận', { exact: true });
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');

    this.submissionListLink = page.getByRole('link', { name: 'Danh sách bài làm' });
    this.statsLink = page.getByRole('link', { name: 'Thống kê' });
    this.advancedSettingButton = page.getByRole('button', { name: 'Thiết lập nâng cao' });
    this.moreActionsButton = page.getByRole('button', { name: 'Thêm hành động' });
    this.viewContentLink = page.getByRole('link', { name: 'Xem nội dung' });

    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    this.tabQuestion = page.getByRole('tab', { name: 'Đề bài' });
    this.tabAnswer = page.getByRole('tab', { name: 'Đáp án/Hướng dẫn giải' });
    this.saveChangeButtonHeader = page.getByRole('button', { name: 'Lưu thay đổi' }).first();

    this.modeComposeContent = page.getByRole('radio', { name: 'Soạn thảo nội dung' });
    this.modeUploadFile = page.getByRole('radio', { name: 'Tải lên tệp PDF, Word, PPT' });
    this.downloadButton = page.locator('[aria-haspopup="dialog"]').filter({ hasText: 'Tải bài' });
    this.previewButton = page.getByRole('button', { name: 'Xem trước' });
    this.saveChangeButtonMode = page.getByRole('button', { name: 'Lưu thay đổi' }).last();

    this.questionEditorTextbox = page.locator('#elmEditorEssay [data-lexical-editor="true"]').getByRole('textbox');
    this.answerEditorTextbox = page.locator('#elmEditorAns [data-lexical-editor="true"]').getByRole('textbox');
  }

  async waitForReady() {
    await dismissPopups(this.page);
    await this.questionEditorTextbox.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Nhập nội dung đề bài (tab "Đề bài", mặc định hiển thị) */
  async typeQuestionContent(text: string) {
    await this.questionEditorTextbox.click();
    await this.questionEditorTextbox.fill(text);
  }

  /** Chuyển sang tab "Đáp án/Hướng dẫn giải" rồi nhập nội dung */
  async typeAnswerContent(text: string) {
    await safeClick(this.page, this.tabAnswer);
    await this.answerEditorTextbox.click();
    await this.answerEditorTextbox.fill(text);
  }

  static async createNew(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<EssayManagePage> {
    await QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.ESSAY, options);
    const p = new EssayManagePage(page);
    await p.waitForReady();
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 5) LINK — Liên kết (type_cate=9)
// ─────────────────────────────────────────────────────────────────────────
export class LinkManagePage {
  readonly page: Page;

  readonly gradeBadge: Locator;
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  /** Loại học liệu chưa được xác định (badge text thay đổi theo breakpoint) */
  readonly undefinedTypeLabel: Locator;
  readonly creatorName: Locator;

  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;

  readonly submissionListLink: Locator;
  readonly statsLink: Locator;
  readonly advancedSettingButton: Locator;
  readonly copyLinkButton: Locator;
  readonly moreActionsButton: Locator;
  readonly viewContentLink: Locator;

  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  readonly contentHeading: Locator;
  /** Nút "Lưu thay đổi" — class `submit-cate`, disabled tới khi nhập URL */
  readonly saveChangeButton: Locator;
  readonly infoAlertText: Locator;
  readonly urlInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.undefinedTypeLabel = page.getByText('Chưa xác định loại học liệu');
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');

    this.submissionListLink = page.getByRole('link', { name: 'Danh sách bài làm' });
    this.statsLink = page.getByRole('link', { name: 'Thống kê' });
    this.advancedSettingButton = page.getByRole('button', { name: 'Thiết lập nâng cao' });
    this.copyLinkButton = page.getByRole('button', { name: 'Sao chép link học liệu' });
    this.moreActionsButton = page.getByRole('button', { name: 'Thêm hành động' });
    this.viewContentLink = page.getByRole('link', { name: 'Xem nội dung' });

    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    this.contentHeading = page.getByText('Đường dẫn liên kết', { exact: true });
    this.saveChangeButton = page.locator('button.submit-cate');
    this.infoAlertText = page.getByText(
      'Chức năng dành cho thầy cô muốn tạo nội dung là liên kết từ trang web khác OLM. Thầy cô vui lòng nhập liên kết vào ô bên dưới rồi lưu lại.',
    );
    this.urlInput = page.getByPlaceholder('Nhập đường dẫn liên kết');
  }

  async waitForReady() {
    await dismissPopups(this.page);
    await this.contentHeading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Nhập đường dẫn liên kết — nút "Lưu thay đổi" chỉ bật sau khi có giá trị hợp lệ */
  async fillUrl(url: string) {
    await safeFill(this.page, this.urlInput, url);
  }

  static async createNew(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<LinkManagePage> {
    await QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.LINK, options);
    const p = new LinkManagePage(page);
    await p.waitForReady();
    return p;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 6) PDF — Đề thi trắc nghiệm từ file PDF hoặc Word (type_cate=10)
// ─────────────────────────────────────────────────────────────────────────
export class PdfManagePage {
  readonly page: Page;

  readonly gradeBadge: Locator;
  readonly subjectBadge: Locator;
  readonly titleText: Locator;
  readonly editTitleButton: Locator;
  readonly statusBadge: Locator;
  readonly materialTypeLabel: Locator;
  readonly creatorName: Locator;

  readonly seoButton: Locator;
  readonly shareButton: Locator;
  readonly publishButton: Locator;

  readonly submissionListLink: Locator;
  readonly statsLink: Locator;
  readonly advancedSettingButton: Locator;
  readonly moreActionsButton: Locator;
  readonly viewContentLink: Locator;

  readonly weeksInput: Locator;
  readonly kctButton: Locator;
  readonly contentRulesButton: Locator;

  readonly tabQuestion: Locator;
  readonly tabAnswer: Locator;
  readonly saveChangeButton: Locator;

  readonly dropzoneHeading: Locator;
  readonly dropzoneFormatHint: Locator;
  readonly dropzoneSizeHint: Locator;
  /** 2 vùng upload cùng cấu trúc: "Đề bài" (hiện) và "Đáp án" (`tw-hidden` mặc định) */
  readonly chooseFileFromDeviceButton: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gradeBadge = page.locator('.tw-bg-accent-light').nth(0);
    this.subjectBadge = page.locator('.tw-bg-accent-light').nth(1);
    this.titleText = page.locator('span.tw-min-w-0.tw-max-w-full.tw-break-words').first();
    this.editTitleButton = page.locator('span[aria-label="Chỉnh sửa học liệu"]');
    this.statusBadge = page.locator('[data-slot="badge"]').first();
    this.materialTypeLabel = page.getByText('Đề thi PDF', { exact: true });
    this.creatorName = page
      .locator('div:has(> img[src*="/avatars/"])')
      .locator('xpath=following-sibling::div[1]');

    this.seoButton = page.locator('button[data-seo="modal-seo"]');
    this.shareButton = page.getByRole('button', { name: 'Chia sẻ' });
    this.publishButton = page.locator('#publish');

    this.submissionListLink = page.getByRole('link', { name: 'Danh sách bài làm' });
    this.statsLink = page.getByRole('link', { name: 'Thống kê' });
    this.advancedSettingButton = page.getByRole('button', { name: 'Thiết lập nâng cao' });
    this.moreActionsButton = page.getByRole('button', { name: 'Thêm hành động' });
    this.viewContentLink = page.getByRole('link', { name: 'Xem nội dung' });

    this.weeksInput = page.getByPlaceholder('Nhập các tuần');
    this.kctButton = page.getByRole('button', { name: 'KCT' });
    this.contentRulesButton = page.getByRole('button', { name: 'Quy tắc viết nội dung' });

    // "Đề bài"/"Đáp án/Hướng dẫn giải" ở đây là <button> thường (không có
    // role="tab"), phân biệt tab đang chọn qua class `tw-text-accent-default`
    // — không dùng getByRole('tab') như ở EssayManagePage.
    this.tabQuestion = page.getByRole('button', { name: 'Đề bài', exact: true });
    this.tabAnswer = page.getByRole('button', { name: 'Đáp án/Hướng dẫn giải' });
    this.saveChangeButton = page.locator('button.submit-cate');

    this.dropzoneHeading = page.getByText('Kéo thả tài liệu vào đây', { exact: true });
    this.dropzoneFormatHint = page.getByText('Hỗ trợ định dạng PDF, DOCX.');
    this.dropzoneSizeHint = page.getByText('Dung lượng tối đa 100MB');
    this.chooseFileFromDeviceButton = page.getByRole('button', { name: 'Chọn tệp từ máy' }).first();
    this.fileInput = page.locator('input[type="file"][accept*=".pdf"]').first();
  }

  async waitForReady() {
    await dismissPopups(this.page);
    await this.dropzoneHeading.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Chuyển sang tab "Đáp án/Hướng dẫn giải" */
  async switchToAnswerTab() {
    await safeClick(this.page, this.tabAnswer);
  }

  static async createNew(
    page: Page,
    options: { title: string; grade: string | RegExp; subject: string | RegExp },
  ): Promise<PdfManagePage> {
    await QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.PDF, options);
    const p = new PdfManagePage(page);
    await p.waitForReady();
    return p;
  }
}