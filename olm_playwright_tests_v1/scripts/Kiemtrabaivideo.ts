/**
 * kiemTraBaiVideo.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Script ĐỘC LẬP — kiểm tra luồng bài dạng VIDEO có câu hỏi chèn giữa (OLM Kids).
 * KHÔNG dùng chung lamBaiEngine.ts (logic hoàn toàn khác các dạng trắc nghiệm/
 * đúng-sai/kéo-thả/dropdown), chỉ tái dùng vài hàm tiện ích (sleep, jsClick,
 * timElement, dongModal) và hạ tầng browser/login từ olmUtils.ts.
 *
 * LUỒNG:
 *   1. Vào olm.vn/kids
 *   2. Vào "Chương trình học cho trẻ 5 tuổi"
 *      (https://olm.vn/bg/chuong-trinh-hoc-cho-tre-5-tuoi)
 *   3. Bấm vào node bài học đầu tiên trên lộ trình (bong bóng "1")
 *      → hiện hộp danh sách bài học (dropdown box)
 *   4. Bấm vào bài học / nút "Bắt đầu học" → vào trang bài dạng VIDEO
 *   5. Trên thanh trượt video (mejs__time-slider) có các MỐC câu hỏi
 *      (mejs__time-marker màu xanh lá rgb(0,255,0) — mỗi mốc = 1 câu hỏi
 *      CHƯA làm; khi làm xong OLM sẽ đổi màu marker đó, không còn xanh nữa)
 *   6. Vòng lặp (lặp đến khi KHÔNG CÒN marker nào còn xanh):
 *        a. Bấm vào CUỐI thanh trượt (mô phỏng tua đến hết video)
 *        b. Trước khi chạm mốc, OLM hiện thông báo đếm ngược
 *           (#preload.quiz-f: "Còn N giây nữa sẽ có câu hỏi...") → đợi hết
 *        c. Nếu còn mốc câu hỏi CHƯA làm → player tự lùi video lại trước mốc
 *           đó ~5 giây và hiện ra hộp câu hỏi luyện tập
 *        d. Chọn đáp án (ngẫu nhiên) → bấm nút "Kiểm tra"
 *        e. Đếm lại số marker còn xanh — lặp lại bước (a) cho đến khi = 0
 *   7. Tua lại lần cuối để xác nhận & in báo cáo: đã làm hết bao nhiêu / tổng
 *      số điểm dừng, còn sót bao nhiêu (nếu có) → PASS/FAIL rõ ràng
 *   8. Sau khi 1 bài xong, node của nó đổi thành dấu ✓ trên lộ trình và bước
 *      sang node kế tiếp → script quay lại lộ trình, tự tìm bài CHƯA hoàn
 *      thành tiếp theo (không còn bấm cố định vào node đầu tiên) và lặp lại
 *      toàn bộ quy trình cho đến khi hết bài video hoặc chạm giới hạn an toàn
 *
 * LƯU Ý: hộp câu hỏi chèn trong video của OLM Kids có nhiều dạng UI khác nhau
 * theo từng bài (chọn ảnh, chọn từ, kéo thả...). Hàm xuLyCauHoiTrongVideo bên
 * dưới dùng tập selector tổng quát + có fallback; nếu gặp bài có UI khác biệt,
 * chỉ cần bổ sung thêm selector vào mảng luaChonSelectors.
 *
 * CẬP NHẬT (fix "stuck ở câu hỏi"):
 *   - Trước đây, khi video bị kẹt lại ở 1 câu hỏi mà xuLyCauHoiTrongVideo
 *     KHÔNG tìm thấy UI câu hỏi ngay lần thử đầu tiên, script sẽ bỏ qua, đợi
 *     5s rồi LẶP LẠI TOÀN BỘ vòng ngoài (tức tua-đến-cuối lại từ đầu) — điều
 *     này làm gián đoạn câu hỏi đang hiện ra (nếu nó hiện ra hơi trễ, hoặc
 *     người dùng đang trả lời thủ công), khiến câu hỏi không bao giờ được xử
 *     lý xong.
 *   - Giờ đây, khi phát hiện video đang kẹt ở 1 câu hỏi, script sẽ CHỜ TẠI
 *     CHỖ (không tua lại) và liên tục thử xử lý / kiểm tra xem câu hỏi đã
 *     được trả lời hay chưa (tự động HOẶC thủ công — dựa vào số mốc xanh còn
 *     lại có giảm đi không), cho đến khi câu hỏi được xử lý xong hoặc hết
 *     thời gian chờ tối đa (QUESTION_RESOLVE_MAX_WAIT_SEC). Chỉ sau đó mới
 *     tiếp tục vòng lặp ngoài (tua-đến-cuối tiếp).
 *   - Ở bước xác nhận cuối bài: nếu đã làm hết tất cả các mốc (không còn mốc
 *     xanh nào), script sẽ tua-đến-cuối (trước 5s) THÊM 1 LẦN NỮA rồi đợi
 *     thêm 5s để màn hình "Bạn đã hoàn thành bài học này" (#congratulation-title)
 *     kịp hiện ra trước khi kết thúc luồng chạy, thay vì kết thúc ngay.
 *
 * Chạy: npx tsx scripts/kiemTraBaiVideo.ts
 * (Bỏ qua đăng nhập: SKIP_LOGIN=true npx tsx scripts/kiemTraBaiVideo.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { type Locator, type Page } from 'playwright';
import { khoiBrowser, dangNhap, BASE } from '../core/automation/olmUtils';
import { sleep, jsClick, timElement, dongModal } from '../core/automation/lamBaiEngine';

const KIDS_URL = `${BASE}/kids`;
const CHUONG_TRINH_5_TUOI_URL = `${BASE}/bg/chuong-trinh-hoc-cho-tre-5-tuoi`;

const MAX_SEEK_LOOPS = 30;   // giới hạn vòng lặp an toàn (số mốc câu hỏi tối đa xử lý trong 1 bài)
const SEEK_WAIT_SEC = 1.5;   // đợi sau khi seek để player kịp phản ứng (lùi lại nếu có mốc)
const QUIZ_WAIT_SEC = 2;     // đợi hộp câu hỏi xuất hiện hẳn trước khi tương tác
const MAX_BAI_XU_LY = 20;    // giới hạn an toàn số bài video xử lý liên tiếp trong 1 lần chạy

// ── Cấu hình luồng "resume + tua đến cuối" theo hành vi thực tế đã quan sát ──
const RESUME_CHECK_WAIT_SEC = 5;           // đợi 5s đầu xem video có tự nhảy tới chỗ học dở lần trước không
const QUESTION_WAIT_AFTER_SEEK_SEC = 10;   // sau khi tua-đến-cuối, đợi 10s rồi kiểm tra thời gian video có tiến không
const QUESTION_POLL_SEC = 1;               // khoảng poll trong lúc đợi 10s (theo dõi currentTime từng giây)
const STALL_TIEN_TOI_DA_SEC = 2;           // nếu currentTime tiến ít hơn ngưỡng này sau 10s → coi là "kẹt lại" (đang ở câu hỏi)
const WAIT_SAU_KHI_LAM_CAU_HOI_SEC = 5;    // sau khi xử lý xong câu hỏi → đợi 5s rồi mới click-tua-cuối tiếp
const MOC_TRUNG_PHAN_TRAM = 0.5;           // sai số (%) để coi 2 mốc là "cùng 1 vị trí" khi so khớp mốc lỗi

// ── Cấu hình chờ xử lý câu hỏi khi video bị kẹt (KHÔNG tua lại trong lúc chờ) ──
const QUESTION_RESOLVE_MAX_WAIT_SEC = 120; // tối đa 2 phút chờ 1 câu hỏi được trả lời (tự động hoặc thủ công)
const QUESTION_RESOLVE_POLL_SEC = 3;       // khoảng poll khi chờ câu hỏi được xử lý
const HOAN_THANH_TITLE_SELECTOR = '#congratulation-title';
const DOI_MAN_HINH_HOAN_THANH_SEC = 8;     // thời gian tối đa đợi màn hình "đã hoàn thành bài học" hiện ra

/** Ghi nhận 1 mốc câu hỏi bị nghi ngờ LỖI: đã tua tới đúng vị trí + đợi đủ lâu
 * nhưng KHÔNG hiện câu hỏi nào (trong khi marker vẫn còn xanh = OLM coi là
 * chưa làm). Không retry vô hạn tại chỗ — ghi nhận lại rồi bỏ qua, đi tiếp
 * đến hết bài, cuối cùng in ra danh sách để người kiểm tra lại thủ công. */
