import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuCuaToiV2Page } from '../../pages/Hoclieucuatoiv2page';
import { ExamModal, GameQuestionModal } from '../../pages/Hoclieucuatoiv2page';
import { CreateHocLieuMenu, HOC_LIEU_TYPE, CreateMaterialModal } from '../../pages/Createhoclieumenu';

/**
 * Type guard: loại trừ GameQuestionModal ra khỏi union trả về của
 * createNewAndOpenModal(). CHỈ dùng cho các giá trị trong
 * TEACHER_MATERIAL_TYPES/OLM_STAFF_MATERIAL_TYPES (đã loại bỏ
 * HOC_LIEU_TYPE.GAME) — GameQuestionModal có shape field hoàn toàn khác
 * (không có descriptionInput/SEO), xem ghi chú tại ALL_MATERIAL_TYPES.
 */
function isCommonModal(
  modal: CreateMaterialModal | ExamModal | GameQuestionModal,
): modal is CreateMaterialModal | ExamModal {
  return !(modal instanceof GameQuestionModal);
}


const ALL_MATERIAL_TYPES = [
  { key: 'EXAM_MIXTURE_V2',     value: HOC_LIEU_TYPE.EXAM_MIXTURE_V2,     label: 'Đề kiểm tra',                                        expectedTitle: 'Tạo Đề kiểm tra' },
  { key: 'NHCH',                value: HOC_LIEU_TYPE.NHCH,                label: 'Dạng bài, kĩ năng (NHCH)',                           expectedTitle: 'Tạo Dạng bài, kĩ năng (NHCH)' },
  { key: 'THEORY',              value: HOC_LIEU_TYPE.THEORY,              label: 'Lý thuyết tương tác',                                 expectedTitle: 'Tạo Lý thuyết tương tác' },
  { key: 'VIDEO',               value: HOC_LIEU_TYPE.VIDEO,               label: 'Video Youtube có điểm dừng',                          expectedTitle: 'Tạo Video Youtube có điểm dừng' },
  { key: 'ESSAY',               value: HOC_LIEU_TYPE.ESSAY,               label: 'Đề thi Tự luận',                                      expectedTitle: 'Tạo Đề thi Tự luận' },
  { key: 'LINK',                value: HOC_LIEU_TYPE.LINK,                label: 'Liên kết',                                            expectedTitle: 'Tạo Liên kết' },
  { key: 'PDF',                 value: HOC_LIEU_TYPE.PDF,                 label: 'Đề thi trắc nghiệm từ file PDF hoặc Word',             expectedTitle: 'Tạo Đề thi trắc nghiệm từ file PDF hoặc Word' },
  { key: 'EXAM_STANDARD_MATRIX',value: HOC_LIEU_TYPE.EXAM_STANDARD_MATRIX,label: 'Đề thi trắc nghiệm từ ma trận',                       expectedTitle: 'Tạo Đề thi trắc nghiệm từ ma trận' },
  { key: 'EXAM_MIX',            value: HOC_LIEU_TYPE.EXAM_MIX,            label: 'Đề thi trộn Offline',                                 expectedTitle: 'Tạo Đề thi trộn Offline' },
  { key: 'PRACTICE_MATRIX',     value: HOC_LIEU_TYPE.PRACTICE_MATRIX,     label: 'Đề luyện tập trắc nghiệm từ ma trận',                 expectedTitle: 'Tạo Đề luyện tập trắc nghiệm từ ma trận' },
  { key: 'DOCUMENT',            value: HOC_LIEU_TYPE.DOCUMENT,            label: 'Tài liệu',                                            expectedTitle: 'Tạo Tài liệu' },
  { key: 'SIMULATION',          value: HOC_LIEU_TYPE.SIMULATION,          label: 'Mô phỏng, thí nghiệm ảo',                              expectedTitle: 'Tạo Mô phỏng, thí nghiệm ảo' },
] as const;


const TEACHER_MATERIAL_TYPES = ALL_MATERIAL_TYPES.filter((t) => t.key !== 'NHCH');

// Nhân sự OLM thấy đủ 12 loại (đã xác nhận qua kết quả chạy thực tế: role
// olmStaff pass hết 12 loại, chỉ riêng modal "Game hóa" ở dưới sai kỳ vọng
// tiêu đề).
const OLM_STAFF_MATERIAL_TYPES = ALL_MATERIAL_TYPES;

