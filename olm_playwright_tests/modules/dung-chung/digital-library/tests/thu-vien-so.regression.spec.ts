import { test, expect } from '@playwright/test';
import { ThuVienSoPage } from '../pages/ThuVienSoPage';

test.describe('Thư viện số @library @regression', () => {
	test('[Happy] Trang chủ tải và URL đúng', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		expect(tvs.isPageLoaded()).toBeTruthy();
		expect(tvs.getCurrentUrl()).toContain('thu-vien-so');
	});

	test('[Happy] Title trang không rỗng', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		expect((await tvs.getPageTitle()).length).toBeGreaterThan(0);
	});

	test('[Happy] Hero "Thư viện số OLM" hiển thị', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		expect(await tvs.isElementVisible('span:has-text("Thư viện số OLM")')).toBeTruthy();
	});

	test('[Happy] CTA "Khám phá kho sách" dẫn đến trang SGK', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		await tvs.clickExploreBooks();
		expect(tvs.isSachGiaoKhoaLoaded()).toBeTruthy();
	});

	test('[Happy] Section "Thư viện tạp chí" hiển thị', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		expect(await tvs.isElementVisible(ThuVienSoPage.MAGAZINE_SECTION_TITLE)).toBeTruthy();
		expect(await tvs.isElementVisible(ThuVienSoPage.FOR_MEMBER_BADGE)).toBeTruthy();
	});

	test('[Happy] CTA "Khám phá thư viện" dẫn đến trang tạp chí', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		await tvs.clickExploreLibraryBtn();
		expect(tvs.isTapChiLoaded()).toBeTruthy();
	});

	test('[Happy] Footer hiển thị đầy đủ', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.open();
		await tvs.scrollToFooter();
		expect(await tvs.isElementVisible(ThuVienSoPage.FOOTER_COPYRIGHT)).toBeTruthy();
	});

	test('[Unhappy] Grade=99 — trang không crash', async ({ page }) => {
		const tvs = new ThuVienSoPage(page);
		await tvs.openSachGiaoKhoa(99);
		expect(tvs.getCurrentUrl()).toContain('thu-vien-so');
	});
});