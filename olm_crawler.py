from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
import time
import pandas as pd

# ====================== CẤU HÌNH ======================
LOGIN_USERNAME = "hsptolm_dothilananh"
LOGIN_PASSWORD = "Thanhson2@"

OUTPUT_FILE = "OLM_Lop1_Full_v6.xlsx"
GRADES = [1]   # Muốn crawl thêm lớp thì sửa thành [1,2,3,...]

service = Service(ChromeDriverManager().install())
options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
# options.add_argument("--headless")  # Bỏ comment nếu không cần xem giao diện

driver = webdriver.Chrome(service=service, options=options)
wait = WebDriverWait(driver, 30)

data = []

def login():
    """Đăng nhập OLM – đã sửa lỗi click nút với class btn-submit."""
    driver.get("https://olm.vn/dangnhap")
    time.sleep(5)

    try:
        # Dọn popup/overlay che form
        driver.execute_script("""
            document.querySelectorAll('.modal, .popup, .overlay, .ads, .cookie-banner, [class*="overlay"]')
                .forEach(el => el.remove());
        """)
        time.sleep(1)

        # Điền thông tin bằng JavaScript
        driver.execute_script(f"""
            document.querySelector('input[name="username"]').value = '{LOGIN_USERNAME}';
            document.querySelector('input[name="password"]').value = '{LOGIN_PASSWORD}';
        """)
        time.sleep(1)

        # Chờ nút Đăng nhập khả dụng
        login_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.btn-submit")))
        if login_btn.get_attribute("disabled"):
            driver.find_element(By.NAME, "password").send_keys(" ")
            time.sleep(0.5)

        driver.execute_script("arguments[0].click();", login_btn)
        print("✅ Đã click nút Đăng nhập")
        time.sleep(3)

        # Nếu vẫn ở trang đăng nhập, thử nhấn Enter
        if "dangnhap" in driver.current_url:
            print("⚠ Thử nhấn Enter...")
            driver.find_element(By.NAME, "password").send_keys("\n")
            time.sleep(5)

        WebDriverWait(driver, 15).until(lambda d: "dangnhap" not in d.current_url)
        print("✅ Đăng nhập thành công!")
        time.sleep(3)

    except Exception as e:
        print(f"❌ Lỗi đăng nhập: {str(e)}")
        driver.save_screenshot("login_error.png")
        driver.quit()
        exit(1)

def extract_course(grade):
    """Crawl khóa học, chủ đề, bài học cho một lớp – không stale element."""
    url = f"https://olm.vn/lop-{grade}"
    driver.get(url)
    time.sleep(6)

    print(f"\n🔍 Đang crawl Lớp {grade}...")

    course_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/bg/']")
    print(f"   Tìm thấy {len(course_links)} link khóa học")

    seen_urls = set()
    for idx, link in enumerate(course_links[:15], 1):  # Có thể bỏ [:15] để crawl hết
        try:
            course_url = link.get_attribute("href")
            course_name = link.text.strip() or link.get_attribute("title") or "Không rõ tên"
            if not course_url or course_url in seen_urls or len(course_name) < 3:
                continue
            seen_urls.add(course_url)

            print(f"   [{idx}/{len(course_links[:15])}] → Đang vào: {course_name}")
            driver.get(course_url)
            time.sleep(8)

            # Mở tab "Nội dung khóa học" nếu có
            try:
                tab = driver.find_element(By.ID, "tab-lessons-all")
                driver.execute_script("arguments[0].click();", tab)
                time.sleep(4)
            except:
                pass

            # Chờ ít nhất 1 chủ đề hoặc bài học xuất hiện
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "h3.collapsible-link, .list-group-item a, .lesson-item a"))
                )
            except TimeoutException:
                print("     ⚠ Không có nội dung, bỏ qua.")
                driver.back()
                time.sleep(3)
                continue

            # Lấy số lượng chủ đề
            topic_selector = "h3.collapsible-link, h3.mb-0.font-md, .card-header h3, .accordion-header, [class*='collapsible'] h3"
            topic_elements = driver.find_elements(By.CSS_SELECTOR, topic_selector)
            num_topics = len(topic_elements)
            print(f"     Tìm thấy {num_topics} chủ đề")

            if num_topics == 0:
                # Không có chủ đề, lấy trực tiếp tất cả bài học
                lesson_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/bai-hoc/'], a[href*='/lesson/'], .list-group-item a")
                for les in lesson_links:
                    try:
                        lesson_name = les.text.strip()
                        if lesson_name and len(lesson_name) > 2 and not any(skip in lesson_name for skip in ["Sách học sinh", "HS", "ma trận đề"]):
                            data.append({"Lớp": f"Lớp {grade}", "Khóa học": course_name, "Chủ đề": "Không phân chủ đề", "Bài học": lesson_name})
                    except StaleElementReferenceException:
                        continue
            else:
                # Duyệt lần lượt từng chủ đề bằng index (tìm lại mỗi lần để tránh stale)
                for i in range(num_topics):
                    try:
                        # Tìm lại danh sách chủ đề hiện tại
                        current_topics = driver.find_elements(By.CSS_SELECTOR, topic_selector)
                        if i >= len(current_topics):
                            break
                        topic_el = current_topics[i]
                        topic_name = topic_el.text.strip()
                        if not topic_name or len(topic_name) < 3:
                            continue
                        print(f"       📑 {topic_name[:80]}...")

                        # Click mở chủ đề (dùng JavaScript để an toàn)
                        driver.execute_script("arguments[0].click();", topic_el)
                        time.sleep(1)

                        # Xác định container bài học của chủ đề này (div collapse tiếp theo)
                        try:
                            container = topic_el.find_element(By.XPATH, "./following-sibling::div[contains(@class,'collapse') or contains(@class,'panel')][1]")
                            wait.until(EC.visibility_of(container))
                        except:
                            container = None

                        # Lấy link bài học trong container hoặc toàn trang nếu không xác định được
                        if container:
                            lesson_links = container.find_elements(By.CSS_SELECTOR, "a[href*='/bai-hoc/'], a[href*='/lesson/'], a")
                        else:
                            lesson_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='/bai-hoc/'], a[href*='/lesson/']")

                        for les in lesson_links:
                            try:
                                lesson_name = les.text.strip()
                                if lesson_name and len(lesson_name) > 2 and not any(skip in lesson_name for skip in ["Sách học sinh", "HS", "ma trận đề"]):
                                    data.append({"Lớp": f"Lớp {grade}", "Khóa học": course_name, "Chủ đề": topic_name, "Bài học": lesson_name})
                            except StaleElementReferenceException:
                                continue
                    except StaleElementReferenceException:
                        continue
                    except Exception as e:
                        print(f"          ⚠ Lỗi chủ đề {i}: {str(e)[:50]}")
                        continue

            # Quay lại danh sách khóa học
            driver.back()
            time.sleep(4)

        except Exception as e:
            print(f"     ❌ Lỗi crawl khóa học: {str(e)[:100]}")
            try:
                driver.get(url)
                time.sleep(5)
            except:
                pass
            continue

# ====================== CHẠY ======================
login()

for grade in GRADES:
    extract_course(grade)

df = pd.DataFrame(data)
df.drop_duplicates(inplace=True)
df.to_excel(OUTPUT_FILE, index=False)

print(f"\n🎉 HOÀN THÀNH!")
print(f"   Tổng số bài học (sau khi lọc trùng): {len(df)}")
print(f"   File đã lưu: {OUTPUT_FILE}")

driver.quit()