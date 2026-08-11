import { test as base, Page, BrowserContext } from '@playwright/test';
import { patchGotoWithV2 } from './patchGoto';

/**
 * 4 vai trò nghiệp vụ theo mục 4 của đặc tả "Soạn học liệu V2":
 * - editableTeacher      : GV có quyền sửa học liệu (chủ sở hữu / được chia sẻ quyền sửa)
 * - nonEditableTeacher    : GV không có quyền sửa học liệu -> phải bị chặn (TC-COM-02)
 * - olmSourceTeacher      : GV có quyền dùng nguồn học liệu OLM (TC-QS-03, TC-HIER-04, TC-STD-05, TC-THE-08)
 * - nonOlmSourceTeacher   : GV không có quyền dùng nguồn học liệu OLM (TC-QS-04, TC-HIER-05, TC-STD-06)
 * - olmStaff              : Nhân sự OLM nội bộ, có thêm quyền tìm câu hỏi theo ID (TC-QS-12, TC-HIER-08)
 *
 * Mỗi vai trò tương ứng 1 storageState đã đăng nhập sẵn (chuẩn bị qua global-setup / login script riêng).
 * Cập nhật lại đường dẫn storageState cho khớp với cấu hình multi-env hiện có của dự án
 * (debug.olm.vn) nếu cần.
 */
export type V2Role =
  | 'editableTeacher'
  | 'nonEditableTeacher'
  | 'olmSourceTeacher'
  | 'nonOlmSourceTeacher'
  | 'olmStaff';

const STORAGE_STATE_BY_ROLE: Record<V2Role, string> = {
  editableTeacher: 'storageState/teacher-editable.json',
  nonEditableTeacher: 'storageState/teacher-non-editable.json',
  olmSourceTeacher: 'storageState/teacher-olm-source.json',
  nonOlmSourceTeacher: 'storageState/teacher-non-olm-source.json',
  olmStaff: 'storageState/olm-staff.json',
};

// ─── Ép TẤT CẢ getPageAsRole(...) dùng chung 1 role (thử nhanh 1 tài khoản) ──
// Toàn bộ test trong module "quan-ly-hoc-lieu" gọi cứng getPageAsRole('editableTeacher')
// trong thân test (không đi qua fixture authRole của fixtures/auth.fixture.ts),
// nên không thể đổi tài khoản chỉ bằng cấu hình project/authRole như các module khác.
//
// Set FORCE_V2_ROLE=olmStaff (hoặc 1 trong 5 role hợp lệ) trước khi chạy để mọi
// lời gọi getPageAsRole(bất_kỳ_role_nào) trong SUITE ĐANG CHẠY đều dùng chung
// đúng 1 storageState của role đó — không cần sửa code trong từng file test.
// Bỏ trống (không set) → giữ nguyên hành vi cũ, mỗi role dùng đúng storageState riêng.
const FORCE_V2_ROLE = process.env.FORCE_V2_ROLE as V2Role | undefined;
if (FORCE_V2_ROLE && !(FORCE_V2_ROLE in STORAGE_STATE_BY_ROLE)) {
  throw new Error(
    `[V2authoringrole.fixture] FORCE_V2_ROLE="${FORCE_V2_ROLE}" không hợp lệ. ` +
    `Các role hợp lệ: ${Object.keys(STORAGE_STATE_BY_ROLE).join(', ')}`,
  );
}
// FIX: FORCE_V2_ROLE là biến môi trường (set bằng $env:FORCE_V2_ROLE=... trong
// PowerShell) — nó KHÔNG tự mất giữa các lần chạy lệnh trong cùng 1 cửa sổ
// terminal. Nếu quên unset sau khi chạy thử 1 role riêng, lần chạy suite đầy
// đủ tiếp theo sẽ ÂM THẦM ép MỌI getPageAsRole(...) về đúng 1 role đó — test
// xin role khác (vd 'olmStaff' cần thấy SEO) vẫn nhận storageState của role bị
// force (vd 'editableTeacher' không SEO) → fail khó hiểu, tưởng lỗi UI/DOM
// nhưng thực ra do sai session. Cảnh báo to ngay khi fixture được load để
// không còn là lỗi im lặng.
if (FORCE_V2_ROLE) {
  console.warn(
    `\n${'!'.repeat(70)}\n` +
    `[V2authoringrole.fixture] ⚠⚠⚠ FORCE_V2_ROLE="${FORCE_V2_ROLE}" ĐANG BẬT. ` +
    `MỌI getPageAsRole(role) trong suite này — kể cả gọi với role khác — sẽ dùng ` +
    `chung storageState của "${FORCE_V2_ROLE}". Nếu đây không phải ý định cho lần ` +
    `chạy này, chạy: Remove-Item Env:\\FORCE_V2_ROLE (PowerShell) rồi chạy lại.\n` +
    `${'!'.repeat(70)}\n`,
  );
}

type Fixtures = {
  /** Trả về 1 Page đã đăng nhập đúng vai trò yêu cầu, tái sử dụng trong cùng 1 test nếu gọi lại với cùng role */
  getPageAsRole: (role: V2Role) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  getPageAsRole: async ({ browser }, use, testInfo) => {
    const contextCache = new Map<V2Role, BrowserContext>();

    const getPageAsRole = async (role: V2Role): Promise<Page> => {
      // FORCE_V2_ROLE có set → mọi role yêu cầu đều "quy" về đúng 1 role đó,
      // kể cả cache key, để không login/tạo context thừa cho các role khác
      // nhau trong cùng 1 test khi đang chạy chế độ "thử 1 tài khoản".
      const effectiveRole = FORCE_V2_ROLE ?? role;
      let context = contextCache.get(effectiveRole);

      if (!context) {
        context = await browser.newContext({
          storageState: STORAGE_STATE_BY_ROLE[effectiveRole],

          // Context này được tạo thủ công qua browser.newContext() nên
          // KHÔNG tự động thừa hưởng `use.video` của playwright.config.ts
          // (cấu hình đó chỉ áp dụng cho context/page fixture mặc định của
          // Playwright Test) — vẫn cần khai báo recordVideo riêng ở đây.
          // Đây CHỈ là phương án dự phòng khi video chính (của config) vì
          // lý do nào đó không xuất được cho context thủ công này; xem xử
          // lý dọn dẹp bên dưới — chỉ giữ lại (và log) video khi test fail,
          // xoá ngay khi test pass để không tích rác qua nhiều lần chạy.
          recordVideo: { dir: 'reports/debug-video' },
        });

        contextCache.set(effectiveRole, context);
      }

      const page = await context.newPage();
      return patchGotoWithV2(page);
    };

    await use(getPageAsRole);

    const testFailed = testInfo.status !== testInfo.expectedStatus;

    // video.path()/delete() chỉ đảm bảo hoạt động đúng SAU KHI page/context
    // đã đóng (video được flush ra đĩa lúc đóng) — thu thập Video trước,
    // đóng context, rồi mới xử lý log/xoá.
    const videos = Array.from(contextCache.values()).flatMap((ctx) =>
      ctx.pages().map((p) => p.video()).filter((v): v is NonNullable<typeof v> => v !== null)
    );

    for (const context of contextCache.values()) {
      await context.close();
    }

    for (const video of videos) {
      if (testFailed) {
        console.log(`[debug-video] Test fail — video dự phòng: ${await video.path().catch(() => '(không lấy được path)')}`);
      } else {
        // Test pass: không cần giữ video dự phòng, xoá ngay để tránh rác.
        await video.delete().catch(() => {});
      }
    }
  },
});

export { expect } from '@playwright/test';