/**
 * lamBaiEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine làm bài chung cho mọi loại bài OLM.vn:
 *   - Kiểm tra  (data-type="21")
 *   - Luyện tập (data-type="3")
 *   - Thi thử   (dạng phần / câu tiếp)
 *
 * ─── TỐI ƯU THỜI GIAN (bản này) ─────────────────────────────────────────────
 * Bản gốc rải rất nhiều sleep() nhỏ (0.15–0.4s) ở TỪNG bước con bên trong mỗi
 * hàm xử lý câu hỏi (VD: xuLyDropdown có 6 sleep riêng cho 1 câu 2 dropdown),
 * khiến thời gian cộng dồn/câu lớn hơn cần thiết dù các bước đó không thực sự
 * cần chờ riêng lẻ.
 *
 * Gộp lại còn 2 hằng số duy nhất:
 *   - READ_WAIT (2s)   → dùng đúng 1 lần MỖI KHI trang có nội dung MỚI thật sự
 *                        (sau page.goto(), sau khi bấm "Làm lại bài"/"Luyện tập
 *                        lại"/"Bắt đầu làm bài" — các thao tác này render lại
 *                        gần như toàn bộ giao diện làm bài).
 *   - ANSWER_WAIT (1s) → dùng đúng 1 lần SAU KHI đã chọn xong toàn bộ đáp án
 *                        của 1 câu, trước khi bấm nộp/chuyển câu. KHÔNG còn
 *                        sleep xen giữa các thao tác click con bên trong 1 câu
 *                        (click chọn dropdown thứ 1, thứ 2... không cần nghỉ
 *                        giữa từng cái — JS xử lý các click này gần như tức
 *                        thời, chỉ cần đợi state ổn định 1 lần trước khi nộp).
 *
 * Với câu có nhiều ô cần điền (dropdown/kéo-thả), ANSWER_WAIT được nhân nhẹ
 * theo số ô (tối đa x3) để tránh JS chưa kịp cập nhật xong toàn bộ trước khi
 * bấm nộp — xem SCALE_WAIT() bên dưới.
 *
 * Các chỗ chờ phần tử xuất hiện (waitFor/isVisible với timeout) GIỮ NGUYÊN
 * là chờ theo SỰ KIỆN thật (không phải sleep cứng) — nếu phần tử đã có sẵn,
 * hàm trả về gần như ngay lập tức, không cộng dồn thời gian chờ.
 *
 * THÊM MỚI trong version này (giữ nguyên từ bản trước):
 *   7. xuLyDropdown: xử lý câu hỏi dạng chọn dropdown (select-advance-btn)
 *      - Đếm đúng số dropdown trong câu → click từng cái → chọn option đầu tiên
 *   8. xuLyKeoTha: xử lý câu hỏi dạng kéo thả (drag-select → dragtext)
 *      - Đếm ô trống (span.dragtext.selectpoint) → click từng đáp án tương ứng
 *   9. xuLyNoi: xử lý câu hỏi dạng NỐI cặp (div.boxlink[data-pos="left"/"right"])
 *      - Đếm số ô trái/phải đang hiển thị → nối lần lượt trái 1-phải 1,
 *        trái 2-phải 2,... đến hết rồi bấm "Kiểm tra"
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { type Locator, type Page } from 'playwright';

// ─── Hằng số ─────────────────────────────────────────────────────────────────
const MAX_CAU       = 120;  // giới hạn vòng lặp an toàn
const MAX_VONG_RONG = 8;    // số vòng không nhận diện được → dừng
const DS_INDEX_MAP  = [0, 1, 0, 1]; // Đúng/Sai cho ý a,b,c,d: 0=Đúng, 1=Sai

// ─── Thời gian chờ (gộp) ──────────────────────────────────────────────────────
// READ_WAIT: đọc/nhận diện DOM sau khi trang có nội dung MỚI (goto / render lại
//            màn hình làm bài). Có thể override qua env READ_WAIT (giây).
const READ_WAIT   = Number(process.env.READ_WAIT   ?? 2);
// ANSWER_WAIT: sau khi đã chọn xong đáp án của 1 câu, trước khi nộp/chuyển câu.
//              Có thể override qua env ANSWER_WAIT (giây).
const ANSWER_WAIT = Number(process.env.ANSWER_WAIT ?? 1);

/**
 * Nhân nhẹ ANSWER_WAIT theo số ô cần điền trong 1 câu (dropdown/kéo-thả có
 * nhiều ô) — tối đa x3 lần, để JS có đủ thời gian cập nhật xong toàn bộ các ô
 * trước khi bấm nộp. Với câu 1 ô vẫn là đúng ANSWER_WAIT (1s).
 */
function scaleWait(soO: number): number {
  return ANSWER_WAIT * Math.min(Math.max(soO, 1), 3);
}

// ─── Utilities ───────────────────────────────────────────────────────────────
export async function sleep(sec: number): Promise<void> {
  await new Promise((r) => setTimeout(r, sec * 1000));
}

