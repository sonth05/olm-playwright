import { Page, Locator, expect } from '@playwright/test';
import { dismissPopups, safeClick, safeFill } from '../../../../core/shared-pages/dismissPopups';

export type MaterialStatusTab = 'all' | 'published' | 'unpublished';

/**
 * Value data-value của popover lọc "Loại học liệu" trên trang "Học liệu của
 * tôi" (V2) — đối chiếu từ DOM thật (2026-08-04, ảnh chụp popover đang mở):
 * -1 = "Tất cả loại học liệu" (mặc định), sau đó 20 loại.
 *
 * KHÔNG dùng lại `FilterCoursewareType` (khai báo trong HocLieuCuaToiPageV1.ts
 * cho bản V1, `<select id="type">`) dù phần lớn giá trị trùng nhau — vì popover
 * V2 CÓ THÊM mục "Mô phỏng, thí nghiệm ảo" (data-value=24) mà chính docblock
 * của FilterCoursewareType (V1) đã ghi chú rõ là "KHÔNG CÓ" trong select lọc
 * V1. Enum riêng dưới đây phản ánh đúng DOM thật của popover V2 (khác V1 đúng
 * 1 điểm: có thêm SIMULATION=24).
 */
export enum FilterCoursewareTypeV2 {
  LY_THUYET_TUONG_TAC = 2,
  LUYEN_TAP_TRAC_NGHIEM = 3,
  VIDEO_YOUTUBE_DIEM_DUNG = 5,
  DE_THI_TU_LUAN = 6,
  LIEN_KET = 9,
  DE_THI_TN_TU_FILE = 10,
  DE_THI_TN_TU_FILE_ANH = 11,
  HOI_VA_DAP = 12,
  DE_THI_TN_TU_MA_TRAN = 13,
  DE_THI_THONG_MINH = 14,
  DE_TIENG_ANH = 15,
  KY_NANG = 16,
  BAI_GIANG_SCORM = 17,
  DANG_BAI_KY_NANG_NHCH = 18,
  GAME_HOA = 19,
  DE_LUYEN_TAP_TN_TU_MA_TRAN = 20,
  DE_KIEM_TRA = 21,
  DE_THI_TRON_OFFLINE = 100,
  TAI_LIEU = 23,
  /** "Mô phỏng, thí nghiệm ảo" — CHỈ có ở popover V2, KHÔNG có trong FilterCoursewareType (V1). */
  SIMULATION = 24,
}

export interface HocLieuV2Row {
  stt: string;
  title: string;
  type: string; // VD: "[Kiểm tra]", "[Video]", "[Học liệu game hóa]", "[Kỹ năng, NHCH]"
  status: 'Bản nháp' | 'Đã xuất bản' | string;
  privacy: 'Riêng tư' | 'Công khai' | string;
  grade: string; // Khối lớp, VD "Lớp 12"
  subject: string; // Môn học, VD "Toán"
  course: string; // Khóa học (có thể rỗng)
  viewUrl: string;
  editUrl: string;
}

/**
 * Value data-value của popover lọc "Khối lớp" trên trang "Học liệu của tôi"
 * (V2) — đối chiếu từ DOM thật (2026-08-04, ảnh chụp popover đang mở):
 * -1 = "Tất cả khối lớp" (mặc định), 0 = "Mẫu giáo", 1..12 = "Lớp 1".."Lớp 12",
 * 13 = "ĐH - CĐ". Trùng khớp thứ tự hiển thị trong danh sách.
 */
export enum FilterGradeValue {
  ALL = -1,
  MAU_GIAO = 0,
  LOP_1 = 1,
  LOP_2 = 2,
  LOP_3 = 3,
  LOP_4 = 4,
  LOP_5 = 5,
  LOP_6 = 6,
  LOP_7 = 7,
  LOP_8 = 8,
  LOP_9 = 9,
  LOP_10 = 10,
  LOP_11 = 11,
  LOP_12 = 12,
  DH_CD = 13,
}

