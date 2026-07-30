// modules/giao-vien/hoc-lieu-v1/pages/HocLieuNoiDungPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@core/shared-pages/BasePage';
import { CoursewareType } from './HocLieuCuaToiPage';

/**
 * HocLieuNoiDungPage.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Trang "Quản lý học liệu" (URL thật: /chu-de/{id}-{slug}/quan-ly, ví dụ
 * https://olm.vn/chu-de/1-5077635285/quan-ly) — trang hiện ra SAU KHI đã tạo
 * xong 1 học liệu ở HocLieuCuaToiPage (createCourseware()) hoặc khi bấm
 * "Sửa đổi" từ bảng danh sách.
 *
 * Đối chiếu trực tiếp từ 7 ảnh chụp do người dùng cung cấp (2026-07-27), MỖI
 * ảnh là 1 chủ đề số thứ tự khác nhau (1→7), đúng thứ tự 7 loại học liệu
 * dưới đây (khớp với CoursewareType đã có trong HocLieuCuaToiPage.ts):
 *   1. Luyện tập trắc nghiệm     (LUYEN_TAP_TRAC_NGHIEM = 3)
 *   2. Đề thi thông minh         (DE_THI_THONG_MINH = 14)
 *   3. Đề thi THPT               (DE_THI_THPT = 21)
 *   4. Dạng bài, kĩ năng (NHCH)  (DANG_BAI_KY_NANG_NHCH = 18)
 *   5. Lý thuyết tương tác       (LY_THUYET_TUONG_TAC = 2)
 *   6. Video Youtube có điểm dừng(VIDEO_YOUTUBE_DIEM_DUNG = 5)
 *   7. Hỏi và đáp                (HOI_VA_DAP = 12)
 *
 * LƯU Ý QUAN TRỌNG — CHỈ verify được PHẦN HIỂN THỊ NGOÀI CÙNG qua ảnh chụp:
 * - Mọi text/label/placeholder dùng trong locator dưới đây là chữ NHÌN THẤY
 *   trực tiếp trong ảnh (không suy đoán), nên dùng getByText/getByRole an
 *   toàn hơn CSS class/id không biết trước.
 * - NỘI DUNG BÊN TRONG các modal/popover mở ra sau khi click (VD: modal "Tạo
 *   câu hỏi", modal "Import từ file word", popover "Cài đặt điểm nhanh",
 *   nội dung tab "Thiết lập") CHƯA có ảnh/HTML thật -> đánh dấu TODO, KHÔNG
 *   đoán selector bên trong. Nếu test fail ở các bước này, gửi thêm
 *   ảnh/HTML thật của modal/popover tương ứng để bổ sung, không đoán tiếp
 *   (theo đúng quy tắc đã thống nhất của dự án).
 */
export class HocLieuNoiDungPage extends BasePage {
  /** URL trang quản lý 1 học liệu theo id (id có thể có hoặc không kèm slug số) */
  static url(coursewareId: string | number): string {
    return `/chu-de/${coursewareId}/quan-ly`;
  }

  constructor(page: Page) {
    super(page);
  }

  async goto(coursewareId: string | number): Promise<this> {
    await this.navigateTo(HocLieuNoiDungPage.url(coursewareId));
    return this;
  }

  /** Lấy id học liệu hiện tại từ URL đang đứng (dùng sau khi submitModal() điều hướng tới đây) */
  getCoursewareIdFromUrl(): string | null {
    const match = this.page.url().match(/\/chu-de\/([^/]+)\/quan-ly/);
    return match ? match[1] : null;
  }

