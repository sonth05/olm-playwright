import { test, expect } from '@playwright/test';
import { HoiDapPageV2 } from '../pages/HoiDapPage';

// FIX 2026-08-11: file này trước đây import `HoiDapPage` (class V1, Bootstrap
// DOM) và gọi các method/locator (isPageLoaded, getQuestionCount,
// SIDEBAR_GRADE_LINKS, TYPE_TABS, getActiveTabText, NEXT_PAGE) không hề tồn
// tại trên page object hiện có trong `../pages/HoiDapPage.ts` — file đó giờ
// chỉ còn export `HoiDapPageV2` (DOM Tailwind, xem docblock đầu file page
// object). Viết lại theo đúng API thật của HoiDapPageV2.
test.describe('Hỏi đáp Smoke @hoi_dap @smoke', () => {
	test('[Happy] Mở trang Hỏi đáp thành công', async ({ page }) => {
		const hoiDapPage = new HoiDapPageV2(page);
		await hoiDapPage.open();
		await expect(page.locator(hoiDapPage.POSTS_CONTAINER)).toBeVisible();
	});

	test('[Happy] Danh sách câu hỏi hiển thị', async ({ page }) => {
		const hoiDapPage = new HoiDapPageV2(page);
		await hoiDapPage.open();
		expect(await hoiDapPage.getPostCount()).toBeGreaterThan(0);
	});

	test('[Happy] Sidebar lọc lớp hiển thị', async ({ page }) => {
		const hoiDapPage = new HoiDapPageV2(page);
		await hoiDapPage.open();
		// Select "lớp" ẩn dưới overlay select2 (xem filterByGrade()) — kiểm tra
		// overlay hiển thị thay vì <select> gốc (ẩn, không đếm được qua UI).
		const gradeOverlay = page.locator(`${hoiDapPage.GRADE_SELECT} + span .select2-selection`);
		expect(await gradeOverlay.count()).toBeGreaterThan(0);
	});

	test('[Happy] Các tab lọc câu hỏi hiển thị đủ 4 tab', async ({ page }) => {
		const hoiDapPage = new HoiDapPageV2(page);
		await hoiDapPage.open();
		// V2 chỉ có 4 tab lọc (Tất cả / Mới nhất / Câu hỏi hay / Chưa trả lời) —
		// không còn tab "Câu hỏi vip" như bản V1 cũ.
		const tabs = page.locator('a.filter-tab');
		expect(await tabs.count()).toBeGreaterThanOrEqual(4);
	});

	test('[Happy] Tab "Tất cả" active mặc định', async ({ page }) => {
		const hoiDapPage = new HoiDapPageV2(page);
		await hoiDapPage.open();
		const activeTab = page.locator(hoiDapPage.ACTIVE_FILTER_TAB);
		const activeText = ((await activeTab.first().textContent()) ?? '').toLowerCase();
		expect(activeText).toContain('tất cả');
	});

	test('[Happy] Nút phân trang trang sau tồn tại', async ({ page }) => {
		const hoiDapPage = new HoiDapPageV2(page);
		await hoiDapPage.open();
		const nextBtn = page.locator(hoiDapPage.PAGINATION_NEXT);
		expect(await nextBtn.count()).toBeGreaterThan(0);
	});
});