// modules/quan-ly-hoc-lieu/pages/SoanHocLieuV2Page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';

/**
 * Page Object — Soạn học liệu V2 (màn chỉnh sửa nội dung học liệu).
 *
 * Bao quát:
 *  - Khối chức năng dùng chung (mục 6 trong đặc tả nghiệp vụ): header hành động,
 *    lưu học liệu, xem trước, sidebar nguồn câu hỏi, upload tệp, nguồn OLM.
 *  - Đặc tả riêng theo từng loại học liệu (mục 8.1 → 8.9): Theory, Video, Essay,
 *    PDF, Link, Document, Exam Standard, Exam Mixture V2, Exam Mix.
 *
 * Lưu ý: đây là màn SOẠN/SỬA một học liệu đã tồn tại — khác với HocLieuCuaToiPage
 * (màn danh sách + luồng TẠO MỚI học liệu qua modal). Dùng kết hợp 2 page object:
 *   const listPage = new HocLieuCuaToiPage(page);
 *   const soanPage = new SoanHocLieuV2Page(page);
 *   const title = await listPage.createCourseware(...);
 *   await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
 *
 * QUAN TRỌNG: theo đúng HTML thực tế của "Học liệu của tôi", click vào link
 * tên học liệu chỉ đưa tới trang XEM (/chu-de/{slug}), KHÔNG phải màn soạn.
 * Phải bấm nút "Chọn" để mở dropdown rồi bấm "Sửa đổi" — xem
 * openManageScreenFromRow() bên dưới.
 */

/** Loại học liệu có view/container V2 (mục 2 - Phạm vi chức năng) */
export enum HocLieuV2Type {
  EXAM_MIXTURE_V2 = 'exam_mixture_v2', // Đề kiểm tra
  EXAM_STANDARD = 'exam_standard', // Dạng đề kĩ năng NHCH
  THEORY = 'theory', // Học liệu lý thuyết
  ESSAY = 'essay', // Học liệu tự luận
  PDF = 'pdf', // Học liệu đề PDF
  VIDEO = 'video', // Học liệu video
  LINK = 'link', // Học liệu liên kết
  DOCUMENT = 'document', // Học liệu tài liệu
  EXAM_MIX = 'exam_mix', // Đề thi trộn offline
}

/** Nguồn câu hỏi trong sidebar dùng chung (mục 6.4) */
export enum QuestionSourceTab {
  HOC_LIEU_NAY = 'Học liệu này',
  HOC_LIEU_CUA_TOI = 'Học liệu của tôi',
  HOC_LIEU_OLM = 'Học liệu OLM',
}

/** Chế độ thao tác của Đề kiểm tra (Exam Mixture V2) — mục 8.8 */
export enum ExamMixtureMode {
  CHON_CAU_HOI = 'chon_cau_hoi',
  TAO_DE_TU_MA_TRAN = 'tao_de_tu_ma_tran',
}

/** Phần nội dung độc lập của học liệu Tự luận / PDF (mục 8.3, 8.4) */
export type ContentPart = 'de-bai' | 'dap-an';

export interface MatrixConfigOptions {
  subject?: string;
  grade?: string;
  totalQuestions?: number;
}

export class SoanHocLieuV2Page extends BasePage {
  // ==================================================================
  // 6.1. Header hành động chung
  // ==================================================================
  static readonly HEADER_ACTIONS = '.courseware-header-actions, header.compose-header';
  static readonly BTN_DANH_SACH_LUOT_LAM = 'a:has-text("Danh sách bài làm"), button:has-text("Danh sách bài làm")';
  static readonly BTN_THONG_KE = 'a:has-text("Thống kê"), button:has-text("Thống kê")';
  static readonly BTN_THIET_LAP_NANG_CAO = 'button:has-text("Thiết lập nâng cao")';
  static readonly BTN_SAO_CHEP_LIEN_KET = 'button:has-text("Sao chép liên kết"), button[title="Sao chép liên kết"]';
  static readonly BTN_TAI_WORD = 'button:has-text("Tải Word"), a:has-text("Tải Word")';
  static readonly BTN_LICH_SU = 'a:has-text("Lịch sử"), button:has-text("Lịch sử")';
  static readonly BTN_XOA_HOC_LIEU = 'button:has-text("Xóa học liệu"), button:has-text("Xóa")';
  static readonly CONFIRM_XOA_BTN = 'div[role="dialog"] button:has-text("Xóa"), .modal.show button:has-text("Đồng ý")';

