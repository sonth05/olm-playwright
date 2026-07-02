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
 * Chạy: npx tsx scripts/kiemTraBaiVideo.ts
 * (Bỏ qua đăng nhập: SKIP_LOGIN=true npx tsx scripts/kiemTraBaiVideo.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { type Locator, type Page } from 'playwright';
import { khoiBrowser, dangNhap } from './olmUtils';
import { sleep, jsClick, timElement, dongModal } from './lamBaiEngine';

const KIDS_URL = 'https://olm.vn/kids';
const CHUONG_TRINH_5_TUOI_URL = 'https://olm.vn/bg/chuong-trinh-hoc-cho-tre-5-tuoi';

const MAX_SEEK_LOOPS = 30;   // giới hạn vòng lặp an toàn (số mốc câu hỏi tối đa xử lý trong 1 bài)
const SEEK_WAIT_SEC = 1.5;   // đợi sau khi seek để player kịp phản ứng (lùi lại nếu có mốc)
const QUIZ_WAIT_SEC = 2;     // đợi hộp câu hỏi xuất hiện hẳn trước khi tương tác
const MAX_BAI_XU_LY = 20;    // giới hạn an toàn số bài video xử lý liên tiếp trong 1 lần chạy

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
 * loại trừ khi tìm ô đáp án, tránh bấm nhầm nút/link nằm trong khu vực điều khiển video. */
async function trongKhungVideo(locator: Locator): Promise<boolean> {
  try {
    return await locator.evaluate((el) => !!(el as HTMLElement).closest('.mejs__container'));
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

  await playNeuCanThiet(page);
  const sanSang = await doiVideoSanSang(page);
  if (!sanSang) {
    console.log('  ⚠ Video không khởi tạo được thời lượng — vẫn tiếp tục thử, có thể sẽ dừng sớm ở bước sau');
  }

  return true;
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
 * Đọc thời gian hiện tại/tổng thời lượng video.
 * Ưu tiên đọc trực tiếp thẻ <video> HTML5 (nếu OLM dùng video gốc).
 * FALLBACK: nhiều bài OLM Kids nhúng video qua MediaElement.js bọc YouTube/plugin
 * khác — lúc đó không có <video> chuẩn hoặc duration không đọc được, nên đọc
 * qua chữ hiển thị trên UI player: .mejs__currenttime / .mejs__duration
 * (luôn đúng vì mejs tự chuẩn hoá hiển thị thời gian bất kể backend nào).
 */
async function layThoiGianVideo(page: Page): Promise<ThoiGianVideo | null> {
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
  // Ưu tiên tuyệt đối: nếu có thẻ <video> gốc, gọi play() thẳng qua JS —
  // an toàn 100%, không có nguy cơ bấm nhầm overlay/link "Xem trên YouTube".
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

/** Bấm vào gần cuối thanh trượt video để mô phỏng tua đến hết bài (dùng cho lần xác nhận cuối) */
async function seekDenCuoiVideo(page: Page): Promise<boolean> {
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
  return timElement(page, [
    "button:has-text('Kiểm tra')",
    "xpath=//button[contains(normalize-space(text()),'Kiểm tra')]",
    "xpath=//*[contains(normalize-space(@class),'btn')][contains(normalize-space(.),'Kiểm tra')]",
    "xpath=//*[self::div or self::a or self::span][contains(normalize-space(text()),'Kiểm tra')]",
  ], timeout);
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
  // Tập selector đáp án — GỘP THÊM các dạng trắc nghiệm chuẩn dùng chung trên
  // toàn OLM (input radio, span.qiradio, div.qselect — lấy từ script luyện
  // tập Toán 9 & thi thử THPT Sinh học), vì hộp câu hỏi chèn trong video Kids
  // (như ảnh chụp: 4 đáp án dạng nút tròn radio) thực chất tái dùng UI trắc
  // nghiệm chuẩn của OLM, không chỉ riêng dạng "chọn ảnh/thẻ" như bản gốc.
  const luaChonSelectors = [
    "input[type='radio']",
    'span.qiradio:not([data-tf-value])',
    'div.qselect',
    '.tw-border.hover\\:tw-scale-105',
    '[class*="tw-cursor-pointer"] img',
    '[class*="answer-option"]',
    '[class*="choice"]',
    'div[role="button"] img',
  ];

  let daChonDapAn = false;
  for (const sel of luaChonSelectors) {
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
  let thatBaiLienTiep = 0;
  let khongTienTrienLienTiep = 0;
  let thoiGianTruocDo: number | null = null;
  let mocConLaiTruocDo: number | null = null;
  const POLL_SEC = 1.5;
  const MAX_POLL_MOI_VONG = 10; // ~15s thực tế cho video tự chạy ngang qua mốc mỗi vòng
  const MAX_KHONG_TIEN_TRIEN = 4; // dừng SỚM nếu N vòng liên tiếp hoàn toàn không nhích (currentTime & số mốc y nguyên)

  // Lặp cho tới khi KHÔNG CÒN mốc xanh nào (đã làm hết mọi điểm dừng)
  while (mocConLai > 0 && vongLap < MAX_SEEK_LOOPS) {
    // Kiểm tra trang còn sống trước — tránh văng lỗi cứng nếu browser bị đóng
    // (thủ công hoặc do crash) giữa chừng, thay vào đó dừng vòng lặp êm ái.
    if (!(await trangConSong(page))) {
      console.log('\n  ⚠ Trang/trình duyệt đã bị đóng giữa chừng → dừng vòng lặp.');
      break;
    }

    vongLap++;
    console.log(`\n--- Vòng ${vongLap} (còn ${mocConLai}/${tongSoMoc} điểm dừng chưa làm) ---`);

    const truoc = await layThoiGianVideo(page);
    if (truoc) {
      console.log(`  Thời gian hiện tại: ${truoc.current.toFixed(1)}s / ${truoc.duration.toFixed(1)}s`);
    }

    // QUAN TRỌNG: OLM tự resume video đúng vị trí đã xem lần trước — nếu vị
    // trí đó đã NẰM SAU mốc câu hỏi gần nhất (mốc vẫn xanh = chưa làm), cơ
    // chế tự hiện câu hỏi của OLM sẽ không bao giờ kích hoạt được nữa (nó chỉ
    // bắt sự kiện video TIẾN ngang qua mốc, không phải việc đang đứng sau
    // mốc). Nên phải chủ động lùi về trước mốc 1 lần bằng JS (không dùng
    // click, không đáng tin cậy để trigger), rồi để video CHẠY THẬT tiến tới.
    // Truyền durationDuPhong (đọc được từ layThoiGianVideo ở trên, vốn đã có
    // fallback qua chữ hiển thị .mejs__duration) — tránh lặp lại bug "không
    // xác định được vị trí mốc" khi video.duration không đọc được trực tiếp.
    const { daLui, mocGiay } = await damBaoDangTruocMocGanNhat(page, truoc?.duration ?? null);
    if (daLui && mocGiay !== null) {
      console.log(`  → Đã tua lùi về trước mốc câu hỏi (mốc ở ~${mocGiay.toFixed(1)}s) để video tự chạy ngang qua`);
    } else if (mocGiay !== null) {
      console.log(`  → Đang ở trước mốc câu hỏi (~${mocGiay.toFixed(1)}s), để video tự chạy tiếp...`);
      await playNeuCanThiet(page);
    } else {
      console.log('  ⚠ Không xác định được vị trí mốc câu hỏi nào nữa → thử tua tới cuối để xác nhận');
      await seekDenCuoiVideo(page);
    }

    // Chờ thông báo đếm ngược (nếu có) rồi POLL nhiều lần cho tới khi hộp câu
    // hỏi thật sự hiện ra, thay vì chỉ chờ cố định 1 lần như bản cũ.
    await doiThongBaoSapCoCauHoi(page);

    let daThayCauHoi = false;
    for (let i = 0; i < MAX_POLL_MOI_VONG; i++) {
      if (await coCauHoiHienRa(page)) {
        daThayCauHoi = true;
        break;
      }
      if (!(await trangConSong(page))) break;
      await sleep(POLL_SEC);
    }

    const sau = await layThoiGianVideo(page);
    if (sau) {
      console.log(`  Thời gian sau khi chờ: ${sau.current.toFixed(1)}s / ${sau.duration.toFixed(1)}s`);
    }

    if (!daThayCauHoi) {
      console.log('  ⚠ Chờ hết thời gian mà vẫn chưa thấy hộp câu hỏi hiện ra');
      thatBaiLienTiep++;
      if (thatBaiLienTiep === 3 && (await trangConSong(page))) {
        await chupDebugKhiKetLuatCauHoi(page, soMocDaXuLy + 1, vongLap);
      }
      await sleep(1);
      if (!(await trangConSong(page))) {
        console.log('\n  ⚠ Trang/trình duyệt đã bị đóng giữa chừng → dừng vòng lặp.');
        break;
      }
      mocConLai = await demSoMocXanhConLai(page);

      // ── PHÁT HIỆN KẸT (không tiến triển) → DỪNG SỚM ──────────────────────
      // Nếu thời gian video VÀ số mốc còn lại giống hệt vòng trước — nghĩa là
      // vòng lặp hoàn toàn không làm được gì cả (không phải "thử lại có cơ
      // hội thành công" mà là bế tắc thật sự) — không có lý do gì để tiếp tục
      // chạy đủ 30 vòng cho lãng phí thời gian. Dừng nhanh + chụp debug ngay.
      const thoiGianHienTai = sau?.current ?? null;
      const khongDoi =
        thoiGianTruocDo !== null &&
        thoiGianHienTai !== null &&
        Math.abs(thoiGianHienTai - thoiGianTruocDo) < 0.05 &&
        mocConLaiTruocDo === mocConLai;

      khongTienTrienLienTiep = khongDoi ? khongTienTrienLienTiep + 1 : 0;
      thoiGianTruocDo = thoiGianHienTai;
      mocConLaiTruocDo = mocConLai;

      if (khongTienTrienLienTiep >= MAX_KHONG_TIEN_TRIEN) {
        console.log(
          `\n  ⛔ Phát hiện KẸT hoàn toàn (${khongTienTrienLienTiep} vòng liên tiếp không nhích thời gian lẫn số mốc)` +
          ' → dừng sớm ngay, không chạy hết vòng lặp cho lãng phí.'
        );
        if (await trangConSong(page)) {
          await chupDebugKhiKetLuatCauHoi(page, soMocDaXuLy + 1, vongLap);
        }
        break;
      }
      continue;
    }

    // Có tiến triển (thấy câu hỏi) → reset bộ đếm kẹt
    khongTienTrienLienTiep = 0;

    const xuLyOk = await xuLyCauHoiTrongVideo(page, soMocDaXuLy + 1);
    if (xuLyOk) {
      soMocDaXuLy++;
      thatBaiLienTiep = 0;
    } else {
      console.log('  ⚠ Thấy dấu hiệu câu hỏi nhưng chưa xử lý được → thử lại ở vòng sau');
      thatBaiLienTiep++;
      if (thatBaiLienTiep === 3 && (await trangConSong(page))) {
        await chupDebugKhiKetLuatCauHoi(page, soMocDaXuLy + 1, vongLap);
      }
    }

    await sleep(1);
    if (!(await trangConSong(page))) {
      console.log('\n  ⚠ Trang/trình duyệt đã bị đóng giữa chừng → dừng vòng lặp.');
      break;
    }
    mocConLai = await demSoMocXanhConLai(page);
    thoiGianTruocDo = null; // đã có tiến triển thật (nộp/thử câu hỏi) → reset mốc so sánh
    mocConLaiTruocDo = mocConLai;
  }

  if (vongLap >= MAX_SEEK_LOOPS && mocConLai > 0) {
    console.log(`\n  ⚠ Đạt giới hạn vòng lặp an toàn (${MAX_SEEK_LOOPS}) nhưng vẫn còn ${mocConLai} điểm dừng chưa làm`);
  }

  // Tua lại lần cuối để xác nhận video thật sự chạy hết, không còn bị chặn —
  // CHỈ làm nếu trang vẫn còn sống, tránh văng lỗi page.evaluate trên trang
  // đã đóng (trường hợp dừng sớm do mất kết nối/đóng trình duyệt giữa chừng).
  if (!(await trangConSong(page))) {
    console.log('\n[6] Bỏ qua bước xác nhận cuối vì trang/trình duyệt đã đóng.');
    console.log(`\n${'═'.repeat(60)}`);
    console.log('📊 KẾT QUẢ KIỂM TRA BÀI VIDEO (dừng sớm do mất trang):');
    console.log(`   Tổng số điểm dừng (mốc câu hỏi): ${tongSoMoc}`);
    console.log(`   Số lần xử lý câu hỏi thành công: ${soMocDaXuLy}`);
    console.log(`   Số vòng lặp đã chạy: ${vongLap}`);
    console.log('═'.repeat(60));
    return;
  }

  console.log('\n[6] Xác nhận video đã chạy hết (không còn bị chặn bởi điểm dừng nào)...');
  await seekDenCuoiVideo(page);
  await sleep(SEEK_WAIT_SEC);
  const cuoiCung = await layThoiGianVideo(page);
  const mocConLaiCuoi = await demSoMocXanhConLai(page);

  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 KẾT QUẢ KIỂM TRA BÀI VIDEO:');
  console.log(`   Tổng số điểm dừng (mốc câu hỏi): ${tongSoMoc}`);
  console.log(`   Số lần xử lý câu hỏi thành công: ${soMocDaXuLy}`);
  console.log(`   Còn lại chưa làm (marker vẫn xanh): ${mocConLaiCuoi}`);
  if (cuoiCung) {
    console.log(`   Thời gian video hiện tại: ${cuoiCung.current.toFixed(1)}s / ${cuoiCung.duration.toFixed(1)}s`);
  }
  console.log(`   Số vòng lặp đã chạy: ${vongLap}`);
  if (mocConLaiCuoi === 0) {
    console.log('   ✅ ĐÃ LÀM HẾT TẤT CẢ ĐIỂM DỪNG TRONG VIDEO!');
  } else {
    console.log(`   ❌ CHƯA LÀM HẾT — còn sót ${mocConLaiCuoi}/${tongSoMoc} điểm dừng`);
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