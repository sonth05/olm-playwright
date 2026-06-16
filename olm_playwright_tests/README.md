# OLM Playwright Tests (TypeScript)

Framework kiểm thử tự động cho [OLM.vn](https://olm.vn) dùng Playwright + TypeScript.

## Cấu trúc

```
olm_playwright_tests/
├── src/
│   ├── config/       # URL, selectors, test data
│   ├── pages/        # Page Object Model
│   ├── utils/        # Logger, CSV reporter, helpers
│   └── scripts/      # Script automation độc lập
├── tests/            # Playwright test specs (106 tests)
├── reports/          # CSV + HTML report (tự tạo khi chạy)
└── playwright.config.ts
```

## Cài đặt

```bash
cd olm_playwright_tests
npm install
npx playwright install chromium
```

## Chạy test

```bash
# Toàn bộ test
npm test

# Chỉ smoke tests
npm run test:smoke

# Chỉ regression tests
npm run test:regression

# Có giao diện trình duyệt
npm run test:headed

# Một nhóm test
npm run test:login

# Xem báo cáo HTML
npm run report
```

## Script automation

```bash
# Thi thử THPT Sinh học
npm run thi-thu

# Bài luyện tập Toán 9 - Phương pháp thế
npm run toan9
```

## Tags test

Dùng grep để lọc: `@smoke`, `@regression`, `@login`, `@registration`, `@header`, `@navigation`, `@contest`, `@payment`, `@hoi_dap`, `@library`, `@news`, `@fun_contest`

## Biến môi trường

- `HEADLESS=true` — chạy không hiện cửa sổ trình duyệt (local)
- `CI=true` — bật retry tự động; trên CI mặc định chạy headless
- `OLM_USERNAME` / `OLM_PASSWORD` — ghi đè tài khoản test (dùng GitHub Secrets trên CI)

## CI (GitHub Actions)

Workflow: `.github/workflows/playwright.yml`

| Sự kiện | Test chạy |
|---------|-----------|
| Pull Request → `main` / `master` | `@smoke` (~17 test) |
| Push → `main` / `master` | Toàn bộ suite (106 test) |

Sau khi push repo lên GitHub, vào **Settings → Secrets and variables → Actions** và thêm (tuỳ chọn):

- `OLM_USERNAME` — tài khoản test OLM
- `OLM_PASSWORD` — mật khẩu test

Nếu không cấu hình secrets, CI dùng giá trị mặc định trong `testData.ts`.

Khi test fail, tải báo cáo tại tab **Actions → run → Artifacts** (`playwright-smoke-report` hoặc `playwright-full-report`).

## Báo cáo

- HTML report: `reports/html/`
- CSV report: `reports/test_report_*.csv`
- Video / screenshot / trace khi fail: `reports/test-results/`
