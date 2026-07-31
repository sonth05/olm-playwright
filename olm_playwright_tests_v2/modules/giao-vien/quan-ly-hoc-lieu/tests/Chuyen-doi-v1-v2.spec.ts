import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiPage } from '../pages/HocLieuCuaToiPageV1';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';

test.describe('TC-SWITCH: Chuyển đổi giao diện Học liệu của tôi (V1 -> V2)', () => {
  test('TC-SWITCH: Toàn bộ luồng chuyển đổi V1 -> V2 -> quay lại V1', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const v1Page = new HocLieuCuaToiPage(page);
    const listPageV2 = new HocLieuCuaToiV2Page(page);

    await test.step('TC-SWITCH-01: Vào "Học liệu của tôi" từ Trang giáo viên hiển thị đúng giao diện V1', async () => {
      await v1Page.navigateToHocLieuCuaToi();

      await expect(page).toHaveURL(/\/hoc-lieu-cua-toi/);
      await expect(page.getByRole('heading', { name: 'Học liệu của tôi' })).toBeVisible();

      // Nút chuyển phiên bản CHỈ tồn tại ở giao diện V1.
      await expect(page.getByRole('button', { name: /Thử phiên bản mới/i })).toBeVisible();

      // Cột "Ngày tạo" là đặc trưng RIÊNG của bảng V1 (bảng V2 không có cột này,
      // thay bằng Khối lớp/Môn học/Khóa học) -> dùng để khẳng định đang ở V1.
      await expect(page.getByRole('columnheader', { name: 'Ngày tạo' })).toBeVisible();

      // Chưa có tabs trạng thái (đặc trưng riêng của V2) ở giao diện V1.
      await expect(page.getByRole('tab', { name: /Đã xuất bản/i })).toHaveCount(0);
    });

    await test.step('TC-SWITCH-02: Bấm "Thử phiên bản mới" chuyển sang V2, không phát sinh điều hướng trang mới', async () => {
      const urlBefore = page.url();
      await v1Page.switchToNewVersion();

      // Chuyển đổi là render lại phía client, không phải full navigation -> URL giữ nguyên.
      expect(page.url()).toBe(urlBefore);

      await expect(listPageV2.tabAll).toBeVisible();
      await expect(listPageV2.tabPublished).toBeVisible();
      await expect(listPageV2.tabUnpublished).toBeVisible();
    });

    await test.step('TC-SWITCH-03: Sau khi chuyển, giao diện V2 hiển thị đầy đủ thành phần đặc trưng', async () => {
      await expect(listPageV2.heading).toBeVisible();
      await expect(listPageV2.btnCreateNew).toBeVisible();
      await expect(listPageV2.searchInput).toBeVisible();
      await expect(listPageV2.filterTypeBtn).toBeVisible();
      await expect(listPageV2.filterSubjectBtn).toBeVisible();
      await expect(listPageV2.filterGradeBtn).toBeVisible();
      await expect(listPageV2.btnAdvancedFilter).toBeVisible();
      await expect(listPageV2.btnReload).toBeVisible();

      // Bảng V2 có thêm các cột Khối lớp/Môn học/Khóa học/Hành động (V1 không có).
      await expect(page.getByRole('columnheader', { name: 'Khối lớp' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Môn học' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Khóa học' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Hành động' })).toBeVisible();
    });

    await test.step('TC-SWITCH-04: Bấm "Quay lại giao diện cũ" từ V2 trở về đúng giao diện V1', async () => {
      // TODO: nút này chỉ xuất hiện ở V2, chưa có Page Object riêng cho nó -> dùng
      // locator trực tiếp tại đây; cân nhắc bổ sung vào HocLieuCuaToiV2Page nếu về
      // sau cần tái sử dụng ở nhiều file test khác.
      const btnBackToOldUI = page.getByRole('button', { name: /Quay lại giao diện cũ/i });
      await expect(btnBackToOldUI).toBeVisible();
      await btnBackToOldUI.click();

      await expect(page.getByRole('button', { name: /Thử phiên bản mới/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Ngày tạo' })).toBeVisible();
    });
  });
});