// Hằng số – Selectors, Maps, Skip patterns

export const LOGIN_USERNAME_SELECTORS = [
  'input[name="username"]',
  '#username',
  "input[type='text']",
];

export const LOGIN_PASSWORD_SELECTORS = [
  'input[name="password"]',
  '#password',
  "input[type='password']",
];

export const LOGIN_SUBMIT_SELECTORS = [
  "button[type='submit']",
  "xpath=//button[contains(text(),'Đăng nhập')]",
  'form button',
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
  '/gioi-thieu',
  '/blog',
  '/tin-tuc',
  'dangnhap',
  'dang-ky',
  'lien-he',
  'javascript:',
  '#',
  '/lop-',
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
