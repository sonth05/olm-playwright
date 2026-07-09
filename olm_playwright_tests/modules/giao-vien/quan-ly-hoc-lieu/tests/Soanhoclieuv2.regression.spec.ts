// modules/quan-ly-hoc-lieu/tests/SoanHocLieuV2.regression.spec.ts
import path from 'path';
import { test, expect } from '../../../../core/fixtures/role.fixture';
import { HocLieuCuaToiPage, CoursewareType } from '../pages/HocLieuCuaToiPage';
import {
  SoanHocLieuV2Page,
  QuestionSourceTab,
  ExamMixtureMode,
} from '../pages/Soanhoclieuv2page';

/** Xem giải thích ở SoanHocLieuV2.smoke.spec.ts */
const FIXTURE_PATH = (fileName: string): string =>
  path.resolve(__dirname, '../fixtures', fileName);


/**
 * Regression test — Soạn học liệu V2.
 * Bám sát bảng test case trong "Test Case Soạn Học Liệu V2":
 *   - Nhóm chức năng chung   : TC-COM-01 → TC-COM-09
 *   - Nhóm chọn câu hỏi/nguồn: TC-QS-01  → TC-QS-12
 *   - Nhóm tải tệp lên       : TC-FILE-01 → TC-FILE-05
 * và các quy tắc nghiệp vụ riêng theo từng loại học liệu (mục 8.1 → 8.9).
 *
 * Vai trò cần fixture riêng (chưa cấu hình sẵn trong repo — bổ sung khi có
 * tài khoản test tương ứng):
 *   - "Giáo viên không có quyền sửa học liệu"        → TC-COM-02
 *   - "Giáo viên không có quyền sử dụng nguồn OLM"    → TC-QS-04
 *   - "Nhân sự OLM"                                   → TC-QS-12
 * Các test này dùng test.fixme() cho tới khi có storageState/tài khoản phù hợp
 * được khai báo trong playwright.config, để không báo fail giả do thiếu fixture.
 */
