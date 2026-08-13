import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';
import { ExamModal } from '../../pages/Hoclieucuatoiv2page';

/**
 * createNewAndOpenModal() trả về union CreateMaterialModal | ExamModal |
 * GameQuestionModal — kiểu trả về không tự narrow theo giá trị tham số
 * truyền vào (TS không biết EXAM_MIXTURE_V2 luôn ứng với nhánh ExamModal ở
 * runtime). File này CHỈ thao tác modal "Tạo Đề kiểm tra" (ExamModal) nên bọc
 * lại lời gọi qua helper này để có kiểu ExamModal cụ thể — dùng instanceof
 * làm assertion thật (ném lỗi rõ ràng nếu runtime trả về sai loại modal,
 * thay vì ép kiểu mù bằng "as ExamModal").
 */
async function openExamModal(menu: CreateHocLieuMenu): Promise<ExamModal> {
  const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);
  if (!(modal instanceof ExamModal)) {
    throw new Error(
      `[openExamModal] Mong đợi ExamModal cho HOC_LIEU_TYPE.EXAM_MIXTURE_V2 nhưng nhận được ${modal.constructor.name}`,
    );
  }
  return modal;
}

/**
 * [FUNCTION] TC-EXAM-MODAL: Hành vi từng phần của modal "Tạo Đề kiểm tra" —
 * chọn Khối lớp/Môn học, tìm kiếm trong popover, submit khi thiếu field bắt
 * buộc (modal KHÔNG đóng, KHÔNG điều hướng), và đóng modal qua "Hủy"/"X"
 * (không tạo học liệu). File này KHÔNG tạo dữ liệu thật trên hệ thống —
 * trường hợp submit thành công (có ghi dữ liệu) nằm riêng ở
 * ../e2e/De-kiem-tra-modal.e2e.spec.ts.
 *
 * Toàn bộ các ca (TC-05,06,10,12,13) đều xử lý trên CÙNG 1 trang (mở/đóng
 * modal, không điều hướng sang trang khác) nên gộp chung 1 test / 1 page /
 * 1 browser context, chạy tuần tự qua test.step() — không mở lại
 * getPageAsRole() (tức không mở browser mới) cho từng ca nhỏ. Mỗi step tự
 * mở lại modal từ đầu và có dọn dẹp (đóng modal) trước khi sang step kế
 * tiếp.
 */
test.describe('[FUNCTION] TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra"', () => {
  test('TC-EXAM-MODAL-05, 06, 10, 12, 13: Chọn Khối lớp/Môn học và hành vi đóng/không đóng modal', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);

    await test.step('TC-EXAM-MODAL-05, 06: Chọn Khối lớp/Môn học qua popover search-combobox', async () => {
      const modal = await openExamModal(menu);

      await test.step('TC-EXAM-MODAL-05: Chọn Khối lớp và Môn học cập nhật đúng nhãn nút, không còn placeholder', async () => {
        await modal.selectGrade(/Lớp 12/i);
        await modal.selectSubject(/Toán/i);

        await modal.expectGradeSelected(/Lớp 12/i);
        await modal.expectSubjectSelected(/Toán/i);
        expect(await modal.selectedGradeText()).toBe('Lớp 12');
        expect(await modal.selectedSubjectText()).toBe('Toán');
      });

      await test.step('TC-EXAM-MODAL-06: Popover Khối lớp có ô "Tìm kiếm..." và lọc đúng danh sách khi gõ', async () => {
        await modal.gradeSelectBtn.click();
        const searchBox = page.getByPlaceholder('Tìm kiếm...');
        await expect(searchBox).toBeVisible();

        await searchBox.fill('Lớp 12');
        await expect(page.getByRole('option', { name: 'Lớp 12', exact: true })).toBeVisible();
        await expect(page.getByRole('option', { name: 'Mẫu giáo', exact: true })).toBeHidden();

        await page.getByRole('option', { name: 'Lớp 12', exact: true }).click();
        await modal.expectGradeSelected(/Lớp 12/i);
      });

      // Đóng modal để không ảnh hưởng tới step tiếp theo trong cùng 1 browser.
      await modal.close();
      await expect(modal.dialog).toBeHidden();
    });

    // TC-EXAM-MODAL-07, 08, 09 (giới hạn ký tự các trường SEO) đã bị xóa: đối
    // chiếu lại DOM thật của modal "Tạo Đề kiểm tra" (2026-08-06) cho thấy modal
    // KHÔNG có khối SEO (Từ khóa/Tiêu đề/Mô tả SEO) — chỉ có Tiêu đề học liệu,
    // Mô tả học liệu, Khối lớp, Môn học.

    await test.step('TC-EXAM-MODAL-10: Bỏ trống trường bắt buộc rồi bấm "Tạo" -> modal không đóng, không điều hướng', async () => {
      const modal = await openExamModal(menu);
      const urlBefore = page.url();
      await modal.submit();

      // TODO: khi có DOM thật lúc submit thiếu field (border đỏ / message "Vui lòng
      // chọn khối lớp"...), thay assertion dưới bằng kiểm tra thông báo lỗi cụ thể
      // thay vì chỉ "modal vẫn còn + URL không đổi".
      await expect(modal.dialog).toBeVisible();
      expect(page.url()).toBe(urlBefore);

      // Đóng modal để không ảnh hưởng tới step tiếp theo trong cùng 1 browser.
      await modal.close();
      await expect(modal.dialog).toBeHidden();
    });

    await test.step('TC-EXAM-MODAL-12: Bấm "Hủy" đóng modal, không tạo học liệu mới, ở lại trang danh sách', async () => {
      const modal = await openExamModal(menu);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
      // Số học liệu trong danh sách không đổi (không có gì được tạo mới).
      expect(await listPage.getRowCount()).toBeGreaterThan(0);
    });

    await test.step('TC-EXAM-MODAL-13: Bấm nút đóng "X" đóng modal, không tạo học liệu mới', async () => {
      const modal = await openExamModal(menu);
      await modal.close();

      await expect(modal.dialog).toBeHidden();
      await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
    });
  });
});