  // ==================================================================
  // ---- Header chung (badge + nhóm nút hành động) — thấy ở cả 7 ảnh ----
  // ==================================================================
  readonly badgeSeo: Locator = this.page.getByText('SEO', { exact: true });
  readonly badgeStatus: Locator = this.page.getByText(/Chưa duyệt|Đã duyệt/);
  readonly btnSuaTen = this.page.getByRole('button', { name: /Sửa tên/i }).or(this.page.getByText('Sửa tên'));
  readonly btnKct = this.page.getByText('KCT', { exact: true });
  readonly btnXoaHocLieu = this.page.getByRole('button', { name: /^Xóa$/i }).or(this.page.getByText('Xóa', { exact: true }));
  readonly checkboxHienThi = this.page.getByText('Hiển thị');
  readonly btnLuu = this.page.getByRole('button', { name: /^Lưu$/i });
  readonly linkQuyTacVietNd = this.page.getByText(/Quy tắc viết N[Dd]/i);
  /** Chỉ hiện với loại có tính điểm/tuần học (chủ đề 2, 3): input "Tuần" */
  readonly inputTuan = this.page.getByPlaceholder(/Tuần/i).or(this.page.locator('input').locator('xpath=preceding-sibling::text()[contains(., "Tuần")]'));
  /** Chỉ hiện ở loại "Dạng bài, kĩ năng" (chủ đề 4): "Cho phép làm như đề thi" */
  readonly checkboxChoPhepLamNhuDeThi = this.page.getByText('Cho phép làm như đề thi');
  readonly btnGiaoBai = this.page.getByRole('button', { name: /Giao bài/i });

  // ---- Menu tab bên trái, dưới tiêu đề số thứ tự (thay đổi theo loại) ----
  readonly tabTronDe = this.page.getByText('Trộn đề', { exact: true });
  readonly tabThietLap = this.page.getByText('Thiết lập', { exact: true });
  readonly tabDsBaiLam = this.page.getByText('DS bài làm', { exact: true });
  readonly tabTrangThaiLamBai = this.page.getByText('Trạng thái làm bài', { exact: true });
  readonly tabChamLaiBai = this.page.getByText('Chấm lại bài', { exact: true });
  readonly tabThongKe = this.page.getByText('Thống kê', { exact: true });
  readonly tabLichSuChinhSua = this.page.getByText('LS chỉnh sửa học liệu', { exact: true });

  /** Kiểm tra 1 tab menu có hiển thị hay không — dùng cho test so sánh menu theo từng loại học liệu */
  async isTabVisible(tab: Locator): Promise<boolean> {
    return tab.isVisible().catch(() => false);
  }

  // ==================================================================
  // ---- 1/2/3/4: Panel "Tạo nội dung học liệu" / "Tạo nội dung để thi" ----
  // (Luyện tập trắc nghiệm, Đề thi thông minh, Đề thi THPT, Dạng bài kĩ năng)
  // ==================================================================
  readonly sectionHeaderHocLieu = this.page.getByText('Tạo nội dung học liệu', { exact: true });
  readonly sectionHeaderDeThi = this.page.getByText('Tạo nội dung để thi', { exact: true });
  readonly toggleThietLapNangCao = this.page.getByText('Thiết lập nâng cao');

  readonly tabCauHoiCuaBan = this.page.getByRole('button', { name: /^Câu hỏi của bạn$/i });
  readonly tabCauHoiCuaOlm = this.page.getByRole('button', { name: /^Câu hỏi của OLM$/i });
  readonly tabTimKiemCauHoi = this.page.getByRole('button', { name: /^Tìm kiếm câu hỏi$/i });
  /** dropdown "Học liệu tự do" phía trên khối tạo câu hỏi */
  readonly selectHocLieuTuDo = this.page.getByText('Học liệu tự do', { exact: true });

  readonly btnTaoCauHoi = this.page.getByRole('button', { name: /^\+?\s*Tạo câu hỏi$/i });
  readonly btnXoaTatCaCauHoiTrongBai = this.page.getByRole('button', {
    name: /Xóa tất cả câu hỏi trong bài học này/i,
  });
  readonly btnImportTuFileWord = this.page.getByRole('button', { name: /Import từ file word/i });
  readonly btnTaiFileWord = this.page.getByRole('button', { name: /Tải file Word/i });

