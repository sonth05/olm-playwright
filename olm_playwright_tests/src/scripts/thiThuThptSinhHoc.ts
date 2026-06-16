/** Script tự động thi thử THPT Sinh học OLM.vn */
import { chromium } from 'playwright';
import { humanDelay } from '../utils/helpers';
import { PASSWORD, USERNAME } from '../config/testData';

const LOP12_URL = 'https://olm.vn/lop-12';
const TIMEOUT = 30_000;
const MAX_CAU = 50;

async function sleep(sec: number): Promise<void> {
  await new Promise((r) => setTimeout(r, sec * 1000));
}

async function humanMouseMove(page: import('playwright').Page): Promise<void> {
  try {
    const x = Math.floor(Math.random() * 800) + 100;
    const y = Math.floor(Math.random() * 600) + 100;
    await page.mouse.move(x, y);
    await sleep(Math.random() * 0.6 + 0.3);
  } catch {
    // ignore
  }
}

async function main(): Promise<void> {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    locale: 'vi-VN',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['vi-VN', 'vi', 'en-US', 'en'],
    });
  });

  const page = await context.newPage();
  console.log('Playwright đã khởi động');

  try {
    console.log('[1] Đăng nhập OLM...');
    await page.goto('https://olm.vn/dangnhap', { waitUntil: 'networkidle' });
    await sleep(humanDelay());

    await page.fill("input[type='text'], input[name='username']", USERNAME);
    await sleep(humanDelay(0.5, 1.2));
    await page.fill("input[type='password']", PASSWORD);
    await sleep(humanDelay());

    await page.click("button[type='submit'], button:has-text('Đăng nhập')");
    await sleep(humanDelay(4, 7));
    console.log('✓ Đăng nhập thành công');

    console.log('[2] Vào Lớp 12...');
    await page.goto(LOP12_URL, { waitUntil: 'networkidle' });
    await sleep(humanDelay(2, 4));
    await page.click("a:has-text('Thi thử Tốt nghiệp'), a:has-text('Thi thử')");
    await sleep(humanDelay(2, 4));

    console.log('[3] Vào Thi thử lần 1 - Sinh học...');
    await page.waitForSelector("xpath=//*[contains(text(),'lần 1')]", { timeout: TIMEOUT });
    await page.click(
      "xpath=//*[contains(text(),'lần 1')]/following::a[contains(text(),'Sinh học')][1]"
    );
    await sleep(humanDelay(3, 5));

    console.log('[4] Bắt đầu làm bài...');
    await page.click("button:has-text('Bắt đầu làm bài'), .btn-start-exam");
    await sleep(humanDelay(3, 6));

    console.log('\n[5] BẮT ĐẦU LÀM BÀI...');
    let cauSo = 0;

    while (cauSo < MAX_CAU) {
      cauSo++;
      await sleep(humanDelay(1.0, 2.2));
      console.log(`\n--- Câu ${cauSo} ---`);

      let clicked = false;

      try {
        const answers = page.locator(
          "span.qimage, span.qiradio, div.qselect, [class*='qimage'], [class*='qiradio'], .answer-option"
        );
        const count = await answers.count();
        const visibleAnswers = [];
        for (let i = 0; i < count; i++) {
          const a = answers.nth(i);
          if (await a.isVisible()) visibleAnswers.push(a);
        }
        if (visibleAnswers.length >= 2) {
          console.log(`  Câu ${cauSo}: [TRẮC NGHIỆM] Tìm thấy ${visibleAnswers.length} đáp án`);
          const choice = visibleAnswers[Math.floor(Math.random() * visibleAnswers.length)];
          await humanMouseMove(page);
          await choice.click();
          clicked = true;
        }
      } catch {
        // ignore
      }

      if (!clicked) {
        try {
          const dsButtons = page.locator('span[data-tf-value]');
          const dsCount = await dsButtons.count();
          const visibleDs = [];
          for (let i = 0; i < dsCount; i++) {
            const b = dsButtons.nth(i);
            if (await b.isVisible()) visibleDs.push(b);
          }
          if (visibleDs.length > 0) {
            console.log(`  Câu ${cauSo}: [ĐÚNG/SAI]`);
            for (const btn of visibleDs) {
              await btn.click();
              await sleep(humanDelay(0.5, 1.2));
            }
            clicked = true;
          }
        } catch {
          // ignore
        }
      }

      if (!clicked) {
        try {
          const inputs = page.locator("input[placeholder='?'], textarea");
          const inCount = await inputs.count();
          const visibleInputs = [];
          for (let i = 0; i < inCount; i++) {
            const inp = inputs.nth(i);
            if (await inp.isVisible()) visibleInputs.push(inp);
          }
          if (visibleInputs.length > 0) {
            console.log(`  Câu ${cauSo}: [TỰ LUẬN]`);
            for (const inp of visibleInputs) await inp.fill('1');
            clicked = true;
          }
        } catch {
          // ignore
        }
      }

      if (!clicked) console.log('   ⚠ Không nhận diện được đáp án');

      try {
        const nextBtn = page.locator("button.btn-next-question, button:has-text('Câu tiếp')");
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await sleep(humanDelay(1.5, 3.0));
        } else {
          console.log('   → Không còn nút Câu tiếp → Kết thúc!');
          break;
        }
      } catch {
        break;
      }
    }

    console.log(`\n✅ HOÀN THÀNH! Đã xử lý ${cauSo} câu.`);

    console.log('[6] Nộp bài...');
    try {
      await page.click("button.btn-submit-cate, button:has-text('Nộp bài')");
      await sleep(humanDelay(2, 4));
      await page.click("button:has-text('Nộp bài'), button:has-text('Xác nhận')");
      console.log('✅ ĐÃ NỘP BÀI!');
    } catch {
      console.log('⚠ Không click được nút Nộp bài');
    }
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(humanDelay(5, 8));
    await browser.close();
    console.log('\n[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);
