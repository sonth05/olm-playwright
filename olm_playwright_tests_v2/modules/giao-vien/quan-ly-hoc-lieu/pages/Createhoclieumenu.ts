import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick, safeFill } from '../../../../core/shared-pages/dismissPopups';

/**
 * Map type học liệu (theo data-value trong dropdown "Tạo mới học liệu",
 * khớp với listOptions truyền vào REACT_VIEW_MY_CATEGORIES.initViewMyCategories).
 *
 * Đối chiếu lại (2026-07-27) với DOM thật của dropdown trên debug.olm.vn (Học
 * liệu của tôi > Tạo mới học liệu):
 * - EXAM_STANDARD_MATRIX (13) "Đề thi trắc nghiệm từ ma trận" VẪN là 1 item
 *   riêng, ĐỘC LẬP với EXAM_MIXTURE_V2 (21) — ghi chú cũ "đã gộp vào Exam
 *   Mixture V2" không còn đúng, đã bỏ. Mô tả phụ của item 21 trong DOM hiện
 *   tại là "Soạn đề hoặc tạo từ ma trận. Tùy chọn hiển thị dạng Đề thi hoặc
 *   Luyện tập." — item 21 tự có chế độ tạo-từ-ma-trận riêng bên trong nó,
 *   không phải là hợp nhất của item 13.
 * - Phát hiện item MỚI chưa có trong map: data-value="18" "Dạng bài, kĩ năng
 *   (NHCH)" — đã thêm bên dưới (khớp DANG_BAI_KY_NANG_NHCH=18 dùng trong V1
 *   CoursewareType/FilterCoursewareType).
 */
export const HOC_LIEU_TYPE = {
  EXAM_MIXTURE_V2: '21', // Đề kiểm tra (soạn đề / tạo từ ma trận, có thể hiển thị dạng Đề thi hoặc Luyện tập)
  NHCH: '18', // Dạng bài, kĩ năng (NHCH)
  THEORY: '2', // Lý thuyết tương tác
  VIDEO: '5', // Video Youtube có điểm dừng
  ESSAY: '6', // Đề thi Tự luận
  LINK: '9', // Liên kết
  PDF: '10', // Đề thi trắc nghiệm từ file PDF hoặc Word
  EXAM_STANDARD_MATRIX: '13', // Đề thi trắc nghiệm từ ma trận
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
    // Kiểm tra + đóng popup ("Xác thực"/"Thay đổi mật khẩu"...) TRƯỚC KHI
    // bấm "Tạo mới học liệu" — đây là điểm vào DÙNG CHUNG cho MỌI loại học
    // liệu (Theory/Video/Essay/Document/Link/Pdf/Exam-mix/Exam-mixture-v2...),
    // nên nếu popup che nút này thì toàn bộ các luồng tạo mới phía sau đều
    // fail hàng loạt dù selector hoàn toàn đúng — đây chính là nguyên nhân
    // gây khá nhiều ca fail rải rác trước đây. listPage.goto() gọi trước đó
    // đã dismiss 1 lần, nhưng vẫn có khoảng hở thời gian giữa lúc đó và lúc
    // gọi open() (chuẩn bị dữ liệu test, đọc DOM khác...) đủ để popup khác
    // xuất hiện lại.
    await dismissPopups(this.page);
    await this.triggerBtn.click();
    await this.menu.waitFor({ state: 'visible' });
    // Đóng thêm 1 lần nữa NGAY SAU KHI menu mở — phòng trường hợp popup xuất
    // hiện đúng lúc menu đang mở (che mất item cần chọn ở bước gọi tiếp
    // theo, VD itemByValue(...).click() trong createNew()).
    await dismissPopups(this.page);
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
    await safeClick(this.page, this.itemByValue(value));
  }

  /** Mở dropdown, chọn loại học liệu, và trả về modal "Tạo <tên loại>" tương ứng đã visible */
  async createNewAndOpenModal(value: string): Promise<CreateMaterialModal> {
    await this.createNew(value);
    const modal = new CreateMaterialModal(this.page);
    await modal.dialog.waitFor({ state: 'visible' });
    return modal;
  }
}

/**
 * Modal "Tạo <loại học liệu>" hiện ra sau khi chọn 1 item trong CreateHocLieuMenu
 * (VD: chọn "Đề kiểm tra" -> modal tiêu đề "Tạo Đề kiểm tra"). Cấu trúc modal dùng
 * chung cho các loại học liệu "học liệu tự do" (Đề kiểm tra, Lý thuyết tương tác,
 * Video, Tự luận, Liên kết, Tài liệu...): Tiêu đề*, Mô tả, Khối lớp*, Môn học*,
 * và khối SEO (Từ khóa/Tiêu đề/Mô tả SEO) — đối chiếu từ DOM thật của modal
 * "Tạo Đề kiểm tra" (2026-07-27). Popover chọn Khối lớp/Môn học (search-combobox
 * có ô "Tìm kiếm...") cũng đã đối chiếu bằng ảnh chụp DOM thật (2026-07-28).
 */
