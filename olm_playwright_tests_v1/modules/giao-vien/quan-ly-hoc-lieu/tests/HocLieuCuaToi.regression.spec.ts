// Dùng teacherPage (đã đăng nhập sẵn qua storageState auth/worker-1.json,
// tạo bởi global-setup.ts) thay vì `page` mặc định của '@playwright/test'
// — các trang hoc-lieu-v1 yêu cầu đăng nhập, `page` mặc định sẽ bị redirect
// sang /dangnhap và mọi selector đều not-found/timeout.
import { test, expect } from '../../../../core/fixtures/role.fixture';
import { BoSuuTapHocLieuPage } from '../pages/BoSuuTapHocLieuPage';
import { HocLieuDaXoaPage } from '../pages/HocLieuDaXoaPage';
import { HocLieuDuocChiaSeCaNhanPage, FilterCoursewareType } from '../pages/HocLieuDuocChiaSeCaNhanPage';
import { CoursewareType } from '../pages/HocLieuCuaToiPage';

/**
 * Regression test cho 3 page Học liệu v1 CHƯA có file test riêng
 * (HocLieuCuaToiPage đã có HocLieuCuaToi.smoke/regression.spec.ts):
 * - Bộ sưu tập học liệu (2.3.3)      — BoSuuTapHocLieuPage
 * - Học liệu đã xóa (2.3.4)          — HocLieuDaXoaPage
 * - Được chia sẻ cá nhân (2.3.2)     — HocLieuDuocChiaSeCaNhanPage
 *
 * KHÔNG gọi các hành động làm thay đổi/phá hủy dữ liệu (xóa bộ sưu tập,
 * khôi phục học liệu đã xóa...) — các hành động này đã có sẵn trong page
 * object nhưng loại trừ khỏi regression spec theo đúng convention của dự án
 * (giống cách HocLieuCuaToi.regression.spec.ts xử lý).
 */

test.describe('Quản lý Học liệu - Bộ sưu tập học liệu @hoc_lieu @regression', () => {
  test('[Happy] Mở trang Bộ sưu tập của tôi thành công', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    expect(await page.locator(BoSuuTapHocLieuPage.PAGE_TITLE).isVisible()).toBeTruthy();
  });

  test('[Happy] Bảng bộ sưu tập trả về đúng cấu trúc dữ liệu từng dòng', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    const collections = await boSuuTapPage.getAllCollectionsData();
    for (const item of collections) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
    }
  });

  test('[Happy] Mở trang chi tiết bộ sưu tập bằng cách click vào tên', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    const rows = boSuuTapPage.getCollectionRows();
    const count = await rows.count();
    test.skip(count === 0, 'Chưa có bộ sưu tập nào để mở trang chi tiết');
    await boSuuTapPage.openCollectionDetail(rows.first());
    expect(page.url()).toContain('/bo-suu-tap/');
  });

  test('[Happy] Nút sửa bộ sưu tập hiển thị trên dòng dữ liệu', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    const rows = boSuuTapPage.getCollectionRows();
    const count = await rows.count();
    test.skip(count === 0, 'Chưa có bộ sưu tập nào để kiểm tra nút sửa');
    const editBtn = rows.first().locator(BoSuuTapHocLieuPage.ROW_EDIT_BTN);
    expect(await editBtn.isVisible()).toBeTruthy();
  });

  test('[Happy] Nút xóa bộ sưu tập hiển thị trên dòng dữ liệu (không thực hiện xóa)', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    const rows = boSuuTapPage.getCollectionRows();
    const count = await rows.count();
    test.skip(count === 0, 'Chưa có bộ sưu tập nào để kiểm tra nút xóa');
    const deleteBtn = rows.first().locator(BoSuuTapHocLieuPage.ROW_DELETE_BTN);
    expect(await deleteBtn.isVisible()).toBeTruthy();
    // Không gọi boSuuTapPage.deleteCollection() ở regression spec — hành động phá hủy dữ liệu.
  });

  test('[Happy] Bấm "Tạo bộ sưu tập" không gây lỗi', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    // TODO: chưa có HTML modal thật (xem ghi chú trong BoSuuTapHocLieuPage) —
    // test này chỉ xác nhận bấm nút không throw lỗi, cần bổ sung assert cụ
    // thể hơn khi có selector modal thật.
    await boSuuTapPage.openCreateCollectionModal();
    expect(page.url()).toBeTruthy();
  });
});

