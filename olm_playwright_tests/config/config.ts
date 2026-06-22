import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = (key: string, fallback: string): string => process.env[key] ?? fallback;
const envNum = (key: string, fallback: number): number => {
  const v = process.env[key];
  return v ? Number(v) : fallback;
};

export const BASE_URL = env('BASE_URL', 'https://olm.vn');
export const LOGIN_URL = `${BASE_URL}/dangnhap`;
export const REGISTER_URL = `${BASE_URL}/dang-ky`;
export const HOC_BAI_URL = `${BASE_URL}/hoc-bai`;
export const HOI_DAP_URL = `${BASE_URL}/hoi-dap`;
export const CONTEST_URL = `${BASE_URL}/contestx`;
export const MUA_VIP_URL = `${BASE_URL}/mua-vip`;
export const GIO_HANG_URL = `${BASE_URL}/gio-hang`;
export const CUOC_THI_URL = `${BASE_URL}/cuoc-thi`;
export const THU_VIEN_SO_URL = `${BASE_URL}/thu-vien-so`;
export const SACH_GIAO_KHOA_URL = `${BASE_URL}/thu-vien-so/sach-giao-khoa`;
export const TAP_CHI_URL = `${BASE_URL}/thu-vien-so/tap-chi`;
export const TIN_TUC_URL = `${BASE_URL}/thongtin`;
export const BAI_VIET_URL = `${BASE_URL}/bai-viet`;
export const HOC_TAP_URL = `${BASE_URL}/chu-de-bai-viet/hoc-tap`;
export const THONG_BAO_NEWS_URL = `${BASE_URL}/chu-de-bai-viet/thong-bao`;

export const WAIT_TIMEOUT = envNum('WAIT_TIMEOUT', 15);
export const PAGE_LOAD_WAIT = envNum('PAGE_LOAD_WAIT', 3);
export const LOGIN_WAIT = envNum('LOGIN_WAIT', 4);

export const HEADLESS = env('HEADLESS', 'false') === 'true';
export const BROWSER = env('BROWSER', 'chromium');

export const AUTH_STATE_PATH = path.resolve(__dirname, '../auth/user.json');
export const REPORTS_DIR = path.resolve(__dirname, '../reports');
export const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
export const VIDEOS_DIR = path.resolve(__dirname, '../videos');
export const LOGS_DIR = path.resolve(__dirname, '../logs');
export const DATA_DIR = path.resolve(__dirname, '../data');
