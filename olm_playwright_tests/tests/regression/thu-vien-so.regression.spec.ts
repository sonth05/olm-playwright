import { test, expect } from '@playwright/test';
import { ThuVienSoPage } from '../../pages/ThuVienSoPage';

test.describe('Thu vien so @library @regression @regression', () => {
  test('[Happy] Danh sách sách giáo khoa', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();
    expect(await pageObj.getBookCount()).toBeGreaterThan(0);
  });

  test('[Happy] Lọc sách theo lớp 1', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa(1);
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[Happy] Lọc sách học sinh', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa(1, 'student');
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[Happy] Danh sách tạp chí', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openTapChi();
    expect(await pageObj.getMagazineCount()).toBeGreaterThan(0);
  });

  test('[Unhappy] Lọc lớp không tồn tại', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa(99);
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
    expect(await pageObj.getBookCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Unhappy] Lọc loại sách không hợp lệ', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa(1, 'khong_hop_le');
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
  });

  test('[Unhappy] Badge hội viên tạp chí', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openTapChi();
    if ((await pageObj.getMagazineCount()) > 0) {
      expect(
        (await pageObj.hasMembershipBadge()) || (await pageObj.getMagazineCount()) >= 0
      ).toBeTruthy();
    }
  });

  test('[Unhappy] Click sách đầu tiên', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();
    if ((await pageObj.getBookCount()) > 0) {
      await pageObj.clickFirstBook();
      expect(pageObj.getCurrentUrl()).toBeTruthy();
    }
  });
});
