// modules/quan-ly-hoc-lieu/pages/HocLieuCuaToiPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';

/**
 * Danh sách các loại học liệu có thể tạo từ dropdown "Tạo mới học liệu".
 * data-type khớp với thuộc tính data-type trên thẻ <a class="select-cate-type">
 */
export enum CoursewareType {
  LUYEN_TAP_TRAC_NGHIEM = 3,
  DE_THI_THONG_MINH = 14,
  DE_THI_THPT = 21,
  DANG_BAI_KY_NANG_NHCH = 18,
  LY_THUYET_TUONG_TAC = 2,
  VIDEO_YOUTUBE_DIEM_DUNG = 5,
  HOI_VA_DAP = 12,
  DE_THI_TU_LUAN = 6,
  LIEN_KET = 9,
  DE_THI_TN_TU_FILE = 10,
  DE_THI_TN_TU_MA_TRAN = 13,
  DE_THI_TRON_OFFLINE = 100,
  DE_LUYEN_TAP_TN_TU_MA_TRAN = 20,
  TAI_LIEU = 23,
  MO_PHONG_THI_NGHIEM_AO = 24,
  // Game hóa không có data-type tĩnh, xử lý riêng bằng GAME_HOA_ITEM selector
}

/** Mức độ nhận thức của câu hỏi trong modal "Tạo câu hỏi" (Ảnh 2) */
export type QuestionLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export interface AddQuestionOptions {
  title: string;
  content: string;
  level?: QuestionLevel;
}

/** Link Youtube mẫu dùng cho TC-MYLIB-07 (Tạo Video Youtube có điểm dừng) */
export const SAMPLE_YOUTUBE_URL =
  'https://www.youtube.com/watch?v=eHwesHMnr2o&list=RDeHwesHMnr2o&start_radio=1';

export interface CreateCoursewareOptions {
  title: string;
  description?: string;
  keyword?: string;
  seoTitle?: string;
  seoDescription?: string;
  // 'Tổng hợp lớp' là mặc định sẵn có, chỉ truyền nếu cần chọn lớp cụ thể
  classLevel?: string;
  subject?: string;
  bookSet?: string;
  replacementCoursewareId?: string;
}

export class HocLieuCuaToiPage extends BasePage {
  static readonly URL = '/hoc-lieu-cua-toi';

  // ---- Sidebar navigation ----
  static readonly MENU_HOC_LIEU = '[data-menu-key="hoc-lieu"]';
  static readonly MENU_HOC_LIEU_CUA_TOI = '#menu-hoc-lieu-cua-toi';

  // ---- Nút mở dropdown tạo mới ----
  static readonly TAO_MOI_BTN = 'button:has-text("Tạo mới học liệu")';
  static readonly DROPDOWN_MENU = '.dropdown-menu.show';
  static readonly GAME_HOA_ITEM = '#demoViewCategoryBuilder .dropdown-item';

  // ---- Modal tạo học liệu (theo ảnh thực tế loại TN) ----
  static readonly MODAL = 'div.modal.show, div[role="dialog"]:visible';
  static readonly MODAL_TITLE = '.modal .modal-header, div[role="dialog"] >> text=Luyện tập trắc nghiệm';
  static readonly MODAL_CLOSE_BTN = '.modal button.close, div[role="dialog"] button:has-text("×")';

  static readonly CHON_KHUNG_CHUONG_TRINH_BTN = 'button:has-text("Chọn khung chương trình")';

  static readonly TITLE_INPUT = 'input[placeholder="Nhập tiêu đề..."]';
  static readonly DESCRIPTION_INPUT = 'textarea[placeholder="Mô tả..."]';
  static readonly KEYWORD_INPUT = 'input[placeholder="Từ khóa..."]';
  static readonly SEO_TITLE_INPUT = 'input[placeholder="Nhập tiêu đề SEO..."]';
  static readonly SEO_DESCRIPTION_INPUT = 'textarea[placeholder="Nhập mô tả SEO..."]';

  static readonly CLASS_SELECT = 'text=Chọn lớp: >> xpath=following::div[contains(@class,"select")][1]';
  static readonly SUBJECT_SELECT = 'text=Chọn môn: >> xpath=following::div[contains(@class,"select")][1]';
  static readonly BOOKSET_SELECT = 'text=Chọn bộ sách: >> xpath=following::div[contains(@class,"select")][1]';

  static readonly REPLACEMENT_ID_INPUT = 'input[placeholder="Nhập ID học liệu thay thế..."]';

  static readonly SUBMIT_BTN = 'button:has-text("Tạo")';
  static readonly CANCEL_BTN = 'button:has-text("Hủy")';

  // ---- Bảng danh sách học liệu ----
  static readonly TABLE_ROWS = 'table.table tbody tr.courseware-item';