test.describe('Quản lý Học liệu - Học liệu đã xóa @hoc_lieu @regression', () => {
  test('[Happy] Mở trang Học liệu đã xóa thành công', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const url = page.url();
    expect(url).toContain('hoc-lieu-cua-toi');
    expect(url).toContain('deleted=1');
  });

  test('[Happy] Checkbox "deleted" ẩn luôn ở trạng thái checked', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    await expect(page.locator(HocLieuDaXoaPage.DELETED_HIDDEN_CHECKBOX)).toBeChecked();
  });

  test('[Happy] Bảng học liệu đã xóa trả về đúng cấu trúc dữ liệu từng dòng', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const rowsData = await daXoaPage.getAllRowsData();
    for (const item of rowsData) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
    }
  });

  test('[Happy] Dropdown tạo mới hiển thị đủ loại học liệu (≥10 loại)', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const dropdown = await daXoaPage.openCreateDropdown();
    const labels = await dropdown.locator('a.select-cate-type .col-11').allInnerTexts();
    expect(labels.length).toBeGreaterThanOrEqual(10);
  });

  test('[Happy] Mở modal tạo học liệu từ trang đã xóa rồi đóng lại, không lưu', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    await daXoaPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    const modal = page.locator(HocLieuDaXoaPage.MODAL);
    expect(await modal.isVisible()).toBeTruthy();
    await page.keyboard.press('Escape');
  });

  test('[Happy] Lọc theo tiêu đề học liệu', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    await daXoaPage.filterList({ title: 'test' });
    expect(page.url()).toContain('deleted=1');
  });

  test('[Happy] Tick checkbox "Khôi phục" trên 1 dòng (chưa submit)', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const rowsData = await daXoaPage.getAllRowsData();
    test.skip(rowsData.length === 0, 'Chưa có học liệu đã xóa nào để kiểm tra khôi phục');
    const firstId = rowsData[0].id;
    await daXoaPage.checkRestore(firstId);
    const checkbox = daXoaPage.getRowById(firstId).locator(HocLieuDaXoaPage.ROW_RESTORE_CHECKBOX);
    await expect(checkbox).toBeChecked();
    // Không gọi daXoaPage.restoreSelected() ở regression spec — khôi phục làm
    // thay đổi dữ liệu (đưa học liệu ra khỏi danh sách "đã xóa").
  });

  test('[Happy] Phân trang - chuyển sang trang 2 (nếu có)', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const nextPageLink = page.locator(HocLieuDaXoaPage.PAGE_LINK(2));
    const hasPage2 = await nextPageLink.isVisible().catch(() => false);
    test.skip(!hasPage2, 'Chỉ có 1 trang, không có trang 2 để kiểm tra phân trang');
    await daXoaPage.goToPage(2);
    expect(await daXoaPage.getCurrentPage()).toBe(2);
  });
});

test.describe('Quản lý Học liệu - Được chia sẻ cá nhân @hoc_lieu @regression', () => {
  test('[Happy] Mở trang Học liệu được chia sẻ thành công', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    expect(page.url()).toContain('hoc-lieu-duoc-chia-se');
  });

  test('[Happy] Tiêu đề trang hiển thị đúng', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    const title = page.locator(HocLieuDuocChiaSeCaNhanPage.PAGE_TITLE);
    expect(await title.isVisible()).toBeTruthy();
  });

  test('[Happy] Dropdown tạo mới hiển thị đủ loại học liệu (≥10 loại)', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    await chiaSePage.openCreateDropdown();
    const labels = await chiaSePage.getDropdownLabels();
    expect(labels.length).toBeGreaterThanOrEqual(10);
  });

  test('[Happy] Mở modal tạo học liệu rồi đóng lại, không lưu', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    await chiaSePage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    const modal = page.locator(HocLieuDuocChiaSeCaNhanPage.MODAL);
    expect(await modal.isVisible()).toBeTruthy();
    await page.keyboard.press('Escape');
  });

  test('[Happy] Lọc theo loại học liệu (Luyện tập trắc nghiệm)', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    await chiaSePage.filterList({ type: FilterCoursewareType.LUYEN_TAP_TRAC_NGHIEM });
    expect(page.url()).toContain('hoc-lieu-duoc-chia-se');
  });

  test('[Happy] Trạng thái rỗng hoặc bảng danh sách hiển thị hợp lệ', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    const isEmpty = await chiaSePage.isEmptyState();
    if (isEmpty) {
      await expect(page.locator(HocLieuDuocChiaSeCaNhanPage.EMPTY_STATE_ALERT)).toBeVisible();
    } else {
      const rowsData = await chiaSePage.getAllRowsData();
      for (const item of rowsData) {
        expect(item.title).toBeTruthy();
      }
    }
  });
});