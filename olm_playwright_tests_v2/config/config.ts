import dotenv from 'dotenv';
import path from 'path';

// ─── Chọn file env theo môi trường ──────────────────────────────────────────
// Bản v2 chạy nhắm tới debug.olm.vn — mặc định đọc '.env.debug'.
// Có thể override bằng biến ENV_FILE trước khi chạy test nếu cần, ví dụ:
//   ENV_FILE=.env.debug npx playwright test
// (đã có sẵn script "test:debug*" tương ứng trong package.json)
const envFile = process.env.ENV_FILE ?? '.env.debug';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const env = (key: string, fallback: string): string => process.env[key] ?? fallback;
const envNum = (key: string, fallback: number): number => {
  const v = process.env[key];
  return v ? Number(v) : fallback;
};

export const BASE_URL             = env('BASE_URL', 'https://olm.vn');
export const LOGIN_URL            = `${BASE_URL}/dangnhap`;
export const REGISTER_URL         = `${BASE_URL}/dang-ky`;
export const HOC_BAI_URL          = `${BASE_URL}/hoc-bai`;
export const HOI_DAP_URL          = `${BASE_URL}/hoi-dap`;
export const CONTEST_URL          = `${BASE_URL}/contestx`;
export const MUA_VIP_URL          = `${BASE_URL}/mua-vip`;
export const GIO_HANG_URL         = `${BASE_URL}/gio-hang`;
export const CUOC_THI_URL         = `${BASE_URL}/cuoc-thi`;
export const THU_VIEN_SO_URL      = `${BASE_URL}/thu-vien-so`;
export const SACH_GIAO_KHOA_URL   = `${BASE_URL}/thu-vien-so/sach-giao-khoa`;
export const TAP_CHI_URL          = `${BASE_URL}/thu-vien-so/tap-chi`;
export const TIN_TUC_URL          = `${BASE_URL}/thongtin`;
export const BAI_VIET_URL         = `${BASE_URL}/bai-viet`;
export const HOC_TAP_URL          = `${BASE_URL}/chu-de-bai-viet/hoc-tap`;
export const THONG_BAO_NEWS_URL   = `${BASE_URL}/chu-de-bai-viet/thong-bao`;
export const GIO_HANG_THU_VIEN_SO_URL = `${BASE_URL}/gio-hang-thu-vien-so`;
export const KIDS_URL             = `${BASE_URL}/kids`;
export const TOAN_MAU_GIAO_URL         = `${BASE_URL}/bg/toan-mau-giao-olm`;
export const TIENG_ANH_MAU_GIAO_URL    = `${BASE_URL}/bg/tieng-anh-mau-giao`;
export const TIENG_VIET_MAU_GIAO_URL   = `${BASE_URL}/bg/tieng-viet-mau-giao-olm`;
export const CHUONG_TRINH_5_TUOI_URL   = `${BASE_URL}/bg/chuong-trinh-hoc-cho-tre-5-tuoi`;
export const CHUONG_TRINH_3_4_TUOI_URL = `${BASE_URL}/bg/chuong-trinh-giao-duc-tre-3-4-tuoi`;

export const KIDS_COURSES = [
  { name: 'Toán Mẫu giáo',                 url: TOAN_MAU_GIAO_URL },
  { name: 'Tiếng Anh Mẫu giáo',            url: TIENG_ANH_MAU_GIAO_URL },
  { name: 'Tiếng Việt mẫu giáo',           url: TIENG_VIET_MAU_GIAO_URL },
  { name: 'Chương trình học cho trẻ 5 tuổi',   url: CHUONG_TRINH_5_TUOI_URL },
  { name: 'Chương trình giáo dục trẻ 3-4 tuổi', url: CHUONG_TRINH_3_4_TUOI_URL },
] as const;

// ─── URL có path param (bổ sung cho tests/api, map từ Postman collection) ──
// Chú ý: Get Grade Page dùng pattern "/lop-:grade" (không có dấu / giữa
// "lop-" và số), khác với SKIP_HREFS trong constants.ts vốn chỉ dùng để
// match prefix '/lop-' khi parse link trên trang.
export const lopUrl     = (grade: number | string): string => `${BASE_URL}/lop-${grade}`;
export const khoaHocUrl = (courseSlug: string): string => `${BASE_URL}/khoa-hoc/${courseSlug}`;
export const chuDeUrl   = (topicSlug: string): string => `${BASE_URL}/chu-de/${topicSlug}`;
export const docSachUrl = (bookSlug: string): string => `${BASE_URL}/doc-sach/${bookSlug}`;
export const baiVietDetailUrl = (slug: string): string => `${BASE_URL}/bai-viet/${slug}`;
export const cauHoiUrl  = (questionId: number | string): string => `${BASE_URL}/cau-hoi/${questionId}`;

