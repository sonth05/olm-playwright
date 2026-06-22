import { test, expect } from '@playwright/test';
import { ThuVienSoPage } from '../../pages/ThuVienSoPage';

test.describe('Thu vien so @library @smoke', () => {
  test('[Happy] Trang Thư viện số @smoke', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.open();
    expect(pageObj.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Trang Sách giáo khoa @smoke', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[Happy] Trang Tạp chí @smoke', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openTapChi();
    expect(pageObj.isTapChiLoaded()).toBeTruthy();
  });
});
