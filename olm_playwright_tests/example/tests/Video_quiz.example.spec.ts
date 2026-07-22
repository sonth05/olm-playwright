/**
 * VÍ DỤ CHẠY THỬ - dùng login + selector THẬT của project
 * ---------------------------------------------------------------
 * Đăng nhập bằng storageState có sẵn (role.fixture) -> vào thẳng URL bài
 * học video -> chạy vòng lặp xử lý điểm dừng câu hỏi -> log kết quả.
 *
 * Khác với bản trước: các selector mejs__time-marker, #preload.quiz-f,
 * danh sách selector đáp án/nút "Kiểm tra"... được LẤY LẠI từ
 * scripts/Kiemtrabaivideo.ts (đã chạy thật, verify trên OLM Kids) — KHÔNG
 * còn là placeholder. Nếu bài "Toán 1" dùng đúng player mejs như Kids thì
 * chạy được ngay; nếu khác, chỉ cần chỉnh lại các mảng selector bên dưới.
 *
 * CÁCH CHẠY:
 *   npx playwright test --config=Playwright.example.config.ts \
 *     example/tests/Video_quiz.example.spec.ts --headed
 *
 * (URL bài học đọc từ biến môi trường URL_BAI_HOC, mặc định là bài
 * "Các số 0,1,2,3,4,5" trong ảnh chụp màn hình.)
 */

import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { sleep, jsClick, timElement } from '../../core/automation/lamBaiEngine';
import { dangNhap } from '../../core/automation/olmUtils';

const DUONG_DAN_BAI_HOC =
  process.env.URL_BAI_HOC ?? 'https://olm.vn/chu-de/cac-so-0-1-2-3-4-5-2028248573';

const MAX_SEEK_LOOPS = 30;
const POLL_SEC = 1.5;
const MAX_POLL_MOI_VONG = 10;
const LUI_TRUOC_MOC_GIAY = 4;

// ============ ĐỌC THỜI GIAN VIDEO (native <video> hoặc fallback mejs text) ============
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
    if (current !== null && duration !== null && duration > 0) return { current, duration };
  } catch { /* ignore */ }

  return null;
}

// ============ ĐẾM / TÌM MỐC CÂU HỎI CÒN XANH (mejs__time-marker) ============
async function demSoMocXanhConLai(page: Page): Promise<number> {
  return page.evaluate(() => {
    const markers = Array.from(document.querySelectorAll<HTMLElement>('.mejs__time-marker'));
    return markers.filter((m) =>
      /background:\s*rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/i.test(m.getAttribute('style') || '')
    ).length;
  });
}

/** Lùi video (qua JS, không click) về trước mốc câu hỏi gần nhất rồi play() để video tự tiến ngang qua */
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

      const duration = isFinite(v.duration) && v.duration > 0 ? v.duration : durationDuPhong;
      if (!duration || duration <= 0) return { daLui: false, mocGiay: null };

      const mocGiay = (Math.min(...phanTram) / 100) * duration;
      const diemAnToan = Math.max(0, mocGiay - luiGiay);

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

/** Trước điểm dừng, OLM hay hiện đếm ngược "#preload.quiz-f" — đợi nó biến mất */
async function doiThongBaoSapCoCauHoi(page: Page): Promise<boolean> {
  const preload = page.locator('#preload.quiz-f, #preload');
  const thay = await preload.first().isVisible({ timeout: 1200 }).catch(() => false);
  if (!thay) return false;
  await preload.first().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  return true;
}

async function playNeuCanThiet(page: Page): Promise<void> {
  const daPlayNative = await page.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null;
    if (v && v.paused) { v.play().catch(() => {}); return true; }
    return false;
  }).catch(() => false);
  if (daPlayNative) { await sleep(1); return; }

  const playBtn = page.locator(
    '.mejs__controls .mejs__play button, .mejs__controls .mejs__playpause-button button'
  ).first();
  if (await playBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await jsClick(page, playBtn);
    await sleep(1);
  }
}

