/**
 * runTieuHoc.ts  — Khối Tiểu Học (Lớp 1 → 5)
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   Đăng nhập → duyệt từng lớp → từng khóa học → từng bài luyện tập/kiểm tra
 *   → gọi lamBaiEngine để tự làm bài
 * ─────────────────────────────────────────────────────────────────────────────
 * Chạy: npx tsx scripts/runTieuHoc.ts
 */
import { khoiBrowser, dangNhap, layDanhSachKhoaHoc, layDanhSachBai, BASE } from '../core/automation/olmUtils';
import { lamBaiTaiBaiHoc, sleep } from '../core/automation/lamBaiEngine';

// Danh sách lớp của khối Tiểu Học
const LOP_TIEU_HOC = [
  { ten: 'Lớp 1', url: `${BASE}/lop-1` },
  { ten: 'Lớp 2', url: `${BASE}/lop-2` },
  { ten: 'Lớp 3', url: `${BASE}/lop-3` },
  { ten: 'Lớp 4', url: `${BASE}/lop-4` },
  { ten: 'Lớp 5', url: `${BASE}/lop-5` },
];

// Bộ lọc loại bài cần làm (bỏ comment để tắt loại nào đó)
const LAM_LUYEN_TAP = true;
const LAM_KIEM_TRA  = true;

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);

    for (const lop of LOP_TIEU_HOC) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`📚 ${lop.ten}`);

      const khoaHocs = await layDanhSachKhoaHoc(page, lop.url);
      if (khoaHocs.length === 0) {
        console.log(`  ⚠ Không tìm thấy khóa học nào ở ${lop.ten}`);
        continue;
      }

      for (const khoa of khoaHocs) {
        console.log(`\n  📖 Khóa học: ${khoa.title}`);

        const bais = await layDanhSachBai(page, khoa.url);
        if (bais.length === 0) {
          console.log(`    ⚠ Không có bài luyện tập/kiểm tra`);
          continue;
        }

        for (const bai of bais) {
          if (bai.type === 'luyen-tap' && !LAM_LUYEN_TAP) continue;
          if (bai.type === 'kiem-tra'  && !LAM_KIEM_TRA)  continue;

          console.log(`\n    [${bai.type.toUpperCase()}] ${bai.title}`);
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

    console.log('\n\n✅ HOÀN THÀNH KHỐI TIỂU HỌC!');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);