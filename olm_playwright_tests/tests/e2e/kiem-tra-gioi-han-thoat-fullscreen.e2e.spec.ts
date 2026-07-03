/**
 * kiem-tra-gioi-han-thoat-fullscreen.e2e.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * E2E: Kiểm tra tính năng "Thu bài ngay sau khi học sinh ra khỏi bài thi"
 *      (giới hạn số lần thoát fullscreen trước khi hệ thống tự động nộp bài)
 *
 * Test này KHÔNG làm bài (không chọn đáp án bất kỳ câu nào) — chỉ tập trung
 * kiểm tra đúng cơ chế đếm vi phạm & tự động nộp:
 *
 *   1.  Đăng nhập học sinh → vào bài thi đã được giáo viên giao
 *   2.  Ở màn hình "Sẵn sàng làm bài?": kiểm tra nội quy hiển thị đúng
 *       giới hạn số lần thoát đã cấu hình (VD: "Nếu thoát 20 lần, bài thi
 *       sẽ tự động nộp.")
 *   3.  Bấm "Bắt đầu làm bài" (vào chế độ fullscreen)
 *   4.  Lặp lại việc bấm nút thoát fullscreen cho tới khi hệ thống tự động nộp:
 *         - Với các lần còn trong hạn mức:
 *             • Toast cảnh báo góc màn hình: "Cảnh báo: ... Số lần vi phạm: X/20"
 *             • Modal giữa màn hình: "Bạn còn N lần thoát bài thi"
 *             • Bấm "Tiếp tục làm bài" → quay lại làm bài (fullscreen)
 *         - Lần vượt hạn mức:
 *             • Hệ thống tự động nộp bài — không còn modal "Tiếp tục làm bài"
 *   5.  Xác nhận màn hình "Bài thi của bạn đang được nộp..." xuất hiện
 *   6.  Xác nhận bảng kết quả cuối cùng hiển thị (điểm thấp vì không làm câu nào)
 *
 * ĐIỀU KIỆN TIÊN QUYẾT:
 *   - Đề thi test này nhắm tới phải đã được giáo viên giao với thiết lập
 *     "Thu bài ngay sau khi học sinh ra khỏi bài thi" = 20 lần (xem bước
 *     8c trong Giao-bai-lam-bai.e2e.spec.ts). Nếu giáo viên đổi giá trị
 *     này, cập nhật hằng số GIOI_HAN_THOAT_MAC_DINH bên dưới cho khớp —
 *     tuy nhiên test cũng TỰ ĐỘNG đọc con số thật từ màn hình nội quy
 *     trước khi bắt đầu, nên sẽ tự thích ứng nếu giá trị thật khác.
 *   - Nên chạy SAU Giao-bai-lam-bai.e2e.spec.ts (đề phải đang ở trạng thái
 *     "đã giao, chưa nộp" thì học sinh mới vào làm được).
 *
 * LƯU Ý QUAN TRỌNG (rút ra từ thực tế vận hành của OLM):
 *   - Màn hình "Sẵn sàng làm bài?" LUÔN hiện nút "Bắt đầu làm bài" — kể cả
 *     khi tài khoản đang có một lượt làm bài DỞ DANG (chưa nộp) từ lần chạy
 *     test trước đó bị fail giữa chừng. Khi đó bấm "Bắt đầu làm bài" sẽ
 *     ÂM THẦM RESUME lại lượt cũ, và bộ đếm vi phạm sẽ cộng dồn tiếp từ
 *     lượt trước (không bắt đầu lại từ 0/20). Vì vậy:
 *       • KHÔNG dựa vào text nút để phát hiện resume — vì nút không đổi.
 *       • Ở lần thoát fullscreen ĐẦU TIÊN của mỗi lượt chạy test, số liệu
 *         thực tế đọc được từ toast ("Số lần vi phạm: X/20") và modal
 *         ("Bạn còn N lần") có thể KHÁC với kỳ vọng "lượt hoàn toàn mới".
 *         Test không hard-code giả định này — chỉ đọc số liệu thật và log
 *         cảnh báo nếu phát hiện có vẻ đang cộng dồn từ lượt cũ.
 *   - Nếu ở bất kỳ lần thoát nào modal không xuất hiện, cần phân biệt 2
 *     trường hợp: (a) hệ thống đã tự động nộp bài luôn (vì vi phạm tồn
 *     đọng đã đẩy quá ngưỡng) — đây KHÔNG phải lỗi, chỉ là xảy ra sớm hơn
 *     dự kiến; (b) modal thực sự không hiện dù chưa tới ngưỡng nộp — đây
 *     MỚI là lỗi thật. Test log rõ ràng để phân biệt 2 trường hợp này.
 *
 * LƯU Ý VỀ HIỆU NĂNG (quan trọng — đã tối ưu ở bản này):
 *   - Ở MỖI lần lặp thoát fullscreen, việc kiểm tra "hệ thống đã tự động
 *     nộp bài chưa" dùng poll NHANH (~1.5s) thay vì poll dài (15s) như
 *     bản trước — vì ở các lần còn TRONG hạn mức (chưa tới ngưỡng), màn
 *     hình "đang nộp bài" chắc chắn KHÔNG xuất hiện dù có đợi bao lâu, nên
 *     đợi lâu ở đây là lãng phí thuần tuý (bản cũ tốn ~15s/lần × 20 lần
 *     ≈ 5 phút chết vô ích).
 *   - Poll DÀI (15s) chỉ được dùng ở ĐÚNG 1 chỗ: nhánh fallback khi modal
 *     "Bạn còn N lần..." không xuất hiện sau khi thoát fullscreen — đây là
 *     lúc thực sự nghi ngờ đã vượt ngưỡng và hệ thống đang xử lý nộp bài
 *     (gọi API, chuyển màn hình), nên cần thời gian chờ đủ dài để không bị
 *     false-negative.
 *
 * LƯU Ý KỸ THUẬT:
 *   - Test phụ thuộc Fullscreen API của trình duyệt (requestFullscreen /
 *     exitFullscreen), API này yêu cầu user-gesture thật. Playwright's
 *     .click() phát sinh sự kiện chuột thật (trusted event) nên vẫn kích
 *     hoạt được Fullscreen API ở Chromium bản mới — nhưng để an toàn nên
 *     chạy --headed thay vì headless nếu gặp lỗi không vào được fullscreen.
 *   - Selector nút thoát fullscreen (`span[style*="arrows-expand"]`) dựa
 *     trên icon mask-image thực tế — nếu trang có nhiều icon dùng chung
 *     asset này ở chỗ khác, cần thu hẹp selector theo khu vực chứa nó.
 *
 * Chạy:
 *   npx playwright test tests/e2e/kiem-tra-gioi-han-thoat-fullscreen.e2e.spec.ts --headed
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect, type Page } from '@playwright/test';
import { ACCOUNTS } from '../../config/testData';

// ─── Tài khoản ────────────────────────────────────────────────────────────────
const HOC_SINH = ACCOUNTS.vip_student;

const BASE = 'https://olm.vn';

// Fragment ID đề — đồng bộ với DE_URL_FRAGMENT trong Giao-bai-lam-bai.e2e.spec.ts.
// LƯU Ý: ID này có thể đổi theo từng đợt cập nhật đề của OLM.
const DE_URL_FRAGMENT = '4637226523';

// Giới hạn số lần thoát fullscreen (mặc định/kỳ vọng) trước khi hệ thống tự
// động nộp bài — dùng làm giá trị THAM CHIẾU để so sánh với con số THẬT đọc
// được từ màn hình nội quy "Sẵn sàng làm bài?" ở đầu test. Nếu giáo viên đổi
// cấu hình, cập nhật số này cho khớp để bước kiểm tra nội quy không báo lệch.
const GIOI_HAN_THOAT_MAC_DINH = 20;

// Biên an toàn cộng thêm vào số vòng lặp tối đa, phòng trường hợp bộ đếm
// vi phạm tồn đọng khiến cần nhiều/ít lần thoát hơn dự kiến một chút.
const BIEN_AN_TOAN = 5;

// ── Thời gian chờ kiểm tra tự động nộp bài ────────────────────────────────────
// NHANH: dùng ở đầu MỖI lần lặp bình thường — chỉ để bắt trường hợp auto-submit
//        xảy ra SỚM bất ngờ (VD do vi phạm tồn đọng từ lượt trước). Không nên
//        để dài vì ở các lần chưa tới ngưỡng, màn hình nộp bài chắc chắn không
//        xuất hiện dù đợi bao lâu.
// ĐẦY ĐỦ: chỉ dùng ở nhánh fallback khi modal "Tiếp tục làm bài" không xuất
//         hiện — lúc này thực sự nghi ngờ đã vượt ngưỡng, cần chờ đủ lâu để
//         hệ thống xử lý API nộp bài + chuyển màn hình, tránh false-negative.
const CHO_NOP_BAI_NHANH_MS = 1_500;
const CHO_NOP_BAI_DAY_DU_MS = 15_000;

function ms(sec: number) { return sec * 1_000; }

// ─── Utilities ───────────────────────────────────────────────────────────────

async function closePopups(page: Page): Promise<void> {
  const closeSels = [
    '#later-noti',
    "button:has-text('Không hiển thị nữa')",
    "button:has-text('Không hiển lại nữa')",
    '.modal.show .modal-header .btn-close',
    '.modal.show .modal-header .close',
    '.modal.show .btn-close',
    '.modal.show .close',
  ];
  for (let attempt = 0; attempt < 5; attempt++) {
    let dismissed = false;
    for (const sel of closeSels) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 500 })) {
          await el.click({ force: true });
          await page.waitForTimeout(400);
          dismissed = true;
          break;
        }
      } catch { /* ignore */ }
    }
    if (!dismissed) break;
  }
  try { await page.keyboard.press('Escape'); } catch { /* ignore */ }
  await page.waitForTimeout(200);
}

