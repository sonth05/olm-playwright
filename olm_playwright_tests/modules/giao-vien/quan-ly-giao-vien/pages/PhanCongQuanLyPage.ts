import { BasePage } from '@core/shared-pages/BasePage';
import { PHAN_CONG_QUAN_LY_URL } from '@config/config';

/**
 * Page Object — Phân công quản lý (1.1.3).
 * URL: {BASE_URL}/truong-hoc/{slug}/phan-cong-quan-ly
 *
 * Trang gồm 2 phần:
 *  A) Thanh điều hướng dùng chung của khu vực quản trị trường (Giới thiệu /
 *     Giáo viên / Thống kê / Lớp học / Khóa học / Thống kê dung lượng /
 *     Bài đã giao / Nâng lớp / Điểm danh / Xếp TKB / Thảo luận trong trường)
 *     — chung UI với các trang quản trị trường khác (VD:
 *     PhanCongGiangDayPage), KHÔNG lặp lại logic ở đây ngoài phần điều
 *     hướng tối thiểu (switchAdminTab).
 *  B) Bảng "Danh sách quyền giáo viên" — có <select> đầu trang chọn 1
 *     trong 2 chế độ xem:
 *       - value="false" — "Phân quyền theo từng giáo viên" (MẶC ĐỊNH):
 *         mỗi dòng 1 giáo viên, 5 cột: STT / Họ và tên / Tên đăng nhập /
 *         "Danh sách quyền" (nút "Chỉnh sửa" — mở modal phân quyền, NGOÀI
 *         PHẠM VI page object này) / Thời gian tạo.
 *       - value="true" — "Phân quyền theo nhóm giáo viên": DOM bảng đổi
 *         cấu trúc theo nhóm, CHƯA khảo sát HTML thực tế — nếu cần thao
 *         tác chi tiết ở chế độ này, bổ sung selector riêng sau.
 *
 * Dùng kết hợp:
 *   const page = new PhanCongQuanLyPage(p);
 *   await page.open();
 *   const rows = await page.getPermissionRows();
 *   await page.clickEditPermission(rows[0].username);
 */

/** Tab điều hướng dùng chung ở đầu các trang quản trị trường */
export enum SchoolAdminTab {
  GIOI_THIEU = 'Giới thiệu',
  GIAO_VIEN = 'Giáo viên',
  THONG_KE = 'Thống kê',
  LOP_HOC = 'Lớp học',
  KHOA_HOC = 'Khóa học',
  THONG_KE_DUNG_LUONG = 'Thống kê dung lượng',
  BAI_DA_GIAO = 'Bài đã giao',
  NANG_LOP = 'Nâng lớp',
  DIEM_DANH = 'Điểm danh',
  XEP_TKB = 'Xếp TKB',
  THAO_LUAN_TRONG_TRUONG = 'Thảo luận trong trường',
}

/** Chế độ xem của <select> đầu trang (giá trị đúng theo attribute value gốc) */
export enum PermissionViewMode {
  THEO_GIAO_VIEN = 'false',
  THEO_NHOM = 'true',
}

export interface TeacherPermissionRow {
  stt: number;
  fullName: string;
  username: string;
  createdAt: string;
}

export class PhanCongQuanLyPage extends BasePage {
  static readonly URL = PHAN_CONG_QUAN_LY_URL;

  // ── Thanh điều hướng dùng chung ──────────────────────────────────────
  static readonly ADMIN_TAB_NAV = '#pills-tab';
  static readonly ADMIN_TAB_LINK = '#pills-tab li a';

  // ── Header trang ──────────────────────────────────────────────────────
  static readonly PAGE_TITLE = "h3:has-text('Danh sách quyền giáo viên')";
  static readonly PAGE_SUBTITLE = "p.text-muted:has-text('Xem quyền hạn hiện tại')";
  static readonly VIEW_MODE_SELECT =
    "select:has(option:has-text('Phân quyền theo từng giáo viên'))";

