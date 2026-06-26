import { expect, chromium } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { HeaderComponent } from '../../components/HeaderComponent';
import { HocBaiPage } from '../../pages/HocBaiPage';
import { authPathForWorker } from '../../global-setup';

test.describe('User journey @e2e', () => {

  /**
   * Trang "Học bài" chỉ hiển thị với tài khoản HỌC SINH.
   * Dùng worker-2 (normal_student) để đảm bảo đúng role.
   * worker-0 = vip_student ✓  worker-1 = school ✗  worker-2 = normal_student ✓
   */
  test('Trang chủ → Học bài → Lớp 1', async ({ browser }) => {
    // Dùng thẳng worker-0 (vip_student) - học sinh có menu Học bài
    const context = await browser.newContext({ storageState: authPathForWorker(0) });
    const page    = await context.newPage();

    try {
      const header = new HeaderComponent(page);

      // 1. Trang chủ
      await header.openHome();
      expect(page.url()).toContain('olm.vn');

      // 2. Navigate thẳng đến /hoc-bai (không click nav vì nav có thể không có với giáo viên)
      const hocBai = new HocBaiPage(page);
      await hocBai.open();
      await page.waitForURL('**/hoc-bai**', { timeout: 15_000 }).catch(() => {});
      await hocBai.closePopupIfPresent();

      expect(page.url()).toContain('hoc-bai');

      // 3. Vào Lớp 1
      await hocBai.navigateToGrade(1);
      await page.waitForURL('**/lop-1**', { timeout: 15_000 }).catch(() => {});

      expect(page.url()).toContain('lop-1');
    } finally {
      await context.close();
    }
  });

});