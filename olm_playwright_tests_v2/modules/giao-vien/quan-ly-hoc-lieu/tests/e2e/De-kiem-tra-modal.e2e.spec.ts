import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';

/**
 * [E2E] TC-EXAM-MODAL-11: Luồng đầy đủ tạo mới "Đề kiểm tra" — mở dropdown
 * "Tạo mới học liệu" -> chọn "Đề kiểm tra" -> điền đủ Tiêu đề/Khối lớp/Môn
 * học -> bấm "Tạo" -> hệ thống ghi học liệu mới và điều hướng sang trang quản
 * lý học liệu vừa tạo (kết thúc bằng /quan-ly).
 *
 * CẢNH BÁO DỮ LIỆU (giữ nguyên từ 2026-07-30): test này TẠO THẬT 1 học liệu
 * mới trên tài khoản test (đã xác nhận qua ảnh chụp — badge "Tất cả" đã lên
 * 4, xuất hiện dòng học liệu "sdasdasdasd" do lần chạy test trước để lại).
 * ../function/Hoc-lieu-cua-toi.function.spec.ts (TC-LIST-04) có assertion đếm
 * số lượng CỐ ĐỊNH theo SEED_ROWS -> file đó LUÔN phải chạy TRƯỚC file này
 * (không chạy song song/sau), hoặc dùng tài khoản test riêng cho việc tạo mới
 * để không làm sai lệch số liệu đếm.
 *
 * TODO: hành vi điều hướng sau khi tạo thành công chưa có DOM thật xác nhận
 * trực tiếp (dựa trên quy ước /quan-ly đã dùng nhất quán cho các học liệu
 * khác trong dự án) -> đối chiếu lại khi có ảnh chụp thật.
 */
test.describe('[E2E] TC-EXAM-MODAL: Tạo mới "Đề kiểm tra"', () => {
  test('TC-EXAM-MODAL-11: Điền đủ Tiêu đề/Khối lớp/Môn học rồi bấm "Tạo" -> vào đúng trang quản lý học liệu mới', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    const title = `Đề kiểm tra test ${Date.now()}`;
    await modal.fillRequiredAndSubmit({ title, grade: /Lớp 10/i, subject: /Toán/i });

    await expect(page).toHaveURL(/\/quan-ly$/);
  });
});