export async function jsClick(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

export async function timElement(
  page: Page,
  selectors: string[],
  timeout = 4000
): Promise<Locator | null> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: 'visible', timeout });
      return loc;
    } catch {
      continue;
    }
  }
  return null;
}

async function humanMouseMove(page: Page): Promise<void> {
  try {
    const x = Math.floor(Math.random() * 800) + 100;
    const y = Math.floor(Math.random() * 600) + 100;
    await page.mouse.move(x, y);
  } catch { /* ignore */ }
}

// ─── Đóng modal xác thực / thông báo ─────────────────────────────────────────
const MODAL_SEL = '.modal.show[role="dialog"], .modal.show, div[role="dialog"]:visible';

export async function dongModal(page: Page): Promise<void> {
  let visible = false;
  try {
    visible = await page.locator('.modal.show').isVisible({ timeout: 800 });
  } catch { return; }
  if (!visible) return;

  console.log('  ⚠ Modal chặn trang → đang đóng...');

  const closeTries = [
    "button:has-text('Không hiển thị nữa')",
    "button:has-text('Không hiển lại nữa')",
    "button:has-text('Đóng')",
    "button:has-text('OK')",
    "button:has-text('Xác nhận')",
    '#modal-form-active-mail .close',
    '.modal.show .modal-header .close',
    '.modal.show button[aria-label="Close"]',
    '.modal.show .btn-close',
    '.popup-close-button',
    '.modal.show .modal-footer button:last-child',
  ];

  for (const sel of closeTries) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 400 })) {
        await btn.click({ force: true });
        break;
      }
    } catch { /* ignore */ }
  }

  try { await page.keyboard.press('Escape'); } catch { /* ignore */ }

  try {
    const backdrop = page.locator('.modal-backdrop, .modal.show').first();
    if (await backdrop.isVisible({ timeout: 300 })) {
      await page.mouse.click(10, 10);
    }
  } catch { /* ignore */ }

  try {
    await page.locator('.modal.show').waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    await sleep(1);
  }
  console.log('  ✓ Modal đã đóng');
}

// ─── Kiểm tra toast "hoàn thành hết câu" (dạng thi thử) ─────────────────────
async function isHoanThanh(page: Page): Promise<boolean> {
  try {
    return await page.locator(
      "[class*='tw-bg-accent-extra-light']:has-text('hoàn thành hết câu hỏi'), " +
      "div.tw-font-semibold:has-text('Bạn đã hoàn thành hết câu hỏi'), " +
      "div:has-text('Bạn đã hoàn thành')"
    ).isVisible({ timeout: 300 });
  } catch { return false; }
}

