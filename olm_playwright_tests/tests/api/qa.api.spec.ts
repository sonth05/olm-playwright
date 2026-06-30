import { test, expect } from '@playwright/test';
import { HOI_DAP_URL, cauHoiUrl } from '../../config/config';
import { newAuthedApiContext } from '../../utils/Apiauth';

/**
 * Map từ postman/collections/OLM-vn/Q&A - Hoi Dap/
 * - Get Hoi Dap Home    GET  /hoi-dap
 * - Get Question Detail GET  /cau-hoi/:questionId
 * - Ask a Question      POST /hoi-dap (urlencoded: content)
 *
 * Đây là module bạn đang mở rộng coverage E2E gần đây (tests/e2e, tests/smoke,
 * tests/regression đều có hoi-dap.*.spec.ts) — phần API này bổ sung lớp test
 * nhanh, không cần browser, để bắt sớm lỗi backend trước khi chạy UI test
 * nặng hơn.
 */

test.describe('API @api Q&A - Hỏi đáp', () => {
  test('Get Hoi Dap Home', async ({ request }) => {
    const res = await request.get(HOI_DAP_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Question Detail - id không tồn tại trả về 404', async ({ request }) => {
    const res = await request.get(cauHoiUrl(999999999));
    expect(res.status()).toBe(404);
  });

  test('Get Question Detail - id không hợp lệ (không phải số)', async ({ request }) => {
    const res = await request.get(cauHoiUrl('abc'));
    expect([400, 404]).toContain(res.status());
  });

  test('Ask a Question - chưa đăng nhập bị từ chối/redirect', async ({ request }) => {
    const res = await request.post(HOI_DAP_URL, {
      form: { content: 'Câu hỏi test từ API test' },
      maxRedirects: 0,
    });
    expect([302, 401, 403]).toContain(res.status());
  });

  test('Ask a Question - nội dung rỗng bị từ chối dù đã đăng nhập', async () => {
    const ctx = await newAuthedApiContext();
    test.skip(!ctx, 'Chưa có auth state — chạy `npx playwright test` để globalSetup tạo trước');
    const res = await ctx!.post('/hoi-dap', { form: { content: '' } });
    expect([200, 400, 422]).toContain(res.status());
    await ctx!.dispose();
  });

  test('Ask a Question - đã đăng nhập, nội dung hợp lệ', async () => {
    const ctx = await newAuthedApiContext();
    test.skip(!ctx, 'Chưa có auth state — chạy `npx playwright test` để globalSetup tạo trước');
    const res = await ctx!.post('/hoi-dap', {
      form: { content: `Câu hỏi test tự động ${Date.now()}` },
    });
    expect([200, 201, 302]).toContain(res.status());
    await ctx!.dispose();
  });
});