  // ==================================================================
  // Trang "Tạo nội dung học liệu" sau khi bấm Tạo (Ảnh 1) - loại trắc nghiệm/câu hỏi
  // ==================================================================
  static readonly CONTENT_SECTION_HEADER = 'text=Tạo nội dung học liệu';
  static readonly TAB_CAU_HOI_CUA_BAN = 'button:has-text("Câu hỏi của bạn"), a:has-text("Câu hỏi của bạn")';
  static readonly TAB_CAU_HOI_CUA_OLM = 'button:has-text("Câu hỏi của OLM"), a:has-text("Câu hỏi của OLM")';
  static readonly TAB_TIM_KIEM_CAU_HOI = 'button:has-text("Tìm kiếm câu hỏi"), a:has-text("Tìm kiếm câu hỏi")';
  static readonly TAO_CAU_HOI_BTN = 'button:has-text("Tạo câu hỏi")';
  static readonly XOA_TAT_CA_CAU_HOI_BTN = 'button:has-text("Xóa tất cả câu hỏi trong bài học này")';
  static readonly IMPORT_TU_FILE_WORD_BTN = 'button:has-text("Import từ file word")';
  static readonly TAI_FILE_WORD_BTN = 'button:has-text("Tải file Word")';
  static readonly DANH_SACH_CAU_HOI_CUA_BAN = 'text=Câu hỏi của bạn >> xpath=following::*[1]';
  static readonly DANH_SACH_CAU_HOI_DA_CHON = 'text=Câu hỏi được chọn (trắc nghiệm) >> xpath=following::*[1]';
  static readonly CHUA_CO_CAU_HOI_NAO = 'text=Chưa có câu hỏi nào';

  // ---- Modal "Tạo câu hỏi" (Ảnh 2) ----
  static readonly QUESTION_MODAL = 'div.modal.show:has-text("Tạo câu hỏi"), div[role="dialog"]:has-text("Tạo câu hỏi")';
  static readonly QUESTION_TITLE_INPUT = 'input[placeholder="Nhập tiêu đề câu hỏi"]';
  static readonly QUESTION_CONTENT_TEXTAREA = 'textarea[placeholder="Nhập nội dung câu hỏi"], div[contenteditable="true"][placeholder="Nhập nội dung câu hỏi"]';
  static readonly QUESTION_LEVEL_TAB = (level: QuestionLevel) => `button:has-text("${level}")`;
  static readonly QUESTION_XEM_HUONG_DAN_BTN = 'text=Xem hướng dẫn';
  static readonly QUESTION_XEM_THU_BTN = 'button:has-text("Xem thử")';
  static readonly QUESTION_KIEM_TRA_TRUNG_BTN = 'button:has-text("Kiểm tra trùng")';
  static readonly QUESTION_LUU_CAU_HOI_BTN = 'button:has-text("Lưu câu hỏi")';
  static readonly QUESTION_CLOSE_BTN = 'div.modal.show button.close, div[role="dialog"] button:has-text("×")';

  // ==================================================================
  // Trang học liệu Video Youtube có điểm dừng (Ảnh 3)
  // ==================================================================
  static readonly VIDEO_LINK_INPUT = 'input[placeholder="Đường link dẫn tới video trên youtube"]';
  static readonly THEM_DIEM_DUNG_BTN = 'button:has-text("Thêm điểm dừng")';
  static readonly TOM_TAT_BAI_GIANG_TOGGLE = 'text=Tóm tắt bài giảng >> xpath=preceding::input[1]';
  static readonly TAO_TRANSCRIPT_TOGGLE = 'text=Tạo transcript video >> xpath=preceding::input[1]';
  static readonly BAI_GIANG_DINH_KEM_INPUT = 'input[type="file"]';

  // ==================================================================
  // Trang tải nội dung từ file Word/PDF (đề thi, tài liệu...) (Ảnh 4)
  // ==================================================================
  static readonly TAB_DE_BAI = 'button:has-text("Đề bài"), a:has-text("Đề bài")';
  static readonly TAB_HUONG_DAN_GIAI = 'button:has-text("Hướng dẫn giải"), a:has-text("Hướng dẫn giải")';
  static readonly FILE_UPLOAD_INPUT = 'input[type="file"]';

