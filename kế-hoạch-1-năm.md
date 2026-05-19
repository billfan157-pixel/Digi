# KẾ HOẠCH PHÁT TRIỂN DIGIWELL 1 NĂM (05/2026 - 05/2027)

> Baseline cập nhật ngày 19/05/2026 sau khi fix lỗi compile và triển khai phần đầu Sprint 11. Đây là kế hoạch thực chiến cho app hiện tại, không phải wishlist.

---

## PHẦN A: CHẨN ĐOÁN HIỆN TẠI

### A.1. Sứ mệnh cốt lõi
DigiWell là **huấn luyện viên hydration thông minh** cho thị trường Việt Nam: theo dõi uống nước, game hóa thói quen, cá nhân hóa theo ngữ cảnh, và dùng Premium làm nguồn thu chính.

Giá trị cốt lõi:
1. **Hydration tracking đáng tin** - log, edit, delete, preset, streak, quest.
2. **Cá nhân hóa** - mục tiêu nước theo hồ sơ, thời tiết, lịch, sức khỏe, hành vi.
3. **Retention bằng game/social** - level, WP, league, club, battle, feed.
4. **Premium có giá trị thật** - AI coach, advanced analytics, report, health/calendar/weather sync.

### A.2. Architecture tổng quan

```text
App.tsx (ErrorBoundary)
  -> AppBootstrap (Supabase + QueryClient + Theme + Stripe callback)
    -> AppShell (view router: welcome | login | register | app | locked)
      -> BottomNav
        -> HomeTab       hydration ring, quick add, weather, devices
        -> InsightTab    analytics, calendar, AI coach, report
        -> LeagueTab     leaderboard, clubs, battle arena
        -> FeedTab       social feed, comments, cheers, stories
        -> BottleTab     bottle/device config
        -> ProfileTab    stats, shop, settings, premium
```

### A.3. State/Data Flow

```text
useAppSystem
  -> useAppShellController
    -> useAppTabProps
      -> Zustand stores
        -> TanStack Query cho một phần server state
          -> Supabase services/hooks
```

Điểm cần cải thiện: vẫn còn nhiều Supabase calls trực tiếp trong hooks/components. Không cần migrate ồ ạt, nhưng các luồng có cache/optimistic UI nên đi qua React Query hoặc service layer.

### A.4. Database Maturity

**46 migration files**. Các nhóm bảng chính:
- `profiles` - hồ sơ, subscription, wellness fields, grace period.
- `water_logs` - hydration entries.
- `ai_conversations`, `ai_messages`, `ai_usage`, `ai_reports` - AI Coach/memory/reporting.
- `social_posts`, `social_comments`, `post_cheers`, `follows`, `friends` - social.
- `clubs`, `club_members`, `club_messages`, `club_activity` - club.
- `hydration_battles`, `leagues`, `league_members` - competition.
- `shop_items`, `inventory_items`, `badges`, `user_badges` - economy/cosmetics.
- `push_subscriptions`, widget-related tables/cache - extensions.

Lưu ý: repo không có table `ai_memory`; memory hiện dùng `ai_conversations` + `ai_messages`.

### A.5. Baseline Hiện Tại

| Metric | Hiện tại | Đánh giá |
|--------|----------|----------|
| TypeScript check | 0 lỗi (`tsc` pass) | Tốt |
| Production build | Pass, ~7.51s | Tốt |
| Test suite | 269 tests / 18 files pass | Khá hơn MVP, vẫn cần coverage theo luồng |
| `as unknown as Record` | 0 | Đã sạch |
| Type debt rộng hơn (`as unknown`, `any`, `@ts-ignore`) | 32 hit | Cần dọn có chọn lọc |
| Hook files gọi Supabase trực tiếp | 12/50 hook files, 41 call sites | Cần giảm ở luồng core |
| React lazy/import split | 21 hit | Ổn |
| PWA precache | ~3.1MB | Chấp nhận được, cần audit cache |
| Bundle chunks lớn | `vendor` ~119KB gzip, `bootstrap` ~61KB gzip, `sentry` ~55KB gzip, `supabase` ~50KB gzip | Chưa khẩn cấp |

### A.6. Feature Completion Matrix

