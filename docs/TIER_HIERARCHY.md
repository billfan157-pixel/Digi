# Tier Hierarchy Reference

Quy tắc phân cấp cho theme, frame, sound trong shop.

---

## 1. Hệ thống gating

### Rarity (Độ hiếm)

| Rarity | Bậc | Khoảng giá | Khoảng cấp |
|--------|:---:|-----------:|-----------:|
| common | 1 | 0–200 | 1 |
| rare | 2 | 200–400 | 5–12 |
| epic | 3 | 400–1.200 | 15–30 |
| legendary | 4 | 600–5.000 | 25–60 |
| mythic | 5 | 5.000 | 50 |

### Subscription Tier

| Tier | Gating | Mô tả |
|------|--------|-------|
| free | Mặc định | Không dùng được premium items |
| plus | `required_tier: 'plus'` | Dùng được Plus premium |
| pro | `required_tier: 'pro'` | Dùng được Pro premium (cao nhất) |

### Các trục phân cấp

Mọi item đều bị gate bởi 3 trục:
1. **required_level** — cấp độ profile
2. **required_tier** — subscription tier (chỉ premium)
3. **Price** — xu trong game

---

## 2. Themes

### 2.1 Free themes (21 themes)

Chia làm 5 sub-tier từ thấp đến cao.

#### Sub-tier 1 — Sơ Cấp (common, lv1–3, 0–150₡)

| # | ID | Name | Effect | Giá | Cấp | Glass | Glow |
|:-:|-----|------|--------|:---:|:---:|:-----:|:----:|
| 1 | `theme_default` | Mặc Định | `none` | 0 | 1 | none | 0.15 |
| 2 | `theme_water` | Hồ Thủy Tiên | `water-ripples` | 100 | 1 | gradient | 0.2 |
| 3 | `theme_jade` | Lục Bảo | `floating-particles` | 150 | 3 | gradient | 0.25 |

> Effect nhẹ nhàng, glow thấp. Mở khóa ngay từ đầu.

#### Sub-tier 2 — Phổ Thông (common, lv5–8, 200–250₡)

| # | ID | Name | Effect | Giá | Cấp | Glass | Glow |
|:-:|-----|------|--------|:---:|:---:|:-----:|:----:|
| 4 | `theme_yellow` | Ánh Dương | `floating-particles` | 200 | 5 | gradient | 0.3 |
| 5 | `theme_sakura` | Hoa Anh Đào | `floating-particles` | 250 | 7 | gradient | 0.25 |
| 6 | `theme_crystal` | Pha Lê Băng | `water-ripples` | 250 | 8 | gradient | 0.35 |

> Nâng cấp từ Tier 1, glow cao hơn. Cần đạt cấp 5–8.

#### Sub-tier 3 — Trung Cấp (rare, lv10–12, 300–400₡)

| # | ID | Name | Effect | Giá | Cấp | Glass | Glow |
|:-:|-----|------|--------|:---:|:---:|:-----:|:----:|
| 7 | `theme_violet` | Màn Đêm | `space-stars` | 300 | 10 | gradient | 0.3 |
| 8 | `theme_lime` | Rừng Nhiệt Đới | `floating-particles` | 300 | 10 | gradient | 0.25 |
| 9 | `theme_forest` | Rừng Nguyên Sinh | `floating-particles` | 350 | 10 | gradient | 0.3 |
| 10 | `theme_ocean` | Đại Dương Xanh | `water-ripples` | 350 | 10 | gradient | 0.3 |
| 11 | `theme_crimson` | Hoa Hồng Máu | `fire-embers` | 350 | 12 | gradient | 0.35 |

> Xuất hiện effect mới: `space-stars`, `fire-embers`. Glow đồng đều 0.25–0.35.

#### Sub-tier 4 — Cao Cấp (epic, lv15–20, 450–550₡)

| # | ID | Name | Effect | Giá | Cấp | Glass | Glow |
|:-:|-----|------|--------|:---:|:---:|:-----:|:----:|
| 12 | `theme_midnight` | Bầu Trời Sao | `space-stars` | 450 | 15 | gradient | 0.35 |
| 13 | `theme_cyan` | Xanh Lục Lam | `cyber-grid` | 500 | 15 | grid | 0.45 |
| 14 | `theme_cyber` | Cyber Neon | `cyber-grid` | 500 | 15 | grid | 0.45 |
| 15 | `theme_imperial` | Hoàng Kim | `golden-rays` | 550 | 18 | gradient | 0.45 |
| 16 | `theme_sunset` | Hoàng Hôn | `fire-embers` | 500 | 20 | gradient | 0.35 |

