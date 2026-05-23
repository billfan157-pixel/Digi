# Sprint 11–12: Freemium Model + Performance Audit

**Sprint Goal:** App có baseline performance đo lường được + freemium model 3-tier hoạt động trên production.

**Thời gian:** 2 tuần

---

## Current State (Post-Sprint 10)

| Mục | Trạng thái |
|-----|-----------|
| Premium binary (`isPremium: boolean`) | `useAppStore` + `useIsPremium()` — hoạt động |
| Feature gate config (`FEATURES`, `DAILY_LIMITS`) | `src/config/premium.ts` — định nghĩa đầy đủ |
| Feature gate enforcement (`useFeature`, `RequirePremium`) | Hooks + UI component — hoạt động |
| IAP-compliant upgrade flow | `UpgradeModal.tsx` + `lib/stripe.ts` — web only, native blocked |
| Subscription columns (`subscription_end`, `grace_period_end`) | `profiles` table — migration tồn tại |
| Code splitting (`manualChunks`) | `vite.config.ts` — vendor/supabase/ui/sentry/motion/charts/i18n/query |
| Bundle visualizer | `rollup-plugin-visualizer` — `dist/stats.html` |
| Daily limit enforcement | Config có nhưng chưa enforce trong hooks |
| Freemium 3-tier model | Chưa có — chỉ có free/premium binary |
| Performance monitoring | Chưa có — không Lighthouse CI, không Core Web Vitals |
| Premium waitlist | Chưa có |

---

## Story Breakdown

### 1. Performance Audit Baseline (Phase 8 Unaudited Areas)
**Points:** 4 | **Theme:** Platform Infrastructure | **Risk:** Low

Thiết lập hệ thống đo lường performance để có baseline trước khi optimize.

#### Tasks
1. **Lighthouse CI workflow**
   - Thêm `.github/workflows/lighthouse.yml`
   - Chạy Lighthouse trên preview URL (Vercel deploy preview) hoặc static build
   - Assertions: Performance ≥ 60, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
   - Upload report artifact
   - Không block PR nếu fail (baseline sprint này, enforcement Sprint 13+)

2. **Core Web Vitals (CWV) instrumentation**
   - Thêm `web-vitals` npm package (hoặc dùng native `PerformanceObserver`)
   - Tạo `src/lib/vitals.ts` — ghi nhận LCP, FID/INP, CLS, TTFB
   - Gửi lên analytics (Supabase `analytics_events` table hoặc Sentry)
   - Chỉ ghi ở production (`import.meta.env.PROD`)

3. **Bundle size monitoring**
   - Tạo script `scripts/analyze-bundle.mjs` — đọc `dist/assets/*.js`, tính tổng size + từng chunk
   - Fail CI nếu total JS > 2MB hoặc single chunk > 800KB
   - Log bundle composition (vendor%, supabase%, ui%, v.v.) để track regression

4. **Render performance audit (React)**
   - Dùng React DevTools Profiler trên 3 screens chính: Dashboard, Insight, BottleTab
   - Ghi nhận: re-render count, render duration, unnecessary renders
   - Tạo `docs/performance-audit-report.md` với findings

#### Acceptance Criteria
- [ ] Lighthouse CI chạy trên mỗi PR, upload artifact report
- [ ] CWV được ghi nhận trong production (LCP, INP, CLS, TTFB)
- [ ] Bundle analysis script chạy trong CI, log size composition
- [ ] Audit report có ít nhất 5 actionable findings với severity ranking
- [ ] `npm run analyze` build + mở `dist/stats.html` vẫn hoạt động

#### Files Created/Modified
- `.github/workflows/lighthouse.yml` — tạo mới
- `src/lib/vitals.ts` — tạo mới
- `scripts/analyze-bundle.mjs` — tạo mới
- `docs/performance-audit-report.md` — tạo mới
- `src/app/AppBootstrap.tsx` — gọi `reportWebVitals()`

---

### 2. Database Query Optimization (from Audit Findings)
**Points:** 3 | **Theme:** Platform Infrastructure | **Risk:** Medium

Dựa trên audit findings từ Sprint 11 (hoặc các known issues hiện tại).

#### Tasks (Planned — sẽ refine sau audit)
1. **Identify N+1 queries**
   - Review `useWaterData.ts`, `useProfileSync.ts`, `useChallenges.ts` cho nested fetches
   - Dùng `explain analyze` trong Supabase SQL Editor cho các query phổ biến
   - Fix bằng cách JOIN hoặc dùng `in()` thay vì loop queries

