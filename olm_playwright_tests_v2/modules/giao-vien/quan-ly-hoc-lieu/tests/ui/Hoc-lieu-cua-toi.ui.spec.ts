import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import {
  HocLieuCuaToiV2Page,
  FilterGradeValue,
  FilterCoursewareTypeV2,
  FILTER_SUBJECT_VALUE,
} from '../../pages/Hoclieucuatoiv2page';

test.describe('[UI] TC-LIST: Trang Học liệu của tôi (V2)', () => {
  test('TC-LIST-UI: Header, banner, tabs, nhãn bộ lọc, trạng thái phân trang', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();

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

    await test.step('TC-LIST-03: Hiển thị đủ 3 tab trạng thái', async () => {
      await expect(listPage.tabAll).toBeVisible();
      await expect(listPage.tabPublished).toBeVisible();
      await expect(listPage.tabUnpublished).toBeVisible();
    });

    await test.step('TC-LIST-03b: Badge số lượng trên tab "Chưa xuất bản" (nếu có) khớp đúng TỔNG số dòng qua mọi trang', async () => {
      await listPage.selectStatusTab('unpublished');
      await listPage.table.waitFor({ state: 'visible' });

      const badgeVisible = await listPage.tabUnpublishedCountBadge
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (badgeVisible) {
        const totalCount = await listPage.getTotalRowCountAcrossPages();
        await expect(listPage.tabUnpublishedCountBadge).toHaveText(String(totalCount));
      }
      // TODO: nếu badgeVisible luôn = false trên môi trường thật, xác nhận
      // lại là tab "Chưa xuất bản" KHÔNG có badge (khác thiết kế so với tab
      // "Tất cả") rồi xoá hẳn field tabUnpublishedCountBadge + bước test này.

      await listPage.selectStatusTab('all');
      await listPage.table.waitFor({ state: 'visible' });
    });

    await test.step('TC-LIST-04: Ô tìm kiếm và tiêu đề các cột trong bảng hiển thị đúng', async () => {
      await expect(listPage.searchInput).toBeVisible();
      await expect(listPage.searchInput).toHaveAttribute('placeholder', 'Tìm theo tên học liệu');

      // Đã xác nhận DOM thật 2026-08-04: bảng KHÔNG có checkbox "chọn tất cả"
      // trong <thead> (chỉ 6 cột dữ liệu), nên bỏ hẳn assertion checkbox.
      await expect(listPage.columnHeader('STT')).toBeVisible();
      await expect(listPage.columnHeader('Tên học liệu')).toBeVisible();
      await expect(listPage.columnHeader('Khối lớp')).toBeVisible();
      await expect(listPage.columnHeader('Môn học')).toBeVisible();
      await expect(listPage.columnHeader('Khóa học')).toBeVisible();
      await expect(listPage.columnHeader('Hành động')).toBeVisible();
    });

    await test.step('TC-LIST-05: Mỗi dòng dữ liệu hiển thị đủ badge trạng thái + quyền riêng tư và nút hành động', async () => {
      const firstRow = listPage.getRowByIndex(0);
      await expect(firstRow).toBeVisible();
      const rowData = await listPage.getRowData(firstRow);
      // Badge trạng thái chỉ nhận 1 trong 2 giá trị "Bản nháp"/"Đã xuất bản".
      expect(['Bản nháp', 'Đã xuất bản']).toContain(rowData.status);
      // Badge quyền riêng tư chỉ nhận 1 trong 2 giá trị "Riêng tư"/"Công khai".
      expect(['Riêng tư', 'Công khai']).toContain(rowData.privacy);
      expect(rowData.title.length).toBeGreaterThan(0);

      // Cụm nút hành động: icon "Xem" (link đầu) + "Sửa" đều hiển thị.
      const actionCell = firstRow.locator('td').nth(5);
      await expect(actionCell.getByRole('link').first()).toBeVisible();
      await expect(actionCell.getByRole('link', { name: /Sửa/i })).toBeVisible();
    });

    await test.step('TC-LIST-14: Các nút bộ lọc (loại học liệu/môn học/khối lớp) hiển thị đúng nhãn mặc định', async () => {
      await expect(listPage.filterTypeBtn).toContainText('Tất cả loại học liệu');
      await expect(listPage.filterSubjectBtn).toContainText('Tất cả môn học');
      await expect(listPage.filterGradeBtn).toContainText('Tất cả khối lớp');
      await expect(listPage.btnAdvancedFilter).toBeVisible();
      await expect(listPage.btnReload).toBeVisible();
    });

        await test.step('TC-LIST-21: Thanh phân trang chỉ hiển thị khi có trên 10 học liệu; nếu hiển thị -> trang 1 + nút Trước bị vô hiệu hoá', async () => {
      // Dữ liệu ≤ 10 dòng: thanh phân trang hoàn toàn không xuất hiện → đúng.
      const hasPagination = await listPage.pagination.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!hasPagination) {
        return; // pass
      }

      // Dữ liệu > 10 dòng: thanh phân trang xuất hiện, mặc định đang ở trang 1.
      await listPage.expectCurrentPage(1);

      const prevBtnVisible = await listPage.btnPrevPage.isVisible({ timeout: 2_000 }).catch(() => false);
      if (prevBtnVisible) {
        await expect(listPage.btnPrevPage).toBeDisabled();
      }

      // KHÔNG kiểm tra nút "Sau" ở đây vì có thể dữ liệu có 1 trang, 2 trang,
      // hay nhiều trang — không biết trước được để ép toBeDisabled/toBeEnabled.
    });

    await test.step('TC-LIST-22: Popover "Loại học liệu" hiển thị đủ danh sách + mặc định chọn "Tất cả"', async () => {
      await listPage.typeFilterPopover.open();
      // Ô tìm kiếm đúng placeholder DOM thật + tổng số mục = "Tất cả" (data-value=-1) + 20 loại học liệu.
      await expect(listPage.typeFilterPopover.searchInput).toHaveAttribute('placeholder', 'Tìm loại học liệu');
      await expect(listPage.typeFilterPopover.list.getByRole('option')).toHaveCount(21);

      // Mặc định "Tất cả loại học liệu" đang được chọn (aria-selected + icon check).
      await expect(listPage.typeFilterPopover.allOptionItem).toHaveAttribute('aria-selected', 'true');

      // Đối chiếu 1 vài mục tiêu biểu theo đúng data-value thật (khớp FilterCoursewareTypeV2).
      await expect(listPage.typeFilterPopover.itemByValue(FilterCoursewareTypeV2.DE_KIEM_TRA)).toHaveText('Đề kiểm tra');
      await expect(listPage.typeFilterPopover.itemByValue(FilterCoursewareTypeV2.LY_THUYET_TUONG_TAC)).toHaveText(
        'Lý thuyết tương tác',
      );
      // "Mô phỏng, thí nghiệm ảo" (24) CHỈ có ở popover V2 — KHÔNG có trong FilterCoursewareType (V1), xem docblock FilterCoursewareTypeV2.
      await expect(listPage.typeFilterPopover.itemByValue(FilterCoursewareTypeV2.SIMULATION)).toHaveText(
        'Mô phỏng, thí nghiệm ảo',
      );
      await listPage.typeFilterPopover.close();
    });

    await test.step('TC-LIST-23: Popover "Khối lớp" hiển thị đủ danh sách (Mẫu giáo, Lớp 1..12, ĐH-CĐ) + mặc định "Tất cả"', async () => {
      await listPage.gradeFilterPopover.open();
      await expect(listPage.gradeFilterPopover.list.getByRole('option')).toHaveCount(15); // "Tất cả" + 14 khối
      await expect(listPage.gradeFilterPopover.allOptionItem).toHaveText('Tất cả khối lớp');
      await expect(listPage.gradeFilterPopover.itemByValue(FilterGradeValue.MAU_GIAO)).toHaveText('Mẫu giáo');
      await expect(listPage.gradeFilterPopover.itemByValue(FilterGradeValue.LOP_1)).toHaveText('Lớp 1');
      await expect(listPage.gradeFilterPopover.itemByValue(FilterGradeValue.LOP_12)).toHaveText('Lớp 12');
      await expect(listPage.gradeFilterPopover.itemByValue(FilterGradeValue.DH_CD)).toHaveText('ĐH - CĐ');
      await listPage.gradeFilterPopover.close();
    });

    await test.step('TC-LIST-24: Popover "Môn học" hiển thị đủ danh sách (76 môn + "Tất cả") và ô tìm kiếm lọc đúng theo tên', async () => {
      await listPage.subjectFilterPopover.open();
      await expect(listPage.subjectFilterPopover.list.getByRole('option')).toHaveCount(77);
      await expect(listPage.subjectFilterPopover.allOptionItem).toHaveText('Tất cả môn học');
      // 2 mục nhãn hiển thị trùng "Tin học" nhưng data-value khác nhau (2216416 và 11) — xác nhận cả 2 đều tồn tại.
      await expect(listPage.subjectFilterPopover.itemByValue(FILTER_SUBJECT_VALUE.TIN_HOC)).toHaveText('Tin học');
      await expect(listPage.subjectFilterPopover.itemByValue(FILTER_SUBJECT_VALUE.TIN_HOC_2)).toHaveText('Tin học');
      await expect(listPage.subjectFilterPopover.itemByValue(FILTER_SUBJECT_VALUE.TOAN)).toHaveText('Toán');

      // Gõ tìm kiếm để lọc danh sách trước khi chọn (danh sách gốc quá dài để cuộn tay).
      // LƯU Ý: khớp CHÍNH XÁC "Toán" (^$) — nếu không, getByRole name-match kiểu
      // substring sẽ khớp luôn cả "Toán (tiếng Pháp)" đang cùng hiển thị sau khi
      // lọc, gây strict-mode violation (2 phần tử khớp).
      await listPage.subjectFilterPopover.search('Toán');
      await expect(listPage.subjectFilterPopover.itemByLabel(/^Toán$/)).toBeVisible();
      await listPage.subjectFilterPopover.close();
    });

    await test.step('TC-LIST-25: Panel "Bộ lọc nâng cao" hiển thị đủ 3 nhóm, mặc định "Tất cả" đang chọn ở cả 3 nhóm', async () => {
      const advancedFilter = await listPage.openAdvancedFilterPanel();

      // Nhóm "Nguồn gốc": Tất cả / Tự tạo / Sao chép từ Khoá học/NHCH khác.
      await expect(advancedFilter.optionButton('Nguồn gốc', 'Tất cả')).toBeVisible();
      await expect(advancedFilter.optionButton('Nguồn gốc', 'Tự tạo')).toBeVisible();
      await expect(advancedFilter.optionButton('Nguồn gốc', 'Sao chép từ Khoá học/NHCH khác')).toBeVisible();
      await advancedFilter.expectSelected('Nguồn gốc', 'Tất cả');

      // Nhóm "Phạm vi": Tất cả / Học liệu tự do / Học liệu trong khoá học.
      await expect(advancedFilter.optionButton('Phạm vi', 'Học liệu tự do')).toBeVisible();
      await expect(advancedFilter.optionButton('Phạm vi', 'Học liệu trong khoá học')).toBeVisible();
      await advancedFilter.expectSelected('Phạm vi', 'Tất cả');

      // Nhóm "Chế độ chia sẻ": Tất cả / Công khai / Riêng tư.
      await expect(advancedFilter.optionButton('Chế độ chia sẻ', 'Công khai')).toBeVisible();
      await expect(advancedFilter.optionButton('Chế độ chia sẻ', 'Riêng tư')).toBeVisible();
      await advancedFilter.expectSelected('Chế độ chia sẻ', 'Tất cả');

      // 2 nút cuối panel.
      await expect(advancedFilter.btnReset).toBeVisible();
      await expect(advancedFilter.btnApply).toBeVisible();
    });
  });
});