| Feature | Status | Ghi chú thực tế |
|---------|--------|-----------------|
| Hydration tracking | Done | CRUD, preset, offline queue cơ bản |
| Streak / level / coins / WP | Done | Có freeze/tier/gamification |
| Daily quests | Done | RPC + quest engine |
| Shop/cosmetics | Done | Bottles, frames, themes, sounds |
| Feed/social | Core done | Còn cần scale feed/query/notification |
| Clubs | Core done | Dashboard/chat/admin có nền |
| Battle Arena | Core done | Cần realtime/polish |
| Premium subscription | Core done | Stripe flow có; cần entitlement audit + portal/restore mạnh hơn |
| AI Coach V2 | In progress | Behavior context, streaming, memory, free summary, correlation đã có nền |
| Analytics/Insight | Core done | Premium chart/heatmap, free summary, correlation fallback |
| Weather + Calendar | Done | Cần gating/cache/edge cases |
| Apple Health / Google Fit | Basic | Read path có; write-back chưa chắc |
| Biometric unlock | Done | Đã tích hợp |
| Push notification | Scaffold | Web push + edge function có nền; cần production validation |
| Offline sync | Basic | Queue + replay; conflict resolver còn mỏng |
| Native widget | Partial | Có native/config/schema rải rác; chưa coi là production-ready |
| WatchOS / WearOS | Not started | Stretch goal |
| PWA | Basic | Cần cache/update UX |

---

## PHẦN B: NGUYÊN TẮC ROADMAP

1. **Không mở thêm platform lớn khi revenue/retention chưa chứng minh.**
2. **Mỗi sprint phải ship được và rollback được.**
3. **Core hydration, subscription, notification, offline phải ổn trước native/watch.**
4. **Không refactor rộng nếu không có test bảo vệ.**
5. **Ưu tiên Must > Should > Stretch. Stretch không được chặn release.**

---

## PHẦN C: ROADMAP 12 THÁNG

### GIAI ĐOẠN 0: BASELINE STABILIZATION (Đã làm ngày 19/05/2026)

| Task | Kết quả |
|------|---------|
| Fix TypeScript errors | `tsc` pass |
| Fix build blockers | `npm run build` pass |
| AI Coach V2 starter | Streaming + memory + behavior/history context |
| Roadmap baseline refresh | File này |

---

### GIAI ĐOẠN 1: PRODUCTION SAFETY (Tháng 5-6/2026)

#### Sprint 1: CI + Release Safety
**Mục tiêu:** main branch luôn build/test được.

| Priority | Task | Files ảnh hưởng | Success Condition |
|----------|------|----------------|-------------------|
| Must | CI chạy `npm run build`, `npm run test`, `tsc` | `.github/workflows/ci.yml` | PR fail nếu build/test fail |
| Must | Release smoke test thực tế | `scripts/release-smoke.mjs` | Smoke chạy được sau build |
| Must | Sentry source maps audit | `vite.config.ts`, `sentry.ts` | Stack trace map về source |
| Should | Build artifact size guard | CI script | Cảnh báo khi chunk tăng bất thường |

#### Sprint 2: Supabase/RLS/Edge Function Audit
**Mục tiêu:** Không có endpoint/table hở hoặc function thiếu guard.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Audit RLS toàn bộ exposed tables | Không còn bảng public thiếu RLS |
| Must | Rate limit toàn bộ edge functions public | AI, Stripe, calendar, push có guard hợp lý |
| Must | Kiểm tra anon/service key exposure | Không có service role trong frontend |
| Should | Document RPC permissions | Có bảng RPC -> role được execute |

---

### GIAI ĐOẠN 2: CORE RELIABILITY (Tháng 6-7/2026)

#### Sprint 3: Offline Sync Hardening
**Mục tiêu:** Uống nước offline không mất data.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Conflict resolver rõ ràng cho add/edit/delete | Replay không nhân đôi log |
| Must | Pending sync indicator | User thấy số thao tác chờ đồng bộ |
| Must | Test offline queue | Có test cho retry, drop, duplicate prevention |
| Should | Manual QA checklist slow/offline network | Có checklist release |

#### Sprint 4: Push Notification Production
**Mục tiêu:** Reminder và social push dùng được thật.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Validate web push end-to-end | Subscribe -> save -> edge send -> receive |
| Must | Remote reminder schedule | Gửi nhắc uống nước theo khung giờ |
| Should | Social push | Cheers/comment/battle invite |
| Stretch | FCM/APNs native push | Chỉ làm khi native build ổn |

---

### GIAI ĐOẠN 3: PREMIUM + REVENUE (Tháng 7-8/2026)

