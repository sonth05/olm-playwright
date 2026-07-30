import type { Page } from '@playwright/test';
import { test, expect } from '../../../../core/fixtures/role.fixture';
import { NhomGiaoVienPage, GroupDetailTab } from '../pages/NhomGiaoVienPage';
import { PhanCongGiangDayPage} from '../pages/PhanCongGiangDayPage'

test.describe('Nhóm giáo viên (1.1) @quan-ly-giao-vien @regression', () => {
  test.describe('Danh sách nhóm giáo viên', () => {
    test('Trường mở danh sách nhóm giáo viên — trang load + nút Thêm nhóm giáo viên', async ({
      teacherPage: page,
    }) => {
      const nhomPage = new NhomGiaoVienPage(page);
      await nhomPage.open();

      expect(nhomPage.isListPageLoaded()).toBeTruthy();
      expect(await nhomPage.hasAddGroupButton()).toBe(true);
    });

    test('Thấy ít nhất 1 nhóm giáo viên trong danh sách (VD: Giáo viên toàn trường)', async ({
      teacherPage: page,
    }) => {
      const nhomPage = new NhomGiaoVienPage(page);
      await nhomPage.open();

      const groups = await nhomPage.getGroupCards();
      expect(groups.length, 'Trường test phải có ít nhất 1 nhóm giáo viên').toBeGreaterThan(0);
      expect(groups[0].url).toContain('/nhom/');
    });

    test('Link "Nhóm đã xóa" điều hướng đúng trang (deleted=1)', async ({ teacherPage: page }) => {
      const nhomPage = new NhomGiaoVienPage(page);
      await nhomPage.goToDeletedGroups();

      expect(nhomPage.getCurrentUrl()).toContain('deleted=1');
    });
  });

  test.describe('Quản lý thành viên trong nhóm', () => {
    /** Mở sẵn nhóm giáo viên đầu tiên trong danh sách trước mỗi test */
    async function openFirstGroup(page: Page): Promise<NhomGiaoVienPage> {
      const nhomPage = new NhomGiaoVienPage(page);
      await nhomPage.open();
      const groups = await nhomPage.getGroupCards();
      test.skip(groups.length === 0, 'Không có nhóm giáo viên nào để test');
      await nhomPage.openGroupByName(groups[0].name);
      return nhomPage;
    }

    test('Mở nhóm — hiển thị tiêu đề + mã chia sẻ nhóm', async ({ teacherPage: page }) => {
      const nhomPage = await openFirstGroup(page);

      expect(nhomPage.isGroupDetailLoaded()).toBeTruthy();
      const title = await nhomPage.getGroupTitle();
      expect(title.length).toBeGreaterThan(0);

      const shareCode = await nhomPage.getShareCode();
      expect(shareCode).toMatch(/^olm-/);
    });

    test('Chuyển tab "Thống kê" — URL đổi sang /thong-ke', async ({ teacherPage: page }) => {
      const nhomPage = await openFirstGroup(page);
      await nhomPage.switchTab(GroupDetailTab.THONG_KE);

      expect(nhomPage.getCurrentUrl()).toContain('/thong-ke');
    });

    test('Bảng thành viên có ít nhất 1 giáo viên với username hợp lệ', async ({ teacherPage: page }) => {
      const nhomPage = await openFirstGroup(page);

      const members = await nhomPage.getMemberRows();
      expect(members.length, 'Nhóm test phải có ít nhất 1 thành viên').toBeGreaterThan(0);
      expect(members[0].username.length).toBeGreaterThan(0);
      expect(members[0].groupMemberId.length).toBeGreaterThan(0);
    });

    test('Toolbar quản lý nhóm hiển thị đủ nút hành động chính', async ({ teacherPage: page }) => {
      const nhomPage = await openFirstGroup(page);

      await expect(page.locator(NhomGiaoVienPage.BTN_TAO_NHANH_DS)).toBeVisible();
      await expect(page.locator(NhomGiaoVienPage.BTN_IMPORT_DS)).toBeVisible();
      await expect(page.locator(NhomGiaoVienPage.BTN_THEM_CHUYEN_GV)).toBeVisible();
      await expect(page.locator(NhomGiaoVienPage.BTN_LOC_GV)).toBeVisible();
      await expect(page.locator(NhomGiaoVienPage.LINK_TAI_DANH_SACH)).toBeVisible();
    });

    test('Checkbox "Chọn tất cả" chọn được toàn bộ dòng thành viên', async ({ teacherPage: page }) => {
      const nhomPage = await openFirstGroup(page);
      await nhomPage.selectAllMembers();

      const members = await nhomPage.getMemberRows();
      test.skip(members.length === 0, 'Không có thành viên để kiểm tra checkbox');

      const firstCheckbox = page
        .locator(NhomGiaoVienPage.MEMBER_ROW_BY_USERNAME(members[0].username))
        .locator(NhomGiaoVienPage.MEMBER_CHECKBOX)
        .first();
      await expect(firstCheckbox).toBeChecked();
    });

    test('Dropdown "Tùy chọn" của 1 thành viên hiển thị đủ hành động', async ({ teacherPage: page }) => {
      const nhomPage = await openFirstGroup(page);
      const members = await nhomPage.getMemberRows();
      test.skip(members.length === 0, 'Không có thành viên để kiểm tra dropdown');

      await nhomPage.openMemberActionMenu(members[0].username);

      const row = page.locator(NhomGiaoVienPage.MEMBER_ROW_BY_USERNAME(members[0].username));
      const menu = row.locator(NhomGiaoVienPage.MEMBER_DROPDOWN_MENU);
      await expect(menu.getByText('Sửa thông tin giáo viên')).toBeVisible();
      await expect(menu.getByText('Xóa khỏi nhóm')).toBeVisible();
      await expect(menu.getByText('Chuyển nhóm')).toBeVisible();
    
    });
  });
});

