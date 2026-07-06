import { test, expect } from '@playwright/test';
import { THU_VIEN_SO_URL, SACH_GIAO_KHOA_URL, TAP_CHI_URL, docSachUrl } from '../../../config/config';

test.describe('API @api Digital Library - Thư viện số', () => {
  test('Get Thu Vien So Home', async ({ request }) => {
    const res = await request.get(THU_VIEN_SO_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Sach Giao Khoa - không filter', async ({ request }) => {
    const res = await request.get(SACH_GIAO_KHOA_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Sach Giao Khoa - filter theo grade + type', async ({ request }) => {
    const res = await request.get(SACH_GIAO_KHOA_URL, { params: { grade: '1', type: 'toan' } });
    expect(res.status()).toBe(200);
  });

  test('Get Tap Chi', async ({ request }) => {
    const res = await request.get(TAP_CHI_URL);
    expect(res.status()).toBe(200);
  });

  test('Read Book - slug không tồn tại trả về 404', async ({ request }) => {
    const res = await request.get(docSachUrl('sach-khong-ton-tai-xyz'));
    expect(res.status()).toBe(404);
  });
});