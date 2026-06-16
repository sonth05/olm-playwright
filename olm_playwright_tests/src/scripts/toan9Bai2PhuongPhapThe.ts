/** Script tự động làm bài luyện tập Toán 9 - Phương pháp thế */
import { chromium, type Locator, type Page } from 'playwright';
import { PASSWORD, USERNAME } from '../config/testData';

const LUYEN_TAP_URL =
  'https://olm.vn/chu-de/giai-he-hai-phuong-trinh-bang-phuong-phap-the-2377747568';
const TIMEOUT = 15_000;
const PAGE_WAIT = 2;

async function sleep(sec: number): Promise<void> {
  await new Promise((r) => setTimeout(r, sec * 1000));
}

async function jsClick(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await sleep(0.3);
  await locator.click({ force: true });
}

async function timElement(page: Page, selectors: string[], timeout = 5000): Promise<Locator | null> {
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

async function dangNhap(page: Page): Promise<void> {
  console.log('[1] Đăng nhập OLM...');
  await page.goto('https://olm.vn/dangnhap');
  await sleep(PAGE_WAIT);
  await page.waitForSelector("input[type='password']", { timeout: TIMEOUT });

  for (const sel of ['input[name="username"]', "input[type='text']"]) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) {
      await el.fill(USERNAME);
      break;
    }
  }

  await page.locator("input[type='password']").fill(PASSWORD);

  const btn = await timElement(page, [
    "button[type='submit']",
    "xpath=//button[contains(text(),'Đăng nhập')]",
  ]);
  if (!btn) throw new Error('Không tìm thấy nút Đăng nhập!');
  await jsClick(page, btn);

  await sleep(4);
  if (page.url().includes('dangnhap')) throw new Error('Đăng nhập thất bại!');
  console.log('✓ Đăng nhập thành công');
}

async function vaoTrangVaBatDau(page: Page): Promise<void> {
  console.log('[2] Vào trang luyện tập...');
  await page.goto(LUYEN_TAP_URL);
  await sleep(PAGE_WAIT + 1);

  const btnRetry = await timElement(
    page,
    [
      "xpath=//button[contains(normalize-space(text()),'Luyện tập lại')]",
      "xpath=//a[contains(normalize-space(text()),'Luyện tập lại')]",
    ],
    5000
  );

  if (btnRetry) {
    console.log("   → Thấy màn hình kết quả cũ, click 'Luyện tập lại'...");
    await jsClick(page, btnRetry);
    await sleep(1.5);

    const btnCo = await timElement(
      page,
      [
        "xpath=//button[normalize-space(text())='Có']",
        "xpath=//button[contains(normalize-space(text()),'Có')]",
        '.swal2-confirm, .btn-confirm',
      ],
      6000
    );

    if (btnCo) {
      const text = ((await btnCo.textContent()) ?? '').trim();
      console.log(`   → Click xác nhận '${text}'`);
      await jsClick(page, btnCo);
      await sleep(2);
    }
    console.log('✓ Đã bắt đầu phiên luyện tập mới');
  } else {
    console.log('   → Vào thẳng bài mới');
  }

  await sleep(1);
}

async function kiemTraHetLuot(page: Page): Promise<boolean> {
  return (await page.locator("xpath=//*[contains(text(),'làm hết một lượt')]").count()) > 0;
}

async function nopBaiCuoi(page: Page): Promise<boolean> {
  console.log("\n[KẾT THÚC] Phát hiện 'Bạn đã làm hết một lượt' → Nộp bài...");
  const btn = await timElement(
    page,
    [
      'button.btn-save',
      "xpath=//button[contains(@class,'btn-save')]",
      "xpath=//button[normalize-space(text())='Nộp bài']",
      "xpath=//button[contains(normalize-space(text()),'Nộp bài')]",
    ],
    8000
  );

  if (btn) {
    console.log(`   → Click '${((await btn.textContent()) ?? '').trim()}'`);
    await jsClick(page, btn);
    await sleep(3);
    console.log('✅ ĐÃ NỘP BÀI THÀNH CÔNG!');
    return true;
  }
  console.log('⚠ Không tìm thấy nút Nộp bài cuối!');
  return false;
}

async function xuLyTiepTucLamBai(page: Page): Promise<boolean> {
  const btn = await timElement(
    page,
    [
      "button.olm-btn-primary[onclick*='nextQuestion']",
      "xpath=//button[contains(@onclick,'nextQuestion')]",
      "xpath=//button[contains(normalize-space(text()),'Tiếp tục làm bài')]",
    ],
    3000
  );

  if (btn) {
    console.log("   → Câu sai, click 'Tiếp tục làm bài'");
    await jsClick(page, btn);
    await sleep(1.2);
    return true;
  }
  return false;
}