// ─── Trường học (school-owner) — tài khoản ACCOUNTS.school / TEST_USERS.SCHOOL ──
// Slug trường gắn với tài khoản test cố định (nguyenthanhson2818). Override
// qua SCHOOL_SLUG nếu đổi sang tài khoản trường khác.
export const SCHOOL_SLUG = env('SCHOOL_SLUG', 'truong-lien-cap-olm-son.41902384');
/** Phần ID số của trường, tách từ SCHOOL_SLUG (VD: 'truong-lien-cap-olm-son.41902384' → '41902384').
 *  Dùng cho các URL KHÔNG theo pattern /truong-hoc/{slug đầy đủ}/... như school-files-{id}/school-folder-{id}. */
export const SCHOOL_ID = env('SCHOOL_ID', SCHOOL_SLUG.split('.').pop() ?? '41902384');
/** VD: truongHocUrl('to-bo-mon') → BASE_URL/truong-hoc/{slug}/to-bo-mon */
export const truongHocUrl = (subPath = ''): string =>
  `${BASE_URL}/truong-hoc/${SCHOOL_SLUG}${subPath ? `/${subPath}` : ''}`;
/** URL trang "Danh sách nhóm giáo viên" (tab Giáo viên trong quản trị trường) */
export const TO_BO_MON_URL = truongHocUrl('to-bo-mon');
/** URL trang "Nhóm đã xoá" (nhóm giáo viên đã xoá) */
export const NHOM_GV_DA_XOA_URL = `${TO_BO_MON_URL}?deleted=1`;
/** URL trang "Phân công giảng dạy" */
export const PHAN_CONG_GIANG_DAY_URL = truongHocUrl('phan-cong-giang-day');
/** URL trang "Phân công quản lý" (danh sách quyền giáo viên) */
export const PHAN_CONG_QUAN_LY_URL = truongHocUrl('phan-cong-quan-ly');
/** URL trang "Lớp học của trường" (tab Lớp học trong quản trị trường, 1.2.1) */
export const LOP_HOC_CUA_TRUONG_URL = truongHocUrl('lop-hoc');
/** URL trang "Lớp đã xóa" (lớp học của trường đã xoá mềm) */
export const LOP_HOC_CUA_TRUONG_DA_XOA_URL = `${LOP_HOC_CUA_TRUONG_URL}?deleted=1`;
/** URL trang "Thống kê bài giao toàn trường" (3.1, tab "Bài đã giao") */
export const BAI_GIAO_TOAN_TRUONG_URL = truongHocUrl('bai-giao');
/** URL trang "Thống kê đấu trường" (3.3) — CHÚ Ý: khác domain (dautruong.olm.vn),
 *  KHÔNG dùng truongHocUrl/BASE_URL. Slug/param cụ thể CHƯA verify bằng trình
 *  duyệt thật (chỉ có ảnh chụp màn hình) — override qua DAU_TRUONG_URL env nếu cần. */
export const DAU_TRUONG_URL = env('DAU_TRUONG_URL', 'https://dautruong.olm.vn');
/** URL trang "Thống kê đồng bộ DTI" (3.7) */
export const THONG_KE_DONG_BO_DTI_URL = truongHocUrl('thong-ke-dong-bo-dti');
/** URL trang "Xếp hạng trong trường" (3.4) — slug 'xep-hang-thi-dua' suy ra từ
 *  tiêu đề hiển thị trên trang, CHƯA verify trực tiếp bằng trình duyệt thật. */
export const XEP_HANG_TRUONG_URL = truongHocUrl('xep-hang-thi-dua');
/** URL trang "Thiết lập trường học" (5.1.1) — trang giới thiệu trường (không
 *  có sub-path riêng), chỉ khác bằng hash #menu-thiet-lap-truong-hoc trỏ tới
 *  section "Thiết lập trường học" nằm ngay dưới block "Thông tin VIP". */
export const THIET_LAP_TRUONG_HOC_URL = `${truongHocUrl()}#menu-thiet-lap-truong-hoc`;
/** URL trang "Đồng bộ csdl ngành" (5.1.2) — UI React (Tailwind), khác hẳn
 *  giao diện Bootstrap của các trang quản trị trường còn lại. */
