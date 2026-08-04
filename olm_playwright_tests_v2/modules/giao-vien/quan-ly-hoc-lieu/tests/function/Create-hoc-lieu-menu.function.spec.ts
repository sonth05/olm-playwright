import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';

/**
 * [FUNCTION] TC-MENU: Hành vi dropdown "Tạo mới học liệu" — chọn mục mở đúng
 * modal tương ứng, đóng dropdown (Escape) không tạo học liệu nào. Phần hiển
 * thị tĩnh (đủ mục, đúng nhãn/mô tả) nằm ở
 * ../ui/Create-hoc-lieu-menu.ui.spec.ts.
 *
 * Chỉ có 1 loại học liệu ("Đề kiểm tra") có DOM thật của modal tương ứng nên
 * test chọn mục chỉ verify được item này — các loại khác đã được xác nhận có
 * mặt & đúng nhãn trong dropdown ở phần UI, chưa có modal thật để verify hành
 * vi mở modal.
 */
test.describe('[FUNCTION] TC-MENU: Dropdown "Tạo mới học liệu"', () => {
  test('TC-MENU-04: Chọn "Đề kiểm tra" mở đúng modal "Tạo Đề kiểm tra"', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2);
    await modal.expectTitle('Tạo Đề kiểm tra');
  });

  test('TC-MENU-05: Đóng dropdown (bấm ra ngoài) không tạo học liệu nào, vẫn ở trang danh sách', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    await menu.open();

    await expect(menu.menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu.menu).toBeHidden();
    await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
  });
});