// ─── Kiểm tra "làm hết một lượt" (dạng luyện tập) ───────────────────────────
async function isHetLuot(page: Page): Promise<boolean> {
  return (
    (await page.locator("xpath=//*[contains(text(),'làm hết một lượt')]").count()) > 0 ||
    (await page.locator("xpath=//*[contains(text(),'Bạn đã làm hết')]").count()) > 0
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// XỬ LÝ TỪNG LOẠI CÂU
// ═══════════════════════════════════════════════════════════════════════════════

/** Câu Đúng/Sai (td.tf-box) — ưu tiên check trước trắc nghiệm */
async function xuLyDungSai(page: Page, cauSo: number): Promise<boolean> {
  try {
    await page.waitForSelector('td.tf-box', { timeout: 1000 }).catch(() => {});
    const tfBoxes  = page.locator('td.tf-box');
    const boxCount = await tfBoxes.count();
    if (boxCount === 0) return false;

    const visible: number[] = [];
    for (let i = 0; i < boxCount; i++) {
      if (await tfBoxes.nth(i).isVisible()) visible.push(i);
    }
    if (visible.length === 0) return false;

    console.log(`  Câu ${cauSo}: [ĐÚNG/SAI] ${visible.length} ý`);
    await humanMouseMove(page);

    // Click hết các ý liên tiếp — KHÔNG sleep giữa từng ý nữa.
    for (let gi = 0; gi < visible.length; gi++) {
      const box      = tfBoxes.nth(visible[gi]);
      const wantDung = (DS_INDEX_MAP[gi] ?? DS_INDEX_MAP[DS_INDEX_MAP.length - 1]) === 0;
      const val      = wantDung ? '1' : '0';
      const label    = wantDung ? 'Đúng' : 'Sai';
      const target   = box.locator(`span[data-tf-value="${val}"]`);
      if (await target.isVisible({ timeout: 800 }).catch(() => false)) {
        await target.click({ force: true });
        console.log(`     ý ${String.fromCharCode(97 + gi)}: [${label}]`);
      }
    }

    // 1 lần chờ duy nhất, nhân theo số ý, trước khi coi như xong câu.
    await sleep(scaleWait(visible.length));
    return true;
  } catch { return false; }
}

/** Câu trắc nghiệm thông thường */
async function xuLyTracNghiem(page: Page, cauSo: number): Promise<boolean> {
  const selectors = [
    "span.qimage:not([data-tf-value])",
    "span.qiradio:not([data-tf-value])",
    "div.qselect",
    ".answer-option",
    "input[type='radio']",
    "div[role='radio']",
    "label[for*='option']",
  ];

  for (const sel of selectors) {
    const els   = page.locator(sel);
    const count = await els.count();
    const visible: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const e = els.nth(i);
      if (await e.isVisible()) visible.push(e);
    }
    if (visible.length >= 2) {
      const choice = visible[Math.floor(Math.random() * visible.length)];
      await humanMouseMove(page);
      await jsClick(page, choice);
      console.log(`  Câu ${cauSo}: [TRẮC NGHIỆM] đã chọn (${sel})`);

      // 1 lần chờ duy nhất sau khi chọn, trước khi tìm nút nộp.
      await sleep(ANSWER_WAIT);
      const btnDone = await timElement(page, [
        'button.btn-done',
        "xpath=//button[@title='Làm xong và nộp bài']",
        "xpath=//button[contains(@class,'btn-done')]",
      ], 2000);
      if (btnDone) {
        await jsClick(page, btnDone);
        console.log(`  Câu ${cauSo}: ✓ Đã nộp trắc nghiệm`);
      }
      return true;
    }
  }
  return false;
}

/** Câu tự luận (input text / textarea) */
async function xuLyTuLuan(page: Page, cauSo: number): Promise<boolean> {
  const inputs = page.locator(
    "span.trigger-curriculum-cate input[type='text'], " +
    "div.fill-me input[type='text'], " +
    "div#quizz input[type='text'], " +
    "input[placeholder='?'], " +
    "textarea"
  );
  const count = await inputs.count();
  const active: Locator[] = [];
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    if (await inp.isVisible() && !(await inp.getAttribute('disabled'))) {
      active.push(inp);
    }
  }
  if (active.length === 0) return false;

  console.log(`  Câu ${cauSo}: [TỰ LUẬN] ${active.length} ô nhập`);

  // Điền hết các ô liên tiếp — KHÔNG sleep giữa từng ô nữa.
  for (const inp of active) {
    try {
      await inp.click({ clickCount: 3 });
      await inp.type('1', { delay: 30 });
      await inp.blur();
    } catch { /* ignore */ }
  }

  // 1 lần chờ duy nhất, nhân theo số ô, trước khi bấm nộp.
  await sleep(scaleWait(active.length));
  const btnDone = await timElement(page, [
    'button.btn-done',
    "xpath=//button[@title='Làm xong và nộp bài']",
    "xpath=//button[contains(@class,'btn-done')]",
  ], 4000);
  if (btnDone) {
    await jsClick(page, btnDone);
    console.log(`  Câu ${cauSo}: ✓ Đã nộp tự luận`);
  }
  return true;
}

// ─── Câu chọn Dropdown (select-advance-btn) ─────────────────────────────────
/**
 * Xử lý câu hỏi dạng dropdown OLM (select-advance-btn).
 *
 * Cấu trúc HTML:
 *   <button class="select-advance-btn ... dropdown-toggle" data-index="0" data-selected-value="-1">
 *     <span class="select-advance-display">?</span>
 *   </button>
 *   <!-- sau khi click, menu hiện ra: -->
 *   <button class="select-advance-dropdown-item dropdown-item" data-value="1">5</button>
 *
 * Logic:
 *   1. Đếm tất cả nút dropdown visible trong câu hiện tại
 *   2. Với mỗi dropdown: click toggle → đợi menu (waitFor theo sự kiện, không
 *      sleep cứng) → click option đầu tiên — KHÔNG sleep xen giữa các dropdown
 *   3. Sau khi xử lý hết → 1 lần chờ duy nhất (nhân theo số dropdown) rồi nộp
 */
