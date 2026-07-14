import { BasePage } from '@core/shared-pages/BasePage';
import { QUAN_LY_DUNG_LUONG_TRUONG_URL } from '@config/config';

/**
 * Page Object — Quản lý dung lượng trường (5.1.5).
 * URL: {BASE_URL}/truong-hoc/{slug}/thong-ke-dung-luong-truong#menu-quan-ly-dung-luong-truong
 *
 * CHÚ Ý: cùng kiến trúc React/Tailwind (`tw-` prefix) như DongBoCsdlNganhPage
 * — KHÔNG dùng class Bootstrap của các trang 5.1.1/5.1.3/5.1.4. Trang thuần
 * hiển thị số liệu (read-only), không có form/hành động ghi dữ liệu.
 *
 * Bố cục 3 card hàng đầu:
 *   1. "Tổng dung lượng đã sử dụng" — số đã dùng / giới hạn / % / còn lại
 *      + progress bar (width% inline style).
 *   2. "Tổng số file" — tổng số file đã upload.
 *   3. "Phân bổ dung lượng" — 3 nhóm: Tài liệu / Hình ảnh / Khác, mỗi nhóm
 *      chỉ có SỐ LƯỢNG FILE (không có dung lượng riêng từng nhóm trong DOM).
 * Bên dưới là bảng "Người dùng sử dụng nhiều dung lượng nhất" (sắp xếp giảm
 * dần theo dung lượng) — tbody RỖNG khi trường chưa có ai dùng dung lượng
 * (như ảnh mẫu, trường mới nên toàn 0) — getTopUsers() trả về [] trong
 * trường hợp này, không throw.
 *
 * Dùng kết hợp:
 *   const page = new QuanLyDungLuongTruongPage(p);
 *   await page.open();
 *   const summary = await page.getStorageSummary();
 *   const users = await page.getTopUsers();
 */

export interface StorageSummary {
  /** VD: "0 B" — chuỗi nguyên văn kèm đơn vị, KHÔNG parse ra số vì đơn vị đổi tuỳ độ lớn (B/KB/MB/GB) */
  used: string;
  /** VD: "10 GB" — giới hạn dung lượng của trường */
  limit: string;
  /** % đã dùng, parse từ "0% đã sử dụng" */
  percentUsed: number;
  /** VD: "10 GB còn lại" */
  remainingText: string;
  totalFiles: number;
  /** Số lượng file theo loại — KHÔNG có dung lượng riêng từng loại trong DOM, chỉ có count */
  fileCountByType: {
    taiLieu: number;
    hinhAnh: number;
    khac: number;
  };
}

export interface TopStorageUserRow {
  stt: number;
  nguoiDung: string;
  soFile: number;
  /** VD: "120 MB" — giữ nguyên chuỗi kèm đơn vị như hiển thị */
  dungLuong: string;
}

export class QuanLyDungLuongTruongPage extends BasePage {
  static readonly URL = QUAN_LY_DUNG_LUONG_TRUONG_URL;

  // ── Heading ───────────────────────────────────────────────────────────────
  static readonly HEADING = "h3:has-text('Thống kê dung lượng trường học')";

  // ── Card 1: Tổng dung lượng đã sử dụng ──────────────────────────────────
  static readonly CARD_TONG_DUNG_LUONG = "div:has(p:has-text('Tổng dung lượng đã sử dụng'))";
  static readonly TONG_DUNG_LUONG_VALUE = `${QuanLyDungLuongTruongPage.CARD_TONG_DUNG_LUONG} h4`;
  static readonly TONG_DUNG_LUONG_LIMIT = `${QuanLyDungLuongTruongPage.CARD_TONG_DUNG_LUONG} span:has-text('Giới hạn')`;
  static readonly TONG_DUNG_LUONG_PERCENT = `${QuanLyDungLuongTruongPage.CARD_TONG_DUNG_LUONG} span:has-text('đã sử dụng')`;
  static readonly TONG_DUNG_LUONG_REMAINING = `${QuanLyDungLuongTruongPage.CARD_TONG_DUNG_LUONG} span:has-text('còn lại')`;
  static readonly TONG_DUNG_LUONG_PROGRESS_BAR = `${QuanLyDungLuongTruongPage.CARD_TONG_DUNG_LUONG} .tw-bg-blue-600`;

  // ── Card 2: Tổng số file ──────────────────────────────────────────────────
  static readonly CARD_TONG_SO_FILE = "div:has(p:has-text('Tổng số file'))";
  static readonly TONG_SO_FILE_VALUE = `${QuanLyDungLuongTruongPage.CARD_TONG_SO_FILE} h4`;

  // ── Card 3: Phân bổ dung lượng ───────────────────────────────────────────
  static readonly CARD_PHAN_BO = "div:has(p:has-text('Phân bổ dung lượng'))";
  static readonly PHAN_BO_TAI_LIEU_VALUE = `${QuanLyDungLuongTruongPage.CARD_PHAN_BO} div:has-text('Tài liệu') .tw-text-sm.tw-font-bold`;
  static readonly PHAN_BO_HINH_ANH_VALUE = `${QuanLyDungLuongTruongPage.CARD_PHAN_BO} div:has-text('Hình ảnh') .tw-text-sm.tw-font-bold`;
  static readonly PHAN_BO_KHAC_VALUE = `${QuanLyDungLuongTruongPage.CARD_PHAN_BO} div:has-text('Khác') .tw-text-sm.tw-font-bold`;