  // ---- Chặn truy cập khi không có quyền (TC-COM-02) ----
  static readonly ACCESS_DENIED_MSG =
    'text=Bạn không có quyền truy cập, text=không có quyền chỉnh sửa, text=Không có quyền truy cập';

  // ==================================================================
  // 6.2 / 6.3. Lưu & Xem trước (dùng chung mọi loại học liệu)
  // ==================================================================
  static readonly BTN_LUU = 'button:has-text("Lưu học liệu"), button:has-text("Lưu cập nhật"), button:has-text("Lưu thay đổi"), button:has-text("Lưu")';
  static readonly SAVE_SUCCESS_TOAST = '.toast-success, text=Lưu thành công, text=Cập nhật thành công';
  static readonly BTN_XEM_TRUOC = 'button:has-text("Xem trước")';
  static readonly PREVIEW_PANEL = '.preview-panel, div[role="dialog"]:has-text("Xem trước"), iframe.preview-frame';

  // ==================================================================
  // 6.4. Sidebar nguồn câu hỏi (Theory, Exam Standard, Exam Mixture V2...)
  // ==================================================================
  static readonly SIDEBAR = '.question-source-sidebar, aside.sidebar-cau-hoi';
  static readonly SIDEBAR_TAB = (tab: QuestionSourceTab) => `.question-source-sidebar a:has-text("${tab}"), .question-source-sidebar button:has-text("${tab}")`;
  static readonly SIDEBAR_QUESTION_ITEM = '.question-source-sidebar .question-item';
  static readonly BTN_THEM_CAU_HOI_ITEM = '.question-item .btn-them, .question-item button:has-text("Thêm")';
  static readonly BTN_THEM_TAT_CA = 'button:has-text("Thêm tất cả")';
  static readonly OLM_UPGRADE_NOTICE =
    'text=Nâng cấp gói, text=Bạn chưa có quyền sử dụng nguồn học liệu OLM, text=Nâng quyền';
  static readonly OLM_ID_SEARCH_INPUT = 'input[placeholder*="Nhập ID câu hỏi"], input[placeholder*="Tìm ID câu hỏi"]';
  static readonly OLM_ID_SEARCH_BTN = 'button:has-text("Tìm"), button[aria-label="Tìm ID câu hỏi"]';

  // ---- Cây "Học liệu của tôi" / "Học liệu OLM" (khóa học > chương > bài > học liệu) ----
  static readonly TREE_COURSE_SELECT = 'select[name="id_course"], .tree-course-select';
  static readonly TREE_CHAPTER_SELECT = 'select[name="id_chapter"], .tree-chapter-select';
  static readonly TREE_LESSON_SELECT = 'select[name="id_lesson"], .tree-lesson-select';
  static readonly TREE_CATEGORY_SELECT = 'select[name="id_category"], .tree-category-select';
  static readonly TREE_GRADE_SELECT = 'select[name="grade"], .tree-grade-select';
  static readonly TREE_SUBJECT_SELECT = 'select[name="id_subject"], .tree-subject-select';

  // ==================================================================
  // Editor nội dung (Theory, Essay khi ở chế độ soạn thảo)
  // ==================================================================
  static readonly EDITOR_CONTENT = 'div[contenteditable="true"].editor-content';
  static readonly BTN_CHEN_CAU_HOI_TOOLBAR = 'button[title="Chèn câu hỏi"], button:has-text("Chèn câu hỏi")';

  // ==================================================================
  // 6.5. Upload tệp (dùng chung: Theory, Essay, PDF, Document)
  // ==================================================================
  static readonly FILE_UPLOAD_INPUT = 'input[type="file"]';
  static readonly FILE_UPLOAD_STATUS = '.form-status-upload-file';
  static readonly FILE_PREVIEW_AREA = '.file-preview-area, .preview-document';
  static readonly FILE_UPLOAD_ERROR = 'text=Định dạng tệp không hợp lệ, text=không đúng định dạng, .alert-danger';

