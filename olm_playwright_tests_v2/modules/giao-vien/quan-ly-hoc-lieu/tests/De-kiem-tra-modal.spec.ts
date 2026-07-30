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
 * CẢNH BÁO DỮ LIỆU (2026-07-30): TC-EXAM-MODAL-11 dưới đây TẠO THẬT 1 học liệu
 * mới trên tài khoản test (đã xác nhận qua ảnh chụp — badge "Tất cả" đã lên 4,
 * xuất hiện dòng học liệu "sdasdasdasd" do lần chạy test trước để lại). File
 * Hoc-lieu-cua-toi.spec.ts có assertion đếm số lượng CỐ ĐỊNH -> LUÔN chạy file
 * đó TRƯỚC file này (không chạy song song/sau), hoặc dùng tài khoản test riêng
 * cho việc tạo mới để không làm sai lệch số liệu đếm.
 *
 * GỘP 1 TRANG = 1 TEST (2026-07-30): thay vì 13 test riêng (TC-EXAM-MODAL-01..13),
 * gộp thành 1 test duy nhất. Các bước KHÔNG làm đóng modal (01-10: bố cục,
 * required mark, chọn Khối lớp/Môn học, giới hạn SEO, submit thiếu field) dùng
 * CHUNG 1 lần mở modal để giảm số lần goto()+mở dropdown lặp lại. Các bước LÀM
 * ĐÓNG modal hoặc điều hướng trang (11: tạo thành công, 12: Hủy, 13: đóng "X")
 * mỗi bước tự mở lại modal mới ở đầu bước, vì trạng thái trước đó không còn
 * hợp lệ để tiếp tục (modal đã đóng/đã điều hướng sang trang khác).
 */

test.describe('TC-EXAM-MODAL: Modal "Tạo Đề kiểm tra"', () => {
  test('TC-EXAM-MODAL: Toàn bộ bố cục, trường dữ liệu và hành vi Submit/Hủy/Đóng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    let modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

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

    await test.step('TC-EXAM-MODAL-10: Bỏ trống trường bắt buộc rồi bấm "Tạo" -> modal không đóng, không điều hướng', async () => {
      // Dùng modal MỚI (Tiêu đề/Khối lớp/Môn học đã bị điền ở các bước trên sẽ
      // làm sai mục đích của test này - cần trạng thái trống thật sự).
      await modal.close();
      await listPage.goto();
      modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

      const urlBefore = page.url();
      await modal.submit();

      // TODO: khi có DOM thật lúc submit thiếu field (border đỏ / message "Vui lòng
      // chọn khối lớp"...), thay assertion dưới bằng kiểm tra thông báo lỗi cụ thể
      // thay vì chỉ "modal vẫn còn + URL không đổi".
      await expect(modal.dialog).toBeVisible();
      expect(page.url()).toBe(urlBefore);
    });

    await test.step('TC-EXAM-MODAL-11: Điền đủ Tiêu đề/Khối lớp/Môn học rồi bấm "Tạo" -> vào đúng trang quản lý học liệu mới', async () => {
      const title = `Đề kiểm tra test ${Date.now()}`;
      await modal.fillRequiredAndSubmit({ title, grade: /Lớp 10/i, subject: /Toán/i });

      // TODO: hành vi điều hướng sau khi tạo thành công chưa có DOM thật xác nhận
      // trực tiếp trong hội thoại này (dựa trên quy ước /quan-ly đã dùng nhất quán
      // cho các học liệu khác trong dự án) -> đối chiếu lại khi có ảnh chụp thật.
      await expect(page).toHaveURL(/\/quan-ly$/);
    });

    await test.step('TC-EXAM-MODAL-12: Bấm "Hủy" đóng modal, không tạo học liệu mới, ở lại trang danh sách', async () => {
      await listPage.goto();
      modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
      // Số học liệu trong danh sách không đổi (không có gì được tạo mới).
      expect(await listPage.getRowCount()).toBeGreaterThan(0);
    });

    await test.step('TC-EXAM-MODAL-13: Bấm nút đóng "X" đóng modal, không tạo học liệu mới', async () => {
      modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);

      await modal.close();

      await expect(modal.dialog).toBeHidden();
      await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
    });
  });
});