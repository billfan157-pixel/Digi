# DigiWell — Design System & UI Guidelines

> **Tài liệu này là luật thiết kế bắt buộc.** Mọi thay đổi UI phải tuân thủ nghiêm ngặt các quy tắc dưới đây.
> **Version:** 1.1 • **Cập nhật:** 2026-05-09

---

## 1. Định hướng Phong cách cốt lõi (Core Aesthetic)

- **Theme:** 100% Dark Mode (Dark, immersive, cinematic). **TUYỆT ĐỐI KHÔNG** sử dụng các thẻ (cards) màu trắng/xám sáng xen kẽ làm phá vỡ tổng thể.
- **Style:** Dark Glassmorphism (Hiệu ứng kính mờ trên nền bóng tối).
- **Vibe:** Premium, World-class, khoa học nhưng có tính Gamification (hơi hướng Apple Fitness kết hợp với Oura Ring).

---

## 2. Hệ thống Màu sắc (Color System)

### Brand Colors

| Vai trò | Màu | Giá trị | Sử dụng |
|---------|-----|---------|---------|
| **Background chính** | Dark navy | `slate-950` / `#020617` | Toàn bộ nền app |
| **Accent chính** | Cyan/Teal | `cyan-400` / `#22d3ee` | Tiến độ nước, text nổi bật, chỉ số chính |
| **Gamification** | Orange | `orange-400` / `#fb923c` | CHỈ cho streak, lửa, phần thưởng, huy hiệu |

### Semantic Colors

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--dw-success` | `#34d399` (emerald-400) | Hoàn thành, online status, sync thành công |
| `--dw-warning` | `#fbbf24` (amber-400) | Cảnh báo, pending sync, streak freeze |
| `--dw-danger` | `#ef4444` (red-500) | Lỗi, xóa, đăng xuất, streak mất |
| `--dw-info` | `#38bdf8` (sky-400) | Thông báo, tooltip, hint |

### Surface Levels (Glass Depth)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--dw-surface-1` | `rgba(255,255,255,0.03)` | Background sections, dividers |
| `--dw-surface-2` | `rgba(255,255,255,0.05)` | Cards chính (`.glass-card`) |
| `--dw-surface-3` | `rgba(255,255,255,0.08)` | Elevated cards, active controls |
| `--dw-surface-solid` | `rgba(15,23,42,0.68)` | Cards cần opacity cao hơn (stat cards) |

### Border Levels

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--dw-border-subtle` | `rgba(255,255,255,0.05)` | Dividers, inactive borders |
| `--dw-border-glass` | `rgba(255,255,255,0.08)` | Card borders mặc định |
| `--dw-border-active` | `rgba(255,255,255,0.15)` | Hover/active state borders |

**Quy tắc màu:**
- ❌ KHÔNG dùng Purple/Indigo làm accent — tránh xung đột visual.
- ✅ Cyan là màu chính, được ThemeEngine override khi user đổi theme.
- ✅ Tất cả class `cyan-*` sẽ tự động đổi màu theo theme — KHÔNG hardcode hex color cho accent.

**Màu thẻ (Card Background) — kỹ thuật CSS:**
```css
/* Frosted glass trên nền tối — Surface Level 2 */
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.08);
```

---

## 3. Hệ thống Typography (Typography System)

### Type Scale

| Level | Size | Weight | Line Height | Class | Dùng cho |
|-------|------|--------|-------------|-------|----------|
| **Hero Number** | 48px | 900 (black) | 1.0 | `text-5xl font-black` | Lượng nước (950ml), % tiến độ |
| **Page Title** | 30px | 900 (black) | 1.2 | `text-3xl font-black tracking-tight` | Tiêu đề trang |
| **Section Title** | 18px | 900 (black) | 1.3 | `text-lg font-black` | Tiêu đề section trong card |
| **Card Title** | 14px | 700 (bold) | 1.4 | `text-sm font-bold` | Tiêu đề card, tên chức năng |
| **Body** | 14px | 500 (medium) | 1.6 | `text-sm font-medium text-slate-300` | Mô tả, nội dung |
| **Caption** | 12px | 500 (medium) | 1.4 | `text-xs text-slate-400` | Timestamp, phụ đề |
| **Micro Label** | 10px | 700 (bold) | 1.2 | `text-[10px] font-bold tracking-widest` | STREAK, VOLUME |

### Quy tắc viết hoa

- **Headers/Tiêu đề:** Dùng **Title Case** (Viết hoa chữ cái đầu). Class: `.section-title`
- **Metric Labels NGẮN:** CHỈ dùng **ALL-CAPS** + `tracking-widest` cho labels ≤ 2 từ (VD: STREAK, VOLUME, WP). Class: `.section-label`
- ❌ **KHÔNG** dùng ALL-CAPS cho tiêu đề dài (VD: ~~"PHÂN TÍCH CHUYÊN SÂU"~~ → "Phân tích chuyên sâu")

### CSS Utility Classes

```css
.section-title {
  font-size: 0.625rem; /* 10px */
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--dw-text-muted);
  /* KHÔNG có text-transform: uppercase */
}

