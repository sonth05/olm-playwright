import { BasePage } from '@core/shared-pages/BasePage';
import { THIET_LAP_MON_HOC_URL } from '@config/config';

/**
 * Page Object — Thiết lập môn học (5.1.4).
 * URL: {BASE_URL}/truong-hoc/{slug}/thiet-lap-mon-hoc#menu-thiet-lap-mon-hoc
 *
 * Trang gồm 3 tab con (`.o-tabs-box`): "Toàn trường" (mặc định, DUY NHẤT
 * tab đã triển khai đầy đủ ở đây) / "Theo lớp" / "Khóa/Mở khóa nhập điểm".
 *
 * Tab "Toàn trường" hiển thị bảng 2 cột (Tên môn / Khối áp dụng) — cột
 * "Khối áp dụng" là chuỗi số khối phân cách bởi dấu phẩy KHÔNG có khoảng
 * trắng (VD: "1,2,3,4,5,6,7,8,9,10,11,12"), một số môn đặc thù mầm non
 * (Mầm non, Chữ cái, Khám phá, Tạo hình, Giá trị sống, Cảm xúc, Stem) có
 * ô "Khối áp dụng" RỖNG — cần xử lý rỗng thay vì lỗi khi parse thành mảng số.
 * Mỗi dòng có icon bút chì (không có text) để sửa — dùng `clickEditSubject()`.
 *
 * Dùng kết hợp:
 *   const page = new ThietLapMonHocPage(p);
 *   await page.open();
 *   const list = await page.getSubjectList();
 *   const toan = list.find(s => s.name === 'Toán');
 */

export type MonHocTab = 'toanTruong' | 'theoLop' | 'khoaMoKhoaNhapDiem';

export interface SubjectInfo {
  name: string;
  /** Danh sách khối áp dụng dạng số, VD: [1,2,3]. Rỗng nếu môn không gắn khối cụ thể (VD: môn mầm non). */
  grades: number[];
}

export class ThietLapMonHocPage extends BasePage {
  static readonly URL = THIET_LAP_MON_HOC_URL;

  // ── Tabs ─────────────────────────────────────────────────────────────────
  private static readonly TAB_LABEL: Record<MonHocTab, string> = {
    toanTruong: 'Toàn trường',
    theoLop: 'Theo lớp',
    khoaMoKhoaNhapDiem: 'Khóa/Mở khóa nhập điểm',
  };
  private static tabSelector(tab: MonHocTab): string {
    return `.o-tabs-box li.tab:has-text("${ThietLapMonHocPage.TAB_LABEL[tab]}")`;
  }

  // ── Toolbar / heading ────────────────────────────────────────────────────
  static readonly HEADING = "h3:has-text('Danh sách môn học')";
  static readonly LINK_XEM_VIDEO = "a:has-text('Xem video hướng dẫn')";
  static readonly BTN_THEM_BOT_MON = "button:has-text('Thêm/bớt môn')";

  // ── Bảng môn học (tab Toàn trường) ───────────────────────────────────────
  static readonly TABLE_ROWS = 'table tbody tr';
  static readonly EDIT_ICON_IN_ROW = 'i.fa-edit';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(ThietLapMonHocPage.URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('thiet-lap-mon-hoc');
  }

  async waitForTableVisible(timeoutMs = 10_000): Promise<boolean> {
    return this.waitForSelector(ThietLapMonHocPage.HEADING, timeoutMs);
  }

  // ==================================================================
  // Tabs
  // ==================================================================

  async switchTab(tab: MonHocTab): Promise<this> {
    await this.page.locator(ThietLapMonHocPage.tabSelector(tab)).click();
    return this;
  }

  /** Đọc tab đang active (class 'active' trên <li class="tab active">) */
  async getActiveTab(): Promise<MonHocTab | null> {
    for (const tab of Object.keys(ThietLapMonHocPage.TAB_LABEL) as MonHocTab[]) {
      const classAttr = (await this.page.locator(ThietLapMonHocPage.tabSelector(tab)).getAttribute('class')) ?? '';
      if (classAttr.includes('active')) return tab;
    }
    return null;
  }

  // ==================================================================
  // Bảng "Danh sách môn học" (tab Toàn trường)
  // ==================================================================

  async clickThemBotMon(): Promise<this> {
    await this.page.locator(ThietLapMonHocPage.BTN_THEM_BOT_MON).click();
    return this;
  }

  /** Tổng số môn học đang hiển thị trong bảng */
  async getSubjectCount(): Promise<number> {
    return this.page.locator(ThietLapMonHocPage.TABLE_ROWS).count();
  }

  /**
   * Đọc toàn bộ danh sách môn học + khối áp dụng.
   * Cột "Khối áp dụng" chứa cả icon edit lồng trong <span> — dùng
   * page.evaluate lấy riêng text node đầu (trước <span>) để KHÔNG dính
   * text thừa từ icon, thay vì .textContent() dễ lẫn nếu icon library
   * đổi sang có text (VD: font ligature).
   */
  async getSubjectList(): Promise<SubjectInfo[]> {
    const rows = await this.page.locator(ThietLapMonHocPage.TABLE_ROWS).all();
    const result: SubjectInfo[] = [];

    for (const row of rows) {
      const name = ((await row.locator('td').nth(0).textContent()) ?? '').trim();
      const gradeCell = row.locator('td').nth(1);
      const rawGrades = await gradeCell
        .evaluate((el) => {
          // Lấy text node trực tiếp của <td>, bỏ qua <span> chứa icon edit lồng bên trong
          let text = '';
          el.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? '';
          });
          return text.trim();
        })
        .catch(async () => ((await gradeCell.textContent()) ?? '').trim());

      const grades = rawGrades
        ? rawGrades
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
            .map(Number)
        : [];

      result.push({ name, grades });
    }
    return result;
  }

  /** Tìm 1 môn theo tên chính xác (trả về null nếu không có) */
  async getSubjectByName(name: string): Promise<SubjectInfo | null> {
    const list = await this.getSubjectList();
    return list.find((s) => s.name === name) ?? null;
  }

  /** Bấm icon sửa (bút chì) ở dòng ứng với tên môn */
  async clickEditSubject(name: string): Promise<this> {
    const row = this.page.locator(ThietLapMonHocPage.TABLE_ROWS).filter({ hasText: name }).first();
    await row.locator(ThietLapMonHocPage.EDIT_ICON_IN_ROW).click();
    return this;
  }
}