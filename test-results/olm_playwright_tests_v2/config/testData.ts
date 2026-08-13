import fs from 'fs';
import path from 'path';
import testUsers from '../data/test-users.json';
import { DATA_DIR, BASE_URL } from './config.js';
import { WORKER_ACCOUNTS } from '../global-setup.js';

export interface AccountInfo {
  username: string;
  password: string;
  role: string;
  vip: boolean;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterFormData {
  ho_ten: string;
  username: string;
  email: string;
  password: string;
  sdt: string;
}

interface TestUsersJson {
  vip_student: AccountInfo;
  school: AccountInfo;
  normal_student: AccountInfo;
  existing_account: { username: string; email: string };
}

// ─── FIX: đồng bộ nguồn tài khoản với global-setup.ts ─────────────────────
// Trước đây hàm này CHỈ đọc OLM_VIP_USERNAME / OLM_NORMAL_USERNAME (một bộ
// biến RIÊNG, không liên quan tới OLM_ADMIN_*/OLM_STUDENT_VIP_*/... mà
// global-setup.ts + WORKER_ACCOUNTS dùng). File .env.debug thực tế chỉ khai
// báo bộ biến của global-setup.ts → 2 biến OLM_VIP_USERNAME/OLM_NORMAL_USERNAME
// luôn undefined → ACCOUNTS/TEST_USERS/LOGIN_TEST_CASES ở dưới âm thầm rơi về
// tài khoản HARD-CODE trong data/test-users.json (hoàn toàn khác tài khoản
// bạn khai báo trong .env) — đây là nguyên nhân chính gây "lẫn tài khoản".
//
// Giờ ưu tiên theo thứ tự:
//   1) Biến legacy OLM_VIP_USERNAME/OLM_NORMAL_USERNAME nếu bạn CHỦ ĐỘNG set
//      (giữ tương thích ngược cho ai đang dùng bộ biến cũ).
//   2) Tài khoản tương ứng trong WORKER_ACCOUNTS (global-setup.ts) — tức
//      OLM_STUDENT_VIP_*/OLM_SCHOOL_*/OLM_STUDENT_NO_VIP_* trong .env hiện tại
//      của bạn — MIỄN LÀ đã set thật (không phải giá trị fallback_* giả).
//   3) Cuối cùng mới rơi về data/test-users.json (chỉ khi hoàn toàn không có
//      gì được khai báo ở cả 2 nơi trên).
function findWorkerAccount(label: string) {
  return WORKER_ACCOUNTS.find((a) => a.label === label);
}

/** true nếu là tài khoản thật (đã set qua env), false nếu là chuỗi fallback_* giả của global-setup.ts */
function isRealAccount(username: string): boolean {
  return !username.startsWith('fallback_');
}

function loadAccounts(): Record<string, AccountInfo> {
  const raw = testUsers as TestUsersJson;

  const studentVip = findWorkerAccount('student_vip');
  const studentNoVip = findWorkerAccount('student_no_vip');

  return {
    vip_student: {
      ...raw.vip_student,
      username:
        process.env.OLM_VIP_USERNAME ??
        (studentVip && isRealAccount(studentVip.username) ? studentVip.username : raw.vip_student.username),
      password:
        process.env.OLM_VIP_PASSWORD ??
        (studentVip && isRealAccount(studentVip.username) ? studentVip.password : raw.vip_student.password),
    },
    school: {
      ...raw.school,
      // OLM_SCHOOL_USERNAME/PASSWORD dùng CHUNG tên biến với WORKER_ACCOUNTS
      // (global-setup.ts) nên vốn đã khớp nhau, không cần đổi.
      username: process.env.OLM_SCHOOL_USERNAME ?? raw.school.username,
      password: process.env.OLM_SCHOOL_PASSWORD ?? raw.school.password,
    },
    normal_student: {
      ...raw.normal_student,
      username:
        process.env.OLM_NORMAL_USERNAME ??
        (studentNoVip && isRealAccount(studentNoVip.username) ? studentNoVip.username : raw.normal_student.username),
      password:
        process.env.OLM_NORMAL_PASSWORD ??
        (studentNoVip && isRealAccount(studentNoVip.username) ? studentNoVip.password : raw.normal_student.password),
    },
  };
}

export const ACCOUNTS = loadAccounts();

export const USERNAME = ACCOUNTS.vip_student.username;
export const PASSWORD = ACCOUNTS.vip_student.password;

export const EXISTING_ACCOUNT = {
  username: ACCOUNTS.vip_student.username || (testUsers as TestUsersJson).existing_account.username,
  email: (testUsers as TestUsersJson).existing_account.email,
};

export const LOGIN_TEST_CASES: Record<string, LoginCredentials> = {
  vip_valid: { username: ACCOUNTS.vip_student.username, password: ACCOUNTS.vip_student.password },
  school_valid: { username: ACCOUNTS.school.username, password: ACCOUNTS.school.password },
  normal_valid: {
    username: ACCOUNTS.normal_student.username,
    password: ACCOUNTS.normal_student.password,
  },
  wrong_password: { username: ACCOUNTS.vip_student.username, password: 'SaiMatKhau123@' },
  wrong_username: { username: 'user_khong_ton_tai_xyz', password: ACCOUNTS.vip_student.password },
  empty_username: { username: '', password: ACCOUNTS.vip_student.password },
  empty_password: { username: ACCOUNTS.vip_student.username, password: '' },
  empty_both: { username: '', password: '' },
  sql_injection: { username: "' OR '1'='1", password: "' OR '1'='1" },
  whitespace_only: { username: '   ', password: '   ' },
  special_characters: { username: '!@#$%^&*()_+', password: '!@#$%^&*()_+' },
};

export const SAMPLE_LESSON_URLS: Record<number, string> = {
  1: `${BASE_URL}/chu-de/toan-lop-1`,
  2: `${BASE_URL}/chu-de/toan-lop-2`,
};

/** Bài luyện tập Toán 9 — có iframe câu hỏi tương tác (dùng regression LessonPage) */
export const SAMPLE_LUYEN_TAP_URL =
  `${BASE_URL}/chu-de/giai-he-hai-phuong-trinh-bang-phuong-phap-the-2377747568`;

export const SAMPLE_COURSE_URLS: Record<number, string> = {
  1: `${BASE_URL}/lop-1`,
  2: `${BASE_URL}/lop-2`,
};

export const INVALID_URLS = {
  lesson_not_found: `${BASE_URL}/chu-de/khong-ton-tai-12345`,
  course_not_found: `${BASE_URL}/lop-99`,
};

export const REGISTER_DATA: RegisterFormData = {
  ho_ten: 'Test User',
  username: `test_user_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  sdt: '0901234567',
};

export const REGISTER_TEST_CASES: Record<string, RegisterFormData> = {
  valid_full: {
    ho_ten: 'Nguyen Van Test',
    username: 'test_user_valid_001',
    email: 'test_valid_001@example.com',
    password: 'ValidPass123!',
    sdt: '0912345678',
  },
  valid_minimal: {
    ho_ten: 'Nguyen Van Minimal',
    username: 'test_user_minimal_001',
    email: 'test_minimal_001@example.com',
    password: 'MinimalPass123!',
    sdt: '',
  },
  empty_fullname: {
    ho_ten: '',
    username: 'test_user_no_name',
    email: 'test_no_name@example.com',
    password: 'TestPass123!',
    sdt: '0912345001',
  },
  empty_username: {
    ho_ten: 'Test No Username',
    username: '',
    email: 'test_no_username@example.com',
    password: 'TestPass123!',
    sdt: '0912345002',
  },
  invalid_email_format: {
    ho_ten: 'Test Invalid Email',
    username: 'test_invalid_email_001',
    email: 'khong-phai-email',
    password: 'TestPass123!',
    sdt: '0912345003',
  },
  empty_email: {
    ho_ten: 'Test Empty Email',
    username: 'test_empty_email_001',
    email: '',
    password: 'TestPass123!',
    sdt: '0912345004',
  },
  weak_password: {
    ho_ten: 'Test Weak Password',
    username: 'test_weak_pwd_001',
    email: 'test_weak_pwd_001@example.com',
    password: '123',
    sdt: '0912345005',
  },
  empty_password: {
    ho_ten: 'Test Empty Password',
    username: 'test_empty_pwd_001',
    email: 'test_empty_pwd_001@example.com',
    password: '',
    sdt: '0912345006',
  },
  invalid_phone: {
    ho_ten: 'Test Invalid Phone',
    username: 'test_invalid_phone_001',
    email: 'test_invalid_phone_001@example.com',
    password: 'TestPass123!',
    sdt: 'abc-not-a-phone',
  },
  duplicate_email: {
    ho_ten: 'Test Duplicate Email',
    username: 'test_duplicate_email_001',
    email: EXISTING_ACCOUNT.email,
    password: 'TestPass123!',
    sdt: '0912345007',
  },
  duplicate_username: {
    ho_ten: 'Test Duplicate Username',
    username: EXISTING_ACCOUNT.username,
    email: 'test_duplicate_username_001@example.com',
    password: 'TestPass123!',
    sdt: '0912345008',
  },
  all_empty: { ho_ten: '', username: '', email: '', password: '', sdt: '' },
};

export const TEST_USERS = {
  VIP: ACCOUNTS.vip_student,
  SCHOOL: ACCOUNTS.school,
  NORMAL: ACCOUNTS.normal_student,
} as const;

export function loadLessonsByGrade(): Record<string, unknown[]> {
  const filePath = path.join(DATA_DIR, 'lessons-by-grade.json');
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown[]>;
}