  readonly panelCauHoiCuaBan = this.page.getByText('Câu hỏi của bạn', { exact: true });
  readonly emptyStateChuaCoCauHoiNao = this.page.getByText('Chưa có câu hỏi nào');
  readonly btnChonTatCa = this.page.getByRole('button', { name: /^Chọn tất cả$/i });
  readonly btnSaoChepCauHoi = this.page.getByRole('button', { name: /Sao chép câu hỏi/i });
  /** Chỉ có ở loại "Dạng bài, kĩ năng" (chủ đề 4) bên khối "Câu hỏi của bạn" */
  readonly btnCaiDatDiemNhanhTraiPanel = this.page.getByRole('button', { name: /^Cài đặt điểm nhanh$/i });

  readonly panelCauHoiDuocChon = this.page.getByText('Câu hỏi được chọn (trắc nghiệm)');
  /** Chỉ hiện ở Đề thi thông minh/THPT/Dạng bài kĩ năng (chủ đề 2,3,4), KHÔNG có ở Luyện tập trắc nghiệm (chủ đề 1) */
  readonly textDiemBaiThi = this.page.getByText(/Điểm bài thi:\s*\d+/i);
  readonly btnDatDiemBaiTracNghiem = this.page.getByRole('button', { name: /Đặt điểm bài trắc nghiệm/i });
  readonly btnCaiDatDiemNhanhPhaiPanel = this.page
    .getByText('Câu hỏi được chọn (trắc nghiệm)')
    .locator('xpath=following::button[contains(., "Cài đặt điểm nhanh")][1]');
  readonly btnLayCauHoiTuHocLieuGoc = this.page.getByRole('button', { name: /Lấy câu hỏi từ học liệu gốc/i });
  readonly btnDongBoCauHoi = this.page.getByRole('button', { name: /Đồng bộ câu hỏi/i });
  readonly btnXoaTatCaCauHoiDuocChon = this.page
    .getByText('Câu hỏi được chọn (trắc nghiệm)')
    .locator('xpath=following::button[contains(., "Xóa tất cả")][1]');

  /** Panel "Câu hỏi tự luận (1 câu chứa nhiều bài)" — có ở chủ đề 2, 3, 4 */
  readonly panelCauHoiTuLuan = this.page.getByText('Câu hỏi tự luận (1 câu chứa nhiều bài)');

  async openTabCauHoiCuaBan(): Promise<this> {
    await this.jsClick(this.tabCauHoiCuaBan);
    return this;
  }

  async openTabCauHoiCuaOlm(): Promise<this> {
    await this.jsClick(this.tabCauHoiCuaOlm);
    return this;
  }

  async openTabTimKiemCauHoi(): Promise<this> {
    await this.jsClick(this.tabTimKiemCauHoi);
    return this;
  }

  /**
   * Mở khối "Thiết lập nâng cao" (toggle ẩn/hiện, mặc định đóng ở chủ đề 1;
   * mặc định MỞ SẴN ở chủ đề 2/3/4 theo ảnh — gọi hàm này idempotent, click
   * lại nếu đang ở trạng thái đóng).
   * TODO: chưa xác nhận được aria-state của toggle qua ảnh, tạm chỉ click
   * khi nội dung bên trong (sectionHeaderDeThi/sectionHeaderHocLieu) đang ẩn.
   */
  async ensureThietLapNangCaoOpen(): Promise<this> {
    const alreadyOpen = await this.sectionHeaderHocLieu
      .or(this.sectionHeaderDeThi)
      .isVisible()
      .catch(() => false);
    if (!alreadyOpen) {
      await this.jsClick(this.toggleThietLapNangCao);
    }
    return this;
  }

  /**
   * Bấm "+ Tạo câu hỏi". TODO: chưa có ảnh/HTML của modal "Tạo câu hỏi" xuất
   * hiện sau khi bấm ở trang NÀY — có thể dùng chung modal "Tạo câu hỏi" đã
   * verify riêng ở HocLieuCuaToiPage (QUESTION_MODAL/QUESTION_TITLE_INPUT...),
   * CẦN xác nhận lại bằng ảnh/HTML thật trước khi viết fillAndSaveQuestion()
   * riêng cho trang này.
   */
  async clickTaoCauHoi(): Promise<this> {
    await this.jsClick(this.btnTaoCauHoi);
    return this;
  }

