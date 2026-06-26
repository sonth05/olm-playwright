import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { BASE_URL, HEADLESS } from './config/config';
import {
  LOGIN_PASSWORD_SELECTORS,
  LOGIN_SUBMIT_SELECTORS,
  LOGIN_USERNAME_SELECTORS,
} from './config/constants';

// ─── Danh sách accounts ────────────────────────────────────────────────────
// Mỗi account tương ứng 1 file auth riêng → worker lấy theo index
// Thêm account mới: thêm object vào mảng, globalSetup tự xử lý song song.
export const WORKER_ACCOUNTS = [
  {
    username: process.env.OLM_VIP_USERNAME    ?? 'hsptolm_dothilananh',
    password: process.env.OLM_VIP_PASSWORD    ?? 'Thanhson2@',
    label:    'vip_student',
  },
  {
    username: process.env.OLM_SCHOOL_USERNAME ?? 'nguyenthanhson2818',
    password: process.env.OLM_SCHOOL_PASSWORD ?? 'Thanhsin2@',
    label:    'school',
  },
  {
    username: process.env.OLM_NORMAL_USERNAME ?? 'hsptolm_tranducanh',
    password: process.env.OLM_NORMAL_PASSWORD ?? '123456',
    label:    'normal_student',
  },
] as const;

// Auth file cho worker index i = auth/worker-{i}.json
// auth/user.json vẫn giữ (= worker-0) để không break code cũ
export function authPathForWorker(workerIndex: number): string {
  const dir = path.resolve(__dirname, 'auth');
  return path.join(dir, `worker-${workerIndex}.json`);
}

// ─── Login helper ──────────────────────────────────────────────────────────
async function loginAndSave(opts: {
  username: string;
  password: string;
  label: string;
  savePath: string;
  headless: boolean;
}): Promise<void> {
  const { username, password, label, savePath, headless } = opts;

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    locale: 'vi-VN',
  });
  const page = await context.newPage();

  try {
    await page.goto('/dangnhap', { waitUntil: 'domcontentloaded', timeout: 30_000 });

    for (const sel of LOGIN_USERNAME_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await el.fill(username);
        break;
      }
    }

    for (const sel of LOGIN_PASSWORD_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await el.fill(password);
        break;
      }
    }

    for (const sel of LOGIN_SUBMIT_SELECTORS) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await el.click();
        break;
      }
    }

    await page
      .waitForURL((url) => !url.toString().includes('dangnhap'), { timeout: 30_000 })
      .catch(() => {
        console.warn(`[globalSetup] ⚠ ${label}: login có thể chưa thành công – vẫn lưu state`);
      });

    await context.storageState({ path: savePath });
    console.log(`[globalSetup] ✓ ${label} → ${savePath}`);
  } finally {
    await browser.close();
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.resolve(__dirname, 'auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const headless = process.env.CI === 'true' ? true : HEADLESS;

  // Login song song cho tất cả accounts
  await Promise.all(
    WORKER_ACCOUNTS.map((acc, i) =>
      loginAndSave({
        ...acc,
        savePath: authPathForWorker(i),
        headless,
      })
    )
  );

  // Giữ auth/user.json (= worker-0) để không break code cũ
  const legacyPath = path.resolve(__dirname, 'auth/user.json');
  const worker0Path = authPathForWorker(0);
  if (fs.existsSync(worker0Path)) {
    fs.copyFileSync(worker0Path, legacyPath);
    console.log(`[globalSetup] ✓ auth/user.json cập nhật từ worker-0`);
  }
}

export default globalSetup;