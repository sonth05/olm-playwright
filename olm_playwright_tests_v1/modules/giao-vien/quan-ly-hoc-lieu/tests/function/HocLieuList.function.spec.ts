import { test, expect } from '../../../../../core/fixtures/role.fixture';
import { BoSuuTapHocLieuPage } from '../../pages/BoSuuTapHocLieuPage';
import { HocLieuDaXoaPage } from '../../pages/HocLieuDaXoaPage';
import { HocLieuDuocChiaSeCaNhanPage, FilterCoursewareType } from '../../pages/HocLieuDuocChiaSeCaNhanPage';
import { CoursewareType } from '../../pages/HocLieuCuaToiPage';

test.describe('Quản lý Học liệu - Học liệu đã xóa @quan-ly-hoc-lieu', () => {

	test('[Happy] Mở modal tạo học liệu từ trang đã xóa rồi đóng lại, không lưu', async ({ teacherPage: page }) => {
	    const daXoaPage = new HocLieuDaXoaPage(page);
	    await daXoaPage.navigateToHocLieuDaXoa();
	    await daXoaPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
	    const modal = page.locator(HocLieuDaXoaPage.MODAL);
	    expect(await modal.isVisible()).toBeTruthy();
	    await page.keyboard.press('Escape');
	  });

});

test.describe('Quản lý Học liệu - Được chia sẻ cá nhân @quan-ly-hoc-lieu', () => {

	test('[Happy] Mở modal tạo học liệu rồi đóng lại, không lưu', async ({ teacherPage: page }) => {
	    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
	    await chiaSePage.navigateToHocLieuDuocChiaSe();
	    await chiaSePage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
	    const modal = page.locator(HocLieuDuocChiaSeCaNhanPage.MODAL);
	    expect(await modal.isVisible()).toBeTruthy();
	    await page.keyboard.press('Escape');
	  });

});