export class CreateMaterialModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleHeading: Locator;
  readonly titleInput: Locator; // Tiêu đề học liệu *
  readonly descriptionInput: Locator; // Mô tả học liệu
  readonly gradeSelectBtn: Locator; // Khối lớp: *
  readonly subjectSelectBtn: Locator; // Môn học: *
  readonly seoKeywordInput: Locator; // Từ khóa SEO
  readonly seoTitleInput: Locator; // Tiêu đề SEO (tối đa 60 ký tự)
  readonly seoDescriptionInput: Locator; // Mô tả SEO (tối đa 160 ký tự)
  readonly btnCancel: Locator; // Hủy
  readonly btnSubmit: Locator; // Tạo
  readonly btnClose: Locator; // nút "X" đóng modal

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.titleHeading = this.dialog.locator('h2');
    this.titleInput = this.dialog.getByPlaceholder('Nhập tiêu đề');
    this.descriptionInput = this.dialog.getByPlaceholder('Nhập mô tả');
    // QUAN TRỌNG: KHÔNG dùng getByRole('button', { name: /Chọn khối lớp/i })
    // — tên hiển thị (và do đó accessible name) của nút này ĐỔI thành chính
    // giá trị đã chọn sau khi bấm (VD "Lớp 12"), đã xác nhận bằng DOM thật
    // (2026-07-28). Nếu bind theo tên placeholder, locator sẽ KHÔNG re-match
    // được nữa sau khi đã chọn giá trị (mọi lần gọi lại .click()/.innerText()
    // phía sau sẽ ra rỗng). Dùng vị trí ổn định thay thế: trong toàn bộ
    // dialog, chỉ có đúng 2 nút aria-haspopup="dialog" là Khối lớp (thứ nhất)
    // và Môn học (thứ hai) — nút "Tạo mới học liệu" cũng có thuộc tính này
    // nhưng nằm ngoài dialog nên không lẫn vào đây.
    this.gradeSelectBtn = this.dialog.locator('button[aria-haspopup="dialog"]').nth(0);
    this.subjectSelectBtn = this.dialog.locator('button[aria-haspopup="dialog"]').nth(1);
    this.seoKeywordInput = this.dialog.getByPlaceholder('Nhập từ khóa SEO');
    this.seoTitleInput = this.dialog.getByPlaceholder('Nhập tiêu đề SEO');
    this.seoDescriptionInput = this.dialog.getByPlaceholder('Nhập mô tả SEO');
    this.btnCancel = this.dialog.getByRole('button', { name: /^Hủy$/i });
    this.btnSubmit = this.dialog.getByRole('button', { name: /^Tạo$/i });
    this.btnClose = this.dialog.getByRole('button', { name: /Đóng/i });
  }

  async expectTitle(expected: string | RegExp) {
    await expect(this.titleHeading).toHaveText(expected);
  }

  async fillTitle(title: string) {
    await safeFill(this.page, this.titleInput, title);
  }

  async fillDescription(description: string) {
    await safeFill(this.page, this.descriptionInput, description);
  }

  /**
   * Chọn Khối lớp — dropdown custom dạng "search-combobox" (Radix Popover,
   * KHÔNG phải <select> HTML như bản V1). Đã xác nhận bằng DOM thật
   * (2026-07-28, ảnh chụp lúc popover mở): popover có ô tìm kiếm placeholder
   * "Tìm kiếm..." (icon kính lúp) ở trên cùng, bên dưới là danh sách cuộn
   * (Mẫu giáo, Lớp 1..Lớp 12...) — mục đầu tiên được highlight sẵn (focus
   * mặc định, KHÔNG phải đã "chọn"). Vì danh sách dài (VD "Lớp 12" nằm dưới
   * "Lớp 10" ngoài màn hình ban đầu), gõ vào ô tìm kiếm để lọc trước khi bấm
   * chọn thay vì cuộn tay — ổn định hơn nhiều so với chỉ .click() thẳng vào
   * option có thể chưa render/còn ngoài viewport của danh sách cuộn.
   */
  async selectGrade(label: string | RegExp) {
    await safeClick(this.page, this.gradeSelectBtn);
    await this.searchInPopover(label);
    await safeClick(this.page, this.page.getByRole('option', { name: label }));
    // Xác nhận nút đã cập nhật nhãn (không còn "Chọn khối lớp") — khớp DOM
    // thật đã capture sau khi chọn, đồng thời chờ popover đóng hẳn trước khi
    // thao tác tiếp (VD mở Môn học ngay sau đó).
    await expect(this.gradeSelectBtn.locator('span').first()).toHaveText(label);
  }

  /** Chọn Môn học — cùng cơ chế search-combobox popover, xem docblock selectGrade(). */
  async selectSubject(label: string | RegExp) {
    await safeClick(this.page, this.subjectSelectBtn);
    await this.searchInPopover(label);
    await safeClick(this.page, this.page.getByRole('option', { name: label }));
    await expect(this.subjectSelectBtn.locator('span').first()).toHaveText(label);
  }

  /**
   * Gõ vào ô tìm kiếm ("Tìm kiếm...") của popover Khối lớp/Môn học đang mở để
   * lọc danh sách trước khi chọn. Popover được render qua Portal (nằm ngoài
   * this.dialog trong DOM — khớp với ảnh chụp cho thấy popover tràn ra ngoài
   * biên modal), nên dùng this.page (không scope theo dialog). Chỉ gõ khi
   * label là string thuần; nếu là RegExp, dùng .source làm chuỗi tìm kiếm —
   * các RegExp dùng trong project này (VD /Lớp 12/i, /Toán/i) đều là văn bản
   * thường không chứa ký tự đặc biệt của regex nên an toàn khi dùng trực
   * tiếp làm query tìm kiếm.
   */
  private async searchInPopover(label: string | RegExp) {
    const query = typeof label === 'string' ? label : label.source;
    const searchInput = this.page.getByPlaceholder('Tìm kiếm...');
    await searchInput.waitFor({ state: 'visible' });
    await safeFill(this.page, searchInput, query);
  }

  /**
   * Đọc/xác nhận nhãn hiện tại trên nút "Khối lớp"/"Môn học". Đã xác nhận
   * bằng DOM thật (2026-07-28, sau khi chọn "Lớp 12"/"Toán"): nút KHÔNG còn
   * hiển thị placeholder ("Chọn khối lớp"/"Chọn môn học") nữa — span đầu
   * tiên bên trong nút (class tw-flex-1 tw-truncate...) đổi nội dung thành
   * chính giá trị đã chọn. Vì accessible name của nút đổi theo giá trị chọn,
   * gradeSelectBtn/subjectSelectBtn (đã bind theo tên placeholder lúc khởi
   * tạo) VẪN dùng lại được để đọc span con hiện tại — Locator của Playwright
   * luôn truy vấn lại DOM khi dùng, không bị "đông cứng" theo tên cũ.
   */
  async selectedGradeText(): Promise<string> {
    return (await this.gradeSelectBtn.locator('span').first().innerText()).trim();
  }

  /** Nhãn hiện tại của nút Môn học (placeholder hoặc giá trị đã chọn, VD "Toán") */
  async selectedSubjectText(): Promise<string> {
    return (await this.subjectSelectBtn.locator('span').first().innerText()).trim();
  }

  /** Xác nhận Khối lớp đã được chọn đúng giá trị (nút không còn hiện placeholder) */
  async expectGradeSelected(expected: string | RegExp) {
    await expect(this.gradeSelectBtn.locator('span').first()).toHaveText(expected);
  }

  /** Xác nhận Môn học đã được chọn đúng giá trị (nút không còn hiện placeholder) */
  async expectSubjectSelected(expected: string | RegExp) {
    await expect(this.subjectSelectBtn.locator('span').first()).toHaveText(expected);
  }

  async fillSeoKeyword(keyword: string) {
    await safeFill(this.page, this.seoKeywordInput, keyword);
  }

  /** Tiêu đề SEO giới hạn 60 ký tự (maxlength trên input) */
  async fillSeoTitle(seoTitle: string) {
    await safeFill(this.page, this.seoTitleInput, seoTitle);
  }

  /** Mô tả SEO giới hạn 160 ký tự (maxlength trên textarea) */
  async fillSeoDescription(seoDescription: string) {
    await safeFill(this.page, this.seoDescriptionInput, seoDescription);
  }

  /** Điền các trường bắt buộc (Tiêu đề, Khối lớp, Môn học) rồi bấm "Tạo" */
  async fillRequiredAndSubmit(options: { title: string; grade: string | RegExp; subject: string | RegExp }) {
    await this.fillTitle(options.title);
    await this.selectGrade(options.grade);
    await this.selectSubject(options.subject);
    await this.submit();
  }

  async submit() {
    await safeClick(this.page, this.btnSubmit);
  }

  async cancel() {
    await safeClick(this.page, this.btnCancel);
  }

  async close() {
    await safeClick(this.page, this.btnClose);
  }
}