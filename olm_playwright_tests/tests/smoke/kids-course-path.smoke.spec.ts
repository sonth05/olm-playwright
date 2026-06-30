/**
 * kids-course-path.smoke.spec.ts
 *
 * Smoke tests nhanh cho màn hình lộ trình học (roadmap) bên trong
 * 1 khóa học OLM Kids (vd: /bg/toan-mau-giao-olm).
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { KidsCoursePathPage } from '../../pages/KidsCoursePathPage';

test.describe('KidsCoursePath @kids-course-path @smoke', () => {

  test('[Happy] Trang lộ trình load thành công @smoke', async ({ authenticatedPage }) => {
    const p = new KidsCoursePathPage(authenticatedPage);
    await p.open();
    expect(p.isPageLoaded()).toBeTruthy();
  });

  test('[Happy] Hiển thị ít nhất 1 node trên lộ trình @smoke', async ({ authenticatedPage }) => {
    const p = new KidsCoursePathPage(authenticatedPage);
    await p.open();
    expect(await p.getSectionItemCount()).toBeGreaterThan(0);
  });

  test('[Happy] Click node đầu tiên mở popup danh sách bài học @smoke', async ({ authenticatedPage }) => {
    const p = new KidsCoursePathPage(authenticatedPage);
    await p.open();
    const total = await p.getSectionItemCount();
    test.skip(total === 0, 'Không có node nào trên lộ trình');

    await p.clickSectionByPosition(1);
    expect(await p.getLessonLinksCount()).toBeGreaterThan(0);
  });
});