test.describe('[UI] TC-CREATE-MATERIAL-MODAL: Modal tạo học liệu – tất cả loại (1 browser/role)', () => {

  // ─── Role: Giáo viên thường (không có SEO) – 1 test duy nhất, loop 11 loại
  // dùng chung shape (KHÔNG có NHCH — chỉ Nhân sự OLM mới thấy mục này) ───
  test('Giáo viên thường: kiểm tra UI 11 loại học liệu (không SEO, không NHCH)', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);

    for (const type of TEACHER_MATERIAL_TYPES) {
      await test.step(`${type.key}: Modal "Tạo ${type.label}"`, async () => {
        const modal = await menu.createNewAndOpenModal(type.value);
        if (!isCommonModal(modal)) return; // luôn true ở đây vì type.value != GAME, chỉ để TS narrow union


        // 1. Tiêu đề modal
        await expect.soft(modal.titleHeading).toContainText(type.expectedTitle);

        // 2. Trường Tiêu đề & Mô tả
        await expect.soft(modal.titleInput).toBeVisible();
        await expect.soft(modal.descriptionInput).toBeVisible();

        // 3. Nút Khối lớp & Môn học
        await expect.soft(modal.gradeSelectBtn).toBeVisible();
        await expect.soft(modal.subjectSelectBtn).toBeVisible();
        await expect.soft(modal.gradeSelectBtn.locator('span').first()).toContainText(/Chọn khối lớp/i);
        await expect.soft(modal.subjectSelectBtn.locator('span').first()).toContainText(/Chọn môn học/i);

        // 4. Không có trường SEO
        await expect.soft(modal.seoKeywordInput).not.toBeAttached();
        await expect.soft(modal.seoTitleInput).not.toBeAttached();
        await expect.soft(modal.seoDescriptionInput).not.toBeAttached();

        // 5. Nút Huỷ / Tạo
        await expect.soft(modal.btnCancel).toBeVisible();
        await expect.soft(modal.btnSubmit).toBeVisible();

        // 6. Nhãn bắt buộc có dấu *
        const titleLabel = modal.dialog.locator('label').filter({ hasText: /Tiêu đề học liệu|Tiêu đề/i }).first();
        await expect.soft(titleLabel.locator('span').last()).toHaveText('*');

        const gradeLabel = modal.dialog.locator('label').filter({ hasText: /Khối lớp/i }).first();
        await expect.soft(gradeLabel.locator('span').last()).toHaveText('*');

        const subjectLabel = modal.dialog.locator('label').filter({ hasText: /Môn học/i }).first();
        await expect.soft(subjectLabel.locator('span').last()).toHaveText('*');

        // 7. Đóng modal trước khi sang loại tiếp theo
        await modal.dismiss();
      });
    }

    // ─── GAME (Game hóa): modal Bootstrap riêng (GameQuestionModal), shape
    // khác hẳn 12 loại trên — chỉ kiểm tra đúng field mà class này thực có.
    await test.step('GAME: Modal "Tạo Game hóa"', async () => {
      const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.GAME);
      if (isCommonModal(modal)) return; // luôn false ở đây, chỉ để TS narrow

      // FIX: DOM thật (.modal-title.h4) hiển thị "Câu hỏi vui", không phải
      // "Tạo Game hóa" — xem docblock GameQuestionModal trong
      // Hoclieucuatoiv2page.ts. Sửa lại kỳ vọng theo đúng log thực tế thay
      // vì đoán tên theo nhãn trong menu "Tạo mới học liệu".
      await expect.soft(modal.titleHeading).toContainText('Câu hỏi vui');
      await expect.soft(modal.titleInput).toBeVisible();
      await expect.soft(modal.gradeSelectBtn).toBeVisible();
      await expect.soft(modal.subjectSelectBtn).toBeVisible();
      await expect.soft(modal.btnCancel).toBeVisible();
      await expect.soft(modal.btnSubmit).toBeVisible();

      await modal.dismiss();
    });
  });

  // ─── Tạo mới THẬT (fill + submit) cho các loại học liệu dùng chung shape.
  // MỤC ĐÍCH đợt này: xác nhận modal ĐÓNG sau khi bấm "Tạo" với 3 field
  // chung (Tiêu đề/Khối lớp/Môn học) — CHƯA assert URL/trang quản lý đích
  // theo từng loại vì chưa có DOM thật của các trang quản lý bên trong (sẽ
  // bổ sung ở phần e2e/function khi có DOM, theo yêu cầu làm UI trước).
  //
  // LƯU Ý QUAN TRỌNG: một số loại học liệu (VD Liên kết cần URL, Video
  // Youtube cần link, PDF/Word cần upload file...) CÓ THỂ có field bắt buộc
  // RIÊNG ngoài 3 field chung mà class CreateMaterialModal hiện chưa model
  // hoá — nếu vậy submit sẽ KHÔNG thành công (modal không đóng) và bước
  // expect.soft dưới đây sẽ báo lỗi rõ ràng theo từng loại (không nuốt lỗi
  // toàn bộ loop nhờ dùng test.step + expect.soft). Đây là TÍN HIỆU CHỦ ĐÍCH
  // để xác định loại nào cần field riêng — không phải bug của test.
  test('Giáo viên thường: tạo mới thành công 11 loại học liệu (không SEO, không NHCH)', async ({ getPageAsRole }) => {
    test.slow(); // 11 lần tạo học liệu thật (fill + submit + điều hướng), cần nhiều thời gian hơn mặc định
    const page = await getPageAsRole('editableTeacher');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);

    for (const type of TEACHER_MATERIAL_TYPES) {
      await test.step(`${type.key}: Điền Tiêu đề/Khối lớp/Môn học rồi bấm "Tạo"`, async () => {
        const modal = await menu.createNewAndOpenModal(type.value);
        if (!isCommonModal(modal)) return; // luôn true ở đây, chỉ để TS narrow union

        const title = `[UI-CREATE] ${type.label} ${Date.now()}`;
        // titleInput dùng chung giữa CreateMaterialModal/ExamModal (cả 2 đều
        // có field này); fillTitle() wrapper chỉ tồn tại ở CreateMaterialModal
        // nên dùng thẳng titleInput.fill() để hoạt động với cả union type.
        await modal.titleInput.fill(title);
        await modal.selectGrade(/Lớp 10/i);
        await modal.selectSubject(/Toán/i);
        await modal.submit();

        // TODO: khi có DOM trang quản lý đích của từng loại học liệu, thay
        // assertion "modal đóng" dưới bằng kiểm tra cụ thể (URL đích, tiêu đề
        // trang, hoặc học liệu mới xuất hiện đúng dòng trong danh sách) theo
        // đúng DOM thật — KHÔNG đoán trước.
        await expect.soft(modal.dialog).toBeHidden({ timeout: 10_000 });

        // Dọn dẹp trước khi sang loại tiếp theo: nếu submit thành công đã
        // điều hướng sang trang khác thì goto() sẽ quay lại danh sách; nếu
        // submit thất bại (modal còn mở do thiếu field riêng) thì đóng modal
        // bằng "Hủy" để không kẹt trạng thái cho vòng lặp kế tiếp.
        if (await modal.dialog.isVisible({ timeout: 500 }).catch(() => false)) {
          await modal.cancel().catch(() => {});
        }
        await listPage.goto();
      });
    }

    // GAME (Game hóa): TẠM CHƯA submit thật. GameQuestionModal dùng dropdown
    // Bootstrap tùy biến (.custom-dropdown-header) — hiện mới có
    // openGradeSelect()/openSubjectSelect() để MỞ dropdown, CHƯA có
    // selectGrade()/selectSubject() chọn đúng option theo DOM thật (khác cấu
    // trúc popover/option của Radix dùng ở CreateMaterialModal). Bổ sung khi
    // có DOM option thật của 2 dropdown này, tránh đoán chọn nhầm.
    await test.step('GAME: (TODO) chưa tạo mới thật — thiếu DOM chọn Khối lớp/Môn học của dropdown Bootstrap', async () => {
      const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.GAME);
      if (isCommonModal(modal)) return; // luôn false ở đây, chỉ để TS narrow
      await expect.soft(modal.titleHeading).toContainText('Câu hỏi vui');
      await modal.dismiss();
    });
  });

  // ─── Role: Nhân sự OLM (có SEO tuỳ loại) – 1 test duy nhất, loop 12 loại dùng chung shape ───
  test('Nhân sự OLM: kiểm tra UI 12 loại học liệu (có/không SEO)', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('olmStaff');
    const listPage = new HocLieuCuaToiV2Page(page);
    await listPage.goto();
    const menu = new CreateHocLieuMenu(page);

    for (const type of OLM_STAFF_MATERIAL_TYPES) {
      await test.step(`${type.key}: Modal "Tạo ${type.label}"`, async () => {
        const modal = await menu.createNewAndOpenModal(type.value);
        if (!isCommonModal(modal)) return; // luôn true ở đây vì type.value != GAME, chỉ để TS narrow union

        // 1. Tiêu đề modal
        await expect.soft(modal.titleHeading).toContainText(type.expectedTitle);

        // 2. Trường cơ bản
        await expect.soft(modal.titleInput).toBeVisible();
        await expect.soft(modal.descriptionInput).toBeVisible();
        await expect.soft(modal.gradeSelectBtn).toBeVisible();
        await expect.soft(modal.subjectSelectBtn).toBeVisible();
        await expect.soft(modal.btnCancel).toBeVisible();
        await expect.soft(modal.btnSubmit).toBeVisible();

        // 3. Placeholder Khối lớp / Môn học
        await expect.soft(modal.gradeSelectBtn.locator('span').first()).toContainText(/Chọn khối lớp/i);
        await expect.soft(modal.subjectSelectBtn.locator('span').first()).toContainText(/Chọn môn học/i);

        // 4. Kiểm tra khối SEO: nếu 1 trong 3 visible → cả 3 phải visible
        const seoKeywordVisible = await modal.seoKeywordInput.isVisible().catch(() => false);
        const seoTitleVisible = await modal.seoTitleInput.isVisible().catch(() => false);
        const seoDescVisible = await modal.seoDescriptionInput.isVisible().catch(() => false);

        if (seoKeywordVisible || seoTitleVisible || seoDescVisible) {
          await expect.soft(modal.seoKeywordInput).toBeVisible();
          await expect.soft(modal.seoTitleInput).toBeVisible();
          await expect.soft(modal.seoDescriptionInput).toBeVisible();
        } else {
          await expect.soft(modal.seoKeywordInput).not.toBeVisible();
          await expect.soft(modal.seoTitleInput).not.toBeVisible();
          await expect.soft(modal.seoDescriptionInput).not.toBeVisible();
        }

        // 5. Nhãn bắt buộc có dấu *
        const titleLabel = modal.dialog.locator('label').filter({ hasText: /Tiêu đề học liệu|Tiêu đề/i }).first();
        await expect.soft(titleLabel.locator('span').last()).toHaveText('*');

        const gradeLabel = modal.dialog.locator('label').filter({ hasText: /Khối lớp/i }).first();
        await expect.soft(gradeLabel.locator('span').last()).toHaveText('*');

        const subjectLabel = modal.dialog.locator('label').filter({ hasText: /Môn học/i }).first();
        await expect.soft(subjectLabel.locator('span').last()).toHaveText('*');

        // 6. Đóng modal
        await modal.dismiss();
      });
    }

    // ─── GAME (Game hóa): GameQuestionModal không có descriptionInput/SEO
    // (kể cả với role olmStaff) — chỉ kiểm tra field thực có.
    await test.step('GAME: Modal "Tạo Game hóa"', async () => {
      const modal = await menu.createNewAndOpenModal(HOC_LIEU_TYPE.GAME);
      if (isCommonModal(modal)) return; // luôn false ở đây, chỉ để TS narrow

      // FIX: DOM thật (.modal-title.h4) hiển thị "Câu hỏi vui", không phải
      // "Tạo Game hóa" — xem docblock GameQuestionModal trong
      // Hoclieucuatoiv2page.ts. Sửa lại kỳ vọng theo đúng log thực tế thay
      // vì đoán tên theo nhãn trong menu "Tạo mới học liệu".
      await expect.soft(modal.titleHeading).toContainText('Câu hỏi vui');
      await expect.soft(modal.titleInput).toBeVisible();
      await expect.soft(modal.gradeSelectBtn).toBeVisible();
      await expect.soft(modal.subjectSelectBtn).toBeVisible();
      await expect.soft(modal.btnCancel).toBeVisible();
      await expect.soft(modal.btnSubmit).toBeVisible();

      await modal.dismiss();
    });
  });
});