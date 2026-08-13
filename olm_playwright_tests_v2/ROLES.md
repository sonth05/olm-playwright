# Tách lệnh chạy & test theo Role

Dự án có **2 hệ thống role khác nhau**, mỗi hệ độc lập với hệ kia:

1. **6 role tài khoản** (`WorkerAccountLabel`, khai báo ở `global-setup.ts` →
   `WORKER_ACCOUNTS`) — dùng bởi `core/fixtures/role.fixture.ts`
   (`teacherPage`/`studentPage`/`normalStudentPage`) và
   `fixtures/auth.fixture.ts` (`authenticatedPage` + `authRole`):
   `admin`, `school`, `teacher_vip`, `teacher_no_vip`, `student_vip`, `student_no_vip`.

2. **5 vai trò nghiệp vụ V2** (`V2Role`, khai báo ở
   `core/fixtures/V2authoringrole.fixture.ts`) — dùng bởi `getPageAsRole(role)`
   trong module "Soạn học liệu V2":
   `editableTeacher`, `nonEditableTeacher`, `olmSourceTeacher`,
   `nonOlmSourceTeacher`, `olmStaff`.

Vì một test/describe có thể nằm ở bất kỳ module nào (`giao-vien`, `hoc-sinh`,
`dung-chung`...), tách theo **thư mục** (`test:giao-vien`, `test:hoc-sinh`...)
không đủ để chạy đúng 1 role. Nên dùng **tag gắn trực tiếp trên
`test.describe(...)`/`test(...)`**, lọc bằng `--grep` của Playwright — chạy
lệnh của role nào thì CHỈ chạy đúng ca test của role đó, bất kể ca đó nằm ở
module/thư mục nào.

## Quy ước tag

Nối thêm tag vào cuối chuỗi title (giống quy ước `@smoke`/`@regression` đã có
sẵn trong dự án):

| Role (tài khoản) | Tag                       |
|-------------------|---------------------------|
| admin              | `@role_admin`             |
| school              | `@role_school`             |
| teacher_vip         | `@role_teacher_vip`        |
| teacher_no_vip      | `@role_teacher_no_vip`     |
| student_vip         | `@role_student_vip`        |
| student_no_vip      | `@role_student_no_vip`     |

| Vai trò V2 (`getPageAsRole`) | Tag                             |
|-------------------------------|----------------------------------|
| editableTeacher                | `@v2role_editableTeacher`       |
| nonEditableTeacher              | `@v2role_nonEditableTeacher`    |
| olmSourceTeacher                | `@v2role_olmSourceTeacher`      |
| nonOlmSourceTeacher             | `@v2role_nonOlmSourceTeacher`   |
| olmStaff                        | `@v2role_olmStaff`              |

- Nếu **cả `describe` dùng chung 1 role** (đa số trường hợp) → gắn tag lên
  `test.describe('... @role_xxx', () => { ... })`.
- Nếu **các test trong cùng 1 `describe` dùng role khác nhau** (ví dụ
  `De-kiem-tra-modal.ui.spec.ts`: 2 test `editableTeacher` + 1 test
  `olmStaff`) → gắn tag lên **từng `test(...)`** thay vì `describe`.
- Test không đăng nhập (trang public: `contest`, `news`, `hoi-dap`, trang chủ
  không cần login, `login`/`registration` tự test flow đăng nhập...) thì
  **không gắn tag role** — các lệnh `test:role:*`/`test:v2role:*` sẽ tự động
  không chạy các ca này.

## Đã gắn tag cho code hiện có

- `@role_teacher_vip`: `modules/giao-vien/quan-ly-lop-hoc/tests/lop-hoc.regression.spec.ts`
- `@role_admin`: `modules/dung-chung/homepage/tests/user-journey.e2e.spec.ts`
  (dùng thẳng `authPathForWorker(0)` = tài khoản admin, không qua `authRole`)
- `@role_student_vip` (mặc định của `authenticatedPage` khi không override
  `authRole`): các file dưới `modules/hoc-sinh/kids-zone`,
  `modules/hoc-sinh/payment`, `lam-bai-tap-trong-bai-hoc.regression.spec.ts`,
  `modules/dung-chung/homepage/tests/homepage.regression.spec.ts`
- `@v2role_editableTeacher`: toàn bộ test còn lại trong
  `modules/giao-vien/quan-ly-hoc-lieu/tests/**` và
  `modules/dung-chung/khoa-hoc-olm/tests/**` (trừ 1 test `olmStaff` bên dưới)
- `@v2role_olmStaff`: test "Nhân sự OLM: kiểm tra UI 12 loại học liệu" trong
  `De-kiem-tra-modal.ui.spec.ts`

Chưa có ca test nào dùng `school`, `teacher_no_vip`, `student_no_vip`,
`nonEditableTeacher`, `olmSourceTeacher`, `nonOlmSourceTeacher` — các lệnh
tương ứng bên dưới sẽ báo "no tests found" cho tới khi có test mới gắn đúng
tag.

## Lệnh chạy theo role

```bash
# 6 role tài khoản
npm run test:role:admin
npm run test:role:school
npm run test:role:teacher-vip
npm run test:role:teacher-no-vip
npm run test:role:student-vip
npm run test:role:student-no-vip

# 5 vai trò V2
npm run test:v2role:editable-teacher
npm run test:v2role:non-editable-teacher
npm run test:v2role:olm-source-teacher
npm run test:v2role:non-olm-source-teacher
npm run test:v2role:olm-staff
```

Mỗi lệnh trên đều có bản `test:debug:role:*` / `test:debug:v2role:*` tương ứng
(chạy với `ENV_FILE=.env.debug`), giống quy ước `test:debug:*` đã có sẵn.

Có thể kết hợp thêm path để chỉ chạy 1 module của đúng role đó, ví dụ:

```bash
npx playwright test --grep @role_student_vip modules/hoc-sinh
```

## Viết test mới

Khi thêm `describe`/`test` mới có đăng nhập, LUÔN gắn thêm đúng 1 tag role ở
trên vào cuối title (theo bảng trên) để tag không "lọt" khỏi các lệnh
`test:role:*`/`test:v2role:*`.
