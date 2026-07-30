/**
 * runTHPT.ts  — Khối THPT (Lớp 10 → 12)
 * ─────────────────────────────────────────────────────────────────────────────
 * Chạy: npx tsx scripts/runTHPT.ts
 */
import { khoiBrowser, dangNhap, chayKhoi, BASE, type LopConfig } from '../core/automation/olmUtils';
import { sleep } from '../core/automation/lamBaiEngine';

export const LOP_THPT: LopConfig[] = [
  { ten: 'Lớp 10', url: `${BASE}/lop-10` },
  { ten: 'Lớp 11', url: `${BASE}/lop-11` },
  { ten: 'Lớp 12', url: `${BASE}/lop-12` },
];

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);
    await chayKhoi(page, LOP_THPT, 'THPT');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);