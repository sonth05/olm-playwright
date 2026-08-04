# OLM-Auto_test

Bộ kiểm thử tự động cho [OLM.vn](https://olm.vn) — nền tảng giáo dục trực tuyến.
Công nghệ chính: **Playwright + TypeScript** (mô hình Page Object Model) cho web/API,
kèm 1 script **Python/Selenium** cũ dùng để crawl dữ liệu, và 1 bộ **Postman collection**
(định dạng VCS `.yaml`) để đối chiếu API.

> README này thay thế/gộp toàn bộ các README rời rạc trong repo (root, v1, v2) thành **một
> điểm điều hướng duy nhất**. Xem mục [9. Điều hướng tài liệu](#9-điều-hướng-tài-liệu--dọn-dẹp-đề-xuất)
> để biết file nào nên giữ, file nào nên xoá/gộp.

---

## Mục lục

1. [Tổng quan kiến trúc repo](#1-tổng-quan-kiến-trúc-repo)
2. [Cài đặt](#2-cài-đặt)
3. [Biến môi trường (`.env*`)](#3-biến-môi-trường-env)
4. [Cách chạy test](#4-cách-chạy-test)
5. [Session & tài khoản test](#5-session--tài-khoản-test)
6. [Các file / hàm quan trọng](#6-các-file--hàm-quan-trọng)
7. [Luồng dữ liệu (data flow)](#7-luồng-dữ-liệu-data-flow)
8. [Viết test mới](#8-viết-test-mới)
9. [Điều hướng tài liệu & dọn dẹp đề xuất](#9-điều-hướng-tài-liệu--dọn-dẹp-đề-xuất)
10. [⚠️ Vấn đề bảo mật cần xử lý ngay](#10-️-vấn-đề-bảo-mật-cần-xử-lý-ngay)
11. [CI/CD](#11-cicd)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Tổng quan kiến trúc repo

Repo gồm **2 dự án Playwright độc lập, song song** (không phải một dự án duy nhất — mỗi
thư mục có `package.json`, `node_modules`, `tsconfig.json` riêng):

| Thư mục | Môi trường target | Vai trò |
|---|---|---|
| `olm_playwright_tests_v1/` | `olm.vn` (thật) qua `.env`, hoặc `dev.olm.vn` qua `.env.dev` | Bộ test **ổn định**, bao phủ đầy đủ nhất các module giáo viên/học sinh, có thêm `modules/api/` và `modules/cross-role-flows/` |
| `olm_playwright_tests_v2/` | `debug.olm.vn` qua `.env.debug` | Bộ test **đuổi theo tính năng mới** đang phát triển trên môi trường debug (học liệu V2, quản lý giáo viên...) trước khi lên `dev` rồi lên bản thật |

```
OLM-Auto_test/
├── olm_playwright_tests_v1/     # Dự án Playwright #1 — olm.vn / dev.olm.vn
├── olm_playwright_tests_v2/     # Dự án Playwright #2 — debug.olm.vn
├── postman/                     # Postman collection (VCS .yaml) — đối chiếu khi viết test API
├── .postman/resources.yaml      # Cấu hình workspace Postman
├── .github/workflows/           # CI (playwright.yml) — ⚠️ hiện đang BỊ HỎNG, xem mục 11
├── olm_crawler.py               # Script Python/Selenium cũ — crawl bài học ra Excel (KHÔNG thuộc bộ Playwright)
├── cấu_trúc_web.md              # Ghi chú cấu trúc/menu website OLM — tài liệu tham khảo khi viết page object
├── element_taker.md             # Ghi chú cách lấy selector/element trên OLM
├── package.json                 # CHỈ chứa devDependency `typescript` dùng ở mức repo — KHÔNG chạy test ở đây
└── README.md                    # File này
```

> ⚠️ `package.json` / `package-lock.json` ở thư mục gốc **không phải nơi chạy test**.
> Mọi lệnh `npm test` / `npx playwright test` phải chạy **bên trong**
> `olm_playwright_tests_v1/` hoặc `olm_playwright_tests_v2/`.

### Cấu trúc bên trong mỗi dự án (v1 và v2 giống nhau ~90%)

```
olm_playwright_tests_v{1|2}/
├── modules/                   # Test tổ chức theo VAI TRÒ người dùng, đặt tên theo menu OLM
│   ├── dung-chung/            # Chưa đăng nhập / dùng chung mọi vai trò (auth, community, homepage, news, khoa-hoc-olm...)
│   ├── giao-vien/             # Test cho giáo viên (xem bảng khác biệt v1/v2 bên dưới)
│   ├── hoc-sinh/              # Test cho học sinh (contest, hoc-ba, kids-zone, learning-core, payment...)
│   ├── cross-role-flows/      # (CHỈ v1) Luồng nối nhiều vai trò: giao bài → làm bài, điểm danh → thống kê...
│   └── api/                   # (CHỈ v1) Test API trực tiếp
├── core/                      # Lõi dùng chung — KHÔNG chứa test
│   ├── automation/            # lamBaiEngine.ts (engine làm bài), olmUtils.ts
│   ├── config/                # Barrel re-export từ ../config/* (xem mục 6)
│   ├── fixtures/              # role.fixture.ts, dual-role.fixture.ts, V2authoringrole.fixture.ts
│   └── shared-pages/          # BasePage.ts, HeaderComponent.ts, PopupComponent.ts, dismissPopups.ts...
├── config/                    # config.ts (BASE_URL, URL từng trang...), constants.ts (selectors), testData.ts
├── fixtures/auth.fixture.ts   # Fixture đăng nhập theo worker (kiểu cũ, vẫn dùng song song role.fixture.ts)
├── auth/                      # Session đã lưu: user.json, worker-0.json → worker-5.json (gitignore, tự sinh khi chạy global-setup)
├── storageState/              # (CHỈ v2) Session theo role cụ thể cho V2authoringrole.fixture
├── data/                      # lessons-by-grade.json, test-users.json
├── utils/                     # Apiauth.ts, csvReporter.ts, helpers.ts, logger.ts, (v1: + visualComparison.ts)
├── scripts/                   # (CHỈ v1) Script chạy nhanh qua `tsx`: auto-learning, runKids/runTHCS/runTHPT/runTieuHoc, Runtatca
├── example/                   # Ví dụ page object / script mẫu tham khảo (không phải test chính thức)
├── reports/                   # HTML report, CSV report, test-results (ảnh/video/trace khi fail)
├── global-setup.ts            # Login 1 lần/worker trước khi chạy test, lưu storageState
├── playwright.config.ts       # Cấu hình Playwright chính (2 projects: chromium + bai-tap)
├── Playwright.example.config.ts
├── FEATURE-REGISTRY.md        # ⚠️ nội dung hiện đang LỖI THỜI, xem mục 9
├── README.md                  # ⚠️ nội dung hiện đang LỖI THỜI/GIỐNG HỆT NHAU, xem mục 9
├── .env.example / .env.dev(.example) / .env.debug(.example)
├── package.json / tsconfig.json
└── node_modules/
```

### Khác biệt chính giữa v1 và v2

| | **v1** | **v2** |
|---|---|---|
| Môi trường | `olm.vn` qua `.env`, `dev.olm.vn` qua `.env.dev` | `debug.olm.vn` qua `.env.debug` |
| `modules/api/` | ✅ Có (authentication, contests, digital-library, health, learning, news, payment, qa) | ❌ Không có |
| `modules/cross-role-flows/` | ✅ Có (5 luồng e2e nối nhiều vai trò) | ❌ Không có |
| `modules/giao-vien/` | Đầy đủ nhất: `bao-cao-thong-ke`, `diem-danh`, `giao-bai`, `kiem-tra-danh-gia`, `lien-lac-dien-tu`, `ngan-hang-cau-hoi-ma-tran`, `ngan-hang-cau-hoi-olm`, `kho-de-thi-olm`, `khoa-hoc`, `quan-ly-ho-so`, `quan-ly-hoc-lieu` (UI V1), `quan-ly-lop-hoc`, `thiet-lap-va-cau-hinh` | Tập trung tính năng mới trên debug: `quan-ly-giao-vien` (Nhóm GV, Phân công giảng dạy, Danh sách quyền GV), `quan-ly-hoc-lieu` (UI V2, chuyển đổi V1↔V2), `ngan-hang-cau-hoi-ma-tran`, `ngan-hang-cau-hoi-olm`, `kho-de-thi-olm`, `khoa-hoc`, `quan-ly-lop-hoc` |
| `modules/hoc-sinh/` | `contest`, `hoc-ba`, `kids-zone`, `learning-core`, `payment`, `bai-tap-duoc-giao` | Giống v1 trừ `bai-tap-duoc-giao`, cộng thêm `lop-hoc-cua-toi` |
| `storageState/` | ❌ Không có (chỉ `auth/worker-*.json`) | ✅ Có thêm state theo role cụ thể: `olm-staff`, `teacher-editable`, `teacher-non-editable`, `teacher-olm-source`, `teacher-non-olm-source` |
| `example/` | `thiThuThptSinhHoc.ts`, `toan9Bai2PhuongPhapThe.ts` | `kiemtrabaiVideo.ts` |
| WORKERS mặc định | 6 (6 tài khoản seed khác nhau) | 1 (chỉ có 1 tài khoản seed `ngsonth05` dùng chung mọi role → phải chạy tuần tự) |
| `playwright.config.ts` timeout | `timeout: 60_000`, `expect.timeout: 15_000` | `timeout: 120_000`, `expect.timeout: 30_000` (debug hay chậm hơn) |

### Loại test & quy ước đặt tên

| Loại | Pattern | Mục đích |
|---|---|---|
| Smoke | `*.smoke.spec.ts` | Kiểm tra nhanh chức năng cơ bản |
| Regression | `*.regression.spec.ts` | Kiểm tra toàn diện hơn, chậm hơn |
| E2E | `*.e2e.spec.ts` | Luồng người dùng đầu-cuối, có thể nối nhiều vai trò |
| API | `modules/api/tests/*.api.spec.ts` (chỉ v1) | Test trực tiếp API, có xử lý CSRF token |

Test nằm trong `modules/<vai-trò>/<tính-năng>/tests/`, page object tương ứng nằm trong
`modules/<vai-trò>/<tính-năng>/pages/`. `playwright.config.ts` chỉ nhận file khớp
`modules/**/tests/**/*.spec.ts` và loại trừ mọi thứ trong `pages/`.

**2 project Playwright trong mỗi dự án:**
- **`chromium`** — chạy toàn bộ smoke/regression/e2e nhẹ, loại trừ `giao-bai-den-lam-bai.e2e.spec.ts`.
- **`bai-tap`** — chỉ chạy `cross-role-flows/tests/giao-bai-den-lam-bai.e2e.spec.ts`, phụ thuộc
  (`dependencies`) vào `chromium` nên luôn chạy sau, `workers: 1`, timeout dài hơn vì nặng hơn.

---

## 2. Cài đặt

Chọn dự án muốn chạy rồi `cd` vào đúng thư mục — **không chạy ở thư mục gốc repo**.

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

Yêu cầu môi trường: **Node.js ≥ 18** (khuyến nghị 22, khớp với CI), npm. Không cần cài Python
trừ khi dùng `olm_crawler.py` (xem mục 9).

---

## 3. Biến môi trường (`.env*`)

Cả v1 và v2 dùng chung 1 bộ tên biến, đọc qua `dotenv` trong `config/config.ts`
(file nào được nạp phụ thuộc biến `ENV_FILE`, mặc định `.env`).

| Biến | Ý nghĩa | Mặc định trong code (fallback) |
|---|---|---|
| `BASE_URL` | Domain target (`https://olm.vn` / `https://dev.olm.vn` / `https://debug.olm.vn`) | `https://olm.vn` |
| `OLM_VIP_USERNAME` / `OLM_VIP_PASSWORD` | Tài khoản HS có VIP → worker-0 | — |
| `OLM_SCHOOL_USERNAME` / `OLM_SCHOOL_PASSWORD` | Tài khoản giáo viên/chủ trường → worker-1, cũng dùng để build `SCHOOL_USERNAME`/`doiTacUrl()` | — |
| `OLM_NORMAL_USERNAME` / `OLM_NORMAL_PASSWORD` | HS thường (không VIP) → worker-2 | — |
| `OLM_EXTRA1/2/3_USERNAME` / `..._PASSWORD` | 3 tài khoản bổ sung → worker-3,4,5 | — |
| `SCHOOL_SLUG` | Slug trường học đầy đủ, VD `truong-lien-cap-olm-son.41902384`. Dùng để build các URL `/truong-hoc/{slug}/...`. **Ở `.env.debug` phải điền đúng slug của tài khoản debug**, nếu để trống sẽ fallback sang slug mặc định (trường khác) → test trường/GV vào nhầm trường | `truong-lien-cap-olm-son.41902384` |
| `SCHOOL_ID` | Phần ID số tách từ `SCHOOL_SLUG`, dùng cho URL dạng `school-files-{id}` | tách từ `SCHOOL_SLUG` |
| `DAU_TRUONG_URL` | Domain riêng cho trang "Thống kê đấu trường" (`dautruong.olm.vn`) | `https://dautruong.olm.vn` |
| `HEADLESS` | `true`/`false` — chạy trình duyệt ẩn hay hiện | `false` |
| `BROWSER` | Loại trình duyệt Playwright dùng | `chromium` |
| `WORKERS` | Số worker chạy song song. **v1: 6** (nhiều tài khoản riêng biệt). **v2: bắt buộc 1** (chỉ 1 tài khoản seed `ngsonth05` dùng chung mọi role, nhiều worker cùng login sẽ làm session bị đăng xuất chéo) | 6 |
| `WAIT_TIMEOUT` | Timeout chờ chung (giây) | 8 (v1) / 10 (v2 debug) |
| `PAGE_LOAD_WAIT` | Chờ sau khi load trang (giây) | 2 (v1) / 3 (v2) |
| `LOGIN_WAIT` | Chờ sau khi login (giây) | 2 (v1) / 3 (v2) |
| `ENV_FILE` | Không đặt trong file `.env*`, mà **set khi chạy lệnh** để chọn file env nạp, VD `ENV_FILE=.env.dev npx playwright test` | `.env` |

**Không commit** `.env`, `.env.dev`, `.env.debug` — chỉ commit file `.env*.example` tương ứng.
Xem cảnh báo quan trọng ở [mục 10](#10-️-vấn-đề-bảo-mật-cần-xử-lý-ngay).

---

## 4. Cách chạy test

### `olm_playwright_tests_v1`

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
npm run test:learning-core   # chỉ modules/hoc-sinh/learning-core
npm run test:modules         # toàn bộ modules/
npm run test:headed          # chạy có UI trình duyệt

# chạy trên dev.olm.vn (dùng .env.dev) thay vì olm.vn:
npm run test:dev
npm run test:dev:fast / :smoke / :regression / :e2e / :api / :headed / :bai-tap
```

### `olm_playwright_tests_v2` (môi trường debug)

```bash
npm test                          # dùng .env mặc định nếu có
npm run test:debug                # ép chạy .env.debug (debug.olm.vn)
npm run test:debug:fast
npm run test:debug:smoke
npm run test:debug:regression
npm run test:debug:giao-vien
npm run test:debug:hoc-sinh
npm run test:debug:headed
```

### Chạy một module/file cụ thể (áp dụng cả v1 và v2)

```bash
npx playwright test modules/giao-vien/quan-ly-hoc-lieu/
npx playwright test modules/hoc-sinh/learning-core/tests/hoc-bai.smoke.spec.ts
npx playwright test --workers=1          # chạy tuần tự để dễ debug
npx playwright test --debug              # debug từng bước (Playwright Inspector)
npx playwright test --ui                 # UI mode
```

### Script chạy nhanh qua `tsx` (chỉ v1, không qua Playwright test runner)

```bash
npm run auto-learning     # scripts/auto-learning.ts
npm run run-tieu-hoc       # scripts/runTieuHoc.ts
npm run run-thcs           # scripts/runTHCS.ts
npm run run-thpt           # scripts/runTHPT.ts
npm run run-kids           # scripts/runKids.ts
npm run run-tat-ca          # scripts/Runtatca.ts
npm run thi-thu            # example/thiThuThptSinhHoc.ts
npm run toan9              # example/toan9Bai2PhuongPhapThe.ts
```

### Xem report

```bash
npm run report              # mở reports/html/index.html
```

- **HTML report**: `reports/html/index.html` — kết quả, screenshot, video, trace.
- **CSV report** (sinh bởi `utils/csvReporter.ts`): `reports/test_report_[ngày-giờ].csv` —
  tên test, PASS/FAIL, thời gian, lỗi.
- **Ảnh/video/trace khi fail**: `reports/test-results/<tên-test>/`.

---

## 5. Session & tài khoản test

- `global-setup.ts` tự đăng nhập và lưu session (`storageState`) cho từng worker vào
  `auth/worker-0.json` → `auth/worker-5.json` **trước khi** test chạy, để các test sau tái
  sử dụng session thay vì đăng nhập lại mỗi lần (nhanh hơn nhiều, giảm rủi ro bị chặn/CAPTCHA).
- Cơ chế gom nhóm: `global-setup.ts` nhóm các worker có **cùng username+password** rồi chỉ
  login thật 1 lần cho mỗi credential duy nhất, sau đó copy file `storageState` sang các
  worker còn lại — tránh login trùng, tránh race condition.
  - **v1** (olm.vn/dev.olm.vn): 6 tài khoản khác nhau → login song song 6 lần.
  - **v2** (debug.olm.vn): chỉ 1 tài khoản seed thật (`ngsonth05`) → chỉ mở **1 browser**,
    login **1 lần**, rồi copy state sang mọi worker slot còn lại (tránh server invalidate
    session lẫn nhau khi nhiều worker cùng login 1 tài khoản).
  - **v2 riêng thêm**: sinh 5 file trong `storageState/` (`teacher-editable.json`,
    `teacher-non-editable.json`, `teacher-olm-source.json`, `teacher-non-olm-source.json`,
    `olm-staff.json`) từ **cùng 1** tài khoản debug — chỉ đủ để test không báo lỗi `ENOENT`
    khi mở context, **KHÔNG phải 5 role thật khác nhau**. Test nào so sánh hành vi khác biệt
    giữa các role (VD: `teacher-non-editable` phải bị chặn sửa) sẽ **chưa có giá trị thật**
    cho tới khi có tài khoản debug riêng cho từng role.
- Danh sách tài khoản (`WORKER_ACCOUNTS`, khai báo trong `global-setup.ts`) và role tương ứng
  (VIP/school/normal...) lấy giá trị thật từ `.env*` (có fallback cứng trong code nếu thiếu
  biến — xem cảnh báo bảo mật ở mục 10).
- **Xoá session cũ khi gặp lỗi đăng nhập**: xoá thư mục `auth/` (và `storageState/` với v2)
  rồi chạy lại — `global-setup.ts` sẽ tự tạo lại.

---

## 6. Các file / hàm quan trọng

### `playwright.config.ts`
- `testMatch`: chỉ nhận `modules/**/tests/**/*.spec.ts` (và `tests/**/*.spec.ts` nếu còn cấu trúc cũ).
- 2 `projects`: `chromium` (mặc định, loại trừ file giao-bài nặng) và `bai-tap` (phụ thuộc
  `chromium`, chạy tuần tự `workers: 1`, timeout dài hơn).
- `globalSetup: './global-setup.ts'` — chạy 1 lần trước toàn bộ suite để tạo session.
- Reporter: HTML + CSV (`utils/csvReporter.ts`) + list.

### `config/config.ts`
Nguồn URL/tham số trung tâm, đọc `.env*` qua `dotenv`. Các export đáng chú ý:
- `BASE_URL` và hàng chục hằng URL dẫn xuất (`LOGIN_URL`, `HOC_BAI_URL`, `HOI_DAP_URL`,
  `MUA_VIP_URL`, `THU_VIEN_SO_URL`, `TRUONG_HOC_URL`...).
- Hàm build URL động: `lopUrl(grade)`, `khoaHocUrl(slug)`, `chuDeUrl(slug)`, `docSachUrl(slug)`,
  `cauHoiUrl(id)`, `truongHocUrl(subPath)`, `doiTacUrl(subPath)`, `tsdcPublicUrl(level)`.
- `SCHOOL_SLUG` / `SCHOOL_ID` / `SCHOOL_USERNAME` — cấu hình trường học test, và hàng loạt
  URL trang quản trị trường (`TO_BO_MON_URL`, `PHAN_CONG_GIANG_DAY_URL`,
  `LOP_HOC_CUA_TRUONG_URL`, `HO_SO_KE_HOACH_URL`, `DANH_SACH_BAO_LOI_URL`...).
- Timeout & thư mục: `WAIT_TIMEOUT`, `PAGE_LOAD_WAIT`, `LOGIN_WAIT`, `HEADLESS`, `BROWSER`,
  `AUTH_STATE_PATH`, `REPORTS_DIR`, `DATA_DIR`.

### `config/constants.ts`
Toàn bộ selector CSS/XPath tra cứu theo mảng ưu tiên (fallback nhiều selector cho cùng 1
element để chống UI đổi nhẹ): `LOGIN_USERNAME_SELECTORS`, `LOGIN_PASSWORD_SELECTORS`,
`REGISTER_*_SELECTORS`, `CARD_SELECTORS`, `COURSE_TAB_SELECTORS`... cùng các map tra cứu
`SUBJECT_MAP`, `LESSON_TYPE_KEYWORDS`, danh sách `SKIP_HREFS`, `GRADES` (mảng lớp 1→12).

### `config/testData.ts`
- `loadAccounts()` đọc `data/test-users.json`, override bằng biến `OLM_*_USERNAME/PASSWORD`
  → xuất ra `ACCOUNTS` (`vip_student`, `school`, `normal_student`) và `TEST_USERS`.
- `LOGIN_TEST_CASES` — bộ case đăng nhập âm/dương (sai mật khẩu, SQL injection, rỗng...).
- `REGISTER_TEST_CASES` — bộ case đăng ký âm/dương (email trùng, username trùng, thiếu trường...).
- `SAMPLE_LESSON_URLS`, `SAMPLE_COURSE_URLS`, `INVALID_URLS` — URL mẫu dùng trong test.
- `loadLessonsByGrade()` đọc `data/lessons-by-grade.json`.

### `core/config/*.ts`
**Không phải file trùng lặp** — đây là **barrel re-export** (`export * from '../../config/config'`)
để cho phép import qua alias `@core/config/*` (khai báo trong `tsconfig.json paths`) song song
với alias `@config/*` trỏ thẳng `config/`. Giữ nguyên, đây là chủ đích thiết kế chứ không phải rác.

### `core/shared-pages/BasePage.ts`
Class cha cho mọi Page Object: chứa các hành vi dùng chung (goto, chờ phần tử, dismiss popup...).
Mọi Page Object trong `modules/**/pages/` nên `extends BasePage`.

### `core/automation/olmUtils.ts`
- `khoiBrowser(headless)` — khởi tạo browser/context/page dùng ngoài Playwright test runner
  (cho các script trong `scripts/`).
- `dangNhap(page)` — hàm login dùng chung cho script.
- `layDanhSachBai(page, khoaHocUrl)` / `layDanhSachKhoaHoc(page, lopUrl)` — crawl danh sách
  bài học/khóa học trực tiếp từ DOM.
- `chayKhoi(options)` — chạy tự động theo khối lớp (dùng trong `scripts/runTieuHoc.ts` v.v.).

### `core/automation/lamBaiEngine.ts`
Engine tự động **làm bài** (trắc nghiệm, tự luận, kéo-thả, nối, dropdown...). Các hàm chính:
`xuLyTracNghiem`, `xuLyTuLuan`, `xuLyDropdown`, `xuLyKeoTha`, `xuLyNoi`, `xuLyDungSai`,
`chuyenCauThiThu` (điều hướng câu tiếp/lùi/nộp), `nopBaiLuyenTap`/`nopBaiThiThu`,
`phatHienLoaiBai(page)` (tự nhận diện loại bài để chọn chiến lược xử lý phù hợp),
`isHoanThanh`/`isHetLuot` (điều kiện dừng vòng lặp làm bài).

### `core/fixtures/`
- `role.fixture.ts` — fixture Playwright mở context theo **role** (teacher/student...), dùng
  `storageStateForRole(role)` để trỏ đúng file session.
- `dual-role.fixture.ts` — mở **2 context đồng thời** (VD: GV + HS) trong cùng 1 test, phục vụ
  luồng cross-role (giao bài → HS thấy bài ngay).
- `V2authoringrole.fixture.ts` — fixture riêng cho soạn học liệu V2 (`editableTeacher`,
  `nonEditableTeacher`, `olmSourceTeacher`, `nonOlmSourceTeacher`, `olmStaff`), đọc từ
  `storageState/*.json`.

### `fixtures/auth.fixture.ts` (kiểu cũ, vẫn dùng song song)
- `test` mở rộng từ `base` của Playwright, tự gán `storageState` theo **worker index** hiện tại.
- `loginAs(...)` — helper login thủ công khi cần bỏ qua storageState có sẵn.

### `utils/`
- `Apiauth.ts`: `newGuestApiContext()` / `newAuthedApiContext()` tạo `APIRequestContext` cho
  test API (đọc cookie từ storageState của worker hiện tại để giả lập request đã đăng nhập,
  có xử lý CSRF token); `currentWorkerAccount()` lấy thông tin account theo worker hiện tại.
- `csvReporter.ts`: `CsvReporter` — custom Playwright Reporter, xuất `reports/test_report_*.csv`.
- `helpers.ts`: `Timer` (đo thời gian), `parseOlmData(filepath)`, `scrollToBottom(page)`,
  `safeClick(page, locator)` (click có retry/chờ), `createStealthContext(page)` (giảm dấu
  hiệu automation), `humanDelay(min, max)` (delay ngẫu nhiên mô phỏng người dùng thật).
- `logger.ts`: `setupLogger(name)` — logger có format thống nhất cho toàn bộ suite.
- `visualComparison.ts` (chỉ v1): `captureScreenshot(...)`, `compareScreenshot(...)` — so
  sánh ảnh chụp màn hình (visual regression).

### `global-setup.ts`
Chạy 1 lần trước toàn bộ test suite (khai báo trong `playwright.config.ts → globalSetup`):
1. Định nghĩa `WORKER_ACCOUNTS` (đọc từ biến `OLM_*` env, có fallback cứng — xem mục 10).
2. Gom nhóm theo credential trùng nhau, login song song 1 lần/credential (`loginAndSave`),
   copy `storageState` sang các worker dùng chung credential.
3. Tự động đóng các popup che khuất sau login lần đầu ("Thay đổi mật khẩu", "Xác thực") qua
   `dismissNamedPopup` và danh sách `MODAL_CLOSE_SELECTORS`.
4. (Chỉ v2) sinh thêm 5 file trong `storageState/` cho `V2authoringrole.fixture.ts`.

---

## 7. Luồng dữ liệu (data flow)

```
.env* (BASE_URL, OLM_*_USERNAME/PASSWORD, SCHOOL_SLUG, WORKERS, timeout...)
        │  (dotenv, chọn file qua biến ENV_FILE)
        ▼
config/config.ts ──┬── xuất URL/tham số dùng trong page object & test
                    └── core/config/*.ts re-export lại (alias @core/config/*)
        │
        ▼
config/testData.ts ── đọc data/test-users.json + override bằng .env
        │                     → ACCOUNTS / TEST_USERS / *_TEST_CASES
        ▼
global-setup.ts (chạy 1 lần trước suite)
        │  dùng WORKER_ACCOUNTS + config để mở browser, login thật
        ▼
auth/worker-*.json , storageState/*.json   (storageState — session đã đăng nhập)
        │
        ▼
fixtures (auth.fixture.ts / core/fixtures/role.fixture.ts / dual-role.fixture.ts /
          V2authoringrole.fixture.ts)
        │  test.use({ storageState: ... }) → mở context/page ĐÃ đăng nhập sẵn
        ▼
modules/<role>/<feature>/tests/*.spec.ts
        │  gọi Page Object tương ứng
        ▼
modules/<role>/<feature>/pages/*.ts (extends core/shared-pages/BasePage.ts)
        │  dùng config/constants.ts (selectors) + config/config.ts (URL)
        │  với bài làm trắc nghiệm/tự luận → gọi core/automation/lamBaiEngine.ts
        ▼
Trình duyệt thật (Chromium qua Playwright) ↔ olm.vn / dev.olm.vn / debug.olm.vn
        │
        ▼
Kết quả test
        ├── reports/html/          (HTML report — screenshot/video/trace khi fail)
        ├── reports/test_report_*.csv   (qua utils/csvReporter.ts)
        └── reports/test-results/<test>/  (ảnh, video, trace chi tiết)
```

Với test **API** (chỉ v1, `modules/api/tests/`): `utils/Apiauth.ts` đọc cookie từ
`auth/worker-*.json` để dựng `APIRequestContext` đã "đăng nhập", gọi thẳng endpoint OLM thay
vì qua UI — dùng để đối chiếu với `postman/collections/OLM-vn/**/*.request.yaml`.

---

## 8. Viết test mới

Cấu trúc chuẩn cho 1 tính năng mới, VD `modules/giao-vien/giao-bai/`:

```
modules/giao-vien/giao-bai/
├── pages/
│   └── AssignmentPage.ts      # extends BasePage, chứa locator + hành động
└── tests/
    └── giao-bai.smoke.spec.ts
```

```typescript
// modules/giao-vien/giao-bai/pages/AssignmentPage.ts
import { Page } from '@playwright/test';
import { BasePage } from '../../../core/shared-pages/BasePage';

export class AssignmentPage extends BasePage {
  get assignmentTable() { return this.page.locator('#assignment-table'); }
  get createButton()     { return this.page.locator('button:has-text("Giao bài")'); }

  async goto(page: Page) {
    this.page = page;
    await page.goto('/teacher/assignments');
    await this.assignmentTable.waitFor({ state: 'visible' });
  }
}
export const assignmentPage = new AssignmentPage();
```

```typescript
// modules/giao-vien/giao-bai/tests/giao-bai.smoke.spec.ts
import { test, expect } from '../../../core/fixtures/role.fixture';
import { assignmentPage } from '../pages/AssignmentPage';

test.describe('Giao Bài [Smoke]', () => {
  test('hiển thị danh sách bài giao', async ({ teacherPage }) => {
    await assignmentPage.goto(teacherPage);
    await expect(assignmentPage.assignmentTable).toBeVisible();
  });
});
```

Quy tắc:
- Đặt tên file theo loại test (`.smoke./.regression./.e2e.spec.ts`) để khớp script `npm run test:*`.
- Selector nên khai báo trong `config/constants.ts` thay vì hard-code trong page object khi
  selector đó dùng lại ở nhiều nơi.
- Luồng nối nhiều vai trò → đặt trong `modules/cross-role-flows/tests/` (chỉ v1) và dùng
  `dual-role.fixture.ts`.

---

## 9. Điều hướng tài liệu & dọn dẹp đề xuất

Đây là phần **rà soát dư thừa** theo yêu cầu — repo hiện có khá nhiều tài liệu/config **trùng
lặp gần như tuyệt đối** hoặc **lỗi thời so với cấu trúc thật**. Đề xuất cụ thể:

| File/khu vực | Vấn đề phát hiện | Đề xuất |
|---|---|---|
| `olm_playwright_tests_v1/README.md` **và** `olm_playwright_tests_v2/README.md` | **Giống hệt nhau 100% (diff = 0 dòng)** và cả hai đều **lỗi thời**: vẫn nhắc tới thư mục `olm_playwright_tests/` (tên cũ trước khi tách v1/v2), liệt kê module không còn tồn tại đúng vị trí thực tế (`thiet-lap-cau-hinh`, `rbac-phan-quyen`, `digital-library` đặt sai cấp), ví dụ tài khoản giả (`gv1@gmail.com`) không khớp tài khoản thật trong `.env.example` | **Xoá cả 2 file**, thay bằng 1 dòng trỏ về README gốc này: `# Xem README ở thư mục gốc repo`. Toàn bộ nội dung hữu ích (cấu trúc, cách chạy, session, viết test mới) đã được gộp và **cập nhật chính xác** vào README này |
| `olm_playwright_tests_v1/FEATURE-REGISTRY.md` **và** `..._v2/FEATURE-REGISTRY.md` | **Giống hệt nhau 100%**, và nội dung ("v4", đường dẫn `modules/quan-ly-lop-hoc/` thay vì `modules/giao-vien/quan-ly-lop-hoc/`, không có phân biệt v1/v2) không khớp cấu trúc `modules/` thực tế hiện tại | Gộp lại thành **1 file duy nhất ở gốc repo** (`FEATURE-REGISTRY.md`), viết lại theo đúng path thật, có thêm cột "v1/v2" để phân biệt phạm vi bao phủ mỗi bộ test |
| `core/config/config.ts`, `constants.ts`, `testData.ts` | Trông giống trùng lặp với `config/*.ts` nhưng **thực chất chỉ là barrel re-export** (1 dòng `export * from '../../config/...'`) để phục vụ alias `@core/config/*` | **Không cần xoá** — đây là thiết kế chủ đích, không phải rác |
| Root `.gitignore` | Vẫn tham chiếu thư mục `olm_playwright_tests/node_modules`, `.../dist`, `.../reports`... — **tên thư mục cũ không còn tồn tại** sau khi tách v1/v2 | Cập nhật thành `olm_playwright_tests_v1/` và `olm_playwright_tests_v2/` (hoặc dùng pattern `olm_playwright_tests_*/`) |
| `.github/workflows/playwright.yml` | **Bị hỏng thật sự**: `working-directory: olm_playwright_tests` và `cache-dependency-path: olm_playwright_tests/package-lock.json` trỏ tới thư mục **không còn tồn tại** → CI hiện tại chắc chắn fail ở bước checkout/cache. Xem chi tiết ở [mục 11](#11-cicd) | Cập nhật path, và nhân đôi job cho cả v1 và v2 (hoặc dùng `matrix`) |
| `test-results/.last-run.json` ở **thư mục gốc repo** | File rác lẻ loi, không thuộc cấu trúc tài liệu nào (bản thật nằm trong `olm_playwright_tests_v{1,2}/reports/test-results/`) | Xoá, thêm `test-results/` vào `.gitignore` gốc |
| `.idea/`, `.vscode/` | Config IDE cá nhân (JetBrains/VS Code), không cần thiết cho người khác clone | Thêm vào `.gitignore` gốc nếu chưa có, không commit |
| `node_modules/` trong cả v1 và v2 (~113 MB) | Được đóng gói **trong file zip** dù đã có trong `.gitignore` của từng dự án — không cần thiết khi chia sẻ/nộp bài, làm file nặng không cần thiết | Không zip `node_modules/`; người nhận tự `npm install` |
| `olm_crawler.py` | Không thuộc bộ Playwright, dùng Selenium độc lập, nhưng nằm ngay cấp gốc lẫn với code Playwright, dễ gây hiểu nhầm là 1 phần bộ test chính | Có thể giữ nguyên vị trí (đã ghi chú rõ trong README này) hoặc chuyển vào thư mục con riêng, VD `tools/crawler/`, để tách bạch khỏi bộ test Playwright |
| `element_taker.md`, `cấu_trúc_web.md` | Không trùng lặp, nhưng chưa được liên kết rõ ràng tới quy trình viết test | Đã thêm liên kết ở mục 6/8 của README này |

**Tóm lại — điều hướng "một cửa" sau khi dọn dẹp:**

```
README.md (gốc, file này)   ← điểm bắt đầu duy nhất cho MỌI thứ: cài đặt, chạy test, biến env, hàm quan trọng, data flow
FEATURE-REGISTRY.md (gốc)   ← tiến độ bao phủ test theo nghiệp vụ (gộp từ v1+v2, có cột phân biệt)
olm_playwright_tests_v1/    ← chỉ chứa CODE + config riêng, không cần README/FEATURE-REGISTRY riêng nữa
olm_playwright_tests_v2/    ← tương tự
```

---

## 10. ⚠️ Vấn đề bảo mật cần xử lý ngay

Rà soát phát hiện **thông tin đăng nhập thật (không phải placeholder)** đang nằm trực tiếp
trong nhiều file:

1. `olm_playwright_tests_v1/.env.example`, `.env.dev.example`, `olm_playwright_tests_v2/.env.debug.example`
   — các file `.example` **đáng lẽ chỉ nên chứa giá trị mẫu/placeholder** nhưng lại chứa
   username/password thật (VD `OLM_VIP_USERNAME=hsptolm_dothilananh`, có mật khẩu kèm theo).
2. `olm_playwright_tests_v1/.env.dev` và `olm_playwright_tests_v2/.env.debug` — đây là các
   file **lẽ ra phải bị `.gitignore`** (và đúng là có trong `.gitignore`), nhưng **vẫn được
   đóng gói trong file zip** này kèm giá trị thật.
3. `global-setup.ts` (cả v1 và v2) — `WORKER_ACCOUNTS` có **fallback cứng** ngay trong code
   (`process.env.OLM_VIP_USERNAME ?? 'hsptolm_dothilananh'`), nghĩa là nếu quên set biến môi
   trường, code vẫn tự dùng tài khoản thật hard-code sẵn.
4. `olm_crawler.py` — `LOGIN_USERNAME`/`LOGIN_PASSWORD` hard-code thẳng ở đầu file, không qua biến môi trường.

**Đề xuất xử lý:**
- Thay toàn bộ giá trị thật trong các file `*.example` bằng placeholder, VD `OLM_VIP_USERNAME=your_username_here`.
- Đổi mật khẩu các tài khoản test đã bị lộ trong file này nếu repo/zip từng được chia sẻ ra ngoài phạm vi cần thiết.
- Bỏ fallback cứng trong `global-setup.ts` và `olm_crawler.py`; nếu thiếu biến env thì nên `throw` lỗi rõ ràng thay vì âm thầm dùng tài khoản mặc định.
- Không đính kèm `.env`, `.env.dev`, `.env.debug` khi zip/chia sẻ repo — chỉ đính kèm bản `.example`.

---

## 11. CI/CD

`.github/workflows/playwright.yml` chạy 2 job (`smoke` khi có PR, `full` khi push
`main`/`master`), lấy credential từ GitHub Secrets (`OLM_VIP_USERNAME`, `OLM_SCHOOL_USERNAME`,
`OLM_NORMAL_USERNAME`,...). **Hiện tại workflow này bị hỏng**: cả 2 job đều dùng

```yaml
defaults:
  run:
    working-directory: olm_playwright_tests
```

và

```yaml
cache-dependency-path: olm_playwright_tests/package-lock.json
```

nhưng thư mục `olm_playwright_tests/` **không còn tồn tại** — repo đã tách thành
`olm_playwright_tests_v1/` và `olm_playwright_tests_v2/`. Cần sửa lại, ví dụ dùng `matrix`
để chạy CI cho cả 2 dự án:

```yaml
strategy:
  matrix:
    project: [olm_playwright_tests_v1, olm_playwright_tests_v2]
defaults:
  run:
    working-directory: ${{ matrix.project }}
```

và cập nhật `cache-dependency-path: ${{ matrix.project }}/package-lock.json` tương ứng.

---

## 12. Troubleshooting

- **Test timeout**: tăng `timeout`/`actionTimeout`/`navigationTimeout` trong
  `playwright.config.ts`, hoặc kiểm tra tốc độ mạng/server (đặc biệt `dev`/`debug` hay chậm hơn bản thật).
- **Lỗi session**: xoá thư mục `auth/` (và `storageState/` với v2) rồi chạy lại —
  `global-setup.ts` sẽ tự tạo lại.
- **Worker crash / nhiều worker giành 1 tài khoản**: giảm `WORKERS` (đặc biệt trên
  `debug.olm.vn` nơi chỉ có 1 tài khoản seed) — set qua biến env `WORKERS=1`.
- **Selector không còn đúng**: đối chiếu `element_taker.md` và `cấu_trúc_web.md`, hoặc kiểm
  tra lại DOM thật vì UI OLM có thể đã đổi (đặc biệt `debug.olm.vn` do đang phát triển).
- **`SCHOOL_SLUG`/`SCHOOL_ID` trống ở `.env.debug`**: config sẽ fallback về trường mặc định
  khác tài khoản → test trường/giáo viên có thể vào nhầm trường. Luôn điền đúng slug khớp
  tài khoản debug đang dùng.
- **Debug từng bước**: `npx playwright test --debug` hoặc `--ui` (UI mode xem step-by-step).

---

## Tài liệu khác trong repo

- **`postman/`** — Postman collection (VCS `.yaml`) cho API OLM: Authentication,
  Contest/ContestX, Digital Library, Learning, News, Payment, Q&A. Dùng đối chiếu khi viết
  `modules/api/tests/*.api.spec.ts` (v1).
- **`olm_crawler.py`** — script Python/Selenium độc lập, đăng nhập OLM và crawl danh sách bài
  học theo khối lớp ra file Excel. Cần cài `selenium`, `webdriver-manager`, `pandas`
  (`pip install selenium webdriver-manager pandas`).
- **`cấu_trúc_web.md`** — ghi chú cấu trúc menu/điều hướng olm.vn, tham chiếu khi đặt tên module đúng taxonomy web.
- **`element_taker.md`** — ghi chú cách lấy selector/element khi viết page object mới.