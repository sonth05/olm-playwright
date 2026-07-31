import { Page, Locator, expect } from '@playwright/test';
import { BaseHocLieuV2Page } from './Basehoclieuv2page';
import { QuestionSourceSidebar } from './Questionsourcesidebar';
import { FileUploadPanel } from './Fileuploadpanel';

/* ------------------------------------------------------------------ */
/* 8.2 Video                                                           */
/* ------------------------------------------------------------------ */
export class VideoPage extends BaseHocLieuV2Page {
  readonly youtubeUrlInput: Locator;
  readonly videoPlayer: Locator;
  readonly btnAddStopPoint: Locator; // Thêm điểm dừng
  readonly btnStopPointList: Locator; // DS điểm dừng
  readonly stopPointDrawer: Locator;
  readonly stopPointItems: Locator;
  readonly btnDeleteAllStopPoints: Locator;
  readonly uploadVideoInput: Locator;
  readonly btnCancelUpload: Locator;
  readonly btnRetryUpload: Locator;
  readonly tabAttachment: Locator; // Bài giảng đính kèm
  readonly tabSummary: Locator; // Tóm tắt bài giảng
  readonly tabTranscript: Locator; // Tạo transcript (Tự động)
  readonly transcriptToggle: Locator;
  readonly transcriptEditor: Locator;
  readonly attachment: FileUploadPanel;

  constructor(page: Page) {
    super(page);
    this.youtubeUrlInput = page.getByPlaceholder(/liên kết Youtube|đường dẫn Youtube/i);
    this.videoPlayer = page.locator('[data-testid="video-player"]'); // TODO
    this.btnAddStopPoint = page.getByRole('button', { name: /Thêm điểm dừng/i });
    this.btnStopPointList = page.getByRole('button', { name: /DS điểm dừng/i });
    this.stopPointDrawer = page.locator('[data-testid="stop-point-drawer"]'); // TODO
    this.stopPointItems = page.locator('[data-testid="stop-point-item"]'); // TODO
    this.btnDeleteAllStopPoints = page.getByRole('button', { name: /Xóa tất cả điểm dừng/i });
    this.uploadVideoInput = page.locator('[data-testid="upload-video-panel"] input[type="file"]'); // TODO
    this.btnCancelUpload = page.getByRole('button', { name: /Hu[ỷỉ] tải lên/i });
    this.btnRetryUpload = page.getByRole('button', { name: /Thử lại/i });
    this.tabAttachment = page.getByRole('tab', { name: /Bài giảng đính kèm/i });
    this.tabSummary = page.getByRole('tab', { name: /Tóm tắt bài giảng/i });
    this.tabTranscript = page.getByRole('tab', { name: /Transcript/i });
    this.transcriptToggle = page.locator('[data-testid="transcript-toggle"]'); // TODO
    this.transcriptEditor = page.locator('[data-testid="transcript-editor"]'); // TODO
    this.attachment = new FileUploadPanel(page, page.locator('[data-testid="attachment-panel"]'));
  }

  /** TC-VID-01 / TC-VID-02 */
  async setYoutubeLink(url: string) {
    await this.youtubeUrlInput.fill(url);
    await this.page.keyboard.press('Enter');
  }

  async expectVideoPlayable() {
    await expect(this.videoPlayer).toBeVisible({ timeout: 15_000 });
  }

  /** TC-VID-03 */
  async addStopPointAtCurrentTime() {
    await this.btnAddStopPoint.click();
  }

  /** TC-VID-04 */
  async openStopPointList() {
    await this.btnStopPointList.click();
  }

  stopPointItemAt(index: number): Locator {
    return this.stopPointItems.nth(index);
  }

  /** TC-VID-05 */
  async editStopPointTime(index: number, newTime: string) {
    await this.stopPointItemAt(index).click();
    await this.stopPointDrawer.getByLabel(/Thời gian/i).fill(newTime);
    await this.stopPointDrawer.getByRole('button', { name: /Lưu/i }).click();
  }

  /** TC-VID-06 */
  async deleteStopPoint(index: number) {
    await this.stopPointItemAt(index).getByRole('button', { name: /Xóa/i }).click();
    await this.page.getByRole('button', { name: /Xác nhận/i }).click();
  }

  /** TC-VID-07 */
  async deleteAllStopPoints() {
    await this.btnDeleteAllStopPoints.click();
    await this.page.getByRole('button', { name: /Xác nhận/i }).click();
  }

  /** TC-VID-08 */
  async attachQuestionToStopPoint(index: number, sidebar: QuestionSourceSidebar, questionIndex = 0) {
    await this.stopPointItemAt(index).click();
    await sidebar.addQuestion(questionIndex);
  }

  /** TC-VID-09 */
  async uploadLectureVideo(filePath: string) {
    await this.uploadVideoInput.setInputFiles(filePath);
  }

