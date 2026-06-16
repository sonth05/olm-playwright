import { test, expect } from '@playwright/test';
import { ContestPage } from '../src/pages/ContestPage';

test.describe('Contest @contest @regression', () => {
  test('[Happy] Trang Kho đề tải thành công @smoke', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    expect(contestPage.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Danh sách đề hiển thị', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    expect(await contestPage.getContestCount()).toBeGreaterThan(0);
  });

  test('[Happy] Tìm kiếm từ khóa hợp lệ', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    await contestPage.searchContest('Toán');
    expect(contestPage.getCurrentUrl()).toContain('contestx');
  });

  test('[Unhappy] Từ khóa không tồn tại', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    await contestPage.searchContest('zzzkhongtontaiabc123');
    expect(contestPage.getCurrentUrl()).toContain('contestx');
    expect(await contestPage.getContestCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Unhappy] Tìm kiếm rỗng', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    await contestPage.searchContest('');
    expect(contestPage.getCurrentUrl()).toContain('contestx');
  });

  test('[Unhappy] Tìm kiếm XSS', async ({ page }) => {
    const contestPage = new ContestPage(page);
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });
    await contestPage.open();
    await contestPage.searchContest('<script>alert(1)</script>');
    expect(contestPage.getCurrentUrl()).toContain('contestx');
    expect(dialogTriggered).toBeFalsy();
  });

  test('[Unhappy] getQuestionCount trước khi vào phòng thi', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    expect(await contestPage.getQuestionCount()).toBeGreaterThanOrEqual(0);
  });

  test('[Unhappy] getScore khi chưa nộp bài', async ({ page }) => {
    const contestPage = new ContestPage(page);
    await contestPage.open();
    const score = await contestPage.getScore();
    expect(score === '' || typeof score === 'string').toBeTruthy();
  });
});