  /** TC chọn tất cả câu hỏi trong "Câu hỏi của bạn" rồi sao chép */
  async chonTatCaVaSaoChep(): Promise<this> {
    await this.jsClick(this.btnChonTatCa);
    await this.jsClick(this.btnSaoChepCauHoi);
    return this;
  }

  /**
   * Xóa toàn bộ câu hỏi của bài học hiện tại. HÀNH ĐỘNG PHÁ HỦY DỮ LIỆU —
   * KHÔNG gọi trong regression/smoke spec chạy trên dữ liệu thật, chỉ dùng
   * cho test tạo dữ liệu riêng rồi dọn dẹp ngay trong cùng test.
   * TODO: chưa xác nhận có modal confirm hay không (chưa có ảnh bước sau khi bấm).
   */
  async xoaTatCaCauHoiTrongBai(): Promise<this> {
    await this.jsClick(this.btnXoaTatCaCauHoiTrongBai);
    return this;
  }

  /** Import câu hỏi từ file Word. TODO: modal chọn file CHƯA có ảnh/HTML thật. */
  async clickImportTuFileWord(): Promise<this> {
    await this.jsClick(this.btnImportTuFileWord);
    return this;
  }

  /** "Tải file Word" — TODO: chưa rõ đây là tải file mẫu (download) hay input upload, cần ảnh xác nhận. */
  async clickTaiFileWord(): Promise<this> {
    await this.jsClick(this.btnTaiFileWord);
    return this;
  }

  /**
   * "Đặt điểm bài trắc nghiệm" / "Cài đặt điểm nhanh" — chỉ hiện ở Đề thi
   * thông minh/THPT/Dạng bài kĩ năng. TODO: popover/modal điền điểm CHƯA có
   * ảnh/HTML thật của nội dung bên trong.
   */
  async clickDatDiemBaiTracNghiem(): Promise<this> {
    await this.jsClick(this.btnDatDiemBaiTracNghiem);
    return this;
  }

  async clickCaiDatDiemNhanh(): Promise<this> {
    await this.jsClick(this.btnCaiDatDiemNhanhPhaiPanel);
    return this;
  }

  async clickLayCauHoiTuHocLieuGoc(): Promise<this> {
    await this.jsClick(this.btnLayCauHoiTuHocLieuGoc);
    return this;
  }

  async clickDongBoCauHoi(): Promise<this> {
    await this.jsClick(this.btnDongBoCauHoi);
    return this;
  }

  // ==================================================================
  // ---- 3: Panel soạn cấu trúc đề thi chuẩn (chỉ Đề thi THPT) ----
  // Xuất hiện bên phải sau khi bấm "Cài đặt điểm nhanh"/"Cài đặt điểm" ở
  // panel "Câu hỏi của bạn" — theo ảnh, có toolbar 3 nút + 1 vùng soạn thảo.
  // ==================================================================
  readonly btnThemPhanVung = this.page.getByRole('button', { name: /Thêm phân vùng/i });
  readonly btnThemTieuDeChoPhanVung = this.page.getByRole('button', { name: /Thêm tiêu đề cho phân vùng/i });
  readonly btnThemChuGiaiChuThich = this.page.getByRole('button', { name: /Thêm chú giải, chú thích/i });
  readonly editorCauTrucDeThiChuan = this.page.getByPlaceholder(/Soạn nội dung cấu trúc đề thi chuẩn mới của Bộ/i);

  async themPhanVung(): Promise<this> {
    await this.jsClick(this.btnThemPhanVung);
    return this;
  }

  async themTieuDeChoPhanVung(): Promise<this> {
    await this.jsClick(this.btnThemTieuDeChoPhanVung);
    return this;
  }

  async themChuGiaiChuThich(): Promise<this> {
    await this.jsClick(this.btnThemChuGiaiChuThich);
    return this;
  }