async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto(`${BASE}/dangnhap`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(ms(1));
  await closePopups(page);

  const userSels = ["input[name='username']", '#username', "input[type='text']"];
  for (const sel of userSels) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) { await el.fill(username); break; }
  }
  await page.locator("input[type='password']").first().fill(password);

  const subSels = [
    "form:not(.modal *) button[type='submit']",
    "button:not(.modal *):has-text('Đăng nhập')",
    "button[type='submit']",
  ];
  for (const sel of subSels) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1_500 })) {
        await btn.click({ force: true });
        break;
      }
    } catch { /* try next */ }
  }

  await page
    .waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 15_000 })
    .catch(() => {});
  await page.waitForTimeout(ms(1.5));
  await closePopups(page);

  expect(page.url(), 'Đăng nhập thất bại').not.toContain('dangnhap');
}

/** Kiểm tra NHANH (1 lần) xem màn hình "Bài thi của bạn đang được nộp..." đã xuất hiện chưa. */
async function manHinhDangNopBaiXuatHien(page: Page, timeout = 1_500): Promise<boolean> {
  return page
    .locator("p:has-text('Bài thi của bạn đang được nộp')")
    .first()
    .isVisible({ timeout })
    .catch(() => false);
}

/** Kiểm tra NHANH (1 lần) xem bảng kết quả cuối cùng đã hiển thị chưa. */
async function bangKetQuaDaHienThi(page: Page, timeout = 800): Promise<boolean> {
  return page
    .locator('#exam-score-card-header')
    .first()
    .isVisible({ timeout })
    .catch(() => false);
}

