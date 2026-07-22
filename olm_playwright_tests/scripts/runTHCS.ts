/**
 * runTHCS.ts  — Khối THCS (Lớp 6 → 9)
 * ─────────────────────────────────────────────────────────────────────────────
 * Chạy: npx tsx scripts/runTHCS.ts
 */
import { khoiBrowser, dangNhap, chayKhoi, BASE, type LopConfig } from '../core/automation/olmUtils';
import { sleep } from '../core/automation/lamBaiEngine';

export const LOP_THCS: LopConfig[] = [
  { ten: 'Lớp 6', url: `${BASE}/lop-6` },
  { ten: 'Lớp 7', url: `${BASE}/lop-7` },
  { ten: 'Lớp 8', url: `${BASE}/lop-8` },
  { ten: 'Lớp 9', url: `${BASE}/lop-9` },
];

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);
    await chayKhoi(page, LOP_THCS, 'THCS');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);