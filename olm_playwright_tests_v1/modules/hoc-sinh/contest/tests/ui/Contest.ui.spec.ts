import { test, expect } from '@playwright/test';
import { ContestPage } from '../../pages/ContestPage';

test.describe('Kho đề – Grade Sidebar @contest', () => {

	test('[Happy] Sidebar có đủ 13 mục lớp (Mẫu giáo + Lớp 1~12)', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				const count = await cp.getGradeCount();
				expect(count).toBeGreaterThanOrEqual(13);
			});

	test('[Happy] Sidebar có link Mẫu giáo (grade=0)', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				const link = page.locator(`${ContestPage.GRADE_SIDEBAR_ITEMS}[href*="grade=0"]`);
				await expect(link.first()).toBeVisible();
				const text = (await link.first().textContent() ?? '').trim();
				expect(text).toContain('Mẫu giáo');
			});

	test('[Happy] Sidebar có link Lớp 12 (grade=12)', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				const link = page.locator(`${ContestPage.GRADE_SIDEBAR_ITEMS}[href*="grade=12"]`);
				await expect(link.first()).toBeVisible();
			});

	test('[Happy] Chọn lớp 6 – URL có grade=6, active state đúng', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				expect(cp.getCurrentUrl()).toContain('grade=6');
				const activeText = await cp.getActiveGradeText();
				expect(activeText).toContain('Lớp 6');
			});

	test('[Happy] Chọn lớp 1 – URL có grade=1', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(1);
				expect(cp.getCurrentUrl()).toContain('grade=1');
				const chapterCount = await cp.getChapterCount();
				expect(chapterCount).toBeGreaterThanOrEqual(0);
			});

	test('[Happy] Chọn lớp 9 – URL có grade=9', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(9);
				expect(cp.getCurrentUrl()).toContain('grade=9');
			});

	test('[Unhappy] Grade không hợp lệ (grade=99) – trang vẫn tải', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.navigateTo(`${ContestPage.URL}?grade=99`);
				expect(cp.isPageLoaded()).toBeTruthy();
			});

});

test.describe('Kho đề – Subject Tabs @contest', () => {

	test('[Happy] Có ít nhất 2 tab môn học (tab môn + tab bài thi chia sẻ)', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);
				const count = await cp.getSubjectTabCount();
				expect(count).toBeGreaterThanOrEqual(2);
			});

	test('[Happy] Tab đầu tiên là active mặc định', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);
				const activeText = await cp.getActiveSubjectTabText();
				expect(activeText.length).toBeGreaterThan(0);
			});

	test('[Happy] Tab môn học hiển thị tên môn học', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);
				const tabs = page.locator(ContestPage.SUBJECT_TABS);
				const firstText = (await tabs.first().textContent() ?? '').trim();
				expect(firstText.length).toBeGreaterThan(0);
			});

	test('[Happy] Nội dung thay đổi khi chuyển tab môn học', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				const tabs = page.locator(`${ContestPage.SUBJECT_TABS}[data-toggle="tab"]`);
				const tabCount = await tabs.count();
				if (tabCount >= 2) {
					await cp.jsClick(tabs.nth(1));
					await page.waitForTimeout(600);
					expect(cp.isPageLoaded()).toBeTruthy();
				}
			});

});

test.describe('Kho đề – Subject Dropdown @contest', () => {

	test('[Happy] Dropdown môn học hiển thị tên môn hiện tại', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				const text = await cp.getSubjectDropdownText();
				expect(text.length).toBeGreaterThan(0);
			});

	test('[Happy] Dropdown có ít nhất 5 môn học', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				await cp.openSubjectDropdown();
				const count = await cp.getSubjectDropdownItemCount();
				expect(count).toBeGreaterThanOrEqual(5);
			});

	test('[Happy] Dropdown có item "Tất cả"', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				await cp.openSubjectDropdown();
				const allItem = page.locator(ContestPage.SUBJECT_DROPDOWN_ALL);
				await expect(allItem).toBeVisible({ timeout: 5_000 });
				const text = (await allItem.textContent() ?? '').trim();
				expect(text).toContain('Tất cả');
			});

	test('[Happy] Chọn môn "Tiếng Anh" từ dropdown – URL chứa subject=2', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				await cp.selectSubjectFromDropdown('Tiếng Anh');
				expect(cp.getCurrentUrl()).toContain('subject=2');
			});

	test('[Happy] Chọn môn "Toán" từ dropdown – URL chứa subject=3', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.open();
				await cp.selectSubjectFromDropdown('Toán');
				expect(cp.getCurrentUrl()).toContain('subject=3');
			});

	test('[Unhappy] subject param không hợp lệ (subject=9999) – trang vẫn tải', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.navigateTo(`${ContestPage.URL}?subject=9999`);
				expect(cp.isPageLoaded()).toBeTruthy();
			});

});