/**
 * Value data-value của popover lọc "Môn học" trên trang "Học liệu của tôi"
 * (V2) — đối chiếu TOÀN BỘ từ DOM thật (2026-08-04, ~70 mục, ảnh chụp popover
 * đang mở). Dùng object thường (không phải TS enum) vì có 2 mục nhãn hiển
 * thị TRÙNG NHAU "Tin học" nhưng data-value KHÁC NHAU (2216416 và 11) — TS
 * enum reverse-mapping sẽ làm mất 1 trong 2 giá trị nếu khai theo numeric
 * enum thông thường.
 * LƯU Ý: value của "Toán"=3, "Ngoại ngữ 2"=2510419 khớp đúng với dữ liệu
 * seed dùng trong Hoc-lieu-cua-toi.function.spec.ts (SEED_ROWS) — xác nhận
 * chéo 2 nguồn dữ liệu khớp nhau.
 */
export const FILTER_SUBJECT_VALUE = {
  ALL: -1,
  TOAN: 3,
  TIENG_NGA: 2147632,
  KHOA_HOC_XA_HOI: 2505637,
  TU_CHON_1: 2506486,
  NGOAI_NGU_2: 2510419,
  MON_TU_CHON_SONG_NGU: 2511622,
  NGOAI_NGU: 2519630,
  MON_KHAC: 2520962,
  /** "Tin học" (nhóm 1) — khác TIN_HOC_2 (value=11) phía dưới, cùng nhãn hiển thị khác value */
  TIN_HOC: 2216416,
  THE_DUC: 2111893,
  GIAO_DUC_NGOAI_GIO: 2112449,
  TO_HOP_KHTN: 2113627,
  TO_HOP_KHXH: 2114786,
  HOAT_DONG_CUNG_CO_TANG_CUONG: 2115253,
  BD_TIENG_VIET: 2116135,
  BD_AM_NHAC: 2118772,
  BD_TOAN: 2119820,
  THUC_HANH_TOAN: 2120653,
  THUC_HANH_TIENG_VIET: 2121172,
  VAT_LI: 5,
  HOA_HOC: 6,
  SINH_HOC: 7,
  NGU_VAN: 21,
  LICH_SU: 8,
  DIA_LI: 9,
  TIENG_ANH: 2,
  CONG_NGHE: 12,
  /** "Tin học" (nhóm 2) — khác TIN_HOC (value=2216416) phía trên, cùng nhãn hiển thị khác value */
  TIN_HOC_2: 11,
  GIAO_DUC_KINH_TE_PHAP_LUAT: 29,
  GIAO_DUC_CONG_DAN: 10,
  GIAO_DUC_QUOC_PHONG: 14,
  HOAT_DONG_TRAI_NGHIEM_HUONG_NGHIEP: 28,
  KHOA_HOC_TU_NHIEN: 27,
  GIAO_DUC_THE_CHAT: 13,
  GIAO_DUC_DIA_PHUONG: 43,
  TIENG_DUC: 2386871,
  TIENG_VIET: 1,
  TU_NHIEN_XA_HOI: 20,
  BD_TIENG_ANH: 2159702,
  KHOA_HOC: 4,
  SINH_HOAT_LOP: 2163823,
  LICH_SU_VA_DIA_LI: 22,
  CONG_DAN_SO: 2162815,
  NGHE_THUAT_AM_NHAC_MY_THUAT: 24,
  PHU_DAO_ANH: 2164754,
  AM_NHAC: 15,
  PHU_DAO_NGU_VAN: 2165311,
  MY_THUAT: 16,
  PHU_DAO_TOAN: 2166774,
  DAO_DUC: 18,
  TNTT_AI: 2167476,
  THU_CONG: 19,
  THE_THAO: 2168852,
  MAM_NON: 41,
  HOAT_DONG_GIAO_DUC: 2169851,
  TIENG_PHAP: 17,
  CONG_NGHE_CONG_NGHIEP: 2170133,
  TIN_HOC_VA_CONG_NGHE: 23,
  CONG_NGHE_NONG_NGHIEP: 2171905,
  TIEU_HOC: 42,
  TIENG_DAN_TOC_THIEU_SO: 26,
  HOAT_DONG_TRAI_NGHIEM: 25,
  NGHE_PHO_THONG: 39,
  KY_NANG_SONG: 30,
  CHU_CAI: 31,
  KHAM_PHA: 33,
  TAO_HINH: 34,
  GIA_TRI_SONG: 35,
  CAM_XUC: 37,
  STEM: 38,
  KY_THUAT: 44,
  TIENG_HAN: 46,
  TIENG_TRUNG: 47,
  TIENG_NHAT: 2110664,
  TOAN_TIENG_PHAP: 2138109,
  TONG_HOP_MON: 40,
} as const;