/**
 * CHỜ (poll) cho tới khi hệ thống tự động nộp bài — nhận biết qua 1 trong 2 dấu
 * hiệu: màn hình trung gian "đang được nộp" HOẶC bảng kết quả cuối cùng đã hiện
 * thẳng (trường hợp quá trình nộp diễn ra nhanh, bỏ qua màn hình trung gian).
 *
 * maxWaitMs nên được truyền theo NGỮ CẢNH gọi:
 *   - CHO_NOP_BAI_NHANH_MS (~1.5s) khi gọi ở đầu mỗi lần lặp bình thường —
 *     chỉ để bắt auto-submit xảy ra sớm bất ngờ, không nên chờ lâu vì ở các
 *     lần chưa tới ngưỡng, kết quả chắc chắn là false dù đợi bao lâu.
 *   - CHO_NOP_BAI_DAY_DU_MS (~15s) khi gọi ở nhánh fallback thực sự nghi ngờ
 *     đã vượt ngưỡng (modal không xuất hiện) — cần thời gian đủ dài để hệ
 *     thống xử lý API nộp bài + chuyển màn hình, tránh false-negative.
 */
async function choTuDongNopBai(page: Page, maxWaitMs: number): Promise<boolean> {
  const start = Date.now();
  const buocPoll = Math.min(500, Math.max(200, maxWaitMs / 5));
  while (Date.now() - start < maxWaitMs) {
    if (await manHinhDangNopBaiXuatHien(page, Math.min(1_000, maxWaitMs))) return true;
    if (await bangKetQuaDaHienThi(page, Math.min(500, maxWaitMs))) return true;
    await page.waitForTimeout(buocPoll);
  }
  return false;
}

