OLM.VN - Cấu trúc Nghiệp vụ Toàn hệ thống (Business Architecture)
════════════════════════════════════════════════════════════════════

1. QUẢN LÝ TÀI KHOẢN
│
├── 1.1 Đăng ký
│   ├── Đăng ký bằng email / SĐT
│   ├── Đăng nhập bằng CSDL GDĐT Hà Nội (SSO)
│   └── Popup nhận ưu đãi khi đăng ký (nhập SĐT)
│
├── 1.2 Đăng nhập
│   ├── Đăng nhập thường
│   └── Xác thực 2FA (OTP gửi về email)
│       ├── Nhập mã OTP
│       └── Thông báo sai mã
│
├── 1.3 Hồ sơ cá nhân
│   ├── Thông tin tài khoản (/thong-tin-tai-khoan/info)
│   ├── Đổi mật khẩu
│   ├── Học bạ - lịch sử học tập (/thongke)
│   └── Giới thiệu bạn bè (/intro-invite)
│
└── 1.4 Quản lý gói dịch vụ
    ├── Nâng cấp VIP (/mua-vip)
    ├── Ví của tôi - coin/xu (/vi-cua-toi)
    │   ├── Tặng coin cho người khác
    │   ├── Xác nhận giao dịch
    │   └── Lịch sử giao dịch OlmClass (/lich-su-giao-dich-olmclass)
    └── Giỏ hàng (/gio-hang)


2. HỌC BÀI (/hoc-bai)
│
├── 2.1 Chọn cấp học
│   ├── Mầm non → /lop-mau-giao
│   ├── Tiểu học → Lớp 1–5
│   ├── THCS → Lớp 6–9
│   └── THPT → Lớp 10–12
│
├── 2.2 Chọn lớp → /lop-{n}
│   ├── Danh sách khóa học theo môn
│   ├── Tab: Chương trình chính (Kết nối tri thức)
│   └── Tab: Tham khảo (Cánh diều / Chân trời sáng tạo)
│
├── 2.3 Chọn môn → /lop-{n}-mon-{ten}
│   ├── Danh sách chương / bài học
│   ├── Tiến độ học (% hoàn thành)
│   └── Nút "Tiếp tục học bài"
│
└── 2.4 Bài học chi tiết
    ├── Video bài giảng
    ├── Audio / Đọc hiểu
    ├── Bài tập tương tác
    │   ├── Trắc nghiệm (Multiple Choice)
    │   ├── Điền vào chỗ trống (Fill Blank)
    │   ├── Kéo thả (Drag & Drop)
    │   ├── Ghép đôi (Matching)
    │   ├── Sắp xếp thứ tự (Ordering)
    │   └── Câu hỏi tương tác hình ảnh (mới 2026)
    ├── Nộp bài / Kiểm tra kết quả
    └── Câu hỏi tiếp theo


3. HỎI ĐÁP (/hoi-dap)
│
├── 3.1 Lọc câu hỏi
│   ├── Theo lớp: Mẫu giáo → Lớp 12 → ĐH-CĐ
│   └── Theo môn: Toán / Vật lý / Hóa / Sinh / Văn / Anh /
│               Lịch sử / Địa / Tin / Công nghệ / GDCD /
│               Âm nhạc / Mỹ thuật / Thể dục / Khoa học /
│               Tự nhiên-Xã hội / Đạo đức / Thủ công /
│               QPAN / Tiếng Việt / KHTN
│
├── 3.2 Danh sách câu hỏi
│   ├── Tất cả
│   ├── Mới nhất (/hoi-dap/newq)
│   ├── Câu hỏi hay (/hoi-dap/cau-hoi-hay)
│   ├── Chưa trả lời (?select=1)
│   └── Câu hỏi VIP (?select=3)
│
├── 3.3 Đặt câu hỏi
│   ├── Nhập nội dung câu hỏi
│   ├── Gắn tag môn học / khóa học
│   └── Ưu tiên trả lời cho VIP
│
├── 3.4 Trả lời câu hỏi
│   ├── Xem câu trả lời
│   ├── Vote "Đúng"
│   └── Xem thêm câu trả lời (load more)
│
└── 3.5 Tìm kiếm câu hỏi
    └── /hoi-dap/tim-kiem?id=...&q=...


4. KHO ĐỀ KIỂM TRA (/contestx)
│
├── 4.1 Danh sách đề theo lớp
│   ├── Lớp 1–5: ~28 bài kiểm tra / lớp
│   ├── Lớp 6–7: ~17 bài kiểm tra / lớp
│   └── Lớp 8–9: ~11 bài kiểm tra / lớp
│
├── 4.2 Lọc đề
│   ├── Theo lớp
│   ├── Theo môn
│   └── Theo độ khó
│
├── 4.3 Làm bài kiểm tra online
│   ├── Chọn đề → vào phòng thi
│   ├── Đếm giờ làm bài
│   └── Nộp bài / Xem đáp án
│
└── 4.4 Tạo ma trận đề (dành cho Giáo viên)
    ├── Chọn dạng câu hỏi
    ├── Phân bổ điểm
    └── Xuất đề


