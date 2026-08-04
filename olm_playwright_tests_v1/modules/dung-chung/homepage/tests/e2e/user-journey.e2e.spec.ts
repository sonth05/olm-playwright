import { expect, chromium } from '@playwright/test';
import { test } from '../../../../../fixtures/auth.fixture';
import { HeaderComponent } from '@core/shared-pages/HeaderComponent';
import { HocBaiPage } from '@modules/hoc-sinh/learning-core/pages/HocBaiPage';
import { authPathForWorker } from '../../../../../global-setup';

test.describe('User journey @e2e', () => {
	test('Trang chủ → Học bài → Lớp 1', async ({ browser }) => {
		const context = await browser.newContext({ storageState: authPathForWorker(0) });
		const page = await context.newPage();

		try {
			const header = new HeaderComponent(page);

			await header.openHome();
			expect(page.url()).toContain('olm.vn');

			const hocBai = new HocBaiPage(page);
			await hocBai.open();
			await page.waitForURL('**/hoc-bai**', { timeout: 15_000 }).catch(() => {});
			await hocBai.closePopupIfPresent();

			expect(page.url()).toContain('hoc-bai');

			await hocBai.navigateToGrade(1);
			await page.waitForURL('**/lop-1**', { timeout: 15_000 }).catch(() => {});

			expect(page.url()).toContain('lop-1');
		} finally {
			await context.close();
		}
	});
});