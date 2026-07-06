/**
 * homepage.regression.spec.ts
 *
 * Regression copy rút gọn từ suite homepage cũ.
 * Giữ các khối kiểm tra nền tảng nhất để bắt đầu tách sang tree mới.
 */

import { expect } from '@playwright/test';
import { test } from '../../../fixtures/auth.fixture';
import { HomePageLoggedIn } from '../pages/Homepageloggedin';

async function getHomePage(page: import('@playwright/test').Page) {
	const hp = new HomePageLoggedIn(page);
	await hp.open();
	return hp;
}

test.describe('Homepage regression (copied)', () => {
	test('User card hiển thị và có avatar', async ({ authenticatedPage: page }) => {
		const hp = await getHomePage(page);
		await expect(hp.userCard).toBeVisible();
		await expect(hp.userAvatar).toBeVisible();
	});

	test('Navbar quick actions hiển thị', async ({ authenticatedPage: page }) => {
		const hp = await getHomePage(page);
		await expect(hp.btnCSKH).toBeVisible();
		await expect(hp.linkDKNhanPPT).toBeVisible();
		await expect(hp.linkMyClass).toBeVisible();
		await expect(hp.linkAssignedWork).toBeVisible();
	});

	test('Khóa học tiêu biểu và thư viện học liệu hiển thị', async ({ authenticatedPage: page }) => {
		const hp = await getHomePage(page);
		await expect(hp.carouselTypicalCourses).toBeVisible();
		await expect(hp.olmKidsBanner).toBeVisible();
	});
});