interface MocLoi {
  phanTram: number;
  thoiGianGiay: number | null;
  vongLap: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 1-4: VÀO OLM KIDS → CHƯƠNG TRÌNH 5 TUỔI → BÀI 1 → TRANG VIDEO
// ═══════════════════════════════════════════════════════════════════════════════
/** Kiểm tra phần tử (hoặc thẻ <a> cha gần nhất) có dẫn ra domain ngoài (vd YouTube) không */
async function isLinkRaNgoai(locator: Locator): Promise<boolean> {
  try {
    return await locator.evaluate((el) => {
      const a = (el as HTMLElement).closest('a');
      if (!a) return false;
      const href = a.getAttribute('href') || '';
      const target = a.getAttribute('target') || '';
      return target === '_blank' || /youtube\.com|youtu\.be/i.test(href);
    });
  } catch { return false; }
}

/** Nếu vì lý do gì đó trang đã điều hướng ra khỏi olm.vn (vd bấm nhầm link YouTube) → quay lại ngay */
async function damBaoOLM(page: Page): Promise<void> {
  if (!page.url().includes('olm.vn')) {
    console.log(`  ⚠ Trang đã điều hướng ra ngoài OLM (${page.url()}) → quay lại trang trước`);
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await sleep(1);
  }
}

/** Phần tử có nằm bên trong khung player video (.mejs__container) không — dùng để
 * loại trừ khi tìm ô đáp án, tránh bấm nhầm nút/link nằm trong khu vực điều khiển video.
 *
 * LƯU Ý (fix "không thấy câu hỏi hiện ra" / "không xác định được nút Kiểm tra"):
 * cả hộp câu hỏi (div.question) LẪN nút "Kiểm tra" (button.btn-check-question, nằm
 * trong #action-board-2 thuộc .footer-action — thanh công cụ dưới video) đôi khi được
 * OLM render LỒNG BÊN TRONG chính .mejs__container (đè lên/gắn liền với player), nên
 * nếu loại trừ mù quáng mọi phần tử trong .mejs__container sẽ loại nhầm luôn cả đáp án
 * và nút "Kiểm tra" thật — trong khi CHỈ nên loại trừ các nút điều khiển player THẬT
 * (play/pause/volume/timeline...) nằm trong .mejs__controls.
 *
 * → Nếu phần tử nằm trong div.question, #action-board-2, hoặc chính là/chứa
 *   class btn-check-question thì KHÔNG loại trừ, bất kể nó có nằm trong
 *   .mejs__container hay không. Chỉ loại trừ khi nó nằm trong .mejs__controls
 *   (thanh điều khiển phát video thật) và KHÔNG thuộc các vùng câu hỏi trên.
 */
async function trongKhungVideo(locator: Locator): Promise<boolean> {
  try {
    return await locator.evaluate((el) => {
      const node = el as HTMLElement;
      // Các vùng thuộc CÂU HỎI thật (không phải điều khiển phát video) → không loại trừ
      if (node.closest('.question')) return false;
      if (node.closest('#action-board-2')) return false;
      if (node.classList.contains('btn-check-question') || node.closest('.btn-check-question')) return false;
      return !!node.closest('.mejs__controls') || !!node.closest('.mejs__container');
    });
  } catch { return false; }
}

/**
 * Tìm node bài học đầu tiên (theo thứ tự DOM) CÒN ÍT NHẤT 1 bài CHƯA hoàn thành.
 * Mỗi node .category-item có attribute data-categories chứa mảng JSON các bài
 * học con, mỗi bài có field "completed": true/false. Khi 1 node đã làm xong hết
 * (như ảnh minh hoạ: node đổi thành dấu ✓ xanh, không còn hiện số), lộ trình sẽ
 * chuyển sang node kế tiếp — nên KHÔNG được luôn luôn lấy node đầu tiên trong
 * DOM, mà phải bỏ qua các node đã completed:true toàn bộ.
 */
async function layNodeBaiCanLam(page: Page): Promise<{ soThuTu: number; element: Locator } | null> {
  const nodes = page.locator('.category-item[data-categories]');
  const soLuong = await nodes.count();

  for (let i = 0; i < soLuong; i++) {
    const node = nodes.nth(i);
    const dataStr = await node.getAttribute('data-categories').catch(() => null);
    if (!dataStr) continue;

    let baiHocs: Array<{ completed?: boolean }> = [];
    try {
      baiHocs = JSON.parse(dataStr);
    } catch {
      continue;
    }
    if (!Array.isArray(baiHocs) || baiHocs.length === 0) continue;

    const conBaiChuaLam = baiHocs.some((b) => b.completed === false);
    if (conBaiChuaLam) {
      return { soThuTu: i + 1, element: node };
    }
  }

  return null;
}

async function moBaiVideoDauTien(page: Page): Promise<boolean> {
  console.log('[1] Vào olm.vn/kids...');
  await page.goto(KIDS_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1);
  await dongModal(page);

  console.log('[2] Vào lộ trình "Chương trình học cho trẻ 5 tuổi"...');
  await page.goto(CHUONG_TRINH_5_TUOI_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1);
  await dongModal(page);

  console.log('[3] Tìm bài học chưa hoàn thành đầu tiên trên lộ trình...');
  // KHÔNG luôn bấm node đầu tiên trong DOM — vì bài đã làm xong sẽ đổi thành
  // dấu ✓ xanh, lộ trình chuyển sang node kế tiếp. Cần tìm đúng node còn bài
  // chưa hoàn thành để bấm vào.
  const nodeCanLam = await layNodeBaiCanLam(page);
  if (!nodeCanLam) {
    console.log('  🎉 Tất cả bài trong lộ trình đã hoàn thành hết — không còn bài nào để làm!');
    return false;
  }
  console.log(`  → Bài cần làm: node thứ ${nodeCanLam.soThuTu} trên lộ trình`);

  const node1 = nodeCanLam.element;
  await node1.scrollIntoViewIfNeeded();
  await sleep(0.3);
  await jsClick(page, node1);
  await sleep(1);

  // Hộp danh sách bài học hiện ra — tìm link/nút vào bài
  console.log('[4] Mở hộp bài học & chọn bài đầu tiên (dạng video)...');
  const linkBaiHoc = await timElement(page, [
    "a[href*='/chu-de/']",
    "button:has-text('Bắt đầu học')",
    "xpath=//button[contains(normalize-space(text()),'Bắt đầu học')]",
  ], 5000);

  if (!linkBaiHoc) {
    console.log('  ⚠ Không thấy hộp danh sách bài học sau khi bấm vào node 1');
    return false;
  }

  await jsClick(page, linkBaiHoc);
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1.5);
  await dongModal(page);

  const coVideo = await page.locator('video, .mejs__container').first()
    .isVisible({ timeout: 8000 }).catch(() => false);
  if (!coVideo) {
    console.log('  ⚠ Trang vừa vào không có video — không đúng dạng bài video');
    return false;
  }

  console.log(`  ✓ Đã vào bài video: ${page.url()}`);

  // TRƯỜNG HỢP ĐẶC BIỆT: nếu lần học trước dừng lại ĐÚNG LÚC đang có 1 câu
  // hỏi hiện ra mà CHƯA trả lời, khi vào lại bài OLM sẽ nhảy THẲNG vào lại
  // đúng câu hỏi đó (video không tự phát, không có gì để "resume theo vị trí"
  // — nó đang đứng yên chờ trả lời). Phải kiểm tra & xử lý việc này NGAY,
  // trước playNeuCanThiet/resume-check, nếu không các bước sau sẽ chờ vô ích.
  await xuLyCauHoiTonDongNeuCo(page);

  await playNeuCanThiet(page);
  const sanSang = await doiVideoSanSang(page);
  if (!sanSang) {
    console.log('  ⚠ Video không khởi tạo được thời lượng — vẫn tiếp tục thử, có thể sẽ dừng sớm ở bước sau');
  }

  // Nhiều bài OLM tự nhớ & nhảy tới vị trí đã xem lần trước (thông báo resume)
  // ngay khi vào bài. Đợi 5s đầu để QUAN SÁT xem video có tự tiến tới chỗ học
  // dở hay không trước khi bắt đầu vòng lặp tua-đến-cuối — không can thiệp gì
  // thêm, chỉ log lại để biết trạng thái ban đầu của video.
  await kiemTraResumeChoHocDo(page);

  return true;
}

/**
 * Kiểm tra ngay khi vừa vào trang bài video: nếu lần học trước dừng lại đúng
 * lúc đang có 1 câu hỏi hiện ra mà CHƯA trả lời, OLM sẽ nhảy THẲNG vào lại
 * đúng câu hỏi đó ngay khi mở bài — khác với trường hợp resume bình thường
 * (chỉ nhảy vị trí thời gian video, không có câu hỏi nào hiện sẵn). Hàm này
 * phải chạy TRƯỚC playNeuCanThiet/doiVideoSanSang/kiemTraResumeChoHocDo, vì
 * nếu có câu hỏi tồn đọng thì video đang đứng yên CHỜ TRẢ LỜI chứ không phải
 * đang phát — các bước đợi/phát video phía sau sẽ vô nghĩa cho tới khi câu
 * hỏi này được xử lý xong.
 */
async function xuLyCauHoiTonDongNeuCo(page: Page): Promise<void> {
  console.log('  [Câu hỏi tồn đọng] Kiểm tra xem có đang dừng sẵn ở 1 câu hỏi từ lần học trước không...');
  const coCauHoi = await coCauHoiHienRa(page);
  if (!coCauHoi) {
    console.log('  [Câu hỏi tồn đọng] Không có → vào bài bình thường.');
    return;
  }

  console.log('  ⚠ Phát hiện video đang dừng sẵn ở 1 CÂU HỎI TỒN ĐỌNG từ lần học trước (chưa trả lời) → xử lý ngay...');
  const xuLyOk = await doiChoDenKhiCauHoiXuLyXong(page, 0);
  if (xuLyOk) {
    console.log('  ✓ Đã xử lý xong câu hỏi tồn đọng — video có thể tiếp tục phát bình thường từ đây.');
  } else {
    console.log('  ⚠ Không xử lý được câu hỏi tồn đọng trong thời gian chờ — vẫn tiếp tục vào bài, vòng lặp chính phía sau có thể sẽ bắt lại được.');
  }
  await sleep(1);
}

/**
 * Đợi RESUME_CHECK_WAIT_SEC (5s) ngay sau khi vào bài để xem OLM có tự nhảy
 * video tới vị trí đã học dở lần trước hay không (một số bài hiện overlay
 * "Tiếp tục từ..." rồi tự seek). Chỉ quan sát + log, KHÔNG chủ động seek/click
 * gì trong bước này — để hành vi tự nhiên của OLM diễn ra trước.
 */