> Effect mạnh: `cyber-grid`, `golden-rays`, `space-stars`. Grid glass lần đầu xuất hiện. Glow 0.35–0.45.

#### Sub-tier 5 — Đỉnh Cao (legendary, lv25–35, 600–800₡)

| # | ID | Name | Effect | Giá | Cấp | Glass | Glow |
|:-:|-----|------|--------|:---:|:---:|:-----:|:----:|
| 17 | `theme_red` | Mặt Trời Lửa | `golden-rays` | 600 | 25 | gradient | 0.45 |
| 18 | `theme_cyberpunk` | Cyberpunk 2077 | `cyber-grid` | 600 | 25 | grid | 0.6 |
| 19 | `theme_aurora` | Cực Quang | `aurora-waves` | 700 | 28 | gradient | 0.45 |
| 20 | `theme_abyss` | Vực Thẳm Không Gian | `space-stars` | 800 | 30 | none | 0.6 |
| 21 | `theme_royal` | Đế Vương Hoàng Gia | `golden-rays` | 800 | 35 | gradient | 0.55 |

> Từ tier này glow tối thiểu 0.45. Hiệu ứng `golden-rays` xuất hiện ở 2 theme (red + royal).

### 2.2 Premium Plus themes (6 themes)

Có exclusive effect + overlay effect.

| # | ID | Name | Giá | Cấp | Effect | Overlay | Glass | Glow |
|---|-----|------|---:|:---:|--------|:-------:|:-----:|:----:|
| 1 | `premium_galaxy` | Ngân Hà | 2.000 | 30 | `pearl-shimmer` | `space-stars` | satin | 0.5 |
| 2 | `premium_storm` | Bão Điện | 2.500 | 35 | `silk-sweep` | `cyber-grid` | grid | 0.6 |
| 3 | `premium_ember` | Hồng Lửa | 2.000 | 30 | `depth-breathe` | `fire-embers` | satin | 0.55 |
| 4 | `premium_aurora_green` | Cực Quang Xanh | 3.000 | 40 | `silk-sweep` | `aurora-waves` | satin | 0.45 |
| 5 | `premium_nebula` | Tinh Vân | 2.500 | 35 | `pearl-shimmer` | `floating-particles` | lens | 0.5 |
| 6 | `premium_frost` | Băng Giá | 2.000 | 30 | `canvas-texture` | `cyber-grid` | lens | 0.6 |

### 2.3 Premium Pro themes (4 themes)

Exclusive effect + exclusive overlay.

| # | ID | Name | Giá | Cấp | Effect | Overlay | Glass | Glow |
|---|-----|------|---:|:---:|--------|:-------:|:-----:|:----:|
| 1 | `premium_dragon` | Huyết Long | 4.000 | 50 | `depth-breathe` | `golden-rays` | satin | 0.6 |
| 2 | `premium_heaven` | Thiên Giới | 4.500 | 55 | `pearl-shimmer` | `golden-rays` | lens | 0.5 |
| 3 | `premium_void` | Hư Vô | 4.000 | 50 | `canvas-texture` | `space-stars` | satin | 0.35 |
| 4 | `premium_divine` | Ánh Sáng | 5.000 | 60 | `silk-sweep` | `floating-particles` | lens | 0.45 |

### 2.4 Effect Catalog

| ID | Loại | Dùng trong |
|----|------|------------|
| `none` | — | theme_default |
| `cyber-grid` | Standard | cyan, cyber, cyberpunk, storm(overlay), frost(overlay) |
| `aurora-waves` | Standard | aurora, aurora_green(overlay) |
| `space-stars` | Standard | violet, midnight, abyss, galaxy(overlay), void(overlay) |
| `floating-particles` | Standard | jade, lime, forest, sakura, yellow, nebula(overlay), divine(overlay) |
| `fire-embers` | Standard | crimson, sunset, ember(overlay) |
| `water-ripples` | Standard | water, ocean, crystal |
| `golden-rays` | Standard | imperial, red, royal, dragon(overlay), heaven(overlay) |
| `pearl-shimmer` | **Premium exclusive** | galaxy, nebula, heaven |
| `silk-sweep` | **Premium exclusive** | storm, aurora_green, divine |
| `canvas-texture` | **Premium exclusive** | frost, void |
| `depth-breathe` | **Premium exclusive** | ember, dragon |