async function xuLyDropdown(page: Page, cauSo: number): Promise<boolean> {
  try {
    const toggles = page.locator('button.select-advance-btn.dropdown-toggle');
    const total   = await toggles.count();
    if (total === 0) return false;

    const active: Locator[] = [];
    for (let i = 0; i < total; i++) {
      const btn = toggles.nth(i);
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        active.push(btn);
      }
    }
    if (active.length === 0) return false;

    console.log(`  Câu ${cauSo}: [DROPDOWN] ${active.length} ô cần chọn`);

    for (let i = 0; i < active.length; i++) {
      const toggle = active[i];
      try {
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click({ force: true });

        // Chờ menu mở — chờ SỰ KIỆN thật, không phải sleep cứng.
        const menuItem = page.locator(
          'button.select-advance-dropdown-item.dropdown-item:visible, ' +
          '.select-advance-dropdown-item.dropdown-item:visible'
        ).first();

        const appeared = await menuItem.waitFor({ state: 'visible', timeout: 2000 })
          .then(() => true).catch(() => false);

        if (!appeared) {
          console.log(`     dropdown ${i + 1}: ⚠ Menu không mở được`);
          await page.keyboard.press('Escape');
          continue;
        }

        const allItems  = page.locator(
          'button.select-advance-dropdown-item.dropdown-item:visible, ' +
          '.select-advance-dropdown-item.dropdown-item:visible'
        );
        const itemCount = await allItems.count();

        if (itemCount === 0) {
          console.log(`     dropdown ${i + 1}: ⚠ Không có option`);
          await page.keyboard.press('Escape');
          continue;
        }

        const firstItem = allItems.first();
        const itemText  = (await firstItem.innerText().catch(() => '?')).trim();
        await firstItem.click({ force: true });

        console.log(`     dropdown ${i + 1}/${active.length}: chọn "${itemText}"`);
      } catch (e) {
        console.log(`     dropdown ${i + 1}: ⚠ Lỗi (${e})`);
      }
    }

    // 1 lần chờ duy nhất, nhân theo số dropdown, trước khi nộp.
    await sleep(scaleWait(active.length));
    const btnDone = await timElement(page, [
      'button.btn-done',
      "xpath=//button[@title='Làm xong và nộp bài']",
      "xpath=//button[contains(@class,'btn-done')]",
    ], 2000);
    if (btnDone) {
      await jsClick(page, btnDone);
      console.log(`  Câu ${cauSo}: ✓ Đã nộp dropdown`);
    }

    return true;
  } catch { return false; }
}

// ─── Câu kéo thả (drag-select → dragtext) ────────────────────────────────────
/**
 * Xử lý câu hỏi dạng kéo thả OLM.
 *
 * Cấu trúc HTML:
 *   Ô trống cần điền:
 *     <span class="dragtext trigger-curriculum-cate selectpoint"
 *           ondrop="drop(event)" ondragover="allowDrop(event)"></span>
 *
 *   Đáp án có thể kéo:
 *     <span id="de3542470356" class="drag-select" draggable="true">
 *       <span data-id="1">7</span>
 *     </span>
 *
 * Logic:
 *   1. Đếm số ô trống (span.dragtext.selectpoint) đang rỗng (chưa có nội dung)
 *   2. Đếm số đáp án (span.drag-select) còn trong vùng đáp án
 *   3. Với mỗi ô trống: click vào đáp án tương ứng (OLM hỗ trợ "click để điền")
 *      → dùng click thay vì drag-drop thực sự (đơn giản, ổn định hơn)
 *   4. Không sleep xen giữa các ô — chỉ 1 lần chờ duy nhất sau khi điền hết
 */
async function xuLyKeoTha(page: Page, cauSo: number): Promise<boolean> {
  try {
    const oTrong = page.locator(
      'span.dragtext.selectpoint, ' +
      'span.dragtext.trigger-curriculum-cate.selectpoint'
    );
    const totalO = await oTrong.count();
    if (totalO === 0) return false;

    const dapAn = page.locator('span.drag-select[draggable="true"]');
    const totalDA = await dapAn.count();
    if (totalDA === 0) return false;

    const oTrongRong: Locator[] = [];
    for (let i = 0; i < totalO; i++) {
      const o = oTrong.nth(i);
      if (!await o.isVisible({ timeout: 300 }).catch(() => false)) continue;
      const text = (await o.innerText().catch(() => '')).trim();
      if (text === '' || text === '?') {
        oTrongRong.push(o);
      }
    }

    const dapAnCoThe: Locator[] = [];
    for (let i = 0; i < totalDA; i++) {
      const da = dapAn.nth(i);
      if (await da.isVisible({ timeout: 300 }).catch(() => false)) {
        dapAnCoThe.push(da);
      }
    }

    if (oTrongRong.length === 0 || dapAnCoThe.length === 0) return false;

    console.log(`  Câu ${cauSo}: [KÉO THẢ] ${oTrongRong.length} ô trống, ${dapAnCoThe.length} đáp án`);

    const soOCanDien = Math.min(oTrongRong.length, dapAnCoThe.length);

    for (let i = 0; i < soOCanDien; i++) {
      const da = dapAnCoThe[i];
      const o  = oTrongRong[i];

      try {
        const daText = (await da.innerText().catch(() => '?')).trim();

        await da.scrollIntoViewIfNeeded();
        await da.click({ force: true });

        // Kiểm tra xem ô đã được điền chưa (đôi khi click đáp án tự điền vào
        // ô đang focus). Chờ ngắn theo sự kiện thay vì sleep cứng.
        await page.waitForTimeout(150);
        const oText = (await o.innerText().catch(() => '')).trim();
        if (oText !== '' && oText !== '?') {
          console.log(`     ô ${i + 1}: ✓ đã điền "${daText}" (click đáp án)`);
          continue;
        }

        // Nếu chưa điền → click ô trống để focus, rồi click đáp án lại
        await o.scrollIntoViewIfNeeded();
        await o.click({ force: true });
        await da.click({ force: true });

        console.log(`     ô ${i + 1}: "${daText}" → ô trống`);
      } catch (e) {
        console.log(`     ô ${i + 1}: ⚠ Lỗi kéo thả (${e})`);
      }
    }

    // 1 lần chờ duy nhất, nhân theo số ô, trước khi nộp.
    await sleep(scaleWait(soOCanDien));
    const btnDone = await timElement(page, [
      'button.btn-done',
      "xpath=//button[@title='Làm xong và nộp bài']",
      "xpath=//button[contains(@class,'btn-done')]",
    ], 2000);
    if (btnDone) {
      await jsClick(page, btnDone);
      console.log(`  Câu ${cauSo}: ✓ Đã nộp kéo thả`);
    }

    return true;
  } catch { return false; }
}

