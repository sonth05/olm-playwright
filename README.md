# OLM-Auto_test

Bộ kiểm thử tự động cho [OLM.vn](https://olm.vn) — nền tảng giáo dục trực tuyến. Dùng **Playwright + TypeScript** (Page Object Model) cho web/API, kèm một script **Python/Selenium** cũ dùng để crawl dữ liệu.

Repo gồm **2 dự án Playwright độc lập, song song**, không phải một dự án duy nhất:

| Thư mục | Môi trường target | Vai trò |
|---|---|---|
| `olm_playwright_tests_v1/` | `olm.vn` (bản thật) / `dev.olm.vn` | Bộ test "ổn định" — bao phủ đầy đủ nhất các module giáo viên/học sinh |
| `olm_playwright_tests_v2/` | `debug.olm.vn` | Bộ test "đuổi theo" các tính năng đang phát triển trên môi trường debug (học liệu V2, quản lý giáo viên...) trước khi lên `dev` rồi lên bản thật |

Hai thư mục có chung kiến trúc (core, config, fixtures, modules...) nhưng **không dùng chung `node_modules`/dependencies** — mỗi thư mục là một dự án Node độc lập với `package.json` riêng.

---

## 📁 Cấu trúc repo (mức gốc)

```
OLM-Auto_test/
├── olm_playwright_tests_v1/     # Dự án Playwright #1 — olm.vn / dev.olm.vn
├── olm_playwright_tests_v2/     # Dự án Playwright #2 — debug.olm.vn
├── postman/                     # Postman collection (Postman VCS/.yaml format) — Auth, Contest, Digital Library, Learning, News, Payment, Q&A
├── .postman/resources.yaml      # Cấu hình workspace Postman
├── .github/workflows/           # CI (playwright.yml)
├── olm_crawler.py               # Script Python/Selenium cũ — crawl bài học OLM ra Excel (không thuộc bộ Playwright)
├── cấu_trúc_web.md              # Ghi chú cấu trúc/menu của website OLM (tài liệu tham khảo khi viết page object)
├── element_taker.md             # Ghi chú cách lấy selector/element trên OLM
├── package.json                 # Chỉ chứa devDependency `typescript` dùng chung ở mức repo (không phải nơi chạy test)
└── README.md                    # File này
```

> Lưu ý: `package.json` và `playwright.config.ts` ở thư mục gốc **không phải nơi chạy test** — mỗi lệnh `npm test`/`npx playwright test` phải chạy **bên trong** `olm_playwright_tests_v1/` hoặc `olm_playwright_tests_v2/`.

---

## 📁 Cấu trúc bên trong mỗi dự án (v1 và v2 giống nhau)

```
olm_playwright_tests_v{1|2}/
├── modules/                      # Test tổ chức theo vai trò người dùng, đặt tên theo menu OLM
│   ├── dung-chung/               # Chưa đăng nhập / dùng chung mọi vai trò
│   │   ├── auth/                 # Đăng nhập, đăng ký
│   │   ├── community/            # Hỏi đáp, thảo luận
│   │   ├── homepage/             # Trang chủ
│   │   ├── news/                 # Tin tức
│   │   └── khoa-hoc-olm/         # Khóa học OLM (trang chung)
│   ├── giao-vien/                # Test cho giáo viên (v1 và v2 KHÔNG giống hệt nhau — xem bảng dưới)
│   ├── hoc-sinh/                 # Test cho học sinh
│   └── cross-role-flows/         # (chỉ có ở v1) Luồng nối nhiều vai trò: giao bài → làm bài, điểm danh → thống kê...
├── core/
│   ├── automation/                # lamBaiEngine.ts (engine làm bài trắc nghiệm/điền khuyết...), olmUtils.ts
│   ├── config/                    # config.ts, constants.ts, env.ts, testData.ts dùng chung
│   ├── fixtures/                  # role.fixture.ts, dual-role.fixture.ts, V2authoringrole.fixture.ts
│   └── shared-pages/              # BasePage.ts, HeaderComponent.ts, PopupComponent.ts, dismissPopups.ts...
├── config/                        # config.ts (BASE_URL, WORKER_ACCOUNTS...), constants.ts, testData.ts
├── fixtures/auth.fixture.ts       # Fixture đăng nhập theo worker (kiểu cũ)
├── auth/                          # Session đã lưu: user.json, worker-0.json → worker-5.json (gitignore, sinh ra khi chạy global-setup)
├── data/                          # lessons-by-grade.json, test-users.json
├── utils/                         # Apiauth.ts, csvReporter.ts, helpers.ts, logger.ts, visualComparison.ts
├── scripts/                       # Script chạy nhanh qua `tsx`: auto-learning, runKids/runTHCS/runTHPT/runTieuHoc, Runtatca...
├── reports/                       # HTML report, CSV report, test-results (screenshot/video/trace khi fail)
├── global-setup.ts                # Tạo session trước khi chạy test (login 1 lần/worker rồi lưu storageState)
├── playwright.config.ts           # Cấu hình Playwright chính (2 projects: chromium + bai-tap)
├── Playwright.example.config.ts   # Config mẫu
├── FEATURE-REGISTRY.md            # Bảng theo dõi tiến độ bao phủ theo nghiệp vụ (✅/🟡/⬜)
├── README.md                      # README riêng của từng dự án con
├── .env.example / .env.dev(.example) / .env.debug(.example)
├── package.json / tsconfig.json
└── node_modules/
```

### Khác biệt chính giữa v1 và v2

| | **v1** (`olm_playwright_tests_v1`) | **v2** (`olm_playwright_tests_v2`) |
|---|---|---|
| Môi trường | `olm.vn` (thật) qua `.env`, hoặc `dev.olm.vn` qua `.env.dev` | `debug.olm.vn` qua `.env.debug` |
| `modules/api/` | ✅ Có (authentication, contests, digital-library, health, learning, news, payment, qa) | ❌ Không có |
| `modules/cross-role-flows/` | ✅ Có (5 luồng e2e nối nhiều vai trò) | ❌ Không có |
| `modules/giao-vien/` | Đầy đủ nhất: `bao-cao-thong-ke`, `diem-danh`, `giao-bai`, `kiem-tra-danh-gia`, `lien-lac-dien-tu`, `ngan-hang-cau-hoi-ma-tran`, `ngan-hang-cau-hoi-olm`, `kho-de-thi-olm`, `khoa-hoc`, `quan-ly-ho-so`, `quan-ly-hoc-lieu` (bản V1 UI), `quan-ly-lop-hoc`, `thiet-lap-va-cau-hinh` | Tập trung vào tính năng mới trên debug: `quan-ly-giao-vien` (Nhóm giáo viên, Phân công giảng dạy, Danh sách quyền GV...), `quan-ly-hoc-lieu` (bản V2 UI: `Hoclieucuatoiv2page`, `Createhoclieumenu`, chuyển đổi V1↔V2), `ngan-hang-cau-hoi-ma-tran`, `ngan-hang-cau-hoi-olm`, `kho-de-thi-olm`, `khoa-hoc`, `quan-ly-lop-hoc` |
| `modules/hoc-sinh/` | `contest`, `hoc-ba`, `kids-zone`, `learning-core`, `payment`, `bai-tap-duoc-giao` | Giống v1 trừ `bai-tap-duoc-giao`, cộng thêm `lop-hoc-cua-toi` (Tổng quan, Cá nhân, Bài tập, Khóa học) |
| `storageState/` | ❌ Không có (chỉ dùng `auth/worker-*.json`) | ✅ Có thêm state theo vai trò cụ thể: `olm-staff`, `teacher-editable`, `teacher-non-editable`, `teacher-olm-source`, `teacher-non-olm-source` — phục vụ test phân quyền học liệu |
| `example/` (tài liệu mẫu page object cho học liệu) | ✅ Có | ❌ Không có |
| WORKERS mặc định | 6 (nhiều tài khoản seed sẵn) | 1 (debug hiện chỉ có 1 tài khoản seed `ngsonth05`, dùng chung cho mọi role nên phải chạy tuần tự) |

---

## 🧪 Loại test & quy ước đặt tên file

| Loại | Pattern | Mục đích |
|---|---|---|
| Smoke | `*.smoke.spec.ts` | Kiểm tra nhanh chức năng cơ bản |
| Regression | `*.regression.spec.ts` | Kiểm tra toàn diện hơn, chậm hơn |
| E2E | `*.e2e.spec.ts` | Luồng người dùng đầu-cuối, có thể nối nhiều vai trò |
| API | `modules/api/tests/*.api.spec.ts` (chỉ v1) | Test trực tiếp API, có xử lý CSRF token |

Playwright test cho từng module nằm trong `modules/<vai-trò>/<tính-năng>/tests/`, page object tương ứng nằm trong `modules/<vai-trò>/<tính-năng>/pages/`. `playwright.config.ts` chỉ nhận file test khớp `modules/**/tests/**/*.spec.ts` (và `tests/**/*.spec.ts` nếu còn dùng cấu trúc cũ) và loại trừ mọi thứ trong `pages/`.

### 2 project Playwright trong mỗi dự án

- **`chromium`** — chạy toàn bộ smoke/regression/e2e nhẹ, loại trừ `giao-bai-den-lam-bai.e2e.spec.ts`.
- **`bai-tap`** — chỉ chạy `cross-role-flows/tests/giao-bai-den-lam-bai.e2e.spec.ts` (giáo viên giao bài → học sinh làm bài trên cùng 1 luồng tuần tự), phụ thuộc (`dependencies`) vào project `chromium` nên luôn chạy sau, `workers: 1`, `timeout: 180s` vì nặng hơn.

---

## 🚀 Cài đặt & chạy test

Chọn dự án muốn chạy rồi `cd` vào đúng thư mục — **không chạy ở thư mục gốc**.

### 1. Cài đặt

```bash
cd olm_playwright_tests_v1        # hoặc olm_playwright_tests_v2

npm install
npx playwright install chromium

# copy file env phù hợp rồi điền tài khoản thật:
cp .env.example .env              # v1: chạy thẳng olm.vn
# hoặc
cp .env.dev.example .env.dev      # v1: chạy dev.olm.vn
# v2 chỉ có:
cp .env.debug.example .env.debug  # v2: chạy debug.olm.vn
```

### 2. Chạy test — `olm_playwright_tests_v1`

```bash
npm test                     # toàn bộ
npm run test:fast            # chỉ project 'chromium'
npm run test:bai-tap         # chỉ luồng giao bài → làm bài
npm run test:smoke           # smoke
npm run test:regression      # regression
npm run test:e2e             # e2e
npm run test:api             # test API
npm run test:giao-vien       # chỉ modules/giao-vien
npm run test:hoc-sinh        # chỉ modules/hoc-sinh
npm run test:dung-chung      # chỉ modules/dung-chung
npm run test:headed          # chạy có UI trình duyệt

# chạy trên dev.olm.vn thay vì olm.vn (dùng .env.dev):
npm run test:dev
npm run test:dev:fast
npm run test:dev:smoke
```

### 3. Chạy test — `olm_playwright_tests_v2` (môi trường debug)

```bash
npm test                          # dùng .env mặc định nếu có
npm run test:debug                # ép chạy với .env.debug (debug.olm.vn)
npm run test:debug:fast
npm run test:debug:smoke
npm run test:debug:regression
npm run test:debug:giao-vien
npm run test:debug:hoc-sinh
npm run test:debug:headed
```

### 4. Chạy một module/file cụ thể (áp dụng cho cả v1 và v2)

```bash
npx playwright test modules/giao-vien/quan-ly-hoc-lieu/
npx playwright test modules/hoc-sinh/learning-core/tests/hoc-bai.smoke.spec.ts
npx playwright test --workers=1          # chạy tuần tự để dễ debug
npx playwright test --debug              # debug từng bước
npx playwright test --ui                 # UI mode
```

### 5. Script chạy nhanh (qua `tsx`, không qua Playwright test runner)

```bash
npm run auto-learning     # scripts/auto-learning.ts
npm run run-tieu-hoc       # scripts/runTieuHoc.ts
npm run run-thcs           # scripts/runTHCS.ts
npm run run-thpt           # scripts/runTHPT.ts
npm run run-kids           # scripts/runKids.ts
npm run run-tat-ca          # scripts/Runtatca.ts
```

### 6. Xem report

```bash
npm run report              # mở reports/html/index.html
```

- **HTML report**: `reports/html/index.html` — kết quả, screenshot, video, trace.
- **CSV report**: `reports/test_report_[ngày-giờ].csv` — tên test, PASS/FAIL, thời gian, lỗi.
- **Ảnh/video/trace khi fail**: `reports/test-results/<tên-test>/`.

---

## 🔐 Session & tài khoản test

- `global-setup.ts` tự đăng nhập và lưu session (`storageState`) cho từng worker vào `auth/worker-0.json` → `auth/worker-5.json` trước khi test chạy, để các test sau tái sử dụng session thay vì đăng nhập lại mỗi lần.
- Danh sách tài khoản (`WORKER_ACCOUNTS`) và role tương ứng (VIP/school/normal...) khai báo trong `config/config.ts`, giá trị thật lấy từ file `.env*`.
- **v1**: 6 tài khoản seed sẵn khác nhau cho 6 worker → mặc định `WORKERS=6`, chạy song song.
- **v2 (debug)**: chỉ có 1 tài khoản seed (`ngsonth05`) dùng chung cho mọi worker/role → bắt buộc `WORKERS=1`, chạy tuần tự để tránh 1 session bị đăng xuất do nhiều worker cùng login song song. Nếu để trống `SCHOOL_SLUG`/`SCHOOL_ID` trong `.env.debug`, config sẽ fallback về trường mặc định khác tài khoản → test trường/giáo viên có thể vào nhầm trường.
- **Không commit** `.env`, `.env.dev`, `.env.debug` — chỉ commit file `.example` tương ứng.

---

## 📚 Tài liệu khác trong repo

- **`postman/`** — Postman collection (định dạng VCS `.yaml`) cho các API OLM: Authentication, Contest/ContestX, Digital Library, Learning, News, Payment, Q&A. Dùng để đối chiếu khi viết `modules/api/tests/*.api.spec.ts` (v1).
- **`olm_crawler.py`** — script Python/Selenium độc lập (không phải Playwright), đăng nhập OLM và crawl danh sách bài học theo khối lớp ra file Excel. Cần cài `selenium`, `webdriver-manager`, `pandas`.
- **`cấu_trúc_web.md`** — ghi chú cấu trúc menu/điều hướng của olm.vn, dùng làm tham chiếu khi đặt tên module theo đúng taxonomy của web.
- **`element_taker.md`** — ghi chú cách lấy selector/element khi viết page object mới.
- **`FEATURE-REGISTRY.md`** (trong từng dự án con) — bảng theo dõi mỗi bước nghiệp vụ đã có page object/test hay chưa (✅ Có / 🟡 WIP / ⬜ Chưa), cùng danh sách các luồng cross-role còn thiếu và các câu hỏi cần xác nhận với team nghiệp vụ.

---

## 🆘 Troubleshooting

- **Test timeout**: tăng `timeout`/`actionTimeout`/`navigationTimeout` trong `playwright.config.ts`, hoặc kiểm tra tốc độ mạng/server (đặc biệt môi trường `dev`/`debug` hay chậm hơn bản thật).
- **Lỗi session**: xóa thư mục `auth/` (và `storageState/` với v2) rồi chạy lại — `global-setup.ts` sẽ tự tạo lại.
- **Worker crash / nhiều worker giành 1 tài khoản**: giảm `WORKERS` (đặc biệt trên `debug.olm.vn` nơi chỉ có 1 tài khoản seed) — có thể set qua biến env `WORKERS=1`.
- **Selector không còn đúng**: đối chiếu `element_taker.md` và `cấu_trúc_web.md`, hoặc kiểm tra lại DOM thật vì UI OLM có thể đã thay đổi (đặc biệt `debug.olm.vn` do đang phát triển).