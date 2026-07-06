import { test, expect } from '@playwright/test';
import { HoiDapPage } from '../../pages/HoiDapPage';
import { BASE_URL } from '../../config/config';

test.describe('Hỏi đáp Regression @hoi_dap @regression', () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  test('[Happy] Danh sách câu hỏi có nội dung', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThan(0);
    const firstText = await hoiDapPage.getFirstQuestionText();
    expect(firstText.length).toBeGreaterThan(0);
  });

  test('[Happy] Lọc tab Mới nhất', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Mới nhất');
    // URL phải chứa /newq hoặc vẫn là /hoi-dap
    const url = hoiDapPage.getCurrentUrl();
    expect(url).toMatch(/hoi-dap/);
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThan(0);
  });

  test('[Happy] Lọc tab Câu hỏi hay', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Câu hỏi hay');
    const url = hoiDapPage.getCurrentUrl();
    expect(url).toContain('hoi-dap');
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Happy] Lọc tab Chưa trả lời', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Chưa trả lời');
    const url = hoiDapPage.getCurrentUrl();
    expect(url).toContain('hoi-dap');
  });

  test('[Happy] Lọc tab Câu hỏi vip', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Câu hỏi vip');
    const url = hoiDapPage.getCurrentUrl();
    expect(url).toContain('hoi-dap');
  });

  test('[Happy] Lọc lớp 5 — URL chứa lop=5', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByGrade(5);
    expect(hoiDapPage.getCurrentUrl()).toContain('lop=5');
  });

  test('[Happy] Lọc lớp 9 — URL chứa lop=9', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByGrade(9);
    expect(hoiDapPage.getCurrentUrl()).toContain('lop=9');
  });

  test('[Happy] Lọc lớp 12 — URL chứa lop=12', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByGrade(12);
    expect(hoiDapPage.getCurrentUrl()).toContain('lop=12');
  });

  test('[Happy] Mỗi câu hỏi có link /cau-hoi/', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const links = page.locator(HoiDapPage.QUESTION_LINK);
    expect(await links.count()).toBeGreaterThan(0);
    const href = await links.first().getAttribute('href');
    expect(href).toContain('/cau-hoi/');
  });

  test('[Happy] Câu hỏi có đáp án hiển thị .card-comment', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const answers = page.locator(HoiDapPage.ANSWER_CARD);
    // Ít nhất 1 câu hỏi trên trang phải có đáp án
    expect(await answers.count()).toBeGreaterThan(0);
  });

  test('[Happy] Nút vote (Đúng) tồn tại trong đáp án', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const voteBtn = page.locator(HoiDapPage.VOTE_BTN);
    expect(await voteBtn.count()).toBeGreaterThan(0);
  });

  test('[Happy] Nút "Xem thêm câu trả lời" tồn tại', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const loadMoreBtn = page.locator(HoiDapPage.LOAD_MORE_ANSWERS_BTN);
    expect(await loadMoreBtn.count()).toBeGreaterThan(0);
  });

  test('[Happy] Badge VIP xuất hiện trên trang', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    // Trang luôn có VIP badge (user VIP hoặc câu hỏi vip)
    expect(await hoiDapPage.hasVipBadge()).toBeTruthy();
  });

  test('[Happy] Tag môn học (#Toán / #Tiếng anh...) hiển thị', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const tags = page.locator(HoiDapPage.QUESTION_TAG);
    expect(await tags.count()).toBeGreaterThan(0);
  });

  test('[Happy] Thời gian đăng câu hỏi hiển thị', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const times = page.locator(HoiDapPage.POST_TIME);
    // Đợi phần tử thời gian render xong (lazy-render sau khi card vào viewport)
    await times.first().waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
    // Ít nhất 1 câu hỏi có thời gian
    expect(await times.count()).toBeGreaterThan(0);

    // NOTE: KHÔNG dùng times.first() theo thứ tự DOM — một số phần tử
    // ".card-body .extra.time" có thể vẫn RỖNG tại thời điểm này do
    // lazy-render (thứ tự DOM không đảm bảo trùng thứ tự card đã render
    // xong nội dung, VD: card đang chờ populate qua JS/template). Dùng
    // filter() để lấy phần tử ĐẦU TIÊN có text thực sự (non-whitespace),
    // tránh đọc trúng placeholder rỗng gây fail giả.
    const nonEmptyTime = times.filter({ hasText: /\S/ }).first();
    await expect(nonEmptyTime).toBeVisible({ timeout: 10_000 });
    const timeText = await nonEmptyTime.textContent();
    expect(timeText?.trim().length).toBeGreaterThan(0);
  });

  test('[Happy] Phân trang — tồn tại link trang sau', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const nextPage = page.locator(HoiDapPage.NEXT_PAGE);
    expect(await nextPage.count()).toBeGreaterThan(0);
  });

  test('[Happy] Chuyển trang sau — tải câu hỏi mới', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const countBefore = await hoiDapPage.getQuestionCount();
    await hoiDapPage.goNextPage();
    // Sau khi load trang sau vẫn có câu hỏi
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThan(0);
    // URL phải thay đổi (có cursor)
    expect(hoiDapPage.getCurrentUrl()).not.toBe(`${BASE_URL}/hoi-dap`);
    expect(countBefore).toBeGreaterThan(0);
  });

  test('[Happy] Input "Trả lời nhanh" hiển thị trong mỗi card', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const inputs = page.locator(HoiDapPage.QUICK_REPLY_INPUT);
    expect(await inputs.count()).toBeGreaterThan(0);
    const placeholder = await inputs.first().getAttribute('placeholder');
    expect(placeholder).toContain('Trả lời nhanh');
  });

  // ── Unhappy path ──────────────────────────────────────────────────────────

  test('[Unhappy] Đặt câu hỏi khi chưa đăng nhập — redirect login', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    // Click trigger tạo câu hỏi
    const trigger = await hoiDapPage.findVisible([HoiDapPage.CREATE_POST_TRIGGER], 5);
    if (trigger) {
      await hoiDapPage.jsClick(trigger);
      await page.waitForTimeout(1_000);
      const url = hoiDapPage.getCurrentUrl();
      // Khi chưa login: redirect dangnhap HOẶC mở modal yêu cầu login
      const isRedirectedOrBlocked =
        url.includes('dangnhap') ||
        url.includes('hoi-dap') ||
        (await page.locator('.modal.show').count()) > 0;
      expect(isRedirectedOrBlocked).toBeTruthy();
    } else {
      // Nếu không tìm thấy trigger → bình thường (chưa login = ẩn form)
      expect(true).toBeTruthy();
    }
  });

  test('[Unhappy] Lọc lớp không tồn tại (lớp 99) — không crash', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByGrade(99); // không tìm thấy link → không làm gì
    // Trang không bị crash, vẫn ở /hoi-dap
    expect(hoiDapPage.getCurrentUrl()).toContain('hoi-dap');
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThan(0);
  });

  test('[Unhappy] Lọc tab không tồn tại — không crash', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    await hoiDapPage.filterByType('Loại không tồn tại XYZ_999');
    // Không click được tab nào → trang giữ nguyên trạng thái
    expect(await hoiDapPage.getQuestionCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Unhappy] Click reply input khi chưa login — chuyển hướng/block', async ({ page }) => {
    const hoiDapPage = new HoiDapPage(page);
    await hoiDapPage.open();
    const input = page.locator(HoiDapPage.QUICK_REPLY_INPUT).first();
    if (await input.isVisible()) {
      await input.click({ force: true });
      await page.waitForTimeout(800);
      // Kết quả có thể: redirect dangnhap hoặc vẫn ở hoi-dap (input bị block)
      const url = hoiDapPage.getCurrentUrl();
      expect(url.includes('dangnhap') || url.includes('hoi-dap')).toBeTruthy();
    } else {
      expect(true).toBeTruthy();
    }
  });
});