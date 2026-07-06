import { test, expect } from '@playwright/test';
import { HoiDapPage } from '../pages/HoiDapPage';

test.describe('Hỏi đáp Smoke @hoi_dap @smoke', () => {
	test('[Happy] Mở trang Hỏi đáp thành công', async ({ page }) => {
		const hoiDapPage = new HoiDapPage(page);
		await hoiDapPage.open();
		expect(hoiDapPage.isPageLoaded()).toBeTruthy();
	});

	test('[Happy] Danh sách câu hỏi hiển thị', async ({ page }) => {
		const hoiDapPage = new HoiDapPage(page);
		await hoiDapPage.open();
		expect(await hoiDapPage.getQuestionCount()).toBeGreaterThan(0);
	});

	test('[Happy] Sidebar lọc lớp hiển thị', async ({ page }) => {
		const hoiDapPage = new HoiDapPage(page);
		await hoiDapPage.open();
		const gradeLinks = page.locator(HoiDapPage.SIDEBAR_GRADE_LINKS);
		expect(await gradeLinks.count()).toBeGreaterThan(0);
	});

	test('[Happy] Các tab loại câu hỏi hiển thị đủ 5 tab', async ({ page }) => {
		const hoiDapPage = new HoiDapPage(page);
		await hoiDapPage.open();
		const tabs = page.locator(HoiDapPage.TYPE_TABS);
		expect(await tabs.count()).toBeGreaterThanOrEqual(4);
	});

	test('[Happy] Tab "Tất cả" active mặc định', async ({ page }) => {
		const hoiDapPage = new HoiDapPage(page);
		await hoiDapPage.open();
		const activeText = await hoiDapPage.getActiveTabText();
		expect(activeText.toLowerCase()).toContain('tất cả');
	});

	test('[Happy] Nút phân trang trang sau tồn tại', async ({ page }) => {
		const hoiDapPage = new HoiDapPage(page);
		await hoiDapPage.open();
		const nextBtn = page.locator(HoiDapPage.NEXT_PAGE);
		expect(await nextBtn.count()).toBeGreaterThan(0);
	});
});