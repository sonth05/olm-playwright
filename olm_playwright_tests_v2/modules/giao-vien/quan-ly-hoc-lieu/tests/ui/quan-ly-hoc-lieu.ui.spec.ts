import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { QuanLyHocLieuPage } from '../../pages/QuanLyHocLieuPage';
import { HOC_LIEU_TYPE } from '../../pages/Createhoclieumenu';
import {
  NhchManagePage,
  TheoryManagePage,
  VideoManagePage,
  EssayManagePage,
  LinkManagePage,
  PdfManagePage,
} from '../../pages/HocLieuTypeManagePages';

test.describe('Quản lý học liệu - Kiểm tra giao diện (UI) [OLM] @v2role_editableTeacher', () => {

  test('Đề kiểm tra (EXAM_MIXTURE_V2): đầy đủ thành phần trang quản lý học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const hocLieuPage = await QuanLyHocLieuPage.createNewExam(page, {
      title: `Đề kiểm tra UI test ${Date.now()}`,
      grade: /Lớp 10/i,
      subject: /Toán/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, người tạo', async () => {
      // FIX: bản trước không kiểm tra header vì `titleInput` trỏ nhầm vào ô
      // "Tuần" — nay tách đúng titleText/gradeBadge/subjectBadge/statusBadge.
      await expect.soft(hocLieuPage.gradeBadge).toBeVisible();
      await expect.soft(hocLieuPage.subjectBadge).toBeVisible();
      await expect.soft(hocLieuPage.titleText).toContainText('Đề kiểm tra UI test');
      await expect.soft(hocLieuPage.editTitleButton).toBeVisible();
      await expect.soft(hocLieuPage.statusBadge).toBeVisible();
      await expect.soft(hocLieuPage.materialTypeLabel).toBeVisible();
      await expect.soft(hocLieuPage.creatorName).toBeVisible();
    });

    await test.step('Nút hành động chính ở header: SEO, Chia sẻ, Xuất bản', async () => {
      await expect.soft(hocLieuPage.seoButton).toBeVisible();
      await expect.soft(hocLieuPage.shareButton).toBeVisible();
      await expect.soft(hocLieuPage.publishButton).toBeVisible();
      await expect.soft(hocLieuPage.publishHintText).toBeVisible();
    });

    await test.step('Hàng liên kết phụ: Danh sách bài làm, Trộn đề, Thống kê, Thiết lập nâng cao, Xem nội dung', async () => {
      await expect.soft(hocLieuPage.submissionListLink).toBeVisible();
      await expect.soft(hocLieuPage.shuffleExamLink).toBeVisible();
      await expect.soft(hocLieuPage.statsLink).toBeVisible();
      await expect.soft(hocLieuPage.advancedSettingButton).toBeVisible();
      await expect.soft(hocLieuPage.moreActionsButton).toBeVisible();
      await expect.soft(hocLieuPage.viewContentLink).toBeVisible();
    });

    await test.step('Khối Tuần / KCT / Quy tắc viết nội dung', async () => {
      await expect.soft(hocLieuPage.weeksInput).toBeVisible();
      await expect.soft(hocLieuPage.kctButton).toBeVisible();
      await expect.soft(hocLieuPage.contentRulesButton).toBeVisible();
    });

    await test.step('Tiêu đề và tab chế độ nội dung học liệu', async () => {
      await expect.soft(hocLieuPage.contentHeading).toBeVisible();
      await expect.soft(hocLieuPage.tabChooseQuestions).toBeVisible();
      await expect.soft(hocLieuPage.tabMatrixQuestions).toBeVisible();
      // Mặc định DOM mở sẵn tab "Chọn câu hỏi từ học liệu" (aria-checked=true)
      await expect.soft(hocLieuPage.tabChooseQuestions).toHaveAttribute('aria-checked', 'true');
      await expect.soft(hocLieuPage.tabMatrixQuestions).toHaveAttribute('aria-checked', 'false');
    });

    await test.step('Thanh công cụ tìm kiếm và nguồn câu hỏi bên trái', async () => {
      await expect.soft(hocLieuPage.searchQuestionInput).toBeVisible();
      await expect.soft(hocLieuPage.tabThisCourse).toBeVisible();
      await expect.soft(hocLieuPage.tabMyCourses).toBeVisible();
      await expect.soft(hocLieuPage.tabOlmCourses).toBeVisible();
      await expect.soft(hocLieuPage.createQuestionButton).toBeVisible();
      await expect.soft(hocLieuPage.importFileButton).toBeVisible();
      // Học liệu vừa tạo mới nên chưa có câu hỏi nào
      await expect.soft(hocLieuPage.questionListEmptyState).toBeVisible();
    });

    await test.step('Thanh tổng điểm và cách tính điểm ở cột phải', async () => {
      // FIX: bản trước tìm `<select>` — DOM thật là Radix button[role="combobox"]
      await expect.soft(hocLieuPage.totalScoreBadge).toBeVisible();
      await expect.soft(hocLieuPage.totalScoreBadge).toHaveText(/Tổng toàn bài: 0đ/);
      await expect.soft(hocLieuPage.scoringMethodSelect).toBeVisible();
      await expect.soft(hocLieuPage.scoringMethodSelect).toHaveText('Tính theo BGD');
    });

    await test.step('Toolbar soạn thảo đề bên phải', async () => {
      // FIX: bổ sung các nút toolbar bản trước bỏ sót (Undo/Redo/Xóa định
      // dạng/Thoát vùng chọn/Phóng to/Sửa HTML/Gỡ tất cả), không chỉ 2 nút
      // "Thêm phần thi"/"Thêm chú giải, chú thích".
      await expect.soft(hocLieuPage.undoButton).toBeVisible();
      await expect.soft(hocLieuPage.undoButton).toBeDisabled();
      await expect.soft(hocLieuPage.redoButton).toBeVisible();
      await expect.soft(hocLieuPage.redoButton).toBeDisabled();
      await expect.soft(hocLieuPage.clearFormatButton).toBeVisible();
      await expect.soft(hocLieuPage.exitSelectionButton).toBeVisible();
      await expect.soft(hocLieuPage.fullscreenButton).toBeVisible();
      await expect.soft(hocLieuPage.editHtmlButton).toBeVisible();
      await expect.soft(hocLieuPage.addSectionButton).toBeVisible();
      await expect.soft(hocLieuPage.addNoteButton).toBeVisible();
      await expect.soft(hocLieuPage.removeAllButton).toBeVisible();
      await expect.soft(hocLieuPage.removeAllButton).toBeDisabled();
      await expect.soft(hocLieuPage.saveChangeButton).toBeVisible();
    });

    await test.step('Placeholder soạn thảo khi vùng nội dung còn trống', async () => {
      // FIX: bản trước dùng `div:has-text(placeholder)` (vỡ strict mode) cho cả
      // container lẫn placeholder — nay tách rõ editorTextbox/editorPlaceholder.
      await expect.soft(hocLieuPage.editorTextbox).toBeVisible();
      await expect.soft(hocLieuPage.editorPlaceholder).toHaveText(
        'Soạn nội dung cấu trúc đề thi chuẩn mới của Bộ ở đây',
      );
    });
  });

  // ─── 2/13: Dạng bài, kĩ năng (NHCH) ─────────────────────────────────────
  test('NHCH (Dạng bài, kĩ năng): đầy đủ thành phần trang quản lý học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const title = `NHCH UI test ${Date.now()}`;
    const nhchPage = await NhchManagePage.createNew(page, {
      title,
      grade: /Lớp 1/i,
      subject: /Tiếng Nga/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, người tạo', async () => {
      await expect.soft(nhchPage.gradeBadge).toBeVisible();
      await expect.soft(nhchPage.subjectBadge).toBeVisible();
      await expect.soft(nhchPage.titleText).toContainText('NHCH UI test');
      await expect.soft(nhchPage.statusBadge).toBeVisible();
      await expect.soft(nhchPage.materialTypeLabel).toBeVisible();
      await expect.soft(nhchPage.creatorName).toBeVisible();
    });

    await test.step('Nút hành động chính ở header: SEO, Chia sẻ, Xuất bản', async () => {
      await expect.soft(nhchPage.seoButton).toBeVisible();
      await expect.soft(nhchPage.shareButton).toBeVisible();
      await expect.soft(nhchPage.publishButton).toBeVisible();
    });

    await test.step('Switch "Cho phép làm như đề thi" — riêng của NHCH, mặc định TẮT', async () => {
      await expect.soft(nhchPage.allowAsExamLabel).toBeVisible();
      await expect.soft(nhchPage.allowAsExamSwitch).toHaveAttribute('aria-checked', 'false');
      await expect.soft(nhchPage.allowAsExamInfoButton).toBeVisible();
    });

    await test.step('Khối KCT / Quy tắc viết nội dung (KHÔNG có ô "Tuần" như Đề kiểm tra)', async () => {
      await expect.soft(nhchPage.kctButton).toBeVisible();
      await expect.soft(nhchPage.contentRulesButton).toBeVisible();
    });

    await test.step('Nội dung học liệu: tải bài / xem trước / lưu thay đổi', async () => {
      await expect.soft(nhchPage.contentHeading).toBeVisible();
      await expect.soft(nhchPage.previewButton).toBeVisible();
      await expect.soft(nhchPage.saveChangeButton).toBeVisible();
    });

    await test.step('Cột trái: tìm kiếm & nguồn câu hỏi (dùng chung với Đề kiểm tra)', async () => {
      await expect.soft(nhchPage.searchQuestionInput).toBeVisible();
      await expect.soft(nhchPage.tabThisCourse).toBeVisible();
      await expect.soft(nhchPage.tabMyCourses).toBeVisible();
      await expect.soft(nhchPage.tabOlmCourses).toBeVisible();
      await expect.soft(nhchPage.createQuestionButton).toBeVisible();
      await expect.soft(nhchPage.importFileButton).toBeVisible();
      await expect.soft(nhchPage.questionListEmptyState).toBeVisible();
    });

    await test.step('Cột phải: trạng thái rỗng "Chưa thêm câu hỏi" khi chưa chọn từ kho', async () => {
      await expect.soft(nhchPage.emptyContentHeading).toBeVisible();
      await expect.soft(nhchPage.emptyContentSubtext).toBeVisible();
    });
  });

  // ─── 3/13: Lý thuyết tương tác ──────────────────────────────────────────
  test('THEORY (Lý thuyết tương tác): đầy đủ thành phần trang quản lý học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const title = `Lý thuyết UI test ${Date.now()}`;
    const theoryPage = await TheoryManagePage.createNew(page, {
      title,
      grade: /Lớp 1/i,
      subject: /Môn tự chọn song ngữ/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, người tạo', async () => {
      await expect.soft(theoryPage.gradeBadge).toBeVisible();
      await expect.soft(theoryPage.subjectBadge).toBeVisible();
      await expect.soft(theoryPage.titleText).toContainText('Lý thuyết UI test');
      await expect.soft(theoryPage.statusBadge).toBeVisible();
      await expect.soft(theoryPage.materialTypeLabel).toBeVisible();
      await expect.soft(theoryPage.creatorName).toBeVisible();
    });

    await test.step('Hàng liên kết phụ: KHÔNG có "Trộn đề", CÓ "Sao chép link học liệu"', async () => {
      await expect.soft(theoryPage.submissionListLink).toBeVisible();
      await expect.soft(theoryPage.statsLink).toBeVisible();
      await expect.soft(theoryPage.advancedSettingButton).toBeVisible();
      await expect.soft(theoryPage.copyLinkButton).toBeVisible();
      await expect.soft(theoryPage.moreActionsButton).toBeVisible();
      await expect.soft(theoryPage.viewContentLink).toBeVisible();
    });

    await test.step('Chế độ soạn nội dung: Soạn thảo nội dung / Tải lên tệp PDF, Word, PPT', async () => {
      await expect.soft(theoryPage.modeComposeContent).toBeVisible();
      await expect.soft(theoryPage.modeComposeContent).toHaveAttribute('aria-checked', 'true');
      await expect.soft(theoryPage.modeUploadFile).toHaveAttribute('aria-checked', 'false');
      await expect.soft(theoryPage.previewButton).toBeVisible();
      await expect.soft(theoryPage.saveChangeButton).toBeVisible();
    });

    await test.step('Editor song ngữ: toggle layout Tab/2 bên, tab Bản gốc/Song ngữ, placeholder', async () => {
      await expect.soft(theoryPage.layoutToggleTab).toBeVisible();
      await expect.soft(theoryPage.layoutToggle2Ben).toBeVisible();
      await expect.soft(theoryPage.paneTabOriginal).toBeVisible();
      await expect.soft(theoryPage.paneTabOriginal).toHaveAttribute('aria-selected', 'true');
      await expect.soft(theoryPage.paneTabBilingual).toBeVisible();
      await expect.soft(theoryPage.editorTextbox).toBeVisible();
      await expect.soft(theoryPage.editorPlaceholder).toHaveText('Soạn bài giảng lý thuyết ở đây');
    });
  });

  // ─── 4/13: Video Youtube có điểm dừng ───────────────────────────────────
  test('VIDEO (Video Youtube có điểm dừng): đầy đủ thành phần trang quản lý học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const title = `Video UI test ${Date.now()}`;
    const videoPage = await VideoManagePage.createNew(page, {
      title,
      grade: /Lớp 3/i,
      subject: /Tiếng Nga/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, người tạo', async () => {
      await expect.soft(videoPage.gradeBadge).toBeVisible();
      await expect.soft(videoPage.subjectBadge).toBeVisible();
      await expect.soft(videoPage.titleText).toContainText('Video UI test');
      await expect.soft(videoPage.materialTypeLabel).toBeVisible();
      await expect.soft(videoPage.creatorName).toBeVisible();
    });

    await test.step('Hàng liên kết phụ: KHÔNG có "Trộn đề", CÓ "Sao chép link học liệu"', async () => {
      await expect.soft(videoPage.submissionListLink).toBeVisible();
      await expect.soft(videoPage.statsLink).toBeVisible();
      await expect.soft(videoPage.copyLinkButton).toBeVisible();
      await expect.soft(videoPage.viewContentLink).toBeVisible();
    });

    await test.step('Khối "Tạo học liệu video": Youtube URL, upload video bắt buộc, nút Lưu bị vô hiệu hoá', async () => {
      await expect.soft(videoPage.createVideoHeading).toBeVisible();
      await expect.soft(videoPage.guideLink).toBeVisible();
      await expect.soft(videoPage.youtubeUrlInput).toBeVisible();
      await expect.soft(videoPage.videoRequiredBadge).toBeVisible();
      await expect.soft(videoPage.chooseVideoFileButton).toBeVisible();
      // Chưa có video nào được tải lên -> nút Lưu thay đổi bị vô hiệu hoá
      await expect.soft(videoPage.saveChangeButton).toBeDisabled();
    });

    await test.step('3 tab: Bài giảng đính kèm / Tóm tắt bài giảng / Tạo transcript (Tự động)', async () => {
      await expect.soft(videoPage.tabAttachedLecture).toBeVisible();
      await expect.soft(videoPage.tabAttachedLecture).toHaveAttribute('aria-selected', 'true');
      await expect.soft(videoPage.tabSummary).toBeVisible();
      await expect.soft(videoPage.tabAutoTranscript).toBeVisible();
      await expect.soft(videoPage.attachmentUploadLabel).toBeVisible();
      await expect.soft(videoPage.chooseAttachmentFileButton).toBeVisible();
    });
  });

  // ─── 5/13: Đề thi Tự luận ────────────────────────────────────────────────
  test('ESSAY (Đề thi Tự luận): đầy đủ thành phần trang quản lý học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const title = `Tự luận UI test ${Date.now()}`;
    const essayPage = await EssayManagePage.createNew(page, {
      title,
      grade: /Mẫu giáo/i,
      subject: /Giáo dục lối sống/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, người tạo', async () => {
      await expect.soft(essayPage.gradeBadge).toBeVisible();
      await expect.soft(essayPage.subjectBadge).toBeVisible();
      await expect.soft(essayPage.titleText).toContainText('Tự luận UI test');
      await expect.soft(essayPage.materialTypeLabel).toBeVisible();
      await expect.soft(essayPage.creatorName).toBeVisible();
    });

    await test.step('Hàng liên kết phụ: KHÔNG có "Trộn đề" lẫn "Sao chép link học liệu"', async () => {
      await expect.soft(essayPage.submissionListLink).toBeVisible();
      await expect.soft(essayPage.statsLink).toBeVisible();
      await expect.soft(essayPage.advancedSettingButton).toBeVisible();
      await expect.soft(essayPage.moreActionsButton).toBeVisible();
      await expect.soft(essayPage.viewContentLink).toBeVisible();
    });

    await test.step('Tab "Đề bài" / "Đáp án/Hướng dẫn giải" — mặc định ở tab Đề bài', async () => {
      await expect.soft(essayPage.tabQuestion).toBeVisible();
      await expect.soft(essayPage.tabQuestion).toHaveAttribute('aria-selected', 'true');
      await expect.soft(essayPage.tabAnswer).toBeVisible();
      await expect.soft(essayPage.tabAnswer).toHaveAttribute('aria-selected', 'false');
      await expect.soft(essayPage.saveChangeButtonHeader).toBeVisible();
    });

    await test.step('Chế độ soạn + vùng soạn "Đề bài" hiển thị, "Đáp án" chưa hiển thị', async () => {
      await expect.soft(essayPage.modeComposeContent).toBeVisible();
      await expect.soft(essayPage.modeComposeContent).toHaveAttribute('aria-checked', 'true');
      await expect.soft(essayPage.previewButton).toBeVisible();
      await expect.soft(essayPage.questionEditorTextbox).toBeVisible();
      await expect.soft(essayPage.answerEditorTextbox).toBeHidden();
    });
  });

  // ─── 6/13: Liên kết ──────────────────────────────────────────────────────
  test('LINK (Liên kết): đầy đủ thành phần trang quản lý học liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const title = `Liên kết UI test ${Date.now()}`;
    const linkPage = await LinkManagePage.createNew(page, {
      title,
      grade: /Mẫu giáo/i,
      subject: /Khoa học và xã hội/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, loại học liệu chưa xác định', async () => {
      await expect.soft(linkPage.gradeBadge).toBeVisible();
      await expect.soft(linkPage.subjectBadge).toBeVisible();
      await expect.soft(linkPage.titleText).toContainText('Liên kết UI test');
      // "Liên kết" tạo mới chưa gắn loại học liệu cụ thể -> hiển thị "Chưa xác định"
      await expect.soft(linkPage.undefinedTypeLabel).toBeVisible();
      await expect.soft(linkPage.creatorName).toBeVisible();
    });

    await test.step('Hàng liên kết phụ: KHÔNG có "Trộn đề", CÓ "Sao chép link học liệu"', async () => {
      await expect.soft(linkPage.submissionListLink).toBeVisible();
      await expect.soft(linkPage.statsLink).toBeVisible();
      await expect.soft(linkPage.copyLinkButton).toBeVisible();
      await expect.soft(linkPage.viewContentLink).toBeVisible();
    });

    await test.step('Khối "Đường dẫn liên kết": alert hướng dẫn, ô nhập URL, nút Lưu bị vô hiệu hoá', async () => {
      await expect.soft(linkPage.contentHeading).toBeVisible();
      await expect.soft(linkPage.infoAlertText).toBeVisible();
      await expect.soft(linkPage.urlInput).toBeVisible();
      // Chưa nhập URL nào -> nút Lưu thay đổi bị vô hiệu hoá
      await expect.soft(linkPage.saveChangeButton).toBeDisabled();
    });
  });

  // ─── 7/13: Đề thi trắc nghiệm từ file PDF hoặc Word ─────────────────────
  test('PDF (Đề thi trắc nghiệm từ file PDF hoặc Word): đầy đủ thành phần trang quản lý học liệu', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const title = `PDF UI test ${Date.now()}`;
    const pdfPage = await PdfManagePage.createNew(page, {
      title,
      grade: /Lớp 1/i,
      subject: /Toán/i,
    });

    await test.step('Header: badge Lớp/Môn, tiêu đề, trạng thái, người tạo', async () => {
      await expect.soft(pdfPage.gradeBadge).toBeVisible();
      await expect.soft(pdfPage.subjectBadge).toBeVisible();
      await expect.soft(pdfPage.titleText).toContainText('PDF UI test');
      await expect.soft(pdfPage.materialTypeLabel).toBeVisible();
      await expect.soft(pdfPage.creatorName).toBeVisible();
    });

    await test.step('Hàng liên kết phụ: KHÔNG có "Trộn đề" lẫn "Sao chép link học liệu"', async () => {
      await expect.soft(pdfPage.submissionListLink).toBeVisible();
      await expect.soft(pdfPage.statsLink).toBeVisible();
      await expect.soft(pdfPage.advancedSettingButton).toBeVisible();
      await expect.soft(pdfPage.moreActionsButton).toBeVisible();
      await expect.soft(pdfPage.viewContentLink).toBeVisible();
    });

    await test.step('Khối Tuần / KCT / Quy tắc viết nội dung (CÓ ô "Tuần", giống Đề kiểm tra)', async () => {
      await expect.soft(pdfPage.weeksInput).toBeVisible();
      await expect.soft(pdfPage.kctButton).toBeVisible();
      await expect.soft(pdfPage.contentRulesButton).toBeVisible();
    });

    await test.step('Tab "Đề bài" / "Đáp án/Hướng dẫn giải" và vùng kéo-thả tệp', async () => {
      await expect.soft(pdfPage.tabQuestion).toBeVisible();
      await expect.soft(pdfPage.tabAnswer).toBeVisible();
      await expect.soft(pdfPage.saveChangeButton).toBeVisible();
      await expect.soft(pdfPage.dropzoneHeading.first()).toBeVisible();
      await expect.soft(pdfPage.dropzoneFormatHint.first()).toBeVisible();
      await expect.soft(pdfPage.dropzoneSizeHint.first()).toBeVisible();
      await expect.soft(pdfPage.chooseFileFromDeviceButton).toBeVisible();
    });
  });

  // ─── 8-13/13: 6 loại học liệu còn lại — SCAFFOLDING chờ DOM thật ────────
  // QuanLyHocLieuPage hiện tại (toolbar soạn đề, tab Chọn câu hỏi/Ma trận,
  // thanh tổng điểm...) là DOM RIÊNG của trang quản lý "Đề kiểm tra" — không
  // thể tái dùng nguyên trạng cho các loại còn lại vì nội dung trang quản lý
  // khác nhau theo từng loại (VD "Tài liệu" nhiều khả năng có khối upload
  // file, "Mô phỏng, thí nghiệm ảo" có khối nhúng/preview riêng...).
  // `QuanLyHocLieuPage.createNewMaterial(page, type, options)` đã được viết
  // SẴN dùng chung được cho mọi loại (xem pages/QuanLyHocLieuPage.ts) — khi
  // có DOM thật của từng trang quản lý, thay nội dung `test.fixme` bên dưới
  // bằng 1 ca test gộp test.step() cho từng loại, đúng theo cấu trúc ca
  // "Đề kiểm tra"/NHCH/THEORY/VIDEO/ESSAY/LINK/PDF ở trên (mỗi loại vẫn giữ
  // đúng 1 ca test/1 dạng học liệu). Có thể cần page object riêng trong
  // HocLieuTypeManagePages.ts nếu DOM khác biệt quá nhiều so với các loại
  // đã có.
  const PENDING_DOM_MATERIAL_TYPES = [
    { key: 'EXAM_STANDARD_MATRIX', value: HOC_LIEU_TYPE.EXAM_STANDARD_MATRIX, label: 'Đề thi trắc nghiệm từ ma trận' },
    { key: 'EXAM_MIX', value: HOC_LIEU_TYPE.EXAM_MIX, label: 'Đề thi trộn Offline' },
    { key: 'PRACTICE_MATRIX', value: HOC_LIEU_TYPE.PRACTICE_MATRIX, label: 'Đề luyện tập trắc nghiệm từ ma trận' },
    { key: 'DOCUMENT', value: HOC_LIEU_TYPE.DOCUMENT, label: 'Tài liệu' },
    { key: 'SIMULATION', value: HOC_LIEU_TYPE.SIMULATION, label: 'Mô phỏng, thí nghiệm ảo' },
    { key: 'GAME', value: HOC_LIEU_TYPE.GAME, label: 'Game hóa' },
  ] as const;

  for (const type of PENDING_DOM_MATERIAL_TYPES) {
    test.fixme(
      `${type.key} (${type.label}): đầy đủ thành phần trang quản lý học liệu — chưa có DOM thật`,
      async () => {
        // TODO: khi có DOM, thay nội dung test này bằng các assertion đúng
        // theo trang quản lý thật của "${type.label}", gộp theo test.step()
        // cho từng nhóm thành phần (header, khối nội dung chính, v.v...) —
        // dùng QuanLyHocLieuPage.createNewMaterial(page, HOC_LIEU_TYPE.${type.key}, {...})
        // (hoặc page object riêng nếu DOM khác biệt quá nhiều so với Đề kiểm
        // tra) để tạo dữ liệu, tương tự ca "Đề kiểm tra" ở trên.
      },
    );
  }
});