import { Page, Locator, expect } from '@playwright/test';
import { HocLieuCuaToiV2Page } from './Hoclieucuatoiv2page';
import { dismissPopups, safeClick } from '../../../../core/shared-pages/dismissPopups';

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
    const listPage = new HocLieuCuaToiV2Page(this.page);
    await listPage.goto();

    const rowLink = this.page.locator(`table tbody tr a[href*="${hocLieuManageUrl}"]`).first();
    const found = await rowLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!found) {
      throw new Error(
        `[BaseHocLieuV2Page.goto] Không tìm thấy học liệu khớp "${hocLieuManageUrl}" trong "Học liệu của tôi" ` +
          `của role đang đăng nhập. KHÔNG tự động điều hướng thẳng URL nữa — hãy kiểm tra lại: ` +
          `(1) dữ liệu seed của role này có học liệu đó không, ` +
          `(2) href thật trong bảng có khớp chuỗi truyền vào không, ` +
          `(3) nếu học liệu này CHỦ ĐÍCH không thuộc sở hữu role (VD test chặn truy cập), ` +
          `hãy gọi gotoDirectly("${hocLieuManageUrl}") thay vì goto().`
      );
    }

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      rowLink.click(),
    ]);
    // Popup "Xác thực"/"Thay đổi mật khẩu" đôi khi xuất hiện lại ở màn soạn
    // thảo — đóng luôn để không chặn các thao tác save/preview/... sau đó.
    await dismissPopups(this.page);
  }


  /**
   * Điều hướng thẳng tới 1 URL màn soạn học liệu V2 cụ thể, tự gắn thêm
   * query param ?v=v2 (hoặc &v=v2 nếu URL truyền vào đã có sẵn query khác)
   * để hệ thống trả về đúng giao diện V2 ngay từ lần điều hướng đầu tiên —
   * không còn cần đi qua màn V1 rồi bấm "Thử phiên bản mới" trước.
   */
  async gotoDirectly(hocLieuManageUrl: string) {
    const separator = hocLieuManageUrl.includes('?') ? '&' : '?';
    await this.page.goto(`${hocLieuManageUrl}${separator}v=v2`);
    await dismissPopups(this.page);
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
    // FIX (2026-07-28): check popup trước khi bấm Lưu — 1 popup xuất hiện
    // đúng lúc bấm sẽ nuốt mất click, làm test tưởng đã lưu nhưng thực ra
    // chưa lưu gì cả (savedToast() sau đó fail rất khó hiểu vì "trông như
    // đã bấm Lưu rồi").
    await safeClick(this.page, this.btnSave);
  }

  async expectSavedSuccessfully() {
    await expect(this.savedToast).toBeVisible({ timeout: 10_000 });
  }

  /** TC-COM-05: Tải lại trang sau khi lưu, dữ liệu phải khớp */
  async reloadAndVerify(assertAfterReload: () => Promise<void>) {
    await this.page.reload();
    // Sau reload là full navigation mới -> popup "Xác thực"/"Thay đổi mật
    // khẩu" có thể xuất hiện lại (đã ghi nhận ở global-setup.ts) và che nội
    // dung cần assert ngay sau đó.
    await dismissPopups(this.page);
    await assertAfterReload();
  }

  /** TC-COM-06 */
  async openPreview() {
    await safeClick(this.page, this.btnPreview);
  }

  /** TC-COM-07 */
  async openSubmissionList() {
    const [popupOrSamePage] = await Promise.all([
      this.page.waitForNavigation().catch(() => null),
      safeClick(this.page, this.btnSubmissionList),
    ]);
    // popupOrSamePage ở đây là Response của điều hướng CÙNG trang (kiểu trả
    // về thật của waitForNavigation(), không phải Page mới) — dọn popup
    // ngay trên this.page sau khi điều hướng xong.
    await dismissPopups(this.page);
    return popupOrSamePage;
  }

  /** TC-COM-08 */
  async copyLink(): Promise<string> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await safeClick(this.page, this.btnCopyLink);
    return this.page.evaluate(() => navigator.clipboard.readText());
  }

  /** TC-COM-09 */
  async openHistory() {
    await safeClick(this.page, this.btnHistory);
    // Panel/modal "Lịch sử" vừa mở có thể tự kéo theo 1 popup khác (hiếm
    // nhưng đã gặp ở luồng V1 tương tự) — dọn lại cho chắc trước khi caller
    // assert nội dung lịch sử.
    await dismissPopups(this.page);
  }
}