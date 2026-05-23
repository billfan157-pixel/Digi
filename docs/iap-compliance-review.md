# IAP Compliance Review — DigiWell Premium

**Ngày review:** 23/05/2026
**Reviewer:** Sprint 8 — App Store Preparation
**Risk Level:** HIGH (rejection likely nếu không xử lý)

---

## 1. Tình trạng hiện tại

DigiWell có **DigiWell PRO** — subscription tier cung cấp tính năng nâng cao:
- AI Hydration Coach
- Smart Reminder Engine
- Streak Freeze / Redemption Quest
- Premium Health Score
- Advanced Drink System
- Smartwatch & Health Sync
- Premium Profile Frame
- VIP Club Tools
- Không quảng cáo

**Giá:**
- Monthly: 49.000 VND
- Yearly: 399.000 VND (tiết kiệm 32%)

**Payment flow hiện tại:**
- `UpgradeModal.tsx` hiển thị trong app
- Người dùng bấm "Đăng ký Pro"
- Gọi `redirectToCheckout()` trong `lib/stripe.ts`
- Trên native: `Browser.open({ url, presentationStyle: 'popover' })` mở Stripe checkout URL
- Deep link callback: `digiwell://checkout-success`

---

## 2. Apple App Store Guidelines — Phân tích

### Guideline 3.1.1 — In-App Purchase
> "If you want to unlock features or functionality within your app, you must use in-app purchase."

DigiWell PRO unlocks **digital features bên trong app** (AI, analytics, reminders, themes, profile frames). Điều này **bắt buộc phải dùng Apple In-App Purchase**.

### Guideline 3.1.3(b) — Multiplatform Services
Reader Apps và một số loại app được phép dùng payment ngoài, nhưng DigiWell là **utility/health app**, không thuộc exceptions.

### Guideline 3.1.1 — Anti-steering
> "Apps and their metadata may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase."

`UpgradeModal` có buttons "Đăng ký Pro Tháng / Năm" dẫn đến Stripe checkout. Đây là **vi phạm rõ ràng**.

**Kết luận Apple:** App sẽ bị **reject** nếu submit với flow hiện tại.

---

## 3. Google Play Policy — Phân tích

### Payments policy
> "Developers offering products within a game downloaded from Google Play or providing access to game content must use Google Play's billing system for in-app purchases."

Mặc dù DigiWell không phải game, nhưng vẫn là app cung cấp digital content. Google Play yêu cầu dùng **Google Play Billing** cho digital goods.

### Alternative Billing
Google có chương trình Alternative Billing (chỉ ở một số thị trường như EU, Nhật, Hàn, Ấn Độ). Việt Nam **không nằm trong danh sách**.

**Kết luận Google:** Cần Google Play Billing cho purchase trong app.

---

## 4. Các phương án xử lý

| Phương án | Effort | Risk | Recommendation |
|-----------|--------|------|----------------|
| A. Integrate Apple IAP + Google Play Billing | 2-3 sprints | Low (compliant) | **Long-term** |
| B. Integrate RevenueCat (unified IAP) | 1-2 sprints | Low | **Long-term** |
| C. Disable purchase on mobile, redirect to web | 1 giờ | Medium | **Short-term** |
| D. Hide UpgradeModal hoàn toàn trên native | 30 phút | Low | **Short-term** |

### Phương án C — Disable purchase on mobile (đã chọn)

**Logic:**
- Trên native platform (iOS/Android): `UpgradeModal` vẫn hiển thị thông tin về Premium
- Ẩn buttons "Đăng ký Pro" và thay bằng message: "Premium đang được tối ưu cho ứng dụng di động. Vui lòng truy cập digiwell.app trên trình duyệt để nâng cấp."
- Web platform: giữ nguyên Stripe flow

**Risk:** Vẫn có thể bị xem là "advertising external purchase" tùy reviewer. Nhưng risk thấp hơn nhiều so với có CTA button.

**Next step:** Khi có resource, integrate RevenueCat hoặc native IAP để enable purchase trên mobile.

---

## 5. Code Changes Required

### 5.1 `src/components/modals/UpgradeModal.tsx`
- Import `Capacitor` from `@capacitor/core`
- Trong render, nếu `Capacitor.isNativePlatform()`:
  - Ẩn 2 buttons checkout
  - Hiển thị message + link mở `Browser.open({ url: 'https://digiwell.app/upgrade' })` (hoặc chỉ hiển thị text)

### 5.2 `src/lib/stripe.ts`
- Không cần thay đổi (web flow vẫn hoạt động)

### 5.3 Deep links
- Giữ nguyên `digiwell://checkout-success` (có thể dùng sau khi integrate IAP)

---

## 6. Decision Log

| Date | Decision | Owner | Rationale |
|------|----------|-------|-----------|
| 23/05/2026 | Disable Stripe checkout on native platforms | Sprint 8 | Avoid rejection. Enable true IAP in Sprint 9+ |

---

## 7. Action Items

- [x] Review compliance (this doc)
- [x] Update `UpgradeModal.tsx` to hide purchase CTA on native
- [ ] Create follow-up ticket: "Integrate RevenueCat for unified IAP (iOS + Android + Web)"
- [ ] Create follow-up ticket: "Remove native purchase restriction once IAP is live"
