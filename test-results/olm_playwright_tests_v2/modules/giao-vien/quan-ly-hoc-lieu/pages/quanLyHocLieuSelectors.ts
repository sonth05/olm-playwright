export const QUAN_LY_HOC_LIEU_SELECTORS = {
  // Header: badge, tiêu đề, trạng thái, người tạo
  GRADE_BADGE: '.tw-bg-accent-light >> nth=0',
  SUBJECT_BADGE: '.tw-bg-accent-light >> nth=1',
  TITLE_TEXT: 'span.tw-min-w-0.tw-max-w-full.tw-break-words',
  EDIT_TITLE_BTN: 'span[aria-label="Chỉnh sửa học liệu"]',
  STATUS_BADGE: '[data-slot="badge"]',
  MATERIAL_TYPE_LABEL: 'text="Đề thi kiểm tra"',
  SEO_BUTTON: 'button[data-seo="modal-seo"]',
  SHARE_BUTTON: 'button:has-text("Chia sẻ")',
  PUBLISH_BUTTON: '#publish',
  PUBLISH_HINT: 'text=Xuất bản để có thể bắt đầu giao bài cho học sinh',

  // Hàng liên kết phụ (Danh sách bài làm / Trộn đề / Thống kê / ...)
  SUBMISSION_LIST_LINK: 'a:has-text("Danh sách bài làm")',
  SHUFFLE_EXAM_LINK: 'a:has-text("Trộn đề")',
  STATS_LINK: 'a:has-text("Thống kê")',
  ADVANCED_SETTING_BTN: 'button:has-text("Thiết lập nâng cao")',
  MORE_ACTIONS_BTN: 'button[aria-label="Thêm hành động"]',
  VIEW_CONTENT_LINK: 'a:has-text("Xem nội dung")',

  // Tuần / KCT / Quy tắc viết nội dung
  WEEKS_INPUT: 'input[placeholder="Nhập các tuần"]',
  KCT_BUTTON: '.pre-trigger-curriculum-cate',
  CONTENT_RULES_BTN: 'button:has-text("Quy tắc viết nội dung")',

  // Khu vực tiêu đề và tab chế độ nội dung học liệu
  CONTENT_HEADING: 'strong:has-text("Nội dung học liệu")',
  TAB_CHOOSE_QUESTIONS: 'button[role="radio"][aria-label="Chọn câu hỏi từ học liệu"]',
  TAB_MATRIX: 'button[role="radio"][aria-label="Tạo đề từ ma trận"]',
  SAVE_BUTTON: 'button:has-text("Lưu thay đổi")',
  PREVIEW_BUTTON: 'button:has-text("Xem trước")',
  DOWNLOAD_BUTTON: '[aria-haspopup="dialog"]:has-text("Tải bài")',

  // Thanh tìm kiếm và quản lý kho câu hỏi (Cột trái)
  SEARCH_INPUT: 'input[placeholder="Tìm ID câu hỏi"]',
  SEARCH_BUTTON: 'button[aria-label="Tìm kiếm"]',
  TAB_THIS_COURSE: 'button[role="tab"]:has-text("Học liệu này")',
  TAB_MY_COURSES: 'button[role="tab"]:has-text("Học liệu của tôi")',
  TAB_OLM_COURSES: 'button[role="tab"]:has-text("Học liệu OLM")',
  CREATE_QUESTION_BTN: 'button:has-text("Tạo câu hỏi")',
  IMPORT_FILE_BTN: 'button:has-text("Import từ file")',
  QUESTION_COUNT_LABEL: 'strong.tw-text-content-tertiary:has-text("câu hỏi")',
  QUESTION_LIST_EMPTY: 'text=Chưa có câu hỏi nào.',

  // Khu vực soạn thảo nội dung đề thi (Cột phải)
  TOTAL_SCORE: 'text=/Tổng toàn bài/i',
  SCORING_METHOD: 'button[role="combobox"]',
  UNDO_BTN: 'button[aria-label="Undo"]',
  REDO_BTN: 'button[aria-label="Redo"]',
  CLEAR_FORMAT_BTN: '[title="Xóa định dạng"]',
  EXIT_SELECTION_BTN: '[title="Thoát vùng chọn"]',
  FULLSCREEN_BTN: '[title="Phóng to tối đa"]',
  EDIT_HTML_BTN: '[title="Chỉnh sửa mã HTML"]',
  ADD_SECTION_BTN: '[title="Thêm phần thi"]',
  ADD_NOTE_BTN: '[title="Thêm chú giải, chú thích (môn hóa)"]',
  REMOVE_ALL_BTN: '[title="Gỡ tất cả"]',
  EDITOR_TEXTBOX: '[data-lexical-editor="true"]',
  EDITOR_PLACEHOLDER: '.ContentEditable__placeholder',

  // Khối chọn ma trận (ẩn — chỉ hiện khi bật TAB_MATRIX)
  CREATE_MATRIX_FROM_COURSE_BTN: 'button:has-text("Tạo ma trận mới từ khóa học")',
  MATRIX_LIST_LINK: 'a:has-text("ma trận đã tạo")',
  MATRIX_CODE_INPUT: 'input[placeholder="Chọn hoặc nhập mã ma trận"]',
};

