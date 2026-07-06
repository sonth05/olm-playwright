/**
 * giao-bai-lam-bai.e2e.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * E2E: Giáo viên giao bài kiểm tra → Học sinh nhận và làm bài
 *
 * Luồng:
 *   1.  Đăng nhập giáo viên
 *   2.  Nhảy thẳng vào trang "Thi thử Tốt nghiệp THPT" → tìm & click "Vật lí"
 *       (tìm theo TEXT, không phụ thuộc href/ID vì đề hay đổi theo đợt)
 *   3.  Click Giao bài trên trang đề
 *   4.  Giao theo lớp → chọn tất cả Khối 12 → Tiếp tục
 *   5.  Thiết lập:
 *         • Thời gian làm bài : 50 phút
 *         • Giới hạn nộp sớm  :  0 phút
 *         • Bỏ tick "Thời điểm mở đề"
 *         • Bỏ tick "Lên lịch giao bài" và "Đặt hạn làm bài"
 *   6.  Thiết lập nâng cao:
 *         • Tick "Cho phép làm lại" → Giới hạn số lần làm bài = 100
 *         • Thu bài ngay sau khi học sinh ra khỏi bài thi = 20 lần
 *   7.  Áp dụng thiết lập cho các lớp khác
 *   8.  Hoàn thành giao bài
 *   9.  Đăng xuất giáo viên
 *   10. Đăng nhập học sinh
 *   11. Tìm bài Vật lí trong trang lớp học → vào → Bắt đầu làm
 *   12. Làm bài đến hết qua lamBaiEngine
 *
 * Chạy:
 *   npx playwright test tests/e2e/Giao-bai-lam-bai.e2e.spec.ts --headed
 *   npm run test:bai-tap          (chạy độc lập, bỏ qua dependency 'chromium')
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect, type Page } from '@playwright/test';
import { ACCOUNTS } from '../../config/testData';
import { lamBaiTaiBaiHoc } from '../../scripts/lamBaiEngine';
import { BASE_URL } from '../../config/config';

// ─── Tài khoản ────────────────────────────────────────────────────────────────
const GIAO_VIEN = ACCOUNTS.school;       // role: school (giáo viên)
const HOC_SINH  = ACCOUNTS.vip_student;  // role: student

const BASE = BASE_URL;

// Nhảy thẳng vào trang "Thi thử Tốt nghiệp THPT" — bỏ qua bước vào /lop-12
// rồi click card, đỡ 1 điểm dễ vỡ khi OLM đổi layout trang /lop-12.
const THI_THU_URL = `${BASE}/bg/thi-thu-tot-nghiep-trung-hoc-pho-thong`;

const TEN_DE = 'Đề thi thử tốt nghiệp THPT lần 2 môn Vật lí';
// Fragment nhận ra link bài tập trong trang học sinh
// href thực tế: https://olm.vn/chu-de/100-4637226523?i_c=118679210598
// LƯU Ý: fragment này (ID đề) có thể đổi theo từng đợt cập nhật đề của OLM.
// Nếu bước [HS] Tìm và click bài Vật lí báo không tìm thấy, kiểm tra lại
// ID thực tế trên trang bằng cách F12 sau khi giáo viên giao bài xong.
const DE_URL_FRAGMENT = '4637226523';

// ─── Utilities ───────────────────────────────────────────────────────────────

function ms(sec: number) { return sec * 1_000; }

/**
 * Đóng tất cả popup / modal OLM hay gặp.
 * Loop tối đa 5 lần để xử lý modal chồng nhau.
 */
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
      } catch { /* ignore */ }
    }
    if (!dismissed) break;
  }

  try { await page.keyboard.press('Escape'); } catch { /* ignore */ }
  await page.waitForTimeout(200);
}

/**
 * Đăng nhập OLM.
 */
async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto(`${BASE}/dangnhap`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(ms(1));
  await closePopups(page);

  // Username
  const userSels = ["input[name='username']", '#username', "input[type='text']"];
  for (const sel of userSels) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) { await el.fill(username); break; }
  }

  // Password
  await page.locator("input[type='password']").first().fill(password);

  // Submit — loại trừ nút bên trong .modal để không nhầm "Gửi yêu cầu"
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
    } catch { /* try next */ }
  }

  // Đợi redirect TRƯỚC, sau đó mới dismiss popup xuất hiện sau login
  await page
    .waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 15_000 })
    .catch(() => {});

  await page.waitForTimeout(ms(1.5));
  await closePopups(page);

  expect(page.url(), 'Đăng nhập thất bại').not.toContain('dangnhap');
}

