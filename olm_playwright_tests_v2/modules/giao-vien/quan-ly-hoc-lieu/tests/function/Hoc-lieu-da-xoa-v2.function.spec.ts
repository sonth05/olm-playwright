// hoclieudaxoa-function.spec.ts
import { test, expect } from '@playwright/test';
import { HocLieuDaXoaV2Page, HocLieuDaXoaRow } from '../Hoclieudaxoav2page';

test.describe('HocLieuDaXoaV2Page – Functional', () => {
  let page: HocLieuDaXoaV2Page;

  test.beforeEach(async ({ page: p }) => {
    page = new HocLieuDaXoaV2Page(p);
    await page.goto();
  });

  test('getRowData trả về đầy đủ các trường và đúng kiểu', async () => {
    const firstRow = page.getRowByIndex(0);
    const data: HocLieuDaXoaRow = await page.getRowData(firstRow);

    expect(data).toHaveProperty('stt');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('deletedStatus', 'Đã xóa');
    expect(data).toHaveProperty('privacy');
    expect(data).toHaveProperty('grade');
    expect(data).toHaveProperty('subject');
    expect(data).toHaveProperty('course');

    // Kiểm tra kiểu dữ liệu
    expect(Number(data.stt)).not.toBeNaN();
    expect(data.title.length).toBeGreaterThan(0);
    expect(data.type).toMatch(/^\[.+\]$/); // dạng [Kiểm tra]
    expect(['Riêng tư', 'Công khai']).toContain(data.privacy);
    expect(data.grade).toMatch(/^(Lớp \d+|Mẫu giáo|ĐH - CĐ)$/);
    expect(data.subject.length).toBeGreaterThan(0);
  });

  test('getAllRowsData trả về số dòng khớp với getRowCount', async () => {
    const count = await page.getRowCount();
    const allData = await page.getAllRowsData();
    expect(allData.length).toBe(count);
  });

  test('getTotalRowCountAcrossPages trả về tổng dòng chính xác', async () => {
    // So sánh với số dòng hiển thị trên trang 1 + trang 2 (nếu có) bằng cách duyệt thủ công
    let manualTotal = 0;
    const btnPage2 = page.pageButton(2);
    if (await btnPage2.isVisible().catch(() => false)) {
      manualTotal += await page.getRowCount(); // trang 1
      await page.goToPage(2);
      manualTotal += await page.getRowCount(); // trang 2
      await page.goToPage(1); // quay lại trang 1
    } else {
      manualTotal = await page.getRowCount();
    }

    const computedTotal = await page.getTotalRowCountAcrossPages();
    expect(computedTotal).toBe(manualTotal);
  });

  test('getRowByTitle tìm đúng dòng theo tiêu đề', async () => {
    const firstRow = page.getRowByIndex(0);
    const { title } = await page.getRowData(firstRow);
    const foundRow = page.getRowByTitle(title);
    await expect(foundRow).toHaveCount(1);
    const foundData = await page.getRowData(foundRow);
    expect(foundData.title).toBe(title);
  });

  test('restoreCourseware xóa dòng khỏi bảng (nếu có quyền)', async () => {
    const initialCount = await page.getRowCount();
    if (initialCount === 0) {
      test.skip();
      return;
    }

    const firstRow = page.getRowByIndex(0);
    const titleBefore = (await page.getRowData(firstRow)).title;
    await page.restoreCourseware(firstRow);

    // Kiểm tra số dòng giảm đi 1
    const newCount = await page.getRowCount();
    expect(newCount).toBe(initialCount - 1);

    // Kiểm tra dòng với tiêu đề cũ không còn
    await expect(page.getRowByTitle(titleBefore)).toHaveCount(0);
  });

  test('Phân trang: goToNextPage / goToPrevPage chuyển đúng', async () => {
    const btnPage2 = page.pageButton(2);
    if (!(await btnPage2.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await page.goToNextPage();
    await expect(page.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await page.goToPrevPage();
    await expect(page.pageButton(1)).toHaveAttribute('aria-current', 'page');
  });
});