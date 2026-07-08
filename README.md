# OLM Web Test Automation — Playwright

Kiểm thử tự động cho [OLM.vn](https://olm.vn) sử dụng **Playwright** + **TypeScript**.

---

## 📋 Cấu Trúc Dự Án

```
olm_playwright_tests/
├── modules/                          # Tổ chức test theo vai trò người dùng
│   ├── api/                         # Test API (authentication, contests, learning, etc.)
│   │   └── tests/
│   ├── dung-chung/                 # Test chung (chưa đăng nhập / tất cả vai trò)
│   │   ├── auth/                   # Đăng nhập, đăng ký
│   │   ├── community/              # Hỏi đáp, thảo luận
│   │   ├── digital-library/        # Thư viện số
│   │   ├── homepage/               # Trang chủ
│   │   ├── news/                   # Tin tức
│   │   ├── thiet-lap-cau-hinh/    # Cài đặt, cấu hình
│   │   └── thoi-khoa-bieu/        # Thời khóa biểu
│   ├── giao-vien/                  # Test cho giáo viên
│   │   ├── bao-cao-thong-ke/      # Báo cáo thống kê
│   │   ├── diem-danh/              # Điểm danh
│   │   ├── giao-bai/               # Giao bài tập
│   │   ├── kiem-tra-danh-gia/     # Kiểm tra, đánh giá
│   │   ├── lien-lac-dien-tu/      # Liên lạc điện tử
│   │   ├── ngan-hang-cau-hoi-ma-tran/  # Ngân hàng câu hỏi, ma trận
│   │   ├── quan-ly-ho-so/          # Quản lý hồ sơ
│   │   ├── quan-ly-hoc-lieu/      # Quản lý học liệu
│   │   ├── quan-ly-lop-hoc/       # Quản lý lớp học
│   │   └── rbac-phan-quyen/       # Quản lý quyền hạn
│   ├── hoc-sinh/                   # Test cho học sinh
│   │   ├── contest/                # Cuộc thi, Contest
│   │   ├── kids-zone/              # Kids Zone
│   │   ├── learning-core/          # Học bài (lõi)
│   │   └── payment/                # Thanh toán, mua VIP
│   └── cross-role-flows/           # Test luồng đa vai trò
│       └── tests/                  # Giao bài → Làm bài, Điểm danh → Thống kê, etc.
├── core/                            # Các utility, config, fixture chung toàn bộ test
│   ├── automation/                 # Engine tự động: LamBaiEngine, OlmUtils
│   ├── config/                     # Config chung
│   ├── fixtures/                   # Fixture (dual-role, role)
│   └── shared-pages/              # Base class, component chung
├── config/                          # Cấu hình chính của test
│   ├── config.ts                   # Đường dẫn, tham số chính
│   ├── constants.ts                # Hằng số (selectors, thông điệp)
│   └── testData.ts                 # Dữ liệu test
├── fixtures/                        # Fixture quy tắc Playwright
│   └── auth.fixture.ts             # Setup & teardown
├── auth/                            # Lưu session giữa các test
│   ├── user.json                   # Session cho vai trò người dùng
│   └── worker-*.json              # Session cho 6 workers
├── data/                            # Dữ liệu test (lessons, users, etc.)
├── scripts/                         # Script chạy test nhanh
├── utils/                           # Helper, utility function
│   ├── csvReporter.ts             # Reporter xuất CSV
│   ├── helpers.ts                 # Helper function chung
│   └── visualComparison.ts        # So sánh hình ảnh
├── global-setup.ts                 # Cấu hình trước khi chạy test
├── playwright.config.ts            # Cấu hình Playwright (critical!)
├── package.json                    # Dependencies, scripts
└── tsconfig.json                   # TypeScript config
```

---

## 📌 Một Số File Quan Trọng

### **playwright.config.ts** (Cấu hình Playwright)
- ✅ **testDir & testMatch**: Định nghĩa đường dẫn file test (`tests/**/*.spec.ts` & `modules/**/tests/**/*.spec.ts`)
- ✅ **2 Projects**:
  - `chromium`: Chạy các test smoke, regression, e2e nhẹ (loại trừ bài tập nặng)
  - `bai-tap`: Chỉ chạy test giao bài → làm bài, chạy tuần tự 1 worker
- ✅ **Workers**: 6 (local) / 3 (CI) — mỗi worker dùng 1 session riêng → không conflict
- ✅ **Timeout**: 60s (test), 20s (action), 15s (expect)
- ✅ **Reporter**: HTML, CSV, list

### **core/** — Công cụ chung
- `shared-pages/BasePage.ts`: Base class cho tất cả page object
- `shared-pages/HeaderComponent.ts`: Component header chung
- `automation/LamBaiEngine.ts`: Engine tự động làm bài (làm bài trắc nghiệm, điền khuyết, điền chỗ trống, etc.)
- `automation/OlmUtils.ts`: Utility function cho OLM (click element, wait, etc.)

### **fixtures/** — Fixture Playwright
- `auth.fixture.ts`: Setup authentication, reuse session cho mỗi worker

### **config/** — Cấu hình
- `config.ts`: BASE_URL, REPORTS_DIR, WORKER_ACCOUNTS
- `constants.ts`: Selector, message, expected text
- `testData.ts`: Test data (tài khoản, bài học, etc.)

---

## 🧪 Các Loại Test

| Loại | Pattern | Mục Đích | Ví Dụ |
|------|---------|----------|-------|
| **Smoke** | `*.smoke.spec.ts` | Kiểm tra chức năng cơ bản, nhanh | Đăng nhập thành công |
| **Regression** | `*.regression.spec.ts` | Kiểm tra toàn diện, chậm hơn | Giao bài → Kiểm tra điểm danh → Thống kê |
| **E2E** | `*.e2e.spec.ts` | Luồng người dùng từ đầu đến cuối | Giao bài → Làm bài → Nộp bài → Xem kết quả |
| **Minimal-Diagnostic** | `*.minimal-diagnostic.spec.ts` | Test cực nhẹ để kiểm tra API | Kiểm tra API trả về dữ liệu hợp lệ |
| **API** | `modules/api/tests/` | Test API endpoints | Kiểm tra authentication API, learning API |

---

## 🚀 Hướng Dẫn Setup & Chạy Test

### 1. **Cài đặt ban đầu**

```bash
cd olm_playwright_tests

# Copy file .env
cp .env.example .env

# Cài đặt dependencies
npm install

# Cài đặt Chromium
npx playwright install chromium
```

### 2. **Chạy tất cả test**

```bash
# Chạy tất cả test (smoke + regression + e2e)
npm test

# Hoặc chi tiết hơn:
npx playwright test
```

### 3. **Chạy từng loại test**

```bash
# Smoke test (nhanh)
npm run test:smoke
# Hoặc: npx playwright test --grep="smoke"

# Regression test (chậm, toàn diện)
npm run test:regression
# Hoặc: npx playwright test --grep="regression"

# E2E test
npm run test:e2e
# Hoặc: npx playwright test --grep="e2e"

# API test
npm run test:api
# Hoặc: npx playwright test modules/api/tests/
```

### 4. **Chạy test cho một feature/module cụ thể**

```bash
# Chỉ test giao viên
npx playwright test modules/giao-vien/

# Chỉ test học sinh
npx playwright test modules/hoc-sinh/

# Chỉ test "Quản lý học liệu"
npx playwright test modules/giao-vien/quan-ly-hoc-lieu/

# Chỉ test "Giao bài → Làm bài" (cross-role)
npx playwright test modules/cross-role-flows/tests/giao-bai-den-lam-bai.e2e.spec.ts
```

### 5. **Chạy test với option tùy chỉnh**

```bash
# Chạy test headless + debug
npx playwright test --debug

# Chạy test và mở UI mode (xem step by step)
npx playwright test --ui

# Chạy test 1 worker (tuần tự, chậm nhưng dễ debug)
npx playwright test --workers=1

# Chạy test với base URL custom
npx playwright test --config=playwright.config.ts --base-url=https://staging-olm.vn
```

### 6. **Xem kết quả test**

```bash
# Mở HTML report
npx playwright show-report

# Report nằm tại: reports/html/index.html
```

---

## 📊 Kết Quả Test & Report

### **HTML Report**
- **Đường dẫn**: `reports/html/index.html`
- **Nội dung**: Kết quả test, screenshot, video, trace
- **Mở bằng**: `npm run report` hoặc `npx playwright show-report`

### **CSV Report**
- **Đường dẫn**: `reports/test_report_[date].csv`
- **Nội dung**: Tên test, kết quả (PASS/FAIL), thời gian, error message

### **Log & Artifacts**
- **Screenshots**: `reports/test-results/[test-name]/test-failed-1.png` (khi test fail)
- **Videos**: `reports/test-results/[test-name]/video.webm` (giữ lại khi fail)
- **Trace**: `reports/test-results/[test-name]/trace.zip` (debug, xem step by step)

---

## ⚙️ Cấu Hình Quan Trọng (playwright.config.ts)

```typescript
// 2 Projects: chromium + bai-tap
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    testIgnore: [/giao-bai-den-lam-bai\.e2e\.spec\.ts$/],  // ← loại trừ test nặng
  },
  {
    name: 'bai-tap',  // ← chạy sau chromium xong
    testMatch: [/giao-bai-den-lam-bai\.e2e\.spec\.ts$/],
    dependencies: ['chromium'],
    fullyParallel: false,
    workers: 1,
    timeout: 180_000,  // ← timeout dài hơn vì test nặng
  },
]

// Timeout
timeout: 60_000         // mỗi test 60s
expect: { timeout: 15_000 }  // assertion 15s
actionTimeout: 20_000   // action 20s
navigationTimeout: 60_000   // navigate 60s
```

---

## 🔐 Session & Authentication

### **Cơ chế Reuse Session**
- Mỗi worker chạy 1 session riêng: `auth/worker-0.json`, `auth/worker-1.json`, ..., `auth/worker-5.json`
- Session được lưu lại sau khi login lần đầu → các test sau dùng lại (nhanh hơn)
- Setup: `global-setup.ts` → tạo session nếu chưa có

### **Các vai trò**
```typescript
// config/config.ts
WORKER_ACCOUNTS = [
  { username: 'gv1@gmail.com', password: 'password', role: 'giao-vien' },
  { username: 'hs1@gmail.com', password: 'password', role: 'hoc-sinh' },
  { username: 'admin@gmail.com', password: 'password', role: 'admin' },
  // ... 6 accounts cho 6 workers
]
```

---

## 📝 Viết Test Mới

### **Ví dụ: Test Smoke cho Giao Bài**

```typescript
// modules/giao-vien/giao-bai/tests/giao-bai.smoke.spec.ts
import { test, expect } from '@playwright/test';
import { assignmentPage } from '../pages/AssignmentPage';  // ← page object

test.describe('Giao Bài [Smoke]', () => {
  test.use({ storageState: 'auth/worker-0.json' });  // ← dùng session worker 0

  test('should display assignment list', async ({ page }) => {
    await assignmentPage.goto(page);
    await expect(assignmentPage.assignmentTable).toBeVisible();
  });

  test('should create new assignment', async ({ page }) => {
    await assignmentPage.goto(page);
    await assignmentPage.clickCreateButton();
    await assignmentPage.fillForm({ title: 'Bài tập 1', dueDate: '2024-12-31' });
    await assignmentPage.submitForm();
    await expect(assignmentPage.successMessage).toBeVisible();
  });
});
```

### **Ví dụ: Page Object (AssignmentPage)**

```typescript
// modules/giao-vien/giao-bai/pages/AssignmentPage.ts
import { Page } from '@playwright/test';
import { BasePage } from '../../../core/shared-pages/BasePage';
import { ASSIGNMENT_SELECTORS } from '../../../config/constants';

export class AssignmentPage extends BasePage {
  constructor() {
    super();
  }

  // ── Selector ───────────────────────────────────────
  get assignmentTable() {
    return this.page.locator(ASSIGNMENT_SELECTORS.TABLE);
  }

  get createButton() {
    return this.page.locator(ASSIGNMENT_SELECTORS.CREATE_BUTTON);
  }

  // ── Action ────────────────────────────────────────
  async goto(page: Page) {
    this.page = page;
    await page.goto('/teacher/assignments');
    await this.assignmentTable.waitFor({ state: 'visible' });
  }

  async clickCreateButton() {
    await this.createButton.click();
  }

  async fillForm(data: { title: string; dueDate: string }) {
    await this.page.fill(ASSIGNMENT_SELECTORS.TITLE_INPUT, data.title);
    await this.page.fill(ASSIGNMENT_SELECTORS.DUE_DATE_INPUT, data.dueDate);
  }

  async submitForm() {
    await this.page.click(ASSIGNMENT_SELECTORS.SUBMIT_BUTTON);
  }

  get successMessage() {
    return this.page.locator(ASSIGNMENT_SELECTORS.SUCCESS_MESSAGE);
  }
}

export const assignmentPage = new AssignmentPage();
```

---

## 🔧 CI/CD Integration

### **.github/workflows/playwright.yml**

```yaml
# Chạy Smoke test khi Pull Request
- name: Run smoke tests
  run: npm run test:smoke

# Chạy tất cả test khi push main
- name: Run all tests
  run: npm test
```

---

## 📚 Tài Liệu Tham Khảo

- **Playwright Docs**: https://playwright.dev
- **OLM Website**: https://olm.vn
- **Cấu trúc website**: [`cấu_trúc_web.md`](../cấu_trúc_web.md)
- **Lấy selector**: [`element_taker.md`](../element_taker.md)
- **Feature Registry**: [`FEATURE-REGISTRY.md`](./FEATURE-REGISTRY.md)

---

## 🆘 Troubleshooting

### **Test timeout hoặc fail**
1. Tăng timeout trong `playwright.config.ts`
2. Kiểm tra network (chậm → tăng navigationTimeout)
3. Kiểm tra selector (có thay đổi UI không?)

### **Session bị lỗi**
1. Xóa folder `auth/` → Playwright sẽ tạo lại
2. Kiểm tra tài khoản test (still valid?)
3. Kiểm tra BASE_URL trong `.env`

### **Worker bị crash**
1. Giảm số workers: `WORKERS=3 npm test`
2. Kiểm tra memory: `npm test -- --workers=1`

### **Xem debug chi tiết**
```bash
HEADED=true npx playwright test --debug
```

---

## 📞 Support

Nếu có câu hỏi, vui lòng liên hệ team automation hoặc tạo issue trên repository.

Happy Testing! 🎉