async function kiemTraResumeChoHocDo(page: Page): Promise<void> {
  console.log(`  [Resume-check] Đợi ${RESUME_CHECK_WAIT_SEC}s xem video có tự nhảy tới chỗ học dở không...`);
  const truoc = await layThoiGianVideo(page);
  console.log(`  [Resume-check] Vị trí ban đầu: ${truoc ? truoc.current.toFixed(1) + 's' : 'không đọc được'}`);

  await sleep(RESUME_CHECK_WAIT_SEC);

  const sau = await layThoiGianVideo(page);
  if (truoc && sau && Math.abs(sau.current - truoc.current) > 2) {
    console.log(`  [Resume-check] ✓ Video đã tự nhảy tới chỗ học dở lần trước: ${sau.current.toFixed(1)}s`);
  } else if (sau) {
    console.log(`  [Resume-check] Không thấy nhảy vị trí đáng kể (đang ở ${sau.current.toFixed(1)}s) — có thể học từ đầu.`);
  } else {
    console.log('  [Resume-check] Không đọc được thời gian video sau khi đợi.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ĐỌC TRẠNG THÁI VIDEO / THANH TRƯỢT
// ═══════════════════════════════════════════════════════════════════════════════
interface ThoiGianVideo {
  current: number;
  duration: number;
}

/** Chuyển chuỗi "mm:ss" hoặc "hh:mm:ss" thành số giây */
function parseMmSs(text: string): number | null {
  const parts = text.trim().split(':').map((p) => Number(p));
  if (parts.length === 0 || parts.some((p) => Number.isNaN(p))) return null;
  let sec = 0;
  for (const p of parts) sec = sec * 60 + p;
  return sec;
}

/**
 * Đọc thời gian phát THẬT của video khi OLM dùng YouTube làm nguồn (nhúng qua
 * <iframe id="playerN_youtube_iframe" ... src="https://www.youtube.com/embed/...
 * ?enablejsapi=1..."> bên trong lớp UI mejs). KHÔNG thể đọc DOM/currentTime
 * trực tiếp bên trong iframe vì khác origin (youtube.com vs olm.vn) — thẻ
 * <video> mà layThoiGianVideo đọc trước đây thực chất KHÔNG tồn tại trên
 * trang cha, hoặc chỉ là video "giả"/ẩn không đại diện cho video YouTube thật
 * đang phát, khiến việc bắt trạng thái kẹt/tiến qua thanh trượt bị sai.
 *
 * Vì URL iframe có enablejsapi=1, YouTube tự động postMessage định kỳ ra
 * window cha (giao thức YouTube IFrame API) các message dạng:
 *   { event: "infoDelivery", info: { currentTime, duration, playerState, ... }, id }
 * Hàm này lắng nghe 'message' trên window trong một khoảng thời gian ngắn để
 * bắt message đó, đồng thời chủ động gửi yêu cầu "listening" + "getCurrentTime"
 * tới iframe để tăng khả năng nhận được phản hồi ngay (không phải chỉ ngồi
 * đợi thụ động tới lượt mejs tự polling).
 */
async function layThoiGianVideoYoutubeIframe(page: Page, thoiGianChoMs = 1500): Promise<ThoiGianVideo | null> {
  return page.evaluate((timeout) => {
    return new Promise<{ current: number; duration: number } | null>((resolve) => {
      let hoanTat = false;
      const xong = (ket: { current: number; duration: number } | null) => {
        if (hoanTat) return;
        hoanTat = true;
        window.removeEventListener('message', handler);
        resolve(ket);
      };

      const handler = (e: MessageEvent) => {
        if (typeof e.origin !== 'string' || !e.origin.includes('youtube.com')) return;
        let data: any;
        try {
          data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        } catch {
          return;
        }
        if (data && data.event === 'infoDelivery' && data.info) {
          const { currentTime, duration } = data.info;
          if (typeof currentTime === 'number' && typeof duration === 'number' && duration > 0) {
            xong({ current: currentTime, duration });
          }
        }
      };

      window.addEventListener('message', handler);

      const iframe = document.querySelector<HTMLIFrameElement>(
        '#player1_youtube_iframe, iframe[id*="_youtube_iframe"], iframe[src*="youtube.com/embed"]'
      );
      if (iframe && iframe.contentWindow) {
        try {
          // Thiết lập kênh lắng nghe + chủ động xin trạng thái ngay, theo
          // đúng giao thức YouTube IFrame postMessage API.
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'getCurrentTime', args: [], id: 1, channel: 'widget' }),
            '*'
          );
        } catch { /* ignore */ }
      }

      setTimeout(() => xong(null), timeout);
    });
  }, thoiGianChoMs).catch(() => null);
}

/**
 * Đọc thời gian hiện tại/tổng thời lượng video.
 * ƯU TIÊN 1: đọc qua giao thức postMessage của iframe YouTube (đáng tin cậy
 * nhất, vì đây là nguồn thật của phần lớn bài video OLM Kids/Mầm non).
 * ƯU TIÊN 2 (fallback): đọc trực tiếp thẻ <video> HTML5 gốc — áp dụng cho
 * những bài KHÔNG dùng YouTube mà OLM tự host video trực tiếp.
 * ƯU TIÊN 3 (fallback cuối): đọc qua chữ hiển thị .mejs__currenttime /
 * .mejs__duration trên UI player (độ chính xác chỉ tới giây, kém tin cậy hơn
 * 2 cách trên nhưng vẫn hơn không có gì).
 */
async function layThoiGianVideo(page: Page): Promise<ThoiGianVideo | null> {
  const quaIframe = await layThoiGianVideoYoutubeIframe(page);
  if (quaIframe) return quaIframe;

  const native = await page.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null;
    if (!v || !isFinite(v.duration) || v.duration <= 0) return null;
    return { current: v.currentTime, duration: v.duration };
  }).catch(() => null);
  if (native) return native;

  try {
    const curText = await page.locator('.mejs__currenttime').first().innerText({ timeout: 1500 });
    const durText = await page.locator('.mejs__duration').first().innerText({ timeout: 1500 });
    const current = parseMmSs(curText);
    const duration = parseMmSs(durText);
    if (current !== null && duration !== null && duration > 0) {
      return { current, duration };
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * Đếm số điểm dừng (mốc câu hỏi) còn MÀU XANH (rgb(0,255,0)) trên thanh trượt.
 * Theo cấu trúc OLM: mỗi <span class="mejs__time-marker" style="...background:
 * rgb(0,255,0)"> là 1 điểm dừng CHƯA làm. Đếm lại số này sau mỗi lần xử lý xong
 * 1 câu hỏi để biết chính xác còn bao nhiêu điểm dừng chưa hoàn thành.
 */
async function demSoMocXanhConLai(page: Page): Promise<number> {
  return page.evaluate(() => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>('.mejs__time-marker'));
    return markers.filter((m) => {
      const style = m.getAttribute('style') || '';
      return /background:\s*rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/i.test(style);
    }).length;
  });
}

/**
 * Trước khi tới 1 điểm dừng, OLM hiện thông báo đếm ngược dạng:
 *   <div id="preload" class="quiz-f"><span>Còn 2 giây nữa sẽ có câu hỏi...</span></div>
 * Hàm này: nếu thấy thông báo → log nội dung → đợi nó biến mất (nghĩa là câu
 * hỏi đã thực sự hiện ra) rồi trả về true. Không thấy thì trả về false ngay.
 */
async function doiThongBaoSapCoCauHoi(page: Page): Promise<boolean> {
  const preload = page.locator('#preload.quiz-f, #preload');
  const thayThongBao = await preload.first().isVisible({ timeout: 1200 }).catch(() => false);
  if (!thayThongBao) return false;

  const text = (await preload.first().innerText().catch(() => '')).trim();
  if (text) console.log(`  ⏳ ${text}`);

  await preload.first().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  return true;
}

/** Bấm nút Play nếu video đang ở trạng thái chờ (chưa tự phát) */
async function playNeuCanThiet(page: Page): Promise<void> {
  // ƯU TIÊN 1: nếu video là YouTube nhúng qua iframe (trường hợp phổ biến
  // nhất ở OLM Kids/Mầm non), gửi lệnh "playVideo" qua postMessage tới iframe
  // — KHÔNG thể gọi document.querySelector('video').play() vì video thật nằm
  // bên trong iframe khác origin, không phải trên trang cha.
  const daGuiLenhPlayIframe = await page.evaluate(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      '#player1_youtube_iframe, iframe[id*="_youtube_iframe"], iframe[src*="youtube.com/embed"]'
    );
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [], id: 1, channel: 'widget' }),
          '*'
        );
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }).catch(() => false);

  if (daGuiLenhPlayIframe) {
    console.log('  → Đã gửi lệnh playVideo qua postMessage tới iframe YouTube');
    await sleep(1);
    return;
  }

  // ƯU TIÊN 2: nếu có thẻ <video> gốc (bài không dùng YouTube), gọi play()
  // thẳng qua JS — an toàn 100%, không có nguy cơ bấm nhầm overlay/link "Xem
  // trên YouTube".
  const daPlayNative = await page.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null;
    if (v && v.paused) {
      v.play().catch(() => {});
      return true;
    }
    return false;
  }).catch(() => false);

  if (daPlayNative) {
    console.log('  → Đã gọi video.play() trực tiếp qua JS');
    await sleep(1);
    return;
  }

  // Fallback: CHỈ bấm nút Play nằm trong thanh điều khiển mejs (.mejs__controls),
  // KHÔNG bấm overlay to phủ cả khung video vì đó rất có thể là link
  // "Xem trên YouTube" (điều hướng ra ngoài trang khi video bị chặn nhúng).
  const playBtn = page.locator('.mejs__controls .mejs__play button, .mejs__controls .mejs__playpause-button button').first();
  if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    if (await isLinkRaNgoai(playBtn)) {
      console.log('  ⚠ Nút Play trỏ ra ngoài trang (YouTube) → bỏ qua, KHÔNG bấm');
      return;
    }
    console.log('  → Bấm Play (trong thanh điều khiển) để khởi động video...');
    await jsClick(page, playBtn);
    await sleep(1);
    await damBaoOLM(page);
  } else {
    console.log('  (Không thấy nút Play trong thanh điều khiển — có thể video đã tự phát)');
  }
}

