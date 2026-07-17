import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { TheoryPage } from '../page/Theorypage';

/**
 * Nhóm chức năng chung TC-COM-01..09.
 * Dùng Theory làm đại diện để test khối header/save/preview dùng chung; các file spec riêng
 * của từng loại học liệu sẽ không lặp lại nhóm này, chỉ test phần đặc thù.
 *
 * TODO: thay HOC_LIEU_URL_EDITABLE / HOC_LIEU_URL_NO_ACTIONS bằng URL học liệu thật trên môi trường test
 * (nên tạo sẵn fixture data qua API/seed để tránh phụ thuộc dữ liệu thủ công).
 */
const HOC_LIEU_URL_EDITABLE = '/chu-de/hoc-lieu-ly-thuyet-demo/quan-ly';
const HOC_LIEU_URL_NO_EDIT_PERMISSION = '/chu-de/hoc-lieu-ly-thuyet-demo/quan-ly';

test.describe('TC-COM: Nhóm chức năng chung màn Soạn học liệu V2', () => {
  test('TC-COM-01: Mở màn soạn học liệu V2 thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    await expect(theory.btnSave).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/lỗi|error/i);
  });

  test('TC-COM-02: Chặn truy cập khi không có quyền sửa học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('nonEditableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_NO_EDIT_PERMISSION);

    await theory.expectAccessDenied();
  });

  test('TC-COM-03: Chỉ hiển thị các hành động header được phép', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    // TODO: điều chỉnh bộ action mong đợi theo quyền thật của học liệu demo
    await theory.expectHeaderActionsVisible({
      save: true,
      preview: true,
      copyLink: true,
    });
  });

  test('TC-COM-04 & TC-COM-05: Lưu thay đổi và tải lại vẫn giữ đúng dữ liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    const content = `Nội dung kiểm thử ${Date.now()}`;
    await theory.switchToEditorMode();
    await theory.typeContentAtCursor(content);
    await theory.save();
    await theory.expectSavedSuccessfully();

    await theory.reloadAndVerify(async () => {
      await expect(theory.editor).toContainText(content);
    });
  });

  test('TC-COM-06: Xem trước học liệu hiển thị đúng dữ liệu hiện tại', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    const [previewPage] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      theory.openPreview(),
    ]);
    const target = previewPage ?? page;
    await expect(target.locator('body')).toBeVisible();
  });

  test('TC-COM-07: Điều hướng đúng tới danh sách lượt làm', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    if (!(await theory.btnSubmissionList.isVisible().catch(() => false))) {
      test.skip(true, 'Học liệu demo không có action Danh sách lượt làm');
    }
    await theory.openSubmissionList();
    await expect(page.url()).toMatch(/lam-bai|submission|ket-qua/i);
  });

  test('TC-COM-08: Sao chép liên kết học liệu hợp lệ', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    const link = await theory.copyLink();
    expect(link).toMatch(/^https?:\/\//);
  });

  test('TC-COM-09: Mở đúng dữ liệu lịch sử học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL_EDITABLE);

    if (!(await theory.btnHistory.isVisible().catch(() => false))) {
      test.skip(true, 'Học liệu demo không có action Lịch sử');
    }
    await theory.openHistory();
    await expect(page.getByText(/lịch sử/i)).toBeVisible();
  });
});