.section-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dw-text-muted);
}
```

---

## 4. Iconography (Hệ thống Icon)

### Icon Library

- **Bộ icon duy nhất:** `lucide-react` — KHÔNG mix với icon sets khác.
- ❌ KHÔNG dùng emoji làm icon (👑 → `Crown` component, 🔥 → `Flame` component).
- ❌ KHÔNG dùng SVG custom nếu `lucide-react` đã có icon tương đương.

### Icon Sizes

| Ngữ cảnh | Size | Dùng cho |
|-----------|------|---------|
| **Inline** | `size={14}` (14px) | Bên cạnh text nhỏ, labels, badges |
| **Card** | `size={16-18}` (16-18px) | Bên trong cards, section headers |
| **Feature** | `size={20}` (20px) | Feature icons trong stat cards, buttons lớn |
| **Hero** | `size={24-32}` (24-32px) | Standalone icons, empty states, tab bar active |
| **Illustration** | `size={40-48}` (40-48px) | Empty state illustrations, onboarding |

### Stroke & Style

- **Stroke weight:** Mặc định của lucide-react (`strokeWidth={2}`) — KHÔNG thay đổi.
- **Màu:** Theo semantic context — `text-cyan-400` cho primary, `text-slate-400` cho neutral, `text-orange-400` cho gamification.
- **Filled icons:** CHỈ dùng `fill` cho Flame (`fill-orange-400`), Heart khi liked, Star khi active. Mọi icon khác giữ stroke-only.

---

## 5. Hệ thống Spacing (Khoảng cách)

| Ngữ cảnh | Token | Giá trị |
|-----------|-------|---------|
| **Card padding** | `p-4` hoặc `p-5` | 16px hoặc 20px |
| **Section gap** (giữa các cards) | `gap-4` | 16px |
| **Page horizontal padding** | `px-5` | 20px |
| **Section vertical spacing** | `mb-6` | 24px |
| **Card internal gap** (giữa icon và text) | `gap-3` | 12px |
| **Bottom page padding** (cho nav) | `pb-28` | 112px |

**Quy tắc:**
- Sử dụng spacing nhất quán trong cùng một screen.
- Không mix `p-3` và `p-5` cho các cards cùng cấp trên cùng một view.

---

## 6. Hệ thống Component & Layout (Component Rules)

### Border Radius

| Component | Class | Giá trị | CSS Token |
|-----------|-------|---------|-----------|
| **Cards** | `rounded-2xl` | 16px | `--dw-radius-card` |
| **Buttons** | `rounded-xl` | 12px | `--dw-radius-button` |
| **Modals** | `rounded-3xl` | 24px | `--dw-radius-modal` |
| **Bottom Nav** | `rounded-3xl` | 24px | `--dw-radius-modal` |
| **Controls** (tabs, inputs) | `rounded-xl` | 12px | `--dw-radius-control` |
| **Avatar/Badge** | `rounded-full` | 50% | — |

❌ KHÔNG dùng `rounded-full` cho cards. Chỉ cho avatar và badge indicators.

### Glass Classes (ưu tiên dùng thay vì viết tay)

| Class | Dùng cho |
|-------|----------|
| `.glass-card` | Card chính (blur 20px, border glass, shadow) |
| `.glass-card-strong` | Card nổi bật hơn (blur 24px, border mạnh hơn) |
| `.glass-control` | Controls nhỏ (tabs, toggles, inputs) |
| `.glass-stat` | Stat cards nhỏ |
| `.glass-nav` | Bottom navigation bar |

### Empty States (Trạng thái rỗng)

❌ Tuyệt đối **KHÔNG** dùng `"--"`, `"N/A"`, hoặc khối xám trống.

✅ Phải thiết kế UI đàng hoàng:
- Icon với opacity thấp (`opacity-50`) + animation nhẹ (`animate-pulse` trên icon nhỏ)
- Text hướng dẫn cụ thể (VD: "Chưa đồng bộ", "Kết nối thiết bị", "Hãy uống ngụm nước đầu tiên!")
- Sử dụng `text-slate-500` cho text empty state

### Visual Hierarchy

- Nội dung chính phải **chiếm spotlight** — không bị chèn bởi stats phụ.
- Giấu stats phụ vào **collapsible sections** (ẩn mặc định).
- Tránh thiết kế "đặc gạch" — mỗi section cần breathing room (`mb-6`).

---

## 7. Hệ thống Shadow (Shadow Hierarchy)

| Level | Class | Dùng cho |
|-------|-------|----------|
| **Level 0** (flat) | Không shadow | Backgrounds, dividers, inline elements |
| **Level 1** (subtle) | `shadow-sm` | Cards tĩnh trong page |
| **Level 2** (elevated) | `shadow-lg` hoặc `var(--dw-shadow-glass-soft)` | Floating elements, FAB button, dropdowns |
| **Level 3** (dramatic) | `shadow-2xl` + glow effect | Modals, spotlight items, hero cards |

**Glow effects (dùng tiết kiệm):**
```css
/* Cyan glow — cho active/highlight items */
shadow-[0_0_20px_rgba(6,182,212,0.15)]

