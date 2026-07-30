import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiPage } from '../pages/HocLieuCuaToiPageV1';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';

/**
 * TC-SWITCH: Luồng chuyển đổi giao diện "Học liệu của tôi" từ V1 sang V2.
 *
 * Đây là ĐIỂM VÀO của toàn bộ bộ test V2 trong thư mục này — mọi file spec khác
 * (Hoc-lieu-cua-toi.spec.ts, Create-hoc-lieu-menu.spec.ts, De-kiem-tra-modal.spec.ts)
 * đều dựa trên HocLieuCuaToiV2Page.goto(), mà bản thân goto() lại thực hiện đúng 3
 * bước dưới đây. Test này đi tường minh từng bước của luồng đó.
 *
 * GỘP 1 TRANG = 1 TEST (2026-07-30): thay vì 4 test riêng (TC-SWITCH-01..04),
 * gộp thành 1 test.describe -> 1 test duy nhất chạy hết luồng chuyển đổi theo
 * đúng trình tự người dùng thật (V1 -> bấm chuyển -> V2 -> bấm quay lại), mỗi
 * bước cũ giờ là 1 test.step() để vẫn tách rõ log khi debug/report, đồng thời
 * giảm số lần đăng nhập/điều hướng lặp lại so với 4 test độc lập trước đây.
 *
 * Luồng chuẩn (đối chiếu ảnh chụp DOM thật debug.olm.vn, ghi nhận 2026-07-28):
 *   1. Vào "Trang giáo viên" -> mở sidebar "Học liệu" -> bấm "Học liệu của tôi"
 *      -> vào ĐÚNG giao diện V1: bảng cột STT/Tên học liệu/Ngày tạo/Thể loại,
 *      có nút "+ Thử phiên bản mới" màu xanh lá ở góc trên bảng.
 *   2. Bấm "Thử phiên bản mới" -> giao diện chuyển CLIENT-SIDE (KHÔNG có điều
 *      hướng trang mới, URL /hoc-lieu-cua-toi giữ nguyên) sang giao diện V2.
 *   3. Giao diện V2 hiển thị đầy đủ thành phần đặc trưng.
 *   4. Bấm "Quay lại giao diện cũ" từ V2 trở về đúng giao diện V1.
 */

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