/** Đợi player khởi tạo xong — tức đọc được thời lượng video hợp lệ */
async function doiVideoSanSang(page: Page): Promise<ThoiGianVideo | null> {
  console.log('  Đợi video khởi tạo xong (đọc được thời lượng)...');
  for (let i = 0; i < 15; i++) {
    const t = await layThoiGianVideo(page);
    if (t && t.duration > 0) {
      console.log(`  ✓ Video sẵn sàng: ${t.current.toFixed(1)}s / ${t.duration.toFixed(1)}s`);
      return t;
    }
    await sleep(1);
  }
  console.log('  ⚠ Không đọc được thời lượng video sau nhiều lần thử');
  return null;
}

/**
 * Đọc vị trí % (left) của mốc câu hỏi CÒN XANH gần nhất (nhỏ nhất) trên thanh
 * trượt. Trả về null nếu không đọc được vị trí mốc nào.
 */
async function layMocXanhGanNhat(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>('.mejs__time-marker'));
    const phanTram = markers
      .filter((m) => /background:\s*rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/i.test(m.getAttribute('style') || ''))
      .map((m) => {
        const match = (m.getAttribute('style') || '').match(/left:\s*([\d.]+)%/);
        return match ? parseFloat(match[1]) : null;
      })
      .filter((p): p is number => p !== null);
    return phanTram.length > 0 ? Math.min(...phanTram) : null;
  }).catch(() => null);
}

/**
 * Giống layMocXanhGanNhat, nhưng LOẠI TRỪ các mốc đã được ghi nhận là "lỗi"
 * (đã tua tới đúng vị trí + đợi đủ lâu mà không hiện câu hỏi). Nếu không loại
 * trừ, vòng lặp sẽ cứ quay lại đúng mốc lỗi đó mãi vì nó luôn là mốc xanh gần
 * nhất còn lại — không bao giờ tiến được sang mốc kế tiếp.
 */
async function layMocXanhGanNhatTruMocLoi(page: Page, mocLoiPhanTram: number[]): Promise<number | null> {
  return page.evaluate(({ mocLoiPhanTram, saiSo }) => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>('.mejs__time-marker'));
    const phanTram = markers
      .filter((m) => /background:\s*rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/i.test(m.getAttribute('style') || ''))
      .map((m) => {
        const match = (m.getAttribute('style') || '').match(/left:\s*([\d.]+)%/);
        return match ? parseFloat(match[1]) : null;
      })
      .filter((p): p is number => p !== null)
      .filter((p) => !mocLoiPhanTram.some((loi) => Math.abs(loi - p) < saiSo));
    return phanTram.length > 0 ? Math.min(...phanTram) : null;
  }, { mocLoiPhanTram, saiSo: MOC_TRUNG_PHAN_TRAM }).catch(() => null);
}

const LUI_TRUOC_MOC_GIAY = 4; // tua lùi trước mốc bao nhiêu giây để chắc chắn video "đi ngang qua" mốc

/**
 * QUAN TRỌNG — lý do video luôn kẹt tại chỗ không hiện câu hỏi:
 * OLM tự "nhớ" và load video lại đúng vị trí đã xem lần trước (vd 45s), nên
 * nếu vị trí resume đã NẰM SAU mốc câu hỏi (mốc ở ~43s mà video mở ra tại
 * 45s), logic tự-hiện-câu-hỏi của OLM sẽ KHÔNG BAO GIỜ kích hoạt được nữa —
 * vì nó chỉ bắt sự kiện video TIẾN (timeupdate) đi NGANG QUA mốc, không phải
 * việc video đang đứng sau mốc. Tua bằng click trên thanh trượt (seek nhảy
 * cóc) cũng không đáng tin cậy để trigger lại điều này.
 *
 * → Cách chắc chắn nhất: đặt thẳng `video.currentTime` (qua JS, không phải
 * click chuột) lùi về một điểm AN TOÀN TRƯỚC mốc (mốc - 4 giây), rồi gọi
 * video.play() và để nó CHẠY THẬT (không seek nữa) — như vậy video sẽ tự
 * nhiên tiến dần và đi ngang qua đúng mốc, kích hoạt cơ chế tự dừng + hiện
 * câu hỏi của OLM giống hệt như khi học sinh xem video bình thường.
 *
 * Trả về true nếu đã thực hiện việc lùi (cần chờ video chạy tới); false nếu
 * không cần lùi (currentTime đang ở trước mốc rồi, hoặc không xác định được
 * mốc nào — trường hợp không còn mốc thì coi như đã xong, không cần chờ).
 */
async function damBaoDangTruocMocGanNhat(
  page: Page,
  durationDuPhong: number | null
): Promise<{ daLui: boolean; mocGiay: number | null }> {
  return page.evaluate(
    ({ luiGiay, durationDuPhong }: { luiGiay: number; durationDuPhong: number | null }) => {
      const markers = Array.from(document.querySelectorAll<HTMLElement>('.mejs__time-marker'));
      const phanTram = markers
        .filter((m) => /background:\s*rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/i.test(m.getAttribute('style') || ''))
        .map((m) => {
          const match = (m.getAttribute('style') || '').match(/left:\s*([\d.]+)%/);
          return match ? parseFloat(match[1]) : null;
        })
        .filter((p): p is number => p !== null);

      if (phanTram.length === 0) return { daLui: false, mocGiay: null };

      const v = document.querySelector('video') as HTMLVideoElement | null;
      if (!v) return { daLui: false, mocGiay: null };

      // QUAN TRỌNG: nhiều bài không đọc được v.duration trực tiếp (mejs bọc
      // ngoài chưa gán lại thuộc tính, hoặc video dùng nguồn đặc biệt) dù
      // v.currentTime vẫn cập nhật bình thường — đây chính là lý do bản trước
      // luôn báo "Không xác định được vị trí mốc" dù còn 3/3 mốc xanh. Nên
      // dùng durationDuPhong (đọc từ Node qua layThoiGianVideo, vốn đã có
      // fallback đọc chữ hiển thị .mejs__duration) làm phương án dự phòng.
      const duration = isFinite(v.duration) && v.duration > 0 ? v.duration : durationDuPhong;
      if (!duration || duration <= 0) return { daLui: false, mocGiay: null };

      const mocGiay = (Math.min(...phanTram) / 100) * duration;
      const diemAnToan = Math.max(0, mocGiay - luiGiay);

      // Chỉ lùi nếu currentTime đang ở TỪ điểm an toàn trở về sau (tức là đã ở
      // trong vùng mốc hoặc đã vượt qua mốc) — tránh lùi vô ích nếu đang ở rất
      // xa phía trước mốc (vd mốc thứ 2, thứ 3 còn ở tít phía sau).
      if (v.currentTime >= diemAnToan) {
        v.currentTime = diemAnToan;
        v.play().catch(() => {});
        return { daLui: true, mocGiay };
      }
      return { daLui: false, mocGiay };
    },
    { luiGiay: LUI_TRUOC_MOC_GIAY, durationDuPhong }
  ).catch(() => ({ daLui: false, mocGiay: null }));
}

/**
 * Tua video (gần) đến cuối thông qua YouTube IFrame postMessage API — gửi
 * lệnh "seekTo" thẳng tới iframe, thay vì click chuột lên thanh trượt.
 *
 * Lý do đổi cách này: click chuột lên .mejs__time-slider mô phỏng qua toạ độ
 * (x, y) rất dễ sai lệch nếu layout/CSS của player thay đổi (responsive, độ
 * phân giải khác nhau, thanh trượt bị ẩn/che bởi overlay...), và về bản chất
 * vẫn chỉ là "giả lập chuột" nên có thể bị OLM/mejs chặn nếu có xử lý
 * mousedown/mouseup phức tạp. Gọi thẳng seekTo qua postMessage đáng tin cậy
 * hơn nhiều vì đây là API chính thức của YouTube, không phụ thuộc toạ độ DOM
 * hay việc phần tử có đang visible/trong viewport hay không.
 *
 * Cần biết duration trước (đọc qua layThoiGianVideo, đã có fallback riêng)
 * để tính điểm seek gần cuối — không seekTo đúng end tuyệt đối vì một số
 * player coi currentTime === duration là đã "ended" và có thể có xử lý phụ
 * không mong muốn (vd tự động replay). Lùi lại vài giây (SEEK_LUI_CUOI_GIAY)
 * để chắc chắn vẫn đang ở trạng thái "playing" bình thường.
 */
const SEEK_LUI_CUOI_GIAY = 5; // lùi lại so với duration khi seek gần cuối, tránh trigger "ended"/nộp bài sớm

async function seekYoutubeIframe(page: Page, giay: number): Promise<boolean> {
  return page.evaluate((seconds) => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      '#player1_youtube_iframe, iframe[id*="_youtube_iframe"], iframe[src*="youtube.com/embed"]'
    );
    if (!iframe || !iframe.contentWindow) return false;
    try {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true], id: 1, channel: 'widget' }),
        '*'
      );
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [], id: 1, channel: 'widget' }),
        '*'
      );
      return true;
    } catch {
      return false;
    }
  }, giay).catch(() => false);
}

