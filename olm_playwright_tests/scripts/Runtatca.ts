/**
 * runTatCa.ts  — Chạy TOÀN BỘ các khối theo thứ tự: Tiểu Học → THCS → THPT → Kids
 * ─────────────────────────────────────────────────────────────────────────────
 * Lý do Kids chạy SAU CÙNG: khối Kids/Mẫu giáo có thể không tồn tại URL cố
 * định trên OLM (script sẽ tự bỏ qua nếu không tìm thấy), nên ưu tiên chạy
 * các khối chính (Tiểu Học, THCS, THPT) trước để đảm bảo dữ liệu quan trọng
 * được xử lý trước, Kids chạy sau như một khối "best-effort".
 *
 * Chỉ đăng nhập 1 LẦN DUY NHẤT, dùng chung page cho cả 4 khối — tiết kiệm
 * thời gian so với chạy 4 script riêng lẻ (mỗi cái mở browser + login riêng).
 *
 * Chạy toàn bộ:      npx tsx scripts/runTatCa.ts
 * Chạy ẩn (headless): HEADLESS=true npx tsx scripts/runTatCa.ts
 *
 * Muốn bỏ khối nào thì comment dòng gọi chayKhoi tương ứng ở dưới.
 */
import { khoiBrowser, dangNhap, chayKhoi } from '../core/automation/olmUtils';
import { sleep } from '../core/automation/lamBaiEngine';
import { LOP_TIEU_HOC } from './runTieuHoc';
import { LOP_THCS } from './runTHCS';
import { LOP_THPT } from './runTHPT';
import { LOP_KIDS } from './runKids';

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');
  const started = Date.now();

  try {
    await dangNhap(page);

    // ─── Thứ tự chạy: Tiểu Học → THCS → THPT → Kids (Kids chạy sau cùng) ────
    await chayKhoi(page, LOP_TIEU_HOC, 'Tiểu Học');
    await chayKhoi(page, LOP_THCS, 'THCS');
    await chayKhoi(page, LOP_THPT, 'THPT');
    await chayKhoi(page, LOP_KIDS, 'Kids');

    const mins = ((Date.now() - started) / 60_000).toFixed(1);
    console.log(`\n\n🎉 HOÀN THÀNH TẤT CẢ CÁC KHỐI trong ${mins} phút!`);
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);