import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object nền cho mọi màn "Soạn học liệu V2".
 * Bao phủ mục 6.1 (Header hành động chung), 6.2 (Lưu), 6.3 (Xem trước) của đặc tả nghiệp vụ.
 * Mọi editor riêng (Theory, Video, Essay, PDF, Link, Document, ExamStandard, ExamMixtureV2, ExamMix)
 * nên extends class này.
 */
export abstract class BaseHocLieuV2Page {
  readonly page: Page;

  // Header hành động chung - mục 6.1
  readonly btnSave: Locator;
  readonly btnPreview: Locator;
  readonly btnSubmissionList: Locator; // Danh sách bài làm / lượt làm
  readonly btnStats: Locator; // Xem thống kê
  readonly btnAdvancedSetting: Locator; // Thiết lập nâng cao
  readonly btnCopyLink: Locator; // Sao chép liên kết
  readonly btnDownloadWord: Locator; // Tải Word
  readonly btnHistory: Locator; // Xem lịch sử
  readonly btnDelete: Locator; // Xóa học liệu
  readonly savedToast: Locator;
  readonly accessDeniedMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.btnSave = page.getByRole('button', { name: /^Lưu$/i });
    this.btnPreview = page.getByRole('button', { name: /Xem trước/i });
    this.btnSubmissionList = page.getByRole('button', { name: /(Danh sách bài làm|Lượt làm)/i });
    this.btnStats = page.getByRole('button', { name: /Thống kê/i });
    this.btnAdvancedSetting = page.getByRole('button', { name: /Thiết lập nâng cao/i });
    this.btnCopyLink = page.getByRole('button', { name: /Sao chép liên kết/i });
    this.btnDownloadWord = page.getByRole('button', { name: /Tải Word/i });
    this.btnHistory = page.getByRole('button', { name: /Lịch sử/i });
    this.btnDelete = page.getByRole('button', { name: /Xóa học liệu/i });
    this.savedToast = page.getByText(/Lưu thành công|Đã lưu|Cập nhật thành công/i);
    // TODO: thay bằng selector chặn quyền thật (redirect 403 / trang thông báo không có quyền)
    this.accessDeniedMessage = page.getByText(/không có quyền|không được phép truy cập/i);
  }

  async goto(hocLieuManageUrl: string) {
    await this.page.goto(hocLieuManageUrl);
  }

  /** TC-COM-01: Mở màn soạn học liệu V2 thành công */
  async expectOpenedSuccessfully(expectedTitle: string | RegExp) {
    await expect(this.page).toHaveTitle(expectedTitle).catch(async () => {
      // fallback nếu title không set theo tên học liệu
      await expect(this.page.getByRole('heading', { name: expectedTitle })).toBeVisible();
    });
  }

  /** TC-COM-02: Chặn truy cập khi không có quyền sửa */
  async expectAccessDenied() {
    await expect(this.accessDeniedMessage).toBeVisible({ timeout: 10_000 });
  }

  /** TC-COM-03: Chỉ hiện đúng các action được phép, không hiện thừa */
  async expectHeaderActionsVisible(expected: Partial<Record<
    'save' | 'preview' | 'submissionList' | 'stats' | 'advancedSetting' | 'copyLink' | 'downloadWord' | 'history' | 'delete',
    boolean
  >>) {
    const map: Record<string, Locator> = {
      save: this.btnSave,
      preview: this.btnPreview,
      submissionList: this.btnSubmissionList,
      stats: this.btnStats,
      advancedSetting: this.btnAdvancedSetting,
      copyLink: this.btnCopyLink,
      downloadWord: this.btnDownloadWord,
      history: this.btnHistory,
      delete: this.btnDelete,
    };
    for (const [key, shouldBeVisible] of Object.entries(expected)) {
      const locator = map[key];
      if (shouldBeVisible) {
        await expect(locator).toBeVisible();
      } else {
        await expect(locator).toHaveCount(0);
      }
    }
  }

  /** TC-COM-04 */
  async save() {
    await this.btnSave.click();
  }

  async expectSavedSuccessfully() {
    await expect(this.savedToast).toBeVisible({ timeout: 10_000 });
  }

  /** TC-COM-05: Tải lại trang sau khi lưu, dữ liệu phải khớp */
  async reloadAndVerify(assertAfterReload: () => Promise<void>) {
    await this.page.reload();
    await assertAfterReload();
  }

  /** TC-COM-06 */
  async openPreview() {
    await this.btnPreview.click();
  }

  /** TC-COM-07 */
  async openSubmissionList() {
    const [popupOrSamePage] = await Promise.all([
      this.page.waitForNavigation().catch(() => null),
      this.btnSubmissionList.click(),
    ]);
    return popupOrSamePage;
  }

  /** TC-COM-08 */
  async copyLink(): Promise<string> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await this.btnCopyLink.click();
    return this.page.evaluate(() => navigator.clipboard.readText());
  }

  /** TC-COM-09 */
  async openHistory() {
    await this.btnHistory.click();
  }
}