  // ── Bảng quyền ────────────────────────────────────────────────────────
  static readonly TABLE = 'table.table-striped.table-bordered.table-hover';
  static readonly TABLE_ROWS = `${PhanCongQuanLyPage.TABLE} tbody > tr`;
  static readonly ROW_EDIT_BTN = "button:has-text('Chỉnh sửa')";

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(PhanCongQuanLyPage.URL);
    await this.waitForSelector(PhanCongQuanLyPage.TABLE, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('phan-cong-quan-ly');
  }

  async getTitle(): Promise<string> {
    const el = await this.findVisible([PhanCongQuanLyPage.PAGE_TITLE], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  async getSubtitle(): Promise<string> {
    const el = await this.findVisible([PhanCongQuanLyPage.PAGE_SUBTITLE], 8);
    return el ? ((await el.textContent()) ?? '').trim() : '';
  }

  /** Chuyển sang 1 tab khác trong thanh điều hướng quản trị trường (xem PhanCongGiangDayPage) */
  async switchAdminTab(tab: SchoolAdminTab): Promise<this> {
    const link = this.page.locator(PhanCongQuanLyPage.ADMIN_TAB_LINK).filter({ hasText: tab }).first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // Chế độ xem (theo từng giáo viên / theo nhóm giáo viên)
  // ==================================================================

  async setViewMode(mode: PermissionViewMode): Promise<this> {
    const select = this.page.locator(PhanCongQuanLyPage.VIEW_MODE_SELECT).first();
    await select.selectOption(mode);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }

  async getViewMode(): Promise<PermissionViewMode> {
    const select = this.page.locator(PhanCongQuanLyPage.VIEW_MODE_SELECT).first();
    return (await select.inputValue()) as PermissionViewMode;
  }

  // ==================================================================
  // Bảng "Phân quyền theo từng giáo viên" (chế độ mặc định)
  // ==================================================================

  /**
   * Toàn bộ dòng trong bảng, theo đúng thứ tự hiển thị.
   * CHỈ đúng khi đang ở chế độ THEO_GIAO_VIEN (mặc định) — DOM bảng ở chế
   * độ THEO_NHOM chưa được khảo sát nên không dùng hàm này cho chế độ đó.
   */
  async getPermissionRows(): Promise<TeacherPermissionRow[]> {
    const rows = await this.page.locator(PhanCongQuanLyPage.TABLE_ROWS).all();
    const result: TeacherPermissionRow[] = [];

    for (const row of rows) {
      const cells = row.locator('td');
      const cellCount = await cells.count();
      if (cellCount < 5) continue; // dòng không đúng cấu trúc (VD: "Không có dữ liệu")

      const stt = parseInt(((await cells.nth(0).textContent()) ?? '').trim(), 10) || 0;
      const fullName = ((await cells.nth(1).textContent()) ?? '').trim();
      const username = ((await cells.nth(2).textContent()) ?? '').trim();
      const createdAt = ((await cells.nth(4).textContent()) ?? '').trim();

      result.push({ stt, fullName, username, createdAt });
    }
    return result;
  }

  async getPermissionRowCount(): Promise<number> {
    return (await this.getPermissionRows()).length;
  }

  /** Tìm 1 dòng theo tên đăng nhập (khớp chính xác) */
  async findRowByUsername(username: string): Promise<TeacherPermissionRow | null> {
    const rows = await this.getPermissionRows();
    return rows.find((r) => r.username === username) ?? null;
  }

  /** Tìm 1 dòng theo họ và tên (khớp 1 phần) */
  async findRowByName(namePart: string): Promise<TeacherPermissionRow | null> {
    const rows = await this.getPermissionRows();
    return rows.find((r) => r.fullName.includes(namePart)) ?? null;
  }

  private _rowByUsername(username: string) {
    return this.page.locator(PhanCongQuanLyPage.TABLE_ROWS).filter({ hasText: username }).first();
  }

  /** Bấm "Chỉnh sửa" ở dòng của 1 giáo viên — mở modal phân quyền (ngoài phạm vi page object này) */
  async clickEditPermission(username: string): Promise<this> {
    const btn = this._rowByUsername(username).locator(PhanCongQuanLyPage.ROW_EDIT_BTN).first();
    await this.jsClick(btn);
    return this;
  }
}