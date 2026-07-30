/**
 * olmUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hàm dùng chung: đăng nhập, tạo browser/context, lấy danh sách bài học.
 *
 * FIX CHÍNH:
 *   - layDanhSachBai / layDanhSachKhoaHoc: dùng page.evaluate() để snapshot
 *     toàn bộ href+title TRƯỚC khi navigate, tránh lỗi "Target page has been closed"
 *     khi locator bị stale sau khi goto() trang tiếp theo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { USERNAME, PASSWORD } from '../../config/testData';
import { sleep, dongModal, timElement, jsClick, lamBaiTaiBaiHoc } from './lamBaiEngine';
import { BASE_URL } from '../../config/config';

export const BASE = BASE_URL;

// ─── Khởi động browser ───────────────────────────────────────────────────────
export async function khoiBrowser(headless = false): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const browser = await chromium.launch({
    headless,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins',   { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['vi-VN', 'vi', 'en-US', 'en'] });
  });
  const page = await context.newPage();

  // Bắt lỗi crash trang nhưng không throw – script tiếp tục
  page.on('crash', () => console.error('[PAGE CRASH] Trang bị crash, sẽ cố tiếp tục...'));

  return { browser, context, page };
}

// ─── Đăng nhập ───────────────────────────────────────────────────────────────
export async function dangNhap(page: Page): Promise<void> {
  console.log('[LOGIN] Đăng nhập OLM...');
  await page.goto(`${BASE}/dangnhap`, { waitUntil: 'networkidle' });
  await sleep(0.8);

  for (const sel of ["input[name='username']", "input[type='text']"]) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) { await el.fill(USERNAME); break; }
  }
  await sleep(0.3);
  await page.locator("input[type='password']").fill(PASSWORD);
  await sleep(0.3);

  const btn = await timElement(page, [
    "button[type='submit']",
    "xpath=//button[contains(text(),'Đăng nhập')]",
  ]);
  if (!btn) throw new Error('Không tìm thấy nút Đăng nhập!');
  await jsClick(page, btn);
  await sleep(2);

  if (page.url().includes('dangnhap')) throw new Error('Đăng nhập thất bại!');
  console.log('✓ Đăng nhập thành công');
  await dongModal(page);
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface BaiHoc {
  index: number; // index (0-based) của bài trong danh sách bài của khóa học — dùng để rà soát
  title: string;
  url:   string;
  type:  'luyen-tap' | 'kiem-tra' | 'khac';
}

export interface KhoaHoc {
  index: number; // index (0-based) của khóa học trong danh sách khóa học của lớp — dùng để rà soát
  title: string;
  url:   string;
}

// ─── Lấy danh sách bài (luyện tập + kiểm tra) trong 1 khóa học ──────────────
//
// ROOT CAUSE FIX: snapshot toàn bộ dữ liệu qua page.evaluate() ngay khi còn ở
// đúng trang. Tuyệt đối KHÔNG dùng locator.nth(i).getAttribute() trong vòng
// lặp sau khi page đã navigate — locator handle bị stale → crash.
//
export async function layDanhSachBai(page: Page, khoaHocUrl: string): Promise<BaiHoc[]> {
  await page.goto(khoaHocUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1);
  await dongModal(page);

  // Snapshot toàn bộ trong 1 lần evaluate — không có locator nào tồn tại qua navigate
  const rawItems = await page.evaluate((baseUrl: string) => {
    const results: { href: string; title: string; dataType: string }[] = [];

    // Ưu tiên selector mới nhất của OLM (data-type trên .lesson-item)
    const items = document.querySelectorAll<HTMLElement>(
      '.lesson-item[data-type="3"], .lesson-item[data-type="21"]'
    );

    items.forEach((item) => {
      const dataType = item.getAttribute('data-type') ?? '';
      // Link chứa title/href
      const link = item.querySelector<HTMLAnchorElement>('a.olm-text-link, a[href*="/hoc-lieu/"], a[href*="/bai/"]');
      if (!link) return;
      const href  = link.getAttribute('href') ?? '';
      const title = (link.getAttribute('title') ?? link.textContent ?? '').trim();
      if (!href) return;
      const fullHref = href.startsWith('http') ? href : `${baseUrl}${href}`;
      results.push({ href: fullHref, title, dataType });
    });

    return results;
  }, BASE);

  const bais: BaiHoc[] = rawItems.map(({ href, title, dataType }, i) => ({
    index: i, // đánh index 0..n-1 theo đúng thứ tự xuất hiện trong DOM
    title,
    url: href,
    type: dataType === '21' ? 'kiem-tra' : dataType === '3' ? 'luyen-tap' : 'khac',
  }));

  console.log(`  Tìm thấy ${bais.length} bài trong: ${khoaHocUrl}`);
  return bais;
}

// ─── Lấy danh sách khóa học trong 1 trang lớp ───────────────────────────────
//
// ROOT CAUSE FIX: tương tự layDanhSachBai — snapshot qua evaluate().
//
export async function layDanhSachKhoaHoc(page: Page, lopUrl: string): Promise<KhoaHoc[]> {
  await page.goto(lopUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await sleep(1);
  await dongModal(page);

  const rawKhoas = await page.evaluate((baseUrl: string) => {
    const results: { href: string; title: string }[] = [];

    // Thử nhiều selector khác nhau để bắt card khóa học
    const selectors = [
      '.card-body h3 a',
      '.course-card a[href*="/khoa-hoc/"]',
      'a.course-name',
      '.khoa-hoc-item a',
    ];

    for (const sel of selectors) {
      const links = document.querySelectorAll<HTMLAnchorElement>(sel);
      if (links.length === 0) continue;
      links.forEach((link) => {
        const href  = link.getAttribute('href') ?? '';
        const title = (link.getAttribute('title') ?? link.textContent ?? '').trim();
        if (!href || !title) return;
        const fullHref = href.startsWith('http') ? href : `${baseUrl}${href}`;
        // Dedupe
        if (!results.find((r) => r.href === fullHref)) {
          results.push({ href: fullHref, title });
        }
      });
      if (results.length > 0) break; // dùng selector đầu tiên có kết quả
    }

    return results;
  }, BASE);

  const khoas: KhoaHoc[] = rawKhoas.map(({ href, title }, i) => ({
    index: i, // đánh index 0..n-1 theo đúng thứ tự xuất hiện trong DOM (dedupe đã xử lý trong evaluate)
    title,
    url: href,
  }));
  console.log(`  Tìm thấy ${khoas.length} khóa học trong: ${lopUrl}`);
  return khoas;
}

// ─── Chạy trọn 1 khối (Tiểu Học / THCS / THPT / Kids) trên page có sẵn ──────
//
// Dùng chung cho mọi runXxx.ts để khỏi lặp code: duyệt từng lớp → từng khóa
// học (có index) → từng bài (có index) → gọi lamBaiTaiBaiHoc.
// Lớp nào lỗi (VD: URL không tồn tại, hay gặp với khối Kids) sẽ được bỏ qua
// và chạy tiếp lớp sau, không làm dừng cả khối.
//
export interface LopConfig {
  ten: string;
  url: string;
}

export interface ChayKhoiOptions {
  lamLuyenTap?: boolean; // mặc định true
  lamKiemTra?: boolean;  // mặc định true
}

export async function chayKhoi(
  page: Page,
  danhSachLop: LopConfig[],
  tenKhoi: string,
  opts: ChayKhoiOptions = {},
): Promise<void> {
  const lamLuyenTap = opts.lamLuyenTap ?? true;
  const lamKiemTra  = opts.lamKiemTra  ?? true;

  console.log(`\n${'█'.repeat(60)}`);
  console.log(`🏫 BẮT ĐẦU KHỐI: ${tenKhoi}`);

  for (const lop of danhSachLop) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📚 ${lop.ten}`);

    let khoaHocs: KhoaHoc[] = [];
    try {
      khoaHocs = await layDanhSachKhoaHoc(page, lop.url);
    } catch (e) {
      console.log(`  ⚠ Không truy cập được ${lop.ten} (${lop.url}): ${e}`);
      continue;
    }

    if (khoaHocs.length === 0) {
      console.log(`  ⚠ Không tìm thấy khóa học nào ở ${lop.ten}`);
      continue;
    }

    for (const khoa of khoaHocs) {
      console.log(`\n  📖 [${khoa.index}] Khóa học: ${khoa.title}`);

      const bais = await layDanhSachBai(page, khoa.url);
      if (bais.length === 0) {
        console.log(`    ⚠ Không có bài luyện tập/kiểm tra`);
        continue;
      }

      for (const bai of bais) {
        if (bai.type === 'luyen-tap' && !lamLuyenTap) continue;
        if (bai.type === 'kiem-tra'  && !lamKiemTra)  continue;

        console.log(`\n    [${bai.index}] [${bai.type.toUpperCase()}] ${bai.title}`);
        try {
          await lamBaiTaiBaiHoc(page, bai.url);
        } catch (e) {
          console.error(`    ❌ Lỗi bài "${bai.title}": ${e}`);
        }
        await sleep(1.5); // nghỉ giữa các bài
      }

      await sleep(1); // nghỉ giữa các khóa
    }
  }

  console.log(`\n\n✅ HOÀN THÀNH KHỐI ${tenKhoi.toUpperCase()}!`);
}