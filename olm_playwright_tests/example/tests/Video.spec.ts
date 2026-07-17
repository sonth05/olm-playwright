import { test, expect } from '../../core/fixtures/V2authoringrole.fixture';
import { VideoPage } from '../page/Materialpages';
import { QuestionSourceSidebar } from '../page/Questionsourcesidebar';
/**
 * 3. Học liệu Video - TC-VID-01..18.
 * 3 nhóm nghiệp vụ: Youtube + điểm dừng | Upload video bài giảng | Tài nguyên đi kèm.
 */
const HOC_LIEU_URL = '/chu-de/hoc-lieu-video-demo/quan-ly';
const VALID_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const INVALID_YOUTUBE_URL = 'https://khong-phai-youtube.example.com/abc';
const VALID_VIDEO_FILE = 'fixtures/files/bai-giang-mau.mp4';
const VALID_PPTX_FILE = 'fixtures/files/bai-giang-dinh-kem.pptx';

test.describe('TC-VID: Học liệu Video', () => {
  test('TC-VID-01: Nhập liên kết Youtube hợp lệ -> video hiển thị đúng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.setYoutubeLink(VALID_YOUTUBE_URL);
    await video.expectVideoPlayable();
  });

  test('TC-VID-02: Nhập liên kết Youtube không hợp lệ -> không phát được', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.setYoutubeLink(INVALID_YOUTUBE_URL);
    await expect(video.videoPlayer).toHaveCount(0);
  });

  test('TC-VID-03: Thêm điểm dừng mới trên video', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);
    await video.setYoutubeLink(VALID_YOUTUBE_URL);
    await video.expectVideoPlayable();

    const before = await video.stopPointItems.count();
    await video.addStopPointAtCurrentTime();
    await expect.poll(() => video.stopPointItems.count()).toBe(before + 1);
  });

  test('TC-VID-04: Xem danh sách điểm dừng đúng theo video hiện tại', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.openStopPointList();
    await expect(video.stopPointDrawer).toBeVisible();
  });

  test('TC-VID-05: Sửa thời gian điểm dừng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.editStopPointTime(0, '00:30');
    await expect(video.stopPointItemAt(0)).toContainText('00:30');
  });

  test('TC-VID-06: Xóa 1 điểm dừng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    const before = await video.stopPointItems.count();
    await video.deleteStopPoint(0);
    await expect.poll(() => video.stopPointItems.count()).toBe(before - 1);
  });

  test('TC-VID-07: Xóa toàn bộ điểm dừng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.deleteAllStopPoints();
    await expect(video.stopPointItems).toHaveCount(0);
  });

  test('TC-VID-08: Gắn câu hỏi vào điểm dừng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);
    const sidebar = new QuestionSourceSidebar(page);

    await video.attachQuestionToStopPoint(0, sidebar, 0);
    await expect(video.stopPointDrawer).toContainText(/câu hỏi/i);
  });

  test('TC-VID-09: Tải lên video bài giảng thành công', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.uploadLectureVideo(VALID_VIDEO_FILE);
    await expect(page.getByText(/tải lên thành công|hoàn tất/i)).toBeVisible({ timeout: 30_000 });
  });

  test('TC-VID-10: Hủy tải lên video bài giảng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.uploadLectureVideo(VALID_VIDEO_FILE);
    await video.cancelUpload();
    await expect(page.getByText(/đã hủy|dừng tải lên/i)).toBeVisible();
  });

  test('TC-VID-11: Thử lại khi tải video lỗi', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    if (!(await video.btnRetryUpload.isVisible().catch(() => false))) {
      test.skip(true, 'Không có trạng thái lỗi để test thử lại (cần mock lỗi mạng riêng)');
    }
    await video.retryUpload();
    await expect(page.getByText(/đang tải lên/i)).toBeVisible();
  });

  test('TC-VID-12: Tải bài giảng đính kèm', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.tabAttachment.click();
    await video.attachment.uploadFile(VALID_PPTX_FILE);
    await video.attachment.expectPreviewVisible();
  });

  test('TC-VID-13: Soạn tóm tắt bài giảng', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    const summary = `Tóm tắt bài giảng ${Date.now()}`;
    await video.writeSummary(summary);
    await video.save();
    await video.reloadAndVerify(async () => {
      await video.tabSummary.click();
      await expect(page.locator('[data-testid="summary-editor"]')).toContainText(summary); // TODO
    });
  });

  test('TC-VID-14: Tạo transcript tự động', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.openAutoTranscriptTab();
    await expect(video.transcriptEditor).not.toBeEmpty({ timeout: 20_000 });
  });

  test('TC-VID-15: Bật/tắt hiển thị transcript', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);
    await video.openAutoTranscriptTab();

    await video.toggleTranscriptVisibility();
    await expect(video.transcriptEditor).toBeVisible();
    await video.toggleTranscriptVisibility();
    await expect(video.transcriptEditor).toBeHidden();
  });

  test('TC-VID-16: Chỉnh sửa transcript', async ({ getPageAsRole }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);
    await video.openAutoTranscriptTab();

    const newText = `Nội dung transcript đã sửa ${Date.now()}`;
    await video.editTranscript(newText);
    await video.save();
    await video.reloadAndVerify(async () => {
      await video.openAutoTranscriptTab();
      await expect(video.transcriptEditor).toContainText(newText);
    });
  });

  test('TC-VID-17 & TC-VID-18: Lưu toàn bộ học liệu video và giữ đúng sau khi tải lại', async ({
    getPageAsRole,
  }) => {
    const page = await getPageAsRole('editableTeacher');
    const video = new VideoPage(page);
    await video.goto(HOC_LIEU_URL);

    await video.setYoutubeLink(VALID_YOUTUBE_URL);
    await video.addStopPointAtCurrentTime();
    await video.save();
    await video.expectSavedSuccessfully();

    await video.reloadAndVerify(async () => {
      await video.expectVideoPlayable();
      await expect(video.stopPointItems).toHaveCount(1);
    });
  });
});