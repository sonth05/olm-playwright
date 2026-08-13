import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';
import { ExamModal } from '../../pages/Hoclieucuatoiv2page';

test.describe('[E2E] TC-EXAM-MODAL: Tạo mới "Đề kiểm tra" @v2role_editableTeacher', () => {
  test('TC-EXAM-MODAL-11: Điền đủ Tiêu đề/Khối lớp/Môn học rồi bấm "Tạo" -> vào đúng trang quản lý học liệu mới', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);
    const modal = (await menu.createNewAndOpenModal(HOC_LIEU_TYPE.EXAM_MIXTURE_V2)) as ExamModal;

    const title = `Đề kiểm tra test ${Date.now()}`;
    await modal.titleInput.fill(title);
    await modal.selectGrade(/Lớp 10/i);
    await modal.selectSubject(/Toán/i);
    await modal.submit();

    await expect(page).toHaveURL(/\/quan-ly$/);
  });
});