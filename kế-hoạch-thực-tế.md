# KẾ HOẠCH PHÁT TRIỂN DIGIWELL — DỰA TRÊN CODEBASE THỰC TẾ

## 1. Current State (đã verify)

| Metric | Giá trị | So với plan cũ |
|---|---|---|
| Bundle size (dist/assets) | **1.8 MB** (~400KB gzip) | Plan cũ nói 8-10MB ❌ |
| TypeScript errors | **0** | — |
| Tests | **6 files, 56 tests** | Plan cũ nói <30%, thực tế ~2% |
| Zustand stores | **6** (nhỏ, đúng pattern) | Plan cũ muốn gộp → sai |
| `React.lazy` | **22** (6 tabs + 16 modals) | Plan cũ claim chưa lazy ❌ |
| `as unknown as Record<string, unknown>` | **37 chỗ, 13 files** | Non-profile types |
| Hooks dùng `supabase.from()` | **19/38** | Có duplication thật |
| RLS | **11 statements, 7 migrations** | Gần hoàn thiện |
| Build time | **8-11s** | — |

## 2. Vấn đề thực sự (ưu tiên)

### P0 — Ngay

| Issue | Chi tiết | Fix |
|---|---|---|
| **Edge function `_shared/` chưa commit** | `_shared/rateLimit.ts` untracked → deploy sẽ fail | `git add` |
| **Sentry chưa có source maps** | `sentry.ts` có DSN, nhưng build không upload source maps → stack trace vô dụng | Plugin vite Sentry |
| **`as unknown as Record<string, unknown>`** | 37 chỗ, phần lớn ở PostCard (11), useHydrationController (5), PostCardContent (5) | Từ từ thay bằng proper types |

### P1 — Trong 2-4 tuần

| Issue | Chi tiết | Effort |
|---|---|---|
| **Test coverage** | Chỉ 56 tests cho ~30K dòng code. Critical paths không test: questEngine, useWaterData, social features | 5-7 ngày |
| **React Query cho data fetching** | 19 hooks gọi Supabase trực tiếp, không caching, không stale-while-revalidate. useWaterData đặc biệt nặng | 4 ngày |
| **RLS audit** | Còn bảng nào thiếu RLS không? Cần audit toàn bộ schema | 1 ngày |

### P2 — Trong 1-2 tháng

| Issue | Chi tiết | Effort |
|---|---|---|
| **Offline sync conflict** | LocalStorage queue nhưng không handle conflict khi online lại | 5 ngày |
| **Bundle optimization** | vendor chunk 365KB (React), supabase 196KB. Có thể giảm bằng dynamic import | 2 ngày |
| **Form validation** | SettingsModal, Register forms không có runtime validation (Zod) | 3 ngày |
| **Push notifications** | Capacitor local notifications đã có, chưa có remote push | 5 ngày |

## 3. Roadmap

### Sprint 1 (Tuần 1): Cứu hoả + Nền tảng
```
- Git add _shared/rateLimit.ts
- Sentry source map plugin
- Thêm test cho questEngine (critical path)
- RLS audit: check tất cả bảng trong schema
```
**Kết quả:** Deploy an toàn, biết được crash nào đang xảy ra.

### Sprint 2 (Tuần 2): Test coverage
```
- useWaterData.test.ts — hydration log CRUD, offline queue
- questEngine.test.ts — milestone + badge awarding
- social.test.ts — feed load, follow/unfollow, like
- useAppSystem.test.ts — auth flow, profile load
```
**Kết quả:** ~100+ tests, core paths có safety net.

### Sprint 3 (Tuần 3-4): React Query + Type clean up
```
- useWaterData → React Query (useQuery + useMutation)
- useFeed, useSocialData → React Query
- Xoá 37 as unknown as Record → proper types
```
**Kết quả:** Caching tự động, load nhanh hơn, type safe.

### Sprint 4-5 (Tháng 2): Offline + Validation
```
- Offline sync conflict resolver
- Zod schemas cho forms (Settings, Register, Profile)
- Push notification setup (FCM/APNs)
```
**Kết quả:** Dùng được offline, form an toàn, push hoạt động.

### Sprint 6+ (Tháng 3+): Feature
```
- Premium subscription flow (Stripe)
- AI Coach v2 (Groq streaming)
- Social challenges
- Multi-device sync
```

## 4. Không nên làm (waste)

| Ý tưởng | Lý do |
|---|---|
| **Consolidate Zustand stores** | 6 stores nhỏ là chuẩn, gộp làm mất code-splitting |
| **Storybook** | 1 dev, components ít reuse → overhead thuần |
| **TanStack Table** | App không có data grid, chỉ có list + charts |
| **Bundle WebP/icon tree-shake** | 1.8MB là bình thường, micro-optimization không đáng |
| **Theme system refactor** | ThemeProvider đang hoạt động, 2 cái khác mục đích |

## 5. Effort tổng

| Phase | Thời gian | Team | Output chính |
|---|---|---|---|
| Sprint 1 | 1 tuần | 1 dev | Deploy an toàn, Sentry online |
| Sprint 2 | 1 tuần | 1 dev | 100+ tests |
| Sprint 3-4 | 2 tuần | 1 dev | React Query, type clean, offline |
| Sprint 5-6 | 2-3 tuần | 1 dev | Zod forms, push notif |
| Sprint 7+ | 2-3 tháng | 1-2 dev | Premium, AI, social scale |

**Tổng:** ~4-5 tháng cho stabilization + core feature. Không phải 12 tháng.
