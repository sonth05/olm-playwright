import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { TheoryPage } from '../page/Theorypage';

/**
 * Nhóm tải tệp lên TC-FILE-01..05.
 * Áp dụng cho Theory, Essay, PDF, Document - dùng Theory làm đại diện cho phần dùng chung,
 * các spec riêng (essay/pdf/document) sẽ tái sử dụng FileUploadPanel tương tự cho phần đặc thù
 * (2 panel độc lập với Essay/PDF, panel bắt buộc với PDF...).
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-ly-thuyet-demo/quan-ly';
// TODO: chuẩn bị các tệp mẫu thật trong thư mục fixtures/files
const VALID_FILE = 'fixtures/files/tai-lieu-mau.pdf';
const REPLACEMENT_FILE = 'fixtures/files/tai-lieu-mau-2.pdf';
const INVALID_FILE = 'fixtures/files/tep-khong-hop-le.exe';

test.describe('TC-FILE: Nhóm tải tệp lên', () => {
  test('TC-FILE-01: Tải tệp lên lần đầu thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToFileMode();

    await theory.upload.uploadFile(VALID_FILE);
    await theory.upload.expectPreviewVisible();
  });

  test('TC-FILE-02: Xem trước tệp sau khi tải lên', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToFileMode();

    await theory.upload.uploadFile(VALID_FILE);
    await theory.upload.expectPreviewMatchesFileName('tai-lieu-mau.pdf');
  });

  test('TC-FILE-03: Tải tệp mới thay thế tệp cũ', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToFileMode();

    await theory.upload.uploadFile(VALID_FILE);
    await theory.upload.expectPreviewVisible();

    await theory.upload.replaceFile(REPLACEMENT_FILE);
    await theory.upload.expectPreviewMatchesFileName('tai-lieu-mau-2.pdf');
  });

  test('TC-FILE-04: Tải lại trang sau khi tải tệp lên vẫn giữ đúng dữ liệu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToFileMode();

    await theory.upload.uploadFile(VALID_FILE);
    await theory.save();
    await theory.expectSavedSuccessfully();

    await theory.reloadAndVerify(async () => {
      await theory.upload.expectPreviewVisible();
    });
  });

  test('TC-FILE-05: Chặn sai định dạng tệp', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const theory = new TheoryPage(page);
    await theory.goto(HOC_LIEU_URL);
    await theory.switchToFileMode();

    await theory.upload.uploadFile(INVALID_FILE);
    await theory.upload.expectFormatRejected();
  });
});