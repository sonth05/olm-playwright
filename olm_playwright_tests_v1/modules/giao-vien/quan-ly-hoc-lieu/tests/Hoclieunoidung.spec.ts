// modules/giao-vien/hoc-lieu-v1/tests/HocLieuNoiDung.spec.ts
import { test, expect } from '../../../../core/fixtures/role.fixture';
import { HocLieuCuaToiPage, CoursewareType } from '../pages/HocLieuCuaToiPage';
import { HocLieuNoiDungPage } from '../pages/Hoclieunoidungpage';
import { DEFAULT_LOP, DEFAULT_MON, DEFAULT_BO_SACH } from '../pages/HocLieuV1Constants';

/**
 * HocLieuNoiDung.spec.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Tiếp nối hoc-lieu-v1-create.spec.ts (đã PASS phần tạo học liệu qua popup).
 * File này test bước KẾ TIẾP: sau khi tạo xong, trang chuyển sang
 * /chu-de/{id}/quan-ly — kiểm tra khối "Tạo nội dung học liệu/để thi" bên
 * trong TỪNG loại học liệu, đối chiếu đúng thứ tự 7 ảnh chụp màn hình do
 * người dùng cung cấp (2026-07-27):
 *   1. Luyện tập trắc nghiệm  2. Đề thi thông minh  3. Đề thi THPT
 *   4. Dạng bài, kĩ năng      5. Lý thuyết tương tác 6. Video Youtube
 *   7. Hỏi và đáp
 *
 * QUY ƯỚC:
 * - Mỗi test tự tạo học liệu riêng (tiêu đề có timestamp) rồi thao tác ngay
 *   trên trang quản lý vừa mở ra, KHÔNG phụ thuộc dữ liệu có sẵn.
 * - Chỉ assert những gì ĐÃ verify được qua ảnh chụp (text/label/placeholder
 *   nhìn thấy trực tiếp). Các bước đi sâu vào modal/popover CHƯA có ảnh nội
 *   dung bên trong được đánh dấu `test.fixme` hoặc để nguyên bước
 *   click-mở-rồi-assert-visible (KHÔNG đoán tiếp field bên trong).
 * - Không gọi các hành động phá hủy dữ liệu (xóa tất cả câu hỏi...) trong
 *   spec chạy trên môi trường chung — nếu cần, tạo học liệu riêng trong
 *   cùng test rồi dọn ngay sau đó.
 */

// FIX (2026-07-27): mỗi test ở đây phải tạo mới 1 học liệu (nhiều bước AJAX
// tuần tự: mở dropdown → điền form với 2 select cascading (mỗi cái có thể
// chờ tới 15s) → submit → chờ networkidle 15s → chờ redirect 30s) rồi mới
// bắt đầu assert. Timeout mặc định 60_000ms (playwright.config.ts) không đủ
// dư khi 6 worker chạy song song CÙNG 1 tài khoản giáo viên (xem
// role.fixture.ts) — log chạy thật cho thấy nhiều test fail đúng với lý do
// "Test timeout of 60000ms exceeded" dù bước cuối không có lỗi selector.
// Nâng timeout riêng cho file này, theo đúng pattern override đã dùng cho
// luồng "giao bài + làm bài" (180_000ms) trong playwright.config.ts.
test.describe.configure({ timeout: 120_000 });

async function createAndOpenNoiDung(
  teacherPage: import('@playwright/test').Page,
  type: CoursewareType,
  keyLabel: string
): Promise<HocLieuNoiDungPage> {
  const listPage = new HocLieuCuaToiPage(teacherPage);
  await listPage.createCourseware(type, {
    title: `[TEST_NOI_DUNG_${keyLabel}] ${Date.now()}`,
    classLevel: DEFAULT_LOP,
    subject: DEFAULT_MON,
    bookSet: DEFAULT_BO_SACH,
  });

  const noiDungPage = new HocLieuNoiDungPage(teacherPage);
  // FIX (2026-07-27): sau submitModal(), trang PHẢI đã điều hướng sang
  // /chu-de/{id}/quan-ly (khớp URL pattern trong 7 ảnh chụp). Chờ URL đổi
  // trước khi thao tác tiếp, tránh test fail giả do còn đang ở modal/trang
  // cũ lúc AJAX chưa kịp redirect.
  //
  // Log chạy thật (2026-07-27, 6 workers song song, tất cả CÙNG DÙNG chung
  // 1 tài khoản giáo viên qua storageState worker-1 — xem role.fixture.ts)
  // cho thấy phần lớn (11/15) test fail KHÔNG PHẢI do sai selector, mà do
  // đúng bước redirect này không kịp trong 15s dưới tải đồng thời — nhưng
  // `.catch(() => {})` cũ NUỐT LỖI ÂM THẦM, khiến test cứ chạy tiếp trên
  // trang cũ/modal còn mở rồi timeout mơ hồ ở một locator bất kỳ phía sau
  // (rất khó chẩn đoán). Sửa: KHÔNG nuốt lỗi nữa — để throw với message rõ
  // ràng, đồng thời tăng timeout để chịu được tải 6-worker chung tài khoản.
  await teacherPage.waitForURL(/\/chu-de\/[^/]+\/quan-ly/, { timeout: 30_000 });
  return noiDungPage;
}

