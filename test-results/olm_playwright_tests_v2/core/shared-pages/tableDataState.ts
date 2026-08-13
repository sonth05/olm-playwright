// core/shared-pages/tableDataState.ts
//
// VẤN ĐỀ: nhiều trang dạng danh sách (VD "Học liệu đã xóa") viết test kiểu
// `expect(rowCount).toBeGreaterThan(0)` — giả định tài khoản test LUÔN có
// sẵn ít nhất 1 dòng dữ liệu seed. Với những tài khoản chưa từng xóa học
// liệu nào (hoặc môi trường debug mới seed lại DB), rowCount = 0 là kết quả
// ĐÚNG về mặt nghiệp vụ, không phải lỗi — nhưng assertion cứng phía trên vẫn
// fail, khiến người đọc kết quả không phân biệt được đâu là bug thật, đâu
// là "tài khoản này chưa có dữ liệu".
//
// GIẢI PHÁP: tách rõ 2 trường hợp HỢP LỆ khi đăng nhập vào 1 tài khoản:
//   1. 'has-data' — bảng có ít nhất 1 dòng  -> chạy đầy đủ các assertion phụ
//      thuộc dữ liệu (badge, nút hành động, phân trang...).
//   2. 'empty'    — bảng không có dòng nào, NHƯNG trang có hiển thị rõ ràng
//      thông báo dạng "Không có dữ liệu" -> bỏ qua các assertion phụ thuộc
//      dữ liệu, chỉ xác nhận thông báo trống hiển thị đúng.
//
// Nếu KHÔNG rơi vào 1 trong 2 trường hợp trên (không có dòng nào MÀ cũng
// không thấy thông báo trống) -> đây là dấu hiệu của 1 lỗi thật (bảng tải
// lỗi, API fail, hoặc thông báo trống đổi text/selector chưa được cập nhật)
// -> throw để test FAIL RÕ RÀNG, thay vì âm thầm coi là "trống hợp lệ" rồi
// pass giả.

import type { Locator } from '@playwright/test';

export type TableDataState = 'has-data' | 'empty';

export async function resolveTableDataState(
  rows: Locator,
  emptyState: Locator,
  opts: { label?: string; emptyStateTimeoutMs?: number } = {},
): Promise<TableDataState> {
  const { label = 'bảng dữ liệu', emptyStateTimeoutMs = 3_000 } = opts;

  const rowCount = await rows.count();
  if (rowCount > 0) return 'has-data';

  const emptyVisible = await emptyState
    .first()
    .isVisible({ timeout: emptyStateTimeoutMs })
    .catch(() => false);
  if (emptyVisible) return 'empty';

  throw new Error(
    `[resolveTableDataState] ${label}: không có dòng dữ liệu nào NHƯNG cũng ` +
      'không thấy thông báo "không có dữ liệu" hiển thị — có thể bảng chưa ' +
      'tải xong, gọi API lỗi, hoặc thông báo trống đang dùng text/selector ' +
      'khác chưa được cập nhật trong Page Object. KHÔNG coi đây là trường ' +
      'hợp "tài khoản chưa có dữ liệu" để tránh test pass giả — cần kiểm ' +
      'tra lại thủ công trước khi bỏ qua.',
  );
}