import { expect } from '@playwright/test';
import { test } from '../../../../fixtures/auth.fixture';
import { PaymentPage } from '../pages/PaymentPage';

/**
 * Regression tests cho trang /gio-hang (OLM 2026).
 */
test.describe('Payment @payment @regression @role_student_vip', () => {

	test.describe('Load trang /gio-hang @role_student_vip', () => {

		test('[Happy] Trang gio-hang load được sau khi login', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			expect(authenticatedPage.url()).toMatch(/gio-hang|mua-vip/);
			expect(authenticatedPage.url()).not.toContain('dangnhap');
		});

		test('[Happy] Section chọn thời gian (#box-select-plan) hiển thị', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			await expect(authenticatedPage.locator(PaymentPage.BOX_SELECT_PLAN))
				.toBeVisible({ timeout: 20_000 });
		});

		test('[Happy] Section chọn gói VIP (#box-info-package) hiển thị', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			await expect(authenticatedPage.locator(PaymentPage.BOX_INFO_PACKAGE))
				.toBeVisible({ timeout: 20_000 });
		});

		test('[Unhappy] Gio-hang không redirect về trang login', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			expect(authenticatedPage.url()).not.toContain('dangnhap');
			expect(authenticatedPage.url()).not.toContain('login');
		});

	});

	test.describe('Chọn thời gian (plan) @role_student_vip', () => {

		test('[Happy] Hiển thị đủ tối thiểu 5 lựa chọn thời gian', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			const plans = await pp.getPlanLabels();
			expect(plans.length).toBeGreaterThanOrEqual(5);
		});

		test('[Happy] Danh sách plan chứa "1 năm" và "1 tháng"', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			const plans = await pp.getPlanLabels();
			expect(plans.some(p => p.includes('1 năm'))).toBe(true);
			expect(plans.some(p => p.includes('1 tháng'))).toBe(true);
		});

		test('[Happy] Plan mặc định là "1 năm" (data-plan="1-y")', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			expect(await pp.getActivePlan()).toBe('1-y');
		});

		test('[Happy] Chọn plan "6 tháng" → active đúng', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			await pp.selectPlan('6-m');
			expect(await pp.getActivePlan()).toBe('6-m');
		});

		test('[Happy] Chọn plan "1 tháng" → active đúng', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			await pp.selectPlan('1-m');
			expect(await pp.getActivePlan()).toBe('1-m');
		});

		test('[Happy] Chọn plan "2 năm" → active đúng', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			await pp.selectPlan('2-y');
			expect(await pp.getActivePlan()).toBe('2-y');
		});

		test('[Happy] Đổi plan "6 tháng" → giá gói exam thay đổi so với "1 năm"', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			const before = await pp.getVipPackages();
			const price1Y = before.find(p => p.typeVip === 'exam')?.price ?? '';

			await pp.selectPlan('6-m');

			const after = await pp.getVipPackages();
			const price6M = after.find(p => p.typeVip === 'exam')?.price ?? '';

			expect(price6M).toBeTruthy();
			expect(PaymentPage.parsePrice(price6M)).not.toBe(PaymentPage.parsePrice(price1Y));
		});

		test('[Happy] Chọn plan "Trọn đời" (12-y) → active đúng', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			await pp.selectPlan('12-y');
			expect(await pp.getActivePlan()).toBe('12-y');
		});

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

	test.describe('Gói VIP (package cards) @role_student_vip', () => {

		test('[Happy] Hiển thị đủ 3 gói VIP: vip, subject, exam', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			const packages = await pp.getVipPackages();
			expect(packages.length).toBeGreaterThanOrEqual(3);

			const types = packages.map(p => p.typeVip);
			expect(types).toContain('vip');
			expect(types).toContain('subject');
			expect(types).toContain('exam');
		});

		test('[Happy] Mỗi gói VIP có giá hiển thị (chứa số và VND)', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			const packages = await pp.getVipPackages();
			for (const pkg of packages) {
				expect(pkg.price).toMatch(/\d/);
				expect(pkg.price).toMatch(/VND/i);
			}
		});

		test('[Happy] Gói VIP (all) có giá cao hơn gói Đề thi', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			const packages = await pp.getVipPackages();
			const vipPkg  = packages.find(p => p.typeVip === 'vip');
			const examPkg = packages.find(p => p.typeVip === 'exam');

			expect(vipPkg).toBeDefined();
			expect(examPkg).toBeDefined();

			const vipPrice  = PaymentPage.parsePrice(vipPkg!.price);
			const examPrice = PaymentPage.parsePrice(examPkg!.price);

			expect(vipPrice).toBeGreaterThanOrEqual(examPrice);
		});

		test('[Happy] Mỗi gói VIP có nút "Đăng ký" riêng', async ({ authenticatedPage }) => {
			const pp = new PaymentPage(authenticatedPage);
			await pp.openGioHang();

			for (const dataType of ['vip', 'subject', 'exam']) {
				await expect(
					authenticatedPage.locator(`button.register-package-trigger[data-type="${dataType}"]`).first()
				).toBeVisible({ timeout: 10_000 });
			}
		});

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

});