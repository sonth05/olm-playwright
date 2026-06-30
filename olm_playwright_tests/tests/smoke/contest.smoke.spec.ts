import { test, expect } from '@playwright/test';
import { ContestPage } from '../../pages/ContestPage';

/**
 * Smoke tests – Kho đề (contestx)
 *
 * Mục tiêu: xác nhận trang tải được, các thành phần cốt lõi hiển thị đúng.
 * Không cần auth; chỉ test giao diện public.
 *
 * Selectors khớp DOM thực tế từ olm.vn/contestx:
 *   - Sidebar lớp: ul.sidebar-list-grade li a.olm-a
 *   - Tab môn học: ul.sidebar-list-grade.list-group li a.tab-subject-new
 *   - Dropdown môn: .dropdown button.olm-btn-primary.dropdown-toggle
 *   - Chương: .tab-pane.active .card.mb-2.w-100
 *   - Bài/đề: .tab-pane.active li.list-group-item
 */

test.describe('Kho đề @contest @smoke', () => {

  test('[Smoke] Trang Kho đề tải thành công', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();

    expect(contestPage.isPageLoaded()).toBeTruthy();
    expect(contestPage.getCurrentUrl()).toContain('contestx');
  });

  test('[Smoke] Sidebar lớp hiển thị đủ lớp (Mẫu giáo → Lớp 12)', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();

    // 13 items = Mẫu giáo + Lớp 1 → Lớp 12
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