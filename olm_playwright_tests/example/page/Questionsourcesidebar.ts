import { Page, Locator, expect } from '@playwright/test';

/**
 * Component dùng chung cho Sidebar nguồn câu hỏi - mục 6.4 đặc tả.
 * Áp dụng cho: Theory, Exam Standard, Exam Mixture V2 (và các loại khác nếu UI có sidebar).
 * Quy tắc nghiệp vụ quan trọng cần test (TC-QS-06, TC-QS-07):
 *  - câu tĩnh chỉ được chèn 1 lần / editor
 *  - câu động được chèn nhiều lần / editor
 */
export class QuestionSourceSidebar {
  readonly page: Page;
  readonly root: Locator;

  readonly tabThisMaterial: Locator; // Học liệu này
  readonly tabMyMaterials: Locator; // Học liệu của tôi
  readonly tabOlmMaterials: Locator; // Học liệu OLM

  readonly olmPermissionNotice: Locator; // Trạng thái nâng quyền/gói dịch vụ khi không có quyền OLM
  readonly btnAddAll: Locator;
  readonly btnCreateQuestion: Locator;
  readonly btnImportWord: Locator;
  readonly searchByIdInput: Locator; // Chỉ dành cho nhân sự OLM - TC-QS-12

  constructor(page: Page, scope?: Locator) {
    this.page = page;
    // TODO: thay data-testid theo DOM thật của sidebar khi có
    this.root = scope ?? page.locator('[data-testid="question-source-sidebar"]');

    this.tabThisMaterial = this.root.getByRole('tab', { name: 'Học liệu này' });
    this.tabMyMaterials = this.root.getByRole('tab', { name: 'Học liệu của tôi' });
    this.tabOlmMaterials = this.root.getByRole('tab', { name: 'Học liệu OLM' });

    this.olmPermissionNotice = this.root.getByText(/nâng cấp|nâng quyền|gói dịch vụ|hết hạn quyền/i);
    this.btnAddAll = this.root.getByRole('button', { name: /Thêm tất cả/i });
    this.btnCreateQuestion = this.root.getByRole('button', { name: /Tạo câu hỏi/i });
    this.btnImportWord = this.root.getByRole('button', { name: /Import Word/i });
    this.searchByIdInput = this.root.getByPlaceholder(/ID câu hỏi/i);
  }

  questionItem(index: number): Locator {
    return this.root.locator('[data-testid="question-item"]').nth(index); // TODO
  }

  questionItems(): Locator {
    return this.root.locator('[data-testid="question-item"]'); // TODO
  }

  async openThisMaterialTab() {
    await this.tabThisMaterial.click();
  }

  async openMyMaterialsTab() {
    await this.tabMyMaterials.click();
  }

  async openOlmTab() {
    await this.tabOlmMaterials.click();
  }

  /** TC-QS-02 / TC-HIER-03 / TC-STD-04: duyệt cây Khóa học > Chương > Bài > Học liệu */
  async pickFromMyMaterialsTree(courseName: string, chapterName: string, lessonName: string, materialName: string) {
    await this.openMyMaterialsTab();
    await this.root.getByText(courseName, { exact: true }).click();
    await this.root.getByText(chapterName, { exact: true }).click();
    await this.root.getByText(lessonName, { exact: true }).click();
    await this.root.getByText(materialName, { exact: true }).click();
  }

  /** TC-QS-03 / TC-HIER-04 / TC-STD-05: duyệt cây Khối > Môn > Khóa học > Học liệu OLM */
  async pickFromOlmTree(grade: string, subject: string, courseName: string, materialName: string) {
    await this.openOlmTab();
    await this.root.getByText(grade, { exact: true }).click();
    await this.root.getByText(subject, { exact: true }).click();
    await this.root.getByText(courseName, { exact: true }).click();
    await this.root.getByText(materialName, { exact: true }).click();
  }

  /** TC-QS-04 / TC-HIER-05 / TC-STD-06: không có quyền OLM -> không thấy danh sách, thấy thông báo nâng quyền */
  async expectOlmSourceBlocked() {
    await this.openOlmTab();
    await expect(this.olmPermissionNotice).toBeVisible();
    await expect(this.questionItems()).toHaveCount(0);
  }

  /** TC-QS-05 */
  async addQuestion(index = 0) {
    await this.questionItem(index).getByRole('button', { name: /Thêm/i }).click();
  }

  /** TC-QS-09 */
  async addAllQuestions() {
    await this.btnAddAll.click();
  }

  /** TC-QS-10 */
  async createNewQuestion(fillForm: () => Promise<void>) {
    await this.btnCreateQuestion.click();
    await fillForm();
    await this.page.getByRole('button', { name: /Lưu câu hỏi/i }).click();
  }

  /** TC-QS-11 */
  async importWord(filePath: string) {
    await this.btnImportWord.click();
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: /Xác nhận/i }).click();
  }

  /** TC-QS-12: chỉ nhân sự OLM mới thấy input này */
  async searchQuestionById(id: string) {
    await this.searchByIdInput.fill(id);
    await this.page.keyboard.press('Enter');
  }

  async expectSearchByIdNotAvailable() {
    await expect(this.searchByIdInput).toHaveCount(0);
  }
}