#### Sprint 5: Subscription Entitlement Audit
**Mục tiêu:** Premium không lệch giữa Stripe, DB, UI.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Webhook lifecycle audit | active/canceled/past_due/grace đều đúng |
| Must | `useIsPremium` + gating audit | Free không dùng premium feature |
| Must | Stripe portal/restore UX | User quản lý gói được |
| Should | Premium event tracking | Track conversion/cancel/upgrade |

#### Sprint 6: Premium Value Polish
**Mục tiêu:** Tăng lý do trả tiền, không chỉ khóa UI.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Weekly report có insight rõ | Report hữu ích, tiếng Việt tự nhiên |
| Must | AI Coach V2 hoàn chỉnh | First token nhanh, memory đúng, fallback ổn |
| Should | Advanced analytics giải thích được | Chart/heatmap/correlation có copy dễ hiểu |
| Stretch | IAP/RevenueCat | Chỉ sau khi web Stripe ổn |

---

### GIAI ĐOẠN 4: TEST COVERAGE + TYPE QUALITY (Tháng 8-9/2026)

#### Sprint 7: Test The Revenue/Core Paths
**Mục tiêu:** Test không tăng số lượng vô nghĩa, tập trung đường rủi ro.

| Area | Target |
|------|--------|
| Hydration CRUD/offline | add/edit/delete/replay/conflict |
| Premium gating | active/grace/expired/free |
| AI gateway client | JSON fallback + streaming parser |
| Quest/streak | freeze, reward, reset edge cases |
| Feed/social | cheers/comment/follow optimistic behavior |

**Success condition:** 350+ tests pass, coverage core modules >30%.

#### Sprint 8: Type Debt Cleanup
**Mục tiêu:** Dọn type debt còn lại mà không refactor logic.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Xóa các `any` dễ thay bằng domain types | Không đổi runtime |
| Must | Dọn `as unknown` còn lại | Không còn assertion mù ở core path |
| Should | Cập nhật generated Supabase types | Types khớp migration mới |
| Should | Chuẩn hóa service layer types | Hook bớt cast |

---

### GIAI ĐOẠN 5: DATA LAYER + PERFORMANCE (Tháng 9-10/2026)

#### Sprint 9: Query Migration Có Chọn Lọc
**Mục tiêu:** Giảm Supabase calls trực tiếp ở nơi gây stale data/re-render.

| Priority | Target | Pattern |
|----------|--------|---------|
| Must | Feed pagination/interactions | `useInfiniteQuery` + mutations |
| Must | Clubs/battle dashboard | Query keys + invalidation rõ |
| Should | Weather/calendar cache | staleTime/cacheTime hợp lý |
| Should | Settings/profile mutations | service layer + optimistic update nhẹ |

**Success condition:** hooks gọi Supabase trực tiếp giảm từ 12 files xuống <6 hook files.

#### Sprint 10: Performance Pass
**Mục tiêu:** App mượt hơn trên mobile tầm trung.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Feed virtual list hoặc pagination tốt hơn | Scroll không giật với feed dài |
| Must | Recharts/dynamic import audit | Insight không kéo nặng initial |
| Should | Sentry chunk strategy | Sentry không làm initial chunk phình |
| Should | PWA cache update UX | User biết khi có bản mới |

---

### GIAI ĐOẠN 6: NATIVE WIDGETS (Tháng 10-11/2026)

#### Sprint 11: Widget Productionization
**Mục tiêu:** Widget là feature engagement thật, không phải demo.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | iOS widget đọc shared data ổn | Progress đúng sau khi log nước |
| Must | Android widget cập nhật ổn | AppWidgetProvider refresh đúng |
| Must | Sync bridge từ app -> native | Không mất dữ liệu khi app background |
| Should | Widget config UI | Chọn theme/size/action |

---

### GIAI ĐOẠN 7: ANALYTICS + EXPORT (Tháng 11-12/2026)

#### Sprint 12: Product Analytics
**Mục tiêu:** Biết user dùng gì, drop ở đâu, premium convert thế nào.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Event tracking core funnel | onboarding, first log, streak 3/7, premium click |
| Must | Revenue events | checkout start/success/cancel |
| Should | Admin dashboard tối giản | DAU, retention, MRR, churn |
| Stretch | A/B framework | Chỉ nếu đủ traffic |

#### Sprint 13: Export + Health Report
**Mục tiêu:** User sở hữu dữ liệu của họ.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | CSV/JSON export đầy đủ | Export đúng logs/profile/summary |
| Must | PDF report ổn định | Không lỗi layout mobile/desktop |
| Should | Apple Health write-back | Ghi water log nếu permission có |
| Should | Google Fit write-back | Tương tự |

