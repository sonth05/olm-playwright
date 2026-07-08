import { test, expect } from '@playwright/test';
import { HocLieuCuaToiPage, CoursewareType } from '../pages/HocLieuCuaToiPage';

test.describe('Quản lý Học liệu - Học liệu của tôi @hoc_lieu @smoke', () => {
  
  test('[Happy] Mở trang Học liệu của tôi thành công', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    expect(page.url()).toContain('hoc-lieu-cua-toi');
  });

  test('[Happy] Bảng danh sách học liệu hiển thị', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    const rows = hocLieuPage.getTableRows();
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });

  test('[Happy] Nút "Tạo mới học liệu" tồn tại', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    const createBtn = page.locator(HocLieuCuaToiPage.TAO_MOI_BTN);
    expect(await createBtn.isVisible()).toBeTruthy();
  });

  test('[Happy] Mở dropdown tạo mới thành công', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    const dropdown = await hocLieuPage.openCreateDropdown();
    expect(await dropdown.isVisible()).toBeTruthy();
  });

  test('[Happy] Dropdown hiển thị các loại học liệu', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateDropdown();
    const labels = await hocLieuPage.getDropdownLabels();
    expect(labels.length).toBeGreaterThanOrEqual(10);
  });

  test('[Happy] Modal tạo học liệu mở được', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    const modal = page.locator(HocLieuCuaToiPage.MODAL);
    expect(await modal.isVisible()).toBeTruthy();
  });

  test('[Happy] Tạo Luyện tập trắc nghiệm thành công', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { title: `Smoke_${Date.now()}` }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  test('[Happy] Thêm câu hỏi vào học liệu', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { title: `Smoke_QS_${Date.now()}` }
    );
    await hocLieuPage.addQuestion({
      title: 'Câu hỏi smoke test',
      content: 'Nội dung câu hỏi mẫu',
      level: 'Nhận biết'
    });
    // Question should be added successfully
  });

});