/** Script tự động thi thử THPT Sinh học OLM.vn - ĐÃ FIX v4 */
import { chromium } from 'playwright';
import { BASE_URL, LOGIN_URL } from '../config/config';
import { PASSWORD, USERNAME } from '../config/testData';
import { humanDelay } from '../utils/helpers';

const LOP12_URL = `${BASE_URL}/lop-12`;
const TIMEOUT = 30_000;
const MAX_CAU = 50;

/**
 * Index nút cần chọn cho từng ý a/b/c/d trong câu Đúng/Sai.
 * 0 = Đúng, 1 = Sai.
 */
const DS_INDEX_MAP: number[] = [0, 1, 0, 1]; // [a, b, c, d]

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

const MODAL_ACTIVE_MAIL_ID = '#modal-form-active-mail';
const XACTHUC_OVERLAY_SELECTOR = '.modal.show[role="dialog"]';

async function dismissAndWaitXacThuc(page: import('playwright').Page): Promise<void> {
  let modalVisible = false;
  try {
    modalVisible = await page.locator(XACTHUC_OVERLAY_SELECTOR).isVisible({ timeout: 1500 });
  } catch {
    return;
  }
  if (!modalVisible) return;

  console.log('⚠ Phát hiện modal đang chặn trang → đang đóng...');

  try {
    const btnKhongHienThi = page.locator(
      "button:has-text('Không hiển lại nữa'), button:has-text('Không hiển thị nữa')"
    );
    if (await btnKhongHienThi.isVisible({ timeout: 1000 })) {
      await btnKhongHienThi.click();
      console.log('✓ Đã click "Không hiển thị nữa"');
      await waitModalGone(page);
      return;
    }
  } catch { /* tiếp tục */ }

  try {
    const btnClose = page.locator(
      `${MODAL_ACTIVE_MAIL_ID} .close, ` +
      `${MODAL_ACTIVE_MAIL_ID} button[aria-label='Close'], ` +
      `${MODAL_ACTIVE_MAIL_ID} button.close, ` +
      '.modal.show .modal-header .close, ' +
      '.modal.show button[aria-label="Close"], ' +
      '.modal.show button.close, ' +
      '.popup-close-button'
    );
    if (await btnClose.isVisible({ timeout: 1500 })) {
      await btnClose.first().click();
      console.log('✓ Đã click nút đóng (X)');
      await waitModalGone(page);
      return;
    }
  } catch { /* tiếp tục */ }

  try {
    await page.keyboard.press('Escape');
    console.log('✓ Đã nhấn Escape để đóng modal');
    await waitModalGone(page);
    return;
  } catch { /* tiếp tục */ }

  try {
    await page.mouse.click(10, 10);
    console.log('✓ Đã click ngoài modal');
    await waitModalGone(page);
  } catch { /* bỏ qua */ }
}

async function waitModalGone(page: import('playwright').Page): Promise<void> {
  try {
    await page.locator(XACTHUC_OVERLAY_SELECTOR).waitFor({ state: 'hidden', timeout: 8000 });
    await sleep(0.6);
    console.log('✓ Modal đã đóng hoàn toàn');
  } catch {
    await sleep(2);
    console.log('✓ Đã chờ đủ thời gian sau khi đóng modal');
  }
}

