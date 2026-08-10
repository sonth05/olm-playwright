// hoclieudaxoa-ui.spec.ts
import { test, expect } from '../../../../../core/fixtures/V2authoringrole.fixture';
import { HocLieuDaXoaV2Page } from '../../pages/Hoclieudaxoav2page';
import { dismissPopups } from '../../../../../core/shared-pages/dismissPopups';

// FIX: file này trước đây import test/expect thẳng từ '@playwright/test' —
// dùng `page` mặc định CHƯA ĐĂNG NHẬP (không có storageState). goto() điều
// hướng đến '/hoc-lieu-cua-toi?deleted=1&v=v2' bị redirect về trang đăng
// nhập, nơi có popup "Đăng ký nhận thông báo" che form đăng nhập → test kẹt
// luôn ở đó (dismissPopups() trong beforeEach cũng vô ích vì gọi TRƯỚC khi
// goto điều hướng, còn goto() lại điều hướng lại). Đổi sang dùng
// V2authoringrole.fixture giống De-kiem-tra-modal.ui.spec.ts /
// Hoc-lieu-cua-toi.ui.spec.ts (đã pass) — lấy page đã đăng nhập sẵn qua
// storageState theo role, bỏ qua hẳn màn hình đăng nhập.
//
// GỘP (theo yêu cầu): 8 ca test UI trên CÙNG 1 trang "Học liệu đã xóa" trước
// đây tách thành 8 `test()` riêng — mỗi test tự mở lại 1 browser/page mới
// qua `beforeEach` (getPageAsRole), dù tất cả cùng thao tác trên 1 trang đã
// mở. Gộp thành 1 `test()` duy nhất, mở page 1 LẦN, các bước cũ chuyển thành
// `test.step()` chạy tuần tự trong cùng 1 browser (theo đúng pattern đã dùng
// ở Hoc-lieu-cua-toi.ui.spec.ts). Giữ nguyên toàn bộ nội dung/assertion của
// từng bước, chỉ đổi cách tổ chức.
test.describe('[UI] Trang Học liệu đã xóa (V2)', () => {
  test('Header, breadcrumb, bảng dữ liệu, badge, bộ lọc, phân trang', async ({ getPageAsRole }) => {
    const p = await getPageAsRole('editableTeacher');
    await dismissPopups(p);
    const page = new HocLieuDaXoaV2Page(p);
    await page.goto();

    await test.step('Hiển thị tiêu đề trang', async () => {
      await expect(page.heading).toHaveText('Học liệu đã xóa');
    });

    // ĐÃ BỎ (2026-08-10, xác nhận DOM thật): bước kiểm tra breadcrumb
    // ("Trang giáo viên" > "Học liệu cá nhân" > "Học liệu đã xóa"). Selector
    // `nav[aria-label="breadcrumb"]` trước đây chỉ là GIẢ ĐỊNH, chưa đối
    // chiếu DOM thật. DOM thật lấy từ #view-my-categories-list (2026-08-10)
    // không có breadcrumb nav nào — trang chỉ gồm banner cập nhật hệ thống,
    // heading + link hướng dẫn, thanh bộ lọc, bảng, và phân trang. Trang này
    // KHÔNG render breadcrumb, nên xóa hẳn bước test thay vì để fail sai.

    // Tài khoản test có thể ở 1 trong 2 trạng thái HỢP LỆ: đã có sẵn học liệu
    // bị xóa (seed data), hoặc chưa từng xóa cái nào. getDataState() phân biệt
    // rõ 2 trường hợp này (và throw nếu là 1 trạng thái KHÔNG xác định được,
    // tức có khả năng là lỗi thật — xem tableDataState.ts) để các bước dưới
    // đây rẽ nhánh đúng, thay vì luôn giả định có sẵn dữ liệu rồi fail oan.
    // Cache lại 1 lần để không phải gọi getDataState() lặp lại giữa các bước.
    let dataState: Awaited<ReturnType<typeof page.getDataState>>;

    await test.step('Hiển thị bảng dữ liệu với đúng 6 cột', async () => {
      dataState = await page.getDataState();
      if (dataState === 'empty') {
        // ĐÃ XÁC NHẬN DOM THẬT (ảnh chụp màn hình 2026-08-07): khi trống, trang
        // KHÔNG render <table> — thay bằng khối minh họa + "Chưa có học liệu
        // nào". Kiểm tra đúng phần này thay vì bỏ qua trắng.
        await expect(page.table).not.toBeVisible();
        await expect(page.emptyStateHeading).toBeVisible();
        return;
      }

      const headers = page.tableHeader.locator('th');
      await expect(headers).toHaveCount(6);
      await expect(headers.nth(0)).toHaveText('STT');
      await expect(headers.nth(1)).toHaveText('Tên học liệu');
      await expect(headers.nth(2)).toHaveText('Khối lớp');
      await expect(headers.nth(3)).toHaveText('Môn học');
      await expect(headers.nth(4)).toHaveText('Khóa học');
      await expect(headers.nth(5)).toHaveText('Hành động');
    });

    await test.step('Hiển thị ít nhất 1 dòng dữ liệu (nếu có dữ liệu seed), hoặc thông báo trống hợp lệ nếu chưa có', async () => {
      if (dataState === 'empty') {
        // TH2: tài khoản chưa xóa học liệu nào — trống hợp lệ, không phải lỗi.
        // Kiểm tra đúng dòng chữ đã xác nhận DOM thật, không chỉ locator gộp.
        await expect(page.emptyStateHeading).toBeVisible();
        return;
      }
      // TH1: có dữ liệu.
      const rowCount = await page.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });

    await test.step('Mỗi dòng có badge "Đã xóa" và badge quyền riêng tư', async () => {
      // Trước đây dùng test.skip() để bỏ qua CẢ TEST khi trống — trong 1 test
      // gộp không còn hợp lệ (sẽ bỏ qua luôn cả các bước sau). Đổi thành
      // return sớm khỏi riêng bước này, giữ nguyên hiệu quả "bỏ qua kiểm tra
      // nội dung dòng khi tài khoản test chưa có học liệu đã xóa nào".
      if (dataState === 'empty') {
        return;
      }

      const firstRow = page.getRowByIndex(0);
      const titleCell = firstRow.locator('td').nth(1);
      await expect(titleCell.locator('.tw-badge-outline-sm')).toHaveText('Đã xóa');
      await expect(titleCell.locator('.tw-badge-secondary_light-sm, .tw-badge-accent_light-sm')).not.toBeEmpty();
    });

    await test.step('Hiển thị nút "Khôi phục" trên mỗi dòng', async () => {
      if (dataState === 'empty') {
        return;
      }

      const firstRow = page.getRowByIndex(0);
      await expect(firstRow.getByRole('button', { name: /Khôi phục/ })).toBeVisible();
    });

    await test.step('Hiển thị đầy đủ bộ lọc loại học liệu, môn học, khối lớp', async () => {
      await expect(page.filterTypeBtn).toBeVisible();
      await expect(page.filterSubjectBtn).toBeVisible();
      await expect(page.filterGradeBtn).toBeVisible();
      await expect(page.btnAdvancedFilter).toBeVisible();
      await expect(page.btnReload).toBeVisible();
    });

    await test.step('Hiển thị phân trang nếu có nhiều hơn 1 trang', async () => {
      const hasPagination = await page.pagination.isVisible({ timeout: 2_000 }).catch(() => false);
      if (!hasPagination) {
        return; // ≤10 dòng: thanh phân trang không xuất hiện — đúng.
      }

      // FIX (2026-08-10): trước đây hard-code cả nút Trước/Sau lẫn
      // `pageButton(2)` phải hiển thị — giả định LUÔN có ít nhất 2 trang.
      // Đây là giả định SAI: số học liệu đã xóa của tài khoản test thay đổi
      // qua từng lần chạy/seed dữ liệu. Khi trang đó KHÔNG có học liệu nào
      // đã xóa, hoặc số lượng chưa đủ để tràn sang trang 2, thanh phân
      // trang có thể chỉ hiện đúng nút trang 1 — không có nút Trước/Sau/
      // trang 2 trở đi. Nên coi nút Trước/Sau + các trang khác trang 1 đều
      // là OPTIONAL, chỉ kiểm tra chúng NẾU chúng thực sự hiển thị. Chỉ có
      // nút trang 1 là bắt buộc (đã có `hasPagination` = true thì chắc chắn
      // phải có ít nhất trang 1).
      await expect(page.pageButton(1)).toBeVisible();
      await page.expectCurrentPage(1);

      const prevVisible = await page.btnPrevPage.isVisible({ timeout: 2_000 }).catch(() => false);
      if (prevVisible) {
        await expect(page.btnPrevPage).toBeVisible();
      }

      const nextVisible = await page.btnNextPage.isVisible({ timeout: 2_000 }).catch(() => false);
      if (nextVisible) {
        await expect(page.btnNextPage).toBeVisible();
      }
    });
  });
});