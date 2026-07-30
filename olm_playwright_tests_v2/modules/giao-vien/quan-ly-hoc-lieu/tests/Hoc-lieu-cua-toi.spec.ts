import { test, expect } from '../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../pages/Hoclieucuatoiv2page';

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

test.describe('TC-LIST: Trang Học liệu của tôi (V2)', () => {
  test('TC-LIST: Toàn bộ trang danh sách - header, tabs, bảng, tìm kiếm, lọc, hành động, phân trang', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('Nhóm A - Header & banner (TC-LIST-01, 02)', async () => {
      await test.step('TC-LIST-01: Mở trang thành công, hiển thị tiêu đề và liên kết hướng dẫn', async () => {
        await expect(listPage.heading).toBeVisible();
        await expect(listPage.guideLink).toBeVisible();
        await expect(listPage.guideLink).toHaveAttribute('href', /tao-khoa-hoc-va-cac-hoc-lieu-ca-nhan/);
        await expect(listPage.btnCreateNew).toBeVisible();
      });

      await test.step('TC-LIST-02: Banner "Cập nhật hệ thống" thông báo đúng nội dung gộp loại học liệu', async () => {
        const banner = page.getByText('Cập nhật hệ thống').locator('..');
        await expect(banner).toContainText(/Đề thi, Luyện tập trắc nghiệm/i);
        await expect(banner).toContainText(/Tạo đề từ ma trận/i);
        await expect(banner).toContainText(/Đề kiểm tra/i);
      });
    });

    await test.step('Nhóm B - Tabs trạng thái (TC-LIST-03..07)', async () => {
      await test.step('TC-LIST-03: Hiển thị đủ 3 tab trạng thái', async () => {
        await expect(listPage.tabAll).toBeVisible();
        await expect(listPage.tabPublished).toBeVisible();
        await expect(listPage.tabUnpublished).toBeVisible();
      });

      await test.step('TC-LIST-04: Badge số lượng tab "Tất cả" khớp đúng tổng số học liệu seed', async () => {
        const badgeCount = await listPage.getAllTabCount();
        expect(badgeCount).toBe(SEED_ROWS.length);
        expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
      });

      await test.step('TC-LIST-05: Tab "Đã xuất bản" chỉ hiển thị học liệu đã xuất bản', async () => {
        await listPage.selectStatusTab('published');
        const rows = await listPage.getAllRowsData();
        const expectedPublished = SEED_ROWS.filter((r) => r.status === 'Đã xuất bản');
        expect(rows).toHaveLength(expectedPublished.length);
        for (const row of rows) expect(row.status).toBe('Đã xuất bản');
        expect(rows.map((r) => r.title).sort()).toEqual(expectedPublished.map((r) => r.title).sort());
      });

      await test.step('TC-LIST-06: Tab "Chưa xuất bản" chỉ hiển thị bản nháp', async () => {
        await listPage.selectStatusTab('unpublished');
        const rows = await listPage.getAllRowsData();
        const expectedDraft = SEED_ROWS.filter((r) => r.status === 'Bản nháp');
        expect(rows).toHaveLength(expectedDraft.length);
        for (const row of rows) expect(row.status).toBe('Bản nháp');
        expect(rows.map((r) => r.title).sort()).toEqual(expectedDraft.map((r) => r.title).sort());
      });

      await test.step('TC-LIST-07: Quay lại tab "Tất cả" hiển thị lại đủ học liệu seed', async () => {
        await listPage.selectStatusTab('all');
        expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
      });
    });

    await test.step('Nhóm C - Nội dung bảng dữ liệu (TC-LIST-08..10)', async () => {
      const rows = await listPage.getAllRowsData();
      expect(rows).toHaveLength(SEED_ROWS.length);

      await test.step('TC-LIST-08: Bảng hiển thị đúng dữ liệu từng dòng (tên/loại/trạng thái/quyền riêng tư/khối lớp/môn học)', async () => {
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

      await test.step('TC-LIST-09: Cột "Khóa học" hiển thị rỗng khi học liệu chưa thuộc khóa học nào', async () => {
        for (const row of rows) expect(row.course.trim()).toBe('');
      });

      await test.step('TC-LIST-10: STT đánh số tuần tự bắt đầu từ 1', async () => {
        expect(rows.map((r) => r.stt)).toEqual(SEED_ROWS.map((_, i) => String(i + 1)));
      });
    });

    await test.step('Nhóm D - Tìm kiếm (TC-LIST-11..13)', async () => {
      await test.step('TC-LIST-11: Tìm theo đúng tên học liệu trả về đúng 1 kết quả khớp', async () => {
        await listPage.searchByTitle('gvvjhvj');
        await expect(listPage.getRowByTitle('gvvjhvj')).toBeVisible();
        expect(await listPage.getRowCount()).toBe(1);
      });

      await test.step('TC-LIST-12: Tìm kiếm từ khóa không tồn tại -> bảng rỗng', async () => {
        await listPage.searchByTitle(`khong-ton-tai-${Date.now()}`);
        await expect(listPage.tableRows).toHaveCount(0);
      });

      await test.step('TC-LIST-13: Xóa từ khóa tìm kiếm trả lại đủ danh sách ban đầu', async () => {
        await listPage.searchByTitle('');
        expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
      });
    });

    await test.step('Nhóm E - Bộ lọc (TC-LIST-14..16)', async () => {
      await test.step('TC-LIST-14: Các nút bộ lọc (loại học liệu/môn học/khối lớp) hiển thị đúng nhãn mặc định', async () => {
        await expect(listPage.filterTypeBtn).toContainText('Tất cả loại học liệu');
        await expect(listPage.filterSubjectBtn).toContainText('Tất cả môn học');
        await expect(listPage.filterGradeBtn).toContainText('Tất cả khối lớp');
      });

      await test.step('TC-LIST-15: Bấm từng nút bộ lọc mở được popover tương ứng (aria-expanded chuyển true)', async () => {
        await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'false');
        await listPage.openFilterType();
        await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'true');
        // TODO: nội dung danh sách option bên trong từng popover (loại học liệu/môn học/
        // khối lớp) chưa có DOM thật -> bổ sung assertion cụ thể + hàm chọn option khi có.
      });

      await test.step('TC-LIST-16: Nút "Bộ lọc nâng cao" và "Tải lại" hiển thị và bấm được', async () => {
        await expect(listPage.btnAdvancedFilter).toBeVisible();
        await expect(listPage.btnReload).toBeVisible();
        await listPage.reload();
        expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
      });
    });

    await test.step('Nhóm F - Hành động trên từng dòng (TC-LIST-17..19)', async () => {
      await test.step('TC-LIST-17: Bấm "Xem" mở đúng trang chi tiết học liệu (link Xem trỏ đúng URL)', async () => {
        const row = listPage.getRowByIndex(0);
        const { viewUrl } = await listPage.getRowData(row);
        expect(viewUrl).toMatch(/\/chu-de\//);
        await listPage.viewCourseware(row);
        expect(page.url()).toBe(viewUrl);
        await listPage.goto();
      });

      await test.step('TC-LIST-18: Bấm "Sửa" điều hướng đúng trang quản lý (kết thúc bằng /quan-ly)', async () => {
        const row = listPage.getRowByIndex(0);
        const { editUrl } = await listPage.getRowData(row);
        expect(editUrl).toMatch(/\/quan-ly$/);
        await listPage.editCourseware(row);
        await expect(page).toHaveURL(/\/quan-ly$/);
        await listPage.goto();
      });

      await test.step('TC-LIST-19: Bấm nút "Tùy chọn" (...) trên 1 dòng mở được menu phụ', async () => {
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
    });

    await test.step('Nhóm G - Chọn nhiều dòng & phân trang (TC-LIST-20, 21)', async () => {
      await test.step('TC-LIST-20: Checkbox "Chọn tất cả trên trang" chọn/bỏ chọn toàn bộ dòng đang hiển thị', async () => {
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

      await test.step('TC-LIST-21: Chỉ có 1 trang dữ liệu -> nút Trước/Sau đều bị vô hiệu hoá', async () => {
        await expect(listPage.btnPrevPage).toBeDisabled();
        await expect(listPage.btnNextPage).toBeDisabled();
        await listPage.expectCurrentPage(1);
      });
    });
  });
});