5. ĐÁNH GIÁ NĂNG LỰC - ĐGNL (dgnl.olm.vn)
│
├── 5.1 Luyện tập ĐGNL
├── 5.2 Thi thử ĐGNL
└── 5.3 Báo cáo năng lực cá nhân


6. THI THỬ TỐT NGHIỆP THPT
│   URL: /bg/thi-thu-tot-nghiep-trung-hoc-pho-thong
│
├── 6.1 Thi thử lần 1 (mở từ 15/12/2025)
│   └── Đề theo môn: Toán / Văn / Anh / Lý / Hóa /
│                   Sinh / Sử / Địa / GDKTPL
│
└── 6.2 Thi thử lần 2 (mở từ 25/03/2026)
    └── Đề theo môn: (tương tự lần 1)


7. CUỘC THI VUI (/cuoc-thi)
│
├── 7.1 Toán vui mỗi tuần
│   └── Series "Hải trình Toán học" (số 058–061...)
│
├── 7.2 Văn hay mỗi tuần
│   └── Series "Thử thách Văn chương"
│
├── 7.3 Fun English (Đố vui Tiếng Anh)
│   └── Series "Fun English" (số 373...)
│
└── 7.4 Cơ chế phần thưởng
    ├── Giải câu đố → nhận quà từ OLM
    └── Xem kết quả / bảng xếp hạng


8. THI ĐẤU (thidau.olm.vn)
│
├── 8.1 Vào phòng thi đấu real-time
├── 8.2 Ghép đối thủ tự động
├── 8.3 Thi đấu theo môn / lớp
└── 8.4 Bảng xếp hạng


9. THƯ VIỆN SỐ (/thu-vien-so)
│
├── 9.1 Sách giáo khoa (/thu-vien-so/sach-giao-khoa)
│   ├── Lọc theo lớp (1–12)
│   ├── Lọc: Sách học sinh / Sách giáo viên
│   ├── Miễn phí 100% — đối tác NXB Giáo dục VN
│   └── Đọc sách online (/thu-vien-so/doc-sach/...)
│
├── 9.2 Tạp chí (/thu-vien-so/tap-chi) [Dành cho Hội viên]
│   ├── Toán Tuổi Thơ (số 278–290...)
│   ├── Toán Học & Tuổi Trẻ
│   └── Văn Học & Tuổi Trẻ
│       (1.000+ đầu tạp chí)
│
└── 9.3 Gói Hội viên (/gio-hang-thu-vien-so)
    └── Từ 1.400đ/ngày


10. NỘI DUNG & TIN TỨC
│
├── 10.1 Bài viết (/bai-viet)
│
├── 10.2 Tin tức (/thongtin)
│   ├── Thông báo (/chu-de-bai-viet/thong-bao)
│   │   ├── Cập nhật tính năng mới
│   │   ├── Khuyến mãi / ưu đãi
│   │   └── Khai giảng khóa học
│   ├── Dành cho học sinh (/chu-de-bai-viet/danh-cho-hoc-sinh)
│   └── Dành cho GV & phụ huynh
│       (/chu-de-bai-viet/goc-danh-cho-phu-huynh-va-thay-co)
│
└── 10.3 Blog học tập (/chu-de-bai-viet/hoc-tap)
    ├── Phương pháp học theo môn / lớp
    ├── Mẹo soạn bài
    └── Hướng dẫn ôn thi


11. QUẢN LÝ LỚP HỌC (dành cho Giáo viên & Học sinh)
│
├── 11.1 Lớp học của tôi (/lop-hoc-cua-toi)
│   ├── Danh sách lớp đã tham gia / tạo
│   └── Thống kê học sinh trong lớp
│
├── 11.2 Bài tập được giao (/bai-tap-duoc-giao)
│   ├── Danh sách bài tập đang chờ
│   ├── Đã nộp / chưa nộp
│   └── Kết quả chấm điểm tự động
│
└── 11.3 Thảo luận lớp (/thao-luan-hoc-sinh)


12. OLM CLASS (class.olm.vn)
│
├── 12.1 Học trực tiếp với giáo viên (Zoom)
├── 12.2 Tuyển sinh lớp hè
└── 12.3 Lịch học / lịch sử học OlmClass


13. NHẮN TIN & CỘNG ĐỒNG
│
├── 13.1 Nhắn tin (/messages/tro-chuyen)
│   ├── Nhắn tin 1-1
│   └── Nhắn tin nhóm (Group Chat)
│
└── 13.2 Thông báo (Notification)
    ├── Thông báo real-time
    └── Xem tất cả (/notifications)


