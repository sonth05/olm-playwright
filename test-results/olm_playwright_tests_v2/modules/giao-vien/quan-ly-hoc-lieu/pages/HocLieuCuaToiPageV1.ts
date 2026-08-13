// modules/giao-vien/hoc-lieu-v1/pages/HocLieuCuaToiPage.ts
import { Page, Locator, expect, Dialog } from '@playwright/test';
// FIX: đổi từ alias '@core/...' (không nhất quán, có thể không resolve được
// nếu tsconfig chưa cấu hình path alias này) sang relative path — khớp quy
// ước import '../../../../core/shared-pages/...' đang dùng xuyên suốt các
// page object khác trong module (Hoclieucuatoiv2page.ts, Basehoclieuv2page.ts,
// Createhoclieumenu.ts, Hoclieudaxoav2page.ts, HoclieuduocchiaseV2page.ts).
import { BasePage } from '../../../../core/shared-pages/BasePage';
import { waitForWithPopupWatchdog, hasBlockingPopup } from '../../../../core/shared-pages/dismissPopups';

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

/**
 * Danh sách loại học liệu trong <select id="type"> của FORM BỘ LỌC (khác với
 * dropdown "Tạo mới học liệu" ở CoursewareType phía trên) — đối chiếu trực
 * tiếp từ HTML thật của https://olm.vn/hoc-lieu-cua-toi.
 *
 * Khác biệt so với CoursewareType (dropdown Tạo mới):
 * - Select lọc CÓ THÊM 4 loại không tạo mới được ở dropdown Tạo mới:
 *   Đề thi TN từ file ảnh (11), Đề tiếng anh (15), Kỹ năng (16),
 *   Bài giảng scorm (17), và "Game hóa" ở đây có value TĨNH = 19 (khác dropdown
 *   Tạo mới — Game hóa render động, không có data-type cố định).
 * - Select lọc KHÔNG CÓ option "Mô phỏng, thí nghiệm ảo" (24) dù dropdown Tạo
 *   mới có.
 *
 * LƯU Ý QUAN TRỌNG: enum này TRÙNG HOÀN TOÀN (đã đối chiếu từng giá trị) với
 * `FilterCoursewareType` đã định nghĩa sẵn trong HocLieuDuocChiaSeCaNhanPage.ts.
 * Khai báo lại ở đây (thay vì import từ đó) để tránh circular import — file
 * đó đang `import { CoursewareType } from './HocLieuCuaToiPage'`, nếu file
 * này import ngược lại `FilterCoursewareType` từ đó sẽ tạo vòng lặp import
 * giữa 2 module. Cân nhắc gộp 2 enum này về 1 nơi dùng chung (VD
 * core/shared-pages hoặc 1 file types riêng) ở lần refactor sau — hiện KHÔNG
 * đổi HocLieuDuocChiaSeCaNhanPage.ts/HocLieuDaXoaPage.ts để tránh đụng nhiều
 * file ngoài phạm vi yêu cầu.
 */
export enum FilterCoursewareType {
  LY_THUYET_TUONG_TAC = 2,
  LUYEN_TAP_TRAC_NGHIEM = 3,
  VIDEO_YOUTUBE_DIEM_DUNG = 5,
  DE_THI_TU_LUAN = 6,
  LIEN_KET = 9,
  DE_THI_TN_TU_FILE = 10,
  DE_THI_TN_TU_FILE_ANH = 11,
  HOI_VA_DAP = 12,
  DE_THI_TN_TU_MA_TRAN = 13,
  DE_THI_THONG_MINH = 14,
  DE_TIENG_ANH = 15,
  KY_NANG = 16,
  BAI_GIANG_SCORM = 17,
  DANG_BAI_KY_NANG_NHCH = 18,
  GAME_HOA = 19,
  DE_LUYEN_TAP_TN_TU_MA_TRAN = 20,
  DE_THI_THPT = 21,
  DE_THI_TRON_OFFLINE = 100,
  TAI_LIEU = 23,
}

/** Giá trị <select id="source_cate"> — lọc học liệu tự tạo hay sao chép từ khung */
export enum SourceCate {
  HOC_LIEU_TU_TAO = '1',
  HOC_LIEU_SAO_CHEP_TU_KHUNG = '2',
}