2. **Missing indexes**
   - Kiểm tra slow query log (đã enable trong migration `20260522000700_enable_slow_query_logging.sql`)
   - Thêm composite indexes cho: `water_logs(user_id, day)`, `user_quests(user_id, assigned_date)`
   - Kiểm tra `profiles` query — `equipped_bottle_id` có index chưa?

3. **RPC optimization**
   - Review `record_hydration_event` — execution time có ổn không?
   - Kiểm tra `assign_daily_quests` — chạy mỗi ngày, có slow không?

#### Acceptance Criteria
- [ ] Ít nhất 2 N+1 query được fix
- [ ] Ít nhất 2 composite indexes được thêm (qua migration)
- [ ] RPC execution time không tăng sau optimization
- [ ] `supabase db reset` pass sau migration mới

#### Files Modified
- `supabase/migrations/` — migration mới cho indexes
- `src/hooks/useWaterData.ts` — fix N+1 nếu có
- `src/services/profile.service.ts` — fix N+1 nếu có

---

### 3. Freemium Tier Definition + Feature Gating
**Points:** 3 | **Theme:** Monetization | **Risk:** Low

Hiện tại chỉ có binary `isPremium`. Cần chuyển thành 3-tier: **Free / Plus / Pro**.

#### Tasks
1. **Database schema update**
   - Migration: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';`
   - Giá trị hợp lệ: `'free' | 'plus' | 'pro'`
   - Cột `isPremium` giữ lại để backward compat (computed từ tier)
   - Thêm `daily_ai_messages_used`, `daily_ai_advice_used`, `ai_usage_reset_at` vào `profiles` hoặc bảng `ai_usage` mới

2. **Update `src/config/premium.ts`**
   - Thay `PremiumTier = 'free' | 'premium'` thành `SubscriptionTier = 'free' | 'plus' | 'pro'`
   - Update `FEATURES` cho 3 tier:
     - `free`: basic stats, streak calendar, weather sync, 5 AI messages/ngày, 7-day history
     - `plus`: + weekly chart, custom reminders, 15 AI messages/ngày, 30-day history, 1 streak freeze/tháng
     - `pro`: + monthly chart, export report, AI coach, unlimited AI, 365-day history, smartwatch sync, VIP club tools, 2 streak freeze/tháng
   - Update `DAILY_LIMITS` cho 3 tier
   - Update `PRICING`: monthly plus/yearly plus, monthly pro/yearly pro

3. **Update hooks**
   - `useIsPremium.ts` → `useSubscriptionTier()` trả về `'free' | 'plus' | 'pro'`
   - `useFeature.ts` → check theo tier mới
   - `useDailyLimit.ts` (tạo mới): enforce daily AI limits, reset at midnight
   - Khi limit hit: toast thông báo, suggest upgrade

4. **Update `RequirePremium` / gating UI**
   - `RequirePremium` nhận `requiredTier?: 'plus' | 'pro'` prop
   - Nếu user tier < required: show upgrade CTA với tier-specific messaging
   - Badge hiển thị: "Plus" / "Pro" thay vì chỉ "Premium"

5. **Update `UpgradeModal.tsx`**
   - 2 cards: Plus và Pro với pricing và feature comparison
   - Native: vẫn block Stripe, redirect to web
   - Web: Stripe checkout với `price_id` tương ứng tier

#### Acceptance Criteria
- [ ] Migration tạo `subscription_tier` column + daily limit tracking
- [ ] `useSubscriptionTier()` trả về đúng tier từ profile
- [ ] `useFeature('aiWeeklyReport')` trả về `true` cho plus/pro, `false` cho free
- [ ] `useDailyLimit('aiMessages')` block sau khi vượt quá limit, toast + suggest upgrade
- [ ] `UpgradeModal` hiển thị 2-tier pricing (Plus vs Pro)
- [ ] Backward compat: `isPremium = tier === 'pro'` (hoặc include plus)

#### Files Modified
- `supabase/migrations/` — tier column + AI usage tracking
- `src/config/premium.ts` — 3-tier config
- `src/hooks/useIsPremium.ts` → rename/refactor
- `src/hooks/useFeature.ts` — 3-tier checking
- `src/hooks/useDailyLimit.ts` — tạo mới
- `src/components/ui/RequirePremium.tsx` — tier-specific gating
- `src/components/modals/UpgradeModal.tsx` — 2-tier pricing UI
- `src/lib/stripe.ts` — tier-specific checkout

---

### 4. Premium Waitlist (Pre-DigiBottle Hardware)
**Points:** 2 | **Theme:** Monetization | **Risk:** Low

