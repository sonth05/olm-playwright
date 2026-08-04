/**
 * kiemTraBaiVideoTheoUrl.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Biến thể ĐỘC LẬP của kiemTraBaiVideo.ts: thay vì tự dò lộ trình OLM Kids để
 * tìm bài video cần làm, script này ĐI THẲNG vào 1 URL bài học cụ thể do
 * người dùng chỉ định (BAI_HOC_URL bên dưới), đăng nhập bằng 1 tài khoản cụ
 * thể (không dùng danh sách tài khoản round-robin trong olmUtils), rồi chạy
 * đúng logic xử lý các mốc câu hỏi chèn trong video như bản gốc.
 *
 * KHÁC BIỆT so với kiemTraBaiVideo.ts:
 *   - KHÔNG vào olm.vn/kids / chương trình học / tự tìm node bài chưa hoàn
 *     thành — chỉ page.goto() thẳng tới BAI_HOC_URL.
 *   - KHÔNG lặp qua nhiều bài trên lộ trình (không có chayToanBoLoTrinh) —
 *     chỉ xử lý ĐÚNG 1 bài tại URL đã cho, chạy 1 lần rồi dừng.
 *   - Đăng nhập bằng hàm dangNhapTaiKhoan() riêng trong file này (không gọi
 *     dangNhap() của olmUtils, vì hàm đó có thể gắn với cơ chế chọn tài
 *     khoản round-robin cố định, không nhận username/password tuỳ ý) — dùng
 *     đúng tài khoản được truyền vào TAI_KHOAN bên dưới.
 *
 * LƯU Ý QUAN TRỌNG: hàm đăng nhập ở đây dùng SELECTOR DỰ ĐOÁN (input theo
 * name/type phổ biến: username/email, password, nút submit) vì mình không có
 * sẵn DOM thật của trang đăng nhập OLM để đối chiếu. Nếu chạy lần đầu bị kẹt
 * ở bước đăng nhập, script sẽ tự chụp ảnh debug (./debug-video/dang-nhap-loi.png)
 * — gửi ảnh đó lại để mình chỉnh đúng selector.
 *
 * Toàn bộ phần xử lý video (đọc thời gian qua YouTube iframe API, đếm/đọc mốc
 * xanh, seek qua postMessage seekTo, xử lý câu hỏi trắc nghiệm/tự luận, ghi
 * nhận mốc nghi lỗi, in báo cáo cuối bài) được TÁI SỬ DỤNG NGUYÊN VẸN từ
 * kiemTraBaiVideo.ts — không đổi logic, chỉ đổi phần vào bài + đăng nhập.
 *
 * CẬP NHẬT (fix "stuck ở câu hỏi"):
 *   - Trước đây, khi video bị kẹt lại ở 1 câu hỏi mà xuLyCauHoiTrongVideo
 *     KHÔNG tìm thấy UI câu hỏi ngay lần thử đầu tiên, script sẽ bỏ qua, đợi
 *     5s rồi LẶP LẠI TOÀN BỘ vòng ngoài (tức seek-đến-cuối lại từ đầu) — điều
 *     này làm gián đoạn câu hỏi đang hiện ra (nếu nó hiện ra hơi trễ, hoặc
 *     người dùng đang trả lời thủ công), khiến câu hỏi không bao giờ được xử
 *     lý xong.
 *   - Giờ đây, khi phát hiện video đang kẹt ở 1 câu hỏi, script sẽ CHỜ TẠI
 *     CHỖ (không seek lại) và liên tục thử xử lý / kiểm tra xem câu hỏi đã
 *     được trả lời hay chưa (tự động HOẶC thủ công — dựa vào số mốc xanh còn
 *     lại có giảm đi không), cho đến khi câu hỏi được xử lý xong hoặc hết
 *     thời gian chờ tối đa (QUESTION_RESOLVE_MAX_WAIT_SEC). Chỉ sau đó mới
 *     tiếp tục vòng lặp ngoài (seek-đến-cuối tiếp).
 *   - Ở bước xác nhận cuối bài: nếu đã làm hết tất cả các mốc (không còn mốc
 *     xanh nào), script sẽ seek-đến-cuối (trước 5s) THÊM 1 LẦN NỮA rồi đợi
 *     thêm 5s để màn hình "Bạn đã hoàn thành bài học này" (#congratulation-title)
 *     kịp hiện ra trước khi kết thúc luồng chạy, thay vì kết thúc ngay.
 *
 * Chạy: npx tsx scripts/kiemTraBaiVideoTheoUrl.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { type Locator, type Page } from 'playwright';
import { khoiBrowser, BASE } from 'core/automation/olmUtils';
import { sleep, jsClick, timElement, dongModal } from 'core/automation/lamBaiEngine';

// ── Cấu hình bài học & tài khoản cần kiểm tra ────────────────────────────────
const BAI_HOC_URL = 'https://debug.olm.vn/chu-de/hoang-hac-lau-phan-2-3830056348';
const TAI_KHOAN = {
  username: process.env.OLM_USERNAME || 'Thuhai05',
  password: process.env.OLM_PASSWORD || 'Thanhson2@',
};

const MAX_SEEK_LOOPS = 30;
const SEEK_WAIT_SEC = 1.5;
const RESUME_CHECK_WAIT_SEC = 5;
const QUESTION_WAIT_AFTER_SEEK_SEC = 10;
const QUESTION_POLL_SEC = 1;
const STALL_TIEN_TOI_DA_SEC = 2;
const WAIT_SAU_KHI_LAM_CAU_HOI_SEC = 5;
const MOC_TRUNG_PHAN_TRAM = 0.5;
const SEEK_LUI_CUOI_GIAY = 5; // lùi lại so với duration khi seek gần cuối, tránh trigger "ended"/nộp bài sớm

// ── Cấu hình chờ xử lý câu hỏi khi video bị kẹt (KHÔNG seek lại trong lúc chờ) ──
const QUESTION_RESOLVE_MAX_WAIT_SEC = 120; // tối đa 2 phút chờ 1 câu hỏi được trả lời (tự động hoặc thủ công)
const QUESTION_RESOLVE_POLL_SEC = 3;       // khoảng poll khi chờ câu hỏi được xử lý
const HOAN_THANH_TITLE_SELECTOR = '#congratulation-title';
const DOI_MAN_HINH_HOAN_THANH_SEC = 8; // thời gian tối đa đợi màn hình "đã hoàn thành bài học" hiện ra

interface MocLoi {
  phanTram: number;
  thoiGianGiay: number | null;
  vongLap: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ĐĂNG NHẬP (tài khoản chỉ định, không dùng round-robin của olmUtils)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Đăng nhập bằng 1 tài khoản cụ thể. Selector ở đây là DỰ ĐOÁN dựa trên các
 * pattern phổ biến của form đăng nhập OLM (chưa có DOM thật để đối chiếu) —
 * nếu không khớp, hàm sẽ log rõ bước nào thất bại + chụp debug để chỉnh lại.
 */
