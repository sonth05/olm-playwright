import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { LinkPage } from '../page/Materialpages';

/**
 * 9. Học liệu Liên kết (Link) - TC-LINK-01..04.
 * LƯU Ý: loại này có view V2 nhưng cần xác nhận điều kiện route/controller đã bật thật
 * trên môi trường test trước khi coi đây là luồng V2 chính thức (ghi chú trong tài liệu).
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-lien-ket-demo/quan-ly';
const VALID_URL = 'https://example.com/tai-nguyen-hoc-tap';
const INVALID_URL = 'khong-phai-url-hop-le';

test.describe('TC-LINK: Học liệu Liên kết (Link)', () => {
  test('TC-LINK-01: Nhập liên kết hợp lệ, lưu thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const link = new LinkPage(page);
    await link.goto(HOC_LIEU_URL);

    await link.fillUrl(VALID_URL);
    await link.save();
    await link.expectSavedSuccessfully();
  });

  test('TC-LINK-02: Nhập liên kết không hợp lệ -> báo lỗi, không cho lưu', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const link = new LinkPage(page);
    await link.goto(HOC_LIEU_URL);

    await link.fillUrl(INVALID_URL);
    await link.expectInvalidUrlMessage();
  });

  test('TC-LINK-03: Nút lưu bị khóa khi URL sai định dạng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const link = new LinkPage(page);
    await link.goto(HOC_LIEU_URL);

    await link.fillUrl(INVALID_URL);
    await link.expectSaveDisabled();
  });

  test('TC-LINK-04: Tải lại trang sau khi lưu, URL vẫn được giữ đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const link = new LinkPage(page);
    await link.goto(HOC_LIEU_URL);

    await link.fillUrl(VALID_URL);
    await link.save();
    await link.expectSavedSuccessfully();

    await link.reloadAndVerify(async () => {
      await expect(link.urlInput).toHaveValue(VALID_URL);
    });
  });
});