async function isHoanThanhHetCau(page: import('playwright').Page): Promise<boolean> {
  try {
    const toast = page.locator(
      "[class*='tw-bg-accent-extra-light']:has-text('hoàn thành hết câu hỏi'), " +
      "[class*='tw-border-accent-default']:has-text('hoàn thành hết câu hỏi'), " +
      "div.tw-font-semibold:has-text('Bạn đã hoàn thành hết câu hỏi')"
    );
    return await toast.isVisible({ timeout: 800 });
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const headless = process.env.HEADLESS === 'true';
  console.log(`Chế độ: ${headless ? 'headless' : 'headed'} | Tài khoản: ${USERNAME}`);
  const browser = await chromium.launch({
    headless,
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
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });
    await sleep(humanDelay());

    await page.fill("input[type='text'], input[name='username']", USERNAME);
    await sleep(humanDelay(0.5, 1.2));
    await page.fill("input[type='password']", PASSWORD);
    await sleep(humanDelay());

    await page.click("button[type='submit'], button:has-text('Đăng nhập')");
    await sleep(humanDelay(4, 7));
    console.log('✓ Đăng nhập thành công');

    await dismissAndWaitXacThuc(page);

    console.log('[2] Vào Lớp 12...');
    await page.goto(LOP12_URL, { waitUntil: 'networkidle' });
    await sleep(humanDelay(2, 4));

    await dismissAndWaitXacThuc(page);

    await page.click("a:has-text('Thi thử Tốt nghiệp'), a:has-text('Thi thử')");
    await sleep(humanDelay(2, 4));

    console.log('[3] Vào Thi thử lần 1 - Sinh học...');
    await page.waitForSelector("xpath=//*[contains(text(),'lần 1')]", { timeout: TIMEOUT });

    await dismissAndWaitXacThuc(page);

    await page.click(
      "xpath=//*[contains(text(),'lần 1')]/following::a[contains(text(),'Sinh học')][1]"
    );
    await sleep(humanDelay(3, 5));

    console.log('[4] Bắt đầu làm bài...');
    await dismissAndWaitXacThuc(page);
    await page.click("button:has-text('Bắt đầu làm bài'), .btn-start-exam");
    await sleep(humanDelay(3, 6));

    console.log('\n[5] BẮT ĐẦU LÀM BÀI...');
    let cauSo = 0;

    async function getCurrentCauIndex(): Promise<string | null> {
      try {
        const activeNum = page.locator(
          '.list-question-container div.tw-text-accent-default'
        ).first();
        if (await activeNum.isVisible({ timeout: 500 })) {
          const txt = (await activeNum.innerText()).trim();
          if (txt && /^\d+$/.test(txt)) return txt;
        }
      } catch { /* ignore */ }
      return null;
    }

    async function getTotalCau(): Promise<number> {
      try {
        const items = page.locator('.list-question-container div.tw-font-nunito.tw-font-black');
        return await items.count();
      } catch { /* ignore */ }
      return 0;
    }

    while (cauSo < MAX_CAU) {
      cauSo++;
      await sleep(humanDelay(1.0, 2.0));
      console.log(`\n--- Câu ${cauSo} ---`);

      let clicked = false;

      if (await isHoanThanhHetCau(page)) {
        console.log('\n🎉 [TRƯỚC KHI LÀM] Toast "hoàn thành hết câu hỏi" → Dừng!');
        break;
      }

      // ── Loại 1: Đúng/Sai — CHECK TRƯỚC trắc nghiệm ──────────────────────
      // QUAN TRỌNG: phải check Đúng/Sai trước vì span.qiradio xuất hiện trong
      // cả hai loại câu. Nếu check trắc nghiệm trước, nút Đ/S bị nhầm thành ABCD.
      //
      // Cấu trúc: mỗi ý (a,b,c,d) = 1 td.tf-box, bên trong có:
      //   <span data-tf-value="1" class="qiradio">Đ</span>
      //   <span data-tf-value="0" class="qiradio">S</span>
      if (!clicked) {
        try {
          // Chờ page render nội dung câu
          await page.waitForSelector('td.tf-box', { timeout: 3000 }).catch(() => {});

          const tfBoxes = page.locator('td.tf-box');
          const boxCount = await tfBoxes.count();

          if (boxCount > 0) {
            const visibleBoxes: number[] = [];
            for (let i = 0; i < boxCount; i++) {
              if (await tfBoxes.nth(i).isVisible()) visibleBoxes.push(i);
            }

            if (visibleBoxes.length > 0) {
              console.log(`  Câu ${cauSo}: [ĐÚNG/SAI] Phát hiện ${visibleBoxes.length} ý`);

              for (let gi = 0; gi < visibleBoxes.length; gi++) {
                const box = tfBoxes.nth(visibleBoxes[gi]);
                const wantDung = (DS_INDEX_MAP[gi] ?? DS_INDEX_MAP[DS_INDEX_MAP.length - 1]) === 0;
                const wantedValue = wantDung ? '1' : '0';
                const label = wantDung ? 'Đúng' : 'Sai';

                const target = box.locator(`span[data-tf-value="${wantedValue}"]`);
                if (await target.isVisible({ timeout: 2000 })) {
                  await humanMouseMove(page);
                  await target.click();
                  console.log(`     Ý ${String.fromCharCode(97 + gi)}: click [${label}]`);
                } else {
                  console.log(`     Ý ${String.fromCharCode(97 + gi)}: ⚠ không thấy [${label}]`);
                }
                await sleep(humanDelay(1.0, 1.8));
              }
              clicked = true;
            }
          }
        } catch {
          // ignore - không phải câu Đúng/Sai
        }
      }

      // ── Loại 2: Trắc nghiệm thông thường ──────────────────────────────────
      // Loại trừ span[data-tf-value] để không nhầm nút Đ/S
      if (!clicked) {
        try {
          const answers = page.locator(
            "span.qimage:not([data-tf-value]), div.qselect, .answer-option, " +
            "span.qiradio:not([data-tf-value])"
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
      }

      // ── Loại 3: Tự luận ───────────────────────────────────────────────────
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
            console.log(`  Câu ${cauSo}: [TỰ LUẬN] Tìm thấy ${visibleInputs.length} ô nhập`);
            for (const inp of visibleInputs) {
              await inp.click();
              await sleep(humanDelay(0.2, 0.4));
              await inp.fill('');
              await inp.type('1', { delay: 80 });
              await inp.blur();
              await sleep(humanDelay(0.6, 1.2));
            }
            await sleep(humanDelay(1.5, 2.5));
            clicked = true;
          }
        } catch {
          // ignore
        }
      }

      if (!clicked) console.log('   ⚠ Không nhận diện được đáp án');

      if (await isHoanThanhHetCau(page)) {
        console.log('\n🎉 [SAU TRẢ LỜI] Toast "hoàn thành hết câu hỏi" → Dừng làm bài!');
        break;
      }

      // ── Chuyển câu tiếp hoặc phần tiếp ──────────────────────────────────
      try {
        await page.keyboard.press('Escape');
        await sleep(0.4);

        const indexTruocKhiNext = await getCurrentCauIndex();
        const totalCauTruoc = await getTotalCau();

        const nextCauBtn = page.locator("button.btn-next-question, button:has-text('Câu tiếp')");
        const nextPhanBtn = page.locator(
          "button:has-text('Phần tiếp'), " +
          "a:has-text('Phần tiếp'), " +
          ".list-question-container button:has(span:has-text('Phần tiếp')), " +
          "button[class*='tw-']:has-text('Phần tiếp')"
        );

        const coNutCauTiep  = await nextCauBtn.isVisible({ timeout: 1000 }).catch(() => false);
        const coNutPhanTiep = await nextPhanBtn.isVisible({ timeout: 1000 }).catch(() => false);

        if (coNutCauTiep) {
          await nextCauBtn.click();
          await sleep(1.0);

          if (await isHoanThanhHetCau(page)) {
            console.log('\n🎉 [SAU NEXT CÂU] Toast hoàn thành → Dừng làm bài!');
            break;
          }

          const indexSauNext = await getCurrentCauIndex();
          const totalCauSau  = await getTotalCau();
          console.log(
            `   → Câu: ${indexTruocKhiNext} → ${indexSauNext} | Tổng: ${totalCauTruoc} → ${totalCauSau}`
          );

          if (
            indexTruocKhiNext !== null &&
            indexSauNext !== null &&
            indexTruocKhiNext === indexSauNext
          ) {
            const coNutPhanTiepSau = await nextPhanBtn.isVisible({ timeout: 1500 }).catch(() => false);
            if (coNutPhanTiepSau) {
              console.log('   → Câu cuối phần, còn Phần tiếp → chuyển phần...');
              await nextPhanBtn.click();
              await sleep(humanDelay(2, 3));
              console.log('   ✓ Đã chuyển sang phần mới');
            } else {
              console.log('\n🎉 [INDEX KHÔNG ĐỔI + HẾT PHẦN] Đã làm hết toàn bộ!');
              break;
            }
          }

          await sleep(humanDelay(0.5, 1.2));

        } else if (coNutPhanTiep) {
          console.log('   → Hết câu phần này → click Phần tiếp...');
          await nextPhanBtn.click();
          await sleep(humanDelay(2, 3));
          console.log('   ✓ Đã chuyển sang phần mới');

        } else {
          console.log('   → Không còn Câu tiếp lẫn Phần tiếp → Kết thúc toàn bộ!');
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
      console.log('  → Đã click Nộp bài lần 1');
      await sleep(humanDelay(2, 3));

      const popupNopBai = page.locator(
        "#btn-confirm-dialog-confirm, " +
        ".popup-primary-button"
      );

      if (await popupNopBai.isVisible({ timeout: 4000 })) {
        console.log('  → Popup xác nhận xuất hiện → Đang xác nhận nộp bài...');
        await popupNopBai.click();
        await sleep(humanDelay(2, 3));
        console.log('✅ ĐÃ XÁC NHẬN NỘP BÀI!');
      } else {
        console.log('✅ ĐÃ NỘP BÀI! (không có popup xác nhận)');
      }
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