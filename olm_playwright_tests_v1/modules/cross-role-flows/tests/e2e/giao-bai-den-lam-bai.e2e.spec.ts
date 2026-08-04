import { test, expect, type Page } from '@playwright/test';
import { ACCOUNTS } from '../../../../config/testData';
import { lamBaiTaiBaiHoc } from '@core/automation/lamBaiEngine';
import { BASE_URL } from '../../../../config/config';

const GIAO_VIEN = ACCOUNTS.school;
const HOC_SINH = ACCOUNTS.vip_student;
const BASE = BASE_URL;
const THI_THU_URL = `${BASE}/bg/thi-thu-tot-nghiep-trung-hoc-pho-thong`;
const TEN_DE = 'Đề thi thử tốt nghiệp THPT lần 2 môn Vật lí';
const DE_URL_FRAGMENT = '4637226523';

function ms(sec: number) { return sec * 1_000; }

async function closePopups(page: Page): Promise<void> {
  const closeSels = [
    '#later-noti',
    "button:has-text('Không hiển thị nữa')",
    "button:has-text('Không hiển lại nữa')",
    '.modal.show .modal-header .btn-close',
    '.modal.show .modal-header .close',
    '.modal.show .modal-header button[aria-label="Close"]',
    '.modal.show .btn-close',
    '.modal.show .close',
    '.modal.show button[aria-label="Close"]',
    '.popup-close-button',
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

  const subSels = [
    "form:not(.modal *) button[type='submit']",
    "button:not(.modal *):has-text('Đăng nhập')",
    "xpath=//button[contains(text(),'Đăng nhập') and not(ancestor::*[contains(@class,'modal')])]",
    "button[type='submit']",
  ];
  for (const sel of subSels) {
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

async function logout(page: Page): Promise<void> {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(ms(1));
  await closePopups(page);

  const avatarSels = [
    'img[data-slot="avatar-image"]',
    'img[alt="Avatar"]',
    'button:has(img[src*="avatar"])',
    '.tw-rounded-full.tw-overflow-hidden',
    'header a[href*="tai-khoan"]',
  ];
  let avatarClicked = false;
  for (const sel of avatarSels) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1_500 })) {
        await el.click({ force: true });
        avatarClicked = true;
        break;
      }
    } catch {
      // try next
    }
  }
  if (!avatarClicked) {
    await page.mouse.click(1020, 30);
  }

  await page.waitForTimeout(ms(0.6));

  const dangXuatSels = [
    "a:has-text('Đăng xuất')",
    "button:has-text('Đăng xuất')",
    "li:has-text('Đăng xuất') a",
  ];
  for (const sel of dangXuatSels) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btn.click({ force: true });
      break;
    }
  }

  await page.waitForTimeout(ms(2));
}

