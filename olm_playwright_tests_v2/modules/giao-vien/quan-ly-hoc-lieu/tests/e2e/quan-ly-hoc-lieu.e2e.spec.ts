import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { QuanLyHocLieuPage } from '../../pages/QuanLyHocLieuPage';
import {
  NhchManagePage,
  TheoryManagePage,
  VideoManagePage,
  EssayManagePage,
  LinkManagePage,
  PdfManagePage,
} from '../../pages/HocLieuTypeManagePages';

// FIX: trước đây beforeEach page.goto() thẳng tới 1 URL học liệu có sẵn —
// nay tạo MỚI 1 "Đề kiểm tra" qua đúng luồng modal "Tạo mới học liệu" (như
// De-kiem-tra-modal.*.spec.ts), rồi test ngay trên trang "Quản lý học liệu"
// mà app tự điều hướng tới sau khi bấm "Tạo" — không dùng URL cố định nữa.
test.describe('Quản lý học liệu - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  let hocLieuPage: QuanLyHocLieuPage;

  test.beforeEach(async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    hocLieuPage = await QuanLyHocLieuPage.createNewExam(page, {
      title: `Đề kiểm tra function test ${Date.now()}`,
      grade: /Lớp 10/i,
      subject: /Toán/i,
    });
  });

  test('Chức năng tìm kiếm câu hỏi theo ID trong kho', async () => {
    await hocLieuPage.searchQuestionById('12345');
    await expect(hocLieuPage.searchQuestionInput).toHaveValue('12345');
  });

  test('Chức năng chuyển đổi tab nguồn câu hỏi (Học liệu này / của tôi / OLM)', async () => {
    await hocLieuPage.tabMyCourses.click();
    await expect(hocLieuPage.tabMyCourses).toHaveAttribute('aria-selected', 'true');

    await hocLieuPage.tabOlmCourses.click();
    await expect(hocLieuPage.tabOlmCourses).toHaveAttribute('aria-selected', 'true');

    await hocLieuPage.tabThisCourse.click();
    await expect(hocLieuPage.tabThisCourse).toHaveAttribute('aria-selected', 'true');
  });

  test('Chức năng chuyển đổi chế độ soạn: Chọn câu hỏi từ học liệu / Tạo đề từ ma trận', async () => {
    // FIX: bổ sung — bản trước chỉ có test hiển thị (UI), chưa test thao tác
    // click thực sự chuyển aria-checked, và chưa động tới khối chọn ma trận.
    await hocLieuPage.selectMatrixMode();
    await expect(hocLieuPage.tabMatrixQuestions).toHaveAttribute('aria-checked', 'true');
    await expect(hocLieuPage.tabChooseQuestions).toHaveAttribute('aria-checked', 'false');

    await hocLieuPage.selectChooseQuestionsMode();
    await expect(hocLieuPage.tabChooseQuestions).toHaveAttribute('aria-checked', 'true');
    await expect(hocLieuPage.tabMatrixQuestions).toHaveAttribute('aria-checked', 'false');
  });

  test('Chức năng nhập giá trị "Tuần" hiển thị học liệu', async () => {
    // FIX: bổ sung — trước đây field này bị gán nhầm vào `titleInput` nên
    // chưa có test nào thao tác đúng ô "Tuần".
    await hocLieuPage.fillWeeks('1,2,3');
    await expect(hocLieuPage.weeksInput).toHaveValue('1,2,3');
  });

  test('Chức năng bấm thêm phần thi và chú giải', async () => {
    await hocLieuPage.clickAddSection();
    await hocLieuPage.clickAddNote();
    // Xác nhận giao diện soạn thảo phản hồi thành công
    await expect(hocLieuPage.saveChangeButton).toBeVisible();
  });

  test('Chức năng nhập nội dung vào vùng soạn thảo cấu trúc đề thi', async () => {
    // FIX: bổ sung — trước đây không có locator nào gõ được vào vùng soạn
    // thảo thật (chỉ có selector vỡ strict-mode trỏ vào placeholder).
    await hocLieuPage.typeExamContent('Đề kiểm tra học kỳ 1');
    await expect(hocLieuPage.editorTextbox).toContainText('Đề kiểm tra học kỳ 1');
  });
});