14. CHĂM SÓC KHÁCH HÀNG
│
├── 14.1 OLM Chatbot (chat-widget)
├── 14.2 Liên hệ hotline
│   ├── 0986557525 – Thầy Thọ
│   └── 0898987672 – Cô Hòa
├── 14.3 Trung tâm trợ giúp (/gioi-thieu/trung-tam-tro-giup)
├── 14.4 Hướng dẫn sử dụng (/bg/hotroolm)
├── 14.5 Phản hồi về OLM (/gioi-thieu/feedback)
├── 14.6 KH nói về OLM (/gioi-thieu/phan-hoi-khach-hang)
└── 14.7 Đánh giá CSKH (Rating modal sau hỗ trợ)


15. MARKETING & KHUYẾN MÃI
│
├── 15.1 Announcement Bar (thanh thông báo đầu trang)
├── 15.2 Popup ưu đãi (modal-promotion)
│   └── Nhập SĐT → nhận mã giảm giá
├── 15.3 Banner khuyến mãi theo sự kiện
│   ├── Quốc tế Thiếu nhi 1/6
│   ├── Khai giảng hè
│   └── Giảm 50% gói VIP theo thời hạn
└── 15.4 Giới thiệu bạn bè (/intro-invite)


16. HỆ SINH THÁI SẢN PHẨM
│
├── OLM KIDS          → Mầm non & tiền tiểu học (olm.vn/kids)
├── ĐGNL              → dgnl.olm.vn
├── OLM TKB           → tkb.olm.vn (xếp thời khóa biểu)
├── Marker OLM        → marker.olm.vn (chấm trắc nghiệm)
├── OLM Class         → class.olm.vn (học trực tiếp GV)
└── Đấu trường        → dautruong.olm.vn


17. GIỚI THIỆU & PHÁP LÝ
│
├── 17.1 Về OLM (/gioi-thieu)
│   ├── Dành cho học sinh & phụ huynh
│   └── Dành cho giáo viên & nhà trường
├── 17.2 Đối tác
│   ├── NXB Giáo dục Việt Nam
│   ├── Trường ĐHSP Hà Nội (HNUE)
│   └── EDC
├── 17.3 Liên hệ (/gioi-thieu/lien-he)
└── 17.4 App Mobile
    ├── iOS (App Store)
    └── Android (Google Play)


18. KÊNH TRUYỀN THÔNG
    ├── Facebook: facebook.com/olm.vn
    ├── YouTube: @olm_vn / @cdsgd
    └── Zalo OA: zalo.me/...





# OLM.VN — Tài liệu BA: Elements & Data Flow toàn hệ thống

---

## TRANG 1: ĐĂNG KÝ (/dang-ky)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Bước 1: Chọn loại tài khoản | Radio group | Học sinh / Giáo viên |
| Avatar selector | Image grid | 6 ảnh đại diện mặc định có thể chọn |
| Dropdown môn học (GV) | Select | ~70 môn học từ Mầm non → THPT |
| Bước 2: Form đăng ký | Form | Họ tên / Username / SĐT / Email / Mật khẩu |
| Checkbox nhận thông báo | Checkbox | Nhận cập nhật tài liệu mới từ OLM |
| Nút Đăng ký | Button primary | Submit form |
| Tiếp tục bằng Google | Button OAuth | Redirect /social/google/redirect |
| Đăng nhập CSDL GDĐT | Button SSO | Redirect /social/hanoi/redirect |
| Link "Đã có tài khoản" | Link | → /dangnhap |
| Modal: Email đã tồn tại | Modal | 2 nhánh: Quên mật khẩu / Tiếp tục tạo mới |
| Chính sách bảo mật | Link | → /tin-tuc/Chinh-sach-rieng-tu |

### Data Flow
```
User điền form
  → POST /dang-ky
    → Validate: username/email/SĐT duy nhất?
      [Trùng email] → Modal "Email đã tồn tại"
        → [Chọn Quên MK] → /forgot-password
        → [Tiếp tục]     → Dùng email làm email phụ huynh
      [Hợp lệ] → Tạo user trong DB
        → Gửi email xác thực
        → Redirect → trang học (hoặc redirect URL)

OAuth Google:
  User click → /social/google/redirect
    → Google OAuth consent
    → Callback → Tạo/link tài khoản → Login session

SSO GDĐT Hà Nội:
  User click → /social/hanoi/redirect
    → CSDL GDĐT authen
    → Callback → Tạo/link tài khoản → Login session
```

---