/**
 * Popover chọn 1 giá trị dùng chung cho 3 nút lọc "loại học liệu"/"môn
 * học"/"khối lớp" trên trang "Học liệu của tôi" (V2) — cùng 1 component cmdk
 * (Radix Command bên trong Popover). Đối chiếu từ DOM thật (2026-08-04):
 * - Nút trigger: `aria-haspopup="dialog"`, `aria-expanded` đổi true/false
 *   theo trạng thái đóng/mở, `data-state="open"/"closed"`.
 * - Nội dung popover: ô tìm kiếm `cmdk-input` (placeholder riêng theo từng
 *   loại, VD "Tìm loại học liệu") + danh sách `[cmdk-list]` gồm các mục
 *   `[cmdk-item][data-value="..."]` với `role="option"`.
 * - Mục đầu tiên luôn là "Tất cả ..." (`data-value="-1"`), có icon check
 *   (span mask-image check.svg) khi đang được chọn.
 * CHỈ 1 popover mở tại 1 thời điểm (Radix tự đóng popover khác khi mở mới)
 * nên dùng selector KHÔNG scope theo id động (`radix-:rXX:` đổi mỗi lần
 * render) — an toàn và ổn định hơn, cùng cách Createhoclieumenu.ts đã dùng
 * cho `[cmdk-list]` của dropdown "Tạo mới học liệu".
 */
export class FilterOptionPopover {
  readonly page: Page;
  readonly trigger: Locator;
  readonly list: Locator;
  readonly searchInput: Locator;

  constructor(page: Page, trigger: Locator) {
    this.page = page;
    this.trigger = trigger;
    this.list = page.locator('[cmdk-list]');
    this.searchInput = page.locator('[cmdk-input]');
  }

  async open() {
    await dismissPopups(this.page);
    await safeClick(this.page, this.trigger);
    await this.list.waitFor({ state: 'visible' });
  }