/**
 * Tua video đến gần cuối để mô phỏng việc học hết bài. ƯU TIÊN 1: dùng
 * YouTube IFrame API (seekYoutubeIframe) — áp dụng cho phần lớn bài video
 * OLM Kids/Mầm non vì chúng nhúng qua iframe YouTube. ƯU TIÊN 2 (fallback):
 * nếu không có iframe YouTube (bài dùng thẻ <video> HTML5 gốc do OLM tự
 * host), đặt thẳng v.currentTime qua JS. ƯU TIÊN 3 (fallback cuối cùng):
 * click chuột lên thanh trượt như cách cũ, chỉ dùng khi cả 2 cách trên đều
 * không thực hiện được (vd không đọc được duration).
 */
async function seekDenCuoiVideo(page: Page): Promise<boolean> {
  const t = await layThoiGianVideo(page);

  if (t && t.duration > 0) {
    const diemSeek = Math.max(0, t.duration - SEEK_LUI_CUOI_GIAY);

    const daSeekIframe = await seekYoutubeIframe(page, diemSeek);
    if (daSeekIframe) {
      console.log(`  → Đã gửi lệnh seekTo(${diemSeek.toFixed(1)}s) qua postMessage tới iframe YouTube`);
      await sleep(0.3);
      await damBaoOLM(page);
      return true;
    }

    const daSeekNative = await page.evaluate((seconds) => {
      const v = document.querySelector('video') as HTMLVideoElement | null;
      if (v && isFinite(v.duration) && v.duration > 0) {
        v.currentTime = seconds;
        v.play().catch(() => {});
        return true;
      }
      return false;
    }, diemSeek).catch(() => false);

    if (daSeekNative) {
      console.log(`  → Đã đặt video.currentTime = ${diemSeek.toFixed(1)}s trực tiếp qua JS`);
      await sleep(0.3);
      await damBaoOLM(page);
      return true;
    }
  }

  // Fallback cuối: click chuột lên thanh trượt như cách cũ
  console.log('  ⚠ Không seek được qua iframe/JS (thiếu duration hoặc thiếu iframe YouTube) → dùng cách click thanh trượt (fallback)');
  const slider = page.locator('.mejs__time-total.mejs__time-slider, .mejs__time-slider').first();
  const box = await slider.boundingBox().catch(() => null);
  if (!box) return false;

  const x = box.x + box.width - 2; // sát mép phải thanh trượt = gần cuối video
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await sleep(0.15);
  await page.mouse.click(x, y);
  await damBaoOLM(page);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// XỬ LÝ HỘP CÂU HỎI CHÈN TRONG VIDEO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Khi video bị player tự lùi lại (do gặp mốc câu hỏi chưa làm), một hộp câu
 * hỏi luyện tập sẽ hiện ra (thường có nút "Kiểm tra" để nộp đáp án).
 * Hàm này: chọn 1 đáp án bất kỳ (nếu nhận diện được) rồi bấm "Kiểm tra".
 */
/**
 * Tìm nút "Kiểm tra" (nộp đáp án) với selector RỘNG hơn bản gốc — không chỉ
 * tìm thẻ <button>, vì thực tế nhiều bài (như ảnh minh hoạ: hộp trắc nghiệm
 * A/B/C/D với nút "Kiểm tra" nằm cố định dưới video) nút này có thể là <div>/
 * <a> có class dạng "olm-btn..." chứ không phải <button> chuẩn, khiến selector
 * cũ "button:has-text('Kiểm tra')" không bao giờ khớp và log luôn báo
 * "Không thấy nút Kiểm tra" dù câu hỏi/đáp án đã hiện rõ trên màn hình.
 */
async function timNutKiemTra(page: Page, timeout = 6000): Promise<Locator | null> {
  // Ưu tiên selector chính xác OLM dùng — nhưng KHÔNG chỉ lấy .first() như
  // timElement mặc định, vì trang có thể có nhiều bản button.btn-check-question
  // trong DOM (bản ẩn/template + bản thật đang hiện), khiến .first() trúng
  // nhầm bản ẩn rồi chờ visible timeout dù bản thật đang hiển thị ngay sau đó.
  const soLanThu = Math.ceil((timeout / 1000) / 0.5);
  for (let i = 0; i < soLanThu; i++) {
    const found = await timNutKiemTraMotLan(page);
    if (found) return found;
    await sleep(0.5);
  }
  return null;
}

/** Quét 1 lần (không đợi) qua mọi selector khả dĩ, trả về phần tử ĐANG VISIBLE đầu tiên tìm được. */
async function timNutKiemTraMotLan(page: Page): Promise<Locator | null> {
  const cssSelectors = [
    'button.btn-check-question',
    "div#action-board-2 button",
    "button:has-text('Kiểm tra')",
  ];
  for (const sel of cssSelectors) {
    const els = page.locator(sel);
    const count = await els.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const el = els.nth(i);
      if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
        return el;
      }
    }
  }

  const xpathSelectors = [
    "xpath=//button[contains(@onclick,'VIDEO_UI.check')]",
    "xpath=//button[contains(normalize-space(text()),'Kiểm tra')]",
    "xpath=//*[contains(normalize-space(@class),'btn')][contains(normalize-space(.),'Kiểm tra')]",
    "xpath=//*[self::div or self::a or self::span][contains(normalize-space(text()),'Kiểm tra')]",
  ];
  for (const sel of xpathSelectors) {
    const els = page.locator(sel);
    const count = await els.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const el = els.nth(i);
      if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
        return el;
      }
    }
  }
  return null;
}

/**
 * Kiểm tra NHANH, KHÔNG CLICK gì cả — chỉ để biết hộp câu hỏi đã hiện ra hay
 * chưa trong lúc đang chờ video tự chạy tới mốc. Dùng để poll nhiều lần với
 * chi phí thấp, tách biệt với xuLyCauHoiTrongVideo (hàm đó mới thật sự chọn
 * đáp án + bấm nộp).
 */
async function coCauHoiHienRa(page: Page): Promise<boolean> {
  const btn = await timNutKiemTra(page, 400).catch(() => null);
  if (btn) return true;

  const selectors = [
    'div.question div.qselect',   // dạng chọn ảnh/thẻ radio OLM Kids (ưu tiên nhất)
    "input[type='radio']",
    'span.qiradio:not([data-tf-value])',
    'div.qselect',
    '.tw-border.hover\\:tw-scale-105',
    '[class*="answer-option"]',
    '[class*="choice"]',
  ];
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 300 }).catch(() => false)) return true;
  }
  return false;
}