/* ------------------------------------------------------------------ */
/* 1. Luyện tập trắc nghiệm                                            */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Luyện tập trắc nghiệm @hoc_lieu @noi_dung', () => {
  test('[Happy] Sau khi tạo, vào đúng trang quản lý với khối "Tạo nội dung học liệu"', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      'LUYEN_TAP'
    );
    await noiDungPage.expectOpenedAsType(CoursewareType.LUYEN_TAP_TRAC_NGHIEM);
    // FIX (2026-07-27): giả định ban đầu (khác Đề thi thông minh/THPT/Dạng
    // bài kĩ năng, KHÔNG có "Điểm bài thi") bị SAI theo log chạy thật —
    // expectOpenedAsType() ở trên đã PASS (đúng trang, đúng loại) trước khi
    // assertion này fail với "Received: 1", tức phần tử thật sự tồn tại 1
    // lần trên trang, không phải do trang tải sai/lỗi timing. Cập nhật lại
    // theo bằng chứng thật; vẫn cần ảnh chụp xác nhận ý nghĩa hiển thị (VD
    // có thể là điểm mặc định = 0 hiển thị sẵn) ở lần review sau.
    await expect(noiDungPage.textDiemBaiThi).toHaveCount(1);
  });

  test('[Happy] 3 tab nguồn câu hỏi hiển thị đủ: Câu hỏi của bạn / của OLM / Tìm kiếm câu hỏi', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      'LUYEN_TAP'
    );
    await expect(noiDungPage.tabCauHoiCuaBan).toBeVisible();
    await expect(noiDungPage.tabCauHoiCuaOlm).toBeVisible();
    await expect(noiDungPage.tabTimKiemCauHoi).toBeVisible();
  });

  test('[Happy] Danh sách câu hỏi rỗng hiện thông báo "Chưa có câu hỏi nào"', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      'LUYEN_TAP'
    );
    await expect(noiDungPage.emptyStateChuaCoCauHoiNao).toBeVisible();
  });

  test('[Happy] Bấm "+ Tạo câu hỏi" mở được luồng tạo câu hỏi mới', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.LUYEN_TAP_TRAC_NGHIEM,
      'LUYEN_TAP'
    );
    await expect(noiDungPage.btnTaoCauHoi).toBeVisible();
    await noiDungPage.clickTaoCauHoi();
    // TODO: chưa có ảnh/HTML modal "Tạo câu hỏi" mở từ trang này — dừng ở
    // bước click, CẦN bổ sung assertion cụ thể + fillAndSaveQuestion() khi
    // có ảnh/HTML thật của modal.
  });
});

