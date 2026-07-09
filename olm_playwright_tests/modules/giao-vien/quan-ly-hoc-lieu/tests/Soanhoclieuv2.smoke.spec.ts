// modules/quan-ly-hoc-lieu/tests/SoanHocLieuV2.smoke.spec.ts
import path from 'path';
import { test, expect } from '../../../../core/fixtures/role.fixture';
import { HocLieuCuaToiPage, CoursewareType } from '../pages/HocLieuCuaToiPage';
import {
  SoanHocLieuV2Page,
  QuestionSourceTab,
  ExamMixtureMode,
} from '../pages/Soanhoclieuv2page';

/**
 * Tệp mẫu dùng cho các test upload (PDF/Word/tài liệu...). Đặt file thật vào
 * modules/giao-vien/quan-ly-hoc-lieu/fixtures/ trước khi chạy — thư mục này
 * KHÔNG phải core/fixtures (nơi chứa Playwright test fixtures .ts) mà là nơi
 * lưu tài nguyên nhị phân (asset) riêng cho module, theo đúng cách
 * HocLieuCuaToiPage.uploadExamFile() đã ghi chú.
 */
const FIXTURE_PATH = (fileName: string): string =>
  path.resolve(__dirname, '../fixtures', fileName);


/**
 * Smoke test — Soạn học liệu V2.
 * Chạy nhanh trên các luồng "must-work" quan trọng nhất của từng loại học liệu
 * và khối chức năng dùng chung. Không đi sâu vào các case phân quyền/lỗi
 * (xem SoanHocLieuV2.regression.spec.ts).
 *
 * Lưu ý: các test giả định tài khoản chạy test có sẵn quyền sửa học liệu và
 * môi trường test đã bật whitelist V2 cho các loại học liệu bên dưới
 * (xem Constants.php — mục "Lưu ý cho tester" trong tài liệu test case gốc).
 */
test.describe('Soạn học liệu V2 @hoc_lieu @soan_v2 @smoke', () => {
  // ========== KHỐI CHỨC NĂNG DÙNG CHUNG ==========

  test('[Happy] TC-COM-01: Mở màn soạn học liệu V2 thành công', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Smoke_V2_Open_${Date.now()}`,
    });
    const row = listPage.getRowByTitle(title);
    await row.click();
    await soanPage.expectOpenedSuccessfully();
  });

  test('[Happy] TC-COM-04/05: Lưu thay đổi và giữ nguyên sau khi tải lại', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Smoke_V2_Save_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.typeInEditor('Nội dung lý thuyết kiểm tra smoke test');
    await soanPage.save();
    await soanPage.expectSaveSuccess();

    await soanPage.reload();
    await expect(page.locator(SoanHocLieuV2Page.EDITOR_CONTENT)).toContainText(
      'Nội dung lý thuyết kiểm tra smoke test'
    );
  });

  test('[Happy] TC-COM-06: Xem trước học liệu hiển thị', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Smoke_V2_Preview_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.openPreview();
    await expect(soanPage.getPreviewPanel()).toBeVisible();
  });

  test('[Happy] TC-QS-05: Thêm 1 câu hỏi từ sidebar vào nội dung', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Smoke_V2_QS_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);
    await soanPage.addQuestionFromSidebar(0);
    // Câu hỏi phải được đưa vào nội dung mà không lỗi giao diện
    await expect(soanPage.getSidebarQuestionItems().first()).toBeVisible();
  });

  test('[Happy] TC-FILE-01/02: Tải tệp lên và xem trước cho học liệu Tài liệu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Smoke_V2_Document_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.uploadMainDocument(FIXTURE_PATH('sample-document.pdf'));
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  // ========== THEO TỪNG LOẠI HỌC LIỆU (mục 8) ==========

  test('[Happy] 8.1 Theory: Soạn nội dung lý thuyết bằng editor và lưu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Smoke_Theory_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.switchToEditorMode();
    await soanPage.typeInEditor('Bài học lý thuyết smoke test');
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] 8.2 Video: Tạo học liệu video từ liên kết Youtube', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG, {
      title: `Smoke_Video_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.enterYoutubeLink(
      'https://www.youtube.com/watch?v=eHwesHMnr2o&list=RDeHwesHMnr2o&start_radio=1'
    );
    await soanPage.expectVideoPlayable();
    await soanPage.addStopPoint(30);
    await expect(soanPage.getStopPoints()).toHaveCount(1);
  });

  test('[Happy] 8.3 Essay: Soạn đề bài và đáp án ở 2 tab riêng', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TU_LUAN, {
      title: `Smoke_Essay_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.switchEssayTab('de-bai');
    await soanPage.typeInEditor('Đề bài tự luận smoke test');
    await soanPage.save();

    await soanPage.switchEssayTab('dap-an');
    await soanPage.typeInEditor('Đáp án/hướng dẫn giải smoke test');
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] 8.4 PDF: Tải tệp đề bài để mở khu vực xử lý đáp án', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TN_TU_FILE, {
      title: `Smoke_PDF_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.uploadPdfPart(FIXTURE_PATH('sample-exam.pdf'), 'de-bai');
    expect(await soanPage.isAnswerProcessingAreaVisible()).toBeTruthy();
  });

  test('[Happy] 8.5 Link: Nhập liên kết hợp lệ và lưu thành công', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LIEN_KET, {
      title: `Smoke_Link_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.enterLinkUrl('https://olm.vn/chu-de/tao-khoa-hoc-va-cac-hoc-lieu-ca-nhan-498305');
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] 8.6 Document: Tải tài liệu chính và xem trước', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Smoke_Doc_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.uploadMainDocument(FIXTURE_PATH('sample-document.pdf'));
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  test('[Happy] 8.7 Exam Standard: Chọn câu hỏi từ học liệu và lưu đề', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DANG_BAI_KY_NANG_NHCH, {
      title: `Smoke_ExamStandard_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.expectMatrixModeNotAvailable();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_CUA_TOI);
    await soanPage.addQuestionFromSidebar(0);
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] 8.8 Exam Mixture V2: Chuyển giữa 2 chế độ chọn câu hỏi / ma trận', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TN_TU_MA_TRAN, {
      title: `Smoke_ExamMixture_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.switchExamMixtureMode(ExamMixtureMode.TAO_DE_TU_MA_TRAN);
    await expect(page.locator(SoanHocLieuV2Page.MATRIX_CONFIG_AREA)).toBeVisible();

    await soanPage.switchExamMixtureMode(ExamMixtureMode.CHON_CAU_HOI);
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_CUA_TOI);
  });

  test('[Happy] 8.9 Exam Mix: Import Word và trộn đề offline', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TRON_OFFLINE, {
      title: `Smoke_ExamMix_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.importFromWord(FIXTURE_PATH('sample-questions.docx'));
    await soanPage.shuffleExam();
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });
});