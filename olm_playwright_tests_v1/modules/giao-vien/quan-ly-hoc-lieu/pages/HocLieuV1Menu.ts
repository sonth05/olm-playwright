import type { Page } from '@playwright/test';
import { BasePage } from '../../../../core/shared-pages/BasePage';

/**
 * HocLieuV1Menu.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Dropdown "Học liệu" ở góc phải thanh công cụ trang quản lý bài học (thấy
 * trong nền các ảnh popup 10-16: "...m bài học, bài tập, mã lớp, mã khóa
 * học..." + dropdown "Học liệu"). Click mở dropdown sẽ hiện danh sách các
 * loại học liệu, mỗi item click vào mở đúng popup V1 tương ứng (xem
 * HocLieuV1Constants.ts để biết danh sách headerTitle từng loại).
 *
 * TODO: TRIGGER_BTN suy ra từ ảnh chụp (chưa có HTML thật) — cập nhật lại
 * nếu class/testid thật khác. Nếu trang có sẵn danh sách item trong DOM mà
 * KHÔNG cần click mở dropdown trước (item hiện sẵn khi trang load), bỏ qua
 * bước open() và gọi thẳng clickMaterial().
 */
export class HocLieuV1Menu extends BasePage {
  static readonly TRIGGER_BTN = [
    'button:has-text("Học liệu")',
    'select:has-text("Học liệu")',
    '[aria-haspopup]:has-text("Học liệu")',
  ];

  constructor(page: Page) {
    super(page);
  }

  /** Mở dropdown "Học liệu" nếu đang đóng */
  async open(): Promise<void> {
    const trigger = await this.findVisible(HocLieuV1Menu.TRIGGER_BTN, 5);
    if (!trigger) throw new Error('Không tìm thấy dropdown/nút "Học liệu"');
    await this.jsClick(trigger);
  }

  /** Click vào item đúng loại học liệu (headerTitle, VD: 'Đề thi THPT') để mở popup tạo */
  async clickMaterial(headerTitle: string): Promise<void> {
    const item = this.page.getByText(headerTitle, { exact: true }).first();
    await item.waitFor({ state: 'visible', timeout: 5_000 });
    await this.jsClick(item);
  }

  /** Mở dropdown rồi chọn thẳng loại học liệu cần tạo */
  async openMaterialPopup(headerTitle: string): Promise<void> {
    await this.open();
    await this.clickMaterial(headerTitle);
  }
}