  async close() {
    if (await this.list.isVisible({ timeout: 300 }).catch(() => false)) {
      await this.page.keyboard.press('Escape');
      await this.list.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  }

  itemByValue(value: string | number): Locator {
    return this.list.locator(`[cmdk-item][data-value="${value}"]`);
  }

  itemByLabel(label: string | RegExp): Locator {
    return this.list.getByRole('option', { name: label });
  }

  /** Mục "Tất cả ..." — luôn có data-value="-1", mặc định đang được chọn */
  get allOptionItem(): Locator {
    return this.itemByValue(-1);
  }

  /** Gõ từ khoá vào ô tìm kiếm để lọc danh sách trước khi chọn (VD danh sách môn học ~70 mục) */
  async search(keyword: string) {
    await this.searchInput.waitFor({ state: 'visible' });
    await safeFill(this.page, this.searchInput, keyword);
  }

  /** Mở popover, chọn 1 mục theo data-value, xác nhận popover đã đóng lại */
  async selectByValue(value: string | number) {
    await this.open();
    await safeClick(this.page, this.itemByValue(value));
    await expect(this.trigger).toHaveAttribute('aria-expanded', 'false');
  }

  /** Mở popover, gõ tìm kiếm rồi chọn theo nhãn hiển thị — an toàn hơn cho danh sách dài */
  async selectByLabel(label: string) {
    await this.open();
    await this.search(label);
    await safeClick(this.page, this.itemByLabel(label));
    await expect(this.trigger).toHaveAttribute('aria-expanded', 'false');
  }

  /** Đọc toàn bộ nhãn option đang hiển thị (tự mở popover nếu chưa mở) */
  async getVisibleOptionLabels(): Promise<string[]> {
    if (!(await this.list.isVisible({ timeout: 300 }).catch(() => false))) {
      await this.open();
    }
    return this.list.getByRole('option').allInnerTexts();
  }
}

/** Tên 3 nhóm ToggleGroup trong panel "Bộ lọc nâng cao" (khớp text thật của từng <strong>) */
export type AdvancedFilterGroup = 'Nguồn gốc' | 'Phạm vi' | 'Chế độ chia sẻ';

/**
 * Selector khối NỘI DUNG CUỘN (scrollable) của panel "Bộ lọc nâng cao" — đối
 * chiếu trực tiếp từ DOM thật (2026-08-04). Khối này (`tw-overflow-y-auto`)
 * CHỈ chứa 3 nhóm ToggleGroup (Nguồn gốc/Phạm vi/Chế độ chia sẻ) — dùng để
 * scope `group()`/`optionButton()` bên dưới, tránh nhầm sang input/label
 * trùng tên ở chỗ khác trên trang.
 */
export const ADVANCED_FILTER_PANEL_SELECTOR =
  'div.tw-flex.tw-min-h-0.tw-flex-1.tw-flex-col.tw-gap-5.tw-overflow-y-auto.tw-p-4';

/**
 * Panel "Bộ lọc nâng cao" trên trang "Học liệu của tôi" (V2) — mở ra từ nút
 * cùng tên cạnh các nút lọc loại/môn/khối lớp. Đối chiếu từ DOM thật
 * (2026-08-04, ảnh chụp panel đang mở ở tab "Chưa xuất bản"): gồm đúng 3
 * nhóm ToggleGroup (Radix `role="group"` > các nút `role="radio"`, mỗi nút
 * có `data-state="on"/"off"` + `aria-checked`) và 2 nút cuối:
 * - "Nguồn gốc": Tất cả (mặc định chọn) / Tự tạo / Sao chép từ Khoá học/NHCH khác
 * - "Phạm vi": Tất cả (mặc định chọn) / Học liệu tự do / Học liệu trong khoá học
 * - "Chế độ chia sẻ": Tất cả (mặc định chọn) / Công khai (icon globe) / Riêng tư (icon lock)
 * - "Đặt lại" (reset về mặc định) và "Áp dụng" (submit + đóng panel)
 * Mỗi nhóm là single-select (chỉ 1 nút "on" tại 1 thời điểm) dù dùng chung
 * style nút "toggle" nhìn giống multi-select.
 *
 * LƯU Ý VỀ btnReset/btnApply: HTML thật gửi kèm cho panel này (2026-08-04)
 * chỉ chụp đúng khối NỘI DUNG CUỘN (3 nhóm ToggleGroup) — KHÔNG có HTML của
 * chính 2 nút "Đặt lại"/"Áp dụng", dù chúng có hiển thị rõ trong ảnh chụp
 * màn hình đính kèm (nằm cố định phía dưới, ngoài vùng cuộn — hợp lý vì khối
 * cuộn khai báo `tw-overflow-y-auto`, 2 nút hành động thường được ghim ở
 * footer riêng NGOÀI khối này). Vì vậy 2 locator dưới KHÔNG scope theo
 * `this.panel` (khác với `group()`/`optionButton()`) mà tra theo toàn `page`
 * — CẦN xác nhận lại + thu hẹp scope khi có HTML đầy đủ của khối footer.
 */
export class AdvancedFilterPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly btnReset: Locator; // "Đặt lại" — TODO: chưa có DOM thật của khối footer chứa nút này, xem lưu ý ở docblock lớp
  readonly btnApply: Locator; // "Áp dụng" — TODO: tương tự btnReset

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator(ADVANCED_FILTER_PANEL_SELECTOR);
    this.btnReset = page.getByRole('button', { name: 'Đặt lại' });
    this.btnApply = page.getByRole('button', { name: 'Áp dụng' });
  }

  /** Khối ToggleGroup (`role="group"`) tương ứng 1 trong 3 nhóm, xác định qua <strong> nhãn liền trước */
  group(name: AdvancedFilterGroup): Locator {
    return this.panel.locator('strong', { hasText: name }).locator('xpath=following-sibling::div[@role="group"]');
  }

  optionButton(group: AdvancedFilterGroup, optionLabel: string): Locator {
    return this.group(group).getByRole('radio', { name: optionLabel });
  }

  async selectOption(group: AdvancedFilterGroup, optionLabel: string) {
    await safeClick(this.page, this.optionButton(group, optionLabel));
  }

  /** Xác nhận 1 option đang ở trạng thái được chọn (data-state="on" + aria-checked="true") */
  async expectSelected(group: AdvancedFilterGroup, optionLabel: string) {
    const btn = this.optionButton(group, optionLabel);
    await expect(btn).toHaveAttribute('data-state', 'on');
    await expect(btn).toHaveAttribute('aria-checked', 'true');
  }

  async expectNotSelected(group: AdvancedFilterGroup, optionLabel: string) {
    const btn = this.optionButton(group, optionLabel);
    await expect(btn).toHaveAttribute('data-state', 'off');
    await expect(btn).toHaveAttribute('aria-checked', 'false');
  }

  /** Bấm "Áp dụng" — submit bộ lọc nâng cao và chờ panel đóng lại */
  async apply() {
    await safeClick(this.page, this.btnApply);
    await this.panel.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /** Bấm "Đặt lại" — panel vẫn mở, chỉ đưa 3 nhóm về lựa chọn "Tất cả" mặc định */
  async reset() {
    await safeClick(this.page, this.btnReset);
  }
}