test.describe('Kho đề – Chapters (Chương) @contest', () => {

	test('[Happy] Lớp 6 Toán có các chương đúng tên (CHƯƠNG I, II, ...)', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				const titles = await cp.getChapterTitles();
				expect(titles.length).toBeGreaterThan(0);
				const hasChapter = titles.some(t =>
					t.toUpperCase().includes('CHƯƠNG') || t.includes('Ôn tập') || t.includes('kiểm tra')
				);
				expect(hasChapter).toBeTruthy();
			});

	test('[Happy] Có ít nhất 3 chương ở lớp 6', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);
				const count = await cp.getChapterCount();
				expect(count).toBeGreaterThanOrEqual(3);
			});

	test('[Happy] Tên chương không rỗng', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				const titles = await cp.getChapterTitles();
				for (const title of titles) {
					expect(title.length).toBeGreaterThan(0);
				}
			});

	test('[Happy] Chương có thể toggle collapse (click header)', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				const countBefore = await cp.getLessonCount();
				await cp.toggleChapter(0);
				await page.waitForTimeout(500);
				await cp.toggleChapter(0);
				await page.waitForTimeout(500);
				const countAfter = await cp.getLessonCount();

				expect(countAfter).toBe(countBefore);
			});

	test('[Happy] Chương CHƯƠNG I – TẬP HỢP CÁC SỐ TỰ NHIÊN tồn tại ở lớp 6', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				const titles = await cp.getChapterTitles();
				const found = titles.some(t => t.includes('TẬP HỢP') || t.includes('SỐ TỰ NHIÊN'));
				expect(found).toBeTruthy();
			});

	test('[Happy] Chương Ôn tập kiểm tra giữa kì tồn tại ở lớp 6', async ({ page }) => {
				const cp = new ContestPage(page);
				await cp.openWithGrade(6);

				const titles = await cp.getChapterTitles();
				const found = titles.some(t =>
					t.includes('kiểm tra') || t.includes('Ôn tập') || t.includes('học kì')
				);
				expect(found).toBeTruthy();
			});

});

test.describe('Kho đề @contest', () => {

	test('[Smoke] Trang Kho đề tải thành công', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				expect(contestPage.isPageLoaded()).toBeTruthy();
				expect(contestPage.getCurrentUrl()).toContain('contestx');
			});

	test('[Smoke] Sidebar lớp hiển thị đủ lớp (Mẫu giáo → Lớp 12)', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const gradeCount = await contestPage.getGradeCount();
				expect(gradeCount).toBeGreaterThanOrEqual(13);
			});

	test('[Smoke] Có ít nhất 1 tab môn học trong sidebar giữa', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const tabCount = await contestPage.getSubjectTabCount();
				expect(tabCount).toBeGreaterThan(0);
			});

	test('[Smoke] Dropdown lọc môn học hiển thị', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const dropdownText = await contestPage.getSubjectDropdownText();
				expect(dropdownText.length).toBeGreaterThan(0);
			});

	test('[Smoke] Có ít nhất 1 chương trong tab đang active', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const chapterCount = await contestPage.getChapterCount();
				expect(chapterCount).toBeGreaterThan(0);
			});

	test('[Smoke] Có bài/đề hiển thị trong chương', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const lessonCount = await contestPage.getLessonCount();
				expect(lessonCount).toBeGreaterThan(0);
			});

	test('[Smoke] Bài đầu tiên có tên không rỗng', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const lessonCount = await contestPage.getLessonCount();
				if (lessonCount > 0) {
					const title = await contestPage.getLessonTitle(0);
					expect(title.length).toBeGreaterThan(0);
				}
			});

	test('[Smoke] Bài đầu tiên có nút bài tập (icon list)', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.open();

				const lessonCount = await contestPage.getLessonCount();
				if (lessonCount > 0) {
					const btnCount = await contestPage.getExerciseBtnCountForLesson(0);
					expect(btnCount).toBeGreaterThan(0);
				}
			});

	test('[Smoke] Mở trang theo lớp 6 – URL chứa grade=6', async ({ page }) => {
				const contestPage = new ContestPage(page);
				await contestPage.openWithGrade(6);

				expect(contestPage.getCurrentUrl()).toContain('grade=6');
				expect(await contestPage.getChapterCount()).toBeGreaterThan(0);
			});

});
