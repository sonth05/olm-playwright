import { CoursewareType } from './HocLieuCuaToiPage';

/**
 * HocLieuV1Constants.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Danh mục các loại học liệu ở popup "Tạo học liệu" bản V1 (bootstrap-style
 * modal, có nút "Chọn khung chương trình" ở đầu popup) — khác với popup V2
 * dạng cmdk-menu ở hoc-lieu-v2/page/Createhoclieumenu.ts.
 *
 * Tổng hợp từ 16 ảnh chụp popup do người dùng cung cấp (2026-07-26).
 * headerTitle = đúng text hiển thị cạnh icon 2 ký tự ở header popup
 * (VD popup "ĐT  Đề thi THPT" → headerTitle = 'Đề thi THPT').
 *
 * CẬP NHẬT: thêm field `type` map trực tiếp sang CoursewareType (đã verify
 * bằng HTML thật ở HocLieuCuaToiPage.ts, data-type khớp attribute
 * a.select-cate-type[data-type="..."]) — dùng để mở đúng item trong dropdown
 * "Tạo mới học liệu" tại trang /hoc-lieu-cua-toi, thay vì đoán selector
 * headerTitle trên trang /home (nơi KHÔNG tồn tại dropdown này).
 *
 * formType:
 *  - 'full'     : có đủ Tiêu đề, Mô tả, Từ khóa, Tiêu đề SEO, Mô tả SEO,
 *                 Chọn lớp, Chọn môn, Chọn bộ sách, ID học liệu thay thế.
 *  - 'reduced'  : KHÔNG có Mô tả/Từ khóa (Đề thi trộn Offline, Đề luyện tập
 *                 trắc nghiệm từ ma trận, Mô phỏng/thí nghiệm ảo).
 *  - 'document' : như 'reduced' nhưng có thêm ô tải file (Tài liệu).
 *  - 'game'     : popup hoàn toàn khác cấu trúc (Câu hỏi vui / Game hoá) —
 *                 xử lý riêng ở CauHoiVuiPopup.ts, KHÔNG dùng HocLieuV1FormModal.
 */
export type HocLieuV1FormType = 'full' | 'reduced' | 'document' | 'game';

export interface HocLieuV1MaterialDef {
  /** khoá ngắn, dùng để đặt tên test / tiêu đề học liệu cho dễ nhận biết */
  key: string;
  /** text hiển thị ở header popup, dùng để xác định popup đã mở đúng loại */
  headerTitle: string;
  formType: HocLieuV1FormType;
  /** data-type thật của item trong dropdown "Tạo mới học liệu" (HocLieuCuaToiPage) */
  type: CoursewareType;
}

export const HOC_LIEU_V1_MATERIALS: HocLieuV1MaterialDef[] = [
  { key: 'de_thi_thpt', headerTitle: 'Đề thi THPT', formType: 'full', type: CoursewareType.DE_THI_THPT },
  { key: 'dang_bai_ki_nang_nhch', headerTitle: 'Dạng bài, kĩ năng (NHCH)', formType: 'full', type: CoursewareType.DANG_BAI_KY_NANG_NHCH },
  { key: 'ly_thuyet_tuong_tac', headerTitle: 'Lý thuyết tương tác', formType: 'full', type: CoursewareType.LY_THUYET_TUONG_TAC },
  { key: 'video_youtube_diem_dung', headerTitle: 'Video Youtube có điểm dừng', formType: 'full', type: CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG },
  { key: 'hoi_va_dap', headerTitle: 'Hỏi và đáp', formType: 'full', type: CoursewareType.HOI_VA_DAP },
  { key: 'de_thi_tu_luan', headerTitle: 'Đề thi Tự luận', formType: 'full', type: CoursewareType.DE_THI_TU_LUAN },
  { key: 'lien_ket', headerTitle: 'Liên kết', formType: 'full', type: CoursewareType.LIEN_KET },
  { key: 'de_thi_tn_tu_file_pdf_word', headerTitle: 'Đề thi trắc nghiệm từ file PDF hoặc Word', formType: 'full', type: CoursewareType.DE_THI_TN_TU_FILE },
  { key: 'de_thi_tn_tu_ma_tran', headerTitle: 'Đề thi trắc nghiệm từ ma trận', formType: 'full', type: CoursewareType.DE_THI_TN_TU_MA_TRAN },
  { key: 'luyen_tap_trac_nghiem', headerTitle: 'Luyện tập trắc nghiệm', formType: 'full', type: CoursewareType.LUYEN_TAP_TRAC_NGHIEM },
  { key: 'de_thi_tron_offline', headerTitle: 'Đề thi trộn Offline', formType: 'reduced', type: CoursewareType.DE_THI_TRON_OFFLINE },
  { key: 'de_luyen_tap_tn_tu_ma_tran', headerTitle: 'Đề luyện tập trắc nghiệm từ ma trận', formType: 'reduced', type: CoursewareType.DE_LUYEN_TAP_TN_TU_MA_TRAN },
  { key: 'mo_phong_thi_nghiem_ao', headerTitle: 'Mô phỏng, thí nghiệm ảo', formType: 'reduced', type: CoursewareType.MO_PHONG_THI_NGHIEM_AO },
  { key: 'tai_lieu', headerTitle: 'Tài liệu', formType: 'document', type: CoursewareType.TAI_LIEU },
];

/** Xử lý riêng, KHÔNG nằm trong HOC_LIEU_V1_MATERIALS vì cấu trúc popup khác hẳn */
export const CAU_HOI_VUI_HEADER_TITLE = 'Câu hỏi vui';

// ─── Giá trị mặc định cho các dropdown, áp dụng chung cho toàn bộ ca test ──
// (Chọn lớp -> Lớp 12, Chọn môn -> Toán, Chọn bộ sách -> Cánh diều)
//
// CẬP NHẬT (2026-07-27): đổi DEFAULT_MON từ 'Kỹ thuật' sang 'Toán'. Một số
// loại học liệu (Đề thi THPT, Lý thuyết tương tác, Hỏi và đáp, Liên kết,
// Đề thi trắc nghiệm từ ma trận/file, Luyện tập trắc nghiệm, Đề thi trộn
// Offline, Tài liệu...) không có môn "Kỹ thuật" trong danh sách subject_list
// (cascading theo lớp đã chọn) → selectOptionByLabelWhenReady() chờ mãi
// không thấy option rồi timeout (xem log lỗi thật 2026-07-27). "Toán" là
// môn phổ biến, chắc chắn tồn tại ở mọi lớp/mọi loại học liệu, tránh lặp
// lại lỗi tương tự.
export const DEFAULT_LOP = 'Lớp 12';
export const DEFAULT_MON = 'Toán';
export const DEFAULT_BO_SACH = 'Cánh diều';