/**
 * OLM LƯU LẠI tiến trình bài video đang học dở (điểm dừng đã làm, thời gian
 * xem...). Vì vậy mỗi lần vào lại CÙNG 1 bài để chạy test, video có thể vào
 * thẳng giữa chừng (đã qua một số điểm dừng) thay vì từ đầu, khiến test đếm
 * sai số mốc / bỏ sót câu hỏi.
 *
 * -> Trước khi bắt đầu xem, luôn bấm link "Học lại video" (xóa dữ liệu và
 *    làm lại) nếu nó xuất hiện trên trang:
 *      <a onclick="VIDEO_UI.deleteResult();" title="Xóa dữ liệu và làm lại">Học lại video</a>
 *    rồi xác nhận "Có" trong modal "Xác nhận / Bạn có chắc xóa dữ liệu bài
 *    này để làm lại?" hiện lên sau đó.
 * Nếu bài chưa từng học (chưa có dữ liệu cũ) thì link này không hiện ra —
 * hàm sẽ bỏ qua ngay, không coi là lỗi.
 */
async function hocLaiVideoNeuCoDuLieuCu(page: Page): Promise<void> {
  const btnHocLaiVideo = page.locator(
    'a[onclick*="VIDEO_UI.deleteResult"], a:has-text("Học lại video")'
  ).first();

  const coNutHocLai = await btnHocLaiVideo.isVisible({ timeout: 5000 }).catch(() => false);
  if (!coNutHocLai) {
    console.log('  ℹ Không thấy nút "Học lại video" (có thể bài chưa có dữ liệu cũ) — bỏ qua bước này');
    return;
  }

  console.log('  ↻ Thấy dữ liệu bài cũ — bấm "Học lại video" để xóa và làm lại...');
  // Dùng click THẬT của Playwright (không phải jsClick/evaluate) — một số modal
  // xác nhận của OLM lắng nghe chuỗi sự kiện chuột thật (mousedown/pointerdown)
  // chứ không chỉ 'click', nên click giả lập qua JS có thể không mở modal.
  await btnHocLaiVideo.click({ force: true, timeout: 3000 }).catch(() => {});
  await sleep(1);

  // Tìm thẳng nút "Có" — bỏ bước kiểm tra riêng chữ "Xác nhận" trước (lần
  // chạy trước bị báo "không thấy modal" dù chức năng có thể vẫn hoạt động
  // bình thường; tìm thẳng nút bấm cần dùng sẽ đáng tin hơn).
  const btnCo = await timElement(page, [
    "button:text-is('Có')",
    "xpath=//button[normalize-space(text())='Có']",
    ".modal.show button:has-text('Có')",
    ".modal button:has-text('Có')",
  ], 6000);

  if (!btnCo) {
    console.log('  ⚠ Đã bấm "Học lại video" nhưng không tìm thấy nút "Có" để xác nhận (có thể modal không hiện ra, hoặc bài vốn chưa có dữ liệu cũ để xóa)');
    return;
  }

  await jsClick(page, btnCo);
  // Xóa dữ liệu xong trang có thể reload lại video từ đầu -> chờ ổn định.
  await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => {});
  await sleep(1.5);
  console.log('  ✓ Đã xác nhận "Có" — dữ liệu bài cũ đã xóa, video sẽ chạy lại từ đầu');
}

// ============ PHÁT HIỆN + TRẢ LỜI CÂU HỎI CHÈN TRONG VIDEO ============
async function timNutKiemTra(page: Page, timeout = 6000): Promise<Locator | null> {
  return timElement(page, [
    // Selector THẬT lấy từ DOM (ưu tiên trước, chính xác nhất):
    // <button class="btn olm-btn-primary fw-700 mr-2 btn-check-question" onclick="VIDEO_UI.check();">Kiểm tra</button>
    'button.btn-check-question',
    '[onclick*="VIDEO_UI.check"]',
    // Các selector dự phòng (đoán theo text) — giữ lại phòng khi trang dùng bản khác:
    "button:has-text('Kiểm tra')",
    "xpath=//button[contains(normalize-space(text()),'Kiểm tra')]",
    "xpath=//*[contains(normalize-space(@class),'btn')][contains(normalize-space(.),'Kiểm tra')]",
    "xpath=//*[self::div or self::a or self::span][contains(normalize-space(text()),'Kiểm tra')]",
  ], timeout);
}