  /** TC-VID-10 */
  async cancelUpload() {
    await this.btnCancelUpload.click();
  }

  /** TC-VID-11 */
  async retryUpload() {
    await this.btnRetryUpload.click();
  }

  /** TC-VID-13 */
  async writeSummary(text: string) {
    await this.tabSummary.click();
    await this.page.locator('[data-testid="summary-editor"]').fill(text); // TODO
  }

  /** TC-VID-14 */
  async openAutoTranscriptTab() {
    await this.tabTranscript.click();
  }

  /** TC-VID-15 */
  async toggleTranscriptVisibility() {
    await this.transcriptToggle.click();
  }

  /** TC-VID-16 */
  async editTranscript(text: string) {
    await this.transcriptEditor.fill(text);
  }
}

/* ------------------------------------------------------------------ */
/* 8.3 Essay (Tự luận)                                                  */
/* ------------------------------------------------------------------ */
export class EssayPage extends BaseHocLieuV2Page {
  readonly tabQuestion: Locator; // Đề bài
  readonly tabAnswer: Locator; // Đáp án/Hướng dẫn giải
  readonly confirmSaveDialog: Locator;
  readonly questionEditor: Locator;
  readonly answerEditor: Locator;
  readonly questionUpload: FileUploadPanel;
  readonly answerUpload: FileUploadPanel;

  constructor(page: Page) {
    super(page);
    this.tabQuestion = page.getByRole('tab', { name: /^Đề bài$/i });
    this.tabAnswer = page.getByRole('tab', { name: /Đáp án|Hướng dẫn giải/i });
    this.confirmSaveDialog = page.getByRole('dialog').filter({ hasText: /lưu/i });
    this.questionEditor = page.locator('[data-testid="essay-question-editor"]'); // TODO
    this.answerEditor = page.locator('[data-testid="essay-answer-editor"]'); // TODO
    this.questionUpload = new FileUploadPanel(page, page.locator('[data-testid="essay-question-upload"]'));
    this.answerUpload = new FileUploadPanel(page, page.locator('[data-testid="essay-answer-upload"]'));
  }

  /** TC-ESS-01 */
  async openQuestionTab() {
    await this.tabQuestion.click();
  }

  async openAnswerTab() {
    await this.tabAnswer.click();
  }

  /** TC-ESS-02 */
  async expectSaveConfirmOnTabSwitch() {
    await expect(this.confirmSaveDialog).toBeVisible();
  }

  /** TC-ESS-03 */
  async typeQuestion(text: string) {
    await this.questionEditor.click();
    await this.page.keyboard.type(text);
  }

  /** TC-ESS-04 */
  async typeAnswer(text: string) {
    await this.answerEditor.click();
    await this.page.keyboard.type(text);
  }
}

/* ------------------------------------------------------------------ */
/* 8.4 PDF                                                              */
/* ------------------------------------------------------------------ */
export class PdfPage extends BaseHocLieuV2Page {
  readonly tabQuestion: Locator;
  readonly tabAnswer: Locator;
  readonly answerProcessingPanel: Locator; // khu vực xử lý đáp án cạnh phải
  readonly blockedSaveMessage: Locator;
  readonly questionUpload: FileUploadPanel;
  readonly answerUpload: FileUploadPanel;

  constructor(page: Page) {
    super(page);
    this.tabQuestion = page.getByRole('tab', { name: /^Đề bài$/i });
    this.tabAnswer = page.getByRole('tab', { name: /Đáp án|Hướng dẫn giải/i });
    this.answerProcessingPanel = page.locator('[data-testid="pdf-answer-processing-panel"]'); // TODO
    this.blockedSaveMessage = page.getByText(/vui lòng tải (tệp )?đề bài|yêu cầu tệp đề bài/i);
    this.questionUpload = new FileUploadPanel(page, page.locator('[data-testid="pdf-question-upload"]'));
    this.answerUpload = new FileUploadPanel(page, page.locator('[data-testid="pdf-answer-upload"]'));
  }

  async openQuestionTab() {
    await this.tabQuestion.click();
  }

  async openAnswerTab() {
    await this.tabAnswer.click();
  }

  /** TC-PDF-03 */
  async expectAnswerProcessingPanelVisible() {
    await expect(this.answerProcessingPanel).toBeVisible();
  }

  /** TC-PDF-06 */
  async expectSaveBlockedWithoutQuestionFile() {
    await this.btnSave.click();
    await expect(this.blockedSaveMessage).toBeVisible();
  }
}

