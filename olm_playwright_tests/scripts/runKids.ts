/**
 * runKids.ts  — Khối Kids / Mẫu giáo
 * ─────────────────────────────────────────────────────────────────────────────
 * OLM.vn hiện có thể có mục "Mẫu giáo" hoặc các lớp Tiền tiểu học.
 * File này quét các khóa học trong mục đó.
 * 
 * Nếu OLM không có khối Kids riêng, file này sẽ báo "Không tìm thấy"
 * và thoát an toàn.
 *
 * Chạy: npx tsx scripts/runKids.ts
 */
import { khoiBrowser, dangNhap, layDanhSachKhoaHoc, layDanhSachBai, BASE } from '../core/automation/olmUtils';
import { lamBaiTaiBaiHoc, sleep } from '../core/automation/lamBaiEngine';
import { type Page } from 'playwright';

// URL khối Kids — điều chỉnh nếu OLM thay đổi cấu trúc
const LOP_KIDS = [
  { ten: 'Mẫu giáo', url: `${BASE}/mau-giao` },
  { ten: 'Kids',     url: `${BASE}/kids` },
];

const LAM_LUYEN_TAP = true;
const LAM_KIEM_TRA  = true;

/** Thử lấy khóa học từ nhiều URL khác nhau (phòng trường hợp OLM đổi URL) */
async function timKhoaHocKids(page: Page): Promise<{ ten: string; khoaHocUrls: { title: string; url: string }[] }[]> {
  const results = [];

  for (const lop of LOP_KIDS) {
    try {
      const khoas = await layDanhSachKhoaHoc(page, lop.url);
      if (khoas.length > 0) {
        results.push({ ten: lop.ten, khoaHocUrls: khoas });
      }
    } catch {
      // URL không tồn tại → bỏ qua
    }
  }

  return results;
}

async function main(): Promise<void> {
  const { browser, page } = await khoiBrowser(process.env.HEADLESS === 'true');

  try {
    await dangNhap(page);

    const lopData = await timKhoaHocKids(page);

    if (lopData.length === 0) {
      console.log('\n⚠ Không tìm thấy khối Kids/Mẫu giáo trên OLM. Thoát.');
      return;
    }

    for (const lop of lopData) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`📚 ${lop.ten}`);

      for (const khoa of lop.khoaHocUrls) {
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

    console.log('\n\n✅ HOÀN THÀNH KHỐI KIDS!');
  } catch (e) {
    console.error(`\n[LỖI] ${e}`);
  } finally {
    await sleep(3);
    await browser.close();
    console.log('[DONE] Đã đóng trình duyệt.');
  }
}

main().catch(console.error);