import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { TheoryPage } from '../page/Theorypage';

/**
 * Nhóm chọn câu hỏi và nguồn học liệu TC-QS-01..12.
 * Dùng Theory làm đại diện (có đủ 3 nguồn: Học liệu này / của tôi / OLM).
 * Với Exam Standard, Exam Mixture V2 - test riêng ở exam-standard.spec.ts / exam-mixture-v2.spec.ts
 * chỉ cần gọi lại QuestionSourceSidebar tương tự, không lặp lại toàn bộ nhóm này.
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-ly-thuyet-demo/quan-ly';

test.describe('TC-QS: Nhóm chọn câu hỏi và nguồn học liệu', () => {
  test('TC-QS-01: Tab Học liệu này hiển thị đúng danh sách câu hỏi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    await theory.sidebar.openThisMaterialTab();
    await expect(theory.sidebar.questionItems().first()).toBeVisible();
  });

  test('TC-QS-02: Tab Học liệu của tôi - duyệt cây và hiển thị câu hỏi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    // TODO: thay tên khóa học/chương/bài/học liệu theo dữ liệu seed thật
    await theory.sidebar.pickFromMyMaterialsTree(
      'Khóa học demo',
      'Chương 1',
      'Bài 1',
      'Học liệu demo'
    );
    await expect(theory.sidebar.questionItems().first()).toBeVisible();
  });

  test('TC-QS-03: Tab Học liệu OLM khi có quyền', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('olmSourceTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    // TODO: thay khối/môn/khóa học/học liệu OLM theo dữ liệu seed thật
    await theory.sidebar.pickFromOlmTree('Lớp 12', 'Toán', 'Khóa học OLM demo', 'Học liệu OLM demo');
    await expect(theory.sidebar.questionItems().first()).toBeVisible();
  });

  test('TC-QS-04: Tab Học liệu OLM khi không có quyền -> bị chặn', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('nonOlmSourceTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    await theory.sidebar.expectOlmSourceBlocked();
  });

  test('TC-QS-05: Thêm 1 câu hỏi vào nội dung', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();

    const before = await theory.countInsertedQuestions();
    await theory.sidebar.addQuestion(0);
    await expect
      .poll(() => theory.countInsertedQuestions())
      .toBe(before + 1);
  });

  test('TC-QS-06: Câu tĩnh chỉ được thêm 1 lần', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();

    // TODO: đảm bảo item index 0 trong dữ liệu seed là câu TĨNH
    await theory.sidebar.addQuestion(0);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.addQuestion(0);

    const items = await theory.editor.locator('[data-testid="question-block"][data-question-mode="static"]').count(); // TODO
    expect(items).toBe(1);
  });

  test('TC-QS-07: Câu động được thêm nhiều lần', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();

    // TODO: đảm bảo item index 1 trong dữ liệu seed là câu ĐỘNG
    await theory.sidebar.addQuestion(1);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.addQuestion(1);

    const items = await theory.editor.locator('[data-testid="question-block"][data-question-mode="dynamic"]').count(); // TODO
    expect(items).toBe(2);
  });

  test('TC-QS-08: Thêm nhiều câu hỏi liên tiếp không lỗi giao diện', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();

    const total = await theory.sidebar.questionItems().count();
    for (let i = 0; i < Math.min(total, 3); i++) {
      await theory.sidebar.addQuestion(i);
    }
    await expect(page.locator('body')).not.toContainText(/lỗi|error/i);
  });

  test('TC-QS-09: Thêm tất cả câu hỏi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();

    const total = await theory.sidebar.questionItems().count();
    await theory.sidebar.addAllQuestions();
    await expect.poll(() => theory.countInsertedQuestions()).toBeGreaterThanOrEqual(total);
  });

  test('TC-QS-10: Tạo mới câu hỏi từ màn soạn', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    await theory.sidebar.createNewQuestion(async () => {
      // TODO: điền form tạo câu hỏi thật (loại câu hỏi, nội dung, đáp án...)
      await page.getByLabel(/Nội dung câu hỏi/i).fill('Câu hỏi test tự động');
    });
    await expect(theory.sidebar.questionItems().last()).toContainText('Câu hỏi test tự động');
  });

  test('TC-QS-11: Import Word', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    // TODO: chuẩn bị file mẫu hợp lệ trong thư mục fixtures/files
    await theory.sidebar.importWord('fixtures/files/de-mau-import.docx');
    await expect(page.locator('body')).not.toContainText(/lỗi|error/i);
  });

  test('TC-QS-12: Tìm ID câu hỏi (nhân sự OLM)', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('olmStaff');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    // TODO: thay bằng ID câu hỏi có thật trên môi trường test
    await theory.sidebar.searchQuestionById('123456');
    await expect(theory.sidebar.questionItems().first()).toBeVisible();
  });

  test('TC-QS-12b: GV thường không thấy ô tìm ID câu hỏi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.activateInsertQuestionContext();

    await theory.sidebar.expectSearchByIdNotAvailable();
  });
});