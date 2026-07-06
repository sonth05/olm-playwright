import { test, expect } from '@playwright/test';
import { ThuVienSoPage } from '../pages/ThuVienSoPage';

test.describe('Thư viện số — Smoke @library @smoke', () => {
	test('[Smoke-TVS-001] Trang chủ Thư viện số tải thành công', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		expect(tvs.isPageLoaded()).toBeTruthy();
	});

	test('[Smoke-TVS-002] Header hiển thị logo và navigation links', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		expect(await tvs.isElementVisible(ThuVienSoPage.LOGO)).toBeTruthy();
		expect(await tvs.isElementVisible(ThuVienSoPage.HEADER_SACH_GK_LINK)).toBeTruthy();
		expect(await tvs.isElementVisible(ThuVienSoPage.HEADER_TAP_CHI_LINK)).toBeTruthy();
		expect(await tvs.isElementVisible(ThuVienSoPage.HEADER_HOI_VIEN_BTN)).toBeTruthy();
	});

	test('[Smoke-TVS-003] Trang Sách giáo khoa tải thành công', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openSachGiaoKhoa();
		expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
	});

	test('[Smoke-TVS-004] Sách giáo khoa có ít nhất 1 card sách', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openSachGiaoKhoa();
		expect(await tvs.getBookCount()).toBeGreaterThan(0);
	});

	test('[Smoke-TVS-005] Tab Sách học sinh mặc định được chọn', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openSachGiaoKhoa();
		expect(await tvs.isSachHocSinhSelected()).toBeTruthy();
	});

	test('[Smoke-TVS-006] Badge #count-books hiển thị số kết quả', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openSachGiaoKhoa();
		expect(await tvs.isElementVisible(ThuVienSoPage.COUNT_BOOKS_BADGE)).toBeTruthy();
		expect(await tvs.getDisplayedResultCount()).toBeGreaterThan(0);
	});

	test('[Smoke-TVS-007] Trang Tạp chí tải thành công', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openTapChi();
		expect(tvs.isTapChiLoaded()).toBeTruthy();
	});

	test('[Smoke-TVS-008] Danh mục tạp chí có ít nhất 1 card', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openTapChi();
		expect(await tvs.getMagazineCount()).toBeGreaterThan(0);
	});

	test('[Smoke-TVS-009] Tiêu đề "Danh mục tạp chí" hiển thị', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openTapChi();
		expect(await tvs.isElementVisible(ThuVienSoPage.TAPCHI_SECTION_TITLE)).toBeTruthy();
	});

	test('[Smoke-TVS-010] Footer hiển thị với copyright', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		await tvs.scrollToFooter();
		expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_COPYRIGHT)).toBeTruthy();
	});
});