import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LOGIN_TEST_CASES, PASSWORD, USERNAME } from '../../../config/testData';

test.describe('Login @login @smoke', () => {
	test('[Happy] Đăng nhập thành công @smoke', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const success = await loginPage.login(USERNAME, PASSWORD);
		expect(success).toBeTruthy();
	});

	test('[Unhappy] Sai tài khoản và mật khẩu @smoke', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.open();
		await loginPage.enterUsername('invalid_username_xyz');
		await loginPage.enterPassword('invalid_password_123');
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});
});