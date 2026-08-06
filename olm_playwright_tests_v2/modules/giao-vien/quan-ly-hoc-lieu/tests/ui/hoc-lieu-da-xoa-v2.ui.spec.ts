// hoclieudaxoa-ui.spec.ts
import { test, expect } from '@playwright/test';
import { HocLieuDaXoaV2Page } from './Hoclieudaxoav2page';
import { dismissPopups } from '../../../../core/shared-pages/dismissPopups';

test.describe('Trang Học liệu đã xóa – UI', () => {
  let page: HocLieuDaXoaV2Page;

  test.beforeEach(async ({ page: p }) => {
    await dismissPopups(p);
    page = new HocLieuDaXoaV2Page(p);
    await page.goto();
  });

  test('Hiển thị tiêu đề trang', async () => {
    await expect(page.heading).toHaveText('Học liệu đã xóa');
  });

  test('Hiển thị breadcrumb đầy đủ', async () => {
    // Breadcrumb trên desktop: Home > Trang giáo viên > Học liệu cá nhân > Học liệu đã xóa
    const breadcrumb = page.page.locator('nav[aria-label="breadcrumb"]'); // giả định có aria-label
    await expect(breadcrumb.getByText('Trang giáo viên')).toBeVisible();
    await expect(breadcrumb.getByText('Học liệu cá nhân')).toBeVisible();
    await expect(breadcrumb.getByText('Học liệu đã xóa')).toBeVisible();
  });

  test('Hiển thị nút "Quay lại giao diện cũ"', async () => {
    await expect(page.btnBackToOldUI).toBeVisible();
  });

  test('Hiển thị bảng dữ liệu với đúng 6 cột', async () => {
    const headers = page.tableHeader.locator('th');
    await expect(headers).toHaveCount(6);
    await expect(headers.nth(0)).toHaveText('STT');
    await expect(headers.nth(1)).toHaveText('Tên học liệu');
    await expect(headers.nth(2)).toHaveText('Khối lớp');
    await expect(headers.nth(3)).toHaveText('Môn học');
    await expect(headers.nth(4)).toHaveText('Khóa học');
    await expect(headers.nth(5)).toHaveText('Hành động');
  });

  test('Hiển thị ít nhất 1 dòng dữ liệu (nếu có dữ liệu seed)', async () => {
    const rowCount = await page.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Mỗi dòng có badge "Đã xóa" và badge quyền riêng tư', async () => {
    const firstRow = page.getRowByIndex(0);
    const titleCell = firstRow.locator('td').nth(1);
    await expect(titleCell.locator('.tw-badge-outline-sm')).toHaveText('Đã xóa');
    await expect(titleCell.locator('.tw-badge-secondary_light-sm, .tw-badge-accent_light-sm')).not.toBeEmpty();
  });

  test('Hiển thị nút "Khôi phục" trên mỗi dòng', async () => {
    const firstRow = page.getRowByIndex(0);
    await expect(firstRow.getByRole('button', { name: /Khôi phục/ })).toBeVisible();
  });

  test('Hiển thị đầy đủ bộ lọc loại học liệu, môn học, khối lớp', async () => {
    await expect(page.filterTypeBtn).toBeVisible();
    await expect(page.filterSubjectBtn).toBeVisible();
    await expect(page.filterGradeBtn).toBeVisible();
    await expect(page.btnAdvancedFilter).toBeVisible();
    await expect(page.btnReload).toBeVisible();
  });

  test('Hiển thị phân trang nếu có nhiều hơn 1 trang', async () => {
    // DOM hiện tại có 2 trang => phân trang sẽ xuất hiện
    if (await page.pagination.isVisible()) {
      await expect(page.btnPrevPage).toBeVisible();
      await expect(page.btnNextPage).toBeVisible();
      await expect(page.pageButton(1)).toBeVisible();
      await expect(page.pageButton(2)).toBeVisible();
    }
  });
});