/* Gold glow — CHỈ cho champion/rank #1 */
shadow-[0_0_30px_rgba(250,204,21,0.4)]
```

❌ KHÔNG lạm dụng glow. Chỉ dùng cho 1-2 focal elements trên mỗi screen.

---

## 8. Hệ thống Animation & Motion

### Timing Standards

| Loại | Duration | Easing | Dùng cho |
|------|----------|--------|----------|
| **Micro-interaction** | `150-200ms` | `ease-out` | Button press, tab switch, toggle |
| **Content enter** | `300-400ms` | `spring(bounce: 0.15)` | Card slide in, list appear |
| **Modal overlay** | `250ms` | `ease-in-out` | Modal open/close, sheet |
| **Page transition** | `300ms` | `ease-out` | Tab content swap |
| **Number counter** | `800-1200ms` | `ease-out` | AnimatedCounter, progress fill |

### CSS Motion Tokens

```css
:root {
  --dw-motion-ease: 180ms cubic-bezier(0.2, 0, 0, 1);
  --dw-motion-spring: 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Quy tắc Animation

- ✅ `active:scale-95` cho tất cả buttons (cảm giác nhấn xuống)
- ✅ `transition-all duration-200 ease-out` cho hover states
- ✅ `animate-pulse` CHỈ cho dots/badges nhỏ (≤ 16px)
- ❌ KHÔNG dùng `animate-pulse` cho elements lớn — gây distraction
- ❌ KHÔNG dùng animation duration > 600ms cho micro-interactions

---

## 9. Interactive States (Trạng thái tương tác)

### Button States

| State | Style |
|-------|-------|
| **Default** | Theo variant (primary/ghost/danger) |
| **Hover** | `hover:bg-white/10` hoặc border glow `hover:border-cyan-500/30` |
| **Active/Press** | `active:scale-95 transition-transform duration-150` |
| **Disabled** | `opacity-50 cursor-not-allowed` — KHÔNG thay đổi màu |
| **Focus** | `ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-slate-950` |

### Card States

| State | Style |
|-------|-------|
| **Default** | `.glass-card` |
| **Hover** | `hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]` |
| **Active/Tap** | `active:scale-[0.98] transition-transform` |

### Tab/Toggle States

| State | Style |
|-------|-------|
| **Inactive** | `bg-white/5 text-meta border border-white/10` |
| **Active** | `.active-treatment` (cyan bg/border/text) |
| **Hover (inactive)** | `hover:bg-white/10` |

---

## 10. Contrast & Accessibility

### Minimum Contrast Ratios (trên nền `slate-950`)

| Text level | Class | Contrast | Dùng cho |
|------------|-------|----------|----------|
| **Primary** | `text-white` | ≥ 15:1 ✅ | Tiêu đề, hero numbers, tên user |
| **Secondary** | `text-slate-300` | ≥ 7:1 ✅ | Body text, descriptions |
| **Muted** | `text-slate-400` | ≥ 4.5:1 ✅ | Captions, timestamps, labels phụ |
| **Decorative** | `text-slate-500` | ~3:1 ⚠️ | CHỈ cho decorative text, dividers |

### Focus States (Keyboard Navigation)

- ✅ Tất cả interactive elements (buttons, links, inputs, tabs) **PHẢI** có visible focus ring.
- Focus ring chuẩn: `focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`
- ❌ KHÔNG dùng `outline: none` mà không có replacement focus indicator.
- ✅ Sử dụng `focus-visible` thay vì `focus` để tránh hiển thị ring khi click chuột.

### Screen Reader (ARIA Support)

- ✅ Water Gauge: `aria-label="Tiến độ uống nước: {waterIntake} trên {waterGoal} ml"` + `role="progressbar"`
- ✅ Bottom nav tabs: `role="tablist"` (container) + `role="tab"` + `aria-selected` (mỗi tab)
- ✅ Modal overlays: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- ✅ Icon-only buttons: **BẮT BUỘC** có `aria-label` (VD: `aria-label="Quét mã"` cho camera button)
- ✅ Loading states: `aria-busy="true"` + `aria-live="polite"` cho dynamic content

### Touch Targets

- ✅ Minimum **44x44px** cho tất cả interactive elements (theo WCAG 2.1 AA).
- ⚠️ Nếu visual size < 44px (VD: icon 32px), padding phải bù đủ: `p-1.5` trở lên.

**Quy tắc chung:**
- ❌ KHÔNG dùng `text-slate-600` trở đi cho **bất kỳ text nào cần đọc**.
- ❌ `text-slate-500` CHỈ dùng cho thông tin không quan trọng (timestamps, hint text).

---

## 11. Responsive Behavior

- **Layout:** Mobile-first, `max-w-md mx-auto` cho **TẤT CẢ** viewports.
- **KHÔNG BAO GIỜ** stretch full-width trên desktop/tablet.
- Background ambient glow (`blur-[120px]`) fill phần dư bên ngoài `max-w-md`.
- Bottom nav luôn fixed bottom, respects `env(safe-area-inset-bottom)`.

```
┌─────────────────────────────────────────┐
│          Dark ambient glow              │
│     ┌─────────────────────┐             │
│     │   max-w-md app      │             │
│     │   content area      │             │
│     │                     │             │
│     │   ┌─────────────┐   │             │
│     │   │  glass-nav  │   │             │
│     │   └─────────────┘   │             │
│     └─────────────────────┘             │
│          Dark ambient glow              │
└─────────────────────────────────────────┘
```

---

## 12. Điểm nhấn Đặc trưng (Signature Elements — Do NOT break)

- **Water Gauge:** Vòng tròn nước ở màn Home với hiệu ứng chất lỏng là linh hồn của app. KHÔNG refactor component này nếu không được yêu cầu.
- **Bottom Navigation:** Giữ hiệu ứng glassmorphism, spring animation indicator. Tối đa **5 tabs**: Nhà, Phân tích, BXH, Tin, Hồ sơ.
- **AI Coach:** Chat bubble bo góc mềm mại (`rounded-2xl`), thiết kế sạch, accent cyan, cảm giác thân thiện.
- **Theme Engine:** `ThemeEngine.tsx` override tất cả `cyan-*` classes. Mọi accent color PHẢI dùng cyan classes để tương thích.

---

## 13. CSS Design Tokens (index.css)

```css
:root {
  /* ── Backgrounds ── */
  --dw-bg: #020617;
  --dw-surface-1: rgba(255, 255, 255, 0.03);
  --dw-surface-2: rgba(255, 255, 255, 0.05);
  --dw-surface-3: rgba(255, 255, 255, 0.08);
  --dw-surface-solid: rgba(15, 23, 42, 0.68);

  /* ── Borders ── */
  --dw-border-subtle: rgba(255, 255, 255, 0.05);
  --dw-border-glass: rgba(255, 255, 255, 0.08);
  --dw-border-active: rgba(255, 255, 255, 0.15);

  /* ── Text ── */
  --dw-text-primary: #f8fafc;
  --dw-text-secondary: #cbd5e1;
  --dw-text-muted: #94a3b8;

  /* ── Accent ── */
  --dw-accent: #22d3ee;
  --dw-accent-contrast: #06121a;

  /* ── Semantic ── */
  --dw-success: #34d399;
  --dw-warning: #fbbf24;
  --dw-danger: #ef4444;
  --dw-info: #38bdf8;

  /* ── Shadows ── */
  --dw-shadow-glass: 0 18px 50px rgba(0, 0, 0, 0.34);
  --dw-shadow-glass-soft: 0 10px 28px rgba(0, 0, 0, 0.24);

  /* ── Radius ── */
  --dw-radius-card: 1rem;        /* 16px */
  --dw-radius-button: 0.75rem;   /* 12px */
  --dw-radius-modal: 1.5rem;     /* 24px */
  --dw-radius-control: 0.75rem;  /* 12px */

  /* ── Motion ── */
  --dw-motion-ease: 180ms cubic-bezier(0.2, 0, 0, 1);
  --dw-motion-spring: 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 14. Những điều TUYỆT ĐỐI KHÔNG làm

1. ❌ Không dùng `bg-white`, `bg-slate-100`, `bg-slate-200` cho cards
2. ❌ Không dùng `dark:` prefix pattern — app CHỈ có dark mode
3. ❌ Không dùng purple/indigo làm accent color
4. ❌ Không dùng emoji làm icon (dùng `lucide-react` only)
5. ❌ Không hiển thị `"--"` hoặc `"N/A"` cho empty states
6. ❌ Không dùng ALL-CAPS cho section headers dài (> 2 từ)
7. ❌ Không thêm tab thứ 6 vào bottom nav
8. ❌ Không dùng `rounded-full` cho cards
9. ❌ Không dùng `animate-pulse` cho elements > 16px
10. ❌ Không dùng `text-slate-600` trở xuống cho text cần đọc
11. ❌ Không dùng animation duration > 600ms cho micro-interactions
12. ❌ Không stretch layout ra full-width trên bất kỳ viewport nào
13. ❌ Không mix icon libraries — `lucide-react` only
14. ❌ Không dùng `outline: none` mà không có focus-visible replacement

---

## Changelog

| Version | Ngày | Thay đổi |
|---------|------|----------|
| **1.1** | 2026-05-09 | Thêm: Semantic Colors, Surface Levels, Iconography, ARIA/Focus rules, Changelog. Cải thiện Typography table (line-height/weight). |
| **1.0** | 2026-05-09 | Khởi tạo: 13 sections bao gồm Core Aesthetic, Color, Typography, Spacing, Components, Shadow, Motion, Interactive States, Accessibility, Responsive, Signature Elements, Tokens, Prohibitions. |
