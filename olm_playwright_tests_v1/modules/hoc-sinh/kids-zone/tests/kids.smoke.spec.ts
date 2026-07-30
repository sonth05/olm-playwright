/**
 * kids.smoke.spec.ts
 */

import { expect } from '@playwright/test';
import { test } from '../../../../fixtures/auth.fixture';
import { KidsPage } from '../pages/KidsPage';

test.describe('Kids @kids @smoke', () => {

	test('[Happy] /kids load thành công @smoke', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(p.isPageLoaded()).toBeTruthy();
		expect(p.getCurrentUrl()).toContain('/kids');
	});

	test('[Happy] Hiển thị thông tin học sinh (tên, điểm thưởng) @smoke', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(await p.isStudentBoxVisible()).toBeTruthy();
		expect((await p.getStudentName()).length).toBeGreaterThan(0);
	});

	test('[Happy] Hiển thị danh sách "Khóa học OLM" @smoke', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(await p.hasCoursesHeading()).toBeTruthy();
		expect(await p.getCourseCount()).toBeGreaterThan(0);
	});

	test('[Happy] Footer hiển thị đầy đủ @smoke', async ({ authenticatedPage }) => {
		const p = new KidsPage(authenticatedPage);
		await p.open();
		expect(await p.isFooterVisible()).toBeTruthy();
	});
});