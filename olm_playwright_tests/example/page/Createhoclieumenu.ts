import { Page, Locator } from '@playwright/test';

/**
 * Map type học liệu (theo data-value trong dropdown "Tạo mới học liệu",
 * khớp với listOptions truyền vào REACT_VIEW_MY_CATEGORIES.initViewMyCategories).
 */
export const HOC_LIEU_TYPE = {
  EXAM_MIXTURE_V2: '21', // Đề kiểm tra
  THEORY: '2', // Lý thuyết tương tác
  VIDEO: '5', // Video Youtube có điểm dừng
  ESSAY: '6', // Đề thi Tự luận
  LINK: '9', // Liên kết
  PDF: '10', // Đề thi trắc nghiệm từ file PDF hoặc Word
  EXAM_STANDARD_MATRIX: '13', // Đề thi trắc nghiệm từ ma trận (đã gộp vào Exam Mixture V2 theo đặc tả)
  EXAM_MIX: '100', // Đề thi trộn Offline
  PRACTICE_MATRIX: '20', // Đề luyện tập trắc nghiệm từ ma trận
  DOCUMENT: '23', // Tài liệu
  SIMULATION: '24', // Mô phỏng, thí nghiệm ảo
  GAME: 'game', // Game hóa
} as const;

export class CreateHocLieuMenu {
  readonly page: Page;
  readonly triggerBtn: Locator;
  readonly menu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.triggerBtn = page.getByRole('button', { name: /Tạo mới học liệu/i });
    this.menu = page.locator('[cmdk-list]');
  }

  async open() {
    await this.triggerBtn.click();
    await this.menu.waitFor({ state: 'visible' });
  }

  itemByValue(value: string): Locator {
    return this.menu.locator(`[cmdk-item][data-value="${value}"]`);
  }

  itemByLabel(label: string | RegExp): Locator {
    return this.menu.getByRole('option', { name: label });
  }

  /** Mở dropdown và chọn loại học liệu cần tạo, trả về Promise điều hướng nếu có */
  async createNew(value: string) {
    await this.open();
    await this.itemByValue(value).click();
  }
}