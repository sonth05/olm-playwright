/**
 * runKids.ts  — Khối Kids / Mẫu giáo
 * ─────────────────────────────────────────────────────────────────────────────
 * OLM.vn hiện có thể có mục "Mẫu giáo" hoặc các lớp Tiền tiểu học.
 * File này quét các khóa học trong mục đó.
 *
 * Nếu OLM không có khối Kids riêng (URL không tồn tại), chayKhoi() sẽ tự
 * bỏ qua lớp đó và báo "Không tìm thấy", không làm dừng cả khối.
 *
 * Chạy: npx tsx scripts/runKids.ts
 */
import { khoiBrowser, dangNhap, chayKhoi, BASE, type LopConfig } from '../core/automation/olmUtils';
import { sleep } from '../core/automation/lamBaiEngine';

// URL khối Kids — điều chỉnh nếu OLM thay đổi cấu trúc
export const LOP_KIDS: LopConfig[] = [
  { ten: 'Mẫu giáo', url: `${BASE}/mau-giao` },
  { ten: 'Kids',     url: `${BASE}/kids` },
];

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);
    await chayKhoi(page, LOP_KIDS, 'Kids');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);