import { request, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import { BASE_URL } from '../config/config';
import { authPathForLabel, getWorkerAccountByLabel, type WorkerAccountLabel } from '../global-setup';

/**
 * Helper dùng riêng cho tests/api/*.api.spec.ts.
 *
 * Khác với fixtures/auth.fixture.ts (dành cho UI test, trả về Page),
 * helper này trả về APIRequestContext thuần — không cần khởi động browser,
 * nên test API chạy nhanh hơn nhiều so với UI test.
 *
 * FIX: trước đây chọn tài khoản theo `TEST_WORKER_INDEX % 6` (round-robin)
 * — tài khoản dùng cho 1 test phụ thuộc worker nào chạy nó, đổi tuỳ số
 * lượng test/worker mỗi lần chạy. Giờ CỐ ĐỊNH 1 role cho toàn bộ file, đọc
 * từ env `AUTH_ROLE` (mặc định 'student_vip'), hoặc truyền `role` rõ ràng
 * vào từng hàm khi cần 1 tài khoản cụ thể khác.
 */

const DEFAULT_AUTH_ROLE = (process.env.AUTH_ROLE as WorkerAccountLabel | undefined) ?? 'student_vip';

function getWorkerAuthPath(role: WorkerAccountLabel = DEFAULT_AUTH_ROLE): string {
  return authPathForLabel(role);
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
export async function newAuthedApiContext(
  role: WorkerAccountLabel = DEFAULT_AUTH_ROLE,
): Promise<APIRequestContext | null> {
  const authPath = getWorkerAuthPath(role);
  if (!fs.existsSync(authPath)) return null;

  return request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Accept: 'text/html,application/xhtml+xml',
      Cookie: cookieHeaderFromStorageState(authPath),
    },
  });
}

/** Lấy thông tin account theo role — mặc định DEFAULT_AUTH_ROLE (env AUTH_ROLE).
 *  Dùng khi test cần username/password thật (vd login negative test với account hợp lệ nhưng sai password). */
export function currentWorkerAccount(role: WorkerAccountLabel = DEFAULT_AUTH_ROLE) {
  return getWorkerAccountByLabel(role);
}