export class HocLieuCuaToiV2Page {
  readonly page: Page;
  // ---- Header ----
  readonly heading: Locator; // "Học liệu của tôi"
  readonly guideLink: Locator; // "Hướng dẫn tạo học liệu"
  readonly btnCreateNew: Locator; // "Tạo mới học liệu" (mở CreateHocLieuMenu)
  readonly btnBackToOldUI: Locator; // "Quay lại giao diện cũ"

  // ---- Tabs trạng thái ----
  readonly tabAll: Locator;
  readonly tabPublished: Locator; // Đã xuất bản
  readonly tabUnpublished: Locator; // Chưa xuất bản
  readonly tabAllCountBadge: Locator;
  readonly tabUnpublishedCountBadge: Locator;

  // ---- Ô tìm kiếm ----
  readonly searchInput: Locator; // placeholder "Tìm theo tên học liệu"

  // ---- Bộ lọc ----
  readonly filterTypeBtn: Locator; // "Tất cả loại học liệu"
  readonly filterSubjectBtn: Locator; // "Tất cả môn học"
  readonly filterGradeBtn: Locator; // "Tất cả khối lớp"
  readonly btnAdvancedFilter: Locator; // "Bộ lọc nâng cao"
  readonly btnReload: Locator; // "Tải lại"

  // ---- Popover nội dung của 3 nút lọc phía trên (DOM thật xác nhận 2026-08-04) ----
  readonly typeFilterPopover: FilterOptionPopover;
  readonly subjectFilterPopover: FilterOptionPopover;
  readonly gradeFilterPopover: FilterOptionPopover;

  // ---- Bảng kết quả ----
  readonly table: Locator;
  readonly tableRows: Locator; // tbody > tr
  readonly tableHeader: Locator; // thead
  readonly checkboxSelectAll: Locator; // checkbox "chọn tất cả" trong thead

  // ---- Phân trang ----
  readonly pagination: Locator;
  readonly btnPrevPage: Locator;
  readonly btnNextPage: Locator;