test.describe('Phân công giảng dạy (1.1.2) @quan-ly-giao-vien @regression', () => {
  test('Trường mở trang phân công giảng dạy — tiêu đề + bảng phân công load', async ({
    teacherPage: page,
  }) => {
    const phanCongPage = new PhanCongGiangDayPage(page);
    await phanCongPage.open();

    expect(phanCongPage.isLoaded()).toBeTruthy();
    expect(await phanCongPage.getTitle()).toBe('Phân công nhiệm vụ cho giáo viên');
    await expect(page.locator(PhanCongGiangDayPage.TABLE)).toBeVisible();
  });

  test('Bảng có ít nhất 1 giáo viên với tên + username hợp lệ', async ({ teacherPage: page }) => {
    const phanCongPage = new PhanCongGiangDayPage(page);
    await phanCongPage.open();

    const blocks = await phanCongPage.getTeacherBlocks();
    expect(blocks.length, 'Trường test phải có ít nhất 1 giáo viên').toBeGreaterThan(0);
    expect(blocks[0].name.length).toBeGreaterThan(0);
    expect(blocks[0].username.length).toBeGreaterThan(0);
    expect(blocks[0].bossRowId.length).toBeGreaterThan(0);
  });

  test('Checkbox "Quyền thêm/sửa/xoá HS của lớp" mặc định đang bật', async ({ teacherPage: page }) => {
    const phanCongPage = new PhanCongGiangDayPage(page);
    await phanCongPage.open();

    expect(await phanCongPage.isManageClassPermissionChecked()).toBe(true);
  });

  test('Select "Năm học" hiển thị năm học hiện tại', async ({ teacherPage: page }) => {
    const phanCongPage = new PhanCongGiangDayPage(page);
    await phanCongPage.open();

    const year = await phanCongPage.getSelectedSchoolYear();
    expect(year.length).toBeGreaterThan(0);
  });

  test('Select danh sách GV mặc định ở trạng thái "hiện tại" (value=0)', async ({ teacherPage: page }) => {
    const phanCongPage = new PhanCongGiangDayPage(page);
    await phanCongPage.open();

    expect(await phanCongPage.getTeacherListFilterValue()).toBe('0');
  });

  test('Chuyển sang "Danh sách giáo viên bị xóa" — select đổi giá trị sang 1', async ({
    teacherPage: page,
  }) => {
    const phanCongPage = new PhanCongGiangDayPage(page);
    await phanCongPage.open();
    await phanCongPage.showActiveTeachers(false);

    expect(await phanCongPage.getTeacherListFilterValue()).toBe('1');
  });

  test.describe('Phân công môn học của 1 giáo viên', () => {
    /** Ưu tiên GV đã có sẵn ít nhất 1 phân công môn để test đọc dữ liệu có ý nghĩa */
    async function findBlockWithSubject(page: Page) {
      const phanCongPage = new PhanCongGiangDayPage(page);
      await phanCongPage.open();
      const blocks = await phanCongPage.getTeacherBlocks();
      test.skip(blocks.length === 0, 'Không có giáo viên nào để test');

      for (const block of blocks) {
        const subjects = await phanCongPage.getSubjectAssignments(block.bossRowId);
        if (subjects.length > 0) return { phanCongPage, block, subjects };
      }
      return { phanCongPage, block: blocks[0], subjects: [] as Awaited<ReturnType<PhanCongGiangDayPage['getSubjectAssignments']>> };
    }

    test('Đọc được Môn + Lớp đã phân công cho GV có sẵn phân công', async ({ teacherPage: page }) => {
      const { subjects } = await findBlockWithSubject(page);
      test.skip(subjects.length === 0, 'Trường test không có GV nào đã được phân công môn');

      expect(subjects[0].subject.length).toBeGreaterThan(0);
      expect(subjects[0].classes.length).toBeGreaterThan(0);
    });

    test('Checkbox "Tự phân công" của 1 GV bật/tắt được', async ({ teacherPage: page }) => {
      const { phanCongPage, block } = await findBlockWithSubject(page);

      const before = await phanCongPage.isSelfAssignmentChecked(block.teacherId);
      await phanCongPage.toggleSelfAssignment(block.teacherId);
      const after = await phanCongPage.isSelfAssignmentChecked(block.teacherId);

      expect(after).toBe(!before);

      // Trả lại trạng thái ban đầu để không làm lệch dữ liệu thật của trường
      await phanCongPage.toggleSelfAssignment(block.teacherId);
      expect(await phanCongPage.isSelfAssignmentChecked(block.teacherId)).toBe(before);
    });

    test('Dòng "Thêm" phân công mới hiển thị đủ select Môn + nút Thêm', async ({ teacherPage: page }) => {
      const phanCongPage = new PhanCongGiangDayPage(page);
      await phanCongPage.open();

      // Mỗi GV có đúng 1 dòng "Thêm" — bảng có nhiều GV nên chỉ kiểm tra dòng
      // đầu tiên tồn tại & hiển thị đúng thành phần.
      const addRow = page.locator(PhanCongGiangDayPage.TABLE_BODY_ROWS).filter({
        has: page.locator(PhanCongGiangDayPage.SUBJECT_ADD_BTN),
      });
      test.skip((await addRow.count()) === 0, 'Không tìm thấy dòng "Thêm" phân công nào trong bảng');

      const firstAddRow = addRow.first();
      await expect(firstAddRow.locator(PhanCongGiangDayPage.SUBJECT_SELECT2)).toHaveCount(1);
      await expect(firstAddRow.locator(PhanCongGiangDayPage.SUBJECT_ADD_BTN)).toBeVisible();
    });
  });
});