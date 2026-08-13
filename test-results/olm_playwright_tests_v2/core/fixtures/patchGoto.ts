import type { Page } from '@playwright/test';
import { appendV2Param } from '../../config/config';

/**
 * Monkey-patch `page.goto()` NGAY KHI Page được tạo trong fixture, để MỌI
 * lời gọi goto() sau đó — kể cả gọi thẳng `this.page.goto(url)` từ page
 * object (VD: BaseHocLieuV2Page.gotoDirectly()) hoặc code viết THÊM SAU
 * NÀY mà lỡ quên gọi qua BasePage.navigateTo() — đều tự động được gắn
 * thêm `?v=v2` qua appendV2Param(), KHÔNG cần nhớ gọi thủ công.
 *
 * Đặt patch tại nguồn tạo Page (fixture), không đặt ở BasePage, vì:
 *   - BasePage.navigateTo() chỉ chặn được các page object ĐI QUA nó.
 *   - Nhiều chỗ trong project gọi thẳng `this.page.goto(...)`
 *     (VD: BaseHocLieuV2Page.gotoDirectly(), test spec gọi trực tiếp),
 *     hoàn toàn không đụng tới BasePage.navigateTo().
 *   - Patch ở fixture đảm bảo appendV2Param() luôn chạy trước khi request
 *     network thật sự được gửi đi, bất kể call site nào trong code test.
 *
 * appendV2Param() tự bỏ qua nếu url đã có sẵn `v=v2` (xem docblock trong
 * config/config.ts) nên gọi lại nhiều lần / patch nhiều page không bị lặp
 * param.
 *
 * Idempotent: nếu 1 Page đã được patch trước đó (VD: page truyền qua
 * nhiều lớp fixture lồng nhau) thì gọi lại patchGotoWithV2() sẽ no-op,
 * tránh double-wrap khiến goto() gọi appendV2Param() nhiều lần không cần
 * thiết (vô hại vì appendV2Param() idempotent, nhưng vẫn nên tránh).
 */
const PATCHED_FLAG = Symbol('olm:gotoPatchedWithV2');

export function patchGotoWithV2(page: Page): Page {
  if ((page as unknown as Record<symbol, boolean>)[PATCHED_FLAG]) {
    return page;
  }

  const originalGoto = page.goto.bind(page);

  page.goto = ((url: string, options?: Parameters<Page['goto']>[1]) => {
    return originalGoto(appendV2Param(url), options);
  }) as Page['goto'];

  (page as unknown as Record<symbol, boolean>)[PATCHED_FLAG] = true;

  return page;
}