### 2.5 Quy tắc phân cấp theme

1. **Free themes** chỉ dùng standard effects (8 loại)
2. **Premium themes** dùng exclusive effects (4 loại) + có `overlayEffect` (xếp 2 hiệu ứng)
3. **Premium Pro** có exclusive effect + overlay cũng là exclusive
4. `glassGlowIntensity` tăng dần: free (0.15–0.6) → plus (0.45–0.6) → pro (0.5–0.6)
5. `glassPattern` cao cấp hơn: free dùng `gradient`/`grid`/`none`, premium dùng `satin`/`lens`

---

## 3. Frames

### Danh sách (từ thấp đến cao)

| # | ID | Name | Rarity | Giá | Cấp | Tier | Độ phức tạp |
|---|-----|------|--------|---:|:---:|:----:|:-----------:|
| 1 | `frame_aqua_pulse` | Nhịp Nước | common | 0 | 1 | free | **Simple** — 3 vòng xung |
| 2 | `frame_bamboo` | Tre Trúc | common | 150 | 1 | free | **Moderate** — 8 đốt tre + 2 quỹ đạo |
| 3 | `frame_deep_ocean` | Đại Dương Sâu | rare | 200 | 5 | free | **Moderate** — 8 bong bóng |
| 4 | `frame_sunset` | Hoàng Hôn | rare | 250 | 8 | free | **Moderate** — Vòng cung gradient |
| 5 | `frame_heartbeat` | Nhịp Tim | rare | 300 | 10 | free | **Moderate** — Đường EKG |
| 6 | `frame_ice_crystal` | Băng Tinh | rare | 350 | 12 | free | **Complex** — 18 đường tinh thể |
| 7 | `frame_zen_garden` | Vườn Thiền | rare | 350 | 10 | free | **Moderate** — 5 cánh hoa rơi |
| 8 | `frame_energy_aura` | Hào Quang Năng Lượng | epic | 400 | 15 | free | **Moderate** — 4 tia lửa điện |
| 9 | `frame_thunder` | Sấm Sét | epic | 500 | 18 | free | **Complex** — 2 tia chớp + filter glow |
| 10 | `frame_fire_streak` | Ngọn Lửa Streak | epic | 600 | 20 | free | **Complex** — 12 ngọn lửa + filter blur |
| 11 | `frame_aurora` | Cực Quang | epic | 800 | 30 | free | **Complex** — Conic gradient + mask |
| 12 | `frame_galaxy_swirl` | Xoáy Ngân Hà | legendary | 1.000 | 35 | free | **Premium** — Gradient core + 2 spin orbits |
| 13 | `frame_premium_silver` | Bạc Quý | epic | 1.200 | 20 | plus | **Premium** — 3 gradient shine arcs |
| 14 | `frame_diamond` | Kim Cương Kỷ Luật | legendary | 1.500 | 50 | free | **Premium** — 6 shards gradient |
| 15 | `frame_premium_gold` | Hoàng Kim | legendary | 1.500 | 30 | plus | **Premium** — 4 shards glow + 2 orbits |
| 16 | `frame_premium_lunar` | Nguyệt Cầu | legendary | 1.800 | 30 | plus | **Premium** — Trăng + 5 sao + glow |
| 17 | `frame_premium_phoenix` | Phượng Hoàng | legendary | 2.000 | 35 | plus | **Premium** — 8 lông vũ lửa |
| 18 | `frame_premium_dragon` | Long Thần | mythic | 5.000 | 50 | pro | **Premium** — 12 vảy rồng + 2 quỹ đạo lửa |

### Quy tắc phân cấp frame

1. **Simple** → chỉ border + 1 animation
2. **Moderate** → particles hoặc geometric shapes
3. **Complex** → SVG filters, multi-layer elements
4. **Premium** → gradients, `<defs>`, multi-orbit, glints
5. `mythic` rarity chỉ dùng cho `frame_premium_dragon` (cao nhất)
6. Frame càng đắt càng có nhiều phần tử SVG, nhiều lớp animation

---

## 4. Sounds

### Danh sách (từ thấp đến cao)