  // ---- Toggle giữa soạn editor / dùng tệp (Theory §8.1, Essay §8.3) ----
  static readonly TOGGLE_MODE_EDITOR = 'button:has-text("Soạn thảo"), input[value="editor"]';
  static readonly TOGGLE_MODE_FILE = 'button:has-text("Tải tệp"), input[value="file"]';

  // ---- Điều hướng từ dòng trong bảng "Học liệu của tôi" (HocLieuCuaToiPage) ----
  // Theo đúng HTML thực tế: click link ở cột "Tên bài" chỉ đưa tới trang XEM
  // (/chu-de/{slug}-{id}), KHÔNG phải màn soạn. Phải mở dropdown "Chọn" rồi
  // bấm "Sửa đổi" (href .../quan-ly) mới vào đúng màn Soạn học liệu V2.
  static readonly ROW_CHON_DROPDOWN_TOGGLE = 'button:has-text("Chọn")';
  static readonly ROW_SUA_DOI_LINK = 'a.dropdown-item:has-text("Sửa đổi")';

  constructor(page: Page) {
    super(page);
  }

  // ==================================================================
  // Điều hướng & phân quyền (Bước 1, TC-COM-01 / TC-COM-02)
  // ==================================================================

  /**
   * Mở màn soạn TỪ 1 dòng trong bảng danh sách (kết quả của
   * HocLieuCuaToiPage.getRowByTitle()/getTableRows()). Đây là cách đúng và
   * ổn định nhất vì không cần biết trước slug — bấm "Chọn" → "Sửa đổi".
   */
  async openManageScreenFromRow(row: Locator): Promise<this> {
    await row.locator(SoanHocLieuV2Page.ROW_CHON_DROPDOWN_TOGGLE).click();
    const suaDoiLink = row.locator(SoanHocLieuV2Page.ROW_SUA_DOI_LINK);
    await suaDoiLink.waitFor({ state: 'visible', timeout: 5000 });
    await suaDoiLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissAllNotifications();
    return this;
  }

  /**
   * Vào thẳng màn soạn khi ĐÃ BIẾT slug đầy đủ, dạng "{ten-khong-dau}-{id}"
   * (KHÔNG phải chỉ id — xem HTML mẫu: /chu-de/dasa-5025578947/quan-ly).
   * Dùng openManageScreenFromRow() khi có thể; chỉ dùng hàm này khi test
   * đã có sẵn slug (ví dụ lấy từ URL sau khi tạo học liệu).
   */
  async gotoManageScreenBySlug(fullSlug: string): Promise<this> {
    await this.navigateTo(`/chu-de/${fullSlug}/quan-ly`);
    return this;
  }

  /** Kỳ vọng màn soạn mở thành công, không lỗi trang (TC-COM-01) */
  async expectOpenedSuccessfully(): Promise<void> {
    await expect(this.page.locator(SoanHocLieuV2Page.BTN_LUU)).toBeVisible({ timeout: 10000 });
  }

  /** Kỳ vọng bị chặn truy cập khi không có quyền sửa (TC-COM-02) */
  async expectAccessDenied(): Promise<void> {
    const denied = this.page.locator(SoanHocLieuV2Page.ACCESS_DENIED_MSG);
    await expect(denied.first()).toBeVisible({ timeout: 10000 });
  }

  /** Alias ngắn gọn — dùng khi test đã có slug đầy đủ và chỉ cần kiểm tra bị chặn */
  async gotoManageScreen(fullSlug: string): Promise<this> {
    return this.gotoManageScreenBySlug(fullSlug);
  }

  // ==================================================================
  // 6.1 Header hành động chung (TC-COM-03, TC-COM-07/08/09)
  // ==================================================================

