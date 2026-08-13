import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';

/**
 * [E2E] TC-LIST: Luồng điều hướng thật từ trang "Học liệu của tôi" (V2) sang
 * trang khác trong hệ thống — bấm "Xem" / "Sửa" trên 1 dòng phải đưa người
 * dùng đúng tới trang chi tiết/quản lý học liệu tương ứng (không chỉ verify
 * href tĩnh mà verify cả URL thực tế sau khi điều hướng).
 */
test.describe('[E2E] TC-LIST: Điều hướng Xem/Sửa học liệu @v2role_editableTeacher', () => {
  test('TC-LIST-17: Bấm "Xem" mở đúng trang chi tiết học liệu (link Xem trỏ đúng URL)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const row = listPage.getRowByIndex(0);
    const { viewUrl } = await listPage.getRowData(row);
    expect(viewUrl).toMatch(/\/chu-de\//);
    await listPage.viewCourseware(row);
    expect(page.url()).toBe(viewUrl);
  });

  test('TC-LIST-18: Bấm "Sửa" điều hướng đúng trang quản lý (kết thúc bằng /quan-ly)', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const row = listPage.getRowByIndex(0);
    const { editUrl } = await listPage.getRowData(row);
    expect(editUrl).toMatch(/\/quan-ly$/);
    await listPage.editCourseware(row);
    await expect(page).toHaveURL(/\/quan-ly$/);
  });
});
