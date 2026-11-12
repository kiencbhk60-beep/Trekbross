TREKBROSS — BẢN WEBSITE 3D MỚI NHẤT

Bản này gồm toàn bộ website tĩnh, có thể dùng độc lập.

CÁC THAY ĐỔI ĐÃ TÍCH HỢP
- Kính RIDGELINE 3D, nền trong suốt dùng chung nền trang.
- Kính được căn giữa; kích thước phù hợp desktop và điện thoại.
- Đã bỏ phần mô tả và thanh nút dưới mô hình; nhãn RIDGELINE / 01 ở bên trái.
- Mô hình tự xoay chậm; đưa chuột vào để kéo xoay thủ công.
- Đã khóa zoom, pan và đổi tâm bằng thao tác chạm; chỉ cho phép xoay.
- Phân vùng 5 vật liệu theo bảng màu; tròng xanh biển đậm, tăng độ trong và phản xạ cyan/tím theo góc nhìn.
- Giữ nguyên hình học, UV, normal map của GLB. Chỉ thay đổi nhóm vật liệu và các tham số PBR.
- Thư viện model-viewer được lưu trong vendor/; ảnh sản phẩm và mô hình nằm trong assets/.

CÁCH CHẠY
1. Giải nén ZIP.
2. Mở terminal tại thư mục TREKBROSS (nơi có index.html).
3. Chạy: python -m http.server 8080
   Trên Windows cũng có thể dùng: py -m http.server 8080
4. Mở http://localhost:8080
Cần chạy qua máy chủ HTTP để mô hình 3D tải ổn định, không chỉ nhấp đúp index.html.

ĐƯA LÊN HOSTING
Tải toàn bộ nội dung thư mục TREKBROSS lên hosting website tĩnh. Không cần bước build.

LƯU Ý
- Đặt hàng vẫn là giao diện mô phỏng, chưa gửi đơn và chưa nhận thanh toán.
- Mô hình đang dùng: assets/ridgeline-optical-v2.glb.
- Những phiên bản GLB cũ không còn được dùng đã được loại khỏi gói để giảm dung lượng.
- Texture màu và metallic/roughness cũ được lưu trong GLB nhưng không còn áp dụng; normal map gốc vẫn hoạt động.
- docs/ chứa báo cáo kiểm tra hình học và thông số vật liệu.
