import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../pages/Createhoclieumenu';

/**
 * TC-MENU: Dropdown "Tạo mới học liệu" ([cmdk-list]) trên trang "Học liệu của
 * tôi" V2. Đối chiếu trực tiếp từ DOM thật (ghi nhận 2026-07-28) — dropdown có
 * đúng 13 mục, mỗi mục là 1 [cmdk-item][data-value] tương ứng đúng
 * HOC_LIEU_TYPE (page/Createhoclieumenu.ts, KHÔNG sửa file này, chỉ dùng lại).
 *
 * File này CHỈ test đúng phần dropdown (danh sách mục, nhãn hiển thị, mô tả
 * phụ, mở đúng modal khi chọn "Đề kiểm tra"). Chi tiết đầy đủ của modal "Tạo
 * Đề kiểm tra" (field bắt buộc, validate, SEO, Hủy/Tạo...) nằm ở
 * De-kiem-tra-modal.spec.ts — các loại học liệu khác (Lý thuyết tương tác,
 * Video, Đề thi Tự luận, Liên kết, PDF/Word, Tài liệu, Mô phỏng, Game hóa,
 * NHCH, Đề thi ma trận, Luyện tập ma trận, Đề thi trộn Offline) CHƯA có DOM
 * thật của modal/màn soạn tương ứng trong hội thoại này nên CHƯA viết test mở
 * modal cho các loại đó — chỉ xác nhận mục đó có mặt & đúng nhãn trong dropdown.
 */

// Nhãn hiển thị đúng theo DOM thật, khớp value trong HOC_LIEU_TYPE (page/Createhoclieumenu.ts).
const LABEL_BY_TYPE: Record<string, string> = {
  [HOC_LIEU_TYPE.EXAM_MIXTURE_V2]: 'Đề kiểm tra',
  [HOC_LIEU_TYPE.NHCH]: 'Dạng bài, kĩ năng (NHCH)',
  [HOC_LIEU_TYPE.THEORY]: 'Lý thuyết tương tác',
  [HOC_LIEU_TYPE.VIDEO]: 'Video Youtube có điểm dừng',
  [HOC_LIEU_TYPE.ESSAY]: 'Đề thi Tự luận',
  [HOC_LIEU_TYPE.LINK]: 'Liên kết',
  [HOC_LIEU_TYPE.PDF]: 'Đề thi trắc nghiệm từ file PDF hoặc Word',
  [HOC_LIEU_TYPE.EXAM_STANDARD_MATRIX]: 'Đề thi trắc nghiệm từ ma trận',
  [HOC_LIEU_TYPE.EXAM_MIX]: 'Đề thi trộn Offline',
  [HOC_LIEU_TYPE.PRACTICE_MATRIX]: 'Đề luyện tập trắc nghiệm từ ma trận',
  [HOC_LIEU_TYPE.DOCUMENT]: 'Tài liệu',
  [HOC_LIEU_TYPE.SIMULATION]: 'Mô phỏng, thí nghiệm ảo',
  [HOC_LIEU_TYPE.GAME]: 'Game hóa',
};

test.describe('TC-MENU: Dropdown "Tạo mới học liệu"', () => {
  test('TC-MENU-01: Mở dropdown hiển thị đủ 13 loại học liệu (theo đúng data-value)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    await menu.open();

    const values = Object.values(HOC_LIEU_TYPE);
    expect(values).toHaveLength(13);
    for (const value of values) {
      await expect(menu.itemByValue(value)).toBeVisible();
    }
  });

  test('TC-MENU-02: Mỗi mục hiển thị đúng nhãn tương ứng với loại học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    await menu.open();

    for (const [value, label] of Object.entries(LABEL_BY_TYPE)) {
      await expect(menu.itemByValue(value)).toContainText(label);
    }
  });

  test('TC-MENU-03: Mục "Đề kiểm tra" có dòng mô tả phụ đúng nghiệp vụ soạn đề / tạo từ ma trận', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    await menu.open();

    await expect(menu.itemByValue(HOC_LIEU_TYPE.EXAM_MIXTURE_V2)).toContainText(
      /Soạn đề hoặc tạo từ ma trận\. Tùy chọn hiển thị dạng Đề thi hoặc Luyện tập\./i,
    );
  });

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