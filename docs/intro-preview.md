# TREKKBROSS cinematic Intro — preview, 18/11/2026

## Trạng thái

Đã triển khai và kiểm thử local; mã được lưu trên nhánh `feat/trekkbross-cinematic-intro`. **Không push lên main hoặc deploy production**, vì chưa xác minh được quyền nhúng thương mại của video bên thứ ba theo yêu cầu trong brief. Repo hiện tự deploy Cloudflare khi push main, nên dùng nhánh riêng cho bản preview này.

Preview: http://127.0.0.1:8080/ (máy đang chạy local server). Nếu đã vào website trong tab này, mở một tab độc lập hoặc xóa riêng khóa `trekkbross-intro-seen` trong sessionStorage để xem lại Intro.

- [Desktop 1440×900](intro-preview/desktop-1440.png)
- [Mobile 390×844](intro-preview/mobile-390.png)

## Kiến trúc và phạm vi

Website là HTML/CSS/JavaScript tĩnh, nhiều document (`index.html`, `about.html`, `shop.html`), không React, TypeScript, Tailwind hay shadcn. Có GSAP, ScrollTrigger, SplitText và Observer local. Không cài framework hoặc dependency mới, không tạo TSX không sử dụng được.

Component được chuyển thành markup trong `index.html` cùng hai file độc lập `intro.css` và `intro.js`. Dùng font Oswald Variable và Be Vietnam Pro hiện có. WordsPullUp cho TREKKBROSS tương ứng một word theo component mẫu: translateY(20px) / opacity, ease expo.out gần với curve được cung cấp. Không thêm animation ảnh.

Trang chủ hiện tại vẫn nằm nguyên trong document. Trước khi vào, Intro nằm trên cùng; các phần main/navbar được inert và ẩn khỏi tương tác. `about.js` chỉ được nạp sau khi CTA đóng lớp cinematic đen. Chờ sự kiện load/error thực của script, không đoán readiness bằng setTimeout. Sau đó fade lớp đen, trả focus vào main và refresh ScrollTrigger. Không thêm route, không đổi URL hay thêm history entry khi bấm CTA.

`intro.css` chỉ dùng selector tiền tố intro, ngoài lớp root tạm thời `intro-pending`. Các selector này hết ảnh hưởng sau khi vào. Không chỉnh sửa `about.js`, `about.css`, `shop.html`, `app.js`, `motion.js`, `studio.js`, `collection-scroll.js`.

Trong lúc làm việc có thay đổi khác chuyển hai CTA sẵn có từ `shop.html#collection` sang `shop.html#top` ở cả `about.html` và `index.html`. Các thay đổi đó được giữ nguyên; không phải phần chỉnh sửa của Intro. Đã assert main content của index vẫn trùng entrypoint About hiện tại.

Cuối phiên còn xuất hiện chỉnh sửa đồng thời ở `app.js` và `shop.html`; không ghi đè hoặc nhận các chỉnh sửa đó là của Intro. Assertion các file Shop không đổi ghi ở dưới là kết quả tại thời điểm chạy trước các thay đổi đồng thời này; không đại diện cho diff cuối của toàn bộ workspace.

## Video, poster và quyền sử dụng

Giữ đúng URL trong brief:

https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4

Kiểm tra HEAD: HTTP 200, video/mp4, Content-Length 16,092,112 bytes, hỗ trợ byte ranges. Browser phát được: readyState=4, videoWidth=1924, duration≈10.041667s, muted=true, loop=true. Seek gần cuối rồi kiểm tra lại thấy playback quay về khoảng 2.6s và không paused, xác nhận loop hoạt động.

Nguồn tham chiếu có cùng video và mô tả layout:

- https://kairaxis.com/prompts/prisma-landing
- https://davidjason1820.substack.com/p/prisma-creative-studio-landing-page

Việc URL công khai và prompt được chia sẻ **không tự xác lập giấy phép thương mại cho asset**. Chưa có bằng chứng quyền nhúng thương mại/ủy quyền của chủ sở hữu video. Cần xác nhận quyền trước khi xuất bản. Poster cũng lấy từ video này và có cùng giới hạn sử dụng.

Poster `assets/intro/prisma-poster.jpg` được trích bằng browser từ chính video, 1280×720, JPEG khoảng 110KB. Không thay bằng ảnh trekking, không filter màu video. Video object-fit cover; gradient đen 30% → transparent → 60%. Noise SVG tĩnh dùng feTurbulence .85 / 3 octaves, không chạy loop noise.

Có điều khiển phát/tạm dừng. Video lỗi thì giữ poster, ẩn control không dùng được và vẫn cho vào website. Autoplay bị chặn thì catch promise, cho phép phát bằng thao tác người dùng. Khi bật reduced-motion: tắt autoplay, giữ poster và vào website không chạy cinematic motion. Nút Play vẫn là lựa chọn chủ động của người dùng.

## Navigation và session

| Điều hướng Intro | Đích thực |
| --- | --- |
| TRANG CHỦ | index.html, đánh dấu đã vào trước khi điều hướng |
| CÂU CHUYỆN | about.html#about |
| HÀNH TRÌNH | about.html#projects |
| TINH THẦN | about.html#services |
| BỘ SƯU TẬP | shop.html#collection |
| BƯỚC VÀO TREKKBROSS | Hiển thị website hiện tại ngay trên URL đang mở |

