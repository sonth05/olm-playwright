import { test } from '../../../../../core/fixtures/role.fixture';
import { HocLieuCuaToiPage } from '../../pages/HocLieuCuaToiPage';
import { CauHoiVuiPopup } from '../../pages/CauHoiVuiPopup';
import {
  HOC_LIEU_V1_MATERIALS,
  CAU_HOI_VUI_HEADER_TITLE,
  DEFAULT_LOP,
  DEFAULT_MON,
  DEFAULT_BO_SACH,
} from '../../pages/HocLieuV1Constants';

/**
 * TaoHocLieu.e2e.spec.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Luồng tạo học liệu: mở dropdown "Tạo mới học liệu" → điền form popup →
 * submit. Di chuyển từ hoc-lieu-v1-create.spec.ts (giữ nguyên toàn bộ logic
 * đã verify bằng HTML thật), chỉ bổ sung test.step() để tách rõ từng bước
 * theo chuẩn e2e/ (mục 4 CONVENTIONS.md).
 *
 * SỬA LẦN 1 (2026-07-26): bản gốc dùng HocLieuV1Menu — page object đoán
 * selector từ ảnh chụp, giả định có 1 dropdown "Học liệu" ngay trên trang
 * /home. Trang đó KHÔNG tồn tại. Điểm vào ĐÚNG (đã verify bằng HTML thật):
 *   /home → sidebar "Học liệu của tôi" → nút "Tạo mới học liệu" →
 *   dropdown a.select-cate-type[data-type="..."] → modal thật.
 *
 * SỬA LẦN 2 (2026-07-26): BỎ `beforeEach` gọi thẳng `teacherPage.goto(...)`.
 * Không tự goto() nữa, giao hẳn cho `HocLieuCuaToiPage.navigateToHocLieuCuaToi()`
 * (gọi bên trong mỗi test) tự điều hướng + tắt sạch popup đúng 1 lần.
 */
test.describe('Tạo học liệu - điền đầy đủ thông tin popup @quan-ly-hoc-lieu', () => {
  for (const material of HOC_LIEU_V1_MATERIALS) {
    test(`Tạo "${material.headerTitle}" - điền đầy đủ form + ${DEFAULT_LOP}/${DEFAULT_MON}/${DEFAULT_BO_SACH}`, async ({
      teacherPage,
    }) => {
      const stamp = Date.now();
      const tieuDe = `[TEST_${material.key.toUpperCase()}] ${material.headerTitle} ${stamp}`;
      const page = new HocLieuCuaToiPage(teacherPage);

      await test.step('Mở dropdown "Tạo mới học liệu" và chọn loại học liệu', async () => {
        await page.navigateToHocLieuCuaToi();
        await page.openCreateModal(material.type);
      });

      await test.step('Điền form tạo học liệu', async () => {
        // KHÔNG điền Mô tả/Từ khóa: 2 field này ẩn mặc định (d-none), không
        // có dấu * bắt buộc đối với "Luyện tập trắc nghiệm".
        await page.fillModal({
          title: tieuDe,
          seoTitle: tieuDe.slice(0, 60),
          seoDescription: `SEO test tự động cho "${material.headerTitle}" lúc ${stamp}`.slice(0, 160),
          classLevel: DEFAULT_LOP,
          subject: DEFAULT_MON,
          bookSet: DEFAULT_BO_SACH,
          replacementCoursewareId: '0',
        });

        // Loại "Tài liệu": bắt buộc phải tải kèm 1 file trước khi Tạo.
        // TODO: fillModal() hiện CHƯA xử lý input[type=file] trong modal —
        // cần bổ sung method upload riêng trước khi bật lại case 'document'.
        if (material.formType === 'document') {
          // await page.uploadFileInModal('olm_playwright_tests/data/sample-document.pdf');
        }
      });

      await test.step('Submit form, đóng modal', async () => {
        await page.submitModal();
      });
    });
  }

  test(`Tạo "${CAU_HOI_VUI_HEADER_TITLE}" - điền đầy đủ form + chọn dạng câu hỏi`, async ({
    teacherPage,
  }) => {
    const stamp = Date.now();
    const tieuDe = `[TEST_CAU_HOI_VUI] Câu hỏi vui ${stamp}`;
    const page = new HocLieuCuaToiPage(teacherPage);
    let popup: CauHoiVuiPopup;

    await test.step('Mở dropdown, chọn "Câu hỏi vui" (Game hoá)', async () => {
      await page.navigateToHocLieuCuaToi();
      await page.openCreateModal('game-hoa');
      popup = new CauHoiVuiPopup(teacherPage);
      await popup.expectVisible();
    });

    await test.step('Điền form Câu hỏi vui', async () => {
      await popup.fillAll({
        tieuDeHocLieu: tieuDe,
        khoiLop: DEFAULT_LOP,
        monHoc: DEFAULT_MON,
        dangCauHoi: 'Chọn đáp án đúng',
      });
    });

    await test.step('Tạo học liệu, đóng popup', async () => {
      await popup.clickTaoHocLieu();
      await popup.expectClosed();
    });
  });
});