export const DONG_BO_CSDL_NGANH_URL = `${truongHocUrl('csdl-nganh')}#menu-dong-bo-csdl-nganh`;
/** URL trang "Thiết lập năm học mới" (5.1.3) — CHÚ Ý: KHÔNG theo pattern
 *  truongHocUrl (không có slug trường trong path), khác với các trang 5.1.x còn lại. */
export const THIET_LAP_NAM_HOC_MOI_URL = `${BASE_URL}/truong-hoc/thiet-lap-nam-hoc-moi#menu-thiet-lap-nam-hoc-moi`;
/** URL trang "Thiết lập môn học" (5.1.4) */
export const THIET_LAP_MON_HOC_URL = `${truongHocUrl('thiet-lap-mon-hoc')}#menu-thiet-lap-mon-hoc`;
/** URL trang "Quản lý dung lượng trường" (5.1.5) */
export const QUAN_LY_DUNG_LUONG_TRUONG_URL =
  `${truongHocUrl('thong-ke-dung-luong-truong')}#menu-quan-ly-dung-luong-truong`;
/** URL trang "Tuyển sinh đầu cấp" (5.1.6), tab "Thiết lập" — MẶC ĐỊNH khi vào /tsdc */
export const TUYEN_SINH_DAU_CAP_URL = `${truongHocUrl('tsdc')}#menu-school-tsdc`;
/** URL tab "Tin tuyển sinh" (cùng trang 5.1.6) — CHƯA có HTML để verify DOM chi tiết,
 *  suy ra path từ href thật trên `ul.nav.nav-tabs` của tab "Thiết lập". */
export const TUYEN_SINH_DAU_CAP_TIN_TS_URL = truongHocUrl('tsdc-news');
/** URL tab "Danh sách" (danh sách hồ sơ đã đăng ký, cùng trang 5.1.6) — CHƯA verify DOM chi tiết. */
export const TUYEN_SINH_DAU_CAP_DANH_SACH_URL = truongHocUrl('tsdc-list');
/** Trang tuyển sinh CÔNG KHAI (không cần đăng nhập) hiển thị ở cuối trang Thiết lập.
 *  CHÚ Ý: dùng SCHOOL_ID (phần số), KHÔNG phải SCHOOL_SLUG đầy đủ — khác pattern truongHocUrl().
 *  VD: tsdcPublicUrl() → BASE_URL/tsdc/{SCHOOL_ID}; tsdcPublicUrl('th') → …?level=th */
export const tsdcPublicUrl = (level?: string): string =>
  `${BASE_URL}/tsdc/${SCHOOL_ID}${level ? `?level=${level}` : ''}`;

// ─── Đối tác / danh sách nhóm (giáo viên chủ trường quản lý lớp) ──────────
// Username gắn với tài khoản test cố định (nguyenthanhson2818) — cùng tài
// khoản với ACCOUNTS.school trong testData.ts. Override qua OLM_SCHOOL_USERNAME
// (đã dùng sẵn cho việc đăng nhập ở testData.ts) để 2 nơi luôn khớp nhau.
export const SCHOOL_USERNAME = env('OLM_SCHOOL_USERNAME', 'nguyenthanhson2818');
/** VD: doiTacUrl('danh-sach-nhom') → BASE_URL/doi-tac/{username}/danh-sach-nhom */
export const doiTacUrl = (subPath = ''): string =>
  `${BASE_URL}/doi-tac/${SCHOOL_USERNAME}${subPath ? `/${subPath}` : ''}`;
export const DANH_SACH_NHOM_URL = doiTacUrl('danh-sach-nhom');
/** type=6 = tab "Nhóm học sinh" trong trang danh-sach-nhom */
export const NHOM_HOC_SINH_URL = `${DANH_SACH_NHOM_URL}?type=6`;
export const NHOM_HOC_SINH_DA_XOA_URL = `${DANH_SACH_NHOM_URL}?type=6&deleted=1`;
/** URL trang "Lớp học của tôi" (1.2.3) — lớp GV tự tạo/được giao, KHÔNG thuộc quản lý trường */
export const LOP_HOC_CUA_TOI_URL = `${DANH_SACH_NHOM_URL}#menu-danh-sach-lop-hoc`;
export const LOP_HOC_CUA_TOI_DA_XOA_URL = `${DANH_SACH_NHOM_URL}?deleted=1`;

