import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { EssayPage } from '../page/Materialpages';

/**
 * 5. Học liệu Tự luận (Essay) - TC-ESS-01..07.
 * 2 nhánh nội dung độc lập (Đề bài / Đáp án); quan trọng nhất là TC-ESS-07:
 * dữ liệu 2 phần không được ghi đè nhầm lên nhau.
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-tu-luan-demo/quan-ly';
const QUESTION_FILE = 'fixtures/files/de-bai-mau.pdf';
const ANSWER_FILE = 'fixtures/files/dap-an-mau.pdf';

test.describe('TC-ESS: Học liệu Tự luận (Essay)', () => {
  test('TC-ESS-01: Chuyển tab Đề bài / Đáp án hiển thị đúng nội dung', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    await essay.openQuestionTab();
    await expect(essay.questionEditor).toBeVisible();

    await essay.openAnswerTab();
    await expect(essay.answerEditor).toBeVisible();
  });

  test('TC-ESS-02: Hệ thống hỏi xác nhận lưu khi đổi tab với nội dung chưa lưu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    await essay.openQuestionTab();
    await essay.typeQuestion(`Đề bài chưa lưu ${Date.now()}`);
    await essay.openAnswerTab();

    await essay.expectSaveConfirmOnTabSwitch();
  });

  test('TC-ESS-03: Soạn Đề bài dạng text và lưu đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    const content = `Đề bài ${Date.now()}`;
    await essay.openQuestionTab();
    await essay.typeQuestion(content);
    await essay.save();
    await essay.expectSavedSuccessfully();

    await essay.reloadAndVerify(async () => {
      await essay.openQuestionTab();
      await expect(essay.questionEditor).toContainText(content);
    });
  });

  test('TC-ESS-04: Soạn Đáp án/Hướng dẫn giải dạng text và lưu đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    const content = `Đáp án ${Date.now()}`;
    await essay.openAnswerTab();
    await essay.typeAnswer(content);
    await essay.save();
    await essay.expectSavedSuccessfully();

    await essay.reloadAndVerify(async () => {
      await essay.openAnswerTab();
      await expect(essay.answerEditor).toContainText(content);
    });
  });

  test('TC-ESS-05: Tải tệp cho Đề bài', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    await essay.openQuestionTab();
    await essay.questionUpload.uploadFile(QUESTION_FILE);
    await essay.questionUpload.expectPreviewVisible();
  });

  test('TC-ESS-06: Tải tệp cho Đáp án', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    await essay.openAnswerTab();
    await essay.answerUpload.uploadFile(ANSWER_FILE);
    await essay.answerUpload.expectPreviewVisible();
  });

  test('TC-ESS-07: Dữ liệu Đề bài và Đáp án không ghi đè nhầm lên nhau', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const essay = new EssayPage(page);
    await essay.goto(HOC_LIEU_URL);

    const questionContent = `Đề bài độc lập ${Date.now()}`;
    const answerContent = `Đáp án độc lập ${Date.now()}`;

    await essay.openQuestionTab();
    await essay.typeQuestion(questionContent);
    await essay.save();

    await essay.openAnswerTab();
    await essay.typeAnswer(answerContent);
    await essay.save();
    await essay.expectSavedSuccessfully();

    await essay.reloadAndVerify(async () => {
      await essay.openQuestionTab();
      await expect(essay.questionEditor).toContainText(questionContent);
      await essay.openAnswerTab();
      await expect(essay.answerEditor).toContainText(answerContent);
    });
  });
});