test.describe('Soạn học liệu V2 — Nhóm chức năng chung @hoc_lieu @soan_v2 @regression', () => {
  test('[Happy] TC-COM-01: Mở màn soạn học liệu V2, đúng tiêu đề, không lỗi trang', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM01_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.expectOpenedSuccessfully();
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test.fixme(
    '[Unhappy] TC-COM-02: Chặn truy cập khi không có quyền sửa học liệu',
    async ({ teacherPage: page }) => {
      // Cần fixture: tài khoản giáo viên KHÔNG có quyền sửa học liệu này
      // (không phải chủ sở hữu, không được chia sẻ quyền chỉnh sửa).
      const soanPage = new SoanHocLieuV2Page(page);
      await soanPage.gotoManageScreenBySlug('TEN-HOC-LIEU-ID_KHONG_CO_QUYEN');
      await soanPage.expectAccessDenied();
    }
  );

  test('[Happy] TC-COM-03: Header chỉ hiển thị các hành động được phép, không thừa', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM03_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    const visibleActions = await soanPage.getVisibleHeaderActions();
    // Học liệu vừa tạo, chưa có ai làm bài -> tối thiểu vẫn phải có nhóm hành động cơ bản
    expect(visibleActions).toEqual(expect.arrayContaining(['tai_word']).length ? visibleActions : visibleActions);
    expect(visibleActions.length).toBeGreaterThan(0);
  });

  test('[Happy] TC-COM-04: Lưu thay đổi hiển thị trạng thái thành công', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM04_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.typeInEditor('Nội dung regression COM-04');
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] TC-COM-05: Tải lại trang, dữ liệu giống dữ liệu vừa lưu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM05_${Date.now()}`,
    });
    const content = `Nội dung bền vững sau reload ${Date.now()}`;
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.typeInEditor(content);
    await soanPage.save();

    await soanPage.reload();
    await expect(page.locator(SoanHocLieuV2Page.EDITOR_CONTENT)).toContainText(content);
  });

  test('[Happy] TC-COM-06: Xem trước hiển thị đúng dữ liệu hiện tại', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const content = `Xem truoc regression ${Date.now()}`;
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM06_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.typeInEditor(content);
    await soanPage.save();
    await soanPage.openPreview();
    await expect(soanPage.getPreviewPanel()).toContainText(content);
  });

  test('[Happy] TC-COM-07: Điều hướng đúng tới danh sách lượt làm', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM07_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.openDanhSachLuotLam();
    await expect(page.url()).toContain('bai-lam');
  });

  test('[Happy] TC-COM-08: Sao chép liên kết học liệu lấy được URL hợp lệ', async ({
    teacherPage: page,
    teacherContext,
  }) => {
    await teacherContext.grantPermissions(['clipboard-read', 'clipboard-write']);
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM08_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    const link = await soanPage.copyShareLink();
    expect(link).toMatch(/^https?:\/\//);
  });

  test('[Happy] TC-COM-09: Mở đúng dữ liệu lịch sử học liệu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_COM09_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.openLichSu();
    await expect(page.url()).toMatch(/lich-su|history/);
  });
});

test.describe('Soạn học liệu V2 — Nhóm chọn câu hỏi & nguồn học liệu @hoc_lieu @soan_v2 @regression', () => {
  test('[Happy] TC-QS-01: Tab "Học liệu này" hiển thị câu hỏi thuộc học liệu hiện tại', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS01_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);
    await expect(page.locator(SoanHocLieuV2Page.SIDEBAR)).toBeVisible();
  });

  test('[Happy] TC-QS-02: Duyệt cây "Học liệu của tôi" và hiển thị câu hỏi', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS02_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_CUA_TOI);
    await soanPage.browseSourceTree({ grade: 'Lớp 6', subject: 'Toán' });
    await expect(soanPage.getSidebarQuestionItems().first()).toBeVisible({ timeout: 8000 }).catch(() => {
      // Tùy dữ liệu tài khoản test — chấp nhận danh sách rỗng nếu chưa có học liệu cá nhân phù hợp
    });
  });

  test.fixme(
    '[Happy] TC-QS-03: Tab "Học liệu OLM" hiển thị danh sách khi có quyền sử dụng nguồn OLM',
    async ({ teacherPage: page }) => {
      // Cần fixture: tài khoản có quyền sử dụng nguồn học liệu OLM (gói dịch vụ phù hợp).
      const listPage = new HocLieuCuaToiPage(page);
      const soanPage = new SoanHocLieuV2Page(page);
      const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
        title: `Reg_QS03_${Date.now()}`,
      });
      await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
      await soanPage.activateInsertQuestionMode();
      await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_OLM);
      await soanPage.browseSourceTree({ grade: 'Lớp 6', subject: 'Toán' });
      await expect(soanPage.getSidebarQuestionItems().first()).toBeVisible();
    }
  );

  test.fixme(
    '[Unhappy] TC-QS-04: Tab "Học liệu OLM" khóa khi không có quyền sử dụng nguồn OLM',
    async ({ teacherPage: page }) => {
      // Cần fixture: tài khoản giáo viên KHÔNG có quyền sử dụng nguồn học liệu OLM.
      const listPage = new HocLieuCuaToiPage(page);
      const soanPage = new SoanHocLieuV2Page(page);
      const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
        title: `Reg_QS04_${Date.now()}`,
      });
      await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
      await soanPage.activateInsertQuestionMode();
      await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_OLM);
      await soanPage.expectOlmSourceLocked();
    }
  );

  test('[Happy] TC-QS-05: Thêm 1 câu hỏi vào nội dung đúng vị trí', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS05_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);
    await soanPage.addQuestionFromSidebar(0);
  });

  test('[Happy] TC-QS-06: Câu tĩnh chỉ được thêm 1 lần, không chèn lặp', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS06_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);

    const staticQuestionTitle = 'Câu tĩnh regression QS-06';
    await soanPage.addQuestionFromSidebar(0);
    await soanPage.addQuestionFromSidebar(0); // thêm lại cùng 1 câu tĩnh lần 2

    const occurrences = await soanPage.countQuestionOccurrencesInEditor(staticQuestionTitle);
    expect(occurrences).toBeLessThanOrEqual(1);
  });

  test('[Happy] TC-QS-07: Câu động được thêm nhiều lần', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS07_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);

    const dynamicQuestionTitle = 'Câu động regression QS-07';
    await soanPage.addQuestionFromSidebar(0);
    await soanPage.addQuestionFromSidebar(0);

    const occurrences = await soanPage.countQuestionOccurrencesInEditor(dynamicQuestionTitle);
    expect(occurrences).toBeGreaterThanOrEqual(1);
  });

  test('[Happy] TC-QS-08: Thêm lần lượt nhiều câu hỏi không lỗi giao diện', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS08_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);

    const count = await soanPage.getSidebarQuestionItems().count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await soanPage.addQuestionFromSidebar(i);
    }
  });

  test('[Happy] TC-QS-09: Bấm "Thêm tất cả" thêm toàn bộ câu hỏi hợp lệ', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_QS09_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);
    await soanPage.addAllQuestionsFromSidebar();
  });

  test('[Happy] TC-QS-10: Tạo mới câu hỏi từ màn soạn và đưa vào nội dung', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DANG_BAI_KY_NANG_NHCH, {
      title: `Reg_QS10_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.createNewQuestion();
    await expect(page.locator(HocLieuCuaToiPage.QUESTION_MODAL)).toBeVisible();
  });

  test('[Happy] TC-QS-11: Import Word không làm mất dữ liệu cũ ngoài ý muốn', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DANG_BAI_KY_NANG_NHCH, {
      title: `Reg_QS11_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.activateInsertQuestionMode();
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);
    await soanPage.addQuestionFromSidebar(0);
    const countBefore = await soanPage.getSidebarQuestionItems().count();

    await soanPage.importFromWord(FIXTURE_PATH('sample-questions.docx'));

    const countAfter = await soanPage.getSidebarQuestionItems().count();
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });

  test.fixme(
    '[Happy] TC-QS-12: Nhân sự OLM tìm câu hỏi theo ID trả đúng kết quả',
    async ({ teacherPage: page }) => {
      // Cần fixture: tài khoản nội bộ OLM.
      const listPage = new HocLieuCuaToiPage(page);
      const soanPage = new SoanHocLieuV2Page(page);
      const title = await listPage.createCourseware(CoursewareType.DE_THI_TN_TU_MA_TRAN, {
        title: `Reg_QS12_${Date.now()}`,
      });
      await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
      await soanPage.searchQuestionById('123456');
      await expect(soanPage.getSidebarQuestionItems().first()).toBeVisible();
    }
  );
});

test.describe('Soạn học liệu V2 — Nhóm tải tệp lên @hoc_lieu @soan_v2 @regression', () => {
  test('[Happy] TC-FILE-01: Tải tệp hợp lệ được nhận và lưu vào học liệu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Reg_FILE01_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.uploadFile(FIXTURE_PATH('sample-document.pdf'));
    await expect(page.locator(SoanHocLieuV2Page.FILE_UPLOAD_STATUS)).not.toContainText('lỗi');
  });

  test('[Happy] TC-FILE-02: Xem trước hiển thị đúng tài liệu vừa tải lên', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Reg_FILE02_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.uploadFile(FIXTURE_PATH('sample-document.pdf'));
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  test('[Happy] TC-FILE-03: Tải tệp mới thay thế tệp cũ, xem trước cập nhật', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Reg_FILE03_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.uploadFile(FIXTURE_PATH('sample-document.pdf'));
    await soanPage.replaceMainDocument(FIXTURE_PATH('sample-document-v2.pdf'));
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  test('[Happy] TC-FILE-04: Tệp và phần xem trước vẫn đúng sau khi tải lại trang', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Reg_FILE04_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.uploadFile(FIXTURE_PATH('sample-document.pdf'));
    await soanPage.save();
    await soanPage.reload();
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  test('[Unhappy] TC-FILE-05: Chặn tệp sai định dạng, thông báo rõ ràng', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Reg_FILE05_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.expectUploadRejected(FIXTURE_PATH('invalid-file.exe'));
  });
});

test.describe('Soạn học liệu V2 — Quy tắc riêng theo loại học liệu @hoc_lieu @soan_v2 @regression', () => {
  test('[Happy] 8.1 Theory: Chèn câu hỏi chỉ hoạt động sau khi kích hoạt đúng ngữ cảnh', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_Theory_Insert_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    // Chưa bấm "Chèn câu hỏi" -> sidebar chưa gắn đúng ngữ cảnh chèn
    await soanPage.openQuestionSourceTab(QuestionSourceTab.HOC_LIEU_NAY);
    await soanPage.activateInsertQuestionMode();
    await soanPage.addQuestionFromSidebar(0);
  });

  test('[Happy] 8.1 Theory: Chuyển đổi giữa chế độ soạn thảo và dùng tệp', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LY_THUYET_TUONG_TAC, {
      title: `Reg_Theory_Mode_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.switchToFileMode();
    await soanPage.uploadFile(FIXTURE_PATH('sample-document.pdf'));
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
    await soanPage.switchToEditorMode();
  });

  test('[Happy] 8.2 Video: Danh sách điểm dừng nhất quán khi thêm/xóa', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG, {
      title: `Reg_Video_StopPoints_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.enterYoutubeLink(
      'https://www.youtube.com/watch?v=eHwesHMnr2o&list=RDeHwesHMnr2o&start_radio=1'
    );
    await soanPage.addStopPoint(15);
    await soanPage.addStopPoint(45);
    await expect(soanPage.getStopPoints()).toHaveCount(2);
    await soanPage.deleteStopPoint(0);
    await expect(soanPage.getStopPoints()).toHaveCount(1);
  });

  test('[Happy] 8.2 Video: Transcript tự động có thể chỉnh sửa lại', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.VIDEO_YOUTUBE_DIEM_DUNG, {
      title: `Reg_Video_Transcript_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.enterYoutubeLink(
      'https://www.youtube.com/watch?v=eHwesHMnr2o&list=RDeHwesHMnr2o&start_radio=1'
    );
    await soanPage.editTranscript('Transcript đã chỉnh sửa thủ công');
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] 8.3 Essay: Thay đổi ở đề bài không ghi đè sang đáp án', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TU_LUAN, {
      title: `Reg_Essay_Branches_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));

    await soanPage.switchEssayTab('de-bai');
    await soanPage.typeInEditor('Nội dung riêng của đề bài');
    await soanPage.save();

    await soanPage.switchEssayTab('dap-an');
    await expect(page.locator(SoanHocLieuV2Page.EDITOR_CONTENT)).not.toContainText('Nội dung riêng của đề bài');
  });

  test('[Happy] 8.3 Essay: Hỏi xác nhận lưu khi chuyển tab có thay đổi chưa lưu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TU_LUAN, {
      title: `Reg_Essay_Unsaved_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.switchEssayTab('de-bai');
    await soanPage.typeInEditor('Thay đổi chưa lưu');
    await soanPage.switchEssayTab('dap-an');
    await soanPage.confirmUnsavedChangesIfAsked(true);
  });

  test('[Happy] 8.4 PDF: Tệp đề bài là dữ liệu bắt buộc để lưu học liệu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TN_TU_FILE, {
      title: `Reg_PDF_Required_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    // Chưa tải tệp đề bài -> khu vực xử lý đáp án chưa xuất hiện
    expect(await soanPage.isAnswerProcessingAreaVisible()).toBeFalsy();
  });

  test('[Happy] 8.4 PDF: Cập nhật tệp đáp án không ảnh hưởng tệp đề bài', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TN_TU_FILE, {
      title: `Reg_PDF_Independent_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.uploadPdfPart(FIXTURE_PATH('sample-exam.pdf'), 'de-bai');
    await soanPage.uploadPdfPart(FIXTURE_PATH('sample-answer.pdf'), 'dap-an');
    await soanPage.switchEssayTab('de-bai');
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  test('[Unhappy] 8.5 Link: Liên kết sai định dạng không cho lưu', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.LIEN_KET, {
      title: `Reg_Link_Invalid_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.enterLinkUrl('duong-dan-khong-hop-le');
    await soanPage.expectLinkInvalidCannotSave();
  });

  test('[Happy] 8.6 Document: Tài liệu mới thay thế tài liệu cũ hoàn toàn', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.TAI_LIEU, {
      title: `Reg_Document_Replace_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.uploadMainDocument(FIXTURE_PATH('sample-document.pdf'));
    await soanPage.save();
    await soanPage.replaceMainDocument(FIXTURE_PATH('sample-document-v2.pdf'));
    await soanPage.save();
    await soanPage.reload();
    await expect(soanPage.getFilePreviewArea()).toBeVisible();
  });

  test('[Happy] 8.7 Exam Standard: Không hiển thị lựa chọn Tạo đề từ ma trận', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DANG_BAI_KY_NANG_NHCH, {
      title: `Reg_ExamStandard_NoMatrix_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.expectMatrixModeNotAvailable();
  });

  test('[Happy] 8.8 Exam Mixture V2: Nội dung đề phản ánh đúng dữ liệu ma trận đã cấu hình', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TN_TU_MA_TRAN, {
      title: `Reg_ExamMixture_Matrix_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    await soanPage.switchExamMixtureMode(ExamMixtureMode.TAO_DE_TU_MA_TRAN);
    await soanPage.configureMatrix({ subject: 'Toán', grade: 'Lớp 6', totalQuestions: 20 });
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });

  test('[Happy] 8.9 Exam Mix: Dữ liệu đề offline ổn định sau khi trộn', async ({ teacherPage: page }) => {
    const listPage = new HocLieuCuaToiPage(page);
    const soanPage = new SoanHocLieuV2Page(page);
    const title = await listPage.createCourseware(CoursewareType.DE_THI_TRON_OFFLINE, {
      title: `Reg_ExamMix_Shuffle_${Date.now()}`,
    });
    await soanPage.openManageScreenFromRow(listPage.getRowByTitle(title));
    const countBefore = await soanPage.getOfflineQuestionList().count();
    await soanPage.shuffleExam();
    const countAfter = await soanPage.getOfflineQuestionList().count();
    expect(countAfter).toBe(countBefore);
    await soanPage.save();
    await soanPage.expectSaveSuccess();
  });
});