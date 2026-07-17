import { Page, Locator } from '@playwright/test';
import { BaseHocLieuV2Page } from './Basehoclieuv2page';
import { QuestionSourceSidebar } from './Questionsourcesidebar';
import { FileUploadPanel } from './Fileuploadpanel';

/**
 * Học liệu Lý thuyết (Theory) - mục 8.1.
 * Quy tắc quan trọng cần test: với luồng editor, phải bấm "Chèn câu hỏi" trên toolbar
 * để đặt editor vào đúng ngữ cảnh TRƯỚC KHI thêm câu hỏi từ sidebar (TC-THE-04, TC-THE-07).
 */
export class TheoryPage extends BaseHocLieuV2Page {
  readonly tabEditorMode: Locator; // Soạn thảo nội dung
  readonly tabFileMode: Locator; // Tải lên tệp PDF, Word, PPT
  readonly editor: Locator;
  readonly insertQuestionToolbarBtn: Locator; // "Chèn câu hỏi" trên toolbar
  readonly sidebar: QuestionSourceSidebar;
  readonly upload: FileUploadPanel;

  constructor(page: Page) {
    super(page);
    this.tabEditorMode = page.getByRole('tab', { name: /Soạn thảo nội dung/i });
    this.tabFileMode = page.getByRole('tab', { name: /Tải (lên )?tệp/i });
    this.editor = page.locator('[data-testid="theory-editor"]'); // TODO
    this.insertQuestionToolbarBtn = page.getByRole('button', { name: /Chèn câu hỏi/i });
    this.sidebar = new QuestionSourceSidebar(page);
    this.upload = new FileUploadPanel(page);
  }

  /** TC-THE-01 */
  async switchToEditorMode() {
    await this.tabEditorMode.click();
  }

  async switchToFileMode() {
    await this.tabFileMode.click();
  }

  /** TC-THE-02 */
  async typeContentAtCursor(text: string) {
    await this.editor.click();
    await this.page.keyboard.type(text);
  }

  /** TC-THE-04, TC-THE-05, TC-THE-06: bước bắt buộc trước khi chèn câu hỏi từ sidebar */
  async activateInsertQuestionContext() {
    await this.insertQuestionToolbarBtn.click();
  }

  countInsertedQuestions(): Promise<number> {
    return this.editor.locator('[data-testid="question-block"]').count(); // TODO
  }

  countInsertedQuestionByLabel(label: string): Promise<number> {
    return this.editor.getByText(label).count();
  }
}