// ─── Câu NỐI cặp (div.boxlink[data-pos="left"/"right"]) ──────────────────────
/**
 * Xử lý câu hỏi dạng NỐI OLM — kiểu "Nối đồ vật/khái niệm tương ứng".
 *
 * Cấu trúc HTML (theo ảnh mẫu):
 *   <div class="boxlink left"  data-pos="left"  data-id="0">...</div>
 *   <div class="boxlink right" data-pos="right" data-id="0">...</div>
 *   (mỗi bên có đúng N ô, click 1 ô trái rồi click 1 ô phải để nối thành 1 cặp
 *   — nối xong OLM tự vẽ đường nối, không cần xác định cặp đã nối qua class)
 *
 * Logic (đơn giản theo thứ tự, không cần biết cặp nào đúng/đã nối):
 *   1. Đếm số ô trái và số ô phải đang hiển thị trong câu (N ô mỗi bên)
 *   2. Nối lần lượt theo thứ tự: trái 1 ↔ phải 1, trái 2 ↔ phải 2, ... đến hết
 *      (click ô trái thứ i rồi click ngay ô phải thứ i, không sleep xen giữa)
 *   3. Nối xong hết N cặp → 1 lần chờ duy nhất (nhân theo số cặp) → bấm "Kiểm tra"
 */