## TRANG 2: ĐĂNG NHẬP (/dangnhap)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Input Username | Text input | Icon user |
| Input Password | Password input | Icon lock + toggle eye |
| Checkbox Ghi nhớ | Checkbox | Remember me |
| Link Quên mật khẩu | Link | Mở modal quên MK |
| Nút Đăng nhập | Button primary | Submit |
| Tiếp tục bằng Google | Button OAuth | |
| Đăng nhập CSDL GDĐT | Button SSO | |
| Modal Quên mật khẩu | Modal | 2 tab: Email / Zalo |
| Input Email khôi phục | Text input | Validate email tồn tại |
| Modal OTP 2FA | Modal | Nhập mã 6 số, hết hạn 15 phút |
| Mã dự phòng | Note | Dùng khi không nhận được OTP |
| Modal Thành công / Thất bại | Modal | Feedback sau gửi yêu cầu |

### Data Flow
```
User nhập username + password
  → POST /dangnhap
    → Validate credentials
      [Sai] → Hiện lỗi inline
      [Đúng, có 2FA] → Gửi OTP về email
        → Modal nhập OTP
          [Đúng] → Tạo session → Redirect
          [Sai/Hết hạn] → Báo lỗi, cho nhập lại
      [Đúng, không 2FA] → Tạo session → Redirect

Quên mật khẩu (Email):
  → Nhập email → POST /forgot-password
    → Validate email tồn tại
      [Không tồn tại] → Báo lỗi inline
      [Tồn tại] → Gửi email link đặt lại MK → Modal thành công

Quên mật khẩu (Zalo):
  → Chỉ dành cho tài khoản đã kết nối Zalo
```

---

## TRANG 3: HỌC BÀI (/hoc-bai)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Sidebar cấp học | Nav list | Mầm non / Lớp 1–12 |
| Announcement bar | Banner | Link khuyến mãi hiện tại |
| Section: Khối mầm non | List | → /lop-mau-giao |
| Section: Tiểu học | List | Lớp 1–5 |
| Section: THCS | List | Lớp 6–9 |
| Section: THPT | List | Lớp 10–12 |
| Footer links | Links | Về OLM / Dành cho HS / GV / Nhà trường |
| App Store badge | Link | iOS app |
| Google Play badge | Link | Android app |
| Popup VIP quà hè | Modal | Nhập SĐT, nhận mã giảm giá |

### Data Flow
```
User truy cập /hoc-bai
  → Render danh sách cấp học (static + SEO)
  → User click Lớp N → GET /lop-{n}
    → Render danh sách khóa học của lớp
```

---

## TRANG 4: TRANG LỚP (/lop-{n})

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Grade selector tabs | Tab bar | Mẫu giáo → Lớp 12 + Ngân hàng câu hỏi |
| Tab: Khóa học chính | Tab | Kết nối tri thức (mặc định) |
| Tab: Khóa học tham khảo | Tab | Cánh diều + Chân trời sáng tạo |
| Course card | Card | Thumbnail + Tên khóa + Số bài học + Số tài liệu |
| Nút Xem thêm | Button | Expand thêm khóa |
| Announcement bar | Banner | |

### Data Flow
```
GET /lop-{n}
  → API lấy danh sách course của grade_id = n
    → Phân loại: primary (KNTT) / reference (CD, CTST)
  → Render course cards với metadata:
    - title, slug, thumbnail
    - lesson_count, document_count
    - price (nếu cần mua)
  → User click card → GET /bg/{course-slug}
```

---

## TRANG 5: TRANG KHÓA HỌC (/bg/{course-slug})

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Video giới thiệu | YouTube embed | |
| Tên khóa học | H1 | |
| Mô tả khóa học | Paragraph | Nội dung biên soạn bởi ai |
| Tag lớp | Badge | → /lop-{n} |
| Nút Tiếp tục học bài | Button | Resume learning |
| Tab: Nội dung khóa học | Tab | Danh sách chương/bài |
| Tab: Hướng dẫn khóa học hè | Tab | → link hướng dẫn riêng |
| Link Thi kiểm tra | Link | → /contestx?id_course=... |
| Tab: Hỏi đáp | Tab | Danh sách câu hỏi của khóa |
| Link nhóm Zalo | Link | Nhóm Zalo theo lớp |
| Banner OLM Class | Banner GIF | → tuyển sinh |
| Bài học tuần này | Section | Filtered by week |
| Accordion chương | Collapsible | Expand/collapse từng chương |
| Danh sách bài học | List | Mỗi bài: Video / PPT / Lý thuyết / Bài tập SGK / Mô phỏng / Sách HS / KHBD |
| Link Thi đấu theo bài | Link | → /thi-dau?category=... |
| Link Tài liệu Free (KHBD) | Link | Giáo án miễn phí cho GV |
| Giá khóa học | Meta | product:price:amount (VD: 400,000 VND) |