  constructor(page: Page) {
    this.page = page;

    // FIX 2026-08-04: getByText('Học liệu của tôi', { exact: true }) khớp 5
    // phần tử trên DOM thật (breadcrumb span, 2 link ẩn có title="...", div
    // tiêu đề thật, mục sidebar #drawer-teacher-menu) -> strict-mode
    // violation (xem lỗi TC-LIST-UI 2026-08-04). Scope lại đúng div tiêu đề
    // theo class thật lấy từ error log Playwright (tw-text-2xl tw-font-semibold
    // là 2 class riêng biệt của khối tiêu đề, không trùng breadcrumb/sidebar).
    this.heading = page.locator('div.tw-text-2xl.tw-font-semibold', { hasText: 'Học liệu của tôi' }).first();
    this.guideLink = page.getByRole('link', { name: /Hướng dẫn tạo học liệu/i });
    this.btnCreateNew = page.getByRole('button', { name: /Tạo mới học liệu/i });
    // TODO: chưa có DOM thật của nút "Quay lại giao diện cũ" (chỉ có ảnh chụp
    // màn hình 2026-08-04) — chưa xác nhận đây là <a> hay <button>, nên tạm
    // tra theo text hiển thị (an toàn, không phụ thuộc role). Cần đối chiếu
    // lại với DOM thật khi có, đúng quy tắc "không đoán selector" của dự án.
    this.btnBackToOldUI = page.getByText('Quay lại giao diện cũ', { exact: true });

    this.tabAll = page.getByRole('tab', { name: /^Tất cả/i });
    this.tabPublished = page.getByRole('tab', { name: /Đã xuất bản/i });
    this.tabUnpublished = page.getByRole('tab', { name: /Chưa xuất bản/i });
    this.tabAllCountBadge = this.tabAll.locator('[data-slot="badge"]');
    // Cùng pattern data-slot="badge" đã xác nhận cho tabAllCountBadge — badge
    // số lượng "3" trên tab "Chưa xuất bản" trong ảnh chụp 2026-08-04.
    this.tabUnpublishedCountBadge = this.tabUnpublished.locator('[data-slot="badge"]');

    this.searchInput = page.getByPlaceholder('Tìm theo tên học liệu');

    this.filterTypeBtn = page.getByRole('button', { name: /Tất cả loại học liệu/i });
    this.filterSubjectBtn = page.getByRole('button', { name: /Tất cả môn học/i });
    this.filterGradeBtn = page.getByRole('button', { name: /Tất cả khối lớp/i });
    this.btnAdvancedFilter = page.getByRole('button', { name: /Bộ lọc nâng cao/i });
    this.btnReload = page.getByRole('button', { name: /Tải lại/i });

    this.typeFilterPopover = new FilterOptionPopover(page, this.filterTypeBtn);
    this.subjectFilterPopover = new FilterOptionPopover(page, this.filterSubjectBtn);
    this.gradeFilterPopover = new FilterOptionPopover(page, this.filterGradeBtn);

    this.table = page.locator('table');
    this.tableRows = this.table.locator('tbody tr');
    this.tableHeader = this.table.locator('thead');
    // TODO: chưa có DOM thật của <thead> (chỉ ảnh chụp) — checkbox "chọn tất
    // cả" tạm tra theo input[type=checkbox] chuẩn, cần đối chiếu lại khi có
    // HTML thật của khối header bảng.
    this.checkboxSelectAll = this.tableHeader.locator('input[type="checkbox"]');

    this.pagination = page.getByRole('navigation', { name: /pagination/i });
    this.btnPrevPage = this.pagination.getByRole('button', { name: /previous page/i });
    this.btnNextPage = this.pagination.getByRole('button', { name: /next page/i });
  }

  
  /**
   * Vào thẳng "Học liệu của tôi" bản V2 bằng query param ?v=v2 (KHÔNG còn đi
   * qua màn V1 rồi bấm nút "Thử phiên bản mới" như trước). Chỉ cần 1 lần
   * page.goto() tới URL có sẵn param -> hệ thống tự động trả về giao diện V2
   * ngay từ đầu, không cần bước chuyển đổi client-side nào thêm.
   *
   * Nếu page hiện tại đã ở sẵn màn V2 (VD đang ở giữa 1 test, chỉ cần quay
   * lại danh sách) thì bỏ qua goto() để tránh full reload không cần thiết.
   */
  async goto(_url = '/hoc-lieu-cua-toi?v=v2') {
    const alreadyOnV2 = await this.tabAll.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!alreadyOnV2) {
      await this.page.goto(_url);
    }
    await this.table.waitFor({ state: 'visible' });

