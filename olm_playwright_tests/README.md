# OLM Playwright Tests (TypeScript)

Framework kiểm thử tự động cho [OLM.vn](https://olm.vn) — cấu trúc chuẩn tester.

## Cấu trúc

```
olm_playwright_tests/
├── .env.example              # Mẫu biến môi trường
├── playwright.config.ts
├── global-setup.ts           # Tạo auth/user.json
├── auth/                     # storageState đăng nhập
├── config/                   # URL, selectors, test data
├── data/                     # JSON test data
├── fixtures/                 # Custom fixtures (auth)
├── components/               # Component tái sử dụng
├── pages/                    # Page Object Model
├── tests/
│   ├── smoke/                # Test nhanh (~17)
│   ├── regression/           # Test đầy đủ theo module
│   ├── e2e/                  # User journey / flow
│   └── api/                  # API (placeholder)
├── utils/                    # Helpers, logger, CSV, visual
├── scripts/                  # Automation độc lập
├── reports/                  # HTML + CSV (tự sinh)
├── screenshots/ videos/ logs/
└── package.json
```

## Cài đặt

```bash
cd olm_playwright_tests
cp .env.example .env          # chỉnh credentials nếu cần
npm install
npx playwright install chromium
```

## Chạy test

```bash
npm test                 # Toàn bộ (smoke + regression + e2e)
npm run test:smoke       # tests/smoke/
npm run test:regression  # tests/regression/
npm run test:e2e         # tests/e2e/
npm run test:headed      # Có giao diện trình duyệt
npm run report           # Xem HTML report
```

## Script automation

```bash
npm run thi-thu          # Thi thử THPT Sinh học
npm run toan9            # Bài luyện tập Toán 9
npm run auto-learning    # Học theo lessons-by-grade.json
```

## Auth fixture

`global-setup.ts` đăng nhập 1 lần → lưu `auth/user.json`.

Test cần session sẵn:

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('Ví dụ', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/hoc-bai');
});
```

## Biến môi trường (.env)

| Biến | Mô tả |
|------|-------|
| `BASE_URL` | URL gốc OLM |
| `OLM_VIP_USERNAME` / `OLM_VIP_PASSWORD` | Tài khoản VIP |
| `OLM_SCHOOL_USERNAME` / `OLM_SCHOOL_PASSWORD` | Tài khoản trường |
| `OLM_NORMAL_USERNAME` / `OLM_NORMAL_PASSWORD` | Học sinh thường |
| `HEADLESS` | `true` / `false` |
| `WORKERS` | Số worker song song |

## CI (GitHub Actions)

| Sự kiện | Lệnh |
|---------|------|
| Pull Request | `npm run test:smoke` |
| Push main/master | `npm test` |

GitHub Secrets: `OLM_VIP_USERNAME`, `OLM_VIP_PASSWORD`, `OLM_SCHOOL_*`, `OLM_NORMAL_*`

## Báo cáo

- HTML: `reports/html/`
- CSV: `reports/test_report_*.csv`
- Artifacts fail: `reports/test-results/` (video, trace, screenshot)
