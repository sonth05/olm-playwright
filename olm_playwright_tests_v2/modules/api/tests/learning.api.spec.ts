import { test, expect } from '@playwright/test';
import { HOC_BAI_URL, lopUrl, khoaHocUrl, chuDeUrl } from '../../../config/config';
import { GRADES } from '../../../config/constants';

test.describe('API @api Learning - Học bài', () => {
  test('Get Hoc Bai Home', async ({ request }) => {
    const res = await request.get(HOC_BAI_URL);
    expect(res.status()).toBe(200);
  });

  test('Get Grade Page - lớp 1 đến 12 đều trả 200', async ({ request }) => {
    for (const grade of GRADES) {
      const res = await request.get(lopUrl(grade));
      expect(res.status(), `Lớp ${grade} phải trả 200`).toBe(200);
    }
  });

  test('Get Grade Page - lớp không hợp lệ trả về 404', async ({ request }) => {
    const res = await request.get(lopUrl(99));
    expect(res.status()).toBe(404);
  });

  test('Get Course Page - slug không tồn tại trả về 404', async ({ request }) => {
    const res = await request.get(khoaHocUrl('khoa-hoc-khong-ton-tai-xyz'));
    expect(res.status()).toBe(404);
  });

  test('Get Lesson / Topic Page - mẫu toan-lop-1', async ({ request }) => {
    const res = await request.get(chuDeUrl('toan-lop-1'));
    expect([200, 404]).toContain(res.status());
  });
});