async function xuLyNoi(page: Page, cauSo: number): Promise<boolean> {
  try {
    const leftSel  = '.boxlink[data-pos="left"], .boxlink.left';
    const rightSel = '.boxlink[data-pos="right"], .boxlink.right';

    const leftBoxes  = page.locator(leftSel);
    const rightBoxes = page.locator(rightSel);

    const totalLeft  = await leftBoxes.count();
    const totalRight = await rightBoxes.count();
    if (totalLeft === 0 || totalRight === 0) return false;

    const leftHienThi: Locator[] = [];
    for (let i = 0; i < totalLeft; i++) {
      const b = leftBoxes.nth(i);
      if (await b.isVisible({ timeout: 300 }).catch(() => false)) leftHienThi.push(b);
    }

    const rightHienThi: Locator[] = [];
    for (let i = 0; i < totalRight; i++) {
      const b = rightBoxes.nth(i);
      if (await b.isVisible({ timeout: 300 }).catch(() => false)) rightHienThi.push(b);
    }

    if (leftHienThi.length === 0 || rightHienThi.length === 0) return false;

    const soCap = Math.min(leftHienThi.length, rightHienThi.length);
    console.log(`  Câu ${cauSo}: [NỐI] ${soCap} cặp (trái ${leftHienThi.length} / phải ${rightHienThi.length})`);
    await humanMouseMove(page);

    // Nối theo thứ tự: trái 1-phải 1, trái 2-phải 2,... đến hết — không sleep
    // xen giữa từng cặp, chỉ 1 lần chờ duy nhất ở cuối trước khi bấm Kiểm tra.
    for (let i = 0; i < soCap; i++) {
      try {
        await leftHienThi[i].scrollIntoViewIfNeeded();
        await leftHienThi[i].click({ force: true });

        await rightHienThi[i].scrollIntoViewIfNeeded();
        await rightHienThi[i].click({ force: true });

        console.log(`     nối cặp ${i + 1}/${soCap}: trái ${i + 1} ↔ phải ${i + 1}`);
      } catch (e) {
        console.log(`     cặp ${i + 1}: ⚠ Lỗi nối (${e})`);
      }
    }

    // 1 lần chờ duy nhất, nhân theo số cặp, trước khi bấm Kiểm tra.
    await sleep(scaleWait(soCap));

    const btnKiemTra = await timElement(page, [
      "button:has-text('Kiểm tra')",
      'button.btn-check',
      "xpath=//button[contains(normalize-space(text()),'Kiểm tra')]",
      'button.btn-done',
      "xpath=//button[@title='Làm xong và nộp bài']",
    ], 3000);

    if (btnKiemTra) {
      await jsClick(page, btnKiemTra);
      console.log(`  Câu ${cauSo}: ✓ Đã nối hết và bấm Kiểm tra`);
    } else {
      console.log(`  Câu ${cauSo}: ⚠ Đã nối nhưng không thấy nút Kiểm tra`);
    }

    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHUYỂN CÂU / PHẦN (dạng thi thử)
// ═══════════════════════════════════════════════════════════════════════════════
async function getCurrentCauIndex(page: Page): Promise<string | null> {
  try {
    const el = page.locator('.list-question-container div.tw-text-accent-default').first();
    if (await el.isVisible({ timeout: 200 })) {
      const txt = (await el.innerText()).trim();
      if (/^\d+$/.test(txt)) return txt;
    }
  } catch { /* ignore */ }
  return null;
}

async function chuyenCauThiThu(page: Page, cauSo: number): Promise<'tiep' | 'phan' | 'xong'> {
  try {
    await page.keyboard.press('Escape');

    const nextCauBtn  = page.locator("button.btn-next-question, button:has-text('Câu tiếp')");
    const nextPhanBtn = page.locator(
      "button:has-text('Phần tiếp'), a:has-text('Phần tiếp'), " +
      ".list-question-container button:has(span:has-text('Phần tiếp')), " +
      "button[class*='tw-']:has-text('Phần tiếp')"
    );

    const coNutCau  = await nextCauBtn.isVisible({ timeout: 200 }).catch(() => false);
    const coNutPhan = await nextPhanBtn.isVisible({ timeout: 200 }).catch(() => false);

    if (coNutCau) {
      const idxTruoc = await getCurrentCauIndex(page);
      await nextCauBtn.click();
      // 1 lần chờ duy nhất sau khi chuyển câu.
      await sleep(ANSWER_WAIT);
      if (await isHoanThanh(page)) return 'xong';
      const idxSau = await getCurrentCauIndex(page);
      console.log(`   → Câu ${idxTruoc} → ${idxSau}`);
      if (idxTruoc !== null && idxSau !== null && idxTruoc === idxSau) {
        if (await nextPhanBtn.isVisible({ timeout: 600 }).catch(() => false)) {
          await nextPhanBtn.click();
          // Chuyển PHẦN render lại nhiều nội dung hơn → coi như trang mới.
          await sleep(READ_WAIT);
          return 'phan';
        }
        return 'xong';
      }
      return 'tiep';
    }

    if (coNutPhan) {
      console.log('   → Hết câu phần này → Phần tiếp...');
      await nextPhanBtn.click();
      await sleep(READ_WAIT);
      return 'phan';
    }

    return 'xong';
  } catch { return 'xong'; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NỘP BÀI
// ═══════════════════════════════════════════════════════════════════════════════

async function nopBaiLuyenTap(page: Page): Promise<void> {
  console.log('\n[KẾT THÚC] Làm hết một lượt → Nộp bài...');
  await sleep(ANSWER_WAIT);

  const btn = await timElement(page, [
    'button.btn-save:not([disabled])',
    "xpath=//button[contains(@class,'btn-save') and not(@disabled)]",
    "xpath=//button[normalize-space(text())='Nộp bài' and not(@disabled)]",
    "xpath=//button[contains(normalize-space(text()),'Nộp bài') and not(@disabled)]",
    'button.btn-save',
    "xpath=//button[normalize-space(text())='Nộp bài']",
  ], 6000);

  if (btn) {
    await jsClick(page, btn);
    await sleep(ANSWER_WAIT);

    const popup = page.locator(
      '#btn-confirm-dialog-confirm, .popup-primary-button, ' +
      "button:has-text('Xác nhận'), button:has-text('Đồng ý'), .swal2-confirm"
    );
    if (await popup.isVisible({ timeout: 3000 }).catch(() => false)) {
      await popup.first().click();
    }

    console.log('✅ ĐÃ NỘP BÀI LUYỆN TẬP!');
  } else {
    console.log('⚠ Không tìm thấy nút Nộp bài luyện tập');
  }
}

async function nopBaiThiThu(page: Page): Promise<void> {
  console.log('\n[6] Nộp bài...');
  try {
    // Đợi trang ổn định sau khi làm hết câu cuối.
    await sleep(ANSWER_WAIT);

    const nopSelectors = [
      'button.btn-submit-cate',
      'button.btn-submit',
      "button:has-text('Nộp bài')",
      "button:has-text('Nộp')",
      "button:has-text('Kết thúc')",
      "button:has-text('Hoàn thành')",
      "a:has-text('Nộp bài')",
      "button.tw-olm-btn-primary-48:has-text('Nộp')",
      "button[class*='btn']:has-text('Nộp')",
      "xpath=//button[contains(normalize-space(text()),'Nộp bài')]",
      "xpath=//button[contains(normalize-space(text()),'Nộp')]",
      "xpath=//button[contains(normalize-space(text()),'Kết thúc')]",
    ];

    let btnNop = await timElement(page, nopSelectors, 8000);

    if (!btnNop) {
      // Thử scroll xuống rồi tìm lại — vẫn chờ theo sự kiện, không sleep cứng thêm.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      btnNop = await timElement(page, nopSelectors, 5000);
    }

    if (!btnNop) {
      console.log('  ⚠ Không tìm thấy nút Nộp bài');
      return;
    }

    await btnNop.scrollIntoViewIfNeeded();
    await btnNop.click({ force: true });
    console.log('  → Đã click Nộp bài');
    await sleep(ANSWER_WAIT);

    const popup = page.locator(
      '#btn-confirm-dialog-confirm, .popup-primary-button, ' +
      "button:has-text('Xác nhận'), button:has-text('Đồng ý'), .swal2-confirm"
    );
    if (await popup.isVisible({ timeout: 6000 }).catch(() => false)) {
      await popup.first().click();
      console.log('✅ ĐÃ XÁC NHẬN NỘP BÀI!');
    } else {
      console.log('✅ ĐÃ NỘP BÀI!');
    }
  } catch {
    console.log('⚠ Không click được nút Nộp bài');
  }
}

async function xuLyTiepTuc(page: Page): Promise<boolean> {
  const btn = await timElement(page, [
    "button.olm-btn-primary[onclick*='nextQuestion']",
    "xpath=//button[contains(@onclick,'nextQuestion')]",
    "xpath=//button[contains(normalize-space(text()),'Tiếp tục làm bài')]",
    "xpath=//a[contains(normalize-space(text()),'Tiếp tục làm bài')]",
  ], 2000);
  if (btn) {
    console.log("   → Câu sai → 'Tiếp tục làm bài'");
    await jsClick(page, btn);
    await sleep(ANSWER_WAIT);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHÁT HIỆN LOẠI BÀI VÀ KHỞI ĐẦU
// ═══════════════════════════════════════════════════════════════════════════════

type BaiType = 'thi-thu' | 'luyen-tap' | 'kiem-tra' | 'unknown';

async function phatHienLoaiBai(page: Page): Promise<BaiType> {
  if (
    await page.locator('.list-question-container, button.btn-next-question').isVisible({ timeout: 500 }).catch(() => false)
  ) return 'thi-thu';

  if (
    await page
      .locator(
        "button:has-text('Bắt đầu làm bài'), .btn-start-exam, " +
        "button.tw-olm-btn-primary-48:has-text('Bắt đầu'), " +
        "button.btn-redo-exam"
      )
      .isVisible({ timeout: 500 })
      .catch(() => false)
  ) return 'thi-thu';

  if (
    await page.locator('button.btn-done, button.btn-save').isVisible({ timeout: 500 }).catch(() => false)
  ) return 'luyen-tap';

  if (
    await page.locator("button:has-text('Làm bài kiểm tra'), button:has-text('Bắt đầu kiểm tra')").isVisible({ timeout: 500 }).catch(() => false)
  ) return 'kiem-tra';

  return 'unknown';
}

async function khoiDongThiThu(page: Page): Promise<void> {
  await dongModal(page);

  const btnLamLai = page.locator('button.btn-redo-exam');
  if (await btnLamLai.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('  → Màn hình kết quả cũ → Làm lại bài...');
    await btnLamLai.click();
    const popup = page.locator(
      '#btn-confirm-dialog-confirm, .popup-primary-button, ' +
      "button:has-text('Xác nhận'), button:has-text('Đồng ý')"
    );
    if (await popup.isVisible({ timeout: 4000 }).catch(() => false)) {
      await popup.first().click();
    }
    // "Làm lại bài" render lại toàn bộ giao diện làm bài → coi như trang mới.
    await sleep(READ_WAIT);
  }

  const btnBatDau = page.locator([
    "button:has-text('Bắt đầu làm bài')",
    ".btn-start-exam",
    "button.tw-olm-btn-primary-48:has-text('Bắt đầu')",
    "button[class*='btn']:has-text('Bắt đầu')",
  ].join(', '));

  if (await btnBatDau.isVisible({ timeout: 6000 }).catch(() => false)) {
    console.log('  → Click Bắt đầu làm bài...');
    await btnBatDau.first().click();
    await page.waitForSelector(
      'td.tf-box, span.qiradio, span.qimage, div.qselect, .answer-option',
      { timeout: 12000 }
    ).catch(() => {});
    // Màn hình câu hỏi đầu tiên vừa render → đọc full trang 1 lần.
    await sleep(READ_WAIT);
  }
}

export async function khoiDongLuyenTap(page: Page): Promise<void> {
  const btnRetry = await timElement(page, [
    "xpath=//button[contains(normalize-space(text()),'Luyện tập lại')]",
    "xpath=//a[contains(normalize-space(text()),'Luyện tập lại')]",
  ], 3000);

  if (btnRetry) {
    console.log("  → Màn hình cũ → 'Luyện tập lại'...");
    await jsClick(page, btnRetry);
    const btnCo = await timElement(page, [
      "xpath=//button[normalize-space(text())='Có']",
      "xpath=//button[contains(normalize-space(text()),'Có')]",
      '.swal2-confirm, .btn-confirm',
    ], 4000);
    if (btnCo) {
      await jsClick(page, btnCo);
    }
    // "Luyện tập lại" render lại toàn bộ giao diện → coi như trang mới.
    await sleep(READ_WAIT);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOOP LÀM BÀI CHÍNH
// ═══════════════════════════════════════════════════════════════════════════════

async function loopThiThu(page: Page): Promise<void> {
  let cauSo = 0;
  let vongRong = 0;

  while (cauSo < MAX_CAU) {
    cauSo++;
    console.log(`\n--- Câu ${cauSo} ---`);

    if (await isHoanThanh(page)) {
      console.log('🎉 Toast hoàn thành → dừng!');
      break;
    }

    const clicked =
      (await xuLyDungSai(page, cauSo))   ||
      (await xuLyDropdown(page, cauSo))  ||
      (await xuLyKeoTha(page, cauSo))    ||
      (await xuLyNoi(page, cauSo))       ||
      (await xuLyTracNghiem(page, cauSo)) ||
      (await xuLyTuLuan(page, cauSo));

    if (!clicked) {
      console.log('   ⚠ Không nhận diện được đáp án');
      vongRong++;
      if (vongRong >= MAX_VONG_RONG) { console.log('   ❌ Quá nhiều vòng rỗng → dừng'); break; }
      cauSo--;
      await sleep(ANSWER_WAIT);
      continue;
    }
    vongRong = 0;

    if (await isHoanThanh(page)) { console.log('🎉 Toast hoàn thành → dừng!'); break; }

    const ket = await chuyenCauThiThu(page, cauSo);
    if (ket === 'xong') { console.log('   → Hết bài'); break; }
  }

  await nopBaiThiThu(page);
}

/**
 * Loop luyện tập.
 * Thứ tự xử lý: DungSai → Dropdown → KeoTha → TuLuan → TracNghiem
 */
/**
 * Loop luyện tập — giới hạn số câu (dùng regression test, không chạy hết bài).
 */
export async function loopLuyenTapPartial(page: Page, maxCau = 3): Promise<void> {
  let cauSo = 0;
  let vongRong = 0;

  while (cauSo < maxCau) {
    if (await isHetLuot(page)) break;
    if (await xuLyTiepTuc(page)) {
      vongRong = 0;
      continue;
    }

    cauSo++;

    const clicked =
      (await xuLyDungSai(page, cauSo)) ||
      (await xuLyDropdown(page, cauSo)) ||
      (await xuLyKeoTha(page, cauSo)) ||
      (await xuLyNoi(page, cauSo)) ||
      (await xuLyTuLuan(page, cauSo)) ||
      (await xuLyTracNghiem(page, cauSo));

    if (clicked) {
      vongRong = 0;
      continue;
    }

    cauSo--;
    vongRong++;
    if (vongRong >= MAX_VONG_RONG) break;
    await sleep(ANSWER_WAIT);
  }
}

async function loopLuyenTap(page: Page): Promise<void> {
  let cauSo = 0;
  let vongRong = 0;

  while (true) {
    if (await isHetLuot(page)) { await nopBaiLuyenTap(page); break; }
    if (await xuLyTiepTuc(page)) { vongRong = 0; continue; }

    cauSo++;

    const clicked =
      (await xuLyDungSai(page, cauSo))    ||
      (await xuLyDropdown(page, cauSo))   ||
      (await xuLyKeoTha(page, cauSo))     ||
      (await xuLyNoi(page, cauSo))        ||
      (await xuLyTuLuan(page, cauSo))     ||
      (await xuLyTracNghiem(page, cauSo));

    if (clicked) { vongRong = 0; continue; }

    cauSo--;
    vongRong++;
    console.log(`   ⚠ Vòng rỗng ${vongRong}/${MAX_VONG_RONG}`);
    if (vongRong >= MAX_VONG_RONG) { console.log('   ❌ Dừng vì quá nhiều vòng rỗng'); break; }
    await sleep(ANSWER_WAIT);
  }

  console.log(`\n✅ Hoàn thành ~${cauSo} câu`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT CHÍNH
// ═══════════════════════════════════════════════════════════════════════════════

export async function lamBaiTaiBaiHoc(page: Page, url: string): Promise<void> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶ Vào bài: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (navErr) {
    console.error(`  ⚠ Không load được trang: ${navErr}`);
    return;
  }

  // Trang vừa load xong — đọc/nhận diện toàn bộ DOM 1 lần duy nhất.
  await sleep(READ_WAIT);
  await dongModal(page);

  const loai = await phatHienLoaiBai(page);
  console.log(`  Loại bài: ${loai}`);

  if (loai === 'thi-thu') {
    await khoiDongThiThu(page);
    await loopThiThu(page);
  } else {
    await khoiDongLuyenTap(page);
    await loopLuyenTap(page);
  }

  console.log(`✓ Xong bài: ${url}`);
}