  async soanNoiDungCauTrucDeThiChuan(content: string): Promise<this> {
    await this.jsClick(this.editorCauTrucDeThiChuan);
    await this.page.keyboard.type(content);
    return this;
  }

  // ==================================================================
  // ---- 5: Lý thuyết tương tác ----
  // ==================================================================
  readonly radioSoanThaoNoiDung = this.page.getByText('Soạn thảo nội dung', { exact: true });
  readonly radioUploadTepTin = this.page.getByText(/Upload tệp tin pdf, word hoặc powerpoint/i);
  readonly btnNhapLyThuyetTuWord = this.page.getByRole('button', { name: /Nhập lý thuyết từ Word/i });
  readonly editorLyThuyet = this.page.getByPlaceholder(/Nhập nội dung lý thuyết/i);
  // Toolbar rich-text (Công thức, Tải ảnh, Text LaTeX, Bold/Italic/Underline...)
  readonly toolbarCongThuc = this.page.getByText('Công thức', { exact: true });
  readonly toolbarTaiAnh = this.page.getByText('Tải ảnh', { exact: true });
  readonly toolbarTextLaTeX = this.page.getByText('Text LaTeX', { exact: true });

  async chonCheDoSoanThaoNoiDung(): Promise<this> {
    await this.jsClick(this.radioSoanThaoNoiDung);
    return this;
  }

  async chonCheDoUploadTepTin(): Promise<this> {
    await this.jsClick(this.radioUploadTepTin);
    return this;
  }

  async nhapNoiDungLyThuyet(content: string): Promise<this> {
    // FIX (2026-07-27): editor rich-text (CKEditor/Quill...) có thể mount
    // trễ hơn actionability timeout mặc định (20s) khi nhiều worker cùng
    // đăng nhập chung 1 tài khoản giáo viên và trang tải chậm hơn bình
    // thường — chờ tường minh, timeout dài hơn, trước khi click/type để
    // tránh lỗi "locator.click: Timeout 20000ms exceeded" giả do tải chậm
    // chứ không phải do sai selector.
    await this.editorLyThuyet.waitFor({ state: 'visible', timeout: 30_000 });
    await this.jsClick(this.editorLyThuyet);
    await this.page.keyboard.type(content);
    return this;
  }

  /** TODO: modal chọn file .docx sau khi bấm CHƯA có ảnh/HTML thật */
  async clickNhapLyThuyetTuWord(): Promise<this> {
    await this.jsClick(this.btnNhapLyThuyetTuWord);
    return this;
  }

  // ==================================================================
  // ---- 6: Video Youtube có điểm dừng ----
  // ==================================================================
  readonly sectionTaoHocLieuVideo = this.page.getByText('Tạo học liệu video', { exact: true });
  readonly inputLienKetVideo = this.page.getByPlaceholder(/Đường link dẫn tới video trên youtube/i);
  readonly btnThemDiemDung = this.page.getByRole('button', { name: /Thêm điểm dừng/i });
  readonly toggleTomTatBaiGiang = this.page.getByText('Tóm tắt bài giảng', { exact: true });
  readonly toggleTaoTranscript = this.page.getByText(/Tạo transcript video/i);
  /**
   * FIX (2026-07-27): `input[type="file"]` không scope khớp 9 phần tử trên
   * trang (mỗi toolbar rich-text — VD "Tải ảnh" ở toolbar Lý thuyết, upload
   * transcript... — đều có input file ẩn riêng). Test thật chỉ cần input
   * file trong khối "Bài giảng đính kèm" → scope bằng xpath following ngay
   * sau heading đó, cùng pattern đã dùng cho btnCaiDatDiemNhanhPhaiPanel/
   * btnXoaTatCaCauHoiDuocChon ở trên.
   */
  readonly sectionBaiGiangDinhKem = this.page.getByText('Bài giảng đính kèm', { exact: true });
  readonly inputChooseFiles = this.sectionBaiGiangDinhKem.locator(
    'xpath=following::input[@type="file"][1]'
  );
  readonly btnLuuCapNhat = this.page.getByRole('button', { name: /Lưu cập nhật/i });
  readonly btnXemNoiDung = this.page.getByRole('button', { name: /Xem nội dung/i });

