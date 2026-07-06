import { test, expect, type Page } from '@playwright/test';
import { ACCOUNTS } from '../../../config/testData';
import { BASE_URL } from '../../../config/config';

const HOC_SINH = ACCOUNTS.vip_student;
const BASE = BASE_URL;
const DE_URL_FRAGMENT = '4637226523';
const GIOI_HAN_THOAT_MAC_DINH = 20;
const BIEN_AN_TOAN = 5;
const CHO_NOP_BAI_NHANH_MS = 1_500;
const CHO_NOP_BAI_DAY_DU_MS = 15_000;

function ms(sec: number) { return sec * 1_000; }

async function closePopups(page: Page): Promise<void> {
  const closeSels = ['#later-noti', "button:has-text('Không hiển thị nữa')", "button:has-text('Không hiển lại nữa')", '.modal.show .modal-header .btn-close', '.modal.show .modal-header .close', '.modal.show .btn-close', '.modal.show .close'];
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
      } catch {
        // ignore
      }
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

  for (const sel of ["form:not(.modal *) button[type='submit']", "button:not(.modal *):has-text('Đăng nhập')", "button[type='submit']"]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1_500 })) {
        await btn.click({ force: true });
        break;
      }
    } catch {
      // try next
    }
  }

  await page.waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(ms(1.5));
  await closePopups(page);
  expect(page.url(), 'Đăng nhập thất bại').not.toContain('dangnhap');
}

async function manHinhDangNopBaiXuatHien(page: Page, timeout = 1_500): Promise<boolean> {
  return page.locator("p:has-text('Bài thi của bạn đang được nộp')").first().isVisible({ timeout }).catch(() => false);
}

async function bangKetQuaDaHienThi(page: Page, timeout = 800): Promise<boolean> {
  return page.locator('#exam-score-card-header').first().isVisible({ timeout }).catch(() => false);
}

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

test.describe('Kiểm tra giới hạn thoát fullscreen — tự động nộp bài', () => {
  test.setTimeout(6 * 60_000);

  test('Thoát fullscreen vượt giới hạn → hệ thống tự động nộp bài', async ({ page }) => {
    await test.step('[HS] Đăng nhập', async () => {
      await login(page, HOC_SINH.username, HOC_SINH.password);
    });

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
    });

    let gioiHanThoatThucTe = GIOI_HAN_THOAT_MAC_DINH;
    await test.step('[Kiểm tra] Nội quy hiển thị đúng giới hạn số lần thoát đã cấu hình', async () => {
      const noiQuyGioiHan = page.locator('div').filter({ hasText: /Nếu thoát\s*\d+\s*lần/ }).filter({ hasText: 'bài thi sẽ tự động nộp' }).first();
      await noiQuyGioiHan.waitFor({ state: 'visible', timeout: 10_000 });
      const noiQuyText = (await noiQuyGioiHan.innerText().catch(() => '')) || '';
      const match = noiQuyText.match(/Nếu thoát\s*(\d+)\s*lần/);
      const soDocDuoc = match ? Number(match[1]) : null;
      expect(soDocDuoc, `Không đọc được số lần giới hạn thoát từ nội quy bài thi. Text đọc được: "${noiQuyText.slice(0, 150)}"`).not.toBeNull();
      if (soDocDuoc !== null) gioiHanThoatThucTe = soDocDuoc;
    });

    await test.step('[HS] Bắt đầu làm bài', async () => {
      const btnBatDau = page.locator(["button:has-text('Bắt đầu làm bài')", '.btn-start-exam', "button[class*='btn']:has-text('Bắt đầu')"].join(', ')).first();
      await btnBatDau.waitFor({ state: 'visible', timeout: 10_000 });
      await btnBatDau.click({ force: true });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);

      const vaoBai = await page.locator('td.tf-box, span.qiradio, span.qimage, div.qselect, .list-question-container').first().isVisible({ timeout: 10_000 }).catch(() => false);
      expect(vaoBai, 'Không vào được màn hình làm bài').toBe(true);
    });

    const toggleFullscreenBtn = page.locator('span[style*="arrows-expand"]').first();
    const tiepTucBtn = page.locator("button:has-text('Tiếp tục làm bài')").first();
    const modalAnchor = page.locator('div:has-text("Nếu quá số lần thoát bài, bài thi sẽ tự động nộp.")').first();

    let soLanConLaiTruoc: number | null = null;
    let daTuDongNop = false;
    const soLanLapToiDa = gioiHanThoatThucTe + BIEN_AN_TOAN;

    for (let lan = 1; lan <= soLanLapToiDa && !daTuDongNop; lan++) {
      await test.step(`[HS] Thoát fullscreen lần ${lan}`, async () => {
        await toggleFullscreenBtn.waitFor({ state: 'visible', timeout: 8_000 });
        await toggleFullscreenBtn.click({ force: true });
        await page.waitForTimeout(ms(0.8));

        if (await choTuDongNopBai(page, CHO_NOP_BAI_NHANH_MS)) {
          daTuDongNop = true;
          return;
        }

        const toastCanhBao = page.locator('div:has-text("Cảnh báo: Bạn đã thoát chế độ toàn màn hình. Số lần vi phạm:")').first();
        if (await toastCanhBao.isVisible({ timeout: 2_000 }).catch(() => false)) {
          const nutDongToast = toastCanhBao.getByText('X', { exact: true }).first();
          if (await nutDongToast.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await nutDongToast.click({ force: true }).catch(() => {});
          }
        }

        const modalVisible = await modalAnchor.isVisible({ timeout: 5_000 }).catch(() => false);
        if (!modalVisible) {
          if (await choTuDongNopBai(page, CHO_NOP_BAI_DAY_DU_MS)) {
            daTuDongNop = true;
            return;
          }
          expect(modalVisible, `Không thấy modal cảnh báo thoát bài thi ở lần ${lan}, và cũng không thấy màn hình đang nộp bài sau khi chờ`).toBe(true);
          return;
        }

        const modalContainer = page.locator('div').filter({ has: modalAnchor }).first();
        const fullText = (await modalContainer.innerText().catch(() => '')) || '';
        const match = fullText.match(/Bạn còn\s*(\d+)\s*lần\s*thoát bài thi/);
        const soLanConLai = match ? Number(match[1]) : null;
        if (soLanConLaiTruoc !== null && soLanConLai !== null) {
          expect(soLanConLaiTruoc - soLanConLai).toBe(1);
        }
        soLanConLaiTruoc = soLanConLai;

        await tiepTucBtn.waitFor({ state: 'visible', timeout: 5_000 });
        await tiepTucBtn.click({ force: true });
        await page.waitForTimeout(ms(0.8));
      });
    }

    expect(daTuDongNop, `Đã lặp tối đa ${soLanLapToiDa} lần thoát fullscreen mà hệ thống vẫn chưa tự động nộp bài`).toBe(true);

    await test.step('[HS] Xác nhận màn hình đang nộp bài tự động', async () => {
      const daNopThanhCong = await choTuDongNopBai(page, CHO_NOP_BAI_DAY_DU_MS);
      expect(daNopThanhCong, 'Không thấy màn hình "Đang nộp bài" lẫn bảng kết quả sau khi vượt giới hạn thoát fullscreen.').toBe(true);
    });

    await test.step('[HS] Xác nhận bảng kết quả hiển thị', async () => {
      const ketQuaHeader = page.locator('#exam-score-card-header').first();
      await ketQuaHeader.waitFor({ state: 'visible', timeout: 20_000 });
      await expect(ketQuaHeader).toBeVisible();
    });
  });
});