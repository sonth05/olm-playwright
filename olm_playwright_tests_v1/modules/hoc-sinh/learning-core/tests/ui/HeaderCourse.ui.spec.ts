import { test, expect } from '@playwright/test';
import { HeaderCoursePage } from '@core/shared-pages/HeaderCoursePage';
import { BASE_URL } from '../../../../../config/config';

test.describe('Header Trang Khóa Học @learning-core', () => {

	test('[Happy] Logo hiển thị và click về trang chủ', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();

				const logo = await cp.findVisible([HeaderCoursePage.LOGO], 10);
				expect(logo, 'Logo phải hiển thị').not.toBeNull();

				await cp.clickLogo();
				const url = cp.getCurrentUrl().replace(/\/$/, '');
				expect([BASE_URL, `${BASE_URL}/index`]).toContain(url);
			});

	test('[Happy] Search bar hiển thị', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				expect(await cp.isSearchInputPresent()).toBeTruthy();
			});

	test('[Happy] Dropdown chọn loại tìm kiếm hiển thị', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				expect(await cp.isSearchTypeSelectPresent()).toBeTruthy();
			});

	test('[Happy] Nav "Học bài" điều hướng đúng', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickNavHocBai();
				expect(cp.getCurrentUrl()).toContain('/hoc-bai');
			});

	test('[Happy] Nav "Hỏi bài" điều hướng đúng', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickNavHoiBai();
				expect(cp.getCurrentUrl()).toContain('/hoi-dap');
			});

	test('[Happy] Nav "Kiểm tra" điều hướng đúng', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickNavKiemTra();
				expect(cp.getCurrentUrl()).toContain('/contestx');
			});

	test('[Happy] Nav "ĐGNL" điều hướng đúng', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickNavDGNL();
				expect(cp.getCurrentUrl()).toMatch(/dgnl\.olm\.vn|danh-gia/i);
			});

	test('[Happy] Nav "Thi đấu" điều hướng đúng', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();

				const el = await cp.findVisible([HeaderCoursePage.NAV_THI_DAU], 10);
				expect(el, '"Thi đấu" phải hiển thị trong nav').not.toBeNull();
				const href = await el!.getAttribute('href');
				expect(href).toMatch(/\/thi-dau|dautruong\.olm\.vn/);
			});

	test('[Happy] Nav "Thư viện số" điều hướng đúng', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickNavThuVienSo();
				expect(cp.getCurrentUrl()).toContain('thu-vien-so');
			});

	test('[Happy] Sidebar - click "Lớp 10" active đúng lớp', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();

				const activeText = await cp.getActiveGradeText();
				expect(activeText ?? '').toMatch(/10/);
			});

	test('[Happy] Sidebar - click sang "Lớp 9" thay đổi nội dung', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickSidebarGrade('Lớp 9');
				expect(cp.getCurrentUrl()).toMatch(/lop-9|grade=9/i);
			});

	test('[Happy] Sidebar - click sang "Lớp 12" thay đổi nội dung', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickSidebarGrade('Lớp 12');
				expect(cp.getCurrentUrl()).toMatch(/lop-12|grade=12/i);
			});

	test('[Happy] Announcement bar hiển thị', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				expect(await cp.isAnnouncementBarPresent()).toBeTruthy();
			});

	test('[Unhappy] Tìm kiếm rỗng không crash', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.search('');
				expect(cp.getCurrentUrl()).toBeTruthy();
			});

	test('[Unhappy] Tìm kiếm XSS không trigger alert', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				let dialogTriggered = false;
				page.on('dialog', async (dialog) => {
					dialogTriggered = true;
					await dialog.dismiss();
				});
				await cp.openCoursePage();
				await cp.search("<script>alert('xss')</script>");
				expect(dialogTriggered).toBeFalsy();
			});

	test('[Unhappy] Tìm kiếm chuỗi 500 ký tự không crash', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.search('a'.repeat(500));
				expect(cp.getCurrentUrl()).toBeTruthy();
			});

	test('[Unhappy] Tìm kiếm ký tự đặc biệt không crash', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.search('!@#$%^&*()_+-=[]{}|;\':",./<>?');
				expect(cp.getCurrentUrl()).toBeTruthy();
			});

	test('[Unhappy] Header không bị vỡ layout ở viewport 1024px', async ({ page }) => {
				await page.setViewportSize({ width: 1024, height: 768 });
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				expect(await cp.isSearchInputPresent()).toBeTruthy();
			});

	test('[Unhappy] Sidebar "Mẫu giáo" điều hướng đúng hoặc không crash', async ({ page }) => {
				const cp = new HeaderCoursePage(page);
				await cp.openCoursePage();
				await cp.clickSidebarGrade('Mẫu giáo');
				expect(cp.getCurrentUrl()).toBeTruthy();
			});

});
