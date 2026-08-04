import { test, expect } from '../../../../../core/fixtures/role.fixture';
import { ThietLapTruongHocPage } from '../../pages/ThietLapTruongHocPage';

test.describe('Thiết lập trường học @thiet-lap-truong', () => {

	test('Trang thiết lập trường học load thành công', async ({ teacherPage: page }) => {
		    const thietLapPage = new ThietLapTruongHocPage(page);
		    await thietLapPage.open();

		    expect(thietLapPage.isPageLoaded()).toBeTruthy();
		    expect(await thietLapPage.waitForCardVisible()).toBeTruthy();
		  });

	test('Hiển thị đúng thông tin VIP', async ({ teacherPage: page }) => {
		    const thietLapPage = new ThietLapTruongHocPage(page);
		    await thietLapPage.open();

		    const vipInfo = await thietLapPage.getVipInfo();
		    expect(vipInfo.hanVip.length, 'Phải có nội dung Hạn vip').toBeGreaterThan(0);
		    expect(vipInfo.goiVip.length, 'Phải có nội dung Gói vip').toBeGreaterThan(0);
		  });

	test('Có thể đọc trạng thái 3 checkbox thiết lập', async ({ teacherPage: page }) => {
		    const thietLapPage = new ThietLapTruongHocPage(page);
		    await thietLapPage.open();

		    // Chỉ assert đọc được giá trị boolean hợp lệ, KHÔNG assert giá trị cụ thể
		    // vì đây là cấu hình có thể bị test khác/người dùng thật thay đổi.
		    expect(typeof (await thietLapPage.isCheckboxChecked('choPhepGvcn'))).toBe('boolean');
		    expect(typeof (await thietLapPage.isCheckboxChecked('congKhaiHoSo'))).toBe('boolean');
		    expect(typeof (await thietLapPage.isCheckboxChecked('duyetGiaoAn'))).toBe('boolean');
		  });

	test('Toggle checkbox "Công khai hồ sơ, kế hoạch của trường" và khôi phục lại', async ({
		    teacherPage: page,
		  }) => {
		    const thietLapPage = new ThietLapTruongHocPage(page);
		    await thietLapPage.open();

		    const original = await thietLapPage.isCheckboxChecked('congKhaiHoSo');

		    await thietLapPage.toggleCheckbox('congKhaiHoSo');
		    expect(await thietLapPage.isCheckboxChecked('congKhaiHoSo')).toBe(!original);

		    // Khôi phục lại trạng thái ban đầu để không ảnh hưởng các test khác chạy sau
		    await thietLapPage.setCheckbox('congKhaiHoSo', original);
		    expect(await thietLapPage.isCheckboxChecked('congKhaiHoSo')).toBe(original);
		  });

	test('Select "Thiết lập năm học giao bài" có ít nhất 1 option và chọn được', async ({
		    teacherPage: page,
		  }) => {
		    const thietLapPage = new ThietLapTruongHocPage(page);
		    await thietLapPage.open();

		    const options = await thietLapPage.getNamHocGiaoBaiOptions();
		    expect(options.length, 'Phải có ít nhất 1 năm học để chọn').toBeGreaterThan(0);

		    const targetOption = options[options.length - 1];
		    await thietLapPage.selectNamHocGiaoBai(targetOption.value);

		    expect(await thietLapPage.getSelectedNamHocGiaoBai()).toBe(targetOption.value);
		  });

});