  // ---- Nút chung cho các trang nội dung học liệu ----
  static readonly LUU_CAP_NHAT_BTN = 'button:has-text("Lưu cập nhật")';
  static readonly XEM_NOI_DUNG_BTN = 'button:has-text("Xem nội dung")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToHocLieuCuaToi(): Promise<this> {
    const isOnPage = this.getCurrentUrl().includes('hoc-lieu-cua-toi');
    if (!isOnPage) {
      await this.page.locator(HocLieuCuaToiPage.MENU_HOC_LIEU).click({ timeout: 5000 }).catch(() => {});
      await this.page.locator(HocLieuCuaToiPage.MENU_HOC_LIEU_CUA_TOI).click();
      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForURL(/hoc-lieu-cua-toi/, { timeout: 10000 }).catch(() => {});
    }
    return this;
  }

  /** Mở dropdown "Tạo mới học liệu" và trả về locator dropdown đang mở */
  async openCreateDropdown(): Promise<Locator> {
    await this.page.locator(HocLieuCuaToiPage.TAO_MOI_BTN).click();
    const dropdown = this.page.locator(HocLieuCuaToiPage.DROPDOWN_MENU);
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    return dropdown;
  }

  /** Trả về selector cho 1 item trong dropdown theo data-type */
  private dropdownItemSelector(type: CoursewareType): string {
    return `a.select-cate-type[data-type="${type}"]`;
  }

  /**
   * Chọn 1 loại học liệu từ dropdown đã mở sẵn (dùng cho CoursewareType có data-type cố định)
   */
  async selectCoursewareType(type: CoursewareType): Promise<this> {
    const item = this.page.locator(this.dropdownItemSelector(type));
    await expect(item, `Không tìm thấy mục dropdown cho data-type=${type}`).toBeVisible({ timeout: 5000 });
    await item.click();
    return this;
  }

  /**
   * Chọn mục "Game hóa" - phần tử render động, không có data-type tĩnh.
   * Cần chờ #demoViewCategoryBuilder render xong trước khi click để tránh race condition.
   */
  async selectGameHoa(): Promise<this> {
    const gameHoaItem = this.page.locator(HocLieuCuaToiPage.GAME_HOA_ITEM, { hasText: 'Game hóa' });
    await gameHoaItem.waitFor({ state: 'visible', timeout: 8000 });
    await gameHoaItem.click();
    return this;
  }

  /** Mở dropdown rồi chọn loại học liệu tương ứng, chờ modal xuất hiện */
  async openCreateModal(type: CoursewareType | 'game-hoa'): Promise<this> {
    await this.openCreateDropdown();
    if (type === 'game-hoa') {
      await this.selectGameHoa();
    } else {
      await this.selectCoursewareType(type);
    }
    await this.page.locator(HocLieuCuaToiPage.MODAL).waitFor({ state: 'visible', timeout: 10000 });
    return this;
  }

  /** Đóng modal bằng nút X, không lưu */
  async closeModal(): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.MODAL_CLOSE_BTN).click();
    await this.page.locator(HocLieuCuaToiPage.MODAL).waitFor({ state: 'hidden', timeout: 5000 });
    return this;
  }

  /** Hủy tạo bằng nút "Hủy" trong modal */
  async cancelModal(): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.CANCEL_BTN).click();
    await this.page.locator(HocLieuCuaToiPage.MODAL).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    return this;
  }

  /** Điền các trường trong modal theo options, KHÔNG submit */
  async fillModal(options: CreateCoursewareOptions): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.TITLE_INPUT).fill(options.title);

    if (options.description) {
      await this.page.locator(HocLieuCuaToiPage.DESCRIPTION_INPUT).fill(options.description);
    }
    if (options.keyword) {
      await this.page.locator(HocLieuCuaToiPage.KEYWORD_INPUT).fill(options.keyword);
    }
    if (options.seoTitle) {
      await this.page.locator(HocLieuCuaToiPage.SEO_TITLE_INPUT).fill(options.seoTitle);
    }
    if (options.seoDescription) {
      await this.page.locator(HocLieuCuaToiPage.SEO_DESCRIPTION_INPUT).fill(options.seoDescription);
    }
    if (options.classLevel) {
      await this.page.locator(HocLieuCuaToiPage.CLASS_SELECT).click();
      await this.page.locator(`text="${options.classLevel}"`).click();
    }
    if (options.subject) {
      await this.page.locator(HocLieuCuaToiPage.SUBJECT_SELECT).click();
      await this.page.locator(`text="${options.subject}"`).click();
    }
    if (options.bookSet) {
      await this.page.locator(HocLieuCuaToiPage.BOOKSET_SELECT).click();
      await this.page.locator(`text="${options.bookSet}"`).click();
    }
    if (options.replacementCoursewareId) {
      await this.page.locator(HocLieuCuaToiPage.REPLACEMENT_ID_INPUT).fill(options.replacementCoursewareId);
    }
    return this;
  }

  /** Bấm nút "Tạo" và chờ hệ thống xử lý xong */
  async submitModal(): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.SUBMIT_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return this;
  }

  /**
   * Luồng đầy đủ: mở dropdown → chọn loại → điền form → submit.
   * Trả về title thực tế đã dùng để tạo, phục vụ assertion trong test.
   */
  async createCourseware(
    type: CoursewareType | 'game-hoa',
    options?: Partial<CreateCoursewareOptions>
  ): Promise<string> {
    const finalOptions: CreateCoursewareOptions = {
      title: options?.title ?? `Test_${CoursewareType[type as CoursewareType] ?? 'GameHoa'}_${Date.now()}`,
      description: options?.description ?? 'Test từ spec V2',
      ...options,
    };

    await this.navigateToHocLieuCuaToi();
    await this.openCreateModal(type);
    await this.fillModal(finalOptions);
    await this.submitModal();
    return finalOptions.title;
  }

  /** Trả về danh sách text các nhãn hiển thị trong dropdown hiện đang mở, dùng để assert đủ 15/16 mục */
  async getDropdownLabels(): Promise<string[]> {
    const items = this.page.locator(`${HocLieuCuaToiPage.DROPDOWN_MENU} a.select-cate-type .col-11`);
    return items.allInnerTexts();
  }

  getTableRows(): Locator {
    return this.page.locator(HocLieuCuaToiPage.TABLE_ROWS);
  }

  getRowByTitle(title: string): Locator {
    return this.getTableRows().filter({ hasText: title });
  }

  // ==================================================================
  // ---- Luồng thêm nội dung sau khi tạo học liệu ----
  // Dùng cho các loại "học liệu tự do"/trắc nghiệm (Ảnh 1 & 2): sau khi createCourseware()
  // xong, trang chuyển sang màn quản lý học liệu, cần bấm "Tạo câu hỏi" để thêm câu hỏi.
  // ==================================================================

  /** Mở modal "Tạo câu hỏi" từ trang nội dung học liệu (tab "Câu hỏi của bạn") */
  async openTaoCauHoiModal(): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.TAO_CAU_HOI_BTN).click();
    await this.page.locator(HocLieuCuaToiPage.QUESTION_TITLE_INPUT).waitFor({ state: 'visible', timeout: 8000 });
    return this;
  }

  /** Điền tiêu đề, mức độ, nội dung câu hỏi rồi bấm "Lưu câu hỏi" (KHÔNG tự mở modal trước) */
  async fillAndSaveQuestion(options: AddQuestionOptions): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.QUESTION_TITLE_INPUT).fill(options.title);
    if (options.level) {
      await this.page.locator(HocLieuCuaToiPage.QUESTION_LEVEL_TAB(options.level)).click();
    }
    await this.page.locator(HocLieuCuaToiPage.QUESTION_CONTENT_TEXTAREA).fill(options.content);
    await this.page.locator(HocLieuCuaToiPage.QUESTION_LUU_CAU_HOI_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  /**
   * Luồng đầy đủ: mở modal "Tạo câu hỏi" → điền → lưu.
   * Dùng ngay sau createCourseware() cho các loại học liệu dạng trắc nghiệm/câu hỏi
   * (Luyện tập trắc nghiệm, Đề thi thông minh, Đề thi THPT, Hỏi và đáp,
   * Đề luyện tập TN từ ma trận...).
   */
  async addQuestion(options: AddQuestionOptions): Promise<this> {
    await this.openTaoCauHoiModal();
    await this.fillAndSaveQuestion(options);
    return this;
  }

  /**
   * Thêm link video Youtube cho học liệu loại "Video Youtube có điểm dừng" (Ảnh 3).
   * Dùng ngay sau createCourseware(CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG, ...).
   */
  async addYoutubeVideoLink(url: string): Promise<this> {
    await this.page.locator(HocLieuCuaToiPage.VIDEO_LINK_INPUT).fill(url);
    await this.page.locator(HocLieuCuaToiPage.LUU_CAP_NHAT_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  /**
   * Upload 1 file đề thi (Word/PDF) cho các loại học liệu tạo từ file (Ảnh 4),
   * ví dụ CoursewareType.DE_THI_TN_TU_FILE. Tham số tab cho phép chọn upload
   * ở phần "Đề bài" (mặc định) hoặc "Hướng dẫn giải".
   * LƯU Ý: filePath phải là file thật (Word/PDF) có sẵn trong project, ví dụ
   * đặt trong thư mục fixtures của module rồi truyền đường dẫn tuyệt đối vào đây.
   */
  async uploadExamFile(filePath: string, tab: 'de-bai' | 'huong-dan-giai' = 'de-bai'): Promise<this> {
    if (tab === 'huong-dan-giai') {
      await this.page.locator(HocLieuCuaToiPage.TAB_HUONG_DAN_GIAI).click();
    } else {
      await this.page.locator(HocLieuCuaToiPage.TAB_DE_BAI).click();
    }
    await this.page.locator(HocLieuCuaToiPage.FILE_UPLOAD_INPUT).setInputFiles(filePath);
    await this.page.locator(HocLieuCuaToiPage.LUU_CAP_NHAT_BTN).click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }
}