import { request, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import { BASE_URL } from '../config/config';
import { authPathForWorker, WORKER_ACCOUNTS } from '../global-setup';

/**
 * Helper dùng riêng cho tests/api/*.api.spec.ts.
 *
 * Khác với fixtures/auth.fixture.ts (dành cho UI test, trả về Page),
 * helper này trả về APIRequestContext thuần — không cần khởi động browser,
 * nên test API chạy nhanh hơn nhiều so với UI test.
 *
 * Tái dùng đúng cơ chế round-robin worker account đã có trong global-setup.ts:
 * worker N (theo TEST_WORKER_INDEX) → auth/worker-{N % 6}.json
 */

function getWorkerAuthPath(): string {
  const idx = Number(process.env.TEST_WORKER_INDEX ?? 0);
  const slot = idx % WORKER_ACCOUNTS.length;
  return authPathForWorker(slot);
}

function cookieHeaderFromStorageState(storageStatePath: string): string {
  const raw = fs.readFileSync(storageStatePath, 'utf-8');
  const state = JSON.parse(raw);
  return (state.cookies ?? [])
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join('; ');
}

/** Request context KHÔNG đăng nhập — dùng cho các trang public. */
export async function newGuestApiContext(): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Accept: 'text/html,application/xhtml+xml' },
  });
}

/**
 * Request context CÓ đăng nhập, lấy cookie từ auth state của worker hiện tại.
 * Trả về null nếu chưa có auth state (chưa chạy globalSetup) — test nên
 * `test.skip()` khi gặp null thay vì throw, để không fail toàn bộ suite
 * khi chạy `playwright test tests/api` độc lập mà chưa qua globalSetup.
 */
export async function newAuthedApiContext(): Promise<APIRequestContext | null> {
  const authPath = getWorkerAuthPath();
  if (!fs.existsSync(authPath)) return null;

  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Accept: 'text/html,application/xhtml+xml',
      Cookie: cookieHeaderFromStorageState(authPath),
    },
  });
}

/** Lấy thông tin account của worker hiện tại — dùng khi test cần username/password thật (vd login negative test với account hợp lệ nhưng sai password). */
export function currentWorkerAccount() {
  const idx = Number(process.env.TEST_WORKER_INDEX ?? 0);
  const slot = idx % WORKER_ACCOUNTS.length;
  return WORKER_ACCOUNTS[slot];
}