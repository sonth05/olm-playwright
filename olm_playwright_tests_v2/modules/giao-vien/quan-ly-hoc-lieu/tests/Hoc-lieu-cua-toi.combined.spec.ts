import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';

/**
 * TC-LIST: Trang "Học liệu của tôi" bản V2 (debug.olm.vn) — BẢN GỘP.
 *
 * Thay vì mỗi test chỉ verify 1 phần nhỏ (như bản gốc TC-LIST-01..21, mỗi
 * test tự goto() lại), file này gộp nhiều thành phần liên quan vào CÙNG 1
 * test, dùng test.step() để vẫn xác định đúng bước nào fail khi chạy log/
 * report. Giảm số lần goto() lặp lại, đồng thời test gần với luồng thao tác
 * thật của người dùng hơn (vào trang -> thấy tab -> thấy bảng -> lọc/tìm...).
 *
 * Đối chiếu DOM thật (#view-my-categories-list, ghi nhận 2026-07-28), seed
 * data cố định của tài khoản giáo viên test (3 học liệu) — xem chi tiết ở
 * bản gốc Hoc-lieu-cua-toi.spec.ts.
 */

const SEED_ROWS = [
  { title: 'gvvjhvj', type: '[Video]', status: 'Đã xuất bản', privacy: 'Công khai', grade: 'Lớp 12', subject: 'Toán' },
  { title: 'đâs', type: '[Kiểm tra]', status: 'Đã xuất bản', privacy: 'Công khai', grade: 'Lớp 12', subject: 'Ngoại ngữ 2' },
  {
    title: 'ldhasoidsaldlkhljkhjhjkhjklhjkhjklhjklhvh',
    type: '[Kỹ năng, NHCH]',
    status: 'Bản nháp',
    privacy: 'Riêng tư',
    grade: 'Lớp 12',
    subject: 'Ngoại ngữ 2',
  },
] as const;

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Gộp nhiều thành phần', () => {
  test('TC-LIST-A: Header & banner hiển thị đúng (tiêu đề, link hướng dẫn, nút tạo mới, banner cập nhật)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('Tiêu đề, link hướng dẫn, nút "Tạo mới"', async () => {
      await expect(listPage.heading).toBeVisible();
      await expect(listPage.guideLink).toBeVisible();
      await expect(listPage.guideLink).toHaveAttribute('href', /tao-khoa-hoc-va-cac-hoc-lieu-ca-nhan/);
      await expect(listPage.btnCreateNew).toBeVisible();
    });

    await test.step('Banner "Cập nhật hệ thống" đúng nội dung', async () => {
      const banner = page.getByText('Cập nhật hệ thống').locator('..');
      await expect(banner).toContainText(/Đề thi, Luyện tập trắc nghiệm/i);
      await expect(banner).toContainText(/Tạo đề từ ma trận/i);
      await expect(banner).toContainText(/Đề kiểm tra/i);
    });
  });

  test('TC-LIST-B: Tabs trạng thái lọc đúng dữ liệu (Tất cả/Đã xuất bản/Chưa xuất bản) và quay lại đúng', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('3 tab hiển thị đủ + badge "Tất cả" khớp tổng số seed', async () => {
      await expect(listPage.tabAll).toBeVisible();
      await expect(listPage.tabPublished).toBeVisible();
      await expect(listPage.tabUnpublished).toBeVisible();

      const badgeCount = await listPage.getAllTabCount();
      expect(badgeCount).toBe(SEED_ROWS.length);
      expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
    });

    await test.step('Tab "Đã xuất bản" chỉ còn 2 học liệu đã xuất bản', async () => {
      await listPage.selectStatusTab('published');
      const rows = await listPage.getAllRowsData();
      expect(rows).toHaveLength(2);
      for (const row of rows) expect(row.status).toBe('Đã xuất bản');
      expect(rows.map((r) => r.title).sort()).toEqual(['gvvjhvj', 'đâs'].sort());
    });

    await test.step('Tab "Chưa xuất bản" chỉ còn 1 bản nháp', async () => {
      await listPage.selectStatusTab('unpublished');
      const rows = await listPage.getAllRowsData();
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe('Bản nháp');
      expect(rows[0].title).toBe('ldhasoidsaldlkhljkhjhjkhjklhjkhjklhjklhvh');
    });

    await test.step('Quay lại "Tất cả" hiển thị đủ lại 3 học liệu', async () => {
      await listPage.selectStatusTab('all');
      expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
    });
  });

  test('TC-LIST-C: Bảng dữ liệu hiển thị đúng nội dung, cột Khóa học rỗng, STT đánh số đúng', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const rows = await listPage.getAllRowsData();
    expect(rows).toHaveLength(SEED_ROWS.length);

    await test.step('Đúng dữ liệu cả 3 dòng (tên/loại/trạng thái/quyền riêng tư/khối lớp/môn học)', async () => {
      for (let i = 0; i < SEED_ROWS.length; i++) {
        const expected = SEED_ROWS[i];
        const actual = rows[i];
        expect(actual.title).toBe(expected.title);
        expect(actual.type).toBe(expected.type);
        expect(actual.status).toBe(expected.status);
        expect(actual.privacy).toBe(expected.privacy);
        expect(actual.grade).toBe(expected.grade);
        expect(actual.subject).toBe(expected.subject);
      }
    });

    await test.step('Cột "Khóa học" rỗng khi chưa thuộc khóa học nào', async () => {
      for (const row of rows) expect(row.course.trim()).toBe('');
    });

    await test.step('STT đánh số tuần tự từ 1', async () => {
      expect(rows.map((r) => r.stt)).toEqual(['1', '2', '3']);
    });
  });

  test('TC-LIST-D: Tìm kiếm - có kết quả, không kết quả, và xóa từ khóa trả lại danh sách gốc', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('Tìm đúng tên -> đúng 1 kết quả khớp', async () => {
      await listPage.searchByTitle('gvvjhvj');
      await expect(listPage.getRowByTitle('gvvjhvj')).toBeVisible();
      expect(await listPage.getRowCount()).toBe(1);
    });

    await test.step('Tìm từ khóa không tồn tại -> bảng rỗng', async () => {
      await listPage.searchByTitle(`khong-ton-tai-${Date.now()}`);
      await expect(listPage.tableRows).toHaveCount(0);
    });

    await test.step('Xóa từ khóa -> trả lại đủ danh sách ban đầu', async () => {
      await listPage.searchByTitle('');
      expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
    });
  });

  test('TC-LIST-E: Bộ lọc - nhãn mặc định đúng, mở được popover, "Tải lại" giữ nguyên dữ liệu', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('Nhãn mặc định của 3 nút lọc', async () => {
      await expect(listPage.filterTypeBtn).toContainText('Tất cả loại học liệu');
      await expect(listPage.filterSubjectBtn).toContainText('Tất cả môn học');
      await expect(listPage.filterGradeBtn).toContainText('Tất cả khối lớp');
    });

    await test.step('Bấm nút lọc loại học liệu mở được popover (aria-expanded true)', async () => {
      await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'false');
      await listPage.openFilterType();
      await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'true');
      // TODO: nội dung option bên trong từng popover chưa có DOM thật.
    });

    await test.step('"Bộ lọc nâng cao" + "Tải lại" hiển thị, tải lại vẫn giữ đủ dữ liệu', async () => {
      await expect(listPage.btnAdvancedFilter).toBeVisible();
      await expect(listPage.btnReload).toBeVisible();
      await listPage.reload();
      expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
    });
  });

  test('TC-LIST-F: Hành động trên dòng - Xem/Sửa điều hướng đúng URL, menu "Tùy chọn" mở được', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const row = listPage.getRowByIndex(0);

    await test.step('Bấm "Xem" mở đúng trang chi tiết', async () => {
      const { viewUrl } = await listPage.getRowData(row);
      expect(viewUrl).toMatch(/\/chu-de\//);
      await listPage.viewCourseware(row);
      expect(page.url()).toBe(viewUrl);
      await listPage.goto();
    });

    await test.step('Bấm "Sửa" điều hướng đúng trang quản lý', async () => {
      const rowAgain = listPage.getRowByIndex(0);
      const { editUrl } = await listPage.getRowData(rowAgain);
      expect(editUrl).toMatch(/\/quan-ly$/);
      await listPage.editCourseware(rowAgain);
      await expect(page).toHaveURL(/\/quan-ly$/);
      await listPage.goto();
    });

    await test.step('Bấm nút "Tùy chọn" (...) mở được menu phụ', async () => {
      const rowAgain = listPage.getRowByIndex(0);
      const btnMore = rowAgain.getByRole('button', { name: 'Tùy chọn' });
      await expect(btnMore).toHaveAttribute('aria-expanded', 'false');
      const controlledId = await btnMore.getAttribute('aria-controls');
      await listPage.openRowMoreOptions(rowAgain);
      await expect(btnMore).toHaveAttribute('aria-expanded', 'true');
      if (controlledId) {
        await expect(page.locator(`#${controlledId}`)).toBeVisible();
      }
      // TODO: nội dung menu (Xóa/Nhân bản/Chuyển vào khóa học/Chia sẻ...) chưa có DOM thật.
    });
  });

  test('TC-LIST-G: Chọn nhiều dòng (checkbox tất cả) và phân trang (1 trang duy nhất -> nút vô hiệu hoá)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('Checkbox "Chọn tất cả trên trang" chọn/bỏ chọn toàn bộ dòng', async () => {
      const selectAllCheckbox = page.getByRole('checkbox', { name: 'Chọn tất cả trên trang' });
      const rowCheckboxes = listPage.tableRows.getByRole('checkbox');

      await expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'false');
      await selectAllCheckbox.click();

      const count = await rowCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await expect(rowCheckboxes.nth(i)).toHaveAttribute('aria-checked', 'true');
      }

      await selectAllCheckbox.click();
      for (let i = 0; i < count; i++) {
        await expect(rowCheckboxes.nth(i)).toHaveAttribute('aria-checked', 'false');
      }
    });

    await test.step('Chỉ 1 trang dữ liệu -> nút Trước/Sau vô hiệu hoá', async () => {
      await expect(listPage.btnPrevPage).toBeDisabled();
      await expect(listPage.btnNextPage).toBeDisabled();
      await listPage.expectCurrentPage(1);
    });
  });
});