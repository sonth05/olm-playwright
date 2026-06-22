import { test, expect } from '@playwright/test';
import { BASE_URL } from '../../config/config';

test.describe('API smoke @api', () => {
  test.skip('Placeholder – bổ sung khi có API public OLM', async ({ request }) => {
    const res = await request.get(BASE_URL);
    expect(res.status()).toBeLessThan(500);
  });
});
