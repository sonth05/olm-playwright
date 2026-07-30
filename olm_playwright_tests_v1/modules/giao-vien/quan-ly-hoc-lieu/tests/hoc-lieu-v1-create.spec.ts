import { test } from '../../../../core/fixtures/role.fixture';
import { HocLieuCuaToiPage } from '../pages/HocLieuCuaToiPage';
import { CauHoiVuiPopup } from '../pages/CauHoiVuiPopup';
import {
  HOC_LIEU_V1_MATERIALS,
  CAU_HOI_VUI_HEADER_TITLE,
  DEFAULT_LOP,
  DEFAULT_MON,
  DEFAULT_BO_SACH,
} from '../pages/HocLieuV1Constants';

/**
 * hoc-lieu-v1-create.spec.ts
 * ─────────────────────────────────────────────────────────────────────────
 * SỬA LẦN 1 (2026-07-26): bản gốc dùng HocLieuV1Menu — page object đoán
 * selector từ ảnh chụp, giả định có 1 dropdown "Học liệu" ngay trên trang
 * /home. Trang đó KHÔNG tồn tại (xem error-context.md các test fail: sidebar
 * /home chỉ có link "Học liệu của tôi", không có dropdown nào để mở popup
 * tạo). Điểm vào ĐÚNG (đã verify bằng HTML thật, dùng chung với
 * HocLieuCuaToi.regression/smoke.spec.ts đang pass):
 *   /home → sidebar "Học liệu của tôi" → nút "Tạo mới học liệu" →
 *   dropdown a.select-cate-type[data-type="..."] → modal thật.
 *
 * SỬA LẦN 2 (2026-07-26): BỎ `beforeEach` gọi thẳng `teacherPage.goto(...)`.
 * Nguyên nhân: goto() thô của Playwright KHÔNG chạy qua
 * `BasePage.navigateTo()` nên bỏ qua bước tắt popup "Xác thực" email/SĐT
 * (modal #modal-form-active-mail — hiện `display:block` ngay sau khi vào
 * /home, xem HTML thật đã gửi). Modal này che nút "Tạo mới học liệu" bằng
 * backdrop → mọi click sau đó có thể bị chặn.
 * `BasePage.ensurePageLoaded()` chỉ tự gọi `navigateTo()` (có tắt popup) khi
 * `page.url() === 'about:blank'` — tức là page mới của fixture, CHƯA từng
 * goto() thủ công. Vì vậy: không tự goto() nữa, để nguyên page ở
 * 'about:blank' và giao hẳn cho `HocLieuCuaToiPage.navigateToHocLieuCuaToi()`
 * (gọi bên trong mỗi test) tự điều hướng + tắt sạch popup đúng 1 lần.
 */
test.describe('[V1] Tạo học liệu - điền đầy đủ thông tin popup', () => {
  for (const material of HOC_LIEU_V1_MATERIALS) {
    // FIX (2026-07-27): tên test trước đây hardcode chuỗi "Lớp 12/Kỹ
    // thuật/Cánh diều" — chỉ là text hiển thị, KHÔNG liên quan gì tới giá
    // trị thực sự truyền vào fillModal() (subject: DEFAULT_MON). Khi
    // DEFAULT_MON đổi từ 'Kỹ thuật' sang 'Toán', tên test bị hardcode này
    // không tự cập nhật theo, khiến nhìn vào danh sách test tưởng nhầm là
    // vẫn đang chọn "Kỹ thuật". Lấy động từ constants để tên test luôn
    // khớp đúng giá trị test thật sự dùng.
    test(`Tạo "${material.headerTitle}" - điền đầy đủ form + ${DEFAULT_LOP}/${DEFAULT_MON}/${DEFAULT_BO_SACH}`, async ({
      teacherPage,
    }) => {
      const stamp = Date.now();
      // Tên dễ nhận biết mỗi lần chạy test: [TEST_<KEY>] <Tên loại học liệu> <timestamp>
      const tieuDe = `[TEST_${material.key.toUpperCase()}] ${material.headerTitle} ${stamp}`;

      const page = new HocLieuCuaToiPage(teacherPage);
      await page.navigateToHocLieuCuaToi();
      await page.openCreateModal(material.type);

      // KHÔNG điền Mô tả/Từ khóa: HTML thật xác nhận 2 field này nằm trong
      // <div class="... d-none"> — ẩn mặc định (ít nhất với "Luyện tập trắc
      // nghiệm"), không có dấu * bắt buộc. Gọi .fill() vào field ẩn sẽ lỗi
      // "not visible". Nếu sau này xác nhận loại nào thật sự hiện field này,
      // thêm lại description/keyword riêng cho loại đó.
      await page.fillModal({
        title: tieuDe,
        // Tiêu đề SEO / Mô tả SEO: đã verify tồn tại + hiển thị trên modal thật.
        seoTitle: tieuDe.slice(0, 60),
        seoDescription: `SEO test tự động cho "${material.headerTitle}" lúc ${stamp}`.slice(0, 160),
        // Chọn lớp/môn/bộ sách: đã verify là <select> thật, fillModal() dùng
        // selectOption({ label }) — DEFAULT_MON phải khớp đúng text hiển thị
        // trong <option> (hiện là "Toán"), không phải nhãn tự đặt.
        classLevel: DEFAULT_LOP,
        subject: DEFAULT_MON,
        bookSet: DEFAULT_BO_SACH,
        replacementCoursewareId: '0',
      });

      // Loại "Tài liệu": bắt buộc phải tải kèm 1 file trước khi Tạo.
      // TODO: fillModal() hiện CHƯA xử lý input[type=file] trong modal —
      // cần bổ sung method upload riêng (tham khảo uploadExamFile() cùng
      // file HocLieuCuaToiPage.ts) trước khi bật lại case 'document'.
      if (material.formType === 'document') {
        // await page.uploadFileInModal('olm_playwright_tests/data/sample-document.pdf');
      }

      await page.submitModal();
    });
  }

  /**
   * "Câu hỏi vui" (Game hoá): mở popup dùng HocLieuCuaToiPage.openCreateModal
   * ('game-hoa') — đã verify (#demoViewCategoryBuilder .dropdown-item).
   * Phần ĐIỀN FORM bên trong vẫn dùng CauHoiVuiPopup vì cấu trúc khác hẳn
   * HocLieuV1FormModal — LƯU Ý: CauHoiVuiPopup.ts vẫn dựa trên ảnh chụp,
   * CHƯA verify bằng HTML thật. Nếu test fail ở bước fillAll() (không phải
   * ở bước mở popup), gửi HTML/screenshot của modal Game hoá thật để sửa
   * selector — không đoán tiếp.
   */
  test(`Tạo "${CAU_HOI_VUI_HEADER_TITLE}" - điền đầy đủ form + chọn dạng câu hỏi`, async ({
    teacherPage,
  }) => {
    const stamp = Date.now();
    const tieuDe = `[TEST_CAU_HOI_VUI] Câu hỏi vui ${stamp}`;

    const page = new HocLieuCuaToiPage(teacherPage);
    await page.navigateToHocLieuCuaToi();
    await page.openCreateModal('game-hoa');

    const popup = new CauHoiVuiPopup(teacherPage);
    await popup.expectVisible();

    await popup.fillAll({
      tieuDeHocLieu: tieuDe,
      khoiLop: DEFAULT_LOP,
      monHoc: DEFAULT_MON,
      dangCauHoi: 'Chọn đáp án đúng',
    });

    await popup.clickTaoHocLieu();
    await popup.expectClosed();
  });
});