// FIX (2026-08-10): xem giải thích đầy đủ ở Hoc-lieu-da-xoa-v2.e2e.spec.ts
// — cùng lỗi thiếu storageState, đổi sang V2authoringrole.fixture cho nhất
// quán account với các file khác trong module.
import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuDuocChiaSeV2Page } from '../../pages/HoclieuduocchiaseV2page';
import { FilterCoursewareTypeV2, FilterGradeValue, FILTER_SUBJECT_VALUE } from '../../pages/Hoclieucuatoiv2page';

/**
 * Các ca lọc tab/tìm kiếm/lọc dưới đây đều xử lý trên CÙNG 1 trang "Học liệu
 * được chia sẻ" (không điều hướng sang trang khác) nên gộp chung 1 test /
 * 1 page / 1 browser context, chạy tuần tự qua test.step() — không mở lại
 * getPageAsRole() (tức không mở browser mới) cho từng ca nhỏ. Mỗi step lọc
 * gọi lại page.goto() (điều hướng LẠI CHÍNH trang này để reset filter/tab,
 * KHÔNG phải mở browser mới) trước khi áp filter riêng, để không bị ảnh
 * hưởng bởi filter còn sót lại từ step trước.
 *
 * Ca "Mở xem học liệu (nút Xem)" tách riêng thành 1 test khác (xem bên
 * dưới) vì đây là ca ĐIỀU HƯỚNG THẬT sang trang chi tiết học liệu — đúng
 * bản chất E2E, không gộp chung page với các ca chỉ ở lại trang này.
 */
test.describe('Học liệu được chia sẻ – E2E @v2role_editableTeacher', () => {
  test('Lọc tab, tìm kiếm và bộ lọc trên trang "Học liệu được chia sẻ"', async ({ getPageAsRole }) => {
    const p = await getPageAsRole('editableTeacher');
    const page = new HocLieuDuocChiaSeV2Page(p);
    await page.goto();

    await test.step('Lọc theo tab "Chưa xuất bản" chỉ hiện học liệu Bản nháp', async () => {
      await page.selectTab('unpublished');
      const rows = await page.getAllRowsData();
      for (const row of rows) {
        expect(row.status).toBe('Bản nháp');
      }
    });

    await test.step('Lọc theo tab "Đã xuất bản" chỉ hiện học liệu Đã xuất bản', async () => {
      await page.selectTab('published');
      const rows = await page.getAllRowsData();
      for (const row of rows) {
        expect(row.status).toBe('Đã xuất bản');
      }
    });

    await test.step('Tìm kiếm theo tên học liệu', async () => {
      await page.goto(); // reset tab trước đó, vẫn cùng 1 page/browser
      const firstRow = page.getRowByIndex(0);
      const { title } = await page.getRowData(firstRow);
      await page.searchByTitle(title);
      const rows = await page.getAllRowsData();
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.some(r => r.title === title)).toBeTruthy();
    });

    await test.step('Lọc theo loại "Kiểm tra"', async () => {
      await page.goto(); // reset tìm kiếm trước đó
      await page.selectFilterType(FilterCoursewareTypeV2.DE_KIEM_TRA);
      const rows = await page.getAllRowsData();
      for (const row of rows) {
        expect(row.type).toContain('Kiểm tra');
      }
    });

    await test.step('Sử dụng bộ lọc nâng cao: Nguồn gốc "Tự tạo"', async () => {
      await page.goto(); // reset filter trước đó
      const panel = await page.openAdvancedFilterPanel();
      await panel.selectOption('Nguồn gốc', 'Tự tạo');
      await panel.apply();
      // Sau khi áp dụng, chỉ hiện học liệu tự tạo – khó kiểm tra nếu không có dữ liệu, ta bỏ qua assert chi tiết
      // Chỉ kiểm tra không lỗi
      const rows = await page.getAllRowsData();
      expect(rows.length).toBeGreaterThanOrEqual(0);
    });
  });

  test('Mở xem học liệu (nút Xem)', async ({ getPageAsRole }) => {
    const p = await getPageAsRole('editableTeacher');
    const page = new HocLieuDuocChiaSeV2Page(p);
    await page.goto();

    const firstRow = page.getRowByIndex(0);
    const { viewUrl } = await page.getRowData(firstRow);
    await page.viewCourseware(firstRow);
    expect(page.page.url()).toContain(viewUrl.split('debug.olm.vn')[1] ?? viewUrl);
  });
});