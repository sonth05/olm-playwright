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

type Fixtures = {
  /** Trả về 1 Page đã đăng nhập đúng vai trò yêu cầu, tái sử dụng trong cùng 1 test nếu gọi lại với cùng role */
  getPageAsRole: (role: V2Role) => Promise<Page>;
};

export const test = base.extend<Fixtures>({
  getPageAsRole: async ({ browser }, use) => {
    const contextCache = new Map<V2Role, BrowserContext>();

    const getPageAsRole = async (role: V2Role): Promise<Page> => {
  let context = contextCache.get(role);

  if (!context) {
    context = await browser.newContext({
      storageState: STORAGE_STATE_BY_ROLE[role],

      // Thêm để kiểm tra
      recordVideo: {
        dir: 'reports/debug-video',
      },
    });

    contextCache.set(role, context);
  }

  const page = await context.newPage();
  return patchGotoWithV2(page);
};

    await use(getPageAsRole);

    for (const context of contextCache.values()) {
    const pages = context.pages();

    for (const page of pages) {
        console.log('Video path:', await page.video()?.path());
    }

    await context.close();
}
  },
});

export { expect } from '@playwright/test';