### Data Flow
```
GET /bg/{slug}
  → API lấy course metadata (id, title, desc, price, grade)
  → API lấy chapter list → lesson list (có phân cấp)
    → Mỗi lesson có:
        lesson_id, title, type (video/ppt/exercise/doc)
        is_free (boolean)
        linked_contest_id
        linked_book_page

User chưa mua:
  → Click bài học có khóa → Modal mua khóa học
    → Redirect /gio-hang

User đã mua / bài free:
  → Click bài → GET /chu-de/{lesson-slug}
    → Render nội dung bài học

"Tiếp tục học bài":
  → GET /api/user/last-lesson?course_id=...
    → Redirect đến lesson_id gần nhất chưa hoàn thành

"Bài học tuần này":
  → GET /bg/{slug}?week={week_number}
    → Filter lessons theo tuần hiện tại
```

---

## TRANG 6: BÀI HỌC CHI TIẾT (/chu-de/{lesson-slug})

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Video player | Embed / HTML5 | Bài giảng chính |
| Audio player | HTML5 | play / replay button |
| Nội dung đọc | Rich text | Lý thuyết, ví dụ |
| Khung bài tập | Container | Danh sách câu hỏi |
| Câu hỏi trắc nghiệm | Radio options | Chọn đáp án + Submit |
| Câu hỏi điền chỗ trống | Text input | |
| Câu hỏi kéo thả | Drag & drop | draggable + droppable zones |
| Câu hỏi ghép đôi | Matching UI | |
| Câu hỏi sắp xếp | Ordering UI | |
| Câu hỏi tương tác hình ảnh | Image + hotspot | 2 dạng mới 2026 |
| Nút Nộp bài | Button | Submit answers |
| Kết quả bài làm | Result panel | Điểm + giải thích đáp án |
| Nút Câu tiếp theo | Button | Navigate |
| Progress bar | Progress | % bài đã làm trong chương |
| Link PPT | Link | File bài giảng PowerPoint |
| Link Sách HS | Link | → /thu-vien-so/doc-sach/... |

### Data Flow
```
GET /chu-de/{slug}
  → API lấy lesson content (type, content_url, questions[])
  → Render theo type:
    video   → embed youtube/player
    audio   → HTML5 audio
    reading → rich text HTML
    exercise → render question engine

User làm bài tập:
  → Chọn đáp án / điền / kéo thả
  → POST /api/submit-answer
    { lesson_id, question_id, answer, user_id }
    → Server chấm điểm
    → Trả về { is_correct, explanation, score }
  → Render kết quả inline
  → Cập nhật progress: POST /api/lesson-progress
    { user_id, lesson_id, status: "completed", score }

Hoàn thành bài:
  → Cập nhật % tiến độ khóa học
  → Mở khóa bài tiếp theo (nếu sequential)
```

---

## TRANG 7: HỎI ĐÁP (/hoi-dap)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Filter tabs lớp | Tab bar | Mẫu giáo → ĐH-CĐ (15 mức) |
| Filter tabs môn | Tag list | 23 môn học |
| Filter tabs loại | Tab | Tất cả / Mới nhất / Câu hỏi hay / Chưa TL / VIP |
| Textarea đặt câu hỏi | Form | Placeholder text, chỉ dùng cho đã đăng nhập |
| Badge VIP | Badge | Ưu tiên trả lời |
| Link mua VIP | Link | → /mua-vip |
| Danh sách câu hỏi | Feed | Card: avatar + tên + tag + nội dung + thời gian |
| Badge VIP user | Badge | Hiển thị trên avatar |
| Trả lời câu hỏi | Comment list | Nested answers |
| Nút Vote "Đúng" | Button | Counter tăng |
| Nút Xem thêm | Button | Load more answers (pagination) |
| Link câu hỏi | Link | → /cau-hoi/{slug}.{id} |

### Data Flow
```
GET /hoi-dap[?lop=N][?mon=N][?select=N]
  → API lấy question list với filter:
    grade_id, subject_id, status (all/new/good/unanswered/vip)
  → Paginate (lazy load / infinite scroll)

Đặt câu hỏi (đã đăng nhập):
  → User nhập nội dung → POST /api/questions
    { content, grade_id, subject_id, course_tag }
    → VIP: đánh dấu ưu tiên
    → Tạo question record → Push notification cho GV/cộng đồng

Vote "Đúng":
  → POST /api/answers/{id}/vote
    → Tăng vote_count
    → Nếu vote_count cao → lên "Câu hỏi hay"

Load more:
  → GET /hoi-dap?page=N&...
    → Append thêm cards vào feed
```

---