/** Options cho form bộ lọc phía trên bảng danh sách */
export interface FilterOptions {
  /** Tự tạo/Sao chép khung — bỏ trống = "Tất cả" */
  sourceCate?: SourceCate;
  /** Loại học liệu — bỏ trống = "Chọn Loại học liệu" */
  type?: FilterCoursewareType;
  /** Môn học — truyền đúng label hiển thị trong option, VD: "Toán" */
  subject?: string;
  /** Lớp — truyền đúng label hiển thị trong option, VD: "Lớp 9" */
  grade?: string;
  /** Tên học liệu — khớp input#title trong form lọc */
  title?: string;
  /** Checkbox "Học liệu tự do" */
  freeCateOnly?: boolean;
  /** Checkbox "Học liệu ẩn" */
  hiddenCateOnly?: boolean;
}

/** 1 dòng dữ liệu trong bảng "Học liệu của tôi" */
export interface CoursewareRow {
  id: string;
  stt: string;
  title: string;
  detailUrl: string;
  createdDate: string;
  category: string;
  course: string;
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

  // ---- Header (xác nhận từ HTML thật) ----
  static readonly PAGE_TITLE = 'h3:has-text("Học liệu của tôi")';
  static readonly GUIDE_LINK = 'a.olm-text-link:has-text("Hướng dẫn tạo")';
  // ĐÃ BỎ TRY_NEW_VERSION_BTN + switchToNewVersion() (2026-08-07, theo yêu
  // cầu): trang V2 giờ là mặc định, luôn vào thẳng qua query param ?v=v2
  // (xem HocLieuCuaToiV2Page.goto()/BaseHocLieuV2Page.gotoDirectly()) — nút
  // "⚡ Thử phiên bản mới" trên giao diện V1 không còn là luồng test nào
  // dùng tới, và cũng không còn nút "Quay lại giao diện cũ" ở phía V2 để
  // quay ngược lại V1 nữa. Nếu OLM sau này thêm lại cơ chế chuyển đổi UI,
  // tạo lại selector kèm DOM thật lúc đó.

  // ---- Sidebar navigation (đã xác nhận từ HTML sidebar thật) ----
  static readonly MENU_HOC_LIEU = 'button[data-menu-key="hoc-lieu"]';
  // FIX: id trùng lặp trên trang thật (xem lý giải trong BoSuuTapHocLieuPage.ts
  // - id="menu-bo-suu-tap-hoc-lieu" cũng dính lỗi tương tự, cùng pattern sidebar).
  // Thu hẹp bằng class '.menu-link' để tránh "strict mode violation: resolved to 2 elements".
  static readonly MENU_HOC_LIEU_CUA_TOI = '#menu-hoc-lieu-cua-toi.menu-link';

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

  // Đã verify bằng HTML thật (2026-07-26): "Chọn lớp"/"Chọn môn"/"Chọn bộ sách"
  // là thẻ <select> HTML chuẩn (class grade_list/subject_list/book_list),
  // KHÔNG phải dropdown custom — dùng selectOption(), không click+chọn text.
  static readonly CLASS_SELECT = 'select.grade_list';
  static readonly SUBJECT_SELECT = 'select.subject_list';
  static readonly BOOKSET_SELECT = 'select.book_list';

  static readonly REPLACEMENT_ID_INPUT = 'input[placeholder="Nhập ID học liệu thay thế..."]';

  // Scope theo class riêng (.btn-submit/.btn-cancel) thay vì text "Tạo"/"Hủy":
  // nút trigger "Tạo mới học liệu" đứng ngoài modal cũng chứa chữ "Tạo" như
  // substring, dùng :has-text("Tạo") có nguy cơ strict-mode match nhầm 2 nút.
  static readonly SUBMIT_BTN = 'button.btn-submit';
  static readonly CANCEL_BTN = 'button.btn-cancel';