const LUA_CHON_SELECTORS = [
  "input[type='radio']",
  'span.qiradio:not([data-tf-value])',
  '.tw-border.hover\\:tw-scale-105',
  '[class*="tw-cursor-pointer"] img',
  '[class*="answer-option"]',
  '[class*="choice"]',
  'div[role="button"] img',
];

async function coCauHoiHienRa(page: Page): Promise<boolean> {
  const btn = await timNutKiemTra(page, 400).catch(() => null);
  if (btn) return true;
  if (await page.locator('.drag-select').first().isVisible({ timeout: 300 }).catch(() => false)) return true;
  if (await page.locator('div.qselect').first().isVisible({ timeout: 300 }).catch(() => false)) return true;
  for (const sel of LUA_CHON_SELECTORS) {
    if (await page.locator(sel).first().isVisible({ timeout: 300 }).catch(() => false)) return true;
  }
  return false;
}

/**
 * Loại câu hỏi "kéo thả số vào ô" (VD: Đếm số chấm tròn — ảnh chụp thực tế):
 *   <div class="item-drag" ...>
 *     <span class="drag-select" draggable="true" ondragstart="drag(event)"><span data-id="4">4</span></span>
 *     ...
 *   </div>
 *   (Kéo thả hoặc click vào để điền)
 * -> Đề bài cho phép CLICK thay vì kéo-thả thật, nên chỉ cần bấm lần lượt hết
 *    các số trong khay là chúng tự điền vào các ô trống theo thứ tự.
 * DOM re-render sau mỗi lần bấm (số đã dùng biến mất khỏi khay) nên phải lấy
 * lại danh sách `.drag-select` mỗi vòng lặp thay vì cache index cũ.
 */
async function chonTatCaSoKeoTha(page: Page): Promise<boolean> {
  let daChon = false;
  for (let guard = 0; guard < 30; guard++) {
    const items = page.locator('.drag-select');
    const con = await items.count();
    if (con === 0) break;

    const el = items.first();
    if (!(await el.isVisible().catch(() => false))) break;

    await jsClick(page, el);
    await sleep(0.3);
    daChon = true;
  }
  return daChon;
}

/**
 * Loại câu hỏi "chọn 1 trong nhiều ô ảnh/đáp án" — `div.qselect`.
 *
 * ĐÍNH CHÍNH so với bản trước: `div.qselect` KHÔNG PHẢI dropdown/combobox.
 * HTML thật (lấy từ debug log) cho thấy nó là các Ô ĐÁP ÁN nằm cạnh nhau
 * trong 1 nhóm `div.quiz-list`, ví dụ:
 *   <div class="quiz-list">
 *     <div data-ind="0" class="qselect qchecked">(ảnh số 4)</div>
 *     <div data-ind="1" class="qselect">(ảnh số 3)</div>
 *   </div>
 * Bấm THẲNG vào 1 trong các `div.qselect` là CHỌN LUÔN đáp án đó (tự thêm
 * class "qchecked") — không có bước "mở ra rồi chọn option" nào cả.
 *
 * Bug ở bản trước: vòng lặp bấm HẾT tất cả `div.qselect` trên trang (tức bấm
 * luôn cả 2 đáp án ind=0 VÀ ind=1 — mâu thuẫn vì trắc nghiệm chỉ được chọn
 * ĐÚNG 1 đáp án/nhóm), rồi còn bấm phím Escape sau mỗi lần — khiến OLM không
 * bao giờ coi là đã trả lời hợp lệ, nên nút "Kiểm tra" không hiện.
 *
 * Cách đúng: coi mỗi `.quiz-list` là 1 NHÓM cần chọn đúng 1 đáp án. Với mỗi
 * nhóm: nếu đã có đáp án được chọn rồi (`.qselect.qchecked`) thì bỏ qua
 * (tránh bấm chồng làm đổi đáp án); nếu chưa, bấm 1 `div.qselect` bất kỳ
 * (ngẫu nhiên) trong nhóm đó rồi dừng — KHÔNG bấm thêm ô nào khác trong
 * cùng nhóm, KHÔNG bấm Escape.
 */
