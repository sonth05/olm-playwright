/**
 * Regression tests – Header & Navigation trên Trang Chủ OLM
 */

import { test, expect } from '@playwright/test';
import { HeaderComponent } from '@core/shared-pages/HeaderComponent';
import {
	BASE_URL,
	HOC_BAI_URL,
	HOI_DAP_URL,
	CUOC_THI_URL,
	THU_VIEN_SO_URL,
	CONTEST_URL,
} from '../../../../config/config';

const TEACHER_HOME_URL = `${BASE_URL}/home`;

async function gotoHome(header: HeaderComponent) {
	await header.openHome();
}

test.describe('Header Trang Chủ @header-home @regression', () => {
	test('[Happy] Logo hiển thị và click về trang chủ', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const logo = await header.findVisible([HeaderComponent.LOGO], 10);
		expect(logo, 'Logo phải hiển thị').not.toBeNull();

		await header.clickLogo();
		await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/?`));
	});

	test('[Happy] Nav "Trang giáo viên" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.NAV_TRANG_GIAO_VIEN], 5);
		if (!link) test.skip();

		const href = await link!.getAttribute('href');
		expect(href).toContain('/home');

		await link!.click();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(new RegExp(TEACHER_HOME_URL));
	});

	test('[Happy] Nav "Hỏi đáp" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([
			HeaderComponent.NAV_HOI_DAP,
			HeaderComponent.NAV_HOI_BAI,
		], 10);
		expect(link, '"Hỏi đáp" hoặc "Hỏi bài" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toContain('/hoi-dap');

		await link!.click();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(new RegExp(HOI_DAP_URL));
	});

	test('[Happy] Nav "Kho đề" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([
			HeaderComponent.NAV_KHO_DE,
			HeaderComponent.NAV_KIEM_TRA,
		], 10);
		expect(link, '"Kho đề" hoặc "Kiểm tra" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toContain('/contestx');

		await link!.click();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(new RegExp(CONTEST_URL));
	});

	test('[Happy] Nav "Cuộc thi vui" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.NAV_CUOC_THI], 10);
		expect(link, '"Cuộc thi vui" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toContain('/cuoc-thi');

		await link!.click();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(new RegExp(CUOC_THI_URL));
	});

	test('[Happy] Nav "Đấu trường" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.NAV_DAU_TRUONG], 10);
		expect(link, '"Đấu trường" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toContain('dautruong.olm.vn');
	});

	test('[Happy] Nav "Thư viện số" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.NAV_THU_VIEN], 10);
		expect(link, '"Thư viện số" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toContain('/thu-vien-so');

		await link!.click();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(new RegExp(THU_VIEN_SO_URL));
	});

	test('[Happy] Nav "Bài viết" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.NAV_BAI_VIET], 10);
		expect(link, '"Bài viết" phải hiển thị').not.toBeNull();

		await header.clickBaiVietTinTuc();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(/thongtin/, { timeout: 10_000 });
	});

	test('[Happy] Nav "Học bài" điều hướng đúng (chỉ học sinh)', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.NAV_HOC_BAI], 5);
		if (!link) test.skip();

		const href = await link!.getAttribute('href');
		expect(href).toContain('/hoc-bai');

		await link!.click();
		await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
		await expect(page).toHaveURL(new RegExp(HOC_BAI_URL));
	});

	test('[Happy] Top bar "Thi đấu" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.TOP_THI_DAU], 10);
		expect(link, 'Top bar "Thi đấu" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toMatch(/dautruong\.olm\.vn|thi-dau/);
	});

	test('[Happy] Top bar "Đánh giá năng lực" điều hướng đúng', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const link = await header.findVisible([HeaderComponent.TOP_DANH_GIA_NANG_LUC], 10);
		expect(link, '"Đánh giá năng lực" phải hiển thị').not.toBeNull();

		const href = await link!.getAttribute('href');
		expect(href).toMatch(/danh-gia-nang-luc|dgnl\.olm\.vn/);
	});

	test('[Happy] Announcement bar hiển thị', async ({ page }) => {
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const bar = page.locator(HeaderComponent.ANNOUNCEMENT_BAR).first();
		const byText = page.getByText('OLM', { exact: false }).first();

		const isBarVisible = await bar.isVisible().catch(() => false);
		const isTextVisible = await byText.isVisible().catch(() => false);

		expect(isBarVisible || isTextVisible, 'Announcement bar phải hiển thị').toBe(true);
	});

	test('[Unhappy] Header không bị vỡ layout ở viewport nhỏ (768px)', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		const header = new HeaderComponent(page);
		await gotoHome(header);

		const logo = await header.findVisible([HeaderComponent.LOGO], 10);
		expect(logo, 'Logo phải hiển thị ở 768px').not.toBeNull();

		const overflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth <= window.innerWidth + 20;
		});
		expect(overflow, 'Không được overflow ngang ở 768px').toBe(true);
	});
});