    await dismissPopups(this.page);
  }

  // ------------------------------------------------------------------
  // Tabs trạng thái
  // ------------------------------------------------------------------

  async selectStatusTab(tab: MaterialStatusTab) {
    const map: Record<MaterialStatusTab, Locator> = {
      all: this.tabAll,
      published: this.tabPublished,
      unpublished: this.tabUnpublished,
    };
    // FIX: dùng safeClick thay vì .click() trần — chuyển tab kéo theo bảng
    // reload dữ liệu, có thể trùng lúc 1 toast/thông báo mới xuất hiện che
    // đúng lúc bấm, gây "element intercepts pointer events".
    await safeClick(this.page, map[tab]);
  }

  /** Đọc số lượng trên badge của tab "Tất cả" (chỉ tab này có badge trong DOM mẫu) */
  async getAllTabCount(): Promise<number> {
    const text = (await this.tabAllCountBadge.innerText()).trim();
    return Number(text);
  }

  // ------------------------------------------------------------------
  // Tìm kiếm & bộ lọc
  // ------------------------------------------------------------------

  async searchByTitle(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.page.keyboard.press('Enter');
  }

  /** Mở popover lọc "Loại học liệu" — dùng FilterCoursewareTypeV2 làm data-value */
  async openFilterType() {
    await this.typeFilterPopover.open();
  }

  async openFilterSubject() {
    await this.subjectFilterPopover.open();
  }

  async openFilterGrade() {
    await this.gradeFilterPopover.open();
  }

  /** Chọn loại học liệu trong popover lọc theo enum FilterCoursewareTypeV2 (VD FilterCoursewareTypeV2.DE_KIEM_TRA) */
  async selectFilterType(type: FilterCoursewareTypeV2) {
    await this.typeFilterPopover.selectByValue(type);
  }

  /** Chọn môn học trong popover lọc theo FILTER_SUBJECT_VALUE (VD FILTER_SUBJECT_VALUE.TOAN) */
  async selectFilterSubject(value: number) {
    await this.subjectFilterPopover.selectByValue(value);
  }

  /** Chọn khối lớp trong popover lọc theo enum FilterGradeValue (VD FilterGradeValue.LOP_12) */
  async selectFilterGrade(value: FilterGradeValue) {
    await this.gradeFilterPopover.selectByValue(value);
  }

  async openAdvancedFilter() {
    await this.btnAdvancedFilter.click();
  }

  /** Mở panel "Bộ lọc nâng cao" và trả về page object tương ứng đã visible */
  async openAdvancedFilterPanel(): Promise<AdvancedFilterPanel> {
    await dismissPopups(this.page);
    await safeClick(this.page, this.btnAdvancedFilter);
    const panel = new AdvancedFilterPanel(this.page);
    await panel.panel.waitFor({ state: 'visible' });
    return panel;
  }

  async reload() {
    await safeClick(this.page, this.btnReload);
  }

  // ------------------------------------------------------------------
  // Bảng kết quả
  // ------------------------------------------------------------------

  /** Tiêu đề 1 cột trong <thead> theo nhãn hiển thị đúng, VD "Tên học liệu" */
  columnHeader(label: string): Locator {
    return this.tableHeader.getByText(label, { exact: true });
  }

  getRowByIndex(index: number): Locator {
    return this.tableRows.nth(index);
  }

  /** Tìm dòng theo tiêu đề học liệu khớp chính xác (cột "Tên học liệu") */
  getRowByTitle(title: string): Locator {
    return this.tableRows.filter({ has: this.page.getByText(title, { exact: true }) });
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getRowData(row: Locator): Promise<HocLieuV2Row> {
    const cells = row.locator('td');
    const stt = (await cells.nth(0).innerText()).trim();

    const titleCell = cells.nth(1);
    // Badge trạng thái xuất bản = badge đầu tiên (Bản nháp | Đã xuất bản)
    const status = (await titleCell.locator('.tw-badge-outline-sm, .tw-badge-positive_light-sm').first().innerText()).trim();
    // Badge quyền riêng tư = badge thứ 2 (Riêng tư | Công khai)
    const privacy = (await titleCell.locator('.tw-badge-secondary_light-sm, .tw-badge-accent_light-sm').first().innerText()).trim();
    const title = (await titleCell.locator('.tw-cursor-default').innerText()).trim();
    const type = (await titleCell.locator('.tw-text-content-tertiary').innerText()).trim();

    const grade = (await cells.nth(2).innerText()).trim();
    const subject = (await cells.nth(3).innerText()).trim();
    const course = (await cells.nth(4).innerText()).trim();

    const actionCell = cells.nth(5);
    const viewUrl = (await actionCell.getByRole('link').first().getAttribute('href')) ?? '';
    const editUrl = (await actionCell.getByRole('link', { name: /Sửa/i }).getAttribute('href')) ?? '';

    return { stt, title, type, status: status as HocLieuV2Row['status'], privacy: privacy as HocLieuV2Row['privacy'], grade, subject, course, viewUrl, editUrl };
  }

  async getAllRowsData(): Promise<HocLieuV2Row[]> {
    const count = await this.getRowCount();
    const result: HocLieuV2Row[] = [];
    for (let i = 0; i < count; i++) {
      result.push(await this.getRowData(this.getRowByIndex(i)));
    }
    return result;
  }

  // ------------------------------------------------------------------
  // Hành động trên từng dòng
  // ------------------------------------------------------------------

  async viewCourseware(row: Locator) {
    // FIX: check + tắt popup trước khi bấm (link "Xem" gây full navigation
    // sang trang khác — nếu bị popup che đúng lúc bấm, click coi như trượt).
    if (await this.page.locator('.modal.show, [role="dialog"]').first().isVisible({ timeout: 300 }).catch(() => false)) {
      await dismissPopups(this.page);
    }
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      row.getByRole('link').first().click(),
    ]);
    // Trang đích (Xem học liệu) có thể tự bắn popup riêng (VD "Xác thực")
    // không liên quan gì tới bảng danh sách vừa rời khỏi — dọn luôn ở đây.
    await dismissPopups(this.page);
  }

  async editCourseware(row: Locator) {
    if (await this.page.locator('.modal.show, [role="dialog"]').first().isVisible({ timeout: 300 }).catch(() => false)) {
      await dismissPopups(this.page);
    }
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      row.getByRole('link', { name: /Sửa/i }).click(),
    ]);
    // Trang đích (màn soạn học liệu) có thể tự bắn popup riêng — dọn luôn.
    await dismissPopups(this.page);
  }

  async openRowMoreOptions(row: Locator): Promise<void> {
    await safeClick(this.page, row.getByRole('button', { name: /Tùy chọn/i }));
  }

  // ------------------------------------------------------------------
  // Phân trang
  // ------------------------------------------------------------------

  pageButton(pageNumber: number): Locator {
    return this.pagination.getByRole('button', { name: String(pageNumber), exact: true });
  }

  async goToPage(pageNumber: number) {
    await safeClick(this.page, this.pageButton(pageNumber));
    await this.table.waitFor({ state: 'visible' });
  }

  async goToNextPage() {
    await safeClick(this.page, this.btnNextPage);
    await this.table.waitFor({ state: 'visible' });
  }

  async goToPrevPage() {
    await safeClick(this.page, this.btnPrevPage);
    await this.table.waitFor({ state: 'visible' });
  }

  async expectCurrentPage(pageNumber: number) {
    await expect(this.pagination.getByRole('button', { name: String(pageNumber), exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
}