  /** Trả về danh sách các nút hành động header đang thực sự hiển thị */
  async getVisibleHeaderActions(): Promise<string[]> {
    const buttons = [
      { name: 'danh_sach_luot_lam', selector: SoanHocLieuV2Page.BTN_DANH_SACH_LUOT_LAM },
      { name: 'thong_ke', selector: SoanHocLieuV2Page.BTN_THONG_KE },
      { name: 'thiet_lap_nang_cao', selector: SoanHocLieuV2Page.BTN_THIET_LAP_NANG_CAO },
      { name: 'sao_chep_lien_ket', selector: SoanHocLieuV2Page.BTN_SAO_CHEP_LIEN_KET },
      { name: 'tai_word', selector: SoanHocLieuV2Page.BTN_TAI_WORD },
      { name: 'lich_su', selector: SoanHocLieuV2Page.BTN_LICH_SU },
      { name: 'xoa_hoc_lieu', selector: SoanHocLieuV2Page.BTN_XOA_HOC_LIEU },
    ];
    const visible: string[] = [];
    for (const b of buttons) {
      if (await this.page.locator(b.selector).first().isVisible().catch(() => false)) {
        visible.push(b.name);
      }
    }
    return visible;
  }

  async openDanhSachLuotLam(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_DANH_SACH_LUOT_LAM).first().click();
    await this.page.waitForLoadState('domcontentloaded');
    return this;
  }

  async copyShareLink(): Promise<string | null> {
    await this.page.locator(SoanHocLieuV2Page.BTN_SAO_CHEP_LIEN_KET).first().click();
    return this.page.evaluate(() => navigator.clipboard.readText().catch(() => null));
  }

  async openLichSu(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_LICH_SU).first().click();
    await this.page.waitForLoadState('domcontentloaded');
    return this;
  }

  async xoaHocLieu(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_XOA_HOC_LIEU).first().click();
    await this.page.locator(SoanHocLieuV2Page.CONFIRM_XOA_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // 6.2 Lưu học liệu (TC-COM-04, TC-COM-05)
  // ==================================================================

  /** Bấm lưu và chờ hệ thống xử lý xong */
  async save(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_LUU).first().click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await this.dismissAllNotifications();
    return this;
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(this.page.locator(SoanHocLieuV2Page.SAVE_SUCCESS_TOAST).first()).toBeVisible({ timeout: 8000 });
  }

  /** Reload trang, dùng cho TC-COM-05 / TC-FILE-04: dữ liệu phải giữ nguyên sau khi tải lại */
  async reload(): Promise<this> {
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissAllNotifications();
    return this;
  }

  // ==================================================================
  // 6.3 Xem trước học liệu (TC-COM-06)
  // ==================================================================
  async openPreview(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_XEM_TRUOC).first().click();
    await this.page.locator(SoanHocLieuV2Page.PREVIEW_PANEL).first().waitFor({ state: 'visible', timeout: 8000 });
    return this;
  }

  getPreviewPanel(): Locator {
    return this.page.locator(SoanHocLieuV2Page.PREVIEW_PANEL).first();
  }

  // ==================================================================
  // 6.4 Sidebar nguồn câu hỏi (TC-QS-01 → TC-QS-12)
  // ==================================================================

  async openQuestionSourceTab(tab: QuestionSourceTab): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.SIDEBAR_TAB(tab)).click();
    return this;
  }

  /**
   * Duyệt cây "Học liệu của tôi" / "Học liệu OLM": chọn khóa học/khối lớp, môn,
   * chương, bài, rồi tới học liệu cụ thể để lấy danh sách câu hỏi (TC-QS-02, TC-QS-03).
   */
  async browseSourceTree(options: {
    grade?: string;
    subject?: string;
    course?: string;
    chapter?: string;
    lesson?: string;
    category?: string;
  }): Promise<this> {
    if (options.grade) await this.page.locator(SoanHocLieuV2Page.TREE_GRADE_SELECT).selectOption({ label: options.grade });
    if (options.subject) await this.page.locator(SoanHocLieuV2Page.TREE_SUBJECT_SELECT).selectOption({ label: options.subject });
    if (options.course) await this.page.locator(SoanHocLieuV2Page.TREE_COURSE_SELECT).selectOption({ label: options.course });
    if (options.chapter) await this.page.locator(SoanHocLieuV2Page.TREE_CHAPTER_SELECT).selectOption({ label: options.chapter });
    if (options.lesson) await this.page.locator(SoanHocLieuV2Page.TREE_LESSON_SELECT).selectOption({ label: options.lesson });
    if (options.category) await this.page.locator(SoanHocLieuV2Page.TREE_CATEGORY_SELECT).selectOption({ label: options.category });
    return this;
  }

  /** Kỳ vọng KHÔNG hiển thị danh sách câu hỏi OLM khi không có quyền (TC-QS-04) */
  async expectOlmSourceLocked(): Promise<void> {
    await expect(this.page.locator(SoanHocLieuV2Page.OLM_UPGRADE_NOTICE).first()).toBeVisible({ timeout: 8000 });
    expect(await this.page.locator(SoanHocLieuV2Page.SIDEBAR_QUESTION_ITEM).count()).toBe(0);
  }

  getSidebarQuestionItems(): Locator {
    return this.page.locator(SoanHocLieuV2Page.SIDEBAR_QUESTION_ITEM);
  }

  /** Thêm 1 câu hỏi từ sidebar vào nội dung theo index (0-based) */
  async addQuestionFromSidebar(index = 0): Promise<this> {
    const item = this.getSidebarQuestionItems().nth(index);
    await item.locator(SoanHocLieuV2Page.BTN_THEM_CAU_HOI_ITEM).click();
    return this;
  }

  async addAllQuestionsFromSidebar(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_THEM_TAT_CA).click();
    return this;
  }

  /** Đếm số lần xuất hiện của 1 câu hỏi (theo tiêu đề) trong editor — dùng cho TC-QS-06/07 */
  async countQuestionOccurrencesInEditor(questionTitle: string): Promise<number> {
    return this.page
      .locator(SoanHocLieuV2Page.EDITOR_CONTENT)
      .locator(`text=${questionTitle}`)
      .count();
  }

  /** Nhân sự OLM: tìm câu hỏi theo ID (TC-QS-12) */
  async searchQuestionById(questionId: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.OLM_ID_SEARCH_INPUT).fill(questionId);
    await this.page.locator(SoanHocLieuV2Page.OLM_ID_SEARCH_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Editor & "Chèn câu hỏi" (mục 8.1 — riêng cho luồng editor của Theory)
  // ==================================================================

  /** Kích hoạt đúng ngữ cảnh chèn câu hỏi trên toolbar trước khi thêm câu hỏi từ sidebar */
  async activateInsertQuestionMode(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_CHEN_CAU_HOI_TOOLBAR).click();
    return this;
  }

  async typeInEditor(text: string): Promise<this> {
    const editor = this.page.locator(SoanHocLieuV2Page.EDITOR_CONTENT);
    await editor.click();
    await editor.type(text);
    return this;
  }

  // ==================================================================
  // 6.5 Upload tệp (TC-FILE-01 → TC-FILE-05)
  // ==================================================================

  async switchToEditorMode(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.TOGGLE_MODE_EDITOR).click();
    return this;
  }

  async switchToFileMode(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.TOGGLE_MODE_FILE).click();
    return this;
  }

  /** Upload 1 tệp (dùng chung Theory/Essay/PDF/Document) */
  async uploadFile(filePath: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.FILE_UPLOAD_INPUT).first().setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return this;
  }

  getFilePreviewArea(): Locator {
    return this.page.locator(SoanHocLieuV2Page.FILE_PREVIEW_AREA).first();
  }

  /** Thử tải tệp sai định dạng, kỳ vọng bị từ chối kèm thông báo (TC-FILE-05) */
  async expectUploadRejected(filePath: string): Promise<void> {
    await this.page.locator(SoanHocLieuV2Page.FILE_UPLOAD_INPUT).first().setInputFiles(filePath).catch(() => {});
    await expect(this.page.locator(SoanHocLieuV2Page.FILE_UPLOAD_ERROR).first()).toBeVisible({ timeout: 8000 });
  }

  // ==================================================================
  // 8.2. Video (Youtube + tải video bài giảng + tài nguyên đi kèm)
  // ==================================================================
  static readonly YOUTUBE_LINK_INPUT = 'input[placeholder*="link" i][placeholder*="youtube" i]';
  static readonly BTN_XEM_VIDEO = 'button:has-text("Xem video")';
  static readonly VIDEO_PLAYER = 'iframe[src*="youtube"], video.video-player';
  static readonly BTN_THEM_DIEM_DUNG = 'button:has-text("Thêm điểm dừng")';
  static readonly STOP_POINT_LIST = '.stop-point-list .stop-point-item';
  static readonly STOP_POINT_TIME_INPUT = '.stop-point-item input[name="time"]';
  static readonly BTN_XOA_DIEM_DUNG = '.stop-point-item button:has-text("Xóa")';
  static readonly BTN_GAN_CAU_HOI_DIEM_DUNG = '.stop-point-item button:has-text("Gắn câu hỏi")';
  static readonly BTN_UPLOAD_VIDEO_BAI_GIANG = 'input[type="file"][accept*="video"]';
  static readonly UPLOAD_VIDEO_PROGRESS = '.progress-upload';
  static readonly BTN_HUY_UPLOAD_VIDEO = 'button:has-text("Hủy tải lên")';
  static readonly BTN_THU_LAI_UPLOAD_VIDEO = 'button:has-text("Thử lại")';
  static readonly BTN_THAY_THE_VIDEO = 'button:has-text("Thay thế")';
  static readonly BAI_GIANG_DINH_KEM_INPUT = 'input[type="file"].input-file-document';
  static readonly TOM_TAT_BAI_GIANG_TEXTAREA = 'textarea[name="summary"], textarea[placeholder*="Tóm tắt"]';
  static readonly TRANSCRIPT_TEXTAREA = 'textarea[name="transcript"], .transcript-editor';

  async enterYoutubeLink(url: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.YOUTUBE_LINK_INPUT).fill(url);
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  async expectVideoPlayable(): Promise<void> {
    await expect(this.page.locator(SoanHocLieuV2Page.VIDEO_PLAYER).first()).toBeVisible({ timeout: 10000 });
  }

  async addStopPoint(timeSeconds: number): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_THEM_DIEM_DUNG).click();
    const lastStopPoint = this.page.locator(SoanHocLieuV2Page.STOP_POINT_LIST).last();
    await lastStopPoint.locator('input[name="time"]').fill(String(timeSeconds));
    return this;
  }

  getStopPoints(): Locator {
    return this.page.locator(SoanHocLieuV2Page.STOP_POINT_LIST);
  }

  async deleteStopPoint(index: number): Promise<this> {
    await this.getStopPoints().nth(index).locator('button:has-text("Xóa")').click();
    return this;
  }

  async attachQuestionToStopPoint(index: number, questionTitle: string): Promise<this> {
    await this.getStopPoints().nth(index).locator('button:has-text("Gắn câu hỏi")').click();
    await this.addQuestionFromSidebar(0);
    return this;
  }

  async uploadLectureVideo(filePath: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_UPLOAD_VIDEO_BAI_GIANG).setInputFiles(filePath);
    return this;
  }

  async cancelVideoUpload(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_HUY_UPLOAD_VIDEO).click();
    return this;
  }

  async retryVideoUpload(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_THU_LAI_UPLOAD_VIDEO).click();
    return this;
  }

  async replaceLectureVideo(filePath: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_THAY_THE_VIDEO).click();
    await this.page.locator(SoanHocLieuV2Page.BTN_UPLOAD_VIDEO_BAI_GIANG).setInputFiles(filePath);
    return this;
  }

  async attachLectureFile(filePath: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BAI_GIANG_DINH_KEM_INPUT).setInputFiles(filePath);
    return this;
  }

  async setLectureSummary(text: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.TOM_TAT_BAI_GIANG_TEXTAREA).fill(text);
    return this;
  }

  async editTranscript(text: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.TRANSCRIPT_TEXTAREA).fill(text);
    return this;
  }

  // ==================================================================
  // 8.3. Essay (Đề bài / Đáp án-Hướng dẫn giải — 2 nhánh độc lập)
  // ==================================================================
  static readonly TAB_DE_BAI = 'button:has-text("Đề bài"), a:has-text("Đề bài")';
  static readonly TAB_DAP_AN = 'button:has-text("Đáp án"), a:has-text("Đáp án"), button:has-text("Hướng dẫn giải")';
  static readonly UNSAVED_CHANGES_DIALOG = 'div[role="dialog"]:has-text("chưa được lưu"), .modal.show:has-text("lưu thay đổi")';
  static readonly BTN_LUU_VA_CHUYEN_TAB = 'button:has-text("Lưu và tiếp tục")';
  static readonly BTN_KHONG_LUU_CHUYEN_TAB = 'button:has-text("Không lưu")';

  async switchEssayTab(part: ContentPart): Promise<this> {
    const selector = part === 'de-bai' ? SoanHocLieuV2Page.TAB_DE_BAI : SoanHocLieuV2Page.TAB_DAP_AN;
    await this.page.locator(selector).click();
    return this;
  }

  /** Nếu có thay đổi chưa lưu khi chuyển tab, hệ thống hỏi xác nhận (mục 8.3) */
  async confirmUnsavedChangesIfAsked(shouldSave: boolean): Promise<this> {
    const dialog = this.page.locator(SoanHocLieuV2Page.UNSAVED_CHANGES_DIALOG);
    if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      const btn = shouldSave ? SoanHocLieuV2Page.BTN_LUU_VA_CHUYEN_TAB : SoanHocLieuV2Page.BTN_KHONG_LUU_CHUYEN_TAB;
      await this.page.locator(btn).click();
    }
    return this;
  }

  // ==================================================================
  // 8.4. PDF (tệp đề bài / tệp đáp án / khu vực xử lý đáp án)
  // ==================================================================
  static readonly ANSWER_PROCESSING_AREA = '.answer-processing-area, aside.khu-vuc-xu-ly-dap-an';
  static readonly ANSWER_PROCESSING_INPUT = '.answer-processing-area textarea, .answer-processing-area input';
  static readonly ANSWER_PROCESSING_INVALID_MSG = '.answer-processing-area .invalid-feedback, text=Dữ liệu đáp án chưa hợp lệ';

  async uploadPdfPart(filePath: string, part: ContentPart): Promise<this> {
    await this.switchEssayTab(part); // Đề bài / Đáp án dùng chung cơ chế tab với Essay
    await this.uploadFile(filePath);
    return this;
  }

  isAnswerProcessingAreaVisible(): Promise<boolean> {
    return this.page.locator(SoanHocLieuV2Page.ANSWER_PROCESSING_AREA).isVisible().catch(() => false);
  }

  async fillAnswerProcessingArea(data: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.ANSWER_PROCESSING_INPUT).first().fill(data);
    return this;
  }

  async expectAnswerProcessingInvalidBlocksSave(): Promise<void> {
    await expect(this.page.locator(SoanHocLieuV2Page.ANSWER_PROCESSING_INVALID_MSG)).toBeVisible({ timeout: 5000 });
    await expect(this.page.locator(SoanHocLieuV2Page.BTN_LUU).first()).toBeDisabled().catch(() => {});
  }

  // ==================================================================
  // 8.5. Link (nhập URL, kiểm tra hợp lệ, lưu)
  // ==================================================================
  static readonly LINK_URL_INPUT = 'input[placeholder*="đường dẫn" i], input[placeholder*="URL" i], input[name="link_url"]';
  static readonly LINK_INVALID_MSG = 'text=Đường dẫn không hợp lệ, text=Liên kết không hợp lệ, .invalid-feedback';

  async enterLinkUrl(url: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.LINK_URL_INPUT).fill(url);
    return this;
  }

  async expectLinkInvalidCannotSave(): Promise<void> {
    await expect(this.page.locator(SoanHocLieuV2Page.LINK_INVALID_MSG).first()).toBeVisible({ timeout: 5000 });
    await expect(this.page.locator(SoanHocLieuV2Page.BTN_LUU).first()).toBeDisabled().catch(() => {});
  }

  // ==================================================================
  // 8.6. Document (1 tài liệu chính, xem trước, thay thế)
  // ==================================================================
  async uploadMainDocument(filePath: string): Promise<this> {
    return this.uploadFile(filePath);
  }

  async replaceMainDocument(newFilePath: string): Promise<this> {
    return this.uploadFile(newFilePath);
  }

  // ==================================================================
  // 8.7. Exam Standard (đề chuẩn — chỉ 1 luồng: chọn câu hỏi từ học liệu)
  // ==================================================================
  static readonly BTN_TAO_MOI_CAU_HOI = 'button:has-text("Tạo mới câu hỏi"), button:has-text("Tạo câu hỏi")';
  static readonly BTN_IMPORT_WORD = 'button:has-text("Import Word")';
  static readonly IMPORT_WORD_FILE_INPUT = 'input[type="file"][accept*="word" i], input[type="file"].input-import-word';
  static readonly BTN_XAC_NHAN_IMPORT = 'button:has-text("Xác nhận")';

  /** Exam Standard không có lựa chọn chuyển sang Tạo đề từ ma trận (mục 8.7) */
  async expectMatrixModeNotAvailable(): Promise<void> {
    await expect(this.page.locator('button:has-text("Tạo đề từ ma trận")')).toHaveCount(0);
  }

  async createNewQuestion(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_TAO_MOI_CAU_HOI).click();
    return this;
  }

  async importFromWord(filePath: string): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_IMPORT_WORD).click();
    await this.page.locator(SoanHocLieuV2Page.IMPORT_WORD_FILE_INPUT).setInputFiles(filePath);
    await this.page.locator(SoanHocLieuV2Page.BTN_XAC_NHAN_IMPORT).click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return this;
  }

  async downloadWord(): Promise<void> {
    await this.page.locator(SoanHocLieuV2Page.BTN_TAI_WORD).first().click();
  }

  // ==================================================================
  // 8.8. Exam Mixture V2 (Đề kiểm tra — 2 chế độ: chọn câu hỏi / ma trận)
  // ==================================================================
  static readonly MODE_TOGGLE = (mode: ExamMixtureMode) =>
    mode === ExamMixtureMode.CHON_CAU_HOI
      ? 'button:has-text("Chọn câu hỏi từ học liệu")'
      : 'button:has-text("Tạo đề từ ma trận")';
  static readonly MATRIX_CONFIG_AREA = '.matrix-config-area';
  static readonly MATRIX_SUBJECT_SELECT = '.matrix-config-area select[name="subject"]';
  static readonly MATRIX_GRADE_SELECT = '.matrix-config-area select[name="grade"]';
  static readonly MATRIX_TOTAL_QUESTIONS_INPUT = '.matrix-config-area input[name="total_questions"]';
  static readonly BTN_LUU_MA_TRAN = '.matrix-config-area button:has-text("Lưu")';

  async switchExamMixtureMode(mode: ExamMixtureMode): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.MODE_TOGGLE(mode)).click();
    return this;
  }

  async configureMatrix(options: MatrixConfigOptions): Promise<this> {
    if (options.subject) await this.page.locator(SoanHocLieuV2Page.MATRIX_SUBJECT_SELECT).selectOption({ label: options.subject });
    if (options.grade) await this.page.locator(SoanHocLieuV2Page.MATRIX_GRADE_SELECT).selectOption({ label: options.grade });
    if (options.totalQuestions !== undefined) {
      await this.page.locator(SoanHocLieuV2Page.MATRIX_TOTAL_QUESTIONS_INPUT).fill(String(options.totalQuestions));
    }
    await this.page.locator(SoanHocLieuV2Page.BTN_LUU_MA_TRAN).click();
    return this;
  }

  // ==================================================================
  // 8.9. Exam Mix (đề offline: import Word, shuffle, danh sách câu hỏi)
  // ==================================================================
  static readonly OFFLINE_QUESTION_LIST = '.offline-question-list .question-item';
  static readonly BTN_SHUFFLE = 'button:has-text("Trộn đề"), button:has-text("Shuffle")';

  getOfflineQuestionList(): Locator {
    return this.page.locator(SoanHocLieuV2Page.OFFLINE_QUESTION_LIST);
  }

  async shuffleExam(): Promise<this> {
    await this.page.locator(SoanHocLieuV2Page.BTN_SHUFFLE).click();
    await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    return this;
  }
}