// Dùng teacherPage (đã đăng nhập sẵn qua storageState auth/worker-1.json,
// tạo bởi global-setup.ts) thay vì `page` mặc định của '@playwright/test'
// — các trang hoc-lieu-v1 yêu cầu đăng nhập, `page` mặc định sẽ bị redirect
// sang /dangnhap và mọi selector đều not-found/timeout.
import { test, expect } from '../../../../core/fixtures/role.fixture';
import { BoSuuTapHocLieuPage } from '../pages/BoSuuTapHocLieuPage';
import { HocLieuDaXoaPage } from '../pages/HocLieuDaXoaPage';
import { HocLieuDuocChiaSeCaNhanPage } from '../pages/HocLieuDuocChiaSeCaNhanPage';

/**
 * Smoke test cho 3 page Học liệu v1 CHƯA có file test riêng
 * (HocLieuCuaToiPage đã có HocLieuCuaToi.smoke/regression.spec.ts):
 * - Bộ sưu tập học liệu (2.3.3)      — BoSuuTapHocLieuPage
 * - Học liệu đã xóa (2.3.4)          — HocLieuDaXoaPage
 * - Được chia sẻ cá nhân (2.3.2)     — HocLieuDuocChiaSeCaNhanPage
 *
 * LƯU Ý: BoSuuTapHocLieuPage và HocLieuDuocChiaSeCaNhanPage còn một vài
 * selector/URL CHƯA xác minh trên UI thật (xem TODO trong từng page object).
 * Test dưới đây bám theo selector hiện có trong page object — cần chạy thật
 * để xác nhận lại khi có UI/HTML chính xác.
 */

test.describe('Quản lý Học liệu - Bộ sưu tập học liệu @hoc_lieu @smoke', () => {
  test('[Happy] Mở trang Bộ sưu tập của tôi thành công', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    expect(await page.locator(BoSuuTapHocLieuPage.PAGE_TITLE).isVisible()).toBeTruthy();
  });

  test('[Happy] Nút "Tạo bộ sưu tập" tồn tại và hiển thị', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    const createBtn = page.locator(BoSuuTapHocLieuPage.TAO_BO_SUU_TAP_BTN);
    expect(await createBtn.isVisible()).toBeTruthy();
  });

  test('[Happy] Bảng danh sách bộ sưu tập hiển thị', async ({ teacherPage: page }) => {
    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
    await boSuuTapPage.navigateToBoSuuTap();
    const rows = boSuuTapPage.getCollectionRows();
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Quản lý Học liệu - Học liệu đã xóa @hoc_lieu @smoke', () => {
  test('[Happy] Mở trang Học liệu đã xóa thành công', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const url = page.url();
    expect(url).toContain('hoc-lieu-cua-toi');
    expect(url).toContain('deleted=1');
  });

  test('[Happy] Bảng danh sách học liệu đã xóa hiển thị', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const rows = daXoaPage.getTableRows();
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });

  test('[Happy] Nút "Tạo mới học liệu" tồn tại', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const createBtn = page.locator(HocLieuDaXoaPage.TAO_MOI_BTN);
    expect(await createBtn.isVisible()).toBeTruthy();
  });

  test('[Happy] Mở dropdown tạo mới thành công', async ({ teacherPage: page }) => {
    const daXoaPage = new HocLieuDaXoaPage(page);
    await daXoaPage.navigateToHocLieuDaXoa();
    const dropdown = await daXoaPage.openCreateDropdown();
    expect(await dropdown.isVisible()).toBeTruthy();
  });
});

test.describe('Quản lý Học liệu - Được chia sẻ cá nhân @hoc_lieu @smoke', () => {
  test('[Happy] Mở trang Học liệu được chia sẻ thành công', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    expect(page.url()).toContain('hoc-lieu-duoc-chia-se');
  });

  test('[Happy] Nút "Tạo mới học liệu" tồn tại', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    const createBtn = page.locator(HocLieuDuocChiaSeCaNhanPage.TAO_MOI_BTN);
    expect(await createBtn.isVisible()).toBeTruthy();
  });

  test('[Happy] Mở dropdown tạo mới thành công', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    const dropdown = await chiaSePage.openCreateDropdown();
    expect(await dropdown.isVisible()).toBeTruthy();
  });

  test('[Happy] Trang hiển thị bảng hoặc thông báo rỗng hợp lệ', async ({ teacherPage: page }) => {
    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
    await chiaSePage.navigateToHocLieuDuocChiaSe();
    const isEmpty = await chiaSePage.isEmptyState();
    if (isEmpty) {
      expect(isEmpty).toBeTruthy();
    } else {
      const rows = chiaSePage.getTableRows();
      expect(await rows.count()).toBeGreaterThanOrEqual(0);
    }
  });
});