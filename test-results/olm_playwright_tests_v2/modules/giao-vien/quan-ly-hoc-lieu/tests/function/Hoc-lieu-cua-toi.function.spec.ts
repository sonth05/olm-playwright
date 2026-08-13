import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';

/**
 * [FUNCTION] TC-LIST: Trang "Học liệu của tôi" (V2) — hành vi trên dữ liệu
 * seed sẵn có: lọc theo tab trạng thái, đúng nội dung từng dòng bảng, tìm
 * kiếm, mở popover bộ lọc, tải lại, mở menu "Tùy chọn" của 1 dòng, chọn/bỏ
 * chọn tất cả. KHÔNG điều hướng sang trang khác (Xem/Sửa nằm ở
 * ../e2e/Hoc-lieu-cua-toi.e2e.spec.ts), KHÔNG kiểm tra hiển thị tĩnh (xem
 * ../ui/Hoc-lieu-cua-toi.ui.spec.ts).
 *
 * QUAN TRỌNG VỀ THỨ TỰ CHẠY: TC-LIST-04 dưới đây đếm số lượng học liệu CỐ
 * ĐỊNH theo SEED_ROWS -> file này LUÔN phải chạy TRƯỚC
 * ../e2e/De-kiem-tra-modal.e2e.spec.ts (file đó tạo thêm 1 học liệu thật, sẽ
 * làm sai lệch số đếm nếu chạy trước).
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

test.describe('[FUNCTION] TC-LIST: Trang Học liệu của tôi (V2)', () => {
  test('TC-LIST-FUNC: Tabs, bảng dữ liệu, tìm kiếm, bộ lọc, hành động, chọn nhiều dòng', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

    await test.step('Nhóm B - Tabs trạng thái (TC-LIST-04..07)', async () => {
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

    await test.step('Nhóm E - Bộ lọc (TC-LIST-15, 16)', async () => {
      await test.step('TC-LIST-15: Bấm từng nút bộ lọc mở được popover tương ứng (aria-expanded chuyển true)', async () => {
        await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'false');
        await listPage.openFilterType();
        await expect(listPage.filterTypeBtn).toHaveAttribute('aria-expanded', 'true');
        // TODO: nội dung danh sách option bên trong từng popover (loại học liệu/môn học/
        // khối lớp) chưa có DOM thật -> bổ sung assertion cụ thể + hàm chọn option khi có.
      });

      await test.step('TC-LIST-16: Bấm "Tải lại" giữ nguyên danh sách hiện có', async () => {
        await listPage.reload();
        expect(await listPage.getRowCount()).toBe(SEED_ROWS.length);
      });
    });

    await test.step('Nhóm F - Hành động phụ trên từng dòng (TC-LIST-19)', async () => {
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

    await test.step('Nhóm G - Chọn nhiều dòng (TC-LIST-20)', async () => {
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
    });
  });
});
