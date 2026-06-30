/**
 * runTHCS.ts  — Khối THCS (Lớp 6 → 9)
 * ─────────────────────────────────────────────────────────────────────────────
 * Chạy: npx tsx scripts/runTHCS.ts
 */
import { khoiBrowser, dangNhap, layDanhSachKhoaHoc, layDanhSachBai, BASE } from './olmUtils';
import { lamBaiTaiBaiHoc, sleep } from './lamBaiEngine';

const LOP_THCS = [
  { ten: 'Lớp 6', url: `${BASE}/lop-6` },
  { ten: 'Lớp 7', url: `${BASE}/lop-7` },
  { ten: 'Lớp 8', url: `${BASE}/lop-8` },
  { ten: 'Lớp 9', url: `${BASE}/lop-9` },
];

const LAM_LUYEN_TAP = true;
const LAM_KIEM_TRA  = true;

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);

    for (const lop of LOP_THCS) {
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
          await sleep(1.5);
        }

        await sleep(1);
      }
    }

    console.log('\n\n✅ HOÀN THÀNH KHỐI THCS!');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);