| # | ID | Name | Rarity | Giá | Cấp | URL | Độ phức tạp |
|---|-----|------|--------|---:|:---:|:---:|:-----------:|
| 1 | `sound_water_drop` | Giọt nước | common | 0 | 1 | `water_drop` | **Single** — sine sweep 0.3s |
| 2 | `sound_bubble` | Bong bóng | common | 100 | 1 | `bubble` | **Multi-note** — 3 sine sweeps |
| 3 | `sound_pop` | Pop nhẹ | common | 100 | 1 | `pop` | **Single** — sine sweep 0.15s |
| 4 | `sound_click` | Click điện tử | common | 150 | 1 | `click` | **Single** — square wave 0.06s |
| 5 | `sound_tada` | Tada! | rare | 200 | 5 | `tada` | **Multi-note** — 5-note arpeggio |
| 6 | `sound_chime` | Chuông gió | rare | 250 | 5 | `chime` | **Multi-note** — 3 tones sustained |
| 7 | `sound_bell` | Chuông nhà thờ | rare | 300 | 10 | `bell` | **Harmonics** — 3 mixed waveforms 2s |
| 8 | `sound_xylophone` | Đàn mộc cầm | rare | 350 | 10 | `xylophone` | **Multi-note** — 4-note triangle arpeggio |
| 9 | `sound_cyber` | Cyberpunk | epic | 500 | 20 | `cyber` | **Single** — square stepped 0.65s |
| 10 | `sound_nature` | Thiên nhiên | epic | 500 | 20 | `nature` | **Harmonics** — 3 sine + noise |
| 11 | `sound_zen` | Thiền định | epic | 600 | 25 | `zen` | **Harmonics** — 2 detuned sine 1.6s |
| 12 | `sound_crystal` | Pha lê | epic | 700 | 25 | `crystal` | **Multi-note** — 3 sustained sine |
| 13 | `sound_epic` | Khải hoàn | legendary | 1.000 | 40 | `epic` | **Multi-note** — 5-note sawtooth fanfare |
| 14 | `sound_mystical` | Huyền bí | legendary | 1.200 | 50 | `mystical` | **Harmonics** — triangle + sine harmony 1.6s |

### Quy tắc phân cấp sound

1. **Single oscillator** → 1 waveform đơn, <0.5s
2. **Multi-note** → nhiều nốt nối tiếp, 0.5–1s
3. **Harmonics** → đa oscillator cùng lúc, >1s, phức tạp
4. Sound **không có** premium tier — tất cả đều mua bằng xu, không gating subscription
5. Chất lượng âm thanh tăng dần: common (ngắn, đơn) → rare (giai điệu) → epic (harmonic) → legendary (hoành tráng, dài)

---

## 5. Level Unlock Path

| Cấp | Mở khóa theme | Mở khóa frame/sound |
|:---:|---------------|---------------------|
| 1 | Tier 1 (Sơ Cấp): default, water | common sounds, 2 free frames |
| 3 | Tier 1: jade | — |
| 5 | Tier 2 (Phổ Thông): yellow | rare sounds |
| 7 | Tier 2: sakura | — |
| 8 | Tier 2: crystal | frame sunset |
| 10 | Tier 3 (Trung Cấp): violet, lime, forest, ocean | frame heartbeat, bell/xylophone |
| 12 | Tier 3: crimson | frame ice_crystal |
| 15 | Tier 4 (Cao Cấp): midnight, cyan, cyber | frame energy aura |
| 18 | Tier 4: imperial | frame thunder |
| 20 | Tier 4: sunset | epic sounds, frame fire streak |
| 25 | Tier 5 (Đỉnh Cao): red, cyberpunk | zen/crystal sounds |
| 28 | Tier 5: aurora | — |
| 30 | Tier 5: abyss | Plus premium themes, frame aurora |
| 35 | Tier 5: royal | frame galaxy swirl, premium storm/nebula |
| 40 | — | aurora green premium |
| 50 | — | premium Pro themes, dragon frame, mystical sound |
| 60 | — | divine theme (cao nhất) |

---

## 6. Subscription Gating

| Tier | Unlock |
|:----:|--------|
| **free** | 21 free themes + 15 frames + 14 sounds |
| **plus** | +6 Plus premium themes + 4 premium frames |
| **pro** | +4 Pro premium themes + 1 mythic frame (dragon) |

---

## 7. Rarity Distribution

| Rarity | Themes | Frames | Sounds | Total |
|--------|:-----:|:------:|:------:|:-----:|
| common | 6 | 2 | 4 | 12 |
| rare | 5 | 5 | 4 | 14 |
| epic | 5 | 4 | 4 | 13 |
| legendary | 15 | 6 | 2 | 23 |
| mythic | 0 | 1 | 0 | 1 |
| **Total** | **31** | **18** | **14** | **63** |
