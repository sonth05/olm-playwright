/**
 * runTieuHoc.ts  — Khối Tiểu Học (Lớp 1 → 5)
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   Đăng nhập → duyệt từng lớp → từng khóa học → từng bài luyện tập/kiểm tra
 *   → gọi lamBaiEngine để tự làm bài
 * ─────────────────────────────────────────────────────────────────────────────
 * Chạy: npx tsx scripts/runTieuHoc.ts
 */
import { khoiBrowser, dangNhap, chayKhoi, BASE, type LopConfig } from '../core/automation/olmUtils';
import { sleep } from '../core/automation/lamBaiEngine';

// Danh sách lớp của khối Tiểu Học
export const LOP_TIEU_HOC: LopConfig[] = [
  { ten: 'Lớp 1', url: `${BASE}/lop-1` },
  { ten: 'Lớp 2', url: `${BASE}/lop-2` },
  { ten: 'Lớp 3', url: `${BASE}/lop-3` },
  { ten: 'Lớp 4', url: `${BASE}/lop-4` },
  { ten: 'Lớp 5', url: `${BASE}/lop-5` },
];

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);
    await chayKhoi(page, LOP_TIEU_HOC, 'Tiểu Học');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);