  // ==================================================================
  // ---- Form bộ lọc (xác nhận từ HTML thật https://olm.vn/hoc-lieu-cua-toi) ----
  // ==================================================================
  static readonly FILTER_FORM = 'form[action="https://olm.vn/hoc-lieu-cua-toi"]';
  static readonly FILTER_SOURCE_CATE_SELECT = '#source_cate';
  static readonly FILTER_TYPE_SELECT = '#type';
  static readonly FILTER_SUBJECT_SELECT = '#id_subject';
  static readonly FILTER_GRADE_SELECT = '#grade';
  // Scope trong form lọc — input filter và input#title trong modal "Tạo học
  // liệu" có thể trùng id trên DOM thật (đã gặp cùng lỗi ở HocLieuDaXoaPage/
  // HocLieuDuocChiaSeCaNhanPage) → thu hẹp theo form để tránh strict-mode violation.
  static readonly FILTER_TITLE_INPUT = `${HocLieuCuaToiPage.FILTER_FORM} #title`;
  static readonly FILTER_FREE_CATE_CHECKBOX = '#free_cate';
  static readonly FILTER_HIDDEN_CATE_CHECKBOX = '#hidden_cate';
  static readonly FILTER_SUBMIT_BTN = `${HocLieuCuaToiPage.FILTER_FORM} button[type="submit"]`;

  // ==================================================================
  // ---- Bảng danh sách học liệu (xác nhận từ HTML thật, 9 dòng dữ liệu) ----
  // ==================================================================
  static readonly TABLE = '.card-v2 table.table';
  static readonly TABLE_ROWS = `${HocLieuCuaToiPage.TABLE} tbody tr.courseware-item`;
  static readonly ROW_BY_ID = (id: string) => `tr.courseware-item[data-id="${id}"]`;
  // <th> header ghi "Tên học liệu" nhưng <td> thật dùng data-label="Tên bài"
  // — giữ nguyên khác biệt này (cùng pattern đã ghi nhận ở HocLieuDaXoaPage).
  static readonly ROW_TITLE_LINK = 'td[data-label="Tên bài"] a.olm-text-link';
  static readonly ROW_CREATED_DATE = 'td[data-label="Ngày tạo"]';
  static readonly ROW_CATEGORY = 'td[data-label="Thể loại"]';
  static readonly ROW_COURSE = 'td[data-label="Khóa học"]';

  // ---- Dropdown "Hành động" (nút "Chọn") trên mỗi dòng ----
  static readonly ROW_ACTIONS_BTN = 'td[data-label="Hành động"] button.dropdown-toggle';
  static readonly ROW_ACTIONS_MENU = 'td[data-label="Hành động"] .dropdown-menu';
  static readonly ROW_EDIT_LINK = 'a.dropdown-item:has-text("Sửa đổi")';
  static readonly ROW_DELETE_LINK = 'a.btn-delete-courseware';
  static readonly ROW_CHAM_BAI_LINK = 'a.dropdown-item:has-text("Chấm bài")';
  static readonly ROW_DUPLICATE_LINK = 'a.duplicate-cate';
  static readonly ROW_MOVE_LINK = 'a.move-cate';
  // "Chia sẻ học liệu" là <div class="share-cate">, KHÔNG phải <a>.
  static readonly ROW_SHARE_ITEM = '.share-cate';

  // ---- Modal xác nhận xóa (phỏng đoán theo pattern chung của dự án —
  // HTML gửi không kèm modal xác nhận, xem ghi chú trong deleteCourseware()) ----
  static readonly CONFIRM_DIALOG = 'div.modal.show, div[role="dialog"]:visible';
  static readonly CONFIRM_DELETE_BTN =
    'div.modal.show button:has-text("Xóa"), div[role="dialog"] button:has-text("Xóa"), div.modal.show button:has-text("Đồng ý")';
  static readonly CONFIRM_CANCEL_BTN =
    'div.modal.show button:has-text("Hủy"), div[role="dialog"] button:has-text("Hủy")';

  // ---- Phân trang (pattern giống hệt HocLieuDaXoaPage — HTML mẫu gửi chỉ
  // có 9 dòng nên nav phân trang KHÔNG render trong DOM, CẦN xác minh lại
  // selector khi có HTML thật lúc >10 dòng) ----
  static readonly PAGINATION = 'nav ul.pagination';
  static readonly PAGE_LINK = (page: number) => `nav ul.pagination a.page-link[data-page="${page}"]`;
  static readonly ACTIVE_PAGE_ITEM = 'nav ul.pagination li.page-item.active a.page-link';

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
      // Page mới của fixture bắt đầu ở about:blank — phải đảm bảo sidebar
      // đã render trước khi thao tác menu.
      await this.ensurePageLoaded();

