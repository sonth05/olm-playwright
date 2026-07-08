# FEATURE-REGISTRY — OLM Automation (v4)

Backlog theo chuỗi nghiệp vụ thật. Trạng thái cập nhật khi triển khai plan v4.

| # | Bước | Module / Page Object | Trạng thái | Ghi chú |
|---|------|----------------------|------------|---------|
| 1 | GV quản lý Lớp học (1.2) | `modules/quan-ly-lop-hoc/pages/LopHocPage.ts` | 🟡 WIP | Smoke: list + nút Thêm lớp. CRUD đầy đủ chưa có |
| 2 | GV xếp TKB (1.8) | `modules/thoi-khoa-bieu/pages/ThoiKhoaBieuPage.ts` | 🟡 WIP | Smoke load tkb.olm.vn. Tạo/sửa TKB chưa có |
| 3 | GV điểm danh (1.5, 1.6) | `modules/diem-danh/` | ⬜ Chưa | |
| 4 | GV NHCH + ma trận (2.6, 2.7) | `modules/ngan-hang-cau-hoi-ma-tran/` | ⬜ Chưa | |
| 5 | GV trộn đề (2.9) | `TronDePage.ts` (trong module 4) | ⬜ Chưa | |
| 6 | GV giao bài (1.3) | `modules/giao-bai/pages/AssignmentPage.ts` | ⬜ Chưa | Hiện inline trong `tests/e2e/Giao-bai-lam-bai.e2e.spec.ts` |
| 7 | HS thấy bài giao | `Homepageloggedin.ts` + e2e nối | ⬜ Chưa | Chỉ check link tĩnh trong Homepage.spec |
| 8 | HS làm bài giao | `scripts/lamBaiEngine.ts` | ✅ Có | E2E Vật lí THPT; cần thêm môn |
| 9 | HS làm BT trong bài học | `pages/LessonPage.ts` + regression | ✅ Mới | `modules/learning-core/tests/lam-bai-tap-trong-bai-hoc.regression.spec.ts` |
| 10 | HS hỏi đáp | `HoiDapPage` (tests/api + regression) | ✅ Có | |
| 11 | GV báo cáo thống kê (3.1, 3.2) | `modules/bao-cao-thong-ke/` | ⬜ Chưa | |

## Cross-role flows (tầng nối mũi tên)

| File | Bước nối | Trạng thái |
|------|----------|------------|
| `cross-role-flows/giao-bai-den-lam-bai.e2e.spec.ts` | 6→7→8 | ⬜ Chưa (script cũ ở `tests/e2e/`) |
| `cross-role-flows/tao-de-den-giao-bai.e2e.spec.ts` | 4→5→6 | ⬜ Chưa |
| `cross-role-flows/diem-danh-den-thong-ke.e2e.spec.ts` | 3→11 | ⬜ Chưa |
| `cross-role-flows/hoi-dap-tu-bai-hoc.e2e.spec.ts` | 9→10 | ⬜ Nice-to-have |

## Fixtures

| File | Mục đích | Trạng thái |
|------|----------|------------|
| `fixtures/auth.fixture.ts` | Page theo worker index (legacy) | ✅ |
| `core/fixtures/role.fixture.ts` | Page theo role (teacher/student) | ✅ Mới |
| `core/fixtures/dual-role.fixture.ts` | 2 context GV+HS đồng thời | ✅ Mới |

## Cần xác nhận team

- `ACCOUNTS.school` = giáo viên (hiện dùng worker-1, role `school` trong test-users.json)
- Trộn đề 2.9: sinh đề mới hay chọn từ kho?
- Điểm danh Zoom/Meet: có gọi API bên thứ 3 thật không?
