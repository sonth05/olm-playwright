import { test, expect } from '@playwright/test';
import { HeaderHomePage } from '@core/shared-pages/HeaderHomePage';

test.describe('Header @homepage', () => {

	test('[Happy] Trang chủ tải thành công @smoke', async ({ page }) => {
			const headerPage = new HeaderHomePage(page);
			await headerPage.open();
			expect(headerPage.getCurrentUrl()).toContain('olm.vn');
		});

});
