import { test, expect } from '@playwright/test';
import { CuocThiPage, CuocThiCategory } from '../pages/CuocThiPage';

test.describe('Cuoc thi @fun_contest @smoke', () => {
	test('[Happy] Trang Cuộc thi vui @smoke', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open();
		expect(pageObj.isPageLoaded()).toBeTruthy();
	});

	test('[Happy] Mở tab Toán vui hiển thị danh sách cuộc thi @smoke', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		expect(await pageObj.getContestCardCount()).toBeGreaterThan(0);
	});
});