## TRANG 8: KHO ĐỀ KIỂM TRA (/contestx)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Danh sách đề theo lớp | Section groups | Lớp 1–9 (mỗi lớp ~11–28 đề) |
| Nút Xem thêm | Button | Expand thêm đề của lớp đó |
| Filter: lớp / môn / độ khó | Filter bar | |
| Search đề | Input | Tìm kiếm theo từ khóa |
| Card đề kiểm tra | Card | Tên đề + số câu + thời gian |
| Nút Làm bài | Button | Vào phòng thi |
| Tạo ma trận đề (GV) | Tool | Chọn dạng câu / phân bổ điểm / xuất đề |

### Data Flow
```
GET /contestx[?id_course=N]
  → API lấy contest list theo grade/course
  → Group by grade

User click "Làm bài":
  → GET /contestx/{contest_id}
    → Render đề thi (timed, random order option)
    → Timer bắt đầu
  → User nộp bài:
    POST /api/contest-submit
      { contest_id, answers[], time_spent }
    → Chấm điểm tự động
    → Trả về score, đáp án, giải thích
    → Lưu vào lịch sử thi

Giáo viên tạo ma trận:
  → POST /api/matrix
    { subject_id, difficulty_distribution, question_count, score_total }
    → Hệ thống random câu từ ngân hàng câu hỏi
    → Preview đề → Lưu / Xuất PDF
```

---

## TRANG 9: CUỘC THI VUI (/cuoc-thi)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Featured contest card | Hero card | Ảnh lớn + tên + mô tả |
| Section: Toán vui mỗi tuần | Section | Series "Hải trình Toán học" |
| Section: Văn hay mỗi tuần | Section | Series "Thử thách Văn chương" |
| Section: Fun English | Section | Đố vui Tiếng Anh |
| Contest card | Card | Thumbnail + Tên + Ngày đăng |
| Link xem bài viết | Link | → /bai-viet/{id} |

### Data Flow
```
GET /cuoc-thi
  → API lấy danh sách bài viết theo chủ đề:
    /chu-de-bai-viet/Toan-vui-hang-tuan-v2
    /chu-de-bai-viet/Van-vui-hang-tuan-v2
    /chu-de-bai-viet/fun-english (ẩn)
  → Group by series, sort by date DESC

User click vào cuộc thi:
  → GET /bai-viet/{id}
    → Render nội dung + form tham gia (comment/submit)
    → Ghi nhận tham gia → Xét giải thưởng theo tuần
```

---

## TRANG 10: THƯ VIỆN SỐ (/thu-vien-so)

### Sub-pages & Elements

#### 10.1 Trang chủ Thư viện số
| Element | Loại | Mô tả |
|---|---|---|
| Banner | Hero | NXB Giáo dục đối tác chính thức |
| CTA: Khám phá kho sách | Button | → /thu-vien-so/sach-giao-khoa |
| Section Tạp chí (Hội viên) | Section | 1.000+ đầu tạp chí |
| CTA: Gói Hội viên | Button | → /gio-hang-thu-vien-so |
| Carousel ấn phẩm mới | Carousel | Toán Tuổi Thơ số mới nhất |
| Footer nav | Nav | Sách GK / Tạp chí / Hội viên / Hỗ trợ |

#### 10.2 Sách giáo khoa (/thu-vien-so/sach-giao-khoa)
| Element | Loại | Mô tả |
|---|---|---|
| Filter lớp | Tab số | 1–12 |
| Filter loại | Toggle | Sách học sinh / Sách giáo viên |
| Danh sách sách | Grid | Tên sách + thumbnail |
| Link đọc sách | Link | → /thu-vien-so/doc-sach/{slug} |

#### 10.3 Tạp chí (/thu-vien-so/tap-chi)
| Element | Loại | Mô tả |
|---|---|---|
| Danh sách tạp chí | Grid | Toán TT / Toán HT / Văn HT / ... |
| Badge Hội viên | Lock icon | Yêu cầu mua gói |
| Gói Hội viên | CTA | 1.400đ/ngày |

### Data Flow
```
GET /thu-vien-so/sach-giao-khoa?grade=N&type=student|teacher
  → API lấy book list từ NXB GDVN
  → Filter: grade_id, book_type
  → Render grid (10 kết quả/trang)

User click đọc sách:
  → GET /thu-vien-so/doc-sach/{slug}
    → Check: sách miễn phí? → Render PDF viewer
    → Check: tạp chí? → Check subscription
      [Chưa đăng ký] → Modal mua Hội viên
      [Đã đăng ký] → Render PDF viewer với DRM

Mua Hội viên:
  → GET /gio-hang-thu-vien-so
    → Chọn gói → Thanh toán (VNPay/MoMo/...)
    → Cập nhật subscription record → Unlock tạp chí
```

---

