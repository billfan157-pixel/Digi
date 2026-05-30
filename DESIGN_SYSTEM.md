# 🎨 DigiWell Design System (Dynamic Theme Version)

**Version:** 2.1 (Tối ưu hóa cho Dynamic Theme Engine)  
**Last Updated:** 25/05/2026  
**Status:** Production Ready  

---

## 📖 Mục lục
1. [Triết lý thiết kế (Philosophy)](#-triết-lý-thiết-kế-philosophy)
2. [Hệ thống màu sắc động (Dynamic Color Palette)](#-hệ-thống-màu-sắc-động-dynamic-color-palette)
3. [Quy tắc màu sắc nghiêm cấm (Forbidden Color Rules)](#-quy-tắc-màu-sắc-nghiêm-cấm-forbidden-color-rules)
4. [Hệ thống chữ (Typography)](#-hệ-thống-chữ-typography)
5. [Hệ thống khoảng cách (Spacing System)](#-hệ-thống-khoảng-cách-spacing-system)
6. [Hệ thống bo góc động (Dynamic Border Radius)](#-hệ-thống-bo-góc-động-dynamic-border-radius)
7. [Hiệu ứng kính động (Dynamic Glassmorphism)](#-hiệu-ứng-kính-động-dynamic-glassmorphism)
8. [Đổ bóng & Phát quang (Shadows & Glows)](#-đổ-bóng--phát-quang-shadows--glows)
9. [Chuyển động (Animations)](#-chuyển-động-animations)
10. [Quy tắc phát triển Component](#-quy-tắc-phát-triển-component)
11. [Biểu tượng (Icons & Imagery)](#-biểu-tượng-icons--imagery)
12. [Tiêu chuẩn tiếp cận (Accessibility)](#-tiêu-chuẩn-tiếp-cận-accessibility)
13. [Tài nguyên tham khảo (Resources)](#-tài-nguyên-tham-khảo-resources)

---

## 🎯 Triết lý thiết kế (Philosophy)

Hệ thống thiết kế của DigiWell được xây dựng dựa trên 3 nguyên tắc cốt lõi:
1. **Premium Dark Theme**: Giao diện tối sang trọng làm chủ đạo, tạo chiều sâu bằng Glassmorphic và hiệu ứng phát quang dynamic (glow).
2. **Cá nhân hóa tối đa (Dynamic Personalization)**: Giao diện không cố định một màu sắc hay kiểu bo góc, mà biến đổi linh hoạt dựa trên Theme đã chọn hoặc mua từ Theme Shop.
3. **Tối giản có mục đích (Purposeful & Accessible)**: Mỗi chi tiết thiết kế đều phải phục vụ một chức năng cụ thể, loại bỏ các chi tiết thừa gây nhiễu và đảm bảo tiêu chuẩn tiếp cận WCAG 2.1 AA.

---

## 🎨 Hệ thống màu sắc động (Dynamic Color Palette)

DigiWell sử dụng hệ thống biến CSS tĩnh kết hợp với biến động để hỗ trợ chuyển đổi theme tức thì ở runtime.

### 1. Biến CSS động từ Theme Engine
Bắt buộc phải sử dụng các biến CSS động này cho các thành phần UI tương tác để đảm bảo tương thích khi đổi theme:
* `--theme-accent`: Màu nhấn chủ đạo (ví dụ: Cyan ở theme Mặc định, Emerald ở theme Lục Bảo, Gold ở theme Hoàng Kim).
* `--theme-accent-contrast`: Màu tương phản của màu nhấn (dùng cho chữ trên nền màu nhấn).
* `--theme-surface-glass`: Màu nền kính trong suốt.
* `--theme-border-glass`: Màu viền kính.
* `--theme-glow-color`: Màu hiệu ứng phát quang (glow) đặc trưng của theme.
* `--theme-bg-gradient`: Ảnh nền gradient động phía sau của theme.

### 2. Các màu tĩnh cơ bản (Mặc định - Fallback)
Khi không có theme động hoặc làm fallback, sử dụng bảng màu Slate:
* **Background chính**: `var(--dw-slate-950, #020617)`
* **Nền Card**: `var(--dw-slate-900, #0f172a)`
* **Nền bề mặt nổi**: `var(--dw-slate-800, #1e293b)`
* **Text chính**: `#ffffff`
* **Text phụ**: `var(--dw-slate-300, #cbd5e1)`
* **Text nhãn/chú thích**: `var(--dw-slate-400, #94a3b8)`

---

## 🚫 Quy tắc màu sắc nghiêm cấm (Forbidden Color Rules)

Để tránh phá vỡ giao diện khi người dùng thay đổi theme (ví dụ: đổi sang theme Hồng Anh Đào, Xanh Đại Dương, Đỏ Thẫm), các lập trình viên cần tuyệt đối tuân thủ quy tắc sau:

* ❌ **KHÔNG code cứng màu sắc thương hiệu phi trung tính trực tiếp vào JSX**:
  * Tránh dùng trực tiếp: `text-cyan-400`, `bg-indigo-500`, `border-purple-300`, `text-rose-500`, v.v.
* ✅ **HÃY sử dụng các biến màu động**:
  * Sử dụng: `text-[var(--theme-accent)]`, `bg-[var(--theme-accent)]`, `border-[var(--theme-border-glass)]`.
* ❌ **KHÔNG dùng màu Đỏ (`red-*`) cho cảnh báo lỗi**:
  * DigiWell sử dụng màu cam hổ phách (`orange-400`/`orange-500` hoặc tông màu cảnh báo của theme) cho tất cả các thông báo lỗi và trạng thái cảnh báo để giữ sự hài hòa trong thiết kế tối premium.

> [!WARNING]
> **Giới hạn kỹ thuật của Tailwind CSS khi dùng Opacity:**
> Tuyệt đối **KHÔNG** sử dụng cú pháp chỉnh độ mờ (opacity) trực tiếp trên biến CSS tùy biến, ví dụ:
> * ❌ `border-[var(--neon-cyan)]/20` hoặc `bg-[var(--neon-cyan)]/10`
>
> **Lý do:** Tailwind không thể phân tích độ mờ của biến CSS động lúc build-time, dẫn đến việc biên dịch lỗi và trình duyệt tự động fallback về màu xám/trắng mặc định của Tailwind (`#e5e7eb`).
>
> **Cách xử lý đúng:**
> Sử dụng các class chuẩn của Tailwind như `border-cyan-500/20`, `bg-cyan-500/10`, `text-cyan-400`. Component [ThemeEngine.tsx](file:///c:/DigiWell/src/components/ThemeEngine.tsx) đã được cấu hình sẵn để tự động bắt các class này và ghi đè sang màu theme thực tế của người dùng kèm độ mờ chính xác ở runtime.

### Bảng tra cứu sử dụng màu sắc:

| Trường hợp sử dụng | Cách viết SAI (Code cứng) | Cách viết ĐÚNG (Dynamic) |
| :--- | :--- | :--- |
| Nút hành động chính (Primary CTA) | `bg-cyan-400 text-slate-950` | `bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)]` |
| Viền của thẻ kính | `border-white/10` | `border-[var(--theme-border-glass)]` |
| Màu chữ của nhãn nổi bật | `text-cyan-400` | `text-[var(--theme-accent)]` |
| Bóng phát quang khi hover | `shadow-cyan-500/20` | `hover:shadow-[0_0_20px_var(--theme-glow-color)]` |

---

## ✍️ Hệ thống chữ (Typography)

### Font chữ
* **Font không chân (Sans-serif)**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif;`
* **Font đơn rộng (Monospace)**: `'JetBrains Mono', 'Fira Code', monospace;` (Dành cho chỉ số đo lường, thông số BLE, telemetry).

### Tỷ lệ cỡ chữ & Trọng lượng
* **Chữ số Hero**: `text-5xl font-black` (48px - dùng hiển thị lượng nước uống hôm nay).
* **Tiêu đề lớn**: `text-2xl font-black` (24px - chỉ số lớn trong card).
* **Tiêu đề phụ / Card title**: `text-lg font-black` (18px).
* **Chữ mặc định**: `text-sm font-medium` (14px).
* **Micro nhãn (Badge, Tag)**: `text-[10px] font-bold uppercase tracking-widest`.

---

## 📏 Hệ thống khoảng cách (Spacing System)

Thiết kế DigiWell dựa trên hệ thống khoảng cách lưới **8px** cơ sở.

* `space-1` (4px): Khoảng cách cực hẹp (giữa icon và text nhỏ).
* `space-2` (8px): Khoảng cách cơ sở (padding badge, khoảng cách giữa các phần tử nhỏ).
* `space-3` (12px): Khoảng cách nhỏ (khoảng cách bên trong mini card).
* `space-4` (16px): Padding tiêu chuẩn của các thành phần con.
* `space-5` (20px): Padding của thẻ chính (`glass-card`).
* `space-6` (24px): Khoảng cách giữa các phần lớn, padding của Modal.

---

## ⭕ Hệ thống bo góc động (Dynamic Border Radius)

Tương tự như màu sắc, độ cong của viền (border radius) thay đổi theo từng theme để biểu đạt các phong cách khác nhau (Cyberpunk bo góc 0px góc cạnh, Lục Bảo bo góc 32px mềm mại).

* ❌ **KHÔNG viết cứng**: `rounded-2xl` hay `rounded-xl` lên các thẻ lớn và nút nhấn.
* ✅ **BẮT BUỘC dùng biến động**:
  * **Card chính / Modal**: `rounded-[var(--theme-border-radius,16px)]`
  * **Nút / Input / Thẻ metric phụ**: `rounded-[calc(var(--theme-border-radius,16px)*0.75)]` (Sẽ bo góc nhỏ hơn một chút so với card chính để tạo sự đồng bộ tỷ lệ).

---

## 🔮 Hiệu ứng kính động (Dynamic Glassmorphism)

Tất cả các hiệu ứng mờ (blur), độ trong suốt của kính nền đều được kế thừa từ các lớp CSS dùng chung để tránh trùng lặp mã và đảm bảo tính nhất quán.

* **Thẻ kính chính (`glassCard`)**: Định nghĩa độ sâu mờ trung bình và đổ bóng nổi.
* **Thẻ số liệu (`glassMetric` / `glassInner`)**: Kính mờ nhẹ dùng bên trong thẻ chính.
* **Nút điều khiển kính (`glassControl`)**: Thành phần tương tác có transition hover mượt mà.

### Code mẫu tích hợp hiệu ứng kính từ `@/styles/glass`:
```tsx
import { glassCard, glassInner } from '@/styles/glass';

export function MyGlassComponent() {
  return (
    // Dùng class dùng chung kết hợp bo góc động của theme
    <div className={`${glassCard} p-5 rounded-[var(--theme-border-radius,16px)]`}>
      <h3 className="text-lg font-black text-white">Tiêu đề thẻ</h3>
      
      <div className={`${glassInner} p-4 mt-3 rounded-[calc(var(--theme-border-radius,16px)*0.75)]`}>
        <p className="text-xs text-slate-400">Nội dung phụ bên trong</p>
      </div>
    </div>
  );
}
```

---

## 🌑 Đổ bóng & Phát quang (Shadows & Glows)

Để tạo hiệu ứng viễn tưởng (cyberpunk/futuristic) chất lượng cao:
* Sử dụng bóng phát quang kết hợp biến màu động `--theme-glow-color`.
* Khi hover vào các nút nhấn hoặc các khối tương tác cao, thêm bóng sáng nhẹ:
  ```css
  shadow-[0_0_20px_rgba(var(--theme-glow-color-rgb),0.3)]
  ```

---

## ⚡ Chuyển động (Animations)

Sử dụng thư viện `framer-motion` cho các tương tác micro và chuyển trang:
* **Nhấp chuột / Chạm (Tap)**: Thu nhỏ nhẹ để phản hồi vật lý:
  ```tsx
  whileTap={{ scale: 0.95 }}
  ```
* **Rê chuột (Hover)**: Phóng to nhẹ và tăng độ sáng:
  ```tsx
  whileHover={{ scale: 1.02 }}
  ```
* **Độ trễ mượt mà**: Sử dụng timing `cubic-bezier(0.34, 1.56, 0.64, 1)` cho các hiệu ứng bật lên (spring).

---

## 🧩 Quy tắc phát triển Component

### 1. Nút nhấn (Buttons)
DigiWell chỉ hỗ trợ 4 biến thể nút chính:
* `primary`: Sử dụng màu nền của theme accent động (`bg-[var(--theme-accent)]`).
* `ghost`: Nền kính mờ trong suốt, chỉ hiện viền khi hover.
* `danger`: Nền mờ cam/đỏ đậm (`bg-rose-950/20 border-rose-500/30 text-rose-400`).
* `icon-btn`: Nút hình vuông bo tròn chỉ chứa icon, kích thước tối thiểu `44x44px`.

### 2. Nhãn trạng thái (Badges)
Tận dụng màu gradient mờ kết hợp icon tương ứng từ Lucide:
* **Hỏa hiệu (Streak)**: Gradient cam-vàng, icon `<Flame />`.
* **Cấp độ (Level)**: Gradient xanh cyan-blue, icon `<Zap />`.
* **Bảo mật (Security)**: Màu hổ phách nhấp nháy, icon `<ShieldAlert />`.

---

## 🎨 Biểu tượng (Icons & Imagery)

* **Thư viện icon duy nhất**: `lucide-react`. Cấm import từ bất kỳ thư viện icon nào khác để giảm dung lượng bundle và đồng bộ độ dày nét vẽ (stroke width).
* **Cấm sử dụng Emoji**: Không sử dụng emoji làm biểu tượng tính năng chính hoặc thay thế icon điều hướng (ví dụ: dùng `☀️` thay cho `<Sun />`).

---

## ♿ Tiêu chuẩn tiếp cận (Accessibility)

* **Kích thước chạm tối thiểu**: Tất cả các thành phần có thể click phải có kích thước tối thiểu `44x44px` trên màn hình thiết bị di động.
* **Độ tương phản chữ**: Luôn duy trì tỷ lệ tương phản tối thiểu 4.5:1. Văn bản phụ không được dùng màu Slate quá tối trên nền tối.
* **ARIA**: Luôn đính kèm `aria-label` cho các nút chỉ chứa biểu tượng (icon-only buttons) và đánh dấu `aria-hidden="true"` trên các icon trang trí.

---

## 📚 Tài nguyên tham khảo (Resources)

* **Cấu hình dynamic style**: [src/styles/glass.ts](file:///c:/DigiWell/src/styles/glass.ts)
* **Danh sách các theme đã định nghĩa**: [src/config/themes.ts](file:///c:/DigiWell/src/config/themes.ts)
* **Quản lý theme phía client**: [src/services/theme.service.ts](file:///c:/DigiWell/src/services/theme.service.ts)
