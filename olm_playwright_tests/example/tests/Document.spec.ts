import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { DocumentPage } from '../page/Materialpages';

/**
 * 7. Học liệu Tài liệu (Document) - TC-DOC-01..04.
 * Quy tắc: 1 học liệu tài liệu chỉ quản lý 1 tài liệu chính, tài liệu mới thay thế tài liệu cũ.
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-tai-lieu-demo/quan-ly';
const VALID_FILE = 'fixtures/files/tai-lieu-mau.pdf';

test.describe('TC-DOC: Học liệu Tài liệu (Document)', () => {
  test('TC-DOC-01: Tải tài liệu chính của học liệu thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const doc = new DocumentPage(page);
    await doc.goto(HOC_LIEU_URL);

    await doc.upload.uploadFile(VALID_FILE);
    await doc.upload.expectPreviewVisible();
  });

  test('TC-DOC-02: Hiển thị trạng thái đang lưu sau khi tải tệp', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const doc = new DocumentPage(page);
    await doc.goto(HOC_LIEU_URL);

    await doc.upload.uploadFile(VALID_FILE);
    await doc.upload.expectSavingIndicatorShown();
  });

  test('TC-DOC-03: Xem trước tài liệu vừa tải lên', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const doc = new DocumentPage(page);
    await doc.goto(HOC_LIEU_URL);

    await doc.upload.uploadFile(VALID_FILE);
    await doc.upload.expectPreviewMatchesFileName('tai-lieu-mau.pdf');
  });

  test('TC-DOC-04: Tải lại sau khi lưu vẫn giữ đúng tài liệu và phần xem trước', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const doc = new DocumentPage(page);
    await doc.goto(HOC_LIEU_URL);

    await doc.upload.uploadFile(VALID_FILE);
    await doc.expectSavedSuccessfully();

    await doc.reloadAndVerify(async () => {
      await doc.upload.expectPreviewVisible();
    });
  });
});