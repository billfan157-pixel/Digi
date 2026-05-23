# Kế hoạch thực hiện (Implementation Plan) — Sprint 15-16: Retention & Gamification

Bản kế hoạch này mô tả chi tiết phương thức thiết kế và triển khai các tính năng cho **Sprint 15-16**, tập trung vào việc tăng tỷ lệ tương tác và giữ chân người dùng (Retention & Gamification).

## Tóm tắt điều chỉnh so với bản gốc

> **Nguyên tắc:** Codebase đã có `questEngine` (full challenge logic), `usePushNotifications` (hoàn chỉnh), và `useStreak` (chỉ thiếu badge display). Sprint này **không xây mới** mà **wire sẵn có** vào UI.

| Hạng mục | Bản gốc | Điều chỉnh thực tế | Lý do |
|----------|---------|-------------------|-------|
| Streak Badges | Client `insert` vào `user_badges`, seed 4 badge | **Virtual badges** — derive từ `streak` count, không insert DB | Tránh race condition, duplicate insert, mất data khi reinstall |
| Leaderboard Privacy | Opt-out vẫn hiện trong list + banner "đang bị ẩn" | **Ẩn hoàn toàn** khỏi query `.eq('leaderboard_opt_in', true)` | UX rõ ràng: tắt = biến mất |
| Challenges UI | Merge thành tab thứ 4 trong `QuestModal` | **Giữ nguyên** UI riêng. `QuestModal` chỉ là Quest. | Quest và Challenge có data shape khác nhau. Merge = refactor lớn, dễ break test |
| Push Settings | Tích hợp mới | **Wire UI** vào `usePushNotifications` đã hoàn chỉnh | Hook đã sẵn sàng, chỉ cần toggle + test button |
| Migration | 1 file lớn: badges + privacy + trigger | **1 file nhỏ**: chỉ `leaderboard_opt_in` + index + trigger | Giảm scope, giảm rủi ro rollback |

---

## 1. Cơ sở dữ liệu & Migrations (Supabase)

### `[NEW]` `20260523000400_add_leaderboard_privacy.sql`

- Thêm cột `leaderboard_opt_in` (kiểu `boolean`, mặc định `true`) vào bảng `public.profiles` và `public.public_profiles`.
- Cập nhật trigger function `private.sync_public_profile()` để đồng bộ cột này.
- Thêm index `idx_public_profiles_opt_in_wp` trên `public.public_profiles(leaderboard_opt_in, wp DESC)`.
- **Không seed badge streak** — badge sẽ là virtual, không cần bảng `badges`.

---

## 2. Streak Milestone Badges — Virtual (Frontend Only)

### `[MODIFY]` `useStreak.ts`

- Thay thế logic `localStorage` milestone tracking bằng **virtual badge derivation**.
- Khi `streak >= 3/7/14/30`, trả về badge info trong return object:

```typescript
const unlockedStreakBadges = useMemo(() => {
  const badges = [];
  if (streak >= 3)  badges.push({ id: 'streak_3',  name: 'Giọt Nước Kiên Trì',  icon: Droplet,   minStreak: 3 });
  if (streak >= 7)  badges.push({ id: 'streak_7',  name: 'Dòng Chảy Bền Bỉ',   icon: Waves,     minStreak: 7 });
  if (streak >= 14) badges.push({ id: 'streak_14', name: 'Thủy Thủ Cần Mẫn',   icon: Anchor,    minStreak: 14 });
  if (streak >= 30) badges.push({ id: 'streak_30', name: 'Hải Vương Bất Bại',   icon: Crown,     minStreak: 30 });
  return badges;
}, [streak]);
```

- Hiệu ứng Confetti + Toast khi `streak` vừa đạt milestone mới (dùng `localStorage` để dedupe trong 1 phiên, không dùng cho persistence).
- **Không insert vào `user_badges`** — persistence không cần thiết vì badge luôn derive từ streak.

### `[MODIFY]` `ProfileTab.tsx` hoặc component hiển thị huy hiệu

- Thêm section "Chuỗi ngày uống nước" hiển thị virtual badges từ `useStreak`.
- Badge đạt được → highlight, chưa đạt → grayscale/locked.

---

## 3. Leaderboard Privacy (Opt-in)

### `[MODIFY]` `useLeagueData.ts`