## TRANG 11: TIN TỨC (/thongtin)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Hero article | Featured | Bài tin tức mới nhất (ảnh lớn + tiêu đề) |
| Danh sách tin | List | 4 tin tiếp theo dạng list |
| Section: Thông báo | Section | /chu-de-bai-viet/thong-bao |
| Section: Dành cho HS | Section | /chu-de-bai-viet/danh-cho-hoc-sinh |
| Section: Dành cho GV | Section | /chu-de-bai-viet/goc-danh-cho-phu-huynh |
| Article card | Card | Thumbnail + Tiêu đề + Ngày |

### Data Flow
```
GET /thongtin
  → API lấy posts theo category:
    - thong-bao (Thông báo)
    - danh-cho-hoc-sinh
    - goc-danh-cho-phu-huynh-va-thay-co
  → Sort by published_at DESC
  → Render theo section

User click bài:
  → GET /bai-viet/{slug}-{id}
    hoặc GET /tin-tuc/{slug}-{id}
    → Render full article
```

---

## TRANG 12: BLOG HỌC TẬP (/chu-de-bai-viet/hoc-tap)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Breadcrumb | Breadcrumb | OLM > Bài viết > Tin tức |
| Article grid | Grid | Thumbnail + Tiêu đề + Ngày + Preview |

### Data Flow
```
GET /chu-de-bai-viet/hoc-tap
  → API lấy posts với category_slug = "hoc-tap"
  → Sort by date, paginate
```

---

## TRANG 13: QUẢN LÝ TÀI KHOẢN (Đã đăng nhập)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| User dropdown | Dropdown | Avatar + tên |
| Hồ sơ học sinh | Link | → /thong-tin-tai-khoan/info |
| Thông tin tài khoản | Link | |
| Nâng cấp VIP | Link | |
| Học bạ | Link | → /thongke |
| Ví của tôi | Link | → /vi-cua-toi |
| Lớp học của tôi | Link | → /lop-hoc-cua-toi |
| Thảo luận | Link | → /thao-luan-hoc-sinh |
| Bài tập được giao | Link | → /bai-tap-duoc-giao |
| Lịch sử giao dịch | Link | → /lich-su-giao-dich-olmclass |
| Giới thiệu bạn bè | Link | → /intro-invite |
| Đăng xuất | Link | → /dang-xuat |
| Modal đổi mật khẩu | Modal | Input: MK cũ / MK mới |
| Modal tặng coin | Modal | Chọn loại coin + số lượng + tin nhắn |
| Modal xác nhận giao dịch | Modal | Tên + username + số coin + nội dung |

### Data Flow
```
Đổi mật khẩu:
  → POST /change-password
    { old_password, new_password, _token }
    → Validate MK cũ đúng
    → Cập nhật DB → Success/Error toast

Tặng coin:
  → User nhập username người nhận + số coin + loại (coin/xu) + tin nhắn
  → POST /api/give-coin
    { receiver_username, amount, currency_type, message }
    → Validate: số dư đủ không?
    → Deduct từ sender + Credit cho receiver
    → Tạo transaction record
    → Hiển thị modal xác nhận → Confirm → Execute

Học bạ:
  → GET /thongke
    → Lấy toàn bộ lịch sử làm bài của user
    → Hiển thị theo môn / thời gian / điểm số
```

---

## TRANG 14: NHẮN TIN (/messages/tro-chuyen)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Danh sách chat | Sidebar | Avatar + tên + tin nhắn cuối |
| Badge unread | Badge | Số tin chưa đọc |
| Khung chat | Main panel | Messages thread |
| Input nhắn tin | Text input | Placeholder "Nhập tin nhắn ở đây..." |
| Nút gửi | Button | Submit |
| Modal tạo nhóm | Modal | Chọn thành viên + đặt tên nhóm |
| Modal chat nhóm | Modal | |

### Data Flow
```
GET /messages/tro-chuyen
  → WebSocket connect / Long-polling
  → Load conversation list của user

Gửi tin:
  → POST /messages/create (GET method trong form)
    { _token, id_group, message }
    → Lưu message vào DB
    → Push realtime đến người nhận (WebSocket/Pusher)
    → Cập nhật unread_count

Tạo nhóm:
  → POST /api/groups/create
    { member_ids[], group_name }
    → Tạo group record + group_members
```

---

## TRANG 15: THÔNG BÁO (Notification)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Bell icon + Badge | Header icon | Số thông báo chưa đọc |
| Dropdown notification | Dropdown | Danh sách 5–10 thông báo gần nhất |
| Link "Xem tất cả" | Link | → /notifications |
| Notification item | List item | Avatar + nội dung + thời gian |

### Data Flow
```
Header load:
  → GET /api/notifications?limit=10
    → Render badge count
    → Render dropdown list

User click bell:
  → Mark as seen (POST /api/notifications/mark-seen)
  → Badge = 0

Realtime:
  → WebSocket / Server-Sent Events
  → Push notification mới → Tăng badge count
  → Nhận từ: hỏi đáp (ai trả lời), GV giao bài, hệ thống
```

