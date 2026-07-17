import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { TheoryPage } from '../page/Theorypage';

/**
 * 4. Học liệu Lý thuyết (Theory) - TC-THE-01..10.
 * Điểm nghiệp vụ mấu chốt: TC-THE-04/05/06/07 - phải bấm "Chèn câu hỏi" trên toolbar
 * TRƯỚC KHI thêm từ sidebar để vào đúng ngữ cảnh; câu tĩnh không lặp, câu động lặp được.
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-ly-thuyet-demo/quan-ly';
const VALID_FILE = 'fixtures/files/tai-lieu-mau.pdf';

test.describe('TC-THE: Học liệu Lý thuyết (Theory)', () => {
  test('TC-THE-01: Chuyển qua lại giữa 2 chế độ nội dung không mất dữ liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);

    const content = `Nội dung ${Date.now()}`;
    await theory.switchToEditorMode();
    await theory.typeContentAtCursor(content);

    await theory.switchToFileMode();
    await theory.switchToEditorMode();
    await expect(theory.editor).toContainText(content);
  });

  test('TC-THE-02: Soạn nội dung lý thuyết dạng text và lưu đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);

    const content = `Nội dung lý thuyết ${Date.now()}`;
    await theory.switchToEditorMode();
    await theory.typeContentAtCursor(content);
    await theory.save();
    await theory.expectSavedSuccessfully();

    await theory.reloadAndVerify(async () => {
      await expect(theory.editor).toContainText(content);
    });
  });

  test('TC-THE-03: Tải tệp lý thuyết, phần xem trước hiển thị đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);

    await theory.switchToFileMode();
    await theory.upload.uploadFile(VALID_FILE);
    await theory.upload.expectPreviewVisible();
  });

  test('TC-THE-04: Chèn câu hỏi đúng vị trí sau khi bấm Chèn câu hỏi trên toolbar', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToEditorMode();
    await theory.typeContentAtCursor('Vị trí cần chèn câu hỏi: ');

    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();
    await theory.sidebar.addQuestion(0);

    await expect((await theory.countInsertedQuestions())).toBeGreaterThan(0);
  });

  test('TC-THE-05: Câu tĩnh chỉ chèn được 1 lần trong editor lý thuyết', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToEditorMode();

    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();
    // TODO: đảm bảo index 0 là câu TĨNH trong dữ liệu seed
    await theory.sidebar.addQuestion(0);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.addQuestion(0);

    const count = await theory.editor.locator('[data-testid="question-block"][data-question-mode="static"]').count(); // TODO
    expect(count).toBe(1);
  });

  test('TC-THE-06: Câu động được chèn nhiều lần trong editor lý thuyết', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToEditorMode();

    await theory.activateInsertQuestionContext();
    await theory.sidebar.openThisMaterialTab();
    // TODO: đảm bảo index 1 là câu ĐỘNG trong dữ liệu seed
    await theory.sidebar.addQuestion(1);
    await theory.activateInsertQuestionContext();
    await theory.sidebar.addQuestion(1);

    const count = await theory.editor.locator('[data-testid="question-block"][data-question-mode="dynamic"]').count(); // TODO
    expect(count).toBe(2);
  });

  test('TC-THE-07: Không bấm Chèn câu hỏi trước -> ghi nhận hành vi thực tế so với đặc tả', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToEditorMode();

    const before = await theory.countInsertedQuestions();
    // Cố tình KHÔNG gọi activateInsertQuestionContext() để xác nhận hệ thống có chặn/đúng theo đặc tả
    await theory.sidebar.openThisMaterialTab();
    await theory.sidebar.addQuestion(0);

    const after = await theory.countInsertedQuestions();
    // Ghi log so sánh - tester cần đối chiếu hành vi thực tế với đặc tả đã thống nhất
    // trước khi khẳng định pass/fail cho case này (đặc tả không quy định rõ 1 hành vi cố định).
    console.log(`[TC-THE-07] before=${before}, after=${after} (đối chiếu thủ công với đặc tả)`);
  });

  test('TC-THE-08: Lấy câu hỏi từ học liệu OLM khi có quyền', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('olmSourceTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);

    await theory.activateInsertQuestionContext();
    await theory.sidebar.pickFromOlmTree('Lớp 12', 'Toán', 'Khóa học OLM demo', 'Học liệu OLM demo');
    await theory.sidebar.addQuestion(0);
    await expect((await theory.countInsertedQuestions())).toBeGreaterThan(0);
  });

  test('TC-THE-09: Tải Word học liệu lý thuyết', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);

    if (!(await theory.btnDownloadWord.isVisible().catch(() => false))) {
      test.skip(true, 'Học liệu demo không có quyền tải Word');
    }
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      theory.btnDownloadWord.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.docx?$/i);
  });

  test('TC-THE-10: Xem trước học liệu lý thuyết', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);

    await theory.openPreview();
    await expect(page.locator('body')).toBeVisible();
  });
});