// ─── Quản lý hồ sơ (4.x) — KHÁC domain path với khu vực /truong-hoc/{slug}/… ──
/** URL trang "Nộp hồ sơ, kế hoạch" (4.1.1) — tab mặc định "Gần đây" (#menu-lesson-plan) */
export const HO_SO_KE_HOACH_URL = `${BASE_URL}/school-task/lesson-plan#menu-lesson-plan`;
/** URL trang "Duyệt hồ sơ, kế hoạch" (4.1.2) — tab mặc định "Kế hoạch bài dạy (Giáo án)" */
export const DUYET_HO_SO_KE_HOACH_URL = `${BASE_URL}/school-task/lesson-plan-all#menu-lesson-plan-all`;
/** URL trang "Được chia sẻ" (4.1.3) — hồ sơ được công khai trong tổ/toàn trường */
export const HO_SO_DUOC_CHIA_SE_URL = `${BASE_URL}/school-task/lesson-plan-shared#menu-lesson-plan-shared`;
/** URL trang "Thống kê" hồ sơ/kế hoạch (4.1.4) — thống kê giáo án theo tuần, theo giáo viên */
export const THONG_KE_HO_SO_URL = `${BASE_URL}/school-task/lesson-plan-static#menu-lesson-plan-static`;
/** URL trang "Cây thư mục" (4.1.5) — cây thư mục hồ sơ/giáo án theo TỪNG GIÁO VIÊN của trường */
export const CAY_THU_MUC_TRUONG_URL = `${BASE_URL}/school-files-${SCHOOL_ID}#menu-lesson-plan-tree`;
/** URL trang "Cây thư mục (tùy chỉnh)" (4.1.6) — Drive thư mục tùy chỉnh cấp trường của cá nhân GV */
export const CAY_THU_MUC_URL = `${BASE_URL}/school-folder-${SCHOOL_ID}#menu-school-folder`;
/** URL trang "Tùy chọn thư mục mặc định" (4.1.7) — bật/tắt danh mục hồ sơ mặc định của trường */
export const TUY_CHON_THU_MUC_MAC_DINH_URL =
  `${BASE_URL}/school-folder-${SCHOOL_ID}/folder-merge-default#menu-folder-merge-default`;

// ─── Hỗ trợ và báo lỗi (5.2) — KHÁC domain path, không theo pattern truongHocUrl ──
/** URL trang "Danh sách báo lỗi" (5.2.1) — danh sách báo lỗi câu hỏi (HS/GV gửi) */
export const DANH_SACH_BAO_LOI_URL = `${BASE_URL}/bao-loi-tat-ca-cau-hoi#menu-danh-sach-bao-loi`;
/** URL trang "Danh sách câu hỏi đã bị xóa" (5.2.2), trang 1 (mặc định) */
export const DANH_SACH_CAU_HOI_DA_XOA_URL =
  `${BASE_URL}/danh-sach-cau-hoi-bi-xoa#menu-danh-sach-cau-hoi-bi-xoa`;
/** VD: danhSachCauHoiDaXoaPageUrl(2) → BASE_URL/danh-sach-cau-hoi-bi-xoa/page-2 */
export const danhSachCauHoiDaXoaPageUrl = (pageNum: number): string =>
  `${BASE_URL}/danh-sach-cau-hoi-bi-xoa/page-${pageNum}#menu-danh-sach-cau-hoi-bi-xoa`;

// ─── Timeouts (giảm xuống 1/2 so với bản gốc) ─────────────────────────────
export const WAIT_TIMEOUT  = envNum('WAIT_TIMEOUT',  8);   // ← giảm từ 15 → 8  (giây)
export const PAGE_LOAD_WAIT = envNum('PAGE_LOAD_WAIT', 2);  // ← giảm từ 3  → 2  (giây)
export const LOGIN_WAIT    = envNum('LOGIN_WAIT',    2);   // ← giảm từ 4  → 2  (giây)

export const HEADLESS = env('HEADLESS', 'false') === 'true';
export const BROWSER  = env('BROWSER', 'chromium');

export const AUTH_STATE_PATH  = path.resolve(__dirname, '../auth/user.json');
export const REPORTS_DIR      = path.resolve(__dirname, '../reports');
export const SCREENSHOTS_DIR  = path.resolve(__dirname, '../screenshots');
export const VIDEOS_DIR       = path.resolve(__dirname, '../videos');
export const LOGS_DIR         = path.resolve(__dirname, '../logs');
export const DATA_DIR         = path.resolve(__dirname, '../data');