import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LOGIN_TEST_CASES, PASSWORD, USERNAME } from '../../../../config/testData';

test.describe('Login @login @regression @regression', () => {
	test('[Happy] Sau đăng nhập URL không còn dangnhap', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.login(USERNAME, PASSWORD);
		expect(loginPage.getCurrentUrl()).not.toContain('dangnhap');
	});

	test('[Unhappy] Username đúng, password sai', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.wrong_password;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Username không tồn tại', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.wrong_username;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Bỏ trống username', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.empty_username;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Bỏ trống password', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.empty_password;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Bỏ trống cả hai trường', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.empty_both;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] SQL injection', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.sql_injection;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Chỉ khoảng trắng', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.whitespace_only;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Ký tự đặc biệt', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const data = LOGIN_TEST_CASES.special_characters;
		await loginPage.open();
		await loginPage.enterUsername(data.username);
		await loginPage.enterPassword(data.password);
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
	});

	test('[Unhappy] Sai chữ hoa/thường password', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.open();
		const wrongCasePassword = PASSWORD
			.split('')
			.map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
			.join('');
		await loginPage.enterUsername(USERNAME);
		await loginPage.enterPassword(wrongCasePassword);
		await loginPage.clickLogin();
		if (wrongCasePassword !== PASSWORD) {
			expect(loginPage.isLoginSuccessful()).toBeFalsy();
		}
	});

	test('[Unhappy->Happy] Form vẫn dùng được sau lần thất bại', async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.open();
		await loginPage.enterUsername('wrong_user');
		await loginPage.enterPassword('wrong_pass');
		await loginPage.clickLogin();
		expect(loginPage.isLoginSuccessful()).toBeFalsy();
		const success = await loginPage.login(USERNAME, PASSWORD);
		expect(success).toBeTruthy();
	});
});