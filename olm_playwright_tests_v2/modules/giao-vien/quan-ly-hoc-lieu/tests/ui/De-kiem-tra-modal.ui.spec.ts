import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';

/**
 * [UI] TC-EXAM-MODAL: Bố cục modal "Tạo Đề kiểm tra" — mở ra khi chọn mục "Đề
 * kiểm tra" (data-value="21") trong dropdown "Tạo mới học liệu". Đối chiếu
 * trực tiếp từ DOM thật (dialog, ghi nhận 2026-07-28):
 *   - Tiêu đề học liệu * (input placeholder "Nhập tiêu đề")
 *   - Mô tả học liệu (textarea placeholder "Nhập mô tả")
 *   - Khối lớp: * / Môn học: * (2 nút mở popover search-combobox)
 *   - Khối SEO (nền phụ): Từ khóa SEO / Tiêu đề SEO (tối đa 60 ký tự) /
 *     Mô tả SEO (tối đa 160 ký tự)
 *   - Footer: nút "Hủy" và nút "Tạo"
 *   - Nút đóng "X" (sr-only "Đóng") ở góc trên phải dialog
 *
 * File này CHỈ kiểm tra HIỂN THỊ TĨNH (có mặt, placeholder, dấu * bắt buộc) —
 * KHÔNG thao tác điền/chọn/submit gì, nên không tạo dữ liệu và không cần chạy
 * theo thứ tự với các file khác. Phần hành vi (chọn Khối lớp/Môn học, giới
 * hạn ký tự SEO, submit thiếu field, Hủy/Đóng) nằm ở
 * ../function/De-kiem-tra-modal.function.spec.ts. Phần tạo học liệu thành
 * công (có ghi dữ liệu thật) nằm ở ../e2e/De-kiem-tra-modal.e2e.spec.ts.
 */
test.describe('[UI] TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra"', () => {
  test('TC-EXAM-MODAL-UI: Bố cục, trường dữ liệu và dấu bắt buộc', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await test.step('TC-EXAM-MODAL-01: Hiển thị đủ tiêu đề modal và toàn bộ trường theo DOM thật', async () => {
      await modal.expectTitle('Tạo Đề kiểm tra');
      await expect(modal.titleInput).toBeVisible();
      await expect(modal.titleInput).toHaveAttribute('placeholder', 'Nhập tiêu đề');
      await expect(modal.descriptionInput).toBeVisible();
      await expect(modal.descriptionInput).toHaveAttribute('placeholder', 'Nhập mô tả');
      await expect(modal.gradeSelectBtn).toBeVisible();
      await expect(modal.subjectSelectBtn).toBeVisible();
      await expect(modal.seoKeywordInput).toBeVisible();
      await expect(modal.seoTitleInput).toBeVisible();
      await expect(modal.seoDescriptionInput).toBeVisible();
      await expect(modal.btnCancel).toBeVisible();
      await expect(modal.btnSubmit).toBeVisible();
    });

    await test.step('TC-EXAM-MODAL-02: Trước khi chọn, nút Khối lớp/Môn học hiện đúng placeholder', async () => {
      await expect(modal.gradeSelectBtn.locator('span').first()).toHaveText(/Chọn khối lớp/i);
      await expect(modal.subjectSelectBtn.locator('span').first()).toHaveText(/Chọn môn học/i);
    });

    await test.step('TC-EXAM-MODAL-03: Nhãn "Khối lớp" và "Môn học" có dấu * đánh dấu bắt buộc', async () => {
      await expect(modal.dialog.getByText('Khối lớp:')).toBeVisible();
      await expect(modal.dialog.getByText('Môn học:')).toBeVisible();
      // Dấu * bắt buộc nằm trong span riêng cạnh nhãn (class text-error-default trong DOM thật).
      await expect(modal.dialog.locator('label:has-text("Khối lớp:") span')).toHaveText('*');
      await expect(modal.dialog.locator('label:has-text("Môn học:") span')).toHaveText('*');
    });

    await test.step('TC-EXAM-MODAL-04: Nhãn "Tiêu đề học liệu" có dấu * đánh dấu bắt buộc, "Mô tả học liệu" thì không', async () => {
      await expect(modal.dialog.locator('label:has-text("Tiêu đề học liệu") span')).toHaveText('*');
      await expect(modal.dialog.locator('label:has-text("Mô tả học liệu")').locator('span')).toHaveCount(0);
    });
  });
});
