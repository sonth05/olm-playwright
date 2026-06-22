import { test, expect } from '@playwright/test';
import { HeaderPage } from '../../pages/HeaderPage';

test.describe('Header @header @regression @regression', () => {
  test('[Happy] Click logo về trang chủ', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.clickNavHocBai();
    await headerPage.clickLogo();
    const currentUrl = headerPage.getCurrentUrl().replace(/\/$/, '');
    expect(['https://olm.vn', 'https://olm.vn/index']).toContain(currentUrl);
  });

  test('[Happy] Menu Học bài', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.clickNavHocBai();
    expect(headerPage.getCurrentUrl()).toContain('hoc-bai');
  });

  test('[Happy] Menu Hỏi đáp', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.clickNavHoiDap();
    expect(headerPage.getCurrentUrl()).toContain('hoi-dap');
  });

  test('[Happy] Menu Kiểm tra', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.clickNavContest();
    expect(headerPage.getCurrentUrl()).toContain('contestx');
  });

  test('[Happy] Menu Thư viện số', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.clickNavThuVienSo();
    expect(headerPage.getCurrentUrl()).toContain('thu-vien-so');
  });

  test('[Happy] Search bar hiển thị', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    expect(await headerPage.isSearchInputPresent()).toBeTruthy();
  });

  test('[Happy] Tìm kiếm từ khóa hợp lệ', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.search('Toán lớp 5');
    expect(headerPage.getCurrentUrl()).toBeTruthy();
  });

  test('[Happy] Nút đăng nhập khi chưa login', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    expect(await headerPage.isLoginButtonPresent()).toBeTruthy();
  });

  test('[Unhappy] Tìm kiếm rỗng', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.search('');
    expect(headerPage.getCurrentUrl()).toBeTruthy();
  });

  test('[Unhappy] Tìm kiếm XSS', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });
    await headerPage.open();
    await headerPage.search("<script>alert('xss')</script>");
    expect(dialogTriggered).toBeFalsy();
  });

  test('[Unhappy] Tìm kiếm chuỗi dài', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    await headerPage.search('a'.repeat(500));
    expect(headerPage.getCurrentUrl()).toBeTruthy();
  });

  test('[Unhappy] Không có dropdown user khi chưa login', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    expect(await headerPage.isUserDropdownPresent()).toBeFalsy();
  });

  test('[Unhappy] Icon tin nhắn/thông báo', async ({ page }) => {
    const headerPage = new HeaderPage(page);
    await headerPage.open();
    const messageIcons = await headerPage.findElements(HeaderPage.MESSAGE_ICON);
    const notificationIcons = await headerPage.findElements(HeaderPage.NOTIFICATION_ICON);
    expect(Array.isArray(messageIcons)).toBeTruthy();
    expect(Array.isArray(notificationIcons)).toBeTruthy();
  });
});
