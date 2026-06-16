# OLM Web Test Automation

Kiểm thử tự động cho [OLM.vn](https://olm.vn).

## Test framework

Toàn bộ test nằm trong [`olm_playwright_tests/`](olm_playwright_tests/) — Playwright + TypeScript.

```bash
cd olm_playwright_tests
npm install
npx playwright install chromium
npm test
```

Xem chi tiết trong [olm_playwright_tests/README.md](olm_playwright_tests/README.md).

## CI tự động (GitHub Actions)

Khi push lên GitHub, workflow [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) tự chạy:

- **Pull Request** → smoke tests (`@smoke`)
- **Push lên main/master** → full test suite

Cấu hình secrets (tuỳ chọn): `OLM_USERNAME`, `OLM_PASSWORD` trong GitHub repo Settings.

## Tài liệu tham khảo

- [`cấu_trúc_web.md`](cấu_trúc_web.md) — cấu trúc website OLM
- [`element_taker.md`](element_taker.md) — snippet lấy selector từ trình duyệt
