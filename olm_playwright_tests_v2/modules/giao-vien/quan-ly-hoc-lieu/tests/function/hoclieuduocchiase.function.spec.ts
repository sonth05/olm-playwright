// FIX (2026-08-10): xem giải thích đầy đủ ở
// tests/e2e/Hoc-lieu-da-xoa-v2.e2e.spec.ts — cùng lỗi thiếu storageState,
// đổi sang V2authoringrole.fixture cho nhất quán account với các file khác
// trong module.
import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuDuocChiaSeV2Page, HocLieuDuocChiaSeRow } from '../../pages/HoclieuduocchiaseV2page';

test.describe('HocLieuDuocChiaSeV2Page – Functional', () => {
  let page: HocLieuDuocChiaSeV2Page;

  test.beforeEach(async ({ getPageAsRole }) => {
    const p = await getPageAsRole('editableTeacher');
    page = new HocLieuDuocChiaSeV2Page(p);
    await page.goto();
  });

  test('getRowData trả về đủ trường và đúng kiểu', async () => {
    const firstRow = page.getRowByIndex(0);
    const data: HocLieuDuocChiaSeRow = await page.getRowData(firstRow);

    expect(data.stt).toBeDefined();
    expect(Number(data.stt)).not.toBeNaN();
    expect(data.title.length).toBeGreaterThan(0);
    expect(data.type).toMatch(/^\[.+\]$/);
    expect(['Bản nháp', 'Đã xuất bản']).toContain(data.status);
    expect(['Riêng tư', 'Công khai']).toContain(data.privacy);
    expect(data.grade).toMatch(/^(Lớp \d+|Mẫu giáo|ĐH - CĐ)$/);
    expect(data.subject.length).toBeGreaterThan(0);
    expect(data.viewUrl).toContain('debug.olm.vn/chu-de/');
  });

  test('getAllRowsData trả về mảng đúng số dòng', async () => {
    const count = await page.getRowCount();
    const all = await page.getAllRowsData();
    expect(all.length).toBe(count);
  });

  test('getRowByTitle tìm đúng dòng', async () => {
    const firstRow = page.getRowByIndex(0);
    const { title } = await page.getRowData(firstRow);
    const found = page.getRowByTitle(title);
    await expect(found).toHaveCount(1);
    const foundData = await page.getRowData(found);
    expect(foundData.title).toBe(title);
  });

  test('Mở Tùy chọn (more) không báo lỗi', async () => {
    const firstRow = page.getRowByIndex(0);
    await page.openMoreOptions(firstRow);
    // Kiểm tra có menu thả xuống xuất hiện (có thể assert role="menu")
    const menu = page.page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 3000 });
    // Đóng menu
    await page.page.keyboard.press('Escape');
  });
});