async function xuLyCauHoiTrongVideo(page: Page, mocSo: number): Promise<boolean> {
  let daChonDapAn = false;

  // ─── Dạng NỐI cặp (div.boxlink[data-pos="left"/"right"]) ──────────────────
  // Kiểu bài "Nối đồ vật/khái niệm tương ứng": 2 cột N ô mỗi bên, click 1 ô
  // trái rồi 1 ô phải để nối. Kiểm tra trước vòng lặp trắc nghiệm bên dưới vì
  // các ô boxlink (chứa <img>) có thể bị các selector ảnh chung ('[class*=
  // "tw-cursor-pointer"] img', 'div[role="button"] img'...) bắt nhầm và chỉ
  // click 1 ô duy nhất thay vì nối đủ cặp.
  const leftBoxes  = page.locator('.boxlink[data-pos="left"], .boxlink.left');
  const rightBoxes = page.locator('.boxlink[data-pos="right"], .boxlink.right');
  const totalLeftBox  = await leftBoxes.count();
  const totalRightBox = await rightBoxes.count();

  if (totalLeftBox > 0 && totalRightBox > 0) {
    const leftHienThi: Locator[] = [];
    for (let i = 0; i < totalLeftBox; i++) {
      const b = leftBoxes.nth(i);
      if (await b.isVisible().catch(() => false)) leftHienThi.push(b);
    }
    const rightHienThi: Locator[] = [];
    for (let i = 0; i < totalRightBox; i++) {
      const b = rightBoxes.nth(i);
      if (await b.isVisible().catch(() => false)) rightHienThi.push(b);
    }

    const soCap = Math.min(leftHienThi.length, rightHienThi.length);
    if (soCap > 0) {
      console.log(`  📝 Mốc ${mocSo}: [NỐI] ${soCap} cặp (trái ${leftHienThi.length} / phải ${rightHienThi.length})`);

      // Nối theo thứ tự: trái 1-phải 1, trái 2-phải 2,... đến hết.
      for (let i = 0; i < soCap; i++) {
        try {
          await jsClick(page, leftHienThi[i]);
          await jsClick(page, rightHienThi[i]);
          console.log(`     nối cặp ${i + 1}/${soCap}: trái ${i + 1} ↔ phải ${i + 1}`);
        } catch (e) {
          console.log(`     cặp ${i + 1}: ⚠ Lỗi nối (${e})`);
        }
      }

      // 1 lần chờ duy nhất, nhân nhẹ theo số cặp, trước khi tìm nút Kiểm tra.
      await sleep(Math.min(Math.max(soCap, 1), 3) * 0.5);
      await damBaoOLM(page);
      daChonDapAn = true;
    }
  }

  // Tập selector đáp án — GỘP THÊM các dạng trắc nghiệm chuẩn dùng chung trên
  // toàn OLM (input radio, span.qiradio, div.qselect — lấy từ script luyện
  // tập Toán 9 & thi thử THPT Sinh học), vì hộp câu hỏi chèn trong video Kids
  // (như ảnh chụp: 4 đáp án dạng nút tròn radio) thực chất tái dùng UI trắc
  // nghiệm chuẩn của OLM, không chỉ riêng dạng "chọn ảnh/thẻ" như bản gốc.
  const luaChonSelectors = [
    'div.question div.qselect',   // dạng chọn ảnh/thẻ radio OLM Kids (ưu tiên nhất — khớp đúng cấu trúc thực tế)
    "input[type='radio']",
    'span.qiradio:not([data-tf-value])',
    'div.qselect',
    '.tw-border.hover\\:tw-scale-105',
    '[class*="tw-cursor-pointer"] img',
    '[class*="answer-option"]',
    '[class*="choice"]',
    'div[role="button"] img',
  ];

  for (const sel of luaChonSelectors) {
    if (daChonDapAn) break;
    const items = page.locator(sel);
    const count = await items.count();
    if (count === 0) continue;

    const visible: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const el = items.nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      // Loại trừ mọi phần tử nằm trong khung video (nút play/youtube/video khác...)
      if (await trongKhungVideo(el)) continue;
      // Loại trừ mọi phần tử là/trong link dẫn ra ngoài trang
      if (await isLinkRaNgoai(el)) continue;
      visible.push(el);
    }
    if (visible.length === 0) continue;

    const chon = visible[Math.floor(Math.random() * visible.length)];
    await jsClick(page, chon);
    await sleep(0.5);
    await damBaoOLM(page);
    console.log(`  📝 Mốc ${mocSo}: [TRẮC NGHIỆM] đã chọn 1 đáp án (selector: ${sel})`);
    daChonDapAn = true;
    break;
  }

  // Nếu không phải trắc nghiệm (không có lựa chọn nào ở trên) → thử dạng tự
  // luận (ô nhập số/chữ), giống cách xử lý câu tự luận trong bài luyện tập Toán 9.
  if (!daChonDapAn) {
    const inputs = page.locator(
      "input[placeholder='?'], textarea, div.fill-me input[type='text'], input[type='text']:not([disabled])"
    );
    const count = await inputs.count();
    const activeInputs: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const inp = inputs.nth(i);
      if (!(await inp.isVisible().catch(() => false))) continue;
      if (await trongKhungVideo(inp)) continue;
      activeInputs.push(inp);
    }
    if (activeInputs.length > 0) {
      console.log(`  📝 Mốc ${mocSo}: [TỰ LUẬN] Tìm thấy ${activeInputs.length} ô nhập → gõ '1'`);
      for (const inp of activeInputs) {
        await inp.fill('1').catch(() => {});
        await sleep(0.3);
      }
      daChonDapAn = true;
    }
  }

  // Tìm nút "Kiểm tra" SAU khi đã thử chọn đáp án — không còn dùng việc "có
  // thấy nút Kiểm tra hay không" làm điều kiện DUY NHẤT để biết có câu hỏi hay
  // không (bản gốc bị vậy nên luôn báo trượt), mà xét thêm cả việc đã chọn
  // được đáp án hay chưa.
  const btnKiemTra = await timNutKiemTra(page, 6000);

  if (!daChonDapAn && !btnKiemTra) {
    console.log('  ⚠ Không thấy câu hỏi nào hiện ra (không có đáp án lẫn nút "Kiểm tra")');
    return false;
  }

  if (!btnKiemTra) {
    console.log('  ⚠ Đã chọn được đáp án nhưng không tìm thấy nút "Kiểm tra" để nộp');
    return false;
  }

  if (!daChonDapAn) {
    console.log('  ⚠ Thấy nút "Kiểm tra" nhưng không xác định được ô đáp án cụ thể — vẫn thử bấm luôn');
  }

  if (await isLinkRaNgoai(btnKiemTra) || await trongKhungVideo(btnKiemTra)) {
    console.log('  ⚠ Nút "Kiểm tra" nằm trong khung video hoặc trỏ ra ngoài → bỏ qua, không bấm');
    return false;
  }

  await jsClick(page, btnKiemTra);
  await sleep(1.5);
  await damBaoOLM(page);
  console.log(`  ✓ Mốc ${mocSo}: đã bấm "Kiểm tra"`);

  // Một số câu hỏi có thêm nút xác nhận / đóng để video chạy tiếp
  const btnTiepTuc = await timElement(page, [
    "button:has-text('Tiếp tục')",
    "button:has-text('Đóng')",
    "button:has-text('OK')",
    "button:has-text('Xác nhận')",
  ], 2500);
  if (btnTiepTuc && !(await isLinkRaNgoai(btnTiepTuc))) {
    await jsClick(page, btnTiepTuc);
    await sleep(0.8);
    await damBaoOLM(page);
    console.log('     → đã đóng hộp kết quả câu hỏi');
  }

  return true;
}

/**
 * MỚI: chờ TẠI CHỖ (không tua lại) cho tới khi câu hỏi hiện tại được xử lý
 * xong — dù là do script tự động chọn đáp án + bấm "Kiểm tra" thành công, HAY
 * do người dùng tự trả lời thủ công trong lúc script đang đợi. Tiêu chí "đã
 * xử lý xong" = số mốc xanh còn lại giảm đi so với trước khi bắt đầu chờ.
 *
 * Không tua-đến-cuối lại trong lúc này — nếu tua lại ngay khi câu hỏi chưa
 * kịp xử lý xong (vd người dùng đang chọn đáp án thủ công), có thể làm gián
 * đoạn/mất câu hỏi đang hiện ra. Mỗi vòng poll sẽ thử tự động xử lý 1 lần,
 * đồng thời luôn kiểm tra xem marker đã giảm chưa (bắt được cả trường hợp xử
 * lý thủ công) trước khi thử tiếp.
 */
async function doiChoDenKhiCauHoiXuLyXong(page: Page, mocSo: number): Promise<boolean> {
  const soMocTruoc = await demSoMocXanhConLai(page);
  const soLanThu = Math.ceil(QUESTION_RESOLVE_MAX_WAIT_SEC / QUESTION_RESOLVE_POLL_SEC);

  for (let i = 0; i < soLanThu; i++) {
    if (!(await trangConSong(page))) return false;

    const xuLyOk = await xuLyCauHoiTrongVideo(page, mocSo);
    if (xuLyOk) {
      await sleep(1);
      const soMocSauKhiXuLy = await demSoMocXanhConLai(page);
      if (soMocSauKhiXuLy < soMocTruoc) {
        console.log(`  ✓ Mốc ${mocSo}: câu hỏi đã được xử lý xong (còn ${soMocSauKhiXuLy} mốc câu hỏi)`);
        return true;
      }
      // Đã bấm "Kiểm tra" nhưng marker chưa giảm (vd trả lời sai, cần làm lại,
      // hoặc UI chưa cập nhật kịp) → vẫn tiếp tục vòng chờ, không tua lại.
    }

    const soMocHienTai = await demSoMocXanhConLai(page);
    if (soMocHienTai < soMocTruoc) {
      console.log(`  ✓ Mốc ${mocSo}: phát hiện câu hỏi đã được xử lý (có thể do thao tác thủ công) — còn ${soMocHienTai} mốc câu hỏi`);
      return true;
    }

    if (i === 0 || (i + 1) % 5 === 0) {
      console.log(
        `  ⏳ Mốc ${mocSo}: vẫn đang chờ câu hỏi được trả lời` +
        ` (đã đợi ${((i + 1) * QUESTION_RESOLVE_POLL_SEC)}s / tối đa ${QUESTION_RESOLVE_MAX_WAIT_SEC}s, không tua lại trong lúc chờ)...`
      );
    }
    await sleep(QUESTION_RESOLVE_POLL_SEC);
  }

  console.log(
    `  ⚠ Mốc ${mocSo}: đã đợi tối đa ${QUESTION_RESOLVE_MAX_WAIT_SEC}s nhưng câu hỏi vẫn chưa được xác nhận là xử lý xong` +
    ' → tạm dừng chờ, để vòng lặp ngoài tua lại và thử nhận diện lại ở vòng sau.'
  );
  return false;
}

/**
 * MỚI: Sau khi tua đến cuối video (đã làm xong hết các mốc câu hỏi), OLM
 * thường hiện 1 popup "CHÚC MỪNG — Bạn đã nhận được sao học tập" (modal
 * riêng, đè lên trên) TRƯỚC KHI hiện màn hình hoàn thành bài học
 * (#congratulation-title). Popup này cần được ĐÓNG LẠI (bấm nút X /
 * data-dismiss="modal") thì luồng mới coi như xong hẳn — nếu không đóng, nó
 * có thể che mất / chặn việc nhận diện màn hình hoàn thành phía sau.
 */
async function dongPopupChucMungSaoHocTap(page: Page, timeoutMs = 6000): Promise<boolean> {
  const modalText = page.locator("text=CHÚC MỪNG").first();
  const thay = await modalText.isVisible({ timeout: timeoutMs }).catch(() => false);
  if (!thay) return false;

  console.log('  🌟 Phát hiện popup "CHÚC MỪNG — Bạn đã nhận được sao học tập" → đóng popup trước khi kiểm tra màn hình hoàn thành...');

  const btnDong = await timElement(page, [
    "div.modal.show button.close",
    "div.modal.show [data-dismiss='modal']",
    "div.modal-content button.close",
    "xpath=//div[contains(@class,'modal-content')][.//*[contains(text(),'CHÚC MỪNG')]]//button",
  ], 3000);

  if (btnDong && !(await isLinkRaNgoai(btnDong))) {
    await jsClick(page, btnDong);
    await sleep(0.8);
    await damBaoOLM(page);
    console.log('     → đã đóng popup "CHÚC MỪNG"');
  } else {
    console.log('  ⚠ Thấy popup "CHÚC MỪNG" nhưng không tìm được nút đóng cụ thể → thử nhấn Escape');
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(0.5);
  }
  return true;
}

/**
 * Đợi màn hình "Bạn đã hoàn thành bài học này" (#congratulation-title) hiện
 * ra sau khi đã xử lý xong tất cả các mốc câu hỏi trong video.
 */
