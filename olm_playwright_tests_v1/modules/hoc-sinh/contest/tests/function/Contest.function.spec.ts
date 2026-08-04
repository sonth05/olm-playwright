import { test, expect } from '@playwright/test';
import { ContestPage } from '../../pages/ContestPage';

test.describe('Kho đề – Subject Dropdown @contest', () => {

	test('[Happy] Chọn "Tất cả" từ dropdown – URL không còn subject param', async ({ page }) => {
			const cp = new ContestPage(page);
			await cp.openWithSubject(3);
			await cp.openSubjectDropdown();
			const allItem = page.locator(ContestPage.SUBJECT_DROPDOWN_ALL);
			await allItem.click();
			await page.waitForLoadState('domcontentloaded');
			expect(cp.getCurrentUrl()).not.toContain('subject=');
		});

});