async function chonCacNhomQselect(page: Page): Promise<boolean> {
  const groups = page.locator('div.quiz-list');
  const groupCount = await groups.count();

  // Phòng khi cấu trúc không luôn bọc trong .quiz-list -> fallback bấm 1
  // div.qselect bất kỳ đang hiển thị trên trang.
  if (groupCount === 0) {
    const items = page.locator('div.qselect');
    const count = await items.count();
    if (count === 0) return false;

    const visible: Locator[] = [];
    for (let i = 0; i < count; i++) {
      if (await items.nth(i).isVisible().catch(() => false)) visible.push(items.nth(i));
    }
    if (visible.length === 0) return false;

    const chon = visible[Math.floor(Math.random() * visible.length)];
    await jsClick(page, chon);
    await sleep(0.4);
    return true;
  }

  let daChonDuocGi = false;
  for (let g = 0; g < groupCount; g++) {
    const group = groups.nth(g);
    if (!(await group.isVisible().catch(() => false))) continue;

    // Nhóm này đã có đáp án được chọn rồi -> bỏ qua, không bấm lại (tránh đổi đáp án).
    const daCoChon = await group.locator('.qselect.qchecked').first()
      .isVisible({ timeout: 200 }).catch(() => false);
    if (daCoChon) continue;

    const options = group.locator('div.qselect');
    const ocount = await options.count();
    if (ocount === 0) continue;

    const visibleOpts: Locator[] = [];
    for (let j = 0; j < ocount; j++) {
      if (await options.nth(j).isVisible().catch(() => false)) visibleOpts.push(options.nth(j));
    }
    if (visibleOpts.length === 0) continue;

    const chon = visibleOpts[Math.floor(Math.random() * visibleOpts.length)];
    await jsClick(page, chon);
    await sleep(0.4);
    daChonDuocGi = true;
  }

  return daChonDuocGi;
}

/** Chọn 1 đáp án (ưu tiên trắc nghiệm; fallback tự luận gõ '1'). Trả về true nếu chọn được. */
async function chonMotDapAn(page: Page, mocSo: number, lanThu: number): Promise<boolean> {
  // Ưu tiên kiểm tra loại "kéo thả số vào ô" trước — vì đây là selector RIÊNG,
  // nếu chạy qua LUA_CHON_SELECTORS trước có thể vô tình khớp nhầm hoặc bỏ sót.
  if (await chonTatCaSoKeoTha(page)) {
    console.log(`  📝 Mốc ${mocSo} (lần ${lanThu}): đã bấm hết số trong khay kéo-thả (.drag-select)`);
    return true;
  }

  // div.qselect = các ô đáp án (ảnh/chữ) nằm trong nhóm .quiz-list — bấm
  // ĐÚNG 1 ô mỗi nhóm là chọn xong, không phải dropdown cần mở ra trước.
  if (await chonCacNhomQselect(page)) {
    console.log(`  📝 Mốc ${mocSo} (lần ${lanThu}): đã chọn 1 đáp án trong mỗi nhóm (div.qselect / .quiz-list)`);
    return true;
  }

  for (const sel of LUA_CHON_SELECTORS) {
    const items = page.locator(sel);
    const count = await items.count();
    if (count === 0) continue;

    const visible: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const el = items.nth(i);
      if (await el.isVisible().catch(() => false)) visible.push(el);
    }
    if (visible.length === 0) continue;

    const chon = visible[Math.floor(Math.random() * visible.length)];
    await jsClick(page, chon);
    await sleep(0.5);
    console.log(`  📝 Mốc ${mocSo} (lần ${lanThu}): đã chọn 1 đáp án (selector: ${sel})`);
    return true;
  }

  const inputs = page.locator(
    // input.trigger-curriculum-cate = selector THẬT của các ô "?" điền số (ảnh chụp thực tế)
    "input.trigger-curriculum-cate, input[placeholder='?'], textarea, div.fill-me input[type='text'], input[type='text']:not([disabled])"
  );
  const count = await inputs.count();
  let daChon = false;
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    if (await inp.isVisible().catch(() => false)) {
      await inp.fill('1').catch(() => {});
      daChon = true;
    }
  }
  return daChon;
}