// FIX: bổ sung — 6 loại học liệu khác đã có DOM thật xác nhận (2026-08-12)
// nhưng chưa có ca test tính năng nào. Mỗi loại là 1 test.describe riêng vì
// dữ liệu/beforeEach khác nhau theo loại (không dùng chung QuanLyHocLieuPage).
test.describe('NHCH - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  test('Chức năng bật/tắt switch "Cho phép làm như đề thi"', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const nhchPage = await NhchManagePage.createNew(page, {
      title: `NHCH function test ${Date.now()}`,
      grade: /Lớp 1/i,
      subject: /Tiếng Nga/i,
    });

    await expect(nhchPage.allowAsExamSwitch).toHaveAttribute('aria-checked', 'false');
    await nhchPage.toggleAllowAsExam();
    await expect(nhchPage.allowAsExamSwitch).toHaveAttribute('aria-checked', 'true');
    await nhchPage.toggleAllowAsExam();
    await expect(nhchPage.allowAsExamSwitch).toHaveAttribute('aria-checked', 'false');
  });
});

test.describe('THEORY - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  test('Chức năng nhập nội dung bài giảng và chuyển tab Bản gốc/Song ngữ', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theoryPage = await TheoryManagePage.createNew(page, {
      title: `Lý thuyết function test ${Date.now()}`,
      grade: /Lớp 1/i,
      subject: /Môn tự chọn song ngữ/i,
    });

    await theoryPage.typeTheoryContent('Bài 1: Giới thiệu bảng chữ cái');
    await expect(theoryPage.editorTextbox).toContainText('Bài 1: Giới thiệu bảng chữ cái');

    await theoryPage.switchToBilingualPane();
    await expect(theoryPage.paneTabBilingual).toHaveAttribute('aria-selected', 'true');
    await expect(theoryPage.paneTabOriginal).toHaveAttribute('aria-selected', 'false');
  });
});

test.describe('VIDEO - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  test('Chức năng nhập liên kết Youtube', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const videoPage = await VideoManagePage.createNew(page, {
      title: `Video function test ${Date.now()}`,
      grade: /Lớp 3/i,
      subject: /Tiếng Nga/i,
    });

    await videoPage.fillYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(videoPage.youtubeUrlInput).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('Chức năng chuyển đổi tab Bài giảng đính kèm / Tóm tắt bài giảng / Tạo transcript', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const videoPage = await VideoManagePage.createNew(page, {
      title: `Video function test ${Date.now()}`,
      grade: /Lớp 3/i,
      subject: /Tiếng Nga/i,
    });

    await videoPage.tabSummary.click();
    await expect(videoPage.tabSummary).toHaveAttribute('aria-selected', 'true');

    await videoPage.tabAutoTranscript.click();
    await expect(videoPage.tabAutoTranscript).toHaveAttribute('aria-selected', 'true');

    await videoPage.tabAttachedLecture.click();
    await expect(videoPage.tabAttachedLecture).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('ESSAY - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  test('Chức năng nhập nội dung Đề bài và chuyển sang nhập Đáp án/Hướng dẫn giải', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essayPage = await EssayManagePage.createNew(page, {
      title: `Tự luận function test ${Date.now()}`,
      grade: /Mẫu giáo/i,
      subject: /Giáo dục lối sống/i,
    });

    await essayPage.typeQuestionContent('Em hãy kể về một việc tốt em đã làm.');
    await expect(essayPage.questionEditorTextbox).toContainText('Em hãy kể về một việc tốt em đã làm.');

    await essayPage.typeAnswerContent('Gợi ý: nêu việc làm, vì sao là việc tốt, cảm xúc sau khi làm.');
    await expect(essayPage.tabAnswer).toHaveAttribute('aria-selected', 'true');
    await expect(essayPage.answerEditorTextbox).toContainText(
      'Gợi ý: nêu việc làm, vì sao là việc tốt, cảm xúc sau khi làm.',
    );
  });
});

test.describe('LINK - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  test('Chức năng nhập đường dẫn liên kết', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const linkPage = await LinkManagePage.createNew(page, {
      title: `Liên kết function test ${Date.now()}`,
      grade: /Mẫu giáo/i,
      subject: /Khoa học và xã hội/i,
    });

    await linkPage.fillUrl('https://olm.vn/tin-tuc');
    await expect(linkPage.urlInput).toHaveValue('https://olm.vn/tin-tuc');
  });
});

test.describe('PDF - Kiểm tra tính năng (Function) [OLM] @v2role_editableTeacher', () => {
  test('Chức năng nhập giá trị "Tuần" và chuyển tab Đề bài/Đáp án', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdfPage = await PdfManagePage.createNew(page, {
      title: `PDF function test ${Date.now()}`,
      grade: /Lớp 1/i,
      subject: /Toán/i,
    });

    await pdfPage.weeksInput.fill('1,2');
    await expect(pdfPage.weeksInput).toHaveValue('1,2');

    await pdfPage.switchToAnswerTab();
    await expect(pdfPage.dropzoneHeading.last()).toBeVisible();
  });
});