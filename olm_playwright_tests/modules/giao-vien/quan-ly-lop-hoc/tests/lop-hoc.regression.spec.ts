import { test, expect } from '../../../../core/fixtures/role.fixture';
import { LopHocPage } from '../pages/LopHocCuaToiPage';

test.describe('Quản lý lớp học @quan-ly-lop-hoc @regression', () => {
  test('GV mở danh sách lớp học — trang load + nút Thêm lớp học', async ({
    teacherPage: page,
  }) => {
    const lopPage = new LopHocPage(page);
    await lopPage.open();

    expect(lopPage.isPageLoaded()).toBeTruthy();
    expect(await lopPage.hasAddClassButton()).toBe(true);
  });

  test('GV thấy ít nhất 1 lớp trong danh sách', async ({ teacherPage: page }) => {
    const lopPage = new LopHocPage(page);
    await lopPage.open();

    const classes = await lopPage.getClassLinks();
    expect(classes.length, 'Giáo viên test phải có ít nhất 1 lớp').toBeGreaterThan(0);
  });
});