async function xuLyCauTuLuan(page: Page, cauSo: number): Promise<boolean> {
  const inputs = page.locator(
    "span.trigger-curriculum-cate input[type='text'], div.fill-me input[type='text'], div#quizz input[type='text']"
  );
  const count = await inputs.count();
  const active: Locator[] = [];

  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    if (await inp.isVisible()) {
      const disabled = await inp.getAttribute('disabled');
      if (!disabled) active.push(inp);
    }
  }

  if (active.length === 0) return false;

  console.log(`  Câu ${cauSo}: [TỰ LUẬN] Tìm thấy ${active.length} ô nhập → gõ '1'`);
  for (const inp of active) {
    try {
      await inp.scrollIntoViewIfNeeded();
      await sleep(0.2);
      await inp.fill('1');
      await sleep(0.3);
    } catch (e) {
      console.log(`     ⚠ Lỗi gõ input: ${e}`);
    }
  }

  const btnDone = await timElement(
    page,
    [
      'button.btn-done',
      "xpath=//button[@title='Làm xong và nộp bài']",
      "xpath=//button[contains(@class,'btn-done')]",
    ],
    5000
  );

  if (btnDone) {
    await jsClick(page, btnDone);
    console.log(`  Câu ${cauSo}: ✓ Đã nộp câu tự luận`);
    await sleep(1.5);
    return true;
  }

  console.log(`  Câu ${cauSo}: ⚠ Không tìm thấy btn-done sau khi gõ tự luận`);
  return false;
}

async function xuLyCauTracNghiem(page: Page, cauSo: number): Promise<boolean> {
  for (const sel of [
    "input[type='radio']",
    'div.qselect',
    'span.qiradio',
    "label[for*='option']",
    "div[role='radio']",
  ]) {
    const els = page.locator(sel);
    const count = await els.count();
    const visible: Locator[] = [];
    for (let i = 0; i < count; i++) {
      const e = els.nth(i);
      if (await e.isVisible()) visible.push(e);
    }

    if (visible.length >= 2) {
      const choice = visible[Math.floor(Math.random() * visible.length)];
      await jsClick(page, choice);
      await sleep(0.5);
      console.log(`  Câu ${cauSo}: [TRẮC NGHIỆM] Đã chọn (CSS: ${sel})`);

      const btnDone = await timElement(
        page,
        [
          'button.btn-done',
          "xpath=//button[@title='Làm xong và nộp bài']",
          "xpath=//button[contains(@class,'btn-done')]",
        ],
        5000
      );

      if (btnDone) {
        await jsClick(page, btnDone);
        await sleep(1.2);
        console.log(`  Câu ${cauSo}: ✓ Đã nộp câu trắc nghiệm`);
      } else {
        console.log(`  Câu ${cauSo}: ⚠ Không tìm thấy btn-done`);
      }
      return true;
    }
  }
  return false;
}

async function lamBaiToanBo(page: Page): Promise<void> {
  console.log('\n[3] BẮT ĐẦU LÀM BÀI TỰ ĐỘNG...');
  let cauSo = 0;
  let vongLapRong = 0;

  while (true) {
    await sleep(0.8);

    if (await kiemTraHetLuot(page)) {
      await nopBaiCuoi(page);
      break;
    }

    if (await xuLyTiepTucLamBai(page)) {
      vongLapRong = 0;
      continue;
    }

    cauSo++;
    if (await xuLyCauTuLuan(page, cauSo)) {
      vongLapRong = 0;
      continue;
    }

    if (await xuLyCauTracNghiem(page, cauSo)) {
      vongLapRong = 0;
      continue;
    }

    cauSo--;
    vongLapRong++;
    console.log(`   ⚠ Vòng lặp ${vongLapRong}: không tìm thấy câu hỏi, chờ thêm...`);

    if (vongLapRong >= 8) {
      console.log('   ❌ Quá nhiều vòng lặp rỗng, dừng lại!');
      break;
    }

    await sleep(1.0);
  }

  console.log(`\n✅ HOÀN THÀNH! Đã xử lý ~${cauSo} câu.`);
}

async function main(): Promise<void> {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  try {
    await dangNhap(page);
    await vaoTrangVaBatDau(page);
    await lamBaiToanBo(page);
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('\n[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);