/**
 * Đăng xuất qua menu avatar.
 */
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
    } catch { /* try next */ }
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

/**
 * Fill số vào input (clear trước bằng triple-click).
 */
async function fillNumber(page: Page, selector: string, value: string): Promise<boolean> {
  const el = page.locator(selector).first();
  if (!(await el.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  await el.click({ clickCount: 3 });
  await page.waitForTimeout(100);
  await el.fill(value);
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Giao bài và làm bài — Vật lí THPT', () => {
  test.setTimeout(8 * 60_000);

  test('Giáo viên giao đề → Học sinh nhận và bắt đầu làm', async ({ page }) => {

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 1: Đăng nhập giáo viên
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Đăng nhập', async () => {
      await login(page, GIAO_VIEN.username, GIAO_VIEN.password);
      console.log(`✓ Đăng nhập giáo viên: ${GIAO_VIEN.username}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 2: Nhảy thẳng vào trang "Thi thử Tốt nghiệp THPT" → tìm Vật lí
    //   Sau khi vào trang, nếu thấy nút "Giao bài" luôn thì đây đã là đề
    //   cụ thể → dùng luôn. Nếu chưa, tìm tiếp link "... lần 2" trong trang
    //   (trường hợp còn 1 bước trung gian "trang môn" trước khi vào đề).
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Vào thẳng trang Thi thử THPT → tìm Vật lí', async () => {
      await page.goto(THI_THU_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(ms(1));
      await closePopups(page);
      console.log(`✓ Đã vào trang Thi thử Tốt nghiệp THPT: ${page.url()}`);

      // Tìm link "Vật lí" theo TEXT (không phụ thuộc href/ID vì hay đổi theo đợt đề).
      // Regex chấp nhận cả "Vật lí" / "Vật Lí" (viết hoa/thường khác nhau).
      const vatLiLink = page
        .locator('a', { hasText: /Vật\s*[Ll]í/ })
        .first();

      // Cuộn tìm tối đa 8 lần nếu link nằm dưới fold
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
      console.log(`  ✓ Đã click vào Vật lí | URL: ${page.url()}`);

      // ── Kiểm tra: đã tới đúng trang đề (có nút Giao bài) chưa? ────────────
      const giaoBaiVisible = await page
        .locator("button:has-text('Giao bài')").first()
        .isVisible({ timeout: 4_000 })
        .catch(() => false);

      if (giaoBaiVisible) {
        console.log('  ✓ Đây đã là trang đề cụ thể (có nút Giao bài) — không cần click thêm');
        return;
      }

      // ── Chưa tới trang đề → đang ở trang môn Vật lí, tìm tiếp đề "lần 2" ──
      const deLan2Link = page
        .locator('a', { hasText: /lần\s*2/i })
        .filter({ hasText: /Vật\s*[Ll]í/ })
        .first();

      // Nếu filter theo cả 2 điều kiện không match (vì text đề có thể tách
      // "Vật lí" và "lần 2" ở 2 chỗ khác nhau trong DOM), fallback: chỉ tìm "lần 2"
      const deLan2Fallback = page.locator('a', { hasText: /lần\s*2/i }).first();

      const target = (await deLan2Link.isVisible({ timeout: 3_000 }).catch(() => false))
        ? deLan2Link
        : deLan2Fallback;

      await target.waitFor({ state: 'visible', timeout: 10_000 });
      await target.scrollIntoViewIfNeeded();
      await target.click({ force: true });
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);

      console.log(`  ✓ Đã vào đề: ${TEN_DE} | URL: ${page.url()}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 3: Click nút Giao bài trên trang đề
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Click Giao bài', async () => {
      const giaoBtn = page.locator("button:has-text('Giao bài')").first();
      await giaoBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await giaoBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await giaoBtn.click({ force: true });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);
      console.log('✓ Đã click Giao bài');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 4: Chọn "Giao theo lớp"
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Chọn Giao theo lớp', async () => {
      const btn = page.locator(
        "button:has-text('Giao theo lớp'), span:has-text('Giao theo lớp')"
      ).first();
      await btn.waitFor({ state: 'visible', timeout: 10_000 });
      await btn.click({ force: true });
      await page.waitForTimeout(ms(1));
      console.log('✓ Đã chọn Giao theo lớp');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 5: Chọn tất cả lớp Khối 12
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Tick chọn tất cả Khối 12', async () => {
      const khoi12Cb = page.locator(
        'input[type="checkbox"][aria-label*="Khối 12"], ' +
        'input[type="checkbox"][aria-label*="khối 12"]'
      ).first();
      await khoi12Cb.waitFor({ state: 'visible', timeout: 10_000 });
      if (!(await khoi12Cb.isChecked())) {
        await khoi12Cb.click({ force: true });
        await page.waitForTimeout(500);
      }
      await expect(khoi12Cb).toBeChecked();
      console.log('✓ Đã chọn tất cả Khối 12');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 6: Tiếp tục
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Click Tiếp tục', async () => {
      const btn = page.locator("button:has-text('Tiếp tục')").first();
      await btn.waitFor({ state: 'visible', timeout: 8_000 });
      await btn.click({ force: true });
      await page.waitForTimeout(ms(1.5));
      console.log('✓ Đã click Tiếp tục → màn hình Thiết lập bài giao');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 7: Thiết lập form giao bài theo DOM thực tế
    //   - Thời gian làm bài : 50 phút
    //   - Giới hạn nộp sớm  :  0 phút
    //   - Bỏ tick "Thời điểm mở đề" (nếu đang checked)
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Thiết lập form giao bài', async () => {

      // ── 7a: Thời gian làm bài = 50 phút ───────────────────────────────────
      // DOM: span "Thời gian làm bài" → input[type=number][min=0] trong wrapper kế tiếp
      const thoiGianInp = page.locator(
        'span.tw-text-sm.tw-font-semibold:has-text("Thời gian làm bài") ' +
        '~ div input[type="number"][min="0"]'
      ).first();

      if (await thoiGianInp.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await thoiGianInp.click({ clickCount: 3 });
        await thoiGianInp.fill('50');
        console.log('  ✓ Thời gian làm bài: 50 phút');
      } else {
        // Fallback: input[type=number] đầu tiên trong section nền xanh nhạt
        const fallback = page.locator(
          'div.tw-bg-accent-extra-light input[type="number"]'
        ).first();
        await fallback.click({ clickCount: 3 });
        await fallback.fill('50');
        console.log('  ✓ Thời gian làm bài (fallback): 50 phút');
      }

      // ── 7b: Giới hạn nộp sớm sau = 0 phút ────────────────────────────────
      // DOM: span "Giới hạn nộp sớm sau" → input[type=number][min=0] trong wrapper kế tiếp
      // Có 2 input[type=number][min=0] trên form → lấy cái thứ 2 (index 1)
      const nopSomInp = page.locator(
        'span.tw-text-sm.tw-font-semibold:has-text("Giới hạn nộp sớm sau") ' +
        '~ div input[type="number"][min="0"]'
      ).first();

      if (await nopSomInp.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nopSomInp.click({ clickCount: 3 });
        await nopSomInp.fill('0');
        console.log('  ✓ Giới hạn nộp sớm sau: 0 phút');
      } else {
        // Fallback: input[type=number][min=0] thứ 2 trong section
        const fallback = page.locator(
          'div.tw-bg-accent-extra-light input[type="number"][min="0"]'
        ).nth(1);
        await fallback.click({ clickCount: 3 });
        await fallback.fill('0');
        console.log('  ✓ Giới hạn nộp sớm sau (fallback): 0 phút');
      }

      // ── 7c: Bỏ tick checkbox "Thời điểm mở đề" nếu đang checked ──────────
      // DOM: label > input[type=checkbox] + span "Thời điểm mở đề"
      const moDeLabel = page.locator(
        'label.tw-inline-flex:has(span:has-text("Thời điểm mở đề"))'
      ).first();
      const moDeCb = moDeLabel.locator('input[type="checkbox"]').first();

      if (await moDeCb.isVisible({ timeout: 3_000 }).catch(() => false)) {
        if (await moDeCb.isChecked().catch(() => false)) {
          await moDeCb.click({ force: true });
          await page.waitForTimeout(300);
          console.log('  ✓ Đã bỏ tick Thời điểm mở đề');
        } else {
          console.log('  ✓ Thời điểm mở đề đã bỏ tick sẵn');
        }
        await expect(moDeCb).not.toBeChecked();
      } else {
        console.log('  ⚠ Không tìm thấy checkbox Thời điểm mở đề — bỏ qua');
      }

      await page.waitForTimeout(500);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 7d: Bỏ tick "Lên lịch giao bài" và "Đặt hạn làm bài"
    //   Bỏ 2 checkbox này sẽ ẩn luôn 2 ô ngày/giờ đi kèm — giao bài ngay,
    //   không giới hạn hạn nộp.
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Bỏ tick Lên lịch giao bài & Đặt hạn làm bài', async () => {
      const lenLichCb = page
        .locator('label:has-text("Lên lịch giao bài") input[type="checkbox"]')
        .first();
      if (await lenLichCb.isVisible({ timeout: 4_000 }).catch(() => false)) {
        if (await lenLichCb.isChecked().catch(() => false)) {
          await lenLichCb.click({ force: true });
          await page.waitForTimeout(300);
        }
        await expect(lenLichCb).not.toBeChecked();
        console.log('  ✓ Đã bỏ tick Lên lịch giao bài');
      } else {
        console.log('  ⚠ Không tìm thấy checkbox Lên lịch giao bài — bỏ qua');
      }

      const datHanCb = page
        .locator('label:has-text("Đặt hạn làm bài") input[type="checkbox"]')
        .first();
      if (await datHanCb.isVisible({ timeout: 4_000 }).catch(() => false)) {
        if (await datHanCb.isChecked().catch(() => false)) {
          await datHanCb.click({ force: true });
          await page.waitForTimeout(300);
        }
        await expect(datHanCb).not.toBeChecked();
        console.log('  ✓ Đã bỏ tick Đặt hạn làm bài');
      } else {
        console.log('  ⚠ Không tìm thấy checkbox Đặt hạn làm bài — bỏ qua');
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 8: Thiết lập nâng cao
    //   - Tick "Cho phép làm lại" → Giới hạn số lần làm bài = 100
    //   - Thu bài ngay sau khi học sinh ra khỏi bài thi = 20 lần
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Thiết lập nâng cao: 100 lần làm + thu bài 20 lần thoát', async () => {
      // "Thiết lập nâng cao" mặc định đã mở sẵn (không có nút để click mở nữa),
      // chỉ cần scroll để các phần tử lọt vào viewport.
      const quyTacSec = page.locator('div:has-text("Quy tắc làm bài")').first();
      await quyTacSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(ms(0.5));

      // ── 8a: Tick checkbox "Cho phép làm lại" ──────────────────────────────
      const chophepCb = page
        .locator('label:has-text("Cho phép làm lại") input[type="checkbox"]')
        .first();

      await chophepCb.waitFor({ state: 'visible', timeout: 8_000 });
      await chophepCb.scrollIntoViewIfNeeded();
      if (!(await chophepCb.isChecked().catch(() => false))) {
        await chophepCb.click({ force: true });
        await page.waitForTimeout(400);
        console.log('  ✓ Đã tick Cho phép làm lại');
      }
      await expect(chophepCb).toBeChecked();

      // ── 8b: Điền 100 vào "Giới hạn số lần làm bài" ────────────────────────
      // Input chỉ thực sự dùng được sau khi đã tick "Cho phép làm lại" ở trên.
      const lanInp = page
        .locator('div:has-text("Giới hạn số lần làm bài") input[type="number"]')
        .first();

      await lanInp.waitFor({ state: 'visible', timeout: 5_000 });
      await lanInp.click({ clickCount: 3 });
      await lanInp.fill('100');
      await expect(lanInp).toHaveValue('100');
      console.log('  ✓ Giới hạn số lần làm bài: 100');

      // ── 8c: Chọn "20" cho "Thu bài ngay sau khi học sinh ra khỏi bài thi" ─
      const thuBaiSelect = page
        .locator('div:has-text("Thu bài ngay sau khi học sinh ra khỏi bài thi") select')
        .first();

      await thuBaiSelect.waitFor({ state: 'visible', timeout: 5_000 });
      await thuBaiSelect.scrollIntoViewIfNeeded();
      await thuBaiSelect.selectOption('20');
      await expect(thuBaiSelect).toHaveValue('20');
      console.log('  ✓ Thu bài ngay sau khi HS ra khỏi bài thi: 20 lần');

      await page.waitForTimeout(500);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 8b: Áp dụng toàn bộ thiết lập hiện tại (Lớp 12A1) cho các lớp khác
    //   Đặt SAU bước 8 (thiết lập nâng cao) để copy đầy đủ mọi thứ đã điền,
    //   tránh trường hợp lớp khác thiếu thiết lập nâng cao.
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Áp dụng cho các lớp khác', async () => {
      const apDungBtn = page.locator("button:has-text('Áp dụng cho các lớp khác')").first();
      await apDungBtn.waitFor({ state: 'visible', timeout: 8_000 });
      await apDungBtn.scrollIntoViewIfNeeded();
      await apDungBtn.click({ force: true });
      await page.waitForTimeout(ms(1));
      console.log('  ✓ Đã áp dụng thiết lập cho các lớp khác');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 9: Hoàn thành giao bài
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Click Hoàn thành giao bài', async () => {
      const hoanThanhBtn = page.locator("button:has-text('Hoàn thành giao bài')").first();
      await hoanThanhBtn.waitFor({ state: 'visible', timeout: 8_000 });
      await hoanThanhBtn.click({ force: true });
      await page.waitForTimeout(ms(2.5));

      const btnGone    = !(await hoanThanhBtn.isVisible({ timeout: 1_500 }).catch(() => false));
      const hasToast   = await page
        .locator('.toast, .alert-success, [class*="success"]').first()
        .isVisible({ timeout: 3_000 }).catch(() => false);
      const redirected =
        page.url().includes('lop-hoc') ||
        page.url().includes('bai-tap') ||
        page.url().includes('ket-qua');

      expect(
        btnGone || hasToast || redirected,
        'Giao bài không thành công: nút vẫn còn, không có toast, không redirect'
      ).toBe(true);

      console.log('✓ Giao bài thành công');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 10: Đăng xuất giáo viên
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[GV] Đăng xuất', async () => {
      await logout(page);
      console.log('✓ Đã đăng xuất giáo viên');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 11: Đăng nhập học sinh
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Đăng nhập', async () => {
      await login(page, HOC_SINH.username, HOC_SINH.password);
      console.log(`✓ Đăng nhập học sinh: ${HOC_SINH.username}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 12: Tìm bài Vật lí trong trang lớp học học sinh
    // ─────────────────────────────────────────────────────────────────────────
    let baiHocUrl = '';
    await test.step('[HS] Tìm và click bài Vật lí trong danh sách bài tập', async () => {
      await page.goto(`${BASE}/lop-hoc-cua-toi`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);

      // Link thực tế: href="https://olm.vn/chu-de/100-4637226523?i_c=118679210598"
      // Dùng fragment ID đề để nhận ra, tránh phụ thuộc vào i_c param
      const baiLink = page.locator(`a[href*='${DE_URL_FRAGMENT}']`).first();

      // Scroll xuống tối đa 8 lần để tìm bài
      for (let i = 0; i < 8; i++) {
        if (await baiLink.isVisible({ timeout: 600 }).catch(() => false)) break;
        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(400);
      }

      await expect(
        baiLink,
        `Không tìm thấy link bài "${TEN_DE}" trong trang học sinh`
      ).toBeVisible({ timeout: 8_000 });

      const href = (await baiLink.getAttribute('href')) ?? '';
      baiHocUrl  = href.startsWith('http') ? href : `${BASE}${href}`;
      console.log(`✓ Tìm thấy bài: ${baiHocUrl}`);

      // Click thẳng vào link bài (không cần điều hướng riêng)
      await baiLink.click({ force: true });
      await page.waitForLoadState('domcontentloaded', { timeout: 20_000 });
      await page.waitForTimeout(ms(1.5));
      await closePopups(page);
      console.log(`✓ Đã vào trang bài làm: ${page.url()}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BƯỚC 13: Học sinh làm bài hoàn toàn qua lamBaiEngine
    // ─────────────────────────────────────────────────────────────────────────
    await test.step('[HS] Làm bài đến hết qua lamBaiEngine', async () => {
      // lamBaiTaiBaiHoc tự: goto → phatHienLoaiBai → khoiDong → loop → nopBai
      // Bài kiểm tra dạng "thi-thu" → khoiDongThiThu → loopThiThu → nopBaiThiThu
      await lamBaiTaiBaiHoc(page, baiHocUrl);
      console.log('✓ Học sinh đã hoàn thành và nộp bài Vật lí lần 2');
    });
  });
});