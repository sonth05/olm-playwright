import { expect } from '@playwright/test';
import { test } from '../../../../../fixtures/auth.fixture';
import { HomePageLoggedIn } from '../../pages/Homepageloggedin';

test.describe('Homepage regression (copied) @homepage', () => {

	test('User card hiển thị và có avatar', async ({ authenticatedPage: page }) => {
			const hp = new HomePageLoggedIn(page);
			await expect(hp.userCard).toBeVisible();
			await expect(hp.userAvatar).toBeVisible();
		});

	test('Navbar quick actions hiển thị', async ({ authenticatedPage: page }) => {
			const hp = new HomePageLoggedIn(page);
			await expect(hp.btnCSKH).toBeVisible();
			await expect(hp.linkDKNhanPPT).toBeVisible();
			await expect(hp.linkMyClass).toBeVisible();
			await expect(hp.linkAssignedWork).toBeVisible();
		});

	test('Khóa học tiêu biểu và thư viện học liệu hiển thị', async ({ authenticatedPage: page }) => {
			const hp = new HomePageLoggedIn(page);
			await expect(hp.carouselTypicalCourses).toBeVisible();
			await expect(hp.olmKidsBanner).toBeVisible();
		});

});
