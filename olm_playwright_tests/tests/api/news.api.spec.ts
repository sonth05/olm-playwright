import { test, expect } from '@playwright/test';
import { TIN_TUC_URL, HOC_TAP_URL, THONG_BAO_NEWS_URL, baiVietDetailUrl } from '../../config/config';

/**
 * Map từ postman/collections/OLM-vn/News - Tin Tuc/
 * - Get Tin Tuc Home       GET /thongtin
 * - Get Article            GET /bai-viet/:articleSlug
 * - Get Hoc Tap Category   GET /chu-de-bai-viet/hoc-tap
 * - Get Thong Bao Category GET /chu-de-bai-viet/thong-bao
 */

test.describe('API @api News - Tin tức', () => {
  test('Get Tin Tuc Home', async ({ request }) => {
    const res = await request.get(TIN_TUC_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Article - slug không tồn tại trả về 404', async ({ request }) => {
    const res = await request.get(baiVietDetailUrl('bai-viet-khong-ton-tai-xyz'));
    expect(res.status()).toBe(404);
  });

  test('Get Hoc Tap Category', async ({ request }) => {
    const res = await request.get(HOC_TAP_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Thong Bao Category', async ({ request }) => {
    const res = await request.get(THONG_BAO_NEWS_URL);
    expect(res.status()).toBe(200);
  });
});