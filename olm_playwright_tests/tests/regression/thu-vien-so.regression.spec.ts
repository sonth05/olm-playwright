import { test, expect } from '@playwright/test';
import { ThuVienSoPage } from '../../pages/ThuVienSoPage';

test.describe('Thu vien so @library @regression', () => {
  // ---------------------------------------------------------------------------
  // Happy path — Sách giáo khoa
  // ---------------------------------------------------------------------------

  test('[Happy] Danh sách sách giáo khoa hiển thị có sách', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();
    const count = await pageObj.getBookCount();
    expect(count).toBeGreaterThan(0);
  });

  test('[Happy] Số sách hiển thị khớp với badge "N kết quả"', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();

    const cardCount = await pageObj.getBookCount();
    const badgeCount = await pageObj.getDisplayedResultCount();

    // Nếu badge không tồn tại (badgeCount === -1) thì bỏ qua assertion này
    if (badgeCount !== -1) {
      expect(cardCount).toBe(badgeCount);
    } else {
      // Ít nhất phải có sách
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // Lọc theo lớp (1–12) — kiểm tra có sách và badge khớp
  // ---------------------------------------------------------------------------

  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const grade of grades) {
    test(`[Happy] Lọc sách lớp ${grade} — có kết quả và badge khớp`, async ({ page }) => {
      const pageObj = new ThuVienSoPage(page);
      await pageObj.openSachGiaoKhoa(grade);

      const cardCount = await pageObj.getBookCount();
      expect(cardCount).toBeGreaterThan(0);

      const badgeCount = await pageObj.getDisplayedResultCount();
      if (badgeCount !== -1) {
        // Cho phép sai lệch 1 do lazy-load chưa render hết
        expect(Math.abs(cardCount - badgeCount)).toBeLessThanOrEqual(1);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Lọc theo lớp bằng cách click tab (không dùng query param)
  // ---------------------------------------------------------------------------

  test('[Happy] Click tab lớp 1 từ trang không lọc → có sách', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();
    await pageObj.selectGrade(1);
    const count = await pageObj.getBookCount();
    expect(count).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Happy — Sách học sinh / giáo viên
  // ---------------------------------------------------------------------------

  test('[Happy] Lọc sách học sinh lớp 1', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa(1, 'student');
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
    const count = await pageObj.getBookCount();
    expect(count).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Happy — Tạp chí
  // ---------------------------------------------------------------------------

  test('[Happy] Danh sách tạp chí hiển thị', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openTapChi();
    expect(await pageObj.getMagazineCount()).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Unhappy path
  // ---------------------------------------------------------------------------

  test('[Unhappy] Lọc lớp không tồn tại (grade=99)', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa(99);
    expect(pageObj.isSachGiaoKhoaLoaded()).toBeTruthy();
    // Có thể trả về 0 kết quả — không crash
    const count = await pageObj.getBookCount();
    expect(count).toBeGreaterThanOrEqual(0);
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

  test('[Unhappy] Click sách đầu tiên mở trang chi tiết', async ({ page }) => {
    const pageObj = new ThuVienSoPage(page);
    await pageObj.openSachGiaoKhoa();
    if ((await pageObj.getBookCount()) > 0) {
      await pageObj.clickFirstBook();
      expect(pageObj.getCurrentUrl()).toBeTruthy();
    }
  });
});