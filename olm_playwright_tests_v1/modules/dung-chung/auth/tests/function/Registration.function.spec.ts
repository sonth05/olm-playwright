import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { REGISTER_DATA, REGISTER_TEST_CASES } from '../../../../../config/testData';

test.describe('Registration @registration', () => {

	test('[Happy] Điền form đầy đủ', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.valid_full;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			expect(await registerPage.getFieldValue(RegisterPage.INPUT_FULLNAME)).toBe(data.ho_ten);
			expect(await registerPage.getFieldValue(RegisterPage.INPUT_USERNAME)).toBe(data.username);
			expect(await registerPage.getFieldValue(RegisterPage.INPUT_EMAIL)).toBe(data.email);
			expect(await registerPage.getFieldValue(RegisterPage.INPUT_PHONE)).toBe(data.sdt);
		});

	test('[Happy] Điền form tối thiểu', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.valid_minimal;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			expect(await registerPage.getFieldValue(RegisterPage.INPUT_FULLNAME)).toBe(data.ho_ten);
			expect(await registerPage.getFieldValue(RegisterPage.INPUT_EMAIL)).toBe(data.email);
		});

	test('[Unhappy] Bỏ trống họ tên', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.empty_fullname;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Bỏ trống username', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.empty_username;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Email sai định dạng', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.invalid_email_format;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Bỏ trống email', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.empty_email;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Mật khẩu yếu', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.weak_password;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Bỏ trống mật khẩu', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.empty_password;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] SĐT sai định dạng', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.invalid_phone;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Email trùng', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.duplicate_email;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.isEmailExistsModalShown()) || (await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
		});

	test('[Unhappy] Username trùng', async ({ page }) => {
			const registerPage = new RegisterPage(page);
			const data = REGISTER_TEST_CASES.duplicate_username;
			await registerPage.open();
			await registerPage.selectStudentAccount();
			await registerPage.fillRegistrationForm(
				data.ho_ten,
				data.username,
				data.email,
				data.password,
				data.sdt
			);
			await registerPage.clickSubmit();
			expect((await registerPage.hasValidationMessage()) || !registerPage.isRegistrationSuccessful()).toBeTruthy();
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
