import { test, expect } from '@playwright/test';
import { MUA_VIP_URL, GIO_HANG_URL, GIO_HANG_THU_VIEN_SO_URL } from '../../../config/config';
import { newAuthedApiContext } from '../../../utils/Apiauth';

test.describe('API @api Payment - Mua VIP', () => {
  test('Get Mua VIP Page - public, không cần đăng nhập', async ({ request }) => {
    const res = await request.get(MUA_VIP_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Gio Hang - chưa đăng nhập', async ({ request }) => {
    const res = await request.get(GIO_HANG_URL, { maxRedirects: 0 });
    if (res.status() === 302) {
      expect(res.headers()['location']).toContain('dangnhap');
    } else {
      expect(res.status()).toBe(200);
    }
  });

  test('Get Gio Hang - đã đăng nhập (dùng auth state worker có sẵn)', async () => {
    const ctx = await newAuthedApiContext();
    test.skip(!ctx, 'Chưa có auth state — chạy `npx playwright test` để globalSetup tạo trước');
    const res = await ctx!.get('/gio-hang');
    expect(res.status()).toBe(200);
    await ctx!.dispose();
  });

  test('Get Gio Hang Thu Vien So - đã đăng nhập', async () => {
    const ctx = await newAuthedApiContext();
    test.skip(!ctx, 'Chưa có auth state — chạy `npx playwright test` để globalSetup tạo trước');
    const res = await ctx!.get('/gio-hang-thu-vien-so');
    expect(res.status()).toBe(200);
    await ctx!.dispose();
  });

  test('GIO_HANG_THU_VIEN_SO_URL build đúng path', () => {
    expect(GIO_HANG_THU_VIEN_SO_URL.endsWith('/gio-hang-thu-vien-so')).toBe(true);
  });
});