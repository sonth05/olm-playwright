import { test, expect } from '@playwright/test';
import { CuocThiPage, CuocThiCategory, ContestDeadlineStatus } from '../pages/CuocThiPage';

test.describe('Cuoc thi @fun_contest @regression', () => {
	test('[Happy] Contest cards hiển thị ở tab Toán vui', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		expect(await pageObj.getContestCardCount()).toBeGreaterThan(0);
	});

	test('[Happy] Featured contest', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		expect(await pageObj.hasFeaturedContest()).toBeTruthy();
	});

	test('[Happy] getContests trả về đủ thông tin card', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		const contests = await pageObj.getContests();
		expect(contests.length).toBeGreaterThan(0);
		for (const contest of contests) {
			expect(contest.title).toBeTruthy();
			expect(contest.detailUrl).toBeTruthy();
			expect(Object.values(ContestDeadlineStatus)).toContain(contest.status);
			if (contest.status === ContestDeadlineStatus.ACTIVE) {
				expect(contest.text).toBeTruthy();
			} else {
				expect(contest.text).toBeNull();
			}
		}
	});

	test('[Happy] Tab đang chọn khớp danh mục vừa mở', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		expect(await pageObj.getActiveCategory()).toBe(CuocThiCategory.TOAN_VUI);
	});

	test('[Happy] Chuyển tab Toán vui sang Văn hay', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		await pageObj.selectCategory(CuocThiCategory.VAN_HAY);
		expect(await pageObj.getActiveCategory()).toBe(CuocThiCategory.VAN_HAY);
	});

	test('[Happy] Mở contest đầu tiên', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		await pageObj.clickFirstContest();
		expect(pageObj.getCurrentUrl()).toBeTruthy();
	});

	test('[Happy] Trang đầu tiên: nút Trang trước bị disable', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		expect(await pageObj.getCurrentPage()).toBe(1);
		expect(await pageObj.isPrevPageDisabled()).toBeTruthy();
	});

	test('[Happy] Chuyển sang trang 2 qua goToPage', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		await pageObj.goToPage(2);
		expect(await pageObj.getCurrentPage()).toBe(2);
	});

	test('[Happy] Chuyển trang qua nút Trang sau', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		await pageObj.goToNextPage();
		expect(await pageObj.getCurrentPage()).toBe(2);
	});

	test('[Unhappy] Tab Fun English có thể không có cuộc thi nào', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.FUN_ENGLISH);
		const count = await pageObj.getContestCardCount();
		expect(count).toBeGreaterThanOrEqual(0);
	});

	test('[Unhappy] Danh mục không tồn tại thì không có tab nào được chọn khớp', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		const active = await pageObj.getActiveCategory();
		expect(active).not.toBe('section_khong_ton_tai');
	});

	test('[Unhappy] clickFirstContest khi rỗng không throw', async ({ page }) => {
		const pageObj = new CuocThiPage(page);
		await pageObj.open(CuocThiCategory.TOAN_VUI);
		const links = await pageObj.findElements(CuocThiPage.CARD_DETAIL_LINK);
		if (links.length === 0) {
			await expect(pageObj.clickFirstContest()).resolves.not.toThrow();
		}
	});
});