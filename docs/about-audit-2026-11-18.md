# TREKKBROSS — Audit và Before/After, 18/11/2026

## Phạm vi và yêu cầu được giữ

- Audit sâu trang giới thiệu: `index.html` và `about.html` là hai bản giống nhau, cùng dùng `about.css` và `about.js`. Sửa đồng bộ cả hai entrypoint, không đổi routing.
- Smoke test trang cửa hàng `shop.html` ở 1440 và 390px; đọc các script motion, loupe, ripple, decode, collection scroll liên quan. Không sửa mã cửa hàng, API hay checkout.
- Theo chỉ dẫn bổ sung: **giữ nguyên mouse-trail**, bao gồm 11 ảnh, trạng thái ẩn mặc định, thao tác pointer/touch, các hằng số timing, kích thước và cách sinh ảnh. Không chuyển sang collage tĩnh, không thêm stagger ảnh khác đè lên hiệu ứng này.
- Giữ nguyên nội dung thương hiệu, tất cả thẻ ảnh gốc và liên kết có sẵn. Không thêm dependency, loading giả hoặc page transition.

## Lỗi đã xác nhận và khắc phục

| Mức | Before / nguyên nhân | After | File |
| --- | --- | --- | --- |
| P2 | `@import` Google Fonts nằm sau hàng nghìn rule CSS nên không được áp dụng. Browser chỉ có Oswald Variable và webflow-icons; không có Be Vietnam Pro. Các breakpoint còn khai báo lại font Inter/TASA trên `body`, ghi đè token từ `:root`. | Chuyển font stylesheet vào HTML, `display=swap`, chỉ yêu cầu 400/500/600/700. Đặt token trên cả `:root` và `body`; browser xác nhận Be Vietnam Pro được tải và sử dụng ở các breakpoint. | `about.html:19`, `index.html:19`, `about.css:6371` |
| P2 | Wordmark mobile dùng 18.2vw, margin âm và nowrap; screenshot 390px bị cắt mép chữ cuối. | Giữ Oswald Variable, wordmark 17vw ở mobile, bỏ margin âm; text width đo được giảm từ khoảng 358px xuống 333px và vừa container. Desktop vẫn monumental, giảm nhẹ từ 16.8vw xuống 16vw. | `about.css`, các rule `.logo-hero-text` |
| P2 | Hero desktop bị khóa `100vh` và overflow hidden, dễ cắt CTA khi nội dung tăng chiều cao/font thay đổi. | Hero có chiều cao theo nội dung và min-height; kiểm tra thêm 1440×600: hero cao 760px, toàn bộ CTA nằm bên trong. Vẫn giữ overflow hidden để mouse-trail không tràn section. | `about.css`, `.hero`, `.hero-text-wrapper` |
| P2 | Chế độ giảm chuyển động bỏ qua JS nhưng vẫn giữ services cao 400vh và khung ảnh chỉ cao một slide; người dùng không xem được đầy đủ chuỗi ảnh bằng animation. | Chỉ trong reduced-motion: bỏ sticky và chiều cao cuộn nhân tạo; cả 4 nội dung đầy đủ opacity và 4 ảnh được xếp thành grid, giữ tỉ lệ ảnh. | `about.css`, media query reduced-motion |
| P2 | Menu mở bằng bàn phím nhưng DOM đặt danh sách link trước nút toggle, nên Tab tiếp theo đi qua danh sách. Escape đóng menu nhưng không trả focus. | Khi kích hoạt bằng bàn phím, focus vào link đầu tiên. Escape đóng và trả focus về nút menu. | `about.js:7–22` |
| P2 | Không có skip link; text nút được lặp hai lần để animation, làm tên truy cập bị đọc lặp. Slogan dùng h5 ngay sau h1. | Thêm skip link tới main, outline focus cam, ẩn bản text animation thứ hai khỏi accessibility tree; slogan chuyển thành paragraph cùng nội dung. | `about.html`, `index.html`, `about.css` |
| P3 | Entrance ẩn navbar đến khoảng 0.94s và tiếp tục stagger link từ 1.16s. Hover underline animate `width`. | Navbar luôn sẵn dùng; chỉ hero text reveal nhẹ bằng opacity/translateY 24px. Underline dùng scaleX, không animate chiều rộng layout. | `about.js`, `about.css` |

## Typography, layer và ảnh

- Display giữ **Oswald Variable**, weight 700; desktop letter-spacing −0.055em / line-height 1.02; mobile −0.038em / 0.96. Nguồn font Oswald hiện có được giữ nguyên, `font-display: swap`. Fallback vẫn là Oswald / Arial Narrow / Arial / sans-serif.
- Nội dung và heading dùng **Be Vietnam Pro**, fallback Arial/sans-serif. Body line-height 1.65; hero paragraph 16px / 1.65; heading mặc định 1.25. Be Vietnam Pro tải các subset tiếng Việt; đã quan sát văn bản có dấu trên browser.
- Navbar nằm trong `.fixed` z-index 30; hero z-index 2, cô lập stacking context; image layer z-index 1, container chữ z-index 4. Pointer-events none của ảnh giữ nguyên để không chặn CTA. Không nâng ảnh đè chữ hoặc điều hướng.
- 11 ảnh hero là WebP, tổng file gốc 743,612 bytes; có width/height và decoding async. Ba ảnh đầu eager, các ảnh sau lazy. Ảnh projects/services cũng có kích thước gốc; object-fit cover cắt theo khung, không kéo méo. Không tạo srcset trỏ tới những biến thể chưa tồn tại; không nén lại/thay ảnh gốc.
- Giữ màu nhận diện cam `#ef4d25`, trắng/đen hiện có. Các section phụ giữ palette có sẵn; không thay nội dung hay tái cấu trúc cửa hàng.

