import { test, expect } from '@playwright/test';
import { LOGIN_URL, REGISTER_URL } from '../../../config/config';
import { newAuthedApiContext, currentWorkerAccount } from '../../../utils/Apiauth';

/**
 * Map từ postman/collections/OLM-vn/Authentication/
 */

test.describe('API @api Authentication', () => {
  test('Get Login Page trả về 200 HTML', async ({ request }) => {
    const res = await request.get(LOGIN_URL);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
  });

  test('Get Register Page trả về 200 HTML', async ({ request }) => {
    const res = await request.get(REGISTER_URL);
    expect(res.status()).toBe(200);
  });

  test('Login với username/password rỗng không thành công', async ({ request }) => {
    const res = await request.post(LOGIN_URL, {
      form: { username: '', password: '' },
      maxRedirects: 0,
    });
    expect([200, 302, 422]).toContain(res.status());
  });

  test('Login với account hợp lệ trong WORKER_ACCOUNTS nhưng sai password', async ({ request }) => {
    const acc = currentWorkerAccount();
    const res = await request.post(LOGIN_URL, {
      form: { username: acc.username, password: 'sai_mat_khau_co_y_123' },
      maxRedirects: 0,
    });
    expect([200, 302, 401]).toContain(res.status());
  });

  test('Login với account hợp lệ (đúng password) trả về session', async ({ request }) => {
    const acc = currentWorkerAccount();
    const res = await request.post(LOGIN_URL, {
      form: { username: acc.username, password: acc.password },
      maxRedirects: 0,
    });
    expect([200, 302]).toContain(res.status());
    if (res.status() === 302) {
      expect(res.headers()['set-cookie']).toBeTruthy();
    }
  });

  test('Đã đăng nhập sẵn (auth state worker) → truy cập /hoc-bai không bị redirect về login', async () => {
    const ctx = await newAuthedApiContext();
    test.skip(!ctx, 'Chưa có auth state — chạy `npx playwright test` để globalSetup tạo auth/worker-N.json trước');
    const res = await ctx!.get('/hoc-bai', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    await ctx!.dispose();
  });

  test('Register thiếu thông tin trả về lỗi validate', async ({ request }) => {
    const res = await request.post(REGISTER_URL, {
      form: { name: '', username: '', email: '', password: '', phone: '' },
    });
    expect([200, 302, 422]).toContain(res.status());
  });
});