type KetQuaKiemTra = 'dung' | 'sai' | 'khong-ro';

/**
 * Đọc kết quả ĐÚNG/SAI sau khi bấm "Kiểm tra".
 * TODO: đây là tập selector THAM KHẢO — anh F12 lúc hiện thông báo đúng/sai
 * thật (icon check xanh cạnh đáp án đúng như ảnh chụp, hoặc dấu X đỏ khi
 * chọn sai) để thay bằng class/text chính xác. Hiện đang đoán theo các mẫu
 * phổ biến của OLM (text "Chính xác"/"Sai rồi", màu xanh lá/đỏ).
 */
async function doiKetQuaKiemTra(page: Page): Promise<KetQuaKiemTra> {
  const dungSelectors = [
    'text=/Chính xác|Đúng rồi|Chúc mừng|Hoàn thành/i',
    '.text-success', '.tw-text-green-500', '.correct-answer', '[class*="text-green"]',
  ];
  const saiSelectors = [
    'text=/Sai rồi|Chưa đúng|Không đúng|Rất tiếc/i',
    '.text-danger', '.tw-text-red-500', '.wrong-answer', '[class*="text-red"]',
  ];

  for (const sel of dungSelectors) {
    if (await page.locator(sel).first().isVisible({ timeout: 1500 }).catch(() => false)) return 'dung';
  }
  for (const sel of saiSelectors) {
    if (await page.locator(sel).first().isVisible({ timeout: 1500 }).catch(() => false)) return 'sai';
  }
  return 'khong-ro';
}

/**
 * Luồng làm 1 câu hỏi chèn trong video, ĐÚNG THEO MÔ TẢ THỰC TẾ:
 *   1. Chọn đáp án -> bấm "Kiểm tra"
 *   2a. ĐÚNG -> có thông báo, video chạy tiếp (bấm nốt "Tiếp tục" nếu còn hiện) -> xong
 *   2b. SAI (lần 1) -> bấm "Tiếp tục" để làm lại -> quay lại bước 1 (lần 2)
 *   2c. SAI (lần 2, đã hết lượt thử) -> bấm "Bỏ qua" -> video mới chạy tiếp
 */