---

## TRANG 16: HEADER (Component dùng chung)

### Elements
| Element | Loại | Mô tả |
|---|---|---|
| Logo OLM | Link | → / |
| School banner | Link | Trường liên cấp OLM (nếu thuộc trường) |
| Nav: Học bài | Link | → /hoc-bai |
| Nav: Hỏi bài | Link | → /hoi-dap |
| Nav: Kiểm tra | Link | → /contestx |
| Nav: ĐGNL | Link | → dgnl.olm.vn |
| Nav: Thi đấu | Link | → /thi-dau |
| Nav: Thư viện số | Link | → /thu-vien-so |
| Dropdown Bài viết | Dropdown | Cuộc thi / Tin tức / Blog |
| Search bar | Input + Select | Tìm kiếm + chọn loại (content/user) |
| Message icon | Icon + Badge | Số tin nhắn mới |
| Notification icon | Icon + Badge | Số thông báo mới |
| User dropdown | Dropdown | (xem Trang 13) |
| Announcement bar | Banner | Sự kiện / khuyến mãi hiện tại |

### Data Flow
```
Header khởi tạo:
  → Nếu đã đăng nhập:
    GET /api/header-data
      → { unread_messages, unread_notifications, user_name, school_info }
    → Render badge counts (realtime update)
  → Nếu chưa đăng nhập:
    → Hiện nút Đăng nhập / Đăng ký

Tìm kiếm:
  → User nhập từ khóa
  → POST /search?type={type}&q={keyword}
    → Redirect /search-result
    → Hoặc Inline suggest (typeahead)
```

---

## LUỒNG THANH TOÁN MUA VIP / KHÓA HỌC

### Data Flow tổng quát
```
User click "Mua VIP" hoặc "Mua khóa học"
  → GET /gio-hang
    → Hiển thị giỏ hàng + danh sách gói

Chọn gói:
  → POST /api/cart/add
    { product_type: "vip"|"course", product_id, duration }

Checkout:
  → Chọn phương thức: VNPay / MoMo / Chuyển khoản / Coin OLM
  → POST /api/order/create
    { cart_items[], payment_method, user_id }
    → Tạo order record (status: pending)
    → Redirect đến cổng thanh toán

Callback từ cổng:
  → POST /api/payment/callback
    { order_id, status, transaction_id }
    → Validate signature
    [Success]:
      → Cập nhật order status = paid
      → Kích hoạt VIP / Unlock course cho user
      → Gửi email xác nhận
      → Cộng coin thưởng nếu có
    [Failed]:
      → order status = failed → Thông báo lỗi

Coin OLM:
  → Deduct coin trực tiếp → Kích hoạt ngay
```

---

## LUỒNG XÁC THỰC TÀI KHOẢN (Email / SĐT)

### Data Flow
```
Tài khoản mới / chưa xác thực:
  → Popup modal xác thực (modal-form-active-mail)
    → Tab Email:
        User click "Gửi"
          → POST /api/send-verify-email
          → Gửi OTP về email
          → User nhập mã → POST /verify2fa { code }
          → [Đúng] → is_verified = true → Mở khóa tính năng
    → Tab SĐT:
        User nhập SĐT
          → POST /api/send-verify-tel
          → Gửi OTP về SĐT
          → User nhập mã → POST kiểm tra xác thực
          → [Đúng] → tel_verified = true

Tắt popup:
  → "Không hiện lại nữa" → Set cookie/flag không hiển thị lại
```

---

## TÓM TẮT CÁC API ENDPOINT CHÍNH

| Endpoint | Method | Chức năng |
|---|---|---|
| /dang-ky | POST | Tạo tài khoản |
| /dangnhap | POST | Đăng nhập |
| /social/google/redirect | GET | OAuth Google |
| /social/hanoi/redirect | GET | SSO GDĐT |
| /change-password | POST | Đổi mật khẩu |
| /verify2fa | POST | Xác thực OTP |
| /api/submit-answer | POST | Nộp đáp án bài tập |
| /api/lesson-progress | POST | Cập nhật tiến độ học |
| /api/contest-submit | POST | Nộp bài kiểm tra |
| /api/questions | POST | Đặt câu hỏi hỏi đáp |
| /api/answers/{id}/vote | POST | Vote đúng |
| /messages/create | GET | Gửi tin nhắn |
| /api/give-coin | POST | Tặng coin |
| /api/cart/add | POST | Thêm vào giỏ hàng |
| /api/order/create | POST | Tạo đơn hàng |
| /api/payment/callback | POST | Callback thanh toán |
| /api/notifications/mark-seen | POST | Đánh dấu đã đọc |
| /api/header-data | GET | Dữ liệu header (badge counts) |
```