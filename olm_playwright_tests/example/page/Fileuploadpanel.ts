import { Page, Locator, expect } from '@playwright/test';

/**
 * Component dùng chung cho khối Upload tệp - mục 6.5 đặc tả.
 * Áp dụng cho: Theory, Essay (2 panel: đề bài/đáp án), PDF (2 panel), Document.
 */
export class FileUploadPanel {
  readonly page: Page;
  readonly root: Locator;
  readonly fileInput: Locator;
  readonly preview: Locator;
  readonly savingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly replaceButton: Locator;

  constructor(page: Page, scope?: Locator) {
    this.page = page;
    // TODO: thay data-testid theo DOM thật; nếu trang chỉ có 1 input[type=file] trong scope thì để nguyên
    this.root = scope ?? page.locator('[data-testid="file-upload-panel"]');
    this.fileInput = this.root.locator('input[type="file"]');
    this.preview = this.root.locator('[data-testid="file-preview"]');
    this.savingIndicator = this.root.getByText(/đang lưu|đang tải lên|đang xử lý/i);
    this.errorMessage = this.root.getByText(/không đúng định dạng|tệp không hợp lệ|định dạng không được hỗ trợ/i);
    this.replaceButton = this.root.getByRole('button', { name: /Thay (thế|tệp)|Tải lại tệp/i });
  }

  /** TC-FILE-01 */
  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /** TC-FILE-02 */
  async expectPreviewVisible() {
    await expect(this.preview).toBeVisible({ timeout: 15_000 });
  }

  /** TC-FILE-03: tải tệp mới để thay thế tệp cũ */
  async replaceFile(newFilePath: string) {
    if (await this.replaceButton.isVisible().catch(() => false)) {
      await this.replaceButton.click();
    }
    await this.fileInput.setInputFiles(newFilePath);
  }

  async expectPreviewMatchesFileName(fileName: string) {
    await expect(this.preview).toContainText(fileName);
  }

  /** TC-FILE-05 */
  async expectFormatRejected() {
    await expect(this.errorMessage).toBeVisible();
  }

  /** TC-DOC-02 */
  async expectSavingIndicatorShown() {
    await expect(this.savingIndicator).toBeVisible({ timeout: 5_000 });
  }
}