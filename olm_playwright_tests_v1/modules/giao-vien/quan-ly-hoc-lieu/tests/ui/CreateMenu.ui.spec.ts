import { test, expect } from '../../../../../core/fixtures/role.fixture';
import { BoSuuTapHocLieuPage } from '../../pages/BoSuuTapHocLieuPage';
import { HocLieuDaXoaPage } from '../../pages/HocLieuDaXoaPage';
import { HocLieuDuocChiaSeCaNhanPage, FilterCoursewareType } from '../../pages/HocLieuDuocChiaSeCaNhanPage';
import { CoursewareType } from '../../pages/HocLieuCuaToiPage';

test.describe('Quản lý Học liệu - Bộ sưu tập học liệu @quan-ly-hoc-lieu', () => {

	test('[Happy] Bấm "Tạo bộ sưu tập" không gây lỗi', async ({ teacherPage: page }) => {
	    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
	    await boSuuTapPage.navigateToBoSuuTap();
	    // TODO: chưa có HTML modal thật (xem ghi chú trong BoSuuTapHocLieuPage) —
	    // test này chỉ xác nhận bấm nút không throw lỗi, cần bổ sung assert cụ
	    // thể hơn khi có selector modal thật.
	    await boSuuTapPage.openCreateCollectionModal();
	    expect(page.url()).toBeTruthy();
	  });

	test('[Happy] Nút "Tạo bộ sưu tập" tồn tại và hiển thị', async ({ teacherPage: page }) => {
	    const boSuuTapPage = new BoSuuTapHocLieuPage(page);
	    await boSuuTapPage.navigateToBoSuuTap();
	    const createBtn = page.locator(BoSuuTapHocLieuPage.TAO_BO_SUU_TAP_BTN);
	    expect(await createBtn.isVisible()).toBeTruthy();
	  });

});

test.describe('Quản lý Học liệu - Học liệu đã xóa @quan-ly-hoc-lieu', () => {

	test('[Happy] Dropdown tạo mới hiển thị đủ loại học liệu (≥10 loại)', async ({ teacherPage: page }) => {
	    const daXoaPage = new HocLieuDaXoaPage(page);
	    await daXoaPage.navigateToHocLieuDaXoa();
	    const dropdown = await daXoaPage.openCreateDropdown();
	    const labels = await dropdown.locator('a.select-cate-type .col-11').allInnerTexts();
	    expect(labels.length).toBeGreaterThanOrEqual(10);
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

test.describe('Quản lý Học liệu - Được chia sẻ cá nhân @quan-ly-hoc-lieu', () => {

	test('[Happy] Dropdown tạo mới hiển thị đủ loại học liệu (≥10 loại)', async ({ teacherPage: page }) => {
	    const chiaSePage = new HocLieuDuocChiaSeCaNhanPage(page);
	    await chiaSePage.navigateToHocLieuDuocChiaSe();
	    await chiaSePage.openCreateDropdown();
	    const labels = await chiaSePage.getDropdownLabels();
	    expect(labels.length).toBeGreaterThanOrEqual(10);
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

});