---

### GIAI ĐOẠN 8: SOCIAL SCALE + POLISH (Tháng 1-2/2027)

#### Sprint 14: Social Retention
**Mục tiêu:** Social tạo động lực, không chỉ là tab phụ.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Group challenge trong club | Club có mục tiêu tuần |
| Must | Battle realtime/push polish | Invite/accept/complete rõ |
| Should | Feed ranking đơn giản | Friends/Discover/Hot |
| Should | Moderation/report flow | Có báo cáo và xử lý cơ bản |

#### Sprint 15: UX Polish
**Mục tiêu:** App cảm giác hoàn thiện.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Loading/empty/error states audit | Không còn màn trống khó hiểu |
| Must | Long text/mobile overflow audit | Không vỡ layout |
| Should | Accessibility pass | Contrast/touch target/screen reader cơ bản |
| Should | Vietnamese copy audit | Text nhất quán, không lẫn English vô cớ |

---

### GIAI ĐOẠN 9: MATURITY + SCALE (Tháng 3-5/2027)

#### Sprint 16: Security/Compliance
**Mục tiêu:** Chuẩn bị scale và dữ liệu sức khỏe nhạy cảm.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Data deletion/export audit | Xóa/export đầy đủ, có log |
| Must | SQL/RPC security review | Không có RPC bypass user |
| Must | Privacy/terms copy | Rõ dữ liệu nào lưu, dùng để làm gì |
| Should | Manual penetration checklist | Có checklist và kết quả |

#### Sprint 17: Production Readiness
**Mục tiêu:** App có thể vận hành lâu dài.

| Priority | Task | Success Condition |
|----------|------|-------------------|
| Must | Uptime/error alerts | Có alert Sentry/monitoring |
| Must | DB index/query audit | Query chậm có index hoặc rewrite |
| Should | Load test critical paths | k6 hoặc script tương đương |
| Stretch | WatchOS/WearOS prototype | Chỉ làm nếu widget + core metrics tốt |

---

## PHẦN D: NHỮNG GÌ KHÔNG LÀM VỘI

| Ý tưởng | Lý do |
|---------|-------|
| React Router migration | Custom app state/router đang chạy, đổi không tạo giá trị ngay |
| Native rewrite Swift/Kotlin | Capacitor đủ cho giai đoạn này |
| WatchOS/WearOS production | Cost cao; để stretch sau widget/revenue |
| Monorepo/Turborepo | 1 app, 1 dev chính, overhead chưa đáng |
| SSR | App mobile/PWA, SEO không phải trọng tâm |
| Web3/NFT | Không liên quan hydration/retention |
| Tự train ML model | Groq/API đủ; data chưa đủ để train |
| Micro-frontend | Một sản phẩm, một codebase |

---

## PHẦN E: MỤC TIÊU 6-12 THÁNG

| Metric | Hiện tại | Mục tiêu 6 tháng | Mục tiêu 12 tháng |
|--------|----------|------------------|-------------------|
| TypeScript errors | 0 | 0 | 0 |
| Build time | ~7.5s | <7s | <5s |
| Tests | 269 | 350+ core-focused | 500+ with integration coverage |
| Core coverage | Chưa đo chính xác | >30% core modules | >45% core modules |
| `as unknown as Record` | 0 | 0 | 0 |
| Type debt rộng hơn | 32 hit | <15 | <5 |
| Hook files gọi Supabase trực tiếp | 12/50 | <6 | <3 |
| PWA precache | ~3.1MB | <3MB hoặc có lý do | <2.5MB |
| Crash-free rate | Chưa đo | >99.5% | >99.9% |
| Premium conversion | Chưa đo | >3% | >5% |
| DAU/MAU | Chưa đo | >30% | >40% |

---

## PHẦN F: ƯU TIÊN NGAY SAU FILE NÀY

1. Commit riêng cho fixes + roadmap update.
2. Đảm bảo CI chạy `tsc`, `test`, `build` trên PR.
3. Audit entitlement Premium trước khi thêm feature mới.
4. Hoàn thiện AI Coach V2 bằng QA thực tế: streaming, memory, tool-call ghi nước.
5. Chỉ bắt đầu widget/native sau khi offline + push + subscription ổn.

---

*Kế hoạch này phản ánh codebase tại ngày 19/05/2026: `tsc` pass, `npm run build` pass, `npm run test` pass 269 tests. Các con số cần cập nhật lại sau mỗi phase lớn.*