async function xuLyCauHoiTrongVideo(page: Page, mocSo: number): Promise<boolean> {
  const MAX_LAN_THU = 2;

  for (let lanThu = 1; lanThu <= MAX_LAN_THU; lanThu++) {
    const daChonDapAn = await chonMotDapAn(page, mocSo, lanThu);

    const btnKiemTra = await timNutKiemTra(page, 6000);
    if (!daChonDapAn && !btnKiemTra) {
      console.log('  ⚠ Không thấy câu hỏi nào hiện ra');
      return false;
    }
    if (!btnKiemTra) {
      console.log('  ⚠ Đã chọn đáp án nhưng không thấy nút "Kiểm tra"');
      return false;
    }

    await jsClick(page, btnKiemTra);
    await sleep(1.5);
    console.log(`  ✓ Mốc ${mocSo} (lần ${lanThu}): đã bấm "Kiểm tra"`);

    const ketQua = await doiKetQuaKiemTra(page);

    if (ketQua === 'dung') {
      console.log(`  🎉 Mốc ${mocSo}: TRẢ LỜI ĐÚNG (lần ${lanThu})`);
      // Sau khi đúng, đôi khi vẫn còn 1 nút xác nhận/tiếp tục để video chạy lại
      const btnSauDung = await timElement(page, [
        "button:has-text('Tiếp tục')",
        "button:has-text('Đóng')",
        "button:has-text('OK')",
        "button:has-text('Xác nhận')",
      ], 2500);
      if (btnSauDung) {
        await jsClick(page, btnSauDung);
        await sleep(0.8);
      }
      return true;
    }

    // ketQua === 'sai' hoặc 'khong-ro' (không đọc được kết quả -> coi như sai, thử theo đúng quy trình)
    console.log(`  ✗ Mốc ${mocSo}: SAI (lần ${lanThu}, kết quả đọc được: ${ketQua})`);

    if (lanThu < MAX_LAN_THU) {
      // Còn lượt thử -> bấm "Tiếp tục" để làm lại câu này (KHÔNG phải bấm Bỏ qua)
      const btnTiepTuc = await timElement(page, ["button:has-text('Tiếp tục')"], 3000);
      if (!btnTiepTuc) {
        console.log('  ⚠ Sai nhưng không tìm thấy nút "Tiếp tục" để làm lại');
        return false;
      }
      await jsClick(page, btnTiepTuc);
      await sleep(1);
      // quay lại đầu vòng for -> chọn đáp án lần 2
    } else {
      // Đã hết lượt thử (sai lần 2) -> bấm "Bỏ qua" để video chạy tiếp
      const btnBoQua = await timElement(page, ["button:has-text('Bỏ qua')"], 3000);
      if (!btnBoQua) {
        console.log('  ⚠ Sai lần cuối nhưng không tìm thấy nút "Bỏ qua"');
        return false;
      }
      await jsClick(page, btnBoQua);
      await sleep(1);
      console.log(`  ⏭ Mốc ${mocSo}: đã bấm "Bỏ qua" sau ${MAX_LAN_THU} lần sai`);
      return true; // coi như đã "xử lý xong" mốc này (bỏ qua), video chạy tiếp
    }
  }

  return false;
}

// ============ VÒNG LẶP CHÍNH CHO 1 BÀI VIDEO ============
async function kiemTraToanBoBaiVideo(page: Page): Promise<void> {
  const tongSoMoc = await demSoMocXanhConLai(page);
  console.log(`→ Tổng cộng ${tongSoMoc} điểm dừng cần làm`);
  if (tongSoMoc === 0) {
    console.log('ℹ Video không có điểm dừng câu hỏi nào.');
    return;
  }

  let vongLap = 0;
  let soMocDaXuLy = 0;
  let mocConLai = tongSoMoc;

  while (mocConLai > 0 && vongLap < MAX_SEEK_LOOPS) {
    vongLap++;
    console.log(`\n--- Vòng ${vongLap} (còn ${mocConLai}/${tongSoMoc}) ---`);

    const truoc = await layThoiGianVideo(page);
    const { daLui, mocGiay } = await damBaoDangTruocMocGanNhat(page, truoc?.duration ?? null);
    if (!daLui && mocGiay !== null) await playNeuCanThiet(page);

    await doiThongBaoSapCoCauHoi(page);

    let daThayCauHoi = false;
    for (let i = 0; i < MAX_POLL_MOI_VONG; i++) {
      if (await coCauHoiHienRa(page)) { daThayCauHoi = true; break; }
      await sleep(POLL_SEC);
    }

    if (!daThayCauHoi) {
      console.log('  ⚠ Chưa thấy câu hỏi hiện ra, thử lại vòng sau');
      await sleep(1);
      mocConLai = await demSoMocXanhConLai(page);
      continue;
    }

    const ok = await xuLyCauHoiTrongVideo(page, soMocDaXuLy + 1);
    if (ok) soMocDaXuLy++;

    await sleep(1);
    mocConLai = await demSoMocXanhConLai(page);
  }

  console.log(`\n📊 Đã xử lý ${soMocDaXuLy}/${tongSoMoc} điểm dừng, còn lại ${mocConLai}.`);
}