async function doiManHinhHoanThanh(page: Page, timeoutSec = DOI_MAN_HINH_HOAN_THANH_SEC): Promise<boolean> {
  const el = page.locator(HOAN_THANH_TITLE_SELECTOR).first();
  const thay = await el.isVisible({ timeout: timeoutSec * 1000 }).catch(() => false);
  if (thay) {
    const text = (await el.innerText().catch(() => '')).trim();
    console.log(`  🎉 Đã thấy màn hình hoàn thành bài học: "${text}"`);
  } else {
    console.log('  ℹ Không thấy màn hình "hoàn thành bài học" xuất hiện trong thời gian chờ (có thể UI khác hoặc chưa kịp hiện).');
  }
  return thay;
}

/**
 * Gộp 2 bước cuối: đóng popup "CHÚC MỪNG — sao học tập" nếu có (nó có thể
 * hiện ra TRƯỚC màn hình hoàn thành, đè lên trên), rồi mới đợi màn hình
 * hoàn thành bài học hiện ra.
 */
async function xuLyPopupVaManHinhHoanThanh(page: Page): Promise<void> {
  const daDongPopup = await dongPopupChucMungSaoHocTap(page);
  if (daDongPopup) {
    await sleep(1);
  }
  await doiManHinhHoanThanh(page);
}

/**
 * Khi không tìm thấy hộp câu hỏi/đáp án theo mọi selector đang có, thay vì
 * đoán mù thêm selector, hàm này CHỤP ẢNH MÀN HÌNH + LƯU HTML xung quanh khu
 * vực player ngay lúc đó ra thư mục ./debug-video/. Dựa vào ảnh + HTML thật
 * này mới biết chính xác giao diện câu hỏi của bài đang chạy trông ra sao,
 * thay vì tiếp tục đoán selector không có căn cứ.
 */
async function chupDebugKhiKetLuatCauHoi(page: Page, moc: number, vongLap: number): Promise<void> {
  try {
    const fs = await import('fs');
    const dir = './debug-video';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const stamp = `moc${moc}_vong${vongLap}`;
    await page.screenshot({ path: `${dir}/${stamp}.png`, fullPage: false }).catch(() => {});

    const html = await page.evaluate(() => {
      // Lấy HTML khu vực player + mọi phần tử ngay sau nó (nơi hộp câu hỏi
      // thường được OLM chèn vào), giới hạn độ dài để dễ đọc.
      const container = document.querySelector('.mejs__container') || document.querySelector('video');
      const parent = container?.closest('div[class]')?.parentElement ?? document.body;
      return (parent as HTMLElement).outerHTML.slice(0, 20000);
    }).catch(() => '');
    fs.writeFileSync(`${dir}/${stamp}.html`, html, 'utf-8');

    console.log(`  🔍 Đã lưu debug: ${dir}/${stamp}.png và ${dir}/${stamp}.html — gửi 2 file này để xác định đúng giao diện câu hỏi`);
  } catch (e) {
    console.log(`  ⚠ Không chụp được debug: ${e}`);
  }
}

/** Kiểm tra trình duyệt/trang có còn sống không, tránh văng lỗi cứng giữa vòng lặp */
async function trangConSong(page: Page): Promise<boolean> {
  try {
    if (page.isClosed()) return false;
    await page.evaluate(() => true);
    return true;
  } catch {
    return false;
  }
}
async function kiemTraToanBoBaiVideo(page: Page): Promise<void> {
  console.log('[5] Bắt đầu kiểm tra các mốc câu hỏi trong video...');

  const tongSoMoc = await demSoMocXanhConLai(page);
  console.log(`  → Tổng cộng ${tongSoMoc} điểm dừng (mốc câu hỏi) cần làm trong video`);

  if (tongSoMoc === 0) {
    console.log('  ℹ Video này không có điểm dừng câu hỏi nào cần làm.');
    return;
  }

  let vongLap = 0;
  let soMocDaXuLy = 0;
  let mocConLai = tongSoMoc;
  const mocLoi: MocLoi[] = []; // các mốc đã tua tới + đợi đủ lâu nhưng KHÔNG hiện câu hỏi

  // LUỒNG: mỗi vòng → click tua đến cuối thanh trượt (OLM tự lùi thanh về
  // trước mốc xanh gần nhất ~5s) → đợi tối đa 10s để câu hỏi hiện ra (poll
  // từng giây, không sleep cứng, để không tốn thời gian nếu câu hỏi hiện sớm)
  // → nếu video bị kẹt lại (đang ở câu hỏi) thì CHỜ TẠI CHỖ (không tua lại)
  // đến khi câu hỏi được trả lời xong (tự động hoặc thủ công); nếu KHÔNG có
  // câu hỏi dù đã đến đúng mốc + đợi đủ lâu → ghi nhận đây là mốc NGHI BUG
  // (thiếu câu hỏi / không hiển thị), KHÔNG retry vô hạn tại chỗ, mà loại
  // trừ mốc đó ra và tiếp tục chạy đến hết bài.
  while (mocConLai > 0 && vongLap < MAX_SEEK_LOOPS) {
    if (!(await trangConSong(page))) {
      console.log('\n  ⚠ Trang/trình duyệt đã bị đóng giữa chừng → dừng vòng lặp.');
      break;
    }

    const mocLoiPhanTram = mocLoi.map((m) => m.phanTram);
    const mocGanNhat = await layMocXanhGanNhatTruMocLoi(page, mocLoiPhanTram);

    if (mocGanNhat === null) {
      console.log('\n  ℹ Không còn mốc hợp lệ nào để xử lý (đã loại trừ các mốc nghi lỗi) → dừng vòng lặp.');
      break;
    }

    vongLap++;
    console.log(
      `\n--- Vòng ${vongLap} (còn ${mocConLai}/${tongSoMoc} điểm dừng, đã loại ${mocLoi.length} mốc nghi lỗi,` +
      ` mốc gần nhất ~${mocGanNhat.toFixed(1)}%) ---`
    );

    const truoc = await layThoiGianVideo(page);
    if (truoc) {
      console.log(`  Thời gian hiện tại: ${truoc.current.toFixed(1)}s / ${truoc.duration.toFixed(1)}s`);
    }

    // Bước tua: click vào cuối thanh trượt — theo hành vi thực tế đã quan
    // sát, OLM sẽ tự lùi thanh trượt về trước mốc xanh gần nhất khoảng 5s
    // rồi tiếp tục phát, kích hoạt cơ chế hiện câu hỏi.
    console.log('  → Bấm tua đến cuối thanh trượt (OLM sẽ tự lùi về trước mốc gần nhất)...');
    await seekDenCuoiVideo(page);

    // Chờ thông báo đếm ngược (nếu có)
    await doiThongBaoSapCoCauHoi(page);

    // Đợi 10s, POLL currentTime từng giây để biết video có TIẾN hay bị KẸT
    // LẠI. Tiêu chí phát hiện câu hỏi giờ dựa vào việc thời gian có chạy tiếp
    // hay không, chứ không chỉ dò DOM: nếu OLM dừng video lại để hiện câu hỏi,
    // currentTime sẽ đứng yên (hoặc gần như không đổi) suốt 10s đó.
    const thoiGianBatDauDoi = await layThoiGianVideo(page);
    let thoiGianCuoiCungKhiDoi = thoiGianBatDauDoi;
    const soLanPoll = Math.ceil(QUESTION_WAIT_AFTER_SEEK_SEC / QUESTION_POLL_SEC);
    for (let i = 0; i < soLanPoll; i++) {
      if (!(await trangConSong(page))) break;
      await sleep(QUESTION_POLL_SEC);
      const t = await layThoiGianVideo(page);
      if (t) thoiGianCuoiCungKhiDoi = t;
    }

    const sau = thoiGianCuoiCungKhiDoi;
    if (sau) {
      console.log(`  Thời gian sau khi đợi ${QUESTION_WAIT_AFTER_SEEK_SEC}s: ${sau.current.toFixed(1)}s / ${sau.duration.toFixed(1)}s`);
    }

    const luongTien =
      thoiGianBatDauDoi && sau ? sau.current - thoiGianBatDauDoi.current : null;
    const videoBiKet = luongTien !== null && luongTien < STALL_TIEN_TOI_DA_SEC;

    if (videoBiKet) {
      // Thời gian KHÔNG chạy tiếp (hoặc tiến rất ít) sau 10s → đang ở đúng
      // bài/câu hỏi cần làm. DỪNG SEEK, chờ tại chỗ đến khi câu hỏi được xử
      // lý xong (tự động hoặc thủ công), rồi mới đợi 5s trước khi tua tiếp.
      console.log(
        `  ⏸ Video bị kẹt lại (chỉ tiến ${luongTien !== null ? luongTien.toFixed(1) : '?'}s sau ${QUESTION_WAIT_AFTER_SEEK_SEC}s)` +
        ' → đang ở câu hỏi cần làm. Dừng tua, chờ tại chỗ đến khi câu hỏi được xử lý xong...'
      );
      const xuLyOk = await doiChoDenKhiCauHoiXuLyXong(page, soMocDaXuLy + 1);
      if (xuLyOk) {
        soMocDaXuLy++;
      } else {
        console.log('  ⚠ Chưa xác nhận được câu hỏi đã xử lý xong trong thời gian chờ tối đa → thử lại ở vòng sau (sẽ tua lại)');
      }
      console.log(`  → Đợi ${WAIT_SAU_KHI_LAM_CAU_HOI_SEC}s trước khi tua-đến-cuối tiếp...`);
      await sleep(WAIT_SAU_KHI_LAM_CAU_HOI_SEC);
    } else {
      // Thời gian VẪN chạy tiếp bình thường trong 10s đó dù marker còn xanh
      // → nghi vấn LỖI THIẾU CÂU HỎI (hoặc câu hỏi không hiển thị) tại vị trí
      // này. Ghi nhận lại, KHÔNG lặp lại vô hạn ở đúng mốc này, để dành kiểm
      // tra thủ công sau khi chạy hết bài.
      console.log(
        `  ⚠ Video vẫn chạy tiếp bình thường (tiến ${luongTien !== null ? luongTien.toFixed(1) : '?'}s) dù mốc ~${mocGanNhat.toFixed(1)}%` +
        ' vẫn còn xanh → NGHI VẤN LỖI (thiếu câu hỏi / không hiển thị). Ghi nhận & bỏ qua, tiếp tục chạy đến hết bài.'
      );
      mocLoi.push({
        phanTram: mocGanNhat,
        thoiGianGiay: sau?.current ?? null,
        vongLap,
      });
      if (await trangConSong(page)) {
        await chupDebugKhiKetLuatCauHoi(page, soMocDaXuLy + 1, vongLap);
      }
    }

    if (!(await trangConSong(page))) {
      console.log('\n  ⚠ Trang/trình duyệt đã bị đóng giữa chừng → dừng vòng lặp.');
      break;
    }
    mocConLai = await demSoMocXanhConLai(page);

    // Nếu mọi mốc còn lại đều đã được ghi nhận là nghi lỗi → không còn gì để
    // xử lý nữa, dừng sớm thay vì chạy hết vòng lặp một cách vô ích.
    if (mocConLai > 0 && mocConLai <= mocLoi.length) {
      console.log('\n  ℹ Tất cả mốc còn lại đều đã được ghi nhận là nghi lỗi → dừng vòng lặp sớm.');
      break;
    }
  }

  if (vongLap >= MAX_SEEK_LOOPS && mocConLai > mocLoi.length) {
    console.log(`\n  ⚠ Đạt giới hạn vòng lặp an toàn (${MAX_SEEK_LOOPS}) nhưng vẫn còn điểm dừng chưa xử lý`);
  }

  // Tua lại lần cuối để xác nhận video thật sự chạy hết, không còn bị chặn —
  // CHỈ làm nếu trang vẫn còn sống, tránh văng lỗi page.evaluate trên trang
  // đã đóng (trường hợp dừng sớm do mất kết nối/đóng trình duyệt giữa chừng).
  if (!(await trangConSong(page))) {
    console.log('\n[6] Bỏ qua bước xác nhận cuối vì trang/trình duyệt đã đóng.');
    inBaoCaoCuoiBai(tongSoMoc, soMocDaXuLy, vongLap, mocLoi, null);
    return;
  }

  console.log('\n[6] Xác nhận video đã chạy hết (không còn bị chặn bởi điểm dừng nào)...');
  await seekDenCuoiVideo(page);
  await sleep(SEEK_WAIT_SEC);
  let cuoiCung = await layThoiGianVideo(page);
  let mocConLaiCuoi = await demSoMocXanhConLai(page);

  if (mocConLaiCuoi === 0) {
    // Đã làm xong TẤT CẢ các mốc (kể cả điểm dừng cuối cùng) → tua đến cuối
    // (trước SEEK_LUI_CUOI_GIAY giây) THÊM 1 LẦN NỮA rồi đợi thêm
    // WAIT_SAU_KHI_LAM_CAU_HOI_SEC giây để màn hình "Bạn đã hoàn thành bài
    // học này" (#congratulation-title) kịp hiện ra trước khi kết thúc luồng.
    console.log('  ✓ Đã làm xong tất cả các điểm dừng → tua đến cuối video 1 lần nữa & đợi màn hình hoàn thành...');
    await seekDenCuoiVideo(page);
    await sleep(WAIT_SAU_KHI_LAM_CAU_HOI_SEC);
    await xuLyPopupVaManHinhHoanThanh(page);
    cuoiCung = await layThoiGianVideo(page);
    mocConLaiCuoi = await demSoMocXanhConLai(page);
  }

  inBaoCaoCuoiBai(tongSoMoc, soMocDaXuLy, vongLap, mocLoi, { cuoiCung, mocConLaiCuoi });
}

