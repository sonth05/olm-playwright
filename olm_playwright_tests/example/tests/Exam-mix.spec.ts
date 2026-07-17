import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { ExamMixPage } from '../page/Materialpages';
/**
 * 8. Đề offline (Exam Mix) - TC-MIX-01..06.
 */
const HOC_LIEU_URL = '/chu-de/de-thi-tron-offline-demo/quan-ly';
const IMPORT_FILE = 'fixtures/files/de-mau-import.docx';

test.describe('TC-MIX: Đề offline (Exam Mix)', () => {
  test('TC-MIX-01: Mở màn đề offline thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const mix = new ExamMixPage(page);
    await mix.goto(HOC_LIEU_URL);

    await expect(mix.btnSave).toBeVisible();
  });

  test('TC-MIX-02: Hiển thị danh sách câu hỏi đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const mix = new ExamMixPage(page);
    await mix.goto(HOC_LIEU_URL);

    await expect(mix.questionList).toBeVisible();
    expect(await mix.questionItemCount()).toBeGreaterThan(0);
  });

  test('TC-MIX-03: Hiển thị đúng thông tin trường và môn', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const mix = new ExamMixPage(page);
    await mix.goto(HOC_LIEU_URL);

    await expect(mix.schoolNameText).not.toBeEmpty();
    await expect(mix.subjectNameText).not.toBeEmpty();
  });

  test('TC-MIX-04: Import Word đề offline', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const mix = new ExamMixPage(page);
    await mix.goto(HOC_LIEU_URL);

    const before = await mix.questionItemCount();
    await mix.importWord(IMPORT_FILE);
    await expect.poll(() => mix.questionItemCount()).toBeGreaterThan(before);
  });

  test('TC-MIX-05: Xem trước và shuffle đề không lỗi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const mix = new ExamMixPage(page);
    await mix.goto(HOC_LIEU_URL);

    await mix.openPreview();
    await mix.shuffle();
    await expect(page.locator('body')).not.toContainText(/lỗi|error/i);
  });

  test('TC-MIX-06: Lưu đề offline đúng nội dung', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const mix = new ExamMixPage(page);
    await mix.goto(HOC_LIEU_URL);

    await mix.shuffle();
    await mix.save();
    await mix.expectSavedSuccessfully();
  });
});