- First visit root/index, không hash: hiện Intro.
- Session đã seen: bỏ Intro và nạp animation chính một lần.
- Link hash hoặc About/Shop trực tiếp: không ép Intro.
- Storage đọc bị chặn: fail open, mở website chính.
- Storage ghi bị chặn: vẫn vào được; history.replaceState giữ marker cho refresh entry hiện tại, không push entry mới, không xóa state có sẵn.
- Back từ link Intro: BFCache được đối chiếu lại với marker session; không mắc ở lớp exit/Intro đã xem. Sau khi CTA hoàn tất, gỡ listener restore để giữ hành vi lịch sử thông thường của website.
- Nút Enter khóa ngay lần bấm đầu; không nạp main script nhiều lần.
- Nếu intro.js lỗi tải, HTML onerror gỡ gate và nạp about.js. Nếu about.js tải lỗi sau CTA, vẫn gỡ Intro để truy cập nội dung tĩnh.
- Không JavaScript: guard không kích hoạt và section Intro mặc định hidden, website tĩnh vẫn hiện.

## Kiểm thử đã chạy

### Trình duyệt thật — Orca embedded Chromium

| Kích thước | Kết quả kiểm tra layout |
| --- | --- |
| 1920×1080 | Wordmark và CTA trong frame, không tràn ngang |
| 1440×900 | Grid trái 2 phần / phải 1 phần, CTA trong frame |
| 1024×768 | Grid desktop còn vừa; CTA không bị cắt |
| 768×900 | Nội dung xếp một cột, CTA trong viewport |
| 390×844 | Wordmark vừa, CTA trong viewport; kiểm tra touch emulation riêng |
| 375×812 | Wordmark và CTA vừa; không tràn ngang |

- Đã nhìn screenshot desktop và mobile; slogan đo được rgb(225,224,204), dùng đúng màu kem.
- Video thực sự phát, muted/loop; không chỉ kiểm tra attribute.
- CTA kích hoạt bằng keyboard Enter: main script chỉ có 1 instance; history.length giữ nguyên; main bỏ inert; focus tới main.
- Quan sát 73 animation frames trong một lần exit: không có frame mà gate còn bật nhưng Intro đã mất/opacity=0. Không kết luận đây là chứng nhận cho mọi GPU/browser; chưa thử Safari/iOS thật.
- Refresh sau vào: Intro không còn, main không inert, about.js được nạp đúng một lần.
- Double Enter trong reduced-motion: website được mở, Intro gỡ, script chính một lần.
- Direct `about.html#projects` và `shop.html#collection`: không Intro; Shop vẫn có 7 sản phẩm.
- Back từ Intro → Shop trở về root đã seen, không Intro, main script một lần; Forward tới Shop không Intro.
- Reduced-motion: video autoplay=false/paused=true; trước vào không có ScrollTrigger, CTA vẫn trong viewport; poster và nút Play hiển thị.
- Mô phỏng media error bằng error event: video ẩn, control display:none, CTA vẫn enabled.
- Sau vào chế độ thường: 24 ScrollTrigger, 1 Observer. Cuộn tới scrollY=1100 cho thấy ScrollTrigger.progress > 0.

### Lỗi cũ phát hiện trong khi kiểm thử

`about.js:109` gọi `self.isActive()` trong Observer.onHover, gây `TypeError: self.isActive is not a function` khi con trỏ vào hero. Đã tái hiện cả sau Intro và trên `about.html` trực tiếp không có Intro. Di chuyển vẫn sinh ảnh (có wrapper transform/z-index), nhưng không thể đánh dấu toàn bộ mouse-trail là không lỗi.

Không sửa lỗi này vì brief cấm chỉnh mouse-trail/animation hiện có; file about.js giữ nguyên so với HEAD. Đây là lỗi tồn tại trước tích hợp, không phải regression mới của Intro.

### Tự động và kiểm tra nguồn

- `node --check intro.js`: pass.
- `node tests/intro-session.mjs`: pass. Test bằng Node vm/assert: lần đầu/đã seen/hash/storage denied, history fallback giữ state, chờ main script thực, double Enter, reduced-motion, media/script error, BFCache và cleanup listener.
- Assertion source: about.js/about.css và các script Shop nêu trên không đổi; main content của index trùng About hiện tại.
- `git diff --check`: pass; chỉ cảnh báo chuyển CRLF theo cấu hình Git.
- Build và TypeScript: không áp dụng, vì repo là static HTML/CSS/JS và không có build pipeline/tsconfig. Không tuyên bố đã chạy tsc hay React build.

## File thuộc thay đổi Intro

- `index.html`: root guard, markup Intro, stylesheet và integration loader.
- `intro.css`: framing, typography, gradient/noise, responsive và focus.
- `intro.js`: video, WordsPullUp, cinematic exit, readiness, session và cleanup.
- `assets/intro/prisma-poster.jpg`: poster từ video gốc.
- `tests/intro-session.mjs`: regression cho session/entry/fallback.
- Báo cáo này và hai screenshot trong `docs/intro-preview/`.

Chưa kiểm thử thiết bị iOS/Android thật, screen reader hay memory/FPS profile dài hạn. Không gửi đơn thử, không thay API, không cài dependency, không push/deploy video khi quyền sử dụng còn chưa rõ.
