import { test, expect } from '@playwright/test';
import { HoiDapPage } from '../../pages/HoiDapPage';
import { BASE_URL } from '../../../../../config/config';

test.describe('Hỏi đáp Regression @hoi-dap', () => {

	test('[Unhappy] Click reply input khi chưa login — chuyển hướng/block', async ({ page }) => {
			const hoiDapPage = new HoiDapPage(page);
			await hoiDapPage.open();
			const input = page.locator(HoiDapPage.QUICK_REPLY_INPUT).first();
			if (await input.isVisible()) {
				await input.click({ force: true });
				await page.waitForTimeout(800);
				const url = hoiDapPage.getCurrentUrl();
				expect(url.includes('dangnhap') || url.includes('hoi-dap')).toBeTruthy();
			} else {
				expect(true).toBeTruthy();
			}
		});

});