async function dangNhapTaiKhoan(page: Page, username: string, password: string): Promise<boolean> {
  console.log(`[Đăng nhập] Đăng nhập bằng tài khoản: ${username}...`);

  await page.goto(`${BASE}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(async () => {
    // Một số phiên bản OLM dùng route khác cho trang đăng nhập — fallback về trang chủ rồi bấm nút "Đăng nhập"
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1);
  await dongModal(page);

  // Nếu chưa ở đúng form đăng nhập (vd đang ở trang chủ), thử bấm nút/link "Đăng nhập"
  const oTrangDangNhap = await page.locator("input[type='password']").first().isVisible({ timeout: 2000 }).catch(() => false);
  if (!oTrangDangNhap) {
    const btnMoDangNhap = await timElement(page, [
      "a:has-text('Đăng nhập')",
      "button:has-text('Đăng nhập')",
      "xpath=//*[contains(normalize-space(text()),'Đăng nhập')]",
    ], 5000);
    if (btnMoDangNhap) {
      await jsClick(page, btnMoDangNhap);
      await sleep(1);
    }
  }

  const oTenDangNhap = await timElement(page, [
    "input[name='username']",
    "input[name='email']",
    "input[type='text']#username",
    "input[placeholder*='Tên đăng nhập']",
    "input[placeholder*='email' i]",
    "input[type='text']",
  ], 6000);
  const oMatKhau = await timElement(page, [
    "input[name='password']",
    "input[type='password']",
  ], 6000);

  if (!oTenDangNhap || !oMatKhau) {
    console.log('  ⚠ Không tìm thấy ô tên đăng nhập / mật khẩu trên form → chụp debug');
    await chupDebugDangNhap(page, 'khong-thay-form');
    return false;
  }

  await oTenDangNhap.fill(username);
  await sleep(0.2);
  await oMatKhau.fill(password);
  await sleep(0.2);

  const btnSubmit = await timElement(page, [
    "button[type='submit']",
    "button:has-text('Đăng nhập')",
    "xpath=//button[contains(normalize-space(text()),'Đăng nhập')]",
  ], 4000);

  if (!btnSubmit) {
    console.log('  ⚠ Không tìm thấy nút submit đăng nhập → thử nhấn Enter trong ô mật khẩu');
    await oMatKhau.press('Enter').catch(() => {});
  } else {
    await jsClick(page, btnSubmit);
  }

  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1.5);
  await dongModal(page);

  // Kiểm tra đăng nhập thành công: form mật khẩu không còn hiển thị nữa
  const conFormDangNhap = await page.locator("input[type='password']").first().isVisible({ timeout: 2000 }).catch(() => false);
  if (conFormDangNhap) {
    console.log('  ⚠ Có vẻ đăng nhập KHÔNG thành công (vẫn còn thấy form mật khẩu) → chụp debug');
    await chupDebugDangNhap(page, 'dang-nhap-that-bai');
    return false;
  }

  console.log(`  ✓ Đăng nhập thành công (${username})`);
  return true;
}

async function chupDebugDangNhap(page: Page, nhan: string): Promise<void> {
  try {
    const fs = await import('fs');
    const dir = './debug-video';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: `${dir}/dang-nhap-${nhan}.png`, fullPage: true }).catch(() => {});
    console.log(`  🔍 Đã lưu ${dir}/dang-nhap-${nhan}.png — gửi ảnh này để chỉnh lại selector đăng nhập`);
  } catch (e) {
    console.log(`  ⚠ Không chụp được debug đăng nhập: ${e}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIỆN ÍCH DÙNG CHUNG (giống hệt kiemTraBaiVideo.ts)
// ═══════════════════════════════════════════════════════════════════════════════
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

async function damBaoOLM(page: Page): Promise<void> {
  if (!page.url().includes('olm.vn')) {
    console.log(`  ⚠ Trang đã điều hướng ra ngoài OLM (${page.url()}) → quay lại trang trước`);
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await sleep(1);
  }
}

async function trongKhungVideo(locator: Locator): Promise<boolean> {
  try {
    return await locator.evaluate((el) => !!(el as HTMLElement).closest('.mejs__container'));
  } catch { return false; }
}

async function trangConSong(page: Page): Promise<boolean> {
  try {
    if (page.isClosed()) return false;
    await page.evaluate(() => true);
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VÀO THẲNG BÀI HỌC THEO URL (thay cho việc dò lộ trình)
// ═══════════════════════════════════════════════════════════════════════════════
async function moBaiVideoTheoUrl(page: Page, url: string): Promise<boolean> {
  console.log(`[1] Vào thẳng bài học: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1.5);
  await dongModal(page);

  const coVideo = await page.locator('video, .mejs__container').first()
    .isVisible({ timeout: 8000 }).catch(() => false);
  if (!coVideo) {
    console.log('  ⚠ Trang không có video — không đúng dạng bài video, hoặc trang chưa load xong');
    return false;
  }

  console.log(`  ✓ Đã vào bài video: ${page.url()}`);

  await xuLyCauHoiTonDongNeuCo(page);
  await playNeuCanThiet(page);
  const sanSang = await doiVideoSanSang(page);
  if (!sanSang) {
    console.log('  ⚠ Video không khởi tạo được thời lượng — vẫn tiếp tục thử, có thể sẽ dừng sớm ở bước sau');
  }
  await kiemTraResumeChoHocDo(page);

  return true;
}

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
// ĐỌC TRẠNG THÁI VIDEO / THANH TRƯỢT (giống hệt kiemTraBaiVideo.ts)
// ═══════════════════════════════════════════════════════════════════════════════
interface ThoiGianVideo {
  current: number;
  duration: number;
}

function parseMmSs(text: string): number | null {
  const parts = text.trim().split(':').map((p) => Number(p));
  if (parts.length === 0 || parts.some((p) => Number.isNaN(p))) return null;
  let sec = 0;
  for (const p of parts) sec = sec * 60 + p;
  return sec;
}

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

async function demSoMocXanhConLai(page: Page): Promise<number> {
  return page.evaluate(() => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>('.mejs__time-marker'));
    return markers.filter((m) => {
      const style = m.getAttribute('style') || '';
      return /background:\s*rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/i.test(style);
    }).length;
  });
}

async function doiThongBaoSapCoCauHoi(page: Page): Promise<boolean> {
  const preload = page.locator('#preload.quiz-f, #preload');
  const thayThongBao = await preload.first().isVisible({ timeout: 1200 }).catch(() => false);
  if (!thayThongBao) return false;

  const text = (await preload.first().innerText().catch(() => '')).trim();
  if (text) console.log(`  ⏳ ${text}`);

  await preload.first().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  return true;
}

async function playNeuCanThiet(page: Page): Promise<void> {
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

/**
 * Tua video (gần) đến cuối thông qua YouTube IFrame postMessage API — gửi
 * lệnh "seekTo" thẳng tới iframe, thay vì click chuột lên thanh trượt. Lùi
 * lại SEEK_LUI_CUOI_GIAY (5s) so với duration để tránh trigger "ended"/nộp
 * bài sớm khi video còn chưa xem hết thật sự (bài học bị đánh dấu hoàn thành
 * dù tỉ lệ xem còn rất thấp).
 */
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

  console.log('  ⚠ Không seek được qua iframe/JS (thiếu duration hoặc thiếu iframe YouTube) → dùng cách click thanh trượt (fallback)');
  const slider = page.locator('.mejs__time-total.mejs__time-slider, .mejs__time-slider').first();
  const box = await slider.boundingBox().catch(() => null);
  if (!box) return false;

  const x = box.x + box.width - 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await sleep(0.15);
  await page.mouse.click(x, y);
  await damBaoOLM(page);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// XỬ LÝ HỘP CÂU HỎI CHÈN TRONG VIDEO (giống hệt kiemTraBaiVideo.ts)
// ═══════════════════════════════════════════════════════════════════════════════
async function timNutKiemTra(page: Page, timeout = 6000): Promise<Locator | null> {
  return timElement(page, [
    "button:has-text('Kiểm tra')",
    "xpath=//button[contains(normalize-space(text()),'Kiểm tra')]",
    "xpath=//*[contains(normalize-space(@class),'btn')][contains(normalize-space(.),'Kiểm tra')]",
    "xpath=//*[self::div or self::a or self::span][contains(normalize-space(text()),'Kiểm tra')]",
  ], timeout);
}

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
      if (await trongKhungVideo(el)) continue;
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
 * MỚI: chờ TẠI CHỖ (không seek lại) cho tới khi câu hỏi hiện tại được xử lý
 * xong — dù là do script tự động chọn đáp án + bấm "Kiểm tra" thành công, HAY
 * do người dùng tự trả lời thủ công trong lúc script đang đợi. Tiêu chí "đã
 * xử lý xong" = số mốc xanh còn lại giảm đi so với trước khi bắt đầu chờ.
 *
 * Không seek-đến-cuối lại trong lúc này — nếu seek lại ngay khi câu hỏi chưa
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
      // hoặc UI chưa cập nhật kịp) → vẫn tiếp tục vòng chờ, không seek lại.
    }

    const soMocHienTai = await demSoMocXanhConLai(page);
    if (soMocHienTai < soMocTruoc) {
      console.log(`  ✓ Mốc ${mocSo}: phát hiện câu hỏi đã được xử lý (có thể do thao tác thủ công) — còn ${soMocHienTai} mốc câu hỏi`);
      return true;
    }

    if (i === 0 || (i + 1) % 5 === 0) {
      console.log(
        `  ⏳ Mốc ${mocSo}: vẫn đang chờ câu hỏi được trả lời` +
        ` (đã đợi ${((i + 1) * QUESTION_RESOLVE_POLL_SEC)}s / tối đa ${QUESTION_RESOLVE_MAX_WAIT_SEC}s, không seek lại trong lúc chờ)...`
      );
    }
    await sleep(QUESTION_RESOLVE_POLL_SEC);
  }

  console.log(
    `  ⚠ Mốc ${mocSo}: đã đợi tối đa ${QUESTION_RESOLVE_MAX_WAIT_SEC}s nhưng câu hỏi vẫn chưa được xác nhận là xử lý xong` +
    ' → tạm dừng chờ, để vòng lặp ngoài seek lại và thử nhận diện lại ở vòng sau.'
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

async function chupDebugKhiKetLuatCauHoi(page: Page, moc: number, vongLap: number): Promise<void> {
  try {
    const fs = await import('fs');
    const dir = './debug-video';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const stamp = `moc${moc}_vong${vongLap}`;
    await page.screenshot({ path: `${dir}/${stamp}.png`, fullPage: false }).catch(() => {});

    const html = await page.evaluate(() => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// VÒNG LẶP KIỂM TRA TOÀN BỘ MỐC CÂU HỎI TRONG BÀI (giống hệt kiemTraBaiVideo.ts)
// ═══════════════════════════════════════════════════════════════════════════════
async function kiemTraToanBoBaiVideo(page: Page): Promise<void> {
  console.log('[2] Bắt đầu kiểm tra các mốc câu hỏi trong video...');

  const tongSoMoc = await demSoMocXanhConLai(page);
  console.log(`  → Tổng cộng ${tongSoMoc} điểm dừng (mốc câu hỏi) cần làm trong video`);

  if (tongSoMoc === 0) {
    console.log('  ℹ Video này không có điểm dừng câu hỏi nào cần làm.');
    return;
  }

  let vongLap = 0;
  let soMocDaXuLy = 0;
  let mocConLai = tongSoMoc;
  const mocLoi: MocLoi[] = [];

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

    console.log('  → Tua đến gần cuối video (qua YouTube IFrame API)...');
    await seekDenCuoiVideo(page);

    await doiThongBaoSapCoCauHoi(page);

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
      console.log(
        `  ⏸ Video bị kẹt lại (chỉ tiến ${luongTien !== null ? luongTien.toFixed(1) : '?'}s sau ${QUESTION_WAIT_AFTER_SEEK_SEC}s)` +
        ' → đang ở câu hỏi cần làm. Dừng seek, chờ tại chỗ đến khi câu hỏi được xử lý xong (tự động hoặc thủ công)...'
      );
      const xuLyOk = await doiChoDenKhiCauHoiXuLyXong(page, soMocDaXuLy + 1);
      if (xuLyOk) {
        soMocDaXuLy++;
      } else {
        console.log('  ⚠ Chưa xác nhận được câu hỏi đã xử lý xong trong thời gian chờ tối đa → thử lại ở vòng sau (sẽ seek lại)');
      }
      console.log(`  → Đợi ${WAIT_SAU_KHI_LAM_CAU_HOI_SEC}s trước khi tua tiếp...`);
      await sleep(WAIT_SAU_KHI_LAM_CAU_HOI_SEC);
    } else {
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

    if (mocConLai > 0 && mocConLai <= mocLoi.length) {
      console.log('\n  ℹ Tất cả mốc còn lại đều đã được ghi nhận là nghi lỗi → dừng vòng lặp sớm.');
      break;
    }
  }

  if (vongLap >= MAX_SEEK_LOOPS && mocConLai > mocLoi.length) {
    console.log(`\n  ⚠ Đạt giới hạn vòng lặp an toàn (${MAX_SEEK_LOOPS}) nhưng vẫn còn điểm dừng chưa xử lý`);
  }

  if (!(await trangConSong(page))) {
    console.log('\n[3] Bỏ qua bước xác nhận cuối vì trang/trình duyệt đã đóng.');
    inBaoCaoCuoiBai(tongSoMoc, soMocDaXuLy, vongLap, mocLoi, null);
    return;
  }

  console.log('\n[3] Xác nhận video đã chạy hết (không còn bị chặn bởi điểm dừng nào)...');
  await seekDenCuoiVideo(page);
  await sleep(SEEK_WAIT_SEC);
  let cuoiCung = await layThoiGianVideo(page);
  let mocConLaiCuoi = await demSoMocXanhConLai(page);

  if (mocConLaiCuoi === 0) {
    // Đã làm xong TẤT CẢ các mốc (kể cả điểm dừng cuối cùng) → seek đến cuối
    // (trước SEEK_LUI_CUOI_GIAY giây) THÊM 1 LẦN NỮA rồi đợi thêm
    // WAIT_SAU_KHI_LAM_CAU_HOI_SEC giây để màn hình "Bạn đã hoàn thành bài
    // học này" (#congratulation-title) kịp hiện ra trước khi kết thúc luồng.
    console.log('  ✓ Đã làm xong tất cả các điểm dừng → seek đến cuối video 1 lần nữa & đợi màn hình hoàn thành...');
    await seekDenCuoiVideo(page);
    await sleep(WAIT_SAU_KHI_LAM_CAU_HOI_SEC);
    await xuLyPopupVaManHinhHoanThanh(page);
    cuoiCung = await layThoiGianVideo(page);
    mocConLaiCuoi = await demSoMocXanhConLai(page);
  }

  inBaoCaoCuoiBai(tongSoMoc, soMocDaXuLy, vongLap, mocLoi, { cuoiCung, mocConLaiCuoi });
}

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
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  page.on('popup', async (popup) => {
    console.log(`  ⚠ Phát hiện tab mới mở ra (${popup.url()}) → đóng lại, ở nguyên trang OLM`);
    await popup.close().catch(() => {});
  });

  try {
    const dangNhapOk = await dangNhapTaiKhoan(page, TAI_KHOAN.username, TAI_KHOAN.password);
    if (!dangNhapOk) {
      console.log('\n⚠ Đăng nhập thất bại — vẫn thử vào bài học ở chế độ khách (có thể không lưu tiến trình)...');
    }

    const vaoDuoc = await moBaiVideoTheoUrl(page, BAI_HOC_URL);
    if (!vaoDuoc) {
      console.log('\n❌ Không vào được bài video — dừng lại.');
      return;
    }

    await kiemTraToanBoBaiVideo(page);

    console.log('\n\n✅ HOÀN THÀNH KIỂM TRA BÀI VIDEO THEO URL!');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);