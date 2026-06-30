import { test, expect } from '@playwright/test';
import { THU_VIEN_SO_URL, SACH_GIAO_KHOA_URL, TAP_CHI_URL, docSachUrl } from '../../config/config';

/**
 * Map từ postman/collections/OLM-vn/Digital Library - Thu Vien So/
 * - Get Thu Vien So Home  GET /thu-vien-so
 * - Get Sach Giao Khoa    GET /thu-vien-so/sach-giao-khoa  (?grade=&type= — bị disabled trong Postman gốc)
 * - Get Tap Chi           GET /thu-vien-so/tap-chi
 * - Read Book             GET /doc-sach/:bookSlug
 */

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