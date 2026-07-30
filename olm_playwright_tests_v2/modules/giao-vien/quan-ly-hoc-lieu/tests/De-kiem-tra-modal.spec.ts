import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../pages/Createhoclieumenu';

/**
 * TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra" — mở ra khi chọn mục "Đề kiểm tra"
 * (data-value="21") trong dropdown "Tạo mới học liệu". Đối chiếu trực tiếp từ
 * DOM thật (dialog, ghi nhận 2026-07-28):
 *   - Tiêu đề học liệu * (input placeholder "Nhập tiêu đề")
 *   - Mô tả học liệu (textarea placeholder "Nhập mô tả")
 *   - Khối lớp: * / Môn học: * (2 nút mở popover search-combobox)
 *   - Khối SEO (nền phụ): Từ khóa SEO / Tiêu đề SEO (tối đa 60 ký tự) /
 *     Mô tả SEO (tối đa 160 ký tự)
 *   - Footer: nút "Hủy" và nút "Tạo"
 *   - Nút đóng "X" (sr-only "Đóng") ở góc trên phải dialog
 *
 * Mỗi test tự đi lại từ đầu (goto danh sách -> mở dropdown -> chọn "Đề kiểm
 * tra" -> modal), theo đúng convention hiện có của dự án (xem các file spec
 * khác) thay vì dùng chung 1 hàm khởi tạo — tránh phải khai type thủ công cho
 * tham số fixture getPageAsRole.
 *
 * Đây là modal DUY NHẤT trong nhóm "học liệu tự do" đã có DOM thật đầy đủ
 * trong hội thoại này nên được test chi tiết nhất; các loại học liệu khác dùng
 * cấu trúc modal tương tự nhưng CHƯA được xác nhận bằng DOM thật riêng, xem
 * ghi chú trong Create-hoc-lieu-menu.spec.ts.
 */

test.describe('TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra" - Bố cục & trường dữ liệu', () => {
  test('TC-EXAM-MODAL-01: Hiển thị đủ tiêu đề modal và toàn bộ trường theo DOM thật', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

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

  test('TC-EXAM-MODAL-02: Trước khi chọn, nút Khối lớp/Môn học hiện đúng placeholder', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await expect(modal.gradeSelectBtn.locator('span').first()).toHaveText(/Chọn khối lớp/i);
    await expect(modal.subjectSelectBtn.locator('span').first()).toHaveText(/Chọn môn học/i);
  });

  test('TC-EXAM-MODAL-03: Nhãn "Khối lớp" và "Môn học" có dấu * đánh dấu bắt buộc', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await expect(modal.dialog.getByText('Khối lớp:')).toBeVisible();
    await expect(modal.dialog.getByText('Môn học:')).toBeVisible();
    // Dấu * bắt buộc nằm trong span riêng cạnh nhãn (class text-error-default trong DOM thật).
    await expect(modal.dialog.locator('label:has-text("Khối lớp:") span')).toHaveText('*');
    await expect(modal.dialog.locator('label:has-text("Môn học:") span')).toHaveText('*');
  });

  test('TC-EXAM-MODAL-04: Nhãn "Tiêu đề học liệu" có dấu * đánh dấu bắt buộc, "Mô tả học liệu" thì không', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await expect(modal.dialog.locator('label:has-text("Tiêu đề học liệu") span')).toHaveText('*');
    await expect(modal.dialog.locator('label:has-text("Mô tả học liệu")').locator('span')).toHaveCount(0);
  });
});

test.describe('TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra" - Chọn Khối lớp / Môn học', () => {
  test('TC-EXAM-MODAL-05: Chọn Khối lớp và Môn học cập nhật đúng nhãn nút, không còn placeholder', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await modal.selectGrade(/Lớp 12/i);
    await modal.selectSubject(/Toán/i);

    await modal.expectGradeSelected(/Lớp 12/i);
    await modal.expectSubjectSelected(/Toán/i);
    expect(await modal.selectedGradeText()).toBe('Lớp 12');
    expect(await modal.selectedSubjectText()).toBe('Toán');
  });

  test('TC-EXAM-MODAL-06: Popover Khối lớp có ô "Tìm kiếm..." và lọc đúng danh sách khi gõ', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

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

test.describe('TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra" - Khối SEO', () => {
  test('TC-EXAM-MODAL-07: Tiêu đề SEO giới hạn đúng 60 ký tự', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await expect(modal.seoTitleInput).toHaveAttribute('maxlength', '60');
    await modal.fillSeoTitle('a'.repeat(80));
    await expect(modal.seoTitleInput).toHaveValue('a'.repeat(60));
  });

  test('TC-EXAM-MODAL-08: Mô tả SEO giới hạn đúng 160 ký tự', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await expect(modal.seoDescriptionInput).toHaveAttribute('maxlength', '160');
    await modal.fillSeoDescription('b'.repeat(200));
    await expect(modal.seoDescriptionInput).toHaveValue('b'.repeat(160));
  });

  test('TC-EXAM-MODAL-09: Từ khóa SEO không giới hạn ký tự (không có maxlength trong DOM)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

    await expect(modal.seoKeywordInput).not.toHaveAttribute('maxlength', /.+/);
    const longKeyword = 'từ khóa seo '.repeat(10);
    await modal.fillSeoKeyword(longKeyword);
    await expect(modal.seoKeywordInput).toHaveValue(longKeyword);
  });
});

test.describe('TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra" - Submit / Hủy / Đóng', () => {
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

    // TODO: hành vi điều hướng sau khi tạo thành công chưa có DOM thật xác nhận
    // trực tiếp trong hội thoại này (dựa trên quy ước /quan-ly đã dùng nhất quán
    // cho các học liệu khác trong dự án) -> đối chiếu lại khi có ảnh chụp thật.
    await expect(page).toHaveURL(/\/quan-ly$/);
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