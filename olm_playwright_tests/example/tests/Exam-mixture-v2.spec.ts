import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { ExamMixtureV2Page } from '../page/Materialpages';

/**
 * 1. Đề kiểm tra (Exam Mixture V2) - ưu tiên test cao nhất theo đặc tả.
 * Gồm 2 chế độ tạo đề: Chọn câu hỏi từ học liệu / Tạo đề từ ma trận.
 */
const HOC_LIEU_URL = '/chu-de/de-kiem-tra-demo/quan-ly';

test.describe('TC-HIER: Đề kiểm tra (Exam Mixture V2)', () => {
  test('TC-HIER-01: Chuyển đổi giữa 2 chế độ tạo đề, giữ ổn định trạng thái', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);

    await exam.switchToMatrixMode();
    await expect(exam.matrixForm).toBeVisible();

    await exam.switchToQuestionSelectionMode();
    await expect(exam.sidebar.root).toBeVisible();
  });

  test('TC-HIER-02: Thêm câu hỏi từ Học liệu này', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    await exam.sidebar.openThisMaterialTab();
    await exam.sidebar.addQuestion(0);
    await expect(page.locator('body')).not.toContainText(/lỗi|error/i);
  });

  test('TC-HIER-03: Thêm câu hỏi từ Học liệu của tôi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    // TODO: thay theo dữ liệu seed thật
    await exam.sidebar.pickFromMyMaterialsTree('Khóa học demo', 'Chương 1', 'Bài 1', 'Học liệu demo');
    await exam.sidebar.addQuestion(0);
  });

  test('TC-HIER-04: Thêm câu hỏi từ Học liệu OLM khi có quyền', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('olmSourceTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    // TODO: thay theo dữ liệu seed thật
    await exam.sidebar.pickFromOlmTree('Lớp 12', 'Toán', 'Khóa học OLM demo', 'Học liệu OLM demo');
    await exam.sidebar.addQuestion(0);
  });

  test('TC-HIER-05: Không có quyền OLM -> hiển thị màn nâng quyền thay vì danh sách câu hỏi', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('nonOlmSourceTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    await exam.sidebar.expectOlmSourceBlocked();
  });

  test('TC-HIER-06: Tạo mới câu hỏi từ màn soạn', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    await exam.sidebar.createNewQuestion(async () => {
      await page.getByLabel(/Nội dung câu hỏi/i).fill('Câu hỏi mới - Đề kiểm tra');
    });
  });

  test('TC-HIER-07: Import Word', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    await exam.sidebar.importWord('fixtures/files/de-mau-import.docx');
  });

  test('TC-HIER-08: Tìm ID câu hỏi (nhân sự OLM)', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('olmStaff');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);
    await exam.switchToQuestionSelectionMode();

    await exam.sidebar.searchQuestionById('123456');
    await expect(exam.sidebar.questionItems().first()).toBeVisible();
  });

  test('TC-HIER-09: Tạo đề từ ma trận, lưu thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);

    await exam.fillAndSaveMatrix(async () => {
      // TODO: điền cấu hình ma trận thật (số câu theo mức độ, chủ đề...)
      await page.getByLabel(/Tổng số câu/i).fill('20');
    });
    await exam.expectSavedSuccessfully();
  });

  test('TC-HIER-10: Xem trước và lưu đề thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const exam = new ExamMixtureV2Page(page);
    await exam.goto(HOC_LIEU_URL);

    await exam.openPreview();
    await exam.save();
    await exam.expectSavedSuccessfully();
  });
});