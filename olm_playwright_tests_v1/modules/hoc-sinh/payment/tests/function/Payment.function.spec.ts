import { expect } from '@playwright/test';
import { test } from '../../../../../fixtures/auth.fixture';
import { PaymentPage } from '../../pages/PaymentPage';

test.describe('Chọn thời gian (plan) @payment', () => {

	test('[Unhappy] data-plan không tồn tại ("99-y") → page không crash', async ({ authenticatedPage }) => {
				const pp = new PaymentPage(authenticatedPage);
				await pp.openGioHang();

				await authenticatedPage
					.locator('button.select-plan-vip-trigger[data-plan="99-y"]')
					.click({ timeout: 4_000 })
					.catch(() => { /* expected */ });

				expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
			});

});

test.describe('Gói VIP (package cards) @payment', () => {

	test('[Unhappy] data-type không hợp lệ → không throw, page không crash', async ({ authenticatedPage }) => {
				const pp = new PaymentPage(authenticatedPage);
				await pp.openGioHang();

				await authenticatedPage
					.locator('button.register-package-trigger[data-type="invalid"]')
					.click({ timeout: 4_000 })
					.catch(() => { /* expected */ });

				expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
			});

});