      // FIX (2026-07-28): modal "#modal-form-active-mail" (class="modal show")
      // đã ghi nhận xuất hiện NGAY sau khi vào trang, TRƯỚC khi kịp thao tác
      // sidebar — ensurePageLoaded() ở trên chỉ gọi navigateTo() (và do đó
      // dismissPopups()) khi page đang ở about:blank; nếu page đã có sẵn nội
      // dung (không phải about:blank) thì dismissPopups() KHÔNG chạy, để
      // click bên dưới bị modal này chặn ("intercepts pointer events").
      // Gọi tường minh ở đây để không phụ thuộc trạng thái page trước đó.
      await this.dismissPopups();

      // FIX (2026-07-31): popup "Xác thực" (xác thực Email/SĐT) ghi nhận
      // xuất hiện CÓ ĐỘ TRỄ sau khi trang đã load xong — dismissPopups() gọi
      // ngay phía trên chạy quá sớm, popup lúc đó chưa kịp render nên không
      // đóng được gì; popup bật lên đúng lúc code bên dưới đang thao tác
      // sidebar, chặn pointer events -> parentToggle.getAttribute() timeout
      // (không phải do getAttribute() cần tương tác được, mà do trang bị
      // popup che khiến các bước ensurePageLoaded/dismiss trước đó "settle"
      // sai thời điểm). Đợi ngắn rồi dismiss lại lần 2 ngay trước khi chạm
      // vào sidebar để bắt đúng popup xuất hiện trễ này.
      await this.page.waitForTimeout(2_000);
      await this.dismissPopups();

      // Nhóm cha "Học liệu cá nhân" là toggle (aria-expanded) — chỉ bấm mở
      // nếu đang đóng, tránh bấm nhầm làm nó ĐÓNG lại (cùng bug đã sửa ở
      // HocLieuDuocChiaSeCaNhanPage / BoSuuTapHocLieuPage).
      const parentToggle = this.page.locator(HocLieuCuaToiPage.MENU_HOC_LIEU);
      await this.scrollSidebarUntilVisible(parentToggle);
      const isExpanded = (await parentToggle.getAttribute('aria-expanded')) === 'true';
      if (!isExpanded) {
        await this.jsClick(parentToggle);
      }

      const childLink = this.page.locator(HocLieuCuaToiPage.MENU_HOC_LIEU_CUA_TOI);
      await this.scrollSidebarUntilVisible(childLink);
      await childLink.waitFor({ state: 'visible', timeout: 10_000 });
      await this.jsClick(childLink);

      await this.page.waitForLoadState('domcontentloaded');
      await this.page.waitForURL(/hoc-lieu-cua-toi/, { timeout: 10000 }).catch(() => {});

