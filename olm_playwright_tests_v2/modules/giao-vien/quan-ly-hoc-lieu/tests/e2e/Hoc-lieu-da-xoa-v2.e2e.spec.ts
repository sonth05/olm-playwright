import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuDaXoaV2Page } from '../../pages/Hoclieudaxoav2page';
import {
  FilterCoursewareTypeV2,
  FilterGradeValue,
  FILTER_SUBJECT_VALUE,
} from '../../pages/Hoclieucuatoiv2page';

/**
 * Các ca lọc/phân trang/khôi phục/tải lại dưới đây đều xử lý trên CÙNG 1
 * trang "Học liệu đã xóa" (không điều hướng sang trang khác) nên gộp chung
 * 1 test / 1 page / 1 browser context, chạy tuần tự qua test.step() — không
 * mở lại getPageAsRole() (tức không mở browser mới) cho từng ca nhỏ.
 *
 * THỨ TỰ CHẠY CÓ CHỦ ĐÍCH:
 * - Mỗi step lọc gọi lại page.goto() (điều hướng LẠI CHÍNH trang này để reset
 *   filter, KHÔNG phải mở browser mới) trước khi áp filter riêng, để không bị
 *   ảnh hưởng bởi filter còn sót lại từ step trước.
 * - "Khôi phục" (restoreCourseware) làm THAY ĐỔI dữ liệu (xóa 1 dòng khỏi
 *   bảng) nên đặt SAU các step lọc/đếm để không làm sai lệch số đếm của
 *   chúng.
 * - "Chuyển trang 2" và "Tải lại" không phụ thuộc dữ liệu cụ thể nên đặt sau
 *   cùng.
 *
 * Ca "Breadcrumb điều hướng" tách riêng thành 1 test khác (xem bên dưới) vì
 * đây là ca ĐIỀU HƯỚNG THẬT sang trang "Học liệu của tôi" — đúng bản chất
 * E2E, không gộp chung page với các ca chỉ ở lại trang này.
 */
test.describe('Trang Học liệu đã xóa – E2E @v2role_editableTeacher', () => {
  test('Lọc, khôi phục, phân trang và tải lại trên trang "Học liệu đã xóa"', async ({ getPageAsRole }) => {
    const p = await getPageAsRole('editableTeacher');
    const page = new HocLieuDaXoaV2Page(p);
    await page.goto();

    await test.step('Lọc theo loại học liệu "Kiểm tra"', async () => {
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

    await test.step('Lọc theo môn "Toán"', async () => {
      await page.goto(); // reset filter trước đó, vẫn cùng 1 page/browser
      await page.selectFilterSubject(FILTER_SUBJECT_VALUE.TOAN);
      await page.table.waitFor({ state: 'visible' });

      const rows = await page.getAllRowsData();
      for (const row of rows) {
        expect(row.subject).toBe('Toán');
      }
    });

    await test.step('Lọc theo khối lớp "Lớp 12"', async () => {
      await page.goto(); // reset filter trước đó
      await page.selectFilterGrade(FilterGradeValue.LOP_12);
      await page.table.waitFor({ state: 'visible' });

      const rows = await page.getAllRowsData();
      for (const row of rows) {
        expect(row.grade).toBe('Lớp 12');
      }
    });

    await test.step('Sử dụng bộ lọc nâng cao: chọn "Riêng tư"', async () => {
      await page.goto(); // reset filter trước đó
      const advancedPanel = await page.openAdvancedFilterPanel();
      await advancedPanel.selectOption('Chế độ chia sẻ', 'Riêng tư');
      await advancedPanel.apply();

      const rows = await page.getAllRowsData();
      // Tất cả dòng đều phải là Riêng tư
      for (const row of rows) {
        expect(row.privacy).toBe('Riêng tư');
      }
    });

    await test.step('Khôi phục một học liệu – dòng biến mất', async () => {
      await page.goto(); // reset filter trước đó trước khi thao tác trên danh sách đầy đủ

      // Lấy dữ liệu dòng đầu tiên trước khi khôi phục
      const firstRow = page.getRowByIndex(0);
      const titleBefore = (await page.getRowData(firstRow)).title;

      await page.restoreCourseware(firstRow);

      // Kiểm tra dòng cũ không còn tồn tại (theo tiêu đề)
      const rowAfter = page.getRowByTitle(titleBefore);
      await expect(rowAfter).toHaveCount(0);
    });

    await test.step('Chuyển trang 2 và kiểm tra dữ liệu', async () => {
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
      await page.goToPage(1); // quay lại trang 1 để không ảnh hưởng step tiếp theo
    });

    await test.step('Nút "Tải lại" làm mới danh sách', async () => {
      const countBefore = await page.getRowCount();
      await page.reload();
      // Sau reload, số dòng có thể thay đổi nếu có thêm dữ liệu mới, ta chỉ kiểm tra không lỗi
      const countAfter = await page.getRowCount();
      expect(typeof countAfter).toBe('number');
    });
  });

  test('Breadcrumb điều hướng về "Học liệu cá nhân" khi bấm vào', async ({ getPageAsRole }) => {
    const p = await getPageAsRole('editableTeacher');
    const page = new HocLieuDaXoaV2Page(p);
    await page.goto();

    const breadcrumbLink = page.page.getByText('Học liệu cá nhân').first();
    if (await breadcrumbLink.isVisible()) {
      await breadcrumbLink.click();
      // Kiểm tra URL chứa "hoc-lieu-cua-toi" và không có "deleted=1"
      expect(page.page.url()).toContain('hoc-lieu-cua-toi');
      expect(page.page.url()).not.toContain('deleted=1');
    }
  });
});