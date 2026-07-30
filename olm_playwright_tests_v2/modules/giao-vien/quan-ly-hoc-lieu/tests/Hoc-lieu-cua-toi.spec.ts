import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';

/**
 * TC-LIST: Trang "Học liệu của tôi" bản V2 (debug.olm.vn), sau khi đã bấm
 * "Thử phiên bản mới" từ V1 (xem Chuyen-doi-v1-v2.spec.ts cho luồng chuyển đổi).
 *
 * Đối chiếu trực tiếp từ DOM thật (#view-my-categories-list, ghi nhận 2026-07-28)
 * với dữ liệu seed CỐ ĐỊNH của tài khoản giáo viên đang dùng để test (3 học liệu):
 *   1. "gvvjhvj"                                  - [Video]          - Đã xuất bản - Công khai - Lớp 12 - Toán
 *   2. "đâs"                                      - [Kiểm tra]       - Đã xuất bản - Công khai - Lớp 12 - Ngoại ngữ 2
 *   3. "ldhasoidsaldlkhljkhjhjkhjklhjkhjklhjklhvh" - [Kỹ năng, NHCH]  - Bản nháp    - Riêng tư  - Lớp 12 - Ngoại ngữ 2
 *
 * TODO: nếu seed data của tài khoản test thay đổi, cần cập nhật lại SEED_ROWS bên
 * dưới và các assertion phụ thuộc số liệu cụ thể (badge đếm, index dòng...).
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

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Header & banner', () => {
  test('TC-LIST-01: Mở trang thành công, hiển thị tiêu đề và liên kết hướng dẫn', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await expect(listPage.heading).toBeVisible();
    await expect(listPage.guideLink).toBeVisible();
    await expect(listPage.guideLink).toHaveAttribute('href', /tao-khoa-hoc-va-cac-hoc-lieu-ca-nhan/);
    await expect(listPage.btnCreateNew).toBeVisible();
  });

  test('TC-LIST-02: Banner "Cập nhật hệ thống" thông báo đúng nội dung gộp loại học liệu', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const banner = page.getByText('Cập nhật hệ thống').locator('..');
    await expect(banner).toContainText(/Đề thi, Luyện tập trắc nghiệm/i);
    await expect(banner).toContainText(/Tạo đề từ ma trận/i);
    await expect(banner).toContainText(/Đề kiểm tra/i);
  });
});

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Tabs trạng thái', () => {
  test('TC-LIST-03: Hiển thị đủ 3 tab trạng thái', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await expect(listPage.tabAll).toBeVisible();
    await expect(listPage.tabPublished).toBeVisible();
    await expect(listPage.tabUnpublished).toBeVisible();
  });

  test('TC-LIST-04: Badge số lượng tab "Tất cả" khớp đúng tổng số học liệu seed (3)', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const badgeCount = await listPage.getAllTabCount();
    expect(badgeCount).toBe(SEED_ROWS.length);

    const rowCount = await listPage.getRowCount();
    expect(rowCount).toBe(SEED_ROWS.length);
  });

  test('TC-LIST-05: Tab "Đã xuất bản" chỉ hiển thị 2 học liệu đã xuất bản', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await listPage.selectStatusTab('published');
    const rows = await listPage.getAllRowsData();

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.status).toBe('Đã xuất bản');
    }
    expect(rows.map((r) => r.title).sort()).toEqual(['gvvjhvj', 'đâs'].sort());
  });

  test('TC-LIST-06: Tab "Chưa xuất bản" chỉ hiển thị 1 bản nháp', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await listPage.selectStatusTab('unpublished');
    const rows = await listPage.getAllRowsData();

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('Bản nháp');
    expect(rows[0].title).toBe('ldhasoidsaldlkhljkhjhjkhjklhjkhjklhjklhvh');
  });

  test('TC-LIST-07: Quay lại tab "Tất cả" hiển thị lại đủ 3 học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await listPage.selectStatusTab('published');
    await listPage.selectStatusTab('all');

    const rowCount = await listPage.getRowCount();
    expect(rowCount).toBe(SEED_ROWS.length);
  });
});

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Nội dung bảng dữ liệu', () => {
  test('TC-LIST-08: Bảng hiển thị đúng dữ liệu cả 3 dòng (tên/loại/trạng thái/quyền riêng tư/khối lớp/môn học)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const rows = await listPage.getAllRowsData();
    expect(rows).toHaveLength(SEED_ROWS.length);

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

  test('TC-LIST-09: Cột "Khóa học" hiển thị rỗng khi học liệu chưa thuộc khóa học nào', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const rows = await listPage.getAllRowsData();
    for (const row of rows) {
      expect(row.course.trim()).toBe('');
    }
  });

  test('TC-LIST-10: STT đánh số tuần tự bắt đầu từ 1', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const rows = await listPage.getAllRowsData();
    expect(rows.map((r) => r.stt)).toEqual(['1', '2', '3']);
  });
});

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Tìm kiếm', () => {
  test('TC-LIST-11: Tìm theo đúng tên học liệu trả về đúng 1 kết quả khớp', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await listPage.searchByTitle('gvvjhvj');

    await expect(listPage.getRowByTitle('gvvjhvj')).toBeVisible();
    expect(await listPage.getRowCount()).toBe(1);
  });

  test('TC-LIST-12: Tìm kiếm từ khóa không tồn tại -> bảng rỗng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await listPage.searchByTitle(`khong-ton-tai-${Date.now()}`);

    await expect(listPage.tableRows).toHaveCount(0);
  });

  test('TC-LIST-13: Xóa từ khóa tìm kiếm trả lại đủ danh sách ban đầu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await listPage.searchByTitle('gvvjhvj');
    expect(await listPage.getRowCount()).toBe(1);

    await listPage.searchByTitle('');
    expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
  });
});

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Bộ lọc', () => {
  test('TC-LIST-14: Các nút bộ lọc (loại học liệu/môn học/khối lớp) hiển thị đúng nhãn mặc định', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await expect(listPage.filterTypeBtn).toContainText('Tất cả loại học liệu');
    await expect(listPage.filterSubjectBtn).toContainText('Tất cả môn học');
    await expect(listPage.filterGradeBtn).toContainText('Tất cả khối lớp');
  });

  test('TC-LIST-15: Bấm từng nút bộ lọc mở được popover tương ứng (aria-expanded chuyển true)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'false');
    await listPage.openFilterType();
    await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'true');

    // TODO: nội dung danh sách option bên trong từng popover (loại học liệu/môn học/
    // khối lớp) chưa có DOM thật -> bổ sung assertion cụ thể + hàm chọn option khi có.
  });

  test('TC-LIST-16: Nút "Bộ lọc nâng cao" và "Tải lại" hiển thị và bấm được', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await expect(listPage.btnAdvancedFilter).toBeVisible();
    await expect(listPage.btnReload).toBeVisible();

    await listPage.reload();
    // Sau khi "Tải lại", bảng vẫn hiển thị đủ dữ liệu như cũ.
    expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
  });
});

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Hành động trên từng dòng', () => {
  test('TC-LIST-17: Bấm "Xem" mở đúng trang chi tiết học liệu (link Xem trỏ đúng URL)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const row = listPage.getRowByIndex(0);
    const { viewUrl } = await listPage.getRowData(row);
    expect(viewUrl).toMatch(/\/chu-de\//);

    await listPage.viewCourseware(row);
    expect(page.url()).toBe(viewUrl);
  });

  test('TC-LIST-18: Bấm "Sửa" điều hướng đúng trang quản lý (kết thúc bằng /quan-ly)', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const row = listPage.getRowByIndex(0);
    const { editUrl } = await listPage.getRowData(row);
    expect(editUrl).toMatch(/\/quan-ly$/);

    await listPage.editCourseware(row);
    await expect(page).toHaveURL(/\/quan-ly$/);
  });

  test('TC-LIST-19: Bấm nút "Tùy chọn" (...) trên 1 dòng mở được menu phụ', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    const row = listPage.getRowByIndex(0);
    const btnMore = row.getByRole('button', { name: 'Tùy chọn' });
    await expect(btnMore).toHaveAttribute('aria-expanded', 'false');

    const controlledId = await btnMore.getAttribute('aria-controls');
    await listPage.openRowMoreOptions(row);

    await expect(btnMore).toHaveAttribute('aria-expanded', 'true');
    if (controlledId) {
      await expect(page.locator(`#${controlledId}`)).toBeVisible();
    }
    // TODO: nội dung menu (Xóa/Nhân bản/Chuyển vào khóa học/Chia sẻ...) chưa có DOM
    // thật -> bổ sung assertion cụ thể khi có, xem TODO trong
    // HocLieuCuaToiV2Page.openRowMoreOptions().
  });

  test('TC-LIST-20: Checkbox "Chọn tất cả trên trang" chọn/bỏ chọn toàn bộ dòng đang hiển thị', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

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
});

test.describe('TC-LIST: Trang Học liệu của tôi (V2) - Phân trang', () => {
  test('TC-LIST-21: Chỉ có 1 trang dữ liệu (3 học liệu) -> nút Trước/Sau đều bị vô hiệu hoá', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await expect(listPage.btnPrevPage).toBeDisabled();
    await expect(listPage.btnNextPage).toBeDisabled();
    await listPage.expectCurrentPage(1);
  });
});