      // FIX (2026-07-28): ĐÃ BỎ việc tự set lại zoom 75% ở đây — zoom mặc
      // định giờ là 100% (xem BasePage.navigateTo()), nên không cần re-apply
      // sau full navigation nữa. Nếu có nhu cầu zoom thật sự (VD: chụp
      // screenshot form dài), set env PAGE_ZOOM rồi gọi this.setZoom() ở
      // đúng bước cần, không áp mặc định cho mọi test.
    }
    return this;
  }

  // ĐÃ BỎ switchToNewVersion() (2026-08-07, theo yêu cầu) — không còn luồng
  // test nào cần chuyển đổi qua lại giữa 2 giao diện V1/V2 nữa.

  /** Mở dropdown "Tạo mới học liệu" và trả về locator dropdown đang mở */
  async openCreateDropdown(): Promise<Locator> {
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.TAO_MOI_BTN));
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
    await this.jsClick(item);
    return this;
  }

  /**
   * Chọn mục "Game hóa" - phần tử render động, không có data-type tĩnh.
   * Cần chờ #demoViewCategoryBuilder render xong trước khi click để tránh race condition.
   */
  async selectGameHoa(): Promise<this> {
    const gameHoaItem = this.page.locator(HocLieuCuaToiPage.GAME_HOA_ITEM, { hasText: 'Game hóa' });
    await gameHoaItem.waitFor({ state: 'visible', timeout: 8000 });
    await this.jsClick(gameHoaItem);
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
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.MODAL_CLOSE_BTN));
    await this.page.locator(HocLieuCuaToiPage.MODAL).waitFor({ state: 'hidden', timeout: 5000 });
    return this;
  }

  /** Hủy tạo bằng nút "Hủy" trong modal */
  async cancelModal(): Promise<this> {
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.MODAL).locator(HocLieuCuaToiPage.CANCEL_BTN));
    await this.page.locator(HocLieuCuaToiPage.MODAL).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    return this;
  }

  /**
   * Chọn <option> theo label, nhưng CHỜ chính option đó thực sự tồn tại
   * trong DOM trước khi gọi selectOption().
   *
   * LÝ DO CẦN THIẾT (2026-07-27): subject_list và book_list là dropdown
   * CASCADING — sau khi chọn "Chọn lớp", trang gọi AJAX nạp lại danh sách
   * môn/bộ sách phù hợp với lớp vừa chọn. Trong lúc đó, <select> vẫn
   * "visible và enabled" (đã render sẵn từ đầu) nhưng option cần chọn (VD
   * "Kỹ thuật") có thể CHƯA có trong DOM. selectOption({ label }) mặc định
   * chỉ retry vì lý do actionability của <select> (visible/enabled), nó
   * KHÔNG biết chờ đúng option xuất hiện — nếu AJAX chưa kịp xong, Playwright
   * cứ retry vô ích ("did not find some options") tới hết timeout mặc định
   * rồi làm cả test time out, dù selector hoàn toàn đúng.
   *
   * Dùng RegExp match nguyên văn (^...$, sau khi trim khoảng trắng dư thừa
   * quanh option text) để tránh chọn nhầm option khác chứa label như một
   * substring.
   */
  private async selectOptionByLabelWhenReady(
    select: Locator,
    label: string,
    timeoutMs = 15_000
  ): Promise<void> {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactOption = select.locator('option').filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) });
    await exactOption.first().waitFor({ state: 'attached', timeout: timeoutMs });
    await select.selectOption({ label });
  }

  /** Điền các trường trong modal theo options, KHÔNG submit */
  async fillModal(options: CreateCoursewareOptions): Promise<this> {
    // FIX (2026-07-27): select.grade_list cũng khớp với <select id="grade"
    // class="form-control mw-120-p grade_list"> của FORM LỌC nằm ngoài modal
    // (cùng trang) → locator(this.page, CLASS_SELECT) resolve ra 2 phần tử và
    // ném "strict mode violation", khiến fillModal dừng lại giữa chừng và
    // các bước sau (chọn môn, chọn bộ sách, ấn Tạo) không bao giờ chạy.
    // Scope MỌI thao tác trong modal vào bên trong modalLocator để tránh
    // đụng độ với các phần tử cùng class/placeholder ở ngoài modal.
    const modal = this.page.locator(HocLieuCuaToiPage.MODAL);

    await this.jsClearAndType(modal.locator(HocLieuCuaToiPage.TITLE_INPUT), options.title);

    // CHÚ Ý (2026-07-26): HTML thật xác nhận 2 field này nằm trong
    // <div class="form-group describe d-none"> / <div class="form-group
    // key-word d-none"> — mặc định ẨN (display:none) ít nhất với loại
    // "Luyện tập trắc nghiệm". .fill() sẽ throw "not visible" nếu gọi cho
    // loại nào không hiện field này. Chỉ truyền description/keyword khi đã
    // xác nhận riêng loại đó thật sự hiển thị 2 field này trên UI.
    if (options.description) {
      await this.jsClearAndType(modal.locator(HocLieuCuaToiPage.DESCRIPTION_INPUT), options.description);
    }
    if (options.keyword) {
      await this.jsClearAndType(modal.locator(HocLieuCuaToiPage.KEYWORD_INPUT), options.keyword);
    }
    if (options.seoTitle) {
      await this.jsClearAndType(modal.locator(HocLieuCuaToiPage.SEO_TITLE_INPUT), options.seoTitle);
    }
    if (options.seoDescription) {
      await this.jsClearAndType(modal.locator(HocLieuCuaToiPage.SEO_DESCRIPTION_INPUT), options.seoDescription);
    }
    if (options.classLevel) {
      // Chọn lớp KHÔNG cascading (option luôn có sẵn tĩnh) → selectOption
      // thẳng, không cần chờ thêm.
      await modal.locator(HocLieuCuaToiPage.CLASS_SELECT).selectOption({ label: options.classLevel });
    }
    if (options.subject) {
      // FIX (2026-07-27): subject_list bị CASCADING theo classLevel vừa
      // chọn ở trên — sau khi chọn lớp, trang AJAX nạp lại danh sách môn
      // phù hợp với lớp đó, option cần chọn (VD "Kỹ thuật") có thể CHƯA
      // tồn tại trong DOM ngay lúc gọi. selectOption() mặc định chỉ retry
      // vì lý do "select chưa visible/enabled", KHÔNG biết chờ đúng option
      // xuất hiện → nếu AJAX chưa xong, cứ retry vô ích tới hết 60s rồi
      // timeout cả test (đã thấy ở log thật: "did not find some options"
      // lặp 20-30 lần rồi timeout, dù <select> đã resolve đúng).
      // selectOptionByLabelWhenReady() chờ ĐÚNG <option> có label đó được
      // attach vào DOM trước, rồi mới selectOption — tránh race condition.
      await this.selectOptionByLabelWhenReady(
        modal.locator(HocLieuCuaToiPage.SUBJECT_SELECT),
        options.subject
      );
    }
    if (options.bookSet) {
      // Bộ sách cũng cascading theo môn/lớp đã chọn (VD "Cánh diều" chỉ
      // xuất hiện sau khi subject_list đã nạp xong môn tương ứng) — áp
      // dụng cùng cơ chế chờ như subject.
      await this.selectOptionByLabelWhenReady(
        modal.locator(HocLieuCuaToiPage.BOOKSET_SELECT),
        options.bookSet
      );
    }
    if (options.replacementCoursewareId) {
      await this.jsClearAndType(modal.locator(HocLieuCuaToiPage.REPLACEMENT_ID_INPUT), options.replacementCoursewareId);
    }
    return this;
  }

  /** Bấm nút "Tạo" và chờ hệ thống xử lý xong */
  async submitModal(): Promise<this> {
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.MODAL).locator(HocLieuCuaToiPage.SUBMIT_BTN));
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

  // ==================================================================
  // ---- Bộ lọc ----
  // ==================================================================

  /** Điền các trường trong form lọc theo options, KHÔNG submit */
  async fillFilter(options: FilterOptions): Promise<this> {
    if (options.sourceCate) {
      await this.page.locator(HocLieuCuaToiPage.FILTER_SOURCE_CATE_SELECT).selectOption(options.sourceCate);
    }
    if (options.type !== undefined) {
      await this.page.locator(HocLieuCuaToiPage.FILTER_TYPE_SELECT).selectOption(String(options.type));
    }
    if (options.subject) {
      await this.page.locator(HocLieuCuaToiPage.FILTER_SUBJECT_SELECT).selectOption({ label: options.subject });
    }
    if (options.grade) {
      await this.page.locator(HocLieuCuaToiPage.FILTER_GRADE_SELECT).selectOption({ label: options.grade });
    }
    if (options.title) {
      await this.jsClearAndType(this.page.locator(HocLieuCuaToiPage.FILTER_TITLE_INPUT), options.title);
    }
    if (options.freeCateOnly) {
      await this.page.locator(HocLieuCuaToiPage.FILTER_FREE_CATE_CHECKBOX).check();
    }
    if (options.hiddenCateOnly) {
      await this.page.locator(HocLieuCuaToiPage.FILTER_HIDDEN_CATE_CHECKBOX).check();
    }
    return this;
  }

  /** Bấm nút "Lọc" và chờ trang tải lại kết quả (form submit GET → reload) */
  async submitFilter(): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(this.page.locator(HocLieuCuaToiPage.FILTER_SUBMIT_BTN)),
    ]);
    await this.dismissPopups();
    return this;
  }

  /** Luồng đầy đủ: điền filter → submit */
  async filterList(options: FilterOptions): Promise<this> {
    await this.fillFilter(options);
    await this.submitFilter();
    return this;
  }

  // ==================================================================
  // ---- Phân trang ----
  // ==================================================================

  async goToPage(page: number): Promise<this> {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(this.page.locator(HocLieuCuaToiPage.PAGE_LINK(page))),
    ]);
    await this.dismissPopups();
    return this;
  }

  async getCurrentPage(): Promise<number> {
    const text = (await this.page.locator(HocLieuCuaToiPage.ACTIVE_PAGE_ITEM).innerText()).trim();
    return Number(text) || 1;
  }

  // ==================================================================
  // ---- Bảng danh sách ----
  // ==================================================================

  getTableRows(): Locator {
    return this.page.locator(HocLieuCuaToiPage.TABLE_ROWS);
  }

  getRowById(id: string): Locator {
    return this.page.locator(HocLieuCuaToiPage.ROW_BY_ID(id));
  }

  getRowByTitle(title: string): Locator {
    return this.getTableRows().filter({ hasText: title });
  }

  /** Đọc dữ liệu 1 dòng: id, STT, tên, url chi tiết, ngày tạo, thể loại, khóa học */
  async getRowData(row: Locator): Promise<CoursewareRow> {
    const id = (await row.getAttribute('data-id')) ?? '';
    const stt = (await row.locator('td[data-label="STT"]').innerText()).trim();
    const titleLink = row.locator(HocLieuCuaToiPage.ROW_TITLE_LINK);
    const title = (await titleLink.innerText()).trim();
    const detailUrl = (await titleLink.getAttribute('href')) ?? '';
    const createdDate = (await row.locator(HocLieuCuaToiPage.ROW_CREATED_DATE).innerText()).trim();
    const category = (await row.locator(HocLieuCuaToiPage.ROW_CATEGORY).innerText()).trim();
    const course = (await row.locator(HocLieuCuaToiPage.ROW_COURSE).innerText()).trim();

    return { id, stt, title, detailUrl, createdDate, category, course };
  }

  /** Đọc toàn bộ danh sách học liệu đang hiển thị trong bảng (trang hiện tại) */
  async getAllRowsData(): Promise<CoursewareRow[]> {
    const rows = await this.getTableRows().all();
    const result: CoursewareRow[] = [];
    for (const row of rows) {
      result.push(await this.getRowData(row));
    }
    return result;
  }

  // ==================================================================
  // ---- Dropdown "Hành động" (nút "Chọn") trên từng dòng ----
  // ==================================================================

  /** Mở dropdown "Chọn" ở cột Hành động của 1 dòng, trả về locator menu đang mở */
  async openRowActionsMenu(row: Locator): Promise<Locator> {
    await this.jsClick(row.locator(HocLieuCuaToiPage.ROW_ACTIONS_BTN));
    const menu = row.locator(HocLieuCuaToiPage.ROW_ACTIONS_MENU);
    await menu.waitFor({ state: 'visible', timeout: 5000 });
    return menu;
  }

  /** "Sửa đổi" — điều hướng sang trang quản lý học liệu (.../quan-ly) */
  async editCourseware(row: Locator): Promise<this> {
    await this.openRowActionsMenu(row);
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(row.locator(HocLieuCuaToiPage.ROW_EDIT_LINK)),
    ]);
    return this;
  }

  /** "Chấm bài" — điều hướng sang trang danh sách bài làm/chấm bài (.../bai-lam) */
  async goToGrading(row: Locator): Promise<this> {
    await this.openRowActionsMenu(row);
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.jsClick(row.locator(HocLieuCuaToiPage.ROW_CHAM_BAI_LINK)),
    ]);
    return this;
  }

  /**
   * "Xóa" — xóa học liệu. HÀNH ĐỘNG PHÁ HỦY DỮ LIỆU — KHÔNG gọi trong
   * regression spec (theo đúng convention của dự án, giống cách các hành
   * động xóa/khôi phục khác bị loại trừ).
   *
   * HTML gửi (`href="javascript:;"` + data-id, không kèm modal) chưa cho biết
   * đây là modal xác nhận custom hay window.confirm() gốc trình duyệt.
   * Đăng ký sẵn handler 'dialog' để tự accept NẾU là confirm() gốc (mặc định
   * Playwright sẽ tự dismiss dialog nếu không có listener nào) — đồng thời
   * vẫn xử lý trường hợp modal custom (giống BoSuuTapHocLieuPage.deleteCollection()).
   * CẦN chạy thật để xác nhận lại nhánh nào đúng.
   */
  async deleteCourseware(row: Locator): Promise<this> {
    this.page.once('dialog', (dialog: Dialog) => dialog.accept().catch(() => {}));
    await this.openRowActionsMenu(row);
    await this.jsClick(row.locator(HocLieuCuaToiPage.ROW_DELETE_LINK));

    const confirmDialog = this.page.locator(HocLieuCuaToiPage.CONFIRM_DIALOG);
    const hasConfirmDialog = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasConfirmDialog) {
      await this.jsClick(this.page.locator(HocLieuCuaToiPage.CONFIRM_DELETE_BTN));
      await confirmDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }

    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  /**
   * "Nhân bản học liệu" — TODO: HTML gửi chỉ có link `a.duplicate-cate`
   * (data-id/data-course/data-parent), chưa có HTML của bước tiếp theo (có
   * thể nhân bản ngay qua AJAX rồi reload danh sách, hoặc mở modal chọn vị
   * trí lưu trước). Hàm dưới tạm dừng ở bước click + chờ mạng ổn định —
   * CẦN xác minh lại khi có HTML thật lúc thao tác xong.
   */
  async duplicateCourseware(row: Locator): Promise<this> {
    await this.openRowActionsMenu(row);
    await this.jsClick(row.locator(HocLieuCuaToiPage.ROW_DUPLICATE_LINK));
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }

  /**
   * "Chuyển vào khóa học" — TODO: tương tự Nhân bản, chưa có HTML modal chọn
   * khóa học đích. Hàm dưới chỉ dừng ở bước mở/bấm — CẦN bổ sung bước chọn
   * khóa học + submit khi có HTML thật của modal.
   */
  async openMoveToCourseModal(row: Locator): Promise<this> {
    await this.openRowActionsMenu(row);
    await this.jsClick(row.locator(HocLieuCuaToiPage.ROW_MOVE_LINK));
    return this;
  }

  /**
   * "Chia sẻ học liệu" — phần tử là <div class="share-cate">, KHÔNG phải <a>.
   * TODO: chưa có HTML modal chia sẻ (cấu hình quyền xem, link chia sẻ...) —
   * hàm dưới chỉ dừng ở bước mở/bấm.
   */
  async openShareModal(row: Locator): Promise<this> {
    await this.openRowActionsMenu(row);
    await this.jsClick(row.locator(HocLieuCuaToiPage.ROW_SHARE_ITEM));
    return this;
  }

  // ==================================================================
  // ---- Luồng thêm nội dung sau khi tạo học liệu ----
  // Dùng cho các loại "học liệu tự do"/trắc nghiệm (Ảnh 1 & 2): sau khi createCourseware()
  // xong, trang chuyển sang màn quản lý học liệu, cần bấm "Tạo câu hỏi" để thêm câu hỏi.
  // ==================================================================

  /** Mở modal "Tạo câu hỏi" từ trang nội dung học liệu (tab "Câu hỏi của bạn") */
  async openTaoCauHoiModal(): Promise<this> {
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.TAO_CAU_HOI_BTN));
    await this.page.locator(HocLieuCuaToiPage.QUESTION_TITLE_INPUT).waitFor({ state: 'visible', timeout: 8000 });
    return this;
  }

  /** Điền tiêu đề, mức độ, nội dung câu hỏi rồi bấm "Lưu câu hỏi" (KHÔNG tự mở modal trước) */
  async fillAndSaveQuestion(options: AddQuestionOptions): Promise<this> {
    await this.jsClearAndType(this.page.locator(HocLieuCuaToiPage.QUESTION_TITLE_INPUT), options.title);
    if (options.level) {
      await this.jsClick(this.page.locator(HocLieuCuaToiPage.QUESTION_LEVEL_TAB(options.level)));
    }
    await this.jsClearAndType(this.page.locator(HocLieuCuaToiPage.QUESTION_CONTENT_TEXTAREA), options.content);
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.QUESTION_LUU_CAU_HOI_BTN));
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
    await this.jsClearAndType(this.page.locator(HocLieuCuaToiPage.VIDEO_LINK_INPUT), url);
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.LUU_CAP_NHAT_BTN));
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
      await this.jsClick(this.page.locator(HocLieuCuaToiPage.TAB_HUONG_DAN_GIAI));
    } else {
      await this.jsClick(this.page.locator(HocLieuCuaToiPage.TAB_DE_BAI));
    }
    await this.page.locator(HocLieuCuaToiPage.FILE_UPLOAD_INPUT).setInputFiles(filePath);
    await this.jsClick(this.page.locator(HocLieuCuaToiPage.LUU_CAP_NHAT_BTN));
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    return this;
  }
}