  async nhapLienKetVideo(url: string): Promise<this> {
    await this.jsClearAndType(this.inputLienKetVideo, url);
    return this;
  }

  async themDiemDung(): Promise<this> {
    await this.jsClick(this.btnThemDiemDung);
    return this;
  }

  async batTomTatBaiGiang(): Promise<this> {
    await this.jsClick(this.toggleTomTatBaiGiang);
    return this;
  }

  async batTaoTranscript(): Promise<this> {
    await this.jsClick(this.toggleTaoTranscript);
    return this;
  }

  async dinhKemBaiGiang(filePath: string): Promise<this> {
    await this.inputChooseFiles.setInputFiles(filePath);
    return this;
  }

  async luuCapNhat(): Promise<this> {
    await this.jsClick(this.btnLuuCapNhat);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    return this;
  }

  // ==================================================================
  // ---- 7: Hỏi và đáp ----
  // ==================================================================
  readonly sectionTaoHocLieu = this.page.getByText('Tạo học liệu', { exact: true });
  readonly btnTaoCauHoiMoi = this.page.getByRole('button', { name: /Tạo câu hỏi mới/i });
  readonly inputIdCauHoi = this.page.getByPlaceholder('ID câu hỏi');
  readonly btnTimKiemId = this.page.getByRole('button', { name: /Tìm kiếm/i });
  readonly panelDanhSachCauHoi = this.page.getByText('Danh sách câu hỏi', { exact: true });
  readonly btnLuuSapXep = this.page.getByRole('button', { name: /Lưu sắp xếp/i });
  readonly btnCopyLink = this.page.getByRole('button', { name: /^Copy$/i });

  /** TODO: modal "Tạo câu hỏi tự luận" mới CHƯA có ảnh/HTML thật của nội dung bên trong */
  async clickTaoCauHoiMoi(): Promise<this> {
    await this.jsClick(this.btnTaoCauHoiMoi);
    return this;
  }

  async timCauHoiTheoId(id: string): Promise<this> {
    await this.jsClearAndType(this.inputIdCauHoi, id);
    await this.jsClick(this.btnTimKiemId);
    return this;
  }

  /** Kéo-thả sắp xếp lại câu hỏi rồi lưu — TODO: drag&drop cần xác nhận cơ chế thật (data-testid) để giả lập bằng dragTo() */
  async luuSapXepCauHoi(): Promise<this> {
    await this.jsClick(this.btnLuuSapXep);
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    return this;
  }

  async copyLinkHocLieu(): Promise<this> {
    await this.jsClick(this.btnCopyLink);
    return this;
  }

  // ==================================================================
  // Helper: ánh xạ CoursewareType -> tiêu đề panel chính để assert nhanh
  // học liệu vừa mở đúng loại kỳ vọng.
  // ==================================================================
  expectedMainHeaderFor(type: CoursewareType): Locator {
    switch (type) {
      case CoursewareType.LUYEN_TAP_TRAC_NGHIEM:
        return this.sectionHeaderHocLieu;
      case CoursewareType.DE_THI_THONG_MINH:
      case CoursewareType.DE_THI_THPT:
      case CoursewareType.DANG_BAI_KY_NANG_NHCH:
        return this.sectionHeaderDeThi;
      case CoursewareType.LY_THUYET_TUONG_TAC:
        return this.radioSoanThaoNoiDung;
      case CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG:
        return this.sectionTaoHocLieuVideo;
      case CoursewareType.HOI_VA_DAP:
        return this.sectionTaoHocLieu;
      default:
        throw new Error(`Chưa map header cho CoursewareType=${type}`);
    }
  }

  async expectOpenedAsType(type: CoursewareType): Promise<void> {
    await expect(this.expectedMainHeaderFor(type)).toBeVisible({ timeout: 10_000 });
  }
}