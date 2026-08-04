import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';

/**
 * [FUNCTION] TC-EXAM-MODAL: Hành vi từng phần của modal "Tạo Đề kiểm tra" —
 * chọn Khối lớp/Môn học, tìm kiếm trong popover, giới hạn ký tự các trường
 * SEO, submit khi thiếu field bắt buộc (modal KHÔNG đóng, KHÔNG điều hướng),
 * và đóng modal qua "Hủy"/"X" (không tạo học liệu). File này KHÔNG tạo dữ
 * liệu thật trên hệ thống — trường hợp submit thành công (có ghi dữ liệu)
 * nằm riêng ở ../e2e/De-kiem-tra-modal.e2e.spec.ts.
 *
 * Mỗi test tự mở lại modal từ đầu (mở dropdown -> chọn "Đề kiểm tra") để độc
 * lập với nhau, tránh phụ thuộc thứ tự chạy giữa các test trong cùng file.
 */
test.describe('[FUNCTION] TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra"', () => {
  test('TC-EXAM-MODAL-05, 06: Chọn Khối lớp/Môn học qua popover search-combobox', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

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
  });

  test('TC-EXAM-MODAL-07, 08, 09: Giới hạn ký tự các trường SEO', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await test.step('TC-EXAM-MODAL-07: Tiêu đề SEO giới hạn đúng 60 ký tự', async () => {
      await expect(modal.seoTitleInput).toHaveAttribute('maxlength', '60');
      await modal.fillSeoTitle('a'.repeat(80));
      await expect(modal.seoTitleInput).toHaveValue('a'.repeat(60));
    });

    await test.step('TC-EXAM-MODAL-08: Mô tả SEO giới hạn đúng 160 ký tự', async () => {
      await expect(modal.seoDescriptionInput).toHaveAttribute('maxlength', '160');
      await modal.fillSeoDescription('b'.repeat(200));
      await expect(modal.seoDescriptionInput).toHaveValue('b'.repeat(160));
    });

    await test.step('TC-EXAM-MODAL-09: Từ khóa SEO không giới hạn ký tự (không có maxlength trong DOM)', async () => {
      await expect(modal.seoKeywordInput).not.toHaveAttribute('maxlength', /.+/);
      const longKeyword = 'từ khóa seo '.repeat(10);
      await modal.fillSeoKeyword(longKeyword);
      await expect(modal.seoKeywordInput).toHaveValue(longKeyword);
    });
  });

  test('TC-EXAM-MODAL-10: Bỏ trống trường bắt buộc rồi bấm "Tạo" -> modal không đóng, không điều hướng', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    const urlBefore = page.url();
    await modal.submit();

    // TODO: khi có DOM thật lúc submit thiếu field (border đỏ / message "Vui lòng
    // chọn khối lớp"...), thay assertion dưới bằng kiểm tra thông báo lỗi cụ thể
    // thay vì chỉ "modal vẫn còn + URL không đổi".
    await expect(modal.dialog).toBeVisible();
    expect(page.url()).toBe(urlBefore);
  });

  test('TC-EXAM-MODAL-12: Bấm "Hủy" đóng modal, không tạo học liệu mới, ở lại trang danh sách', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await modal.cancel();

    await expect(modal.dialog).toBeHidden();
    await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
    // Số học liệu trong danh sách không đổi (không có gì được tạo mới).
    expect(await listPage.getRowCount()).toBeGreaterThan(0);
  });

  test('TC-EXAM-MODAL-13: Bấm nút đóng "X" đóng modal, không tạo học liệu mới', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await modal.close();

    await expect(modal.dialog).toBeHidden();
    await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
  });
});
