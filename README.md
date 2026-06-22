# OLM Web Test Automation

Kiểm thử tự động cho [OLM.vn](https://olm.vn).

## Test framework

Toàn bộ test nằm trong [`olm_playwright_tests/`](olm_playwright_tests/) — Playwright + TypeScript, cấu trúc chuẩn tester (smoke / regression / e2e).

```bash
cd olm_playwright_tests
cp .env.example .env
npm install
npx playwright install chromium
npm test
```

Xem chi tiết: [olm_playwright_tests/README.md](olm_playwright_tests/README.md)

## CI tự động

Workflow [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml):

- **Pull Request** → `npm run test:smoke`
- **Push main/master** → `npm test`

## Tài liệu tham khảo

- [`cấu_trúc_web.md`](cấu_trúc_web.md) — cấu trúc website OLM
- [`element_taker.md`](element_taker.md) — snippet lấy selector từ trình duyệt
