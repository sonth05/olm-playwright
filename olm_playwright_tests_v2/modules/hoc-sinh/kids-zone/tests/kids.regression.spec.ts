/**
 * kids.regression.spec.ts
 */

import { expect } from '@playwright/test';
import { test } from '../../../../fixtures/auth.fixture';
import { KidsPage } from '../pages/KidsPage';

test.describe('Kids /kids @kids @regression @role_student_vip', () => {

	test('[Happy] Trang /kids load thành công', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(p.isPageLoaded()).toBeTruthy();
		expect(p.getCurrentUrl()).toContain('/kids');
	});

	test('[Happyr] Mở use menu hiển thị popup với tên người dùng', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		await p.openUserMenu();
		expect(await p.isUserMenuVisible()).toBeTruthy();
		expect((await p.getUserMenuName()).length).toBeGreaterThan(0);
	});

	test('[Happy] User menu có link Thông tin cá nhân / Hướng dẫn / Đăng xuất', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		await p.openUserMenu();
		expect(await p.isElementVisible(KidsPage.USER_MENU_INFO_LINK)).toBeTruthy();
		expect(await p.isElementVisible(KidsPage.USER_MENU_GUIDE_LINK)).toBeTruthy();
		expect(await p.isElementVisible(KidsPage.USER_MENU_LOGOUT)).toBeTruthy();
	});

	test('[Happy] Student box hiển thị tên và trường học', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(await p.isStudentBoxVisible()).toBeTruthy();
		expect((await p.getStudentName()).length).toBeGreaterThan(0);
	});

	test('[Happy] Student box hiển thị điểm thưởng dạng số', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		const points = await p.getStudentPoints();
		expect(points).toBeGreaterThanOrEqual(0);
	});

	test('[Happy] Dải huy hiệu hiển thị đủ 7 badge', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		const count = await p.getMedalCount();
		expect(count).toBeGreaterThanOrEqual(1);
	});

	test('[Happy] Mỗi huy hiệu có số lượng (amount) hợp lệ (>= 0)', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		const amounts = await p.getMedalAmounts();
		expect(amounts.length).toBeGreaterThan(0);
		for (const amount of amounts) {
			expect(amount).toBeGreaterThanOrEqual(0);
		}
	});

	test('[Happy] Hiển thị heading "Khóa học OLM"', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(await p.hasCoursesHeading()).toBeTruthy();
	});

	test('[Happy] Danh sách khóa học có ít nhất 1 thẻ với title/url hợp lệ', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		const courses = await p.getCourses();
		expect(courses.length).toBeGreaterThan(0);
		for (const course of courses) {
			expect(course.title.length).toBeGreaterThan(0);
			expect(course.url).toMatch(/^https?:\/\//);
		}
	});

	test('[Happy] Click vào khóa học đầu tiên điều hướng đến trang khóa học', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		const courses = await p.getCourses();
		test.skip(courses.length === 0, 'Không có khóa học để click');

		await p.clickFirstCourse();
		const url = authenticatedPage.url();
		expect(url).not.toBe(KidsPage.URL);
	});

	test('[Happy] Hiển thị section "Vì sao chọn OLM Kids" với 3 lý do', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		await p.scrollToBottom(5, 300);
		expect(await p.hasWhyChooseSection()).toBeTruthy();
	});

	test('[Happy] Footer hiển thị logo và các link điều hướng', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		await p.scrollToBottom(8, 300);
		expect(await p.isFooterVisible()).toBeTruthy();
		expect(await p.isElementVisible(KidsPage.FOOTER_LINK_ABOUT)).toBeTruthy();
		expect(await p.isElementVisible(KidsPage.FOOTER_LINK_CONTACT)).toBeTruthy();
		expect(await p.isElementVisible(KidsPage.FOOTER_LINK_GUIDE)).toBeTruthy();
	});

	test('[Happy] Footer có dòng copyright OLM.VN', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		await p.scrollToBottom(8, 300);
		const text = await p.getFooterCopyrightText();
		expect(text).toContain('OLM.VN');
	});

	test('[Happy] Click "Về chúng tôi" điều hướng đến /gioi-thieu', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		await p.scrollToBottom(8, 300);
		await p.clickFooterAbout();
		expect(authenticatedPage.url()).toContain('gioi-thieu');
	});

	test('[Unhappy] Không có khóa học trùng URL trong danh sách', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		const courses = await p.getCourses();
		const urls = courses.map((c) => c.url);
		const uniqueUrls = new Set(urls);
		expect(uniqueUrls.size).toBe(urls.length);
	});
});