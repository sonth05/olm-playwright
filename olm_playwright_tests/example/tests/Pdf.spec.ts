import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { PdfPage } from '../page/Materialpages';

/**
 * 6. Học liệu PDF - TC-PDF-01..08.
 * Quy tắc quan trọng: tệp đề bài là BẮT BUỘC để lưu; khu vực xử lý đáp án chỉ hiện
 * sau khi đã có tệp đề bài.
 */
const HOC_LIEU_URL_NEW = '/chu-de/hoc-lieu-pdf-demo-moi/quan-ly'; // chưa có tệp đề bài
const HOC_LIEU_URL_EXISTING = '/chu-de/hoc-lieu-pdf-demo/quan-ly'; // đã có sẵn tệp đề bài
const QUESTION_FILE = 'fixtures/files/de-bai-mau.pdf';
const ANSWER_FILE = 'fixtures/files/dap-an-mau.pdf';

test.describe('TC-PDF: Học liệu PDF', () => {
  test('TC-PDF-01: Chuyển tab Đề bài / Đáp án đúng nội dung', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_EXISTING);

    await pdf.openQuestionTab();
    await expect(pdf.questionUpload.root).toBeVisible();

    await pdf.openAnswerTab();
    await expect(pdf.answerUpload.root).toBeVisible();
  });

  test('TC-PDF-02: Tải tệp đề bài, xem trước đúng, đủ điều kiện bật khu vực xử lý đáp án', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_NEW);

    await pdf.openQuestionTab();
    await pdf.questionUpload.uploadFile(QUESTION_FILE);
    await pdf.questionUpload.expectPreviewVisible();
    await pdf.expectAnswerProcessingPanelVisible();
  });

  test('TC-PDF-03: Hiển thị khu vực xử lý đáp án khi mở lại học liệu đã có đề bài', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_EXISTING);

    await pdf.expectAnswerProcessingPanelVisible();
  });

  test('TC-PDF-04: Tải tệp đáp án', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_EXISTING);

    await pdf.openAnswerTab();
    await pdf.answerUpload.uploadFile(ANSWER_FILE);
    await pdf.answerUpload.expectPreviewVisible();
  });

  test('TC-PDF-05: Chỉ cập nhật đúng phần đang thao tác', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_EXISTING);

    await pdf.openAnswerTab();
    await pdf.answerUpload.uploadFile(ANSWER_FILE);
    await pdf.save();
    await pdf.expectSavedSuccessfully();

    await pdf.reloadAndVerify(async () => {
      await pdf.openQuestionTab();
      await pdf.questionUpload.expectPreviewVisible(); // tệp đề bài không bị mất
      await pdf.openAnswerTab();
      await pdf.answerUpload.expectPreviewMatchesFileName('dap-an-mau.pdf');
    });
  });

  test('TC-PDF-06: Chặn lưu khi chưa có tệp đề bài', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_NEW);

    await pdf.expectSaveBlockedWithoutQuestionFile();
  });

  test('TC-PDF-07: Lưu thay đổi khi dữ liệu hợp lệ', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_NEW);

    await pdf.openQuestionTab();
    await pdf.questionUpload.uploadFile(QUESTION_FILE);
    await pdf.save();
    await pdf.expectSavedSuccessfully();
  });

  test('TC-PDF-08: Tải lại sau khi lưu vẫn giữ đúng tệp và trạng thái panel đáp án', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const pdf = new PdfPage(page);
    await pdf.goto(HOC_LIEU_URL_EXISTING);

    await pdf.reloadAndVerify(async () => {
      await pdf.openQuestionTab();
      await pdf.questionUpload.expectPreviewVisible();
      await pdf.expectAnswerProcessingPanelVisible();
    });
  });
});