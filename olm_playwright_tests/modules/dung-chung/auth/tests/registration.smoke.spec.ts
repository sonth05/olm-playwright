import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { REGISTER_DATA, REGISTER_TEST_CASES } from '../../../../config/testData';

test.describe('Registration @registration @smoke', () => {
	test('[Happy] Điều hướng trang đăng ký @smoke', async ({ page }) => {
		const registerPage = new RegisterPage(page);
		await registerPage.open();
		expect(registerPage.getCurrentUrl()).toContain('dang-ky');
	});

	test('[Happy] Điền form học sinh @smoke', async ({ page }) => {
		const registerPage = new RegisterPage(page);
		await registerPage.open();
		await registerPage.selectStudentAccount();
		await registerPage.fillRegistrationForm(
			REGISTER_DATA.ho_ten,
			REGISTER_DATA.username,
			REGISTER_DATA.email,
			REGISTER_DATA.password,
			REGISTER_DATA.sdt
		);
		const value = await registerPage.getFieldValue(RegisterPage.INPUT_FULLNAME);
		expect(value).toBe(REGISTER_DATA.ho_ten);
	});
});