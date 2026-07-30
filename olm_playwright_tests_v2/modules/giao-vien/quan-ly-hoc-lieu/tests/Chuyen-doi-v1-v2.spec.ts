import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiPage } from '../../hoc-lieu-v1/pages/HocLieuCuaToiPage';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';

/**
 * TC-SWITCH: Luồng chuyển đổi giao diện "Học liệu của tôi" từ V1 sang V2.
 *
 * Đây là ĐIỂM VÀO của toàn bộ bộ test V2 trong thư mục này — mọi file spec khác
 * (Hoc-lieu-cua-toi.spec.ts, Create-hoc-lieu-menu.spec.ts, De-kiem-tra-modal.spec.ts)
 * đều dựa trên HocLieuCuaToiV2Page.goto(), mà bản thân goto() lại thực hiện đúng 3
 * bước dưới đây. File này test TƯỜNG MINH từng bước của luồng đó, độc lập với các
 * test chức năng chi tiết của riêng từng màn.
 *
 * Luồng chuẩn (đối chiếu ảnh chụp DOM thật debug.olm.vn, ghi nhận trong hội thoại
 * ngày 2026-07-28):
 *   1. Đăng nhập tài khoản giáo viên trên debug.olm.vn (xử lý sẵn bởi fixture
 *      getPageAsRole — không tự viết lại logic đăng nhập ở đây).
 *   2. Vào "Trang giáo viên" -> mở sidebar "Học liệu" -> bấm "Học liệu của tôi"
 *      -> vào ĐÚNG giao diện V1: bảng cột STT/Tên học liệu/Ngày tạo/Thể loại,
 *      có nút "+ Thử phiên bản mới" màu xanh lá ở góc trên bảng.
 *   3. Bấm "Thử phiên bản mới" -> giao diện chuyển CLIENT-SIDE (KHÔNG có điều
 *      hướng trang mới, URL /hoc-lieu-cua-toi giữ nguyên) sang giao diện V2:
 *      #view-my-categories-list — có tabs trạng thái (Tất cả/Đã xuất bản/Chưa
 *      xuất bản), bảng đổi cột thành Khối lớp/Môn học/Khóa học/Hành động, nút
 *      "Tạo mới học liệu" màu cam, và nút "↩ Quay lại giao diện cũ" ở góc trên
 *      phải để quay về V1.
 *
 * Bước 1-2 tái sử dụng HocLieuCuaToiPage (Page Object V1, đã có sẵn trong
 * modules/giao-vien/hoc-lieu-v1/pages/) — KHÔNG viết lại selector sidebar/breadcrumb
 * ở đây. Bước 3 dùng HocLieuCuaToiPage.switchToNewVersion() (cùng Page Object V1,
 * vì nút "Thử phiên bản mới" CHỈ tồn tại trên giao diện V1).
 */

test.describe('TC-SWITCH: Chuyển đổi giao diện Học liệu của tôi (V1 -> V2)', () => {
  test('TC-SWITCH-01: Vào "Học liệu của tôi" từ Trang giáo viên hiển thị đúng giao diện V1', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const v1Page = new HocLieuCuaToiPage(page);
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

  test('TC-SWITCH-02: Bấm "Thử phiên bản mới" chuyển sang V2, không phát sinh điều hướng trang mới', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const v1Page = new HocLieuCuaToiPage(page);
    await v1Page.navigateToHocLieuCuaToi();

    const urlBefore = page.url();
    await v1Page.switchToNewVersion();

    // Chuyển đổi là render lại phía client, không phải full navigation -> URL giữ nguyên.
    expect(page.url()).toBe(urlBefore);

    const listPageV2 = new HocLieuCuaToiV2Page(page);
    await expect(listPageV2.tabAll).toBeVisible();
    await expect(listPageV2.tabPublished).toBeVisible();
    await expect(listPageV2.tabUnpublished).toBeVisible();
  });

  test('TC-SWITCH-03: Sau khi chuyển, giao diện V2 hiển thị đầy đủ thành phần đặc trưng', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    // goto() đã tự thực hiện đủ 3 bước ở trên — xem docblock goto() trong Hoclieucuatoiv2page.ts.
    await listPage.goto();

    await expect(listPage.heading).toBeVisible();
    await expect(listPage.btnCreateNew).toBeVisible();
    await expect(listPage.searchInput).toBeVisible();
    await expect(listPage.filterTypeBtn).toBeVisible();
    await expect(listPage.filterSubjectBtn).toBeVisible();
    await expect(listPage.filterGradeBtn).toBeVisible();
    await expect(listPage.btnAdvancedFilter).toBeVisible();
    await expect(listPage.btnReload).toBeVisible();

    // Bảng V2 có thêm các cột Khối lớp/Môn học/Khóa học/Hành động (V1 không có).
    await expect(page.getByRole('columnheader', { name: 'Khối lớp' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Môn học' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Khóa học' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Hành động' })).toBeVisible();
  });

  test('TC-SWITCH-04: Bấm "Quay lại giao diện cũ" từ V2 trở về đúng giao diện V1', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

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