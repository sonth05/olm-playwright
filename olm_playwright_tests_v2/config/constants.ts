// Hằng số – Selectors, Maps, Skip patterns
// Cập nhật 2026-06-29: selector khớp DOM thực tế olm.vn (inspect từ HTML paste)

// ── Login page ──────────────────────────────────────────────────────────────
// DOM thực tế: <input id="username" name="username" placeholder="Tên đăng nhập hoặc Email">
export const LOGIN_USERNAME_SELECTORS = [
  '#username',
  'input[name="username"]',
  'input[placeholder*="Tên đăng nhập"]',
  'input[placeholder*="đăng nhập"]',
];

// DOM thực tế: <input id="password" name="password" type="password" placeholder="Mật khẩu">
export const LOGIN_PASSWORD_SELECTORS = [
  '#password',
  'input[name="password"]',
  'input[type="password"]',
];

export const LOGIN_SUBMIT_SELECTORS = [
  "button[type='submit']",
  "xpath=//button[contains(text(),'Đăng nhập')]",
  'form button',
];

// ── Register page ───────────────────────────────────────────────────────────
// DOM thực tế từ /dang-ky (paste 2026-06-29):
//   #name     placeholder="Nhập họ và tên"
//   #username placeholder="Nhập tên đăng nhập"
//   #tel      placeholder="Nhập số điện thoại"
//   #email    placeholder="Nhập email"
//   #password placeholder="Nhập mật khẩu"
//   #btn-submit-register  class="tw-olm-btn-primary-56"
export const REGISTER_INPUT_FULLNAME = [
  '#name',
  'input[name="name"]',
  'input[placeholder="Nhập họ và tên"]',
];
export const REGISTER_INPUT_USERNAME = [
  '#username',
  'input[name="username"]',
  'input[placeholder="Nhập tên đăng nhập"]',
];
export const REGISTER_INPUT_PHONE = [
  '#tel',
  'input[name="tel"]',
  'input[placeholder="Nhập số điện thoại"]',
];
export const REGISTER_INPUT_EMAIL = [
  '#email',
  'input[name="email"]',
  'input[placeholder="Nhập email"]',
];
export const REGISTER_INPUT_PASSWORD = [
  '#password',
  'input[name="password"]',
  'input[placeholder="Nhập mật khẩu"]',
];
export const REGISTER_SUBMIT_BTN = [
  '#btn-submit-register',
  "button:has-text('Đăng ký')",
  "button[type='submit']",
];
// Error boxes OLM: id="box-error-{field}" + class="tw-hidden" khi không có lỗi
// Khi có lỗi → class "tw-hidden" bị xóa đi
export const REGISTER_ERROR_SELECTORS = [
  '#box-error-name:not(.tw-hidden)',
  '#box-error-username:not(.tw-hidden)',
  '#box-error-tel:not(.tw-hidden)',
  '#box-error-email:not(.tw-hidden)',
  '#box-check-level-password:not(.tw-hidden)',
  '#box-response-register:not(.tw-hidden)',
  '.error-message:not(.tw-hidden)',
  '.tw-text-error-default:not(.tw-hidden)',
];

export const CARD_SELECTORS = [
  'div.col-4.p-0.mb-4',
  'div.col-4.p-0.mb-4.d-flex',
  "div[class*='col-4'][class*='mb-4']",
  'div.col-3.p-0.mb-4',
  "div[class*='col-'][class*='mb-4']",
  '.card.shadow-xss',
];

export const LESSON_COL_SELECTORS = [
  "div.row.mx-0.my-3 > div[class*='col-']",
  ".card-body div[class*='col-']",
  "div[class*='col-sm']",
  "div[class*='col-md']",
];

export const COURSE_TAB_SELECTORS = [
  '#tab-lessons-all',
  "a[href='#tab-lessons-all']",
  "a[href*='tab-lesson']",
  "a[data-tab*='lesson']",
  ".nav-link[href*='lesson']",
  "xpath=//a[contains(text(),'Nội dung') or contains(text(),'Bài học') or contains(text(),'Tất cả')]",
];

export const SUBJECT_MAP: Record<string, string> = {
  'toán': 'Toán',
  'tiếng việt': 'Tiếng Việt',
  'tiếng anh': 'Tiếng Anh',
  'vật lí': 'Vật lí',
  'vật lý': 'Vật lý',
  'hóa học': 'Hóa học',
  'sinh học': 'Sinh học',
  'lịch sử': 'Lịch sử',
  'địa lí': 'Địa lí',
  'tin học': 'Tin học',
  'ngữ văn': 'Ngữ văn',
  'công nghệ': 'Công nghệ',
  'âm nhạc': 'Âm nhạc',
  'mĩ thuật': 'Mĩ thuật',
  'khoa học': 'Khoa học',
  'tự nhiên': 'KHTN',
  'xã hội': 'KHXH',
  gdcd: 'GDCD',
  gdtc: 'GDTC',
};

export const SKIP_HREFS = [
  '/gioi-thieu', '/blog', '/tin-tuc', 'dangnhap', 'dang-ky',
  'lien-he', 'javascript:', '#', '/lop-',
];

export const LESSON_TYPE_KEYWORDS: Record<string, string> = {
  ppt: 'Slide PPT',
  video: 'Video',
  'bài tập': 'Bài tập',
  'kiểm tra': 'Kiểm tra',
  'trắc nghiệm': 'Trắc nghiệm',
  'cuối tuần': 'Bài tập cuối tuần',
  'cuối chủ đề': 'BT cuối chủ đề',
};

export const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);