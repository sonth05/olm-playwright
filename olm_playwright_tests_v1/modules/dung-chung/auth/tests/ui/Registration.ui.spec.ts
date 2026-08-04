import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { REGISTER_DATA, REGISTER_TEST_CASES } from '../../../../../config/testData';

test.describe('Registration @registration', () => {

	test('[Happy] Chọn tài khoản Học sinh', async ({ page }) => {
				const registerPage = new RegisterPage(page);
				await registerPage.open();
				await registerPage.selectStudentAccount();
				const fullnameField = await registerPage.findVisible([RegisterPage.INPUT_FULLNAME], 5);
				expect(fullnameField).not.toBeNull();
			});

	test('[Happy] Chọn tài khoản Giáo viên', async ({ page }) => {
				const registerPage = new RegisterPage(page);
				await registerPage.open();
				await registerPage.selectTeacherAccount();
				const fullnameField = await registerPage.findVisible([RegisterPage.INPUT_FULLNAME], 5);
				expect(fullnameField).not.toBeNull();
			});

	test('[Happy] Link đăng nhập hiển thị trên trang đăng ký', async ({ page }) => {
				const registerPage = new RegisterPage(page);
				await registerPage.open();
				const link = await registerPage.findVisible([RegisterPage.LOGIN_LINK], 5);
				const fallback = link ?? (
					(await page.locator("a[href*='dangnhap']").count()) > 0
						? page.locator("a[href*='dangnhap']").first()
						: null
				);
				expect(fallback).not.toBeNull();
			});

	test('[Happy] Điều hướng trang đăng ký @smoke', async ({ page }) => {
				const registerPage = new RegisterPage(page);
				await registerPage.open();
				expect(registerPage.getCurrentUrl()).toContain('dang-ky');
			});

});