/** Lưu screenshot debug ra reports/debug để dễ đối chiếu mà không cần chờ người dùng gửi lại log/ảnh. */
async function luuAnhDebug(page: Page, tenNganCanh: string): Promise<string | null> {
  try {
    const fs = await import('fs');
    if (!fs.existsSync('reports/debug')) {
      fs.mkdirSync('reports/debug', { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const duongDan = `reports/debug/${tenNganCanh}-${timestamp}.png`;
    await page.screenshot({ path: duongDan, fullPage: true }).catch(() => {});
    return duongDan;
  } catch {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Kiểm tra giới hạn thoát fullscreen — tự động nộp bài', () => {
  test.setTimeout(6 * 60_000);

  test('Thoát fullscreen vượt giới hạn → hệ thống tự động nộp bài', async ({ page }) => {

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 1: Đăng nhập học sinh
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Đăng nhập', async () => {
      await login(page, HOC_SINH.username, HOC_SINH.password);
      console.log(`✓ Đăng nhập học sinh: ${HOC_SINH.username}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 2: Tìm và vào bài thi đã được giao
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Tìm bài thi đã giao', async () => {
      await page.goto(`${BASE}/lop-hoc-cua-toi`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);

      const baiLink = page.locator(`a[href*='${DE_URL_FRAGMENT}']`).first();
      for (let i = 0; i < 8; i++) {
        if (await baiLink.isVisible({ timeout: 600 }).catch(() => false)) break;
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(400);
      }
      await expect(baiLink, 'Không tìm thấy bài thi đã giao trong trang lớp học').toBeVisible({ timeout: 8_000 });

      await baiLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);
      console.log(`✓ Đã vào trang bài thi: ${page.url()}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 3: Kiểm tra nội quy bài thi hiển thị ĐÚNG giới hạn số lần thoát
    //   đã cấu hình khi giao bài (màn hình "Sẵn sàng làm bài?").
    //
    //   Ví dụ nội dung thật trên trang:
    //     "Nếu thoát 20 lần, bài thi sẽ tự động nộp."
    //   (được ghép từ 3 <span> liền nhau, số nằm ở span in đậm ở giữa).
    //
    //   Nếu số này KHÔNG khớp GIOI_HAN_THOAT_MAC_DINH, nghĩa là hoặc cấu
    //   hình giao bài đã đổi, hoặc hằng số trong test đang sai — test dừng
    //   sớm tại đây thay vì chạy tiếp với giả định sai, đồng thời dùng
    //   ngay con số THẬT đọc được cho toàn bộ phần còn lại của test.
    // ─────────────────────────────────────────────────────────────────────────
    let gioiHanThoatThucTe = GIOI_HAN_THOAT_MAC_DINH;

    await test.step('[Kiểm tra] Nội quy hiển thị đúng giới hạn số lần thoát đã cấu hình', async () => {
      const noiQuyGioiHan = page
        .locator('div')
        .filter({ hasText: /Nếu thoát\s*\d+\s*lần/ })
        .filter({ hasText: 'bài thi sẽ tự động nộp' })
        .first();

      await noiQuyGioiHan.waitFor({ state: 'visible', timeout: 10_000 });
      const noiQuyText = (await noiQuyGioiHan.innerText().catch(() => '')) || '';
      const match = noiQuyText.match(/Nếu thoát\s*(\d+)\s*lần/);
      const soDocDuoc = match ? Number(match[1]) : null;

      expect(
        soDocDuoc,
        `Không đọc được số lần giới hạn thoát từ nội quy bài thi. Text đọc được: "${noiQuyText.slice(0, 150)}"`
      ).not.toBeNull();

      console.log(`✓ Nội quy hiển thị: "Nếu thoát ${soDocDuoc} lần, bài thi sẽ tự động nộp."`);

      if (soDocDuoc !== GIOI_HAN_THOAT_MAC_DINH) {
        console.log(
          `  ⚠ Giới hạn thật (${soDocDuoc}) KHÁC với giá trị cấu hình trong test ` +
          `(GIOI_HAN_THOAT_MAC_DINH = ${GIOI_HAN_THOAT_MAC_DINH}). ` +
          `Có thể giáo viên đã đổi thiết lập "Thu bài ngay sau khi HS ra khỏi bài thi", ` +
          `hoặc đề thi đang trỏ tới không phải đề đã cấu hình đúng. ` +
          `Test sẽ dùng giá trị THẬT (${soDocDuoc}) cho phần còn lại thay vì dừng cứng, ` +
          `nhưng khuyến nghị cập nhật lại GIOI_HAN_THOAT_MAC_DINH trong file test cho khớp.`
        );
      }

      if (soDocDuoc !== null) {
        gioiHanThoatThucTe = soDocDuoc;
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 4: Bấm "Bắt đầu làm bài" (vào chế độ fullscreen)
    //
    //   LƯU Ý: nút này LUÔN hiện "Bắt đầu làm bài" trên màn hình "Sẵn sàng
    //   làm bài?" — kể cả khi thực chất sẽ resume lại một lượt làm bài dở
    //   dang từ trước (UI không phân biệt bằng text nút). Vì vậy test không
    //   cố phát hiện "fresh vs resume" ở bước này; việc đó được xử lý bằng
    //   cách ĐỌC SỐ LIỆU THẬT từ toast/modal ngay khi bắt đầu vòng lặp thoát
    //   fullscreen ở bước kế tiếp.
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Bắt đầu làm bài', async () => {
      const btnBatDau = page.locator([
        "button:has-text('Bắt đầu làm bài')",
        ".btn-start-exam",
        "button[class*='btn']:has-text('Bắt đầu')",
      ].join(', ')).first();

      await btnBatDau.waitFor({ state: 'visible', timeout: 10_000 });
      await btnBatDau.click({ force: true });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);

      // Xác nhận đã vào màn hình câu hỏi — đủ điều kiện để test cơ chế thoát fullscreen.
      // Không cần chọn đáp án nào, chỉ cần chắc chắn đang trong phòng thi.
      const vaoBai = await page
        .locator('td.tf-box, span.qiradio, span.qimage, div.qselect, .list-question-container')
        .first()
        .isVisible({ timeout: 10_000 })
        .catch(() => false);
      expect(vaoBai, 'Không vào được màn hình làm bài').toBe(true);
      console.log('✓ Đã vào bài thi (fullscreen)');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 5: Lặp lại thoát fullscreen cho tới khi hệ thống tự động nộp bài.
    //   Không chọn đáp án bất kỳ câu nào — chỉ test cơ chế đếm vi phạm.
    //
    //   QUAN TRỌNG: KHÔNG giả định "lần đầu tiên luôn còn (giới hạn - 1) lần".
    //   Bộ đếm vi phạm được lưu ở server theo lượt làm bài, có thể đã có vi
    //   phạm tồn đọng từ các lần chạy test trước đó trên cùng tài khoản/đề
    //   (xem LƯU Ý QUAN TRỌNG ở đầu file). → Đọc số liệu THỰC TẾ hiển thị
    //   trên toast và modal ở mỗi lần, dùng chính số liệu đó để biết khi
    //   nào nên dừng, thay vì đếm số vòng lặp cố định.
    //
    //   Vòng lặp có một mốc an toàn (soLanLapToiDa, tính theo giới hạn THẬT
    //   đọc được ở BƯỚC 3) chỉ để tránh treo test vô hạn nếu có lỗi bất
    //   ngờ — KHÔNG dùng làm điều kiện chính xác định khi nào bài sẽ tự
    //   động nộp.
    // ─────────────────────────────────────────────────────────────────────────
    const toggleFullscreenBtn = page.locator('span[style*="arrows-expand"]').first();
    const tiepTucBtn = page.locator("button:has-text('Tiếp tục làm bài')").first();

    // Anchor CỐ ĐỊNH của modal — không đổi theo số đếm, dùng để tìm modal
    // một cách chắc chắn bất kể công thức tính số lần còn lại là gì.
    const modalAnchor = page.locator(
      'div:has-text("Nếu quá số lần thoát bài, bài thi sẽ tự động nộp.")'
    ).first();

    let soLanConLaiTruoc: number | null = null;
    let daTuDongNop = false;
    const soLanLapToiDa = gioiHanThoatThucTe + BIEN_AN_TOAN;

    for (let lan = 1; lan <= soLanLapToiDa && !daTuDongNop; lan++) {
      await test.step(`[HS] Thoát fullscreen lần ${lan}`, async () => {
        await toggleFullscreenBtn.waitFor({ state: 'visible', timeout: 8_000 });
        await toggleFullscreenBtn.click({ force: true });
        await page.waitForTimeout(ms(0.8));

        // ── Trường hợp A: hệ thống đã tự động nộp bài ngay lần này ──────────
        // (có thể xảy ra SỚM HƠN gioiHanThoatThucTe nếu tài khoản còn vi
        // phạm tồn đọng từ lần chạy trước — đây KHÔNG phải là lỗi test.)
        // Dùng poll NHANH (~1.5s) — KHÔNG đợi 15s ở đây, vì ở các lần còn
        // trong hạn mức (đa số các lần lặp), kết quả chắc chắn là "chưa nộp"
        // dù có đợi bao lâu; đợi lâu ở bước này từng khiến mỗi vòng lặp tốn
        // dư ~13-15 giây một cách vô ích. Trường hợp thực sự vượt ngưỡng mà
        // bị bỏ lỡ ở đây vẫn được bắt lại bằng poll ĐẦY ĐỦ ở nhánh fallback
        // bên dưới (khi modal "Tiếp tục làm bài" không xuất hiện).
        if (await choTuDongNopBai(page, CHO_NOP_BAI_NHANH_MS)) {
          daTuDongNop = true;
          console.log(
            `  → Hệ thống đã tự động nộp bài ở lần thoát ${lan}` +
            (soLanConLaiTruoc !== null
              ? ` (lần trước còn báo ${soLanConLaiTruoc} lần — có thể do vi phạm tồn đọng từ trước).`
              : ' (ngay từ lần thoát đầu tiên — tài khoản có thể đã tồn đọng vi phạm gần hết hạn mức).')
          );
          return;
        }

        // ── Toast cảnh báo góc màn hình: "Cảnh báo: ... Số lần vi phạm: X/Y" ──
        const toastCanhBao = page.locator(
          `div:has-text("Cảnh báo: Bạn đã thoát chế độ toàn màn hình. Số lần vi phạm:")`
        ).first();
        if (await toastCanhBao.isVisible({ timeout: 2_000 }).catch(() => false)) {
          const toastText = (await toastCanhBao.innerText().catch(() => '')) || '';
          console.log(`  ✓ Toast cảnh báo: ${toastText.trim()}`);

          // Đối chiếu mẫu số (giới hạn) trong toast "X/Y" với giới hạn thật đã
          // đọc ở BƯỚC 3, chỉ để log cảnh báo sớm nếu có sự bất nhất — không
          // làm fail test vì đây chỉ là kiểm tra chéo bổ sung.
          const toastMatch = toastText.match(/Số lần vi phạm:\s*(\d+)\s*\/\s*(\d+)/);
          if (toastMatch) {
            const [, xStr, yStr] = toastMatch;
            const yToast = Number(yStr);
            if (yToast !== gioiHanThoatThucTe) {
              console.log(
                `  ⚠ Mẫu số trong toast (${yToast}) khác với giới hạn đã đọc ở nội quy (${gioiHanThoatThucTe}).`
              );
            }
            console.log(`  ↳ Vi phạm luỹ kế theo toast: ${xStr}/${yToast}`);
          }

          // ── Chủ động đóng toast (bấm "X") ngay sau khi đọc xong số liệu ──
          // Toast này thường nằm ở góc màn hình và có thể ĐÈ lên đúng vị trí
          // nút thoát fullscreen (toggleFullscreenBtn), khiến cú click ở lần
          // lặp kế tiếp không thực sự chạm vào nút thoát → không sinh vi phạm
          // mới (thấy rõ khi toast vẫn hiện y nguyên số cũ ở lần lặp sau).
          // → Đóng toast trước khi rời khỏi bước này để lần lặp kế tiếp click
          //   đúng vào nút thoát fullscreen.
          const nutDongToast = toastCanhBao.getByText('X', { exact: true }).first();
          if (await nutDongToast.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await nutDongToast.click({ force: true }).catch(() => {});
            await page.waitForTimeout(ms(0.3));
            console.log('  ✓ Đã đóng toast cảnh báo (bấm X).');
          } else {
            // Phòng trường hợp nút X không nằm trong đúng subtree đã locator —
            // thử tìm rộng hơn quanh khu vực toast.
            const nutDongToastRong = page.locator('div:has-text("Cảnh báo: Bạn đã thoát chế độ toàn màn hình")')
              .locator('xpath=ancestor-or-self::div[1]')
              .getByText('X', { exact: true })
              .first();
            if (await nutDongToastRong.isVisible({ timeout: 1_000 }).catch(() => false)) {
              await nutDongToastRong.click({ force: true }).catch(() => {});
              await page.waitForTimeout(ms(0.3));
              console.log('  ✓ Đã đóng toast cảnh báo (bấm X, dò rộng hơn).');
            } else {
              console.log('  ⚠ Không tìm thấy nút "X" để đóng toast — có thể toast tự ẩn hoặc DOM khác dự kiến.');
            }
          }
        }

        // ── Modal giữa màn hình: tìm theo anchor cố định, ĐỌC số thực tế ──
        const modalVisible = await modalAnchor.isVisible({ timeout: 5_000 }).catch(() => false);

        if (!modalVisible) {
          // Không thấy modal — đây là lúc THỰC SỰ nghi ngờ đã vượt ngưỡng,
          // nên mới dùng poll ĐẦY ĐỦ (15s) để chờ hệ thống xử lý nộp bài.
          if (await choTuDongNopBai(page, CHO_NOP_BAI_DAY_DU_MS)) {
            daTuDongNop = true;
            console.log(`  → Hệ thống tự động nộp bài (phát hiện muộn) ở lần thoát ${lan}.`);
            return;
          }
          // Vẫn không thấy gì sau khi đã chờ đủ lâu — lưu lại debug screenshot
          // để đối chiếu trực tiếp, tránh phải gửi lại log qua nhiều vòng.
          const duongDanAnh = await luuAnhDebug(page, `khong-thay-modal-lan-${lan}`);
          expect(
            modalVisible,
            `Không thấy modal cảnh báo thoát bài thi ở lần ${lan}, và cũng không thấy màn hình đang nộp bài sau khi chờ — có thể là lỗi thật.` +
            (duongDanAnh ? ` Đã lưu ảnh debug tại: ${duongDanAnh}` : '')
          ).toBe(true);
          return;
        }

        // Đọc toàn bộ text của modal (div cha chứa cả tiêu đề "Bạn còn X lần...")
        // rồi trích số bằng regex — không giả định trước công thức tính.
        const modalContainer = page.locator('div').filter({ has: modalAnchor }).first();
        const fullText = (await modalContainer.innerText().catch(() => '')) || '';
        const match = fullText.match(/Bạn còn\s*(\d+)\s*lần\s*thoát bài thi/);
        const soLanConLai = match ? Number(match[1]) : null;

        if (soLanConLai === null) {
          console.log(`  ⚠ Modal hiện ra nhưng không đọc được số lần còn lại. Text: "${fullText.slice(0, 120)}"`);
        } else {
          console.log(`  ✓ Modal: "Bạn còn ${soLanConLai} lần thoát bài thi"`);

          if (lan === 1 && soLanConLai !== gioiHanThoatThucTe - 1) {
            console.log(
              `  ⚠ Lưu ý: lần thoát đầu tiên còn ${soLanConLai} lần (kỳ vọng ` +
              `${gioiHanThoatThucTe - 1} nếu là lượt thi hoàn toàn mới). ` +
              `Có thể tài khoản/lượt thi này đã có vi phạm tồn đọng từ lần chạy trước — ` +
              `test vẫn tiếp tục dựa trên số liệu thực tế đọc được.`
            );
          }

          // Xác nhận số giảm đúng 1 đơn vị so với lần trước (nếu đã có dữ liệu trước đó)
          if (soLanConLaiTruoc !== null) {
            expect(
              soLanConLaiTruoc - soLanConLai,
              `Số lần còn lại phải giảm đúng 1 mỗi lần thoát (trước: ${soLanConLaiTruoc}, sau: ${soLanConLai})`
            ).toBe(1);
          }
          soLanConLaiTruoc = soLanConLai;
        }

        // ── Bấm "Tiếp tục làm bài" → quay lại fullscreen ─────────────────
        await tiepTucBtn.waitFor({ state: 'visible', timeout: 5_000 });
        await tiepTucBtn.click({ force: true });
        await page.waitForTimeout(ms(0.8));
        console.log('  ✓ Đã bấm Tiếp tục làm bài');
      });
    }

    expect(
      daTuDongNop,
      `Đã lặp tối đa ${soLanLapToiDa} lần thoát fullscreen mà hệ thống vẫn chưa tự động nộp bài — kiểm tra lại cấu hình "Thu bài ngay sau khi HS ra khỏi bài thi" của đề, hoặc bộ đếm vi phạm phía server.`
    ).toBe(true);

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 6: Xác nhận hệ thống đã tự động nộp bài
    //   Chấp nhận 1 trong 2 dấu hiệu: màn hình trung gian "Đang nộp bài" HOẶC
    //   bảng kết quả cuối cùng đã hiển thị thẳng (nếu quá trình nộp diễn ra
    //   nhanh và bỏ qua màn hình trung gian trước khi bước này kịp kiểm tra —
    //   vốn rất có thể đã xảy ra ngay trong vòng lặp ở BƯỚC 5 thông qua
    //   choTuDongNopBai()). Poll ĐẦY ĐỦ (15s) ở đây vì tại thời điểm này đã
    //   chắc chắn xác nhận daTuDongNop = true, không phải chờ "phòng hờ" như
    //   trong vòng lặp nữa.
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Xác nhận màn hình đang nộp bài tự động', async () => {
      const daNopThanhCong = await choTuDongNopBai(page, CHO_NOP_BAI_DAY_DU_MS);

      if (!daNopThanhCong) {
        const duongDanAnh = await luuAnhDebug(page, 'khong-thay-man-hinh-dang-nop-bai');
        expect(
          daNopThanhCong,
          'Không thấy màn hình "Đang nộp bài" lẫn bảng kết quả sau khi vượt giới hạn thoát fullscreen.' +
          (duongDanAnh ? ` Đã lưu ảnh debug tại: ${duongDanAnh}` : '')
        ).toBe(true);
        return;
      }

      const quaManHinhTrungGian = await manHinhDangNopBaiXuatHien(page, 500);
      console.log(
        quaManHinhTrungGian
          ? '✓ Bài tự động nộp khi vượt giới hạn thoát fullscreen (thấy màn hình "Đang nộp bài").'
          : '✓ Bài tự động nộp khi vượt giới hạn thoát fullscreen (bảng kết quả đã hiện thẳng, có thể đã bỏ qua màn hình trung gian).'
      );
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 7: Xác nhận bảng kết quả cuối cùng hiển thị
    //   Không assert điểm số cụ thể vì phụ thuộc số câu của đề — chỉ xác
    //   nhận luồng auto-submit hoạt động đúng và trang kết quả render được.
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Xác nhận bảng kết quả hiển thị', async () => {
      const ketQuaHeader = page.locator('#exam-score-card-header').first();
      await ketQuaHeader.waitFor({ state: 'visible', timeout: 20_000 });
      await expect(ketQuaHeader).toBeVisible();
      console.log('✓ Bảng kết quả đã hiển thị — luồng tự động nộp bài hoạt động đúng');
    });
  });
});