import { test, expect } from '@playwright/test';
import { CUOC_THI_URL, CONTEST_URL, baiVietDetailUrl } from '../../../config/config';

test.describe('API @api Contests - Cuộc thi & ContestX', () => {
  test('Get Cuoc Thi Home', async ({ request }) => {
    const res = await request.get(CUOC_THI_URL);
    expect(res.status()).toBe(200);
  });

  test('Get ContestX', async ({ request }) => {
    const res = await request.get(CONTEST_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Contest Detail - slug không tồn tại trả về 404', async ({ request }) => {
    const res = await request.get(baiVietDetailUrl('slug-khong-ton-tai-xyz-123'));
    expect(res.status()).toBe(404);
  });
});