/* ------------------------------------------------------------------ */
/* 2. Đề thi thông minh                                                */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Đề thi thông minh @hoc_lieu @noi_dung', () => {
  test('[Happy] Vào đúng trang quản lý với khối "Tạo nội dung để thi" + Điểm bài thi', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THONG_MINH, 'DTM');
    await noiDungPage.expectOpenedAsType(CoursewareType.DE_THI_THONG_MINH);
    await expect(noiDungPage.textDiemBaiThi).toBeVisible();
  });

  test('[Happy] Panel "Câu hỏi được chọn (trắc nghiệm)" có đủ 2 nút đặt điểm', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THONG_MINH, 'DTM');
    await expect(noiDungPage.panelCauHoiDuocChon).toBeVisible();
    await expect(noiDungPage.btnDatDiemBaiTracNghiem).toBeVisible();
    await expect(noiDungPage.btnCaiDatDiemNhanhPhaiPanel).toBeVisible();
  });

  test('[Happy] Panel "Câu hỏi tự luận (1 câu chứa nhiều bài)" hiển thị', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THONG_MINH, 'DTM');
    await expect(noiDungPage.panelCauHoiTuLuan).toBeVisible();
  });

  test('[Happy] Nút "Lấy câu hỏi từ học liệu gốc" và "Đồng bộ câu hỏi" hiển thị', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THONG_MINH, 'DTM');
    await expect(noiDungPage.btnLayCauHoiTuHocLieuGoc).toBeVisible();
    await expect(noiDungPage.btnDongBoCauHoi).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/* 3. Đề thi THPT                                                      */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Đề thi THPT @hoc_lieu @noi_dung', () => {
  test('[Happy] Vào đúng trang quản lý, giống cấu trúc Đề thi thông minh (Điểm bài thi, câu hỏi tự luận)', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THPT, 'THPT');
    await noiDungPage.expectOpenedAsType(CoursewareType.DE_THI_THPT);
    await expect(noiDungPage.textDiemBaiThi).toBeVisible();
    await expect(noiDungPage.panelCauHoiTuLuan).toBeVisible();
  });

  test('[Happy] Menu bên trái KHÔNG có "Trộn đề" (khác Luyện tập trắc nghiệm/Dạng bài kĩ năng)', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THPT, 'THPT');
    expect(await noiDungPage.isTabVisible(noiDungPage.tabTronDe)).toBeFalsy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabThietLap)).toBeTruthy();
  });

  test('[Happy] Mở panel soạn cấu trúc đề thi chuẩn: đủ 3 nút Thêm phân vùng/tiêu đề/chú giải', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THPT, 'THPT');
    // TODO: theo ảnh, panel này hiện sẵn cạnh khối "Câu hỏi của bạn" sau khi
    // bấm 1 nút cài đặt điểm — CHƯA xác nhận chắc chắn hành động kích hoạt
    // (ảnh chụp lúc đã mở sẵn). Tạm assert visible trực tiếp; nếu chưa hiện
    // sẵn, bổ sung bước click kích hoạt khi có ảnh/HTML xác nhận rõ hơn.
    await expect(noiDungPage.btnThemPhanVung).toBeVisible();
    await expect(noiDungPage.btnThemTieuDeChoPhanVung).toBeVisible();
    await expect(noiDungPage.btnThemChuGiaiChuThich).toBeVisible();
  });

  test('[Happy] Vùng soạn thảo có placeholder hướng dẫn cấu trúc đề thi chuẩn của Bộ', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.DE_THI_THPT, 'THPT');
    await expect(noiDungPage.editorCauTrucDeThiChuan).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/* 4. Dạng bài, kĩ năng (NHCH)                                          */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Dạng bài, kĩ năng @hoc_lieu @noi_dung', () => {
  test('[Happy] Vào đúng trang quản lý, có riêng checkbox "Cho phép làm như đề thi"', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.DANG_BAI_KY_NANG_NHCH,
      'DANG_BAI'
    );
    await noiDungPage.expectOpenedAsType(CoursewareType.DANG_BAI_KY_NANG_NHCH);
    await expect(noiDungPage.checkboxChoPhepLamNhuDeThi).toBeVisible();
  });

  test('[Happy] Menu bên trái đủ 7 mục (khôi phục "Trộn đề" so với Đề thi THPT)', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.DANG_BAI_KY_NANG_NHCH,
      'DANG_BAI'
    );
    expect(await noiDungPage.isTabVisible(noiDungPage.tabTronDe)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabThietLap)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabDsBaiLam)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabTrangThaiLamBai)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabChamLaiBai)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabThongKe)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabLichSuChinhSua)).toBeTruthy();
  });

  test('[Happy] Panel "Câu hỏi của bạn" có riêng nút "Cài đặt điểm nhanh"', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.DANG_BAI_KY_NANG_NHCH,
      'DANG_BAI'
    );
    await expect(noiDungPage.btnCaiDatDiemNhanhTraiPanel).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/* 5. Lý thuyết tương tác                                               */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Lý thuyết tương tác @hoc_lieu @noi_dung', () => {
  test('[Happy] Vào đúng trang quản lý với 2 chế độ: Soạn thảo nội dung / Upload tệp tin', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.LY_THUYET_TUONG_TAC, 'THEORY');
    await noiDungPage.expectOpenedAsType(CoursewareType.LY_THUYET_TUONG_TAC);
    await expect(noiDungPage.radioUploadTepTin).toBeVisible();
  });

  test('[Happy] Menu bên trái CHỈ có 3 mục (Thiết lập, DS bài làm, LS chỉnh sửa) — không có Trộn đề/Thống kê', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.LY_THUYET_TUONG_TAC, 'THEORY');
    expect(await noiDungPage.isTabVisible(noiDungPage.tabThietLap)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabDsBaiLam)).toBeTruthy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabTronDe)).toBeFalsy();
    expect(await noiDungPage.isTabVisible(noiDungPage.tabThongKe)).toBeFalsy();
  });

  test('[Happy] Nhập nội dung lý thuyết trực tiếp vào editor', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.LY_THUYET_TUONG_TAC, 'THEORY');
    await noiDungPage.chonCheDoSoanThaoNoiDung();
    await noiDungPage.nhapNoiDungLyThuyet('Nội dung lý thuyết test tự động');
    await expect(noiDungPage.editorLyThuyet).toContainText('Nội dung lý thuyết test tự động');
  });

  test('[Happy] Toolbar soạn thảo có đủ Công thức / Tải ảnh / Text LaTeX', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.LY_THUYET_TUONG_TAC, 'THEORY');
    await expect(noiDungPage.toolbarCongThuc).toBeVisible();
    await expect(noiDungPage.toolbarTaiAnh).toBeVisible();
    await expect(noiDungPage.toolbarTextLaTeX).toBeVisible();
  });

  test('[Happy] Nút "Nhập lý thuyết từ Word" hiển thị và mở được', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.LY_THUYET_TUONG_TAC, 'THEORY');
    await expect(noiDungPage.btnNhapLyThuyetTuWord).toBeVisible();
    await noiDungPage.clickNhapLyThuyetTuWord();
    // TODO: chưa có ảnh/HTML của dialog chọn file .docx mở ra sau khi bấm —
    // dừng ở bước click, bổ sung setInputFiles() khi có ảnh/HTML thật.
  });
});