/* ------------------------------------------------------------------ */
/* 8.5 Link (Liên kết)                                                  */
/* ------------------------------------------------------------------ */
export class LinkPage extends BaseHocLieuV2Page {
  readonly urlInput: Locator;
  readonly invalidUrlMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.urlInput = page.getByPlaceholder(/nhập (đường dẫn|liên kết)/i);
    this.invalidUrlMessage = page.getByText(/liên kết không hợp lệ|url không hợp lệ|sai định dạng/i);
  }

  /** TC-LINK-01 / TC-LINK-02 */
  async fillUrl(url: string) {
    await this.urlInput.fill(url);
  }

  async expectInvalidUrlMessage() {
    await expect(this.invalidUrlMessage).toBeVisible();
  }

  /** TC-LINK-03 */
  async expectSaveDisabled() {
    await expect(this.btnSave).toBeDisabled();
  }
}

/* ------------------------------------------------------------------ */
/* 8.6 Document (Tài liệu)                                              */
/* ------------------------------------------------------------------ */
export class DocumentPage extends BaseHocLieuV2Page {
  readonly upload: FileUploadPanel;

  constructor(page: Page) {
    super(page);
    this.upload = new FileUploadPanel(page);
  }
}

/* ------------------------------------------------------------------ */
/* 8.7 Exam Standard (Đề chuẩn / NHCH)                                  */
/* ------------------------------------------------------------------ */
export class ExamStandardPage extends BaseHocLieuV2Page {
  readonly modeSwitchGroup: Locator; // nhóm nút chuyển "Chọn câu hỏi từ học liệu" / "Tạo đề từ ma trận"
  readonly sidebar: QuestionSourceSidebar;

  constructor(page: Page) {
    super(page);
    this.modeSwitchGroup = page.locator('[data-testid="exam-mode-switch"]'); // TODO
    this.sidebar = new QuestionSourceSidebar(page);
  }

  /** TC-STD-01: Đề chuẩn KHÔNG được hiện lựa chọn đổi chế độ (khác Exam Mixture V2) */
  async expectModeSwitchNotVisible() {
    await expect(this.modeSwitchGroup).toHaveCount(0);
  }

  /** TC-STD-02: mặc định vào thẳng luồng chọn câu hỏi */
  async expectDefaultToQuestionSelectionFlow() {
    await expect(this.sidebar.root).toBeVisible();
  }
}

/* ------------------------------------------------------------------ */
/* 8.8 Exam Mixture V2 (Đề kiểm tra)                                    */
/* ------------------------------------------------------------------ */
export class ExamMixtureV2Page extends BaseHocLieuV2Page {
  readonly modeQuestionSelection: Locator; // Chọn câu hỏi từ học liệu
  readonly modeMatrix: Locator; // Tạo đề từ ma trận
  readonly sidebar: QuestionSourceSidebar;
  readonly matrixForm: Locator;
  readonly btnSaveMatrix: Locator;

  constructor(page: Page) {
    super(page);
    this.modeQuestionSelection = page.getByRole('tab', { name: /Chọn câu hỏi từ học liệu/i });
    this.modeMatrix = page.getByRole('tab', { name: /Tạo đề từ ma trận/i });
    this.sidebar = new QuestionSourceSidebar(page);
    this.matrixForm = page.locator('[data-testid="matrix-form"]'); // TODO
    this.btnSaveMatrix = page.getByRole('button', { name: /Lưu ma trận/i });
  }

  /** TC-HIER-01 */
  async switchToQuestionSelectionMode() {
    await this.modeQuestionSelection.click();
  }

  async switchToMatrixMode() {
    await this.modeMatrix.click();
  }

  /** TC-HIER-09 */
  async fillAndSaveMatrix(fillForm: () => Promise<void>) {
    await this.switchToMatrixMode();
    await fillForm();
    await this.btnSaveMatrix.click();
  }
}

/* ------------------------------------------------------------------ */
/* 8.9 Exam Mix (Đề offline)                                            */
/* ------------------------------------------------------------------ */
export class ExamMixPage extends BaseHocLieuV2Page {
  readonly questionList: Locator;
  readonly schoolNameText: Locator;
  readonly subjectNameText: Locator;
  readonly btnShuffle: Locator;
  readonly btnImportWord: Locator;

  constructor(page: Page) {
    super(page);
    this.questionList = page.locator('[data-testid="exam-mix-question-list"]'); // TODO
    this.schoolNameText = page.locator('[data-testid="exam-mix-school-name"]'); // TODO
    this.subjectNameText = page.locator('[data-testid="exam-mix-subject-name"]'); // TODO
    this.btnShuffle = page.getByRole('button', { name: /Trộn đề|Shuffle/i });
    this.btnImportWord = page.getByRole('button', { name: /Import Word/i });
  }

  questionItemCount(): Promise<number> {
    return this.questionList.locator('[data-testid="question-item"]').count(); // TODO
  }

  /** TC-MIX-04 */
  async importWord(filePath: string) {
    await this.btnImportWord.click();
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: /Xác nhận/i }).click();
  }

  /** TC-MIX-05 */
  async shuffle() {
    await this.btnShuffle.click();
  }
}