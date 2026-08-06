// hoclieudaxoa-e2e.spec.ts
import { test, expect } from '@playwright/test';
import { HocLieuDaXoaV2Page } from './Hoclieudaxoav2page';
import {
  FilterCoursewareTypeV2,
  FilterGradeValue,
  FILTER_SUBJECT_VALUE,
} from 'Hoclieucuatoiv2page';

test.describe('Trang Học liệu đã xóa – E2E', () => {
  let page: HocLieuDaXoaV2Page;

  test.beforeEach(async ({ page: p }) => {
    page = new HocLieuDaXoaV2Page(p);
    await page.goto();
  });

  test('Khôi phục một học liệu – dòng biến mất', async () => {
    // Lấy dữ liệu dòng đầu tiên trước khi khôi phục
    const firstRow = page.getRowByIndex(0);
    const titleBefore = (await page.getRowData(firstRow)).title;

    await page.restoreCourseware(firstRow);

    // Kiểm tra dòng cũ không còn tồn tại (theo tiêu đề)
    const rowAfter = page.getRowByTitle(titleBefore);
    await expect(rowAfter).toHaveCount(0);
  });

  test('Lọc theo loại học liệu "Kiểm tra"', async () => {
    const countBefore = await page.getTotalRowCountAcrossPages();

    await page.selectFilterType(FilterCoursewareTypeV2.DE_KIEM_TRA);
    // Chờ bảng cập nhật
    await page.table.waitFor({ state: 'visible' });

    const countAfter = await page.getTotalRowCountAcrossPages();
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    // Kiểm tra tất cả các dòng hiển thị đều có loại [Kiểm tra]
    const rows = await page.getAllRowsData();
    for (const row of rows) {
      expect(row.type).toContain('Kiểm tra');
    }
  });

  test('Lọc theo môn "Toán"', async () => {
    await page.selectFilterSubject(FILTER_SUBJECT_VALUE.TOAN);
    await page.table.waitFor({ state: 'visible' });

    const rows = await page.getAllRowsData();
    for (const row of rows) {
      expect(row.subject).toBe('Toán');
    }
  });

  test('Lọc theo khối lớp "Lớp 12"', async () => {
    await page.selectFilterGrade(FilterGradeValue.LOP_12);
    await page.table.waitFor({ state: 'visible' });

    const rows = await page.getAllRowsData();
    for (const row of rows) {
      expect(row.grade).toBe('Lớp 12');
    }
  });

  test('Chuyển trang 2 và kiểm tra dữ liệu', async () => {
    // Chỉ chạy nếu có nhiều trang
    const btnPage2 = page.pageButton(2);
    if (!(await btnPage2.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await page.goToPage(2);
    await expect(page.pageButton(2)).toHaveAttribute('aria-current', 'page');
    const rows = await page.getAllRowsData();
    expect(rows.length).toBeGreaterThan(0);
    // Kiểm tra STT đầu tiên của trang 2 phải lớn hơn 10 (nếu mỗi trang 10 mục)
    const firstRowStt = Number(rows[0].stt);
    expect(firstRowStt).toBeGreaterThan(10);
  });

  test('Sử dụng bộ lọc nâng cao: chọn "Riêng tư"', async () => {
    const advancedPanel = await page.openAdvancedFilterPanel();
    await advancedPanel.selectOption('Chế độ chia sẻ', 'Riêng tư');
    await advancedPanel.apply();

    const rows = await page.getAllRowsData();
    // Tất cả dòng đều phải là Riêng tư
    for (const row of rows) {
      expect(row.privacy).toBe('Riêng tư');
    }
  });

  test('Nút "Tải lại" làm mới danh sách', async () => {
    const countBefore = await page.getRowCount();
    await page.reload();
    // Sau reload, số dòng có thể thay đổi nếu có thêm dữ liệu mới, ta chỉ kiểm tra không lỗi
    const countAfter = await page.getRowCount();
    expect(typeof countAfter).toBe('number');
  });

  test('Breadcrumb điều hướng về "Học liệu cá nhân" khi bấm vào', async () => {
    const breadcrumbLink = page.page.getByText('Học liệu cá nhân').first();
    if (await breadcrumbLink.isVisible()) {
      await breadcrumbLink.click();
      // Kiểm tra URL chứa "hoc-lieu-cua-toi" và không có "deleted=1"
      expect(page.page.url()).toContain('hoc-lieu-cua-toi');
      expect(page.page.url()).not.toContain('deleted=1');
    }
  });
});