- Trong `fetchPublicLeaderboard`, thêm filter:

```typescript
const { data, error } = await supabase
  .from('public_profiles')
  .select('id, nickname, wp, rank_tier, avatar_url, leaderboard_opt_in')
  .eq('leaderboard_opt_in', true)
  .order('wp', { ascending: false })
  .limit(100);
```

- User hiện tại (dù `opt_in = false`) vẫn có thể xem leaderboard nhưng **không thấy mình** trong list.
- Không cần "chèn bản ghi ẩn danh" vào danh sách.

### `[MODIFY]` `SettingsModal.tsx`

- Thêm switch toggle: **"Chia sẻ tiến trình (Xếp hạng)"**
- Gọi `updateProfileFields({ leaderboard_opt_in: value })`.

### `[MODIFY]` `LeagueTab.tsx`

- Kiểm tra `leaderboard_opt_in` của profile hiện tại.
- Nếu `false`, hiển thị banner:
  > "Bạn đã ẩn tài khoản khỏi bảng xếp hạng công khai. [Hiện tài khoản]"

---

## 4. Daily Challenges — Polish UI hiện tại

### Trạng thái hiện tại

- `questEngine.ts` đã có full challenge logic: `joinChallenge`, milestone rewards, badge awarding, push notification.
- `useGamification.ts` đã có `joinChallenge(stakeWp)`.
- UI có thể đã tồn tại ở component khác (không phải `QuestModal`).

### `[MODIFY]` (Nếu UI chưa tồn tại hoặc cần polish)

- Tạo hoặc cập nhật `ChallengeCard.tsx` để hiển thị challenge với:
  - Tiêu đề, mô tả, stake WP
  - Tiến độ (progress bar)
  - Nút "Tham gia" (gọi `joinChallenge` từ `useGamification`)
- **Không đụng `QuestModal`** — Quest và Challenge là 2 system khác nhau.

---

## 5. Push Notification Settings

### `[MODIFY]` `SettingsModal.tsx`

Thêm section **"Thông báo uống nước"**:

```tsx
const { isSupported, isSubscribed, subscribe, unsubscribe, sendTestNotification } = usePushNotifications(profile?.id);

// Toggle bật/tắt
<Switch 
  checked={isSubscribed} 
  onCheckedChange={(v) => v ? subscribe() : unsubscribe()}
  disabled={!isSupported}
/>

// Nút test
<Button onClick={sendTestNotification} disabled={!isSubscribed}>
  Gửi thông báo thử
</Button>
```

Hook `usePushNotifications` đã sẵn sàng — chỉ cần import và wire UI.

---

## Verification Plan

### Automated Tests

1. **Unit test virtual badge derivation:**
   ```typescript
   // src/hooks/useStreak.test.ts
   expect(getUnlockedBadges(2)).toEqual([]);
   expect(getUnlockedBadges(3)).toEqual([{ id: 'streak_3', ... }]);
   expect(getUnlockedBadges(7)).toEqual([{ id: 'streak_3', ... }, { id: 'streak_7', ... }]);
   ```

2. **Unit test leaderboard filter:**
   ```typescript
   // Mock Supabase query với .eq('leaderboard_opt_in', true)
   ```

3. **Build & Lint:**
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

### Manual Verification

1. Settings → tắt "Chia sẻ tiến trình" → mở LeagueTab → xác nhận banner ẩn danh xuất hiện.
2. Settings → bật lại → xác nhận banner biến mất.
3. Đạt streak 3 ngày → xác nhận Confetti + Toast chúc mừng.
4. Settings → Push Notification → bật → gửi test → nhận notification.

---

## Effort Estimate

| Hạng mục | Ngày | Files chính |
|----------|------|------------|
| Migration + trigger | 0.5 | `supabase/migrations/...` |
| Virtual Streak Badges | 1 | `useStreak.ts`, `ProfileTab.tsx` |
| Leaderboard Privacy | 0.5 | `useLeagueData.ts`, `SettingsModal.tsx`, `LeagueTab.tsx` |
| Push Settings | 0.5 | `SettingsModal.tsx` |
| Polish Challenges (nếu cần) | 1 | `ChallengeCard.tsx` |
| Test + Build | 0.5 | — |
| **Tổng** | **~3 ngày** | **5-7 files** |

