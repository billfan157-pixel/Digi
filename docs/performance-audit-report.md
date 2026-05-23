# Báo cáo Đánh giá Hiệu năng Render React (React Render Performance Audit Report)

Tài liệu này đánh giá hiệu năng kết xuất (render performance) của ba màn hình chính: **Dashboard**, **Insight** và **BottleTab**, đồng thời đề xuất giải pháp tối ưu hóa và chống re-render thừa.

---

## 1. Dashboard Tab

### Hiện trạng & Phân tích
- **Đặc điểm:** Dashboard chứa nhiều thông số cập nhật trực tiếp (lượng nước uống hôm nay, exp, coins, cấp độ hiện tại, biểu đồ tiến trình hàng ngày).
- **Vấn đề re-render:** Khi người dùng uống nước (cập nhật thông số qua websocket/optimistic update) hoặc nhận XP từ nhiệm vụ, toàn bộ cây Dashboard thường bị render lại.
- **Phân tích chi tiết:**
  - Component tiến độ (Ring Progress) và Widget uống nước chịu ảnh hưởng trực tiếp bởi sự thay đổi của state `water_today`.
  - Các component tĩnh hơn như avatar, danh sách chức năng phụ bị re-render do component cha thay đổi state.

### Giải pháp tối ưu hóa
1. **Memoization:**
   - Bọc các widget tĩnh hoặc cập nhật chậm như Avatar Frame / Theme selector trong `React.memo()`.
   - Sử dụng `useMemo` để tính toán phần trăm lượng nước hoàn thành và cấp độ tương ứng dựa trên exp để tránh tính toán lại mỗi lần render.
2. **Sử dụng Selector cho Zustand:**
   - Tránh việc subcribe toàn bộ store `useAppStore()`. Thay vào đó, sử dụng các selector hẹp:
     ```typescript
     const waterToday = useAppStore(s => s.waterToday);
     const exp = useAppStore(s => s.exp);
     ```

---

## 2. Insight Tab

### Hiện trạng & Phân tích
- **Đặc điểm:** Insight chứa các biểu đồ thống kê (sử dụng Recharts) và AI Chatbot/Advice Box.
- **Vấn đề re-render:** 
  - Biểu đồ Recharts tiêu tốn khá nhiều tài nguyên CPU khi vẽ lại (re-draw).
  - Khi tin nhắn AI đang stream (từng ký tự hiển thị), state thay đổi liên tục dẫn đến re-render tần suất cao trên toàn bộ màn hình Insight.

### Giải pháp tối ưu hóa
1. **Tách biệt State (State Colocation):**
   - Đưa state của ô nhập liệu (chat input) và quá trình stream của tin nhắn vào các component con nhỏ hơn (`ChatBox`, `AdviceInput`), thay vì để ở component cha `InsightTab`.
   - Bằng cách này, khi gõ phím hoặc tin nhắn đang stream, chỉ component tin nhắn render lại, biểu đồ Recharts không bị ảnh hưởng.
2. **Memoize Biểu đồ:**
   - Biểu đồ lịch sử tuần/tháng chỉ thay đổi khi dữ liệu nước thay đổi. Bọc component Chart trong `React.memo` với custom comparison function hoặc dùng `useMemo` cho mảng dữ liệu đã qua định dạng.

---

## 3. BottleTab

### Hiện trạng & Phân tích
- **Đặc điểm:** Giao diện kết nối thiết bị DigiBottle bằng Bluetooth Low Energy (BLE), hiển thị trạng thái kết nối, pin, đồng bộ và banner danh sách chờ (Waitlist Banner).
- **Vấn đề re-render:**
  - Hoạt ảnh sóng nước (wave animation) hoặc xoay thiết bị khi đang đồng bộ có thể tạo ra re-render liên tục nếu sử dụng React state để chạy frame-by-frame.
  - Trạng thái kết nối BLE (scanning, connected, disconnected) thay đổi gây re-render các phần tử tĩnh.

### Giải pháp tối ưu hóa
1. **CSS Animations thay cho JS State:**
   - Sử dụng CSS keyframes và transform 3D cho các hoạt ảnh xoay/đồng bộ thay vì dùng `requestAnimationFrame` hoặc `setInterval` thay đổi React state.
2. **BLE Event Listeners bên ngoài React:**
   - Giữ các listener BLE ở tầng hook (`useBluetooth`) hoặc service layer độc lập. Chỉ cập nhật state lên UI khi có thay đổi trạng thái thực sự đáng kể (ví dụ: chuyển đổi hẳn trạng thái `ConnectionStatus`).
3. **Waitlist Banner:**
   - Bọc Waitlist Banner trong `React.memo` vì banner này hầu như không thay đổi sau khi mount (ngoại trừ khi click nút Đăng ký mở modal).

---

## Kết luận & Khuyến nghị Chung
- **Quy tắc vàng:** Luôn ưu tiên đưa state xuống gần component sử dụng nhất (State Colocation).
- **Phân tách Bundle:** Tách Recharts và các thư viện nặng (như markdown parser cho AI) ra thành lazy loaded chunks (`React.lazy()`) để giảm dung lượng file bundle chính dưới ngưỡng **800KB**, bảo đảm tổng dung lượng toàn bộ trang dưới **2MB**.