test.describe('Giao bài và làm bài — Vật lí THPT', () => {
  test.setTimeout(8 * 60_000);

  test('Giáo viên giao đề → Học sinh nhận và bắt đầu làm', async ({ page }) => {
    await test.step('[GV] Đăng nhập', async () => {
      await login(page, GIAO_VIEN.username, GIAO_VIEN.password);
    });

    await test.step('[GV] Vào thẳng trang Thi thử THPT → tìm Vật lí', async () => {
      await page.goto(THI_THU_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(ms(1));
      await closePopups(page);

      const vatLiLink = page.locator('a', { hasText: /Vật\s*[Ll]í/ }).first();
      for (let i = 0; i < 8; i++) {
        if (await vatLiLink.isVisible({ timeout: 600 }).catch(() => false)) break;
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(300);
      }

      await vatLiLink.waitFor({ state: 'visible', timeout: 10_000 });
      await vatLiLink.scrollIntoViewIfNeeded();
      await vatLiLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
      await page.waitForTimeout(ms(1));
      await closePopups(page);

      const giaoBaiVisible = await page.locator("button:has-text('Giao bài')").first().isVisible({ timeout: 4_000 }).catch(() => false);
      if (giaoBaiVisible) {
        return;
      }

      const deLan2Fallback = page.locator('a', { hasText: /lần\s*2/i }).first();
      await deLan2Fallback.waitFor({ state: 'visible', timeout: 10_000 });
      await deLan2Fallback.scrollIntoViewIfNeeded();
      await deLan2Fallback.click({ force: true });
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);
    });

    await test.step('[GV] Click Giao bài', async () => {
      const giaoBtn = page.locator("button:has-text('Giao bài')").first();
      await giaoBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await giaoBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await giaoBtn.click({ force: true });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);
    });

    await test.step('[GV] Chọn Giao theo lớp', async () => {
      const btn = page.locator("button:has-text('Giao theo lớp'), span:has-text('Giao theo lớp')").first();
      await btn.waitFor({ state: 'visible', timeout: 10_000 });
      await btn.click({ force: true });
      await page.waitForTimeout(ms(1));
    });

    await test.step('[GV] Tick chọn tất cả Khối 12', async () => {
      const khoi12Cb = page.locator('input[type="checkbox"][aria-label*="Khối 12"], input[type="checkbox"][aria-label*="khối 12"]').first();
      await khoi12Cb.waitFor({ state: 'visible', timeout: 10_000 });
      if (!(await khoi12Cb.isChecked())) {
        await khoi12Cb.click({ force: true });
        await page.waitForTimeout(500);
      }
      await expect(khoi12Cb).toBeChecked();
    });

    await test.step('[GV] Click Tiếp tục', async () => {
      const btn = page.locator("button:has-text('Tiếp tục')").first();
      await btn.waitFor({ state: 'visible', timeout: 8_000 });
      await btn.click({ force: true });
      await page.waitForTimeout(ms(1.5));
    });

    await test.step('[GV] Thiết lập form giao bài', async () => {
      const thoiGianInp = page.locator('span.tw-text-sm.tw-font-semibold:has-text("Thời gian làm bài") ~ div input[type="number"][min="0"]').first();
      if (await thoiGianInp.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await thoiGianInp.click({ clickCount: 3 });
        await thoiGianInp.fill('50');
      } else {
        const fallback = page.locator('div.tw-bg-accent-extra-light input[type="number"]').first();
        await fallback.click({ clickCount: 3 });
        await fallback.fill('50');
      }

      const nopSomInp = page.locator('span.tw-text-sm.tw-font-semibold:has-text("Giới hạn nộp sớm sau") ~ div input[type="number"][min="0"]').first();
      if (await nopSomInp.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nopSomInp.click({ clickCount: 3 });
        await nopSomInp.fill('0');
      } else {
        const fallback = page.locator('div.tw-bg-accent-extra-light input[type="number"][min="0"]').nth(1);
        await fallback.click({ clickCount: 3 });
        await fallback.fill('0');
      }

      const moDeCb = page.locator('label.tw-inline-flex:has(span:has-text("Thời điểm mở đề")) input[type="checkbox"]').first();
      if (await moDeCb.isVisible({ timeout: 3_000 }).catch(() => false)) {
        if (await moDeCb.isChecked().catch(() => false)) {
          await moDeCb.click({ force: true });
          await page.waitForTimeout(300);
        }
        await expect(moDeCb).not.toBeChecked();
      }
    });

    await test.step('[GV] Bỏ tick Lên lịch giao bài & Đặt hạn làm bài', async () => {
      const lenLichCb = page.locator('label:has-text("Lên lịch giao bài") input[type="checkbox"]').first();
      if (await lenLichCb.isVisible({ timeout: 4_000 }).catch(() => false)) {
        if (await lenLichCb.isChecked().catch(() => false)) {
          await lenLichCb.click({ force: true });
          await page.waitForTimeout(300);
        }
        await expect(lenLichCb).not.toBeChecked();
      }

      const datHanCb = page.locator('label:has-text("Đặt hạn làm bài") input[type="checkbox"]').first();
      if (await datHanCb.isVisible({ timeout: 4_000 }).catch(() => false)) {
        if (await datHanCb.isChecked().catch(() => false)) {
          await datHanCb.click({ force: true });
          await page.waitForTimeout(300);
        }
        await expect(datHanCb).not.toBeChecked();
      }
    });

    await test.step('[GV] Thiết lập nâng cao: 100 lần làm + thu bài 20 lần thoát', async () => {
      const chophepCb = page.locator('label:has-text("Cho phép làm lại") input[type="checkbox"]').first();
      await chophepCb.waitFor({ state: 'visible', timeout: 8_000 });
      if (!(await chophepCb.isChecked().catch(() => false))) {
        await chophepCb.click({ force: true });
        await page.waitForTimeout(400);
      }
      await expect(chophepCb).toBeChecked();

      const lanInp = page.locator('div:has-text("Giới hạn số lần làm bài") input[type="number"]').first();
      await lanInp.waitFor({ state: 'visible', timeout: 5_000 });
      await lanInp.click({ clickCount: 3 });
      await lanInp.fill('100');

      const thuBaiSelect = page.locator('div:has-text("Thu bài ngay sau khi học sinh ra khỏi bài thi") select').first();
      await thuBaiSelect.waitFor({ state: 'visible', timeout: 5_000 });
      await thuBaiSelect.scrollIntoViewIfNeeded();
      await thuBaiSelect.selectOption('20');
      await page.waitForTimeout(500);
    });

    await test.step('[GV] Áp dụng cho các lớp khác', async () => {
      const apDungBtn = page.locator("button:has-text('Áp dụng cho các lớp khác')").first();
      await apDungBtn.waitFor({ state: 'visible', timeout: 8_000 });
      await apDungBtn.scrollIntoViewIfNeeded();
      await apDungBtn.click({ force: true });
      await page.waitForTimeout(ms(1));
    });

    await test.step('[GV] Click Hoàn thành giao bài', async () => {
      const hoanThanhBtn = page.locator("button:has-text('Hoàn thành giao bài')").first();
      await hoanThanhBtn.waitFor({ state: 'visible', timeout: 8_000 });
      await hoanThanhBtn.click({ force: true });
      await page.waitForTimeout(ms(2.5));
    });

    await test.step('[GV] Đăng xuất', async () => {
      await logout(page);
    });

    await test.step('[HS] Đăng nhập', async () => {
      await login(page, HOC_SINH.username, HOC_SINH.password);
    });

    let baiHocUrl = '';
    await test.step('[HS] Tìm và click bài Vật lí trong danh sách bài tập', async () => {
      await page.goto(`${BASE}/lop-hoc-cua-toi`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);

      const baiLink = page.locator(`a[href*='${DE_URL_FRAGMENT}']`).first();
      for (let i = 0; i < 8; i++) {
        if (await baiLink.isVisible({ timeout: 600 }).catch(() => false)) break;
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(400);
      }

      await expect(baiLink, `Không tìm thấy link bài "${TEN_DE}" trong trang học sinh`).toBeVisible({ timeout: 8_000 });

      const href = (await baiLink.getAttribute('href')) ?? '';
      baiHocUrl = href.startsWith('http') ? href : `${BASE}${href}`;

      await baiLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);
    });

    await test.step('[HS] Làm bài đến hết qua lamBaiEngine', async () => {
      await lamBaiTaiBaiHoc(page, baiHocUrl);
    });
  });
});