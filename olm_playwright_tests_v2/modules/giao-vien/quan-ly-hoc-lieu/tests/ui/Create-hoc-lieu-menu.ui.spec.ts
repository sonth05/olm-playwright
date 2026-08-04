import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';

/**
 * [UI] TC-MENU: Dropdown "Tạo mới học liệu" ([cmdk-list]) trên trang "Học liệu
 * của tôi" V2. Đối chiếu trực tiếp từ DOM thật (ghi nhận 2026-07-28) — dropdown
 * có đúng 13 mục, mỗi mục là 1 [cmdk-item][data-value] tương ứng đúng
 * HOC_LIEU_TYPE (page/Createhoclieumenu.ts, KHÔNG sửa file này, chỉ dùng lại).
 *
 * File này CHỈ kiểm tra HIỂN THỊ TĨNH của dropdown (đủ mục, đúng nhãn, đúng mô
 * tả phụ) — không thao tác chọn mục hay đóng dropdown. Phần hành vi (chọn mục
 * mở modal, đóng dropdown không tạo gì) nằm ở
 * ../function/Create-hoc-lieu-menu.function.spec.ts.
 *
 * TÁCH THEO LOẠI TEST (2026-08-04): trước đây gộp cả UI + hành vi vào 1 file
 * duy nhất (Create-hoc-lieu-menu.spec.ts). Nay tách UI/Function/E2E ra các
 * thư mục riêng để dễ chạy/lọc theo mục đích (VD chỉ chạy UI khi review giao
 * diện, bỏ qua phần tạo dữ liệu khi không cần).
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

test.describe('[UI] TC-MENU: Dropdown "Tạo mới học liệu"', () => {
  test('TC-MENU-UI: Bố cục & nội dung hiển thị của dropdown', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const menu = new CreateHocLieuMenu(page);
    await menu.open();

    await test.step('TC-MENU-01: Mở dropdown hiển thị đủ 13 loại học liệu (theo đúng data-value)', async () => {
      const values = Object.values(HOC_LIEU_TYPE);
      expect(values).toHaveLength(13);
      for (const value of values) {
        await expect(menu.itemByValue(value)).toBeVisible();
      }
    });

    await test.step('TC-MENU-02: Mỗi mục hiển thị đúng nhãn tương ứng với loại học liệu', async () => {
      for (const [value, label] of Object.entries(LABEL_BY_TYPE)) {
        await expect(menu.itemByValue(value)).toContainText(label);
      }
    });

    await test.step('TC-MENU-03: Mục "Đề kiểm tra" có dòng mô tả phụ đúng nghiệp vụ soạn đề / tạo từ ma trận', async () => {
      await expect(menu.itemByValue(HOC_LIEU_TYPE.EXAM_MIXTURE_V2)).toContainText(
        /Soạn đề hoặc tạo từ ma trận\. Tùy chọn hiển thị dạng Đề thi hoặc Luyện tập\./i,
      );
    });
  });
});
