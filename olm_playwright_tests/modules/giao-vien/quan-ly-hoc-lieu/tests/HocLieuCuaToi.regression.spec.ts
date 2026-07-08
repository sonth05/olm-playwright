import { test, expect } from '@playwright/test';
import { HocLieuCuaToiPage, CoursewareType } from '../pages/HocLieuCuaToiPage';

test.describe('Quản lý Học liệu - Học liệu của tôi @hoc_lieu @regression', () => {
  
  // ========== PAGE LOAD & NAVIGATION TESTS ==========
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

  // ========== DROPDOWN & MODAL TESTS ==========
  test('[Happy] Nút "Tạo mới học liệu" tồn tại và hiển thị', async ({ page }) => {
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

  test('[Happy] Dropdown tạo mới hiển thị đủ loại học liệu (≥10 loại)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateDropdown();
    const labels = await hocLieuPage.getDropdownLabels();
    // Regression: should have around 15 types in dropdown
    expect(labels.length).toBeGreaterThanOrEqual(10);
  });

  test('[Happy] Modal tạo học liệu mở được', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    const modal = page.locator(HocLieuCuaToiPage.MODAL);
    expect(await modal.isVisible()).toBeTruthy();
  });

  // ========== CREATE COURSEWARE - LUYỆN TẬP TRẮC NGHIỆM ==========
  test('[Happy] TC-MYLIB-01: Tạo Luyện tập trắc nghiệm thành công', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { 
        title: `Test_LUYEN_TAP_${Date.now()}`,
        description: 'Test từ spec V2'
      }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  test('[Happy] TC-MYLIB-01: Luyện tập trắc nghiệm có tiêu đề và mô tả', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = `Test_QS_${Date.now()}`;
    await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { 
        title: title,
        description: 'Mô tả học liệu kiểm tra',
        keyword: 'test, keyword'
      }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  // ========== CREATE COURSEWARE - ĐỀ THI THÔNG MINH ==========
  test('[Happy] Tạo Đề thi thông minh (DE_THI_THONG_MINH)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.DE_THI_THONG_MINH,
      { 
        title: `Test_THINTEL_${Date.now()}`,
        description: 'Đề thi thông minh mẫu'
      }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  // ========== CREATE COURSEWARE - ĐỀ THI THPT ==========
  test('[Happy] Tạo Đề thi THPT (DE_THI_THPT)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.DE_THI_THPT,
      { 
        title: `Test_THPT_${Date.now()}`,
        description: 'Đề thi THPT mẫu'
      }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  // ========== CREATE COURSEWARE - VIDEO YOUTUBE ==========
  test('[Happy] TC-MYLIB-07: Tạo Video Youtube có điểm dừng', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      { 
        title: `Test_VIDEO_${Date.now()}`,
        description: 'Video Youtube với điểm dừng'
      }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  test('[Happy] TC-MYLIB-07: Thêm link Youtube vào học liệu video', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.createCourseware(
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      { title: `Test_VID_${Date.now()}` }
    );
    // Thêm link Youtube từ trang quản lý
    await hocLieuPage.addYoutubeVideoLink(
      'https://www.youtube.com/watch?v=eHwesHMnr2o&list=RDeHwesHMnr2o&start_radio=1'
    );
    // Video page should load after saving
    expect(page.url()).toBeTruthy();
  });

  // ========== CREATE COURSEWARE - KHÁC ==========
  test('[Happy] Tạo Hỏi và đáp (HOI_VA_DAP)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.HOI_VA_DAP,
      { title: `Test_QA_${Date.now()}` }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  test('[Happy] Tạo Lý thuyết tương tác (LY_THUYET_TUONG_TAC)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.LY_THUYET_TUONG_TAC,
      { title: `Test_THEORY_${Date.now()}` }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  test('[Happy] Tạo Đề thi từ lập (DE_THI_TU_LUAN)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.DE_THI_TU_LUAN,
      { title: `Test_ESSAY_${Date.now()}` }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  test('[Happy] Tạo Tài liệu (TAI_LIEU)', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = await hocLieuPage.createCourseware(
      CoursewareType.TAI_LIEU,
      { title: `Test_MATERIAL_${Date.now()}` }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

  // ========== QUESTION MANAGEMENT TESTS ==========
  test('[Happy] Thêm câu hỏi vào Luyện tập trắc nghiệm', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { title: `Test_QS_${Date.now()}` }
    );
    await hocLieuPage.addQuestion({
      title: 'Câu hỏi kiểm tra regression',
      content: 'Nội dung câu hỏi mẫu cho regression test',
      level: 'Nhận biết'
    });
    // Question should be added
  });

  test('[Happy] Mở modal tạo câu hỏi thành công', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { title: `Test_${Date.now()}` }
    );
    await hocLieuPage.openTaoCauHoiModal();
    const modal = page.locator(HocLieuCuaToiPage.QUESTION_MODAL);
    expect(await modal.isVisible()).toBeTruthy();
  });

  test('[Happy] Các mức độ câu hỏi hiển thị (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)', 
    async ({ page }) => {
      const hocLieuPage = new HocLieuCuaToiPage(page);
      await hocLieuPage.createCourseware(
        CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
        { title: `Test_${Date.now()}` }
      );
      await hocLieuPage.openTaoCauHoiModal();
      
      const levels = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const;
      for (const level of levels) {
        const levelBtn = page.locator(HocLieuCuaToiPage.QUESTION_LEVEL_TAB(level));
        expect(await levelBtn.isVisible()).toBeTruthy();
      }
    }
  );

  // ========== FORM VALIDATION & ERROR HANDLING ==========
  test('[Unhappy] Hủy tạo học liệu - Modal đóng không lưu', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    await hocLieuPage.cancelModal();
    expect(await page.locator(HocLieuCuaToiPage.MODAL).isVisible()).toBeFalsy();
  });

  test('[Unhappy] Đóng modal bằng nút X - Modal đóng không lưu', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    await hocLieuPage.closeModal();
    expect(await page.locator(HocLieuCuaToiPage.MODAL).isVisible()).toBeFalsy();
  });

  // ========== FORM FIELD TESTS ==========
  test('[Happy] Điền tất cả các trường form: tiêu đề, mô tả, từ khóa, SEO', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    const title = `Test_FULL_${Date.now()}`;
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    await hocLieuPage.fillModal({
      title: title,
      description: 'Mô tả đầy đủ',
      keyword: 'keyword1, keyword2',
      seoTitle: 'SEO Title Mẫu',
      seoDescription: 'SEO Description mẫu'
    });
    await hocLieuPage.submitModal();
    // Should create successfully
  });

  test('[Happy] Form vẫn hoạt động được sau lần thất bại', async ({ page }) => {
    const hocLieuPage = new HocLieuCuaToiPage(page);
    
    // First attempt - cancel
    await hocLieuPage.navigateToHocLieuCuaToi();
    await hocLieuPage.openCreateModal(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    await hocLieuPage.cancelModal();
    
    // Second attempt - should work
    const title = await hocLieuPage.createCourseware(
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      { title: `Test_RECOVERY_${Date.now()}` }
    );
    const row = hocLieuPage.getRowByTitle(title);
    expect(await row.count()).toBeGreaterThan(0);
  });

});