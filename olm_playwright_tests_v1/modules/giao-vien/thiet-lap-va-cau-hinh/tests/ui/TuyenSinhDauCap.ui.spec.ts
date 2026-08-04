import { test, expect } from '../../../../../core/fixtures/role.fixture';
import { TuyenSinhDauCapPage, TSDC_FIELD_OPTIONS } from '../../pages/TuyenSinhDauCapPage';

test.describe('Tuyển sinh đầu cấp @tuyen-sinh-dau-cap', () => {

	test('Trang tuyển sinh đầu cấp load thành công', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    expect(tsdcPage.isPageLoaded()).toBeTruthy();
		    expect(await tsdcPage.waitForSettingsVisible()).toBeTruthy();
		    expect(await tsdcPage.getActiveTab()).toBe('thietLap');
		  });

	test('Đọc được thời gian mở đơn đăng ký hiện tại', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    const period = await tsdcPage.getRegistrationPeriod();
		    // Chỉ assert đọc được string hợp lệ (có thể rỗng nếu trường chưa thiết lập),
		    // KHÔNG assert giá trị cụ thể vì đây là cấu hình có thể bị thay đổi bởi test/người dùng khác.
		    expect(typeof period.start).toBe('string');
		    expect(typeof period.end).toBe('string');
		  });

	test('Đọc được link Google Form (nếu có)', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    expect(typeof (await tsdcPage.getGoogleFormLink())).toBe('string');
		  });

	test('Đọc được trạng thái 13 checkbox "Chọn đối tượng tuyển sinh"', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    const checkedZones = await tsdcPage.getCheckedZones();
		    expect(Array.isArray(checkedZones)).toBeTruthy();
		  });

	test('Toggle khối "Lớp 1" và khôi phục lại trạng thái ban đầu', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    const original = await tsdcPage.isZoneChecked('th');

		    await tsdcPage.setZoneChecked('th', !original);
		    expect(await tsdcPage.isZoneChecked('th')).toBe(!original);

		    // Khôi phục lại để không ảnh hưởng các test khác chạy sau
		    await tsdcPage.setZoneChecked('th', original);
		    expect(await tsdcPage.isZoneChecked('th')).toBe(original);
		  });

	test('Bảng tùy chọn thông tin đăng ký có đủ số dòng đã khảo sát', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    const rowCount = await tsdcPage.getFieldRowCount();
		    expect(rowCount).toBeGreaterThanOrEqual(TSDC_FIELD_OPTIONS.length);
		  });

	test('Link trang tuyển sinh công khai (gốc) hiển thị hợp lệ', async ({ teacherPage: page }) => {
		    const tsdcPage = new TuyenSinhDauCapPage(page);
		    await tsdcPage.open();

		    const link = await tsdcPage.getPublicLink();
		    expect(link).toContain('/tsdc/');
		  });

});
