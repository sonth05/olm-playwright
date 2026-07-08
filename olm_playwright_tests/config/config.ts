import dotenv from 'dotenv';
import path from 'path';

// ─── Chọn file env theo môi trường ──────────────────────────────────────────
// Mặc định vẫn đọc '.env' (bản chính olm.vn) để không phá vỡ luồng cũ.
// Chạy nhắm tới dev.olm.vn bằng cách set biến ENV_FILE trước khi chạy test, ví dụ:
//   ENV_FILE=.env.dev npx playwright test
// Chạy nhắm tới debug.olm.vn (bản dev đưa lên test mẫu TRƯỚC dev.olm.vn):
//   ENV_FILE=.env.debug npx playwright test
// (đã có sẵn script "test:dev*" và "test:debug*" tương ứng trong package.json)
const envFile = process.env.ENV_FILE ?? '.env';
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