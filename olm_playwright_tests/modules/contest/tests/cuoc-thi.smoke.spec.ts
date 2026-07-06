import { test, expect } from '@playwright/test';
import { CuocThiPage } from '../pages/CuocThiPage';

test.describe('Cuoc thi @fun_contest @smoke', () => {
	test('[Happy] Trang Cuộc thi vui @smoke', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open();
		expect(pageObj.isPageLoaded()).toBeTruthy();
	});
});