## Animation và hiệu năng

- Giữ nguyên mouse-trail theo yêu cầu, scroll reveal, project parallax/hover và services timeline ở chế độ thường. Không thêm stagger image reveal thứ hai vì sẽ xung đột với yêu cầu giữ hiệu ứng.
- Hero text reveal không còn SplitText từng ký tự, tránh phụ thuộc kích thước ký tự trước/sau font swap. SplitText phần nội dung/footer hiện có vẫn được giữ.
- Số ScrollTrigger qua các lần resize: 24; Observer: 1, không thấy tăng qua các lần đổi viewport. Đây là kiểm tra vòng đời ngắn, **không phải chứng minh không có memory leak dài hạn**.
- Mouse-trail gốc có ticker đọc bounding rect khi hover và giữ will-change trên 11 wrapper. Ghi nhận chi phí này, không sửa theo chỉ dẫn. Không kết luận FPS ổn định trên điện thoại thật nếu chưa profile thiết bị.
- Một lần tải local `index.html` với cache hiện tại: LayoutShift PerformanceObserver ghi nhận tổng 0 sau khi loại recent-input. Không coi đây là chỉ số Core Web Vitals production hoặc cold-load trên mạng chậm.
- Routing là các HTML document và anchor bình thường, không SPA router. Không thêm page transition để tránh chặn link hoặc tạo thời gian chờ giả.

## Kết quả kiểm tra thực tế

Browser: Orca embedded Chromium, chạy qua HTTP local `http://127.0.0.1:8080`; cả `index.html` và `about.html`.

| Viewport | Typography / hero / CTA | Overflow ngang | Ghi nhận |
| --- | --- | --- | --- |
| 1440×900 | Pass | Không | Wordmark khoảng 1118px; CTA nằm trong hero. |
| 1024×900 | Pass | Không | Wordmark khoảng 770px; CTA wrap khi cần. |
| 768×900 | Pass | Không | Wordmark khoảng 578px; điều hướng thu gọn. |
| 390×900 | Pass | Không | Wordmark khoảng 333px; CTA và body không bị cắt mép. Có kiểm tra thêm mobile/touch emulation ở 390×844. |
| 1440×600 | Pass | Không | Hero được phép cao hơn viewport; không cắt CTA. |

- Bàn phím: skip link có thể nhận focus và Enter tới `#main`; mở menu bằng keyboard chuyển focus vào link đầu; Escape trả focus về `about-menu-btn`, aria-expanded=false.
- Focus outline: CSS có khai báo rõ 3px cam; môi trường browser nền không giữ trạng thái pseudo-focus giống cửa sổ OS đang active, nên chưa chứng nhận hình thức focus trên mọi trình duyệt/thiết bị hỗ trợ.
- Reduced-motion sau tải trang: 0 ScrollTrigger, 0 Observer; 4 services text opacity=1 và 4 ảnh đều có chiều cao thực, không bị giấu sau slide đầu. Thay đổi preference giữa phiên vẫn cần tải lại trang theo hành vi hiện có.
- Console ở phiên kiểm tra reduced-motion: không có lỗi. Không thêm script analytics hay instrumentation vào mã sản phẩm.
- Cửa hàng: tại 390px và 1440px, 7 sản phẩm và các nút giỏ hàng/form đặt hàng tồn tại, trang không tràn ngang. Chỉ smoke test giao diện; không gửi đơn thật hay kiểm thử thanh toán production.
- `node --check about.js`: pass. `git diff --check`: pass (chỉ có thông báo chuyển line-ending theo cấu hình Git).
- Assertion so với HEAD: khối mouse-trail giống hoàn toàn sau chuẩn hóa CRLF/LF; hai entrypoint giống nhau; mọi thẻ ảnh và link gốc giữ nguyên; diff của `shop.html`, `app.js`, `style.css`, `motion.js`, `assets/` rỗng.

## Before / After

| Desktop 1440px | Mobile 390px |
| --- | --- |
| [Before](about-audit-2026-11-18/before-1440.png) | [Before](about-audit-2026-11-18/before-390.png) |
| [After](about-audit-2026-11-18/after-1440.png) | [After](about-audit-2026-11-18/after-390.png) |

## Review cuối và giới hạn

Review-agent, diff hiện tại: **No findings.** Đã đọc toàn bộ diff và kiểm tra các nơi dùng chung (hai entrypoint, stylesheet/script chung). Không thấy regression mới đủ bằng chứng để đưa thành finding.

File sản phẩm đã sửa: `about.css`, `about.js`, `about.html`, `index.html`. Báo cáo và bốn screenshot nằm trong `docs/`.

Chưa kiểm tra Safari/iOS hoặc Android thật, screen reader, cold-network Lighthouse, CPU throttling hay heap profile dài hạn. Công cụ tra cứu dữ liệu của ui-ux-pro-max không chạy được vì máy không có Python; dùng hướng dẫn trực tiếp trong SKILL.md, không cài thêm phần mềm. Chưa commit/push/deploy trong tác vụ này.
