/**
 * Regression: HS học bài lý thuyết → làm bài tập trong bài học (tự học, không qua giao bài).
 *
 * Dùng các method có sẵn trong LessonPage:
 *   hasExercises / clickSubmit / getResult / clickNextQuestion
 *
 * Tags: @regression @learning-core @lesson-exercise
 */
import { test, expect } from '../../../fixtures/auth.fixture';
import { LessonPage } from '../../../pages/LessonPage';
import { SAMPLE_LUYEN_TAP_URL } from '../../../config/testData';
import { khoiDongLuyenTap, loopLuyenTapPartial } from '../../../scripts/lamBaiEngine';

test.describe('Làm bài tập trong bài học @learning-core @regression', () => {
  test.setTimeout(3 * 60_000);

  test('VIP HS vào bài luyện tập → hasExercises → làm bài → nộp → có kết quả', async ({
    authenticatedPage: page,
  }) => {
    const lessonPage = new LessonPage(page);

    await test.step('Mở bài luyện tập Toán 9', async () => {
      await lessonPage.open(SAMPLE_LUYEN_TAP_URL);
      expect(lessonPage.isPageLoaded()).toBeTruthy();
    });

    await test.step('Khởi động phiên luyện tập (Luyện tập lại nếu cần)', async () => {
      await khoiDongLuyenTap(page);
    });

    await test.step('LessonPage.hasExercises() phải true khi đang ở màn hình câu hỏi', async () => {
      const hasEx = await lessonPage.hasExercises();
      expect(hasEx, 'Trang bài học phải có khung câu hỏi/bài tập').toBe(true);
    });

    await test.step('Làm tối thiểu 1 câu qua engine (partial loop)', async () => {
      await loopLuyenTapPartial(page, 3);
    });

    await test.step('Nộp bài qua LessonPage.clickSubmit()', async () => {
      const hetLuot =
        (await page.locator("xpath=//*[contains(text(),'làm hết một lượt')]").count()) > 0;
      if (hetLuot) {
        await lessonPage.clickSubmit();
      }
    });

    await test.step('LessonPage.getResult() hoặc màn hình kết quả phải có dữ liệu', async () => {
      const resultText = await lessonPage.getResult();
      const pageHasScore =
        resultText.length > 0 ||
        (await page
          .locator(
            "xpath=//*[contains(text(),'điểm') or contains(text(),'Điểm') or contains(text(),'kết quả') or contains(text(),'Kết quả')]"
          )
          .first()
          .isVisible({ timeout: 8_000 })
          .catch(() => false));

      expect(
        pageHasScore,
        'Sau khi nộp bài phải thấy panel kết quả hoặc text điểm/kết quả trên trang'
      ).toBeTruthy();
    });
  });
});