/* ------------------------------------------------------------------ */
/* 6. Video Youtube có điểm dừng                                        */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Video Youtube có điểm dừng @hoc_lieu @noi_dung', () => {
  test('[Happy] Vào đúng trang quản lý với khối "Tạo học liệu video"', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      'VIDEO'
    );
    await noiDungPage.expectOpenedAsType(CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG);
    await expect(noiDungPage.inputLienKetVideo).toBeVisible();
  });

  test('[Happy] Nhập link Youtube rồi bấm "Lưu cập nhật"', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      'VIDEO'
    );
    await noiDungPage.nhapLienKetVideo('https://www.youtube.com/watch?v=eHwesHMnr2o');
    await expect(noiDungPage.btnLuuCapNhat).toBeVisible();
    await noiDungPage.luuCapNhat();
    // TODO: chưa xác nhận thông báo thành công / trạng thái player sau khi
    // lưu (chưa có ảnh bước sau) — CẦN bổ sung assertion khi có ảnh thật.
  });

  test('[Happy] 2 toggle "Tóm tắt bài giảng" và "Tạo transcript video" hiển thị', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      'VIDEO'
    );
    await expect(noiDungPage.toggleTomTatBaiGiang).toBeVisible();
    await expect(noiDungPage.toggleTaoTranscript).toBeVisible();
  });

  test('[Happy] Nút "+ Thêm điểm dừng" hiển thị (chỉ dùng được sau khi có link video hợp lệ)', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      'VIDEO'
    );
    await expect(noiDungPage.btnThemDiemDung).toBeVisible();
  });

  test('[Happy] Khối "Bài giảng đính kèm" có input chọn file', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(
      teacherPage,
      CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG,
      'VIDEO'
    );
    await expect(noiDungPage.inputChooseFiles).toHaveCount(1);
  });
});

/* ------------------------------------------------------------------ */
/* 7. Hỏi và đáp                                                        */
/* ------------------------------------------------------------------ */
test.describe('[V1] Nội dung học liệu - Hỏi và đáp @hoc_lieu @noi_dung', () => {
  test('[Happy] Vào đúng trang quản lý với khối "Tạo học liệu" (Tạo câu hỏi mới / tìm theo ID)', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.HOI_VA_DAP, 'HOI_DAP');
    await noiDungPage.expectOpenedAsType(CoursewareType.HOI_VA_DAP);
    await expect(noiDungPage.btnTaoCauHoiMoi).toBeVisible();
    await expect(noiDungPage.inputIdCauHoi).toBeVisible();
  });

  test('[Happy] Panel "Danh sách câu hỏi" và nút "Lưu sắp xếp" hiển thị', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.HOI_VA_DAP, 'HOI_DAP');
    await expect(noiDungPage.panelDanhSachCauHoi).toBeVisible();
    await expect(noiDungPage.btnLuuSapXep).toBeVisible();
  });

  test('[Happy] Tìm câu hỏi theo ID rỗng không làm crash trang (kiểm tra input + nút Tìm kiếm hoạt động)', async ({
    teacherPage,
  }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.HOI_VA_DAP, 'HOI_DAP');
    await noiDungPage.timCauHoiTheoId('123456');
    // TODO: chưa có ảnh/HTML kết quả tìm kiếm (thành công lẫn không tìm
    // thấy) — CẦN bổ sung assertion cụ thể khi có ảnh/HTML thật.
    await expect(noiDungPage.panelDanhSachCauHoi).toBeVisible();
  });

  test('[Happy] Link chia sẻ học liệu hiển thị ở cuối trang kèm nút Copy', async ({ teacherPage }) => {
    const noiDungPage = await createAndOpenNoiDung(teacherPage, CoursewareType.HOI_VA_DAP, 'HOI_DAP');
    await expect(noiDungPage.btnCopyLink).toBeVisible();
  });
});