  // ── Bảng "Người dùng sử dụng nhiều dung lượng nhất" ─────────────────────
  static readonly TABLE_HEADING = "h4:has-text('Người dùng sử dụng nhiều dung lượng nhất')";
  static readonly TABLE_ROWS = 'table tbody tr';

  // ==================================================================
  // Điều hướng
  // ==================================================================

  async open(): Promise<this> {
    await this.navigateTo(QuanLyDungLuongTruongPage.URL);
    return this;
  }

  isPageLoaded(): boolean {
    return this.getCurrentUrl().includes('thong-ke-dung-luong-truong');
  }

  async waitForSummaryVisible(timeoutMs = 10_000): Promise<boolean> {
    return this.waitForSelector(QuanLyDungLuongTruongPage.HEADING, timeoutMs);
  }

  // ==================================================================
  // Đọc số liệu tổng quan (3 card đầu trang)
  // ==================================================================

  async getStorageSummary(): Promise<StorageSummary> {
    const used = ((await this.page.locator(QuanLyDungLuongTruongPage.TONG_DUNG_LUONG_VALUE).textContent()) ?? '').trim();
    const limitRaw = ((await this.page.locator(QuanLyDungLuongTruongPage.TONG_DUNG_LUONG_LIMIT).textContent()) ?? '').trim();
    const limit = limitRaw.replace(/^Giới hạn\s*/i, '').trim();

    const percentRaw = ((await this.page.locator(QuanLyDungLuongTruongPage.TONG_DUNG_LUONG_PERCENT).textContent()) ?? '').trim();
    const percentUsed = Number(percentRaw.replace(/[^\d.]/g, '')) || 0;

    const remainingText = ((await this.page.locator(QuanLyDungLuongTruongPage.TONG_DUNG_LUONG_REMAINING).textContent()) ?? '').trim();

    const totalFilesRaw = ((await this.page.locator(QuanLyDungLuongTruongPage.TONG_SO_FILE_VALUE).textContent()) ?? '').trim();
    const totalFiles = Number(totalFilesRaw.replace(/[^\d]/g, '')) || 0;

    const taiLieu = await this._readPhanBoCount(QuanLyDungLuongTruongPage.PHAN_BO_TAI_LIEU_VALUE);
    const hinhAnh = await this._readPhanBoCount(QuanLyDungLuongTruongPage.PHAN_BO_HINH_ANH_VALUE);
    const khac = await this._readPhanBoCount(QuanLyDungLuongTruongPage.PHAN_BO_KHAC_VALUE);

    return {
      used,
      limit,
      percentUsed,
      remainingText,
      totalFiles,
      fileCountByType: { taiLieu, hinhAnh, khac },
    };
  }

  /** % width của progress bar dung lượng — đọc trực tiếp từ style="width: N%" để cross-check với percentUsed hiển thị bằng text */
  async getProgressBarPercent(): Promise<number> {
    const style = (await this.page.locator(QuanLyDungLuongTruongPage.TONG_DUNG_LUONG_PROGRESS_BAR).getAttribute('style')) ?? '';
    const match = style.match(/width:\s*([\d.]+)%/);
    return match ? Number(match[1]) : 0;
  }

  private async _readPhanBoCount(selector: string): Promise<number> {
    const raw = ((await this.page.locator(selector).textContent()) ?? '').trim();
    return Number(raw.replace(/[^\d]/g, '')) || 0;
  }

  // ==================================================================
  // Bảng "Người dùng sử dụng nhiều dung lượng nhất"
  // ==================================================================

  /** true nếu bảng chưa có dữ liệu (tbody rỗng — trường chưa phát sinh dung lượng) */
  async isTopUsersTableEmpty(): Promise<boolean> {
    return (await this.page.locator(QuanLyDungLuongTruongPage.TABLE_ROWS).count()) === 0;
  }

  /** Đọc toàn bộ bảng "Người dùng sử dụng nhiều dung lượng nhất". Trả về [] nếu trường chưa có dữ liệu. */
  async getTopUsers(): Promise<TopStorageUserRow[]> {
    const rows = await this.page.locator(QuanLyDungLuongTruongPage.TABLE_ROWS).all();
    const result: TopStorageUserRow[] = [];

    for (const row of rows) {
      const cells = row.locator('td');
      const stt = Number(((await cells.nth(0).textContent()) ?? '').trim()) || 0;
      const nguoiDung = ((await cells.nth(1).textContent()) ?? '').trim();
      const soFile = Number(((await cells.nth(2).textContent()) ?? '').replace(/[^\d]/g, '')) || 0;
      const dungLuong = ((await cells.nth(3).textContent()) ?? '').trim();

      result.push({ stt, nguoiDung, soFile, dungLuong });
    }
    return result;
  }
}