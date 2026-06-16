import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { LOGIN_TEST_CASES, PASSWORD, USERNAME } from '../src/config/testData';

test.describe('Login @login @regression', () => {
  test('[Happy] Đăng nhập thành công @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const success = await loginPage.login(USERNAME, PASSWORD);
    expect(success).toBeTruthy();
  });

  test('[Happy] Sau đăng nhập URL không còn dangnhap', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(USERNAME, PASSWORD);
    expect(loginPage.getCurrentUrl()).not.toContain('dangnhap');
  });

  test('[Unhappy] Sai tài khoản và mật khẩu @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.enterUsername('invalid_username_xyz');
    await loginPage.enterPassword('invalid_password_123');
    await loginPage.clickLogin();
    expect(loginPage.isLoginSuccessful()).toBeFalsy();
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