/** In báo cáo tổng kết cho 1 bài video, bao gồm danh sách mốc nghi lỗi (nếu có)
 * để người kiểm tra lại thủ công sau khi chạy hết test. */
function inBaoCaoCuoiBai(
  tongSoMoc: number,
  soMocDaXuLy: number,
  vongLap: number,
  mocLoi: MocLoi[],
  ketQuaCuoi: { cuoiCung: ThoiGianVideo | null; mocConLaiCuoi: number } | null
): void {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 KẾT QUẢ KIỂM TRA BÀI VIDEO:');
  console.log(`   Tổng số điểm dừng (mốc câu hỏi): ${tongSoMoc}`);
  console.log(`   Số lần xử lý câu hỏi thành công: ${soMocDaXuLy}`);

  if (ketQuaCuoi) {
    console.log(`   Còn lại chưa làm (marker vẫn xanh): ${ketQuaCuoi.mocConLaiCuoi}`);
    if (ketQuaCuoi.cuoiCung) {
      console.log(
        `   Thời gian video hiện tại: ${ketQuaCuoi.cuoiCung.current.toFixed(1)}s / ${ketQuaCuoi.cuoiCung.duration.toFixed(1)}s`
      );
    }
  }
  console.log(`   Số vòng lặp đã chạy: ${vongLap}`);

  if (mocLoi.length > 0) {
    console.log(`\n   ⚠ ${mocLoi.length} MỐC NGHI BUG (đã tua tới + đợi đủ lâu nhưng KHÔNG hiện câu hỏi):`);
    mocLoi.forEach((m, i) => {
      const giay = m.thoiGianGiay !== null ? ` (~${m.thoiGianGiay.toFixed(1)}s)` : '';
      console.log(`      ${i + 1}. Vị trí ~${m.phanTram.toFixed(1)}%${giay} — phát hiện ở vòng ${m.vongLap}`);
    });
    console.log('   → Cần kiểm tra lại thủ công các vị trí trên (xem ảnh/HTML debug đã lưu trong ./debug-video/).');
  }

  const conThieu = ketQuaCuoi ? ketQuaCuoi.mocConLaiCuoi : tongSoMoc - soMocDaXuLy;
  if (conThieu === 0) {
    console.log('\n   ✅ ĐÃ LÀM HẾT TẤT CẢ ĐIỂM DỪNG TRONG VIDEO!');
  } else if (mocLoi.length > 0 && conThieu <= mocLoi.length) {
    console.log(`\n   ⚠ HOÀN THÀNH VỚI NGHI VẤN — còn ${conThieu} điểm dừng, trùng khớp với số mốc nghi bug đã ghi nhận ở trên.`);
  } else {
    console.log(`\n   ❌ CHƯA LÀM HẾT — còn sót ${conThieu}/${tongSoMoc} điểm dừng (chưa rõ lý do, không nằm trong danh sách nghi bug).`);
  }
  console.log('═'.repeat(60));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHẠY LIÊN TỤC QUA NHIỀU BÀI TRONG LỘ TRÌNH
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Sau khi 1 bài làm xong, node của nó đổi thành dấu ✓ và lộ trình tự chuyển
 * sang node kế tiếp (như trong ảnh minh hoạ). Hàm này lặp lại toàn bộ luồng
 * "vào lộ trình → tìm bài chưa làm → làm hết các mốc câu hỏi" cho đến khi
 * không còn bài video nào chưa hoàn thành, hoặc chạm giới hạn an toàn.
 */
async function chayToanBoLoTrinh(page: Page): Promise<void> {
  let soBaiDaXuLy = 0;

  while (soBaiDaXuLy < MAX_BAI_XU_LY) {
    const vaoDuoc = await moBaiVideoDauTien(page);
    if (!vaoDuoc) {
      console.log('\n🏁 Không còn bài video nào cần làm tiếp trên lộ trình — dừng lại.');
      break;
    }

    await kiemTraToanBoBaiVideo(page);
    soBaiDaXuLy++;
    console.log(`\n➡ Đã xử lý xong bài thứ ${soBaiDaXuLy}. Quay lại lộ trình để tìm bài tiếp theo...`);
    await sleep(1.5);
  }

  if (soBaiDaXuLy >= MAX_BAI_XU_LY) {
    console.log(`\n⚠ Đã đạt giới hạn ${MAX_BAI_XU_LY} bài trong 1 lần chạy — dừng để tránh chạy vô hạn.`);
  }

  console.log(`\n📦 TỔNG KẾT LỘ TRÌNH: đã xử lý ${soBaiDaXuLy} bài video.`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  // Tự động đóng ngay mọi tab/popup mới bật ra (vd link "Xem trên YouTube" có
  // target="_blank") để không bị nhảy ra ngoài, luôn ở lại trang OLM.
  page.on('popup', async (popup) => {
    console.log(`  ⚠ Phát hiện tab mới mở ra (${popup.url()}) → đóng lại, ở nguyên trang OLM`);
    await popup.close().catch(() => {});
  });

  try {
    // Bài Kids có thể học thử không cần đăng nhập (chỉ không lưu tiến trình),
    // nên đăng nhập là tuỳ chọn — set SKIP_LOGIN=true để bỏ qua.
    if (process.env.SKIP_LOGIN !== 'true') {
      try {
        await dangNhap(page);
      } catch (e) {
        console.log(`  ⚠ Đăng nhập thất bại, tiếp tục ở chế độ khách: ${e}`);
      }
    }

    await chayToanBoLoTrinh(page);

    console.log('\n\n✅ HOÀN THÀNH KIỂM TRA LỘ TRÌNH BÀI VIDEO!');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);