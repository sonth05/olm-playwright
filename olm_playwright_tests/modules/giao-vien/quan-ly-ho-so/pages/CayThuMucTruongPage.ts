import { BasePage } from '@core/shared-pages/BasePage';
import { CAY_THU_MUC_TRUONG_URL } from '@config/config';

/**
 * Page Object — Cây thư mục (4.1.5).
 * URL: {BASE_URL}/school-files-{SCHOOL_ID}#menu-lesson-plan-tree
 * Cây thư mục cấp trường (khác 4.1.6 — cây thư mục tùy chỉnh của cá nhân).
 *
 * Trang có LAYOUT RIÊNG (không dùng chung header/sidebar #pills-tab của các
 * trang quản trị trường khác) — panel trái tối màu ghi "HỒ SƠ, GIÁO ÁN" +
 * tên trường, panel phải liệt kê thư mục theo TỪNG GIÁO VIÊN của trường
 * (dạng "{STT}. {Họ tên}", icon thư mục), chia thành nhiều cột.
 *
 * NGUỒN THÔNG TIN CHỈ LÀ ẢNH CHỤP MÀN HÌNH (chưa có HTML thực tế khảo sát
 * như 4.1.6) — vì vậy:
 *  - Selector danh sách thư mục giáo viên dưới đây là BEST-EFFORT (bám
 *    theo text hiển thị), CHƯA verify class/id cụ thể của từng item.
 *  - Quan sát được từ status-bar khi hover 1 link: href có dạng
 *    `/school-files-{SCHOOL_ID}/u_{teacherId}` (suy đoán từ URL bị cắt
 *    trong ảnh chụp) — CHƯA verify đầy đủ, cần kiểm tra lại khi có DOM thật.
 */
export class CayThuMucTruongPage extends BasePage {
  static readonly URL = CAY_THU_MUC_TRUONG_URL;

  static readonly SCHOOL_HEADING = 'text=HỒ SƠ, GIÁO ÁN';
  static readonly BREADCRUMB_HOME = 'text=TRANG CHỦ';

  /** Best-effort: mỗi thư mục giáo viên là 1 link dạng "{STT}. {Họ tên}" */
  static readonly TEACHER_FOLDER_LINK = 'a';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(CayThuMucTruongPage.URL);
    await this.waitForSelector(CayThuMucTruongPage.BREADCRUMB_HOME, 15_000);
    return this;
  }

  isLoaded(): boolean {
    return this.getCurrentUrl().includes('school-files-');
  }

  // ==================================================================
  // Danh sách thư mục giáo viên
  // ==================================================================

  /**
   * Danh sách tên hiển thị đầy đủ (kèm số thứ tự, VD: "1. Nguyễn Văn An")
   * của toàn bộ thư mục giáo viên trên trang. Best-effort — xem ghi chú
   * đầu file về việc thiếu HTML thực tế.
   */
  async getTeacherFolderNames(): Promise<string[]> {
    const links = await this.page
      .locator(CayThuMucTruongPage.TEACHER_FOLDER_LINK)
      .filter({ hasText: /^\d+\.\s/ })
      .all();
    const names: string[] = [];
    for (const link of links) {
      names.push(((await link.textContent()) ?? '').trim());
    }
    return names;
  }

  /**
   * Mở thư mục của 1 giáo viên theo tên hiển thị (khớp một phần, VD:
   * "Nguyễn Văn An" khớp cả "1. Nguyễn Văn An"). Best-effort — CHƯA verify
   * trang đích sau khi click (ngoài phạm vi ảnh chụp đã khảo sát).
   */
  async openTeacherFolder(teacherName: string): Promise<this> {
    const link = this.page
      .locator(CayThuMucTruongPage.TEACHER_FOLDER_LINK)
      .filter({ hasText: teacherName })
      .first();
    await this.jsClick(link);
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    return this;
  }
}