Form đăng ký waitlist cho người dùng muốn mua DigiBottle trước khi hardware có sẵn.

#### Tasks
1. **Database: `hardware_waitlist` table**
   ```sql
   CREATE TABLE public.hardware_waitlist (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT NOT NULL,
     tier_interest TEXT CHECK (tier_interest IN ('standard', 'pro_kit')),
     quantity INTEGER DEFAULT 1,
     created_at TIMESTAMPTZ DEFAULT now(),
     notified_at TIMESTAMPTZ,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'purchased', 'cancelled'))
   );
   ```
   - RLS: user đọc/ghi dòng của mình, admin đọc tất cả
   - Unique constraint: `(user_id)` — 1 entry per user

2. **Waitlist form component**
   - `src/components/modals/HardwareWaitlistModal.tsx`
   - Fields: email (pre-fill từ profile), tier interest (Standard / Pro Kit), quantity (1-3)
   - Submit → Supabase insert
   - After submit: show confirmation + "Bạn là người thứ {rank} trong danh sách"

3. **Waitlist ranking display**
   - Query `COUNT(*) FROM hardware_waitlist WHERE created_at <= $current_user_created_at`
   - Hiển thị rank trong modal sau submit

4. **Admin dashboard entry**
   - Thêm vào `AdminDashboardModal.tsx`: tổng số waitlist, breakdown by tier, export CSV
   - Chỉ hiển thị nếu user có admin role

5. **Placement trong app**
   - Tab BottleTab: nếu chưa có device kết nối, hiển thị banner "DigiBottle sắp ra mắt — Đăng ký trước"
   - Settings: thêm mục "DigiBottle Waitlist"

#### Acceptance Criteria
- [ ] User có thể submit waitlist với email, tier, quantity
- [ ] Mỗi user chỉ 1 entry (unique constraint)
- [ ] Sau submit hiển thị rank trong waitlist
- [ ] Admin có thể xem tổng số waitlist và export
- [ ] Form UI match dark theme, text tiếng Việt

#### Files Created/Modified
- `supabase/migrations/` — `hardware_waitlist` table + RLS
- `src/components/modals/HardwareWaitlistModal.tsx` — tạo mới
- `src/components/modals/AdminDashboardModal.tsx` — thêm waitlist stats
- `src/tabs/BottleTab.tsx` — thêm waitlist banner
- `src/components/modals/SettingsModal.tsx` — thêm waitlist menu item

---

## Dependencies & Blockers

| # | Dependency | Owner | Risk | Mitigation |
|---|-----------|-------|------|------------|
| 1 | Stripe price IDs cho Plus/Pro | Dev + Stripe dashboard | Low | Tạo 2 products trong Stripe test mode trước |
| 2 | `web-vitals` package | Dev | Low | `npm install web-vitals`, ~3KB |
| 3 | Lighthouse CI runner (Ubuntu) | GitHub Actions | Low | Dùng `actions/lighthouse-ci-action` hoặc `lhci` CLI |
| 4 | Slow query log data | Supabase | Medium | Cần production traffic thực, nếu không đủ data thì audit dựa trên code review |

---

## Verification Plan

### Automated Tests
- Unit tests cho `useSubscriptionTier()`, `useFeature()`, `useDailyLimit()`
- Migration tests: `supabase db reset` pass
- Bundle analysis script: test với known sizes

### Manual Verification
1. **Freemium flow:**
   - User free → dùng AI 5 lần → lần 6 bị block → toast upgrade → mở UpgradeModal → chọn Plus/Pro
2. **Waitlist flow:**
   - BottleTab banner → click → fill form → submit → see rank → admin dashboard check
3. **Performance:**
   - Run Lighthouse locally: `npx lighthouse http://localhost:5173 --output html`
   - Check CWV in console (log từ vitals.ts)
   - Run `npm run analyze` → verify `dist/stats.html`

---

## Definition of Done (Sprint 11–12)

```
☑ Lighthouse CI chạy trên mỗi PR, upload artifact
☑ CWV (LCP, INP, CLS, TTFB) log trong production
☑ Bundle size guard fail nếu JS > 2MB
☑ Audit report có ≥ 5 actionable findings
☑ Freemium 3-tier (Free/Plus/Pro) hoạt động trong UI và logic
☑ Daily AI limit enforce đúng, reset at midnight
☑ UpgradeModal hiển thị Plus vs Pro pricing
☑ Hardware waitlist form hoạt động, user thấy rank sau submit
☑ Admin dashboard có waitlist stats
☑ Tất cả tests pass, typecheck pass, build pass
☑ `supabase db reset` pass với migration mới
```