/**
 * Selector cho trang "Quản lý học liệu" của 6 loại học liệu khác đã có DOM
 * thật xác nhận (2026-08-12) — xem chi tiết class tương ứng trong
 * HocLieuTypeManagePages.ts. Chỉ liệt kê phần DOM khác biệt so với header
 * chung (badge/tiêu đề/SEO/Chia sẻ/Xuất bản dùng chung selector ở trên).
 */
export const NHCH_SELECTORS = {
  MATERIAL_TYPE_LABEL: 'text="Dạng bài, kĩ năng (NHCH)"',
  ALLOW_AS_EXAM_SWITCH: 'button[role="switch"]',
  ALLOW_AS_EXAM_LABEL: 'text="Cho phép làm như đề thi"',
  EMPTY_CONTENT_HEADING: 'text="Chưa thêm câu hỏi"',
  EMPTY_CONTENT_SUBTEXT: 'text="Tạo/thêm câu hỏi từ kho học liệu bên trái"',
};

export const THEORY_SELECTORS = {
  MATERIAL_TYPE_LABEL: 'text="Lý thuyết"',
  COPY_LINK_BTN: 'button:has-text("Sao chép link học liệu")',
  MODE_COMPOSE: 'button[role="radio"][aria-label="Soạn thảo nội dung"]',
  MODE_UPLOAD_FILE: 'button[role="radio"][aria-label="Tải lên tệp PDF, Word, PPT"]',
  LAYOUT_TOGGLE_TAB: '[title="Chế độ tab"]',
  LAYOUT_TOGGLE_2BEN: '[title="Xếp 2 bên"]',
  PANE_TAB_ORIGINAL: 'button[role="tab"]:has-text("Bản gốc")',
  PANE_TAB_BILINGUAL: 'button[role="tab"]:has-text("Song ngữ")',
  EDITOR: '.theory-editor [data-lexical-editor="true"]',
};

export const VIDEO_SELECTORS = {
  MATERIAL_TYPE_LABEL: 'text="Video"',
  CREATE_VIDEO_HEADING: 'text="Tạo học liệu video"',
  YOUTUBE_URL_INPUT: 'input[name="youtube_url"]',
  VIDEO_REQUIRED_BADGE: 'text="BẮT BUỘC"',
  VIDEO_FILE_INPUT: 'input[type="file"][accept*="video"]',
  TAB_ATTACHED_LECTURE: 'button[role="tab"]:has-text("Bài giảng đính kèm")',
  TAB_SUMMARY: 'button[role="tab"]:has-text("Tóm tắt bài giảng")',
  TAB_AUTO_TRANSCRIPT: 'button[role="tab"]:has-text("Tạo transcript (Tự động)")',
};

export const ESSAY_SELECTORS = {
  MATERIAL_TYPE_LABEL: 'text="Đề thi tự luận"',
  TAB_QUESTION: 'button[role="tab"]:has-text("Đề bài")',
  TAB_ANSWER: 'button[role="tab"]:has-text("Đáp án/Hướng dẫn giải")',
  MODE_COMPOSE: 'button[role="radio"][aria-label="Soạn thảo nội dung"]',
  MODE_UPLOAD_FILE: 'button[role="radio"][aria-label="Tải lên tệp PDF, Word, PPT"]',
  QUESTION_EDITOR: '#elmEditorEssay [data-lexical-editor="true"]',
  ANSWER_EDITOR: '#elmEditorAns [data-lexical-editor="true"]',
};

export const LINK_SELECTORS = {
  UNDEFINED_TYPE_LABEL: 'text="Chưa xác định loại học liệu"',
  COPY_LINK_BTN: 'button:has-text("Sao chép link học liệu")',
  CONTENT_HEADING: 'text="Đường dẫn liên kết"',
  SAVE_BTN: 'button.submit-cate',
  URL_INPUT: 'input[placeholder="Nhập đường dẫn liên kết"]',
};

export const PDF_SELECTORS = {
  MATERIAL_TYPE_LABEL: 'text="Đề thi PDF"',
  TAB_QUESTION: 'button:has-text("Đề bài")',
  TAB_ANSWER: 'button:has-text("Đáp án/Hướng dẫn giải")',
  SAVE_BTN: 'button.submit-cate',
  DROPZONE_HEADING: 'text="Kéo thả tài liệu vào đây"',
  CHOOSE_FILE_BTN: 'button:has-text("Chọn tệp từ máy")',
  FILE_INPUT: 'input[type="file"][accept*=".pdf"]',
};