// ============ TEST CHẠY THỬ ============
test.describe('[VÍ DỤ] Video có điểm dừng câu hỏi', () => {
  // Dùng studentPage (worker-0, VIP student) — đổi sang teacherPage/normalStudentPage
  // nếu bài học yêu cầu vai trò khác.
  test('đăng nhập, mở bài học video, xử lý điểm dừng câu hỏi', async ({ page }) => {
    // Có thêm bước "Học lại video" + modal xác nhận trước khi vào bài, cộng
    // thêm việc chọn đáp án dropdown (div.qselect) giờ cần 2 bước (mở rồi
    // mới chọn option) thay vì 1 click, nên tăng timeout tổng của test lên
    // so với mặc định (60s) để tránh bị coi là treo/lỗi giữa chừng.
    test.setTimeout(120_000);

    // ===== BƯỚC 1: ĐĂNG NHẬP THẬT (tươi mới, không phụ thuộc storageState có sẵn) =====
    // dangNhap() vào thẳng /dangnhap, điền USERNAME/PASSWORD (mặc định = tài khoản
    // vip_student trong config/testData.ts), bấm nút đăng nhập, và tự throw nếu
    // sau khi bấm vẫn còn kẹt ở trang /dangnhap (đăng nhập thất bại).
    console.log('[BƯỚC 1] Đăng nhập...');
    await dangNhap(page);
    console.log(`  ✓ Đăng nhập xong, đang ở: ${page.url()}`);

    // ===== BƯỚC 2: SAU KHI ĐÃ ĐĂNG NHẬP XONG, MỚI VÀO URL BÀI HỌC =====
    console.log(`[BƯỚC 2] Vào bài học: ${DUONG_DAN_BAI_HOC}`);
    await page.goto(DUONG_DAN_BAI_HOC, { waitUntil: 'commit', timeout: 45_000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});

    // Dọn popup/modal có thể che video (xác thực, đổi mật khẩu, thông báo...)
    const dongPopupSelectors = [
      'button:has-text("Không hiện lại nữa")', 'button:has-text("Bỏ qua")',
      'button.close', 'button[aria-label="Close"]', '.btn-close',
      'span:has-text("×")', 'button:has-text("×")',
    ];
    for (const sel of dongPopupSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        await btn.click({ force: true, timeout: 2000 }).catch(() => {});
        await sleep(0.3);
      }
    }

    // ===== BƯỚC 2.5: XÓA DỮ LIỆU BÀI CŨ (NẾU CÓ) TRƯỚC KHI BẤM XEM VIDEO =====
    // OLM lưu tiến trình học dở của bài này -> mỗi lần chạy lại test trên
    // cùng 1 bài phải "Học lại video" + xác nhận "Có" trước, nếu không video
    // có thể vào giữa chừng (đã qua vài điểm dừng) làm sai số liệu đếm mốc.
    console.log('[BƯỚC 2.5] Kiểm tra dữ liệu bài cũ, học lại nếu cần...');
    await hocLaiVideoNeuCoDuLieuCu(page);

    // ===== BƯỚC 3: KIỂM TRA CÓ VIDEO KHÔNG =====
    const coVideo = await page.locator('video, .mejs__container').first()
      .isVisible({ timeout: 20_000 }).catch(() => false);

    if (!coVideo) {
      console.log(`⚠ Không thấy video. URL hiện tại: ${page.url()}`);
      console.log(`⚠ Tiêu đề trang: ${await page.title().catch(() => '(không đọc được)')}`);
    }
    expect(coVideo, 'Trang không có video — kiểm tra lại URL_BAI_HOC / quyền tài khoản').toBeTruthy();

    // ===== BƯỚC 4: XỬ LÝ ĐIỂM DỪNG CÂU HỎI =====
    await playNeuCanThiet(page);
    await kiemTraToanBoBaiVideo(page);
  });
});