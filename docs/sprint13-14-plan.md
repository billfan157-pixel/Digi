# Sprint 13: Pattern Analysis + Smart Reminders

**Sprint Goal:** App nhắc user uống nước đúng lúc dựa trên pattern cá nhân — không còn lịch cố định.

**Thời gian:** 1-2 tuần

**Quarter:** Y1 Q3 (Tháng 7–9) — "Growth & AI Expansion"

**Theme:** AI Capability Evolution

**Dependencies:** Observability data từ Q1 (✅ hoàn thành Sprint 1-2)

---

## Current State (Post-Sprint 12)

| Mục | Trạng thái |
|-----|-----------|
| Weather sync (`useWeatherSync.ts`) | ✅ Hoạt động — nhiệt độ, độ ẩm, location |
| Calendar sync + smart schedule (`useSmartSchedule.ts`) | ✅ Hoạt động — adjust giờ uống theo calendar events |
| Behavior pattern analysis (`useBehaviorAnalysis.ts`) | ⚠️ Cơ bản — chỉ weekday/weekend + consistency check, rule-based |
| Groq AI chat + advice (`useGroqAI.ts`) | ✅ Hoạt động — AI coaching, chat, agentic actions |
| Habit nudge bar (`HabitNudgeBar.tsx`) | ⚠️ Rule-based — chỉ dùng `getTimeBasedNudge()` cố định |
| Hydration reminders (`useHydrationNotifications.ts`) | ⚠️ Fixed schedule — không có AI-driven timing |
| Pattern history storage (DB) | ❌ Chưa có — mới chỉ cache trong localStorage |
| Time-of-day pattern detection | ❌ Chưa có |
| Weather-hydration correlation | ❌ Chưa có |

---

## Story Breakdown

---

### Story 1: Hydration Pattern Analysis (Time-of-Day, Weather Correlation)
**Points:** 4 | **Theme:** AI Capability Evolution | **Risk:** Medium

Xây dựng hệ thống phân tích pattern uống nước của user dựa trên dữ liệu lịch sử, thời gian trong ngày, và thời tiết.

#### Tasks

**1a. Pattern data storage (`src/lib/patternEngine.ts`) — mới**
- Tạo module phân tích pattern cục bộ (offline-first)
- **Time-of-day pattern:** Phân tích `water_logs` theo khung giờ (6-9, 9-12, 12-15, 15-18, 18-21, 21-23)
  - Tính % hoàn thành mỗi khung giờ trong 7 ngày gần nhất
  - Phát hiện "blind spots" — khung giờ user hay quên uống nhất
- **Weather correlation:**
  - So sánh lượng uống trung bình khi trời nóng (>35°C) vs mát (<25°C)
  - So sánh khi độ ẩm cao (>80%) vs thấp (<50%)
  - Tính hệ số điều chỉnh: `weatherFactor = avgHotIntake / avgCoolIntake`
- **Consistency scoring:**
  - Tính điểm đều đặn (0-100) dựa trên độ lệch chuẩn giữa các ngày
  - Phát hiện trend: đang tăng dần, giảm dần, hay dao động
- Export type: `UserHydrationPattern`

```typescript
export interface UserHydrationPattern {
  blindSpots: Array<{ slot: string; completionRate: number }>; // khung giờ hay quên
  peakHours: number[]; // giờ uống nhiều nhất
  weatherFactor: number; // 0.8 = nóng uống ít hơn 20%
  consistencyScore: number; // 0-100
  trend: 'improving' | 'declining' | 'volatile' | 'stable';
  weeklyAvgCompletion: number;
  bestDayOfWeek: number; // 0=CN, 6=T7
  worstDayOfWeek: number;
}
```

**1b. Pattern context enrichment (`src/lib/patternEngine.ts`)**
- Tích hợp dữ liệu thời tiết lịch sử (từ weather log trong 7 ngày)
- Kết hợp với calendar events để phát hiện pattern theo ngày có lịch vs ngày rảnh
- Tạo **smart context** cho AI prompt: thay vì gửi raw data, gửi pattern đã phân tích

**1c. Pattern API + Supabase RPC**
- Migration: `CREATE TABLE user_hydration_patterns` lưu pattern theo ngày (snapshot mỗi ngày)
  ```sql
  CREATE TABLE public.user_hydration_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    blind_spots JSONB,
    peak_hours INTEGER[],
    weather_factor NUMERIC(4,2),
    consistency_score INTEGER,
    trend TEXT,
    weekly_avg_completion NUMERIC(5,2),
    best_day_of_week INTEGER,
    worst_day_of_week INTEGER,
    raw_data JSONB, -- snapshot của dữ liệu 7 ngày (để debug)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, snapshot_date)
  );
  ```
  - RLS: user đọc/ghi dòng của mình
  - Index: `(user_id, snapshot_date DESC)`
- RPC `update_hydration_pattern` — upsert pattern cho hôm nay
- Gọi RPC từ app 1 lần/ngày (khi user mở app lần đầu trong ngày)

**1d. Tích hợp vào HomeTab**
- Khi có pattern, HabitNudgeBar hiển thị blind spot warning:
  - Ví dụ: "Bạn thường quên uống 15-17h. Còn 30 phút nữa đến khung giờ đó!"
- Thêm Insight card mới: "Thói quen uống nước của bạn"
  - Hiển thị: khung giờ mạnh nhất, yếu nhất, trend
  - Dùng `lucide-react` icons: `TrendingUp`, `TrendingDown`, `AlertTriangle`

#### Acceptance Criteria
- [ ] `UserHydrationPattern` được tính toán từ 7 ngày water_logs gần nhất
- [ ] Blind spots được phát hiện chính xác (khung giờ có completion rate < 50%)
- [ ] Weather correlation factor được tính, áp dụng vào điều chỉnh水量 recommendation
- [ ] Migration tạo `user_hydration_patterns` table + RLS + index
- [ ] RPC upsert pattern thành công, gọi 1 lần/ngày
- [ ] HomeTab hiển thị blind spot warning nếu user sắp vào khung giờ yếu
- [ ] Insight card mới hiển thị pattern summary
- [ ] Offline: pattern tính từ localStorage cache, sync khi online

#### Files Created/Modified
- `src/lib/patternEngine.ts` — **tạo mới**
- `supabase/migrations/` — migration `user_hydration_patterns` table + RPC
- `src/hooks/useHydrationPattern.ts` — **tạo mới** (hook gọi pattern engine + sync)
- `src/components/HabitNudgeBar.tsx` — thêm blind spot warning
- `src/tabs/Insight/BehaviorInsightCards.tsx` — thêm pattern card
- `src/lib/ai.ts` — enrich context với pattern data

---

### Story 2: Smart Reminder System (AI-Driven)
**Points:** 4 | **Theme:** AI Capability Evolution | **Risk:** Medium

Thay thế reminder fixed schedule bằng AI-driven timing dựa trên pattern cá nhân + calendar + weather.

#### Tasks

**2a. Smart reminder engine (`src/lib/smartReminderEngine.ts`) — mới**
- Input: `UserHydrationPattern`, `calendarEvents`, `weatherData`, `currentIntake`, `waterGoal`, `lastDrinkTime`
- Output: `ReminderSchedule[]` — danh sách thời gian nhắc tối ưu cho hôm nay

```typescript
export interface SmartReminder {
  scheduledAt: string; // ISO time
  reason: 'blind_spot' | 'weather_alert' | 'post_event' | 'interval' | 'catch_up';
  message: string; // tiếng Việt, personalized
  suggestedAmount: number;
  priority: 'high' | 'medium' | 'low';
}
```

- **Logic xác định thời gian nhắc:**
  1. **Blind spot priority:** Nếu user sắp vào khung giờ yếu → nhắc 15 phút trước khung giờ đó
  2. **Weather trigger:** Nếu nhiệt độ > 35°C → tăng tần suất nhắc (mỗi 45 phút thay vì 60)
  3. **Post-event reminder:** Sau mỗi calendar event → nhắc bù nước (đặc biệt SPORT → +150ml)
  4. **Catch-up reminder:** Nếu current intake < expected (dựa trên giờ) → nhắc uống bù
  5. **Interval fallback:** Nếu không có trigger nào, dùng interval mặc định (60-90 phút tùy consistency)

**2b. Migration: `smart_reminders` table**
```sql
CREATE TABLE public.smart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  message TEXT NOT NULL,
  suggested_amount INTEGER,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ, -- user đã uống sau reminder?
  response_amount INTEGER -- lượng user uống sau reminder
);
```
- RLS: user đọc dòng của mình
- Index: `(user_id, scheduled_at, status)` — để query upcoming reminders

**2c. Hook `useSmartReminders.ts` — mới**
- Generate reminders cho hôm nay khi app mount (hoặc khi pattern thay đổi)
- Lưu vào `smart_reminders` table (nếu online)
- Cache trong localStorage để hoạt động offline
- Khi reminder đến giờ:
  - Hiển thị in-app notification (toast + banner trên HomeTab)
  - Nếu notification permission granted: push local notification (Capacitor Local Notifications)
  - Nếu đang ở background: service worker push

**2d. UI: Smart reminder banner trên HomeTab**
- Giống `HabitNudgeBar` nhưng có countdown "Sắp đến giờ uống nước"
- Hiển thị lý do: "Trời hôm nay nóng 37°C, nhắc bạn uống thêm 50ml mỗi lần"
- Hoặc: "Bạn thường quên uống 15-17h, hãy uống ngay trước khi vào khung giờ này"
- Nút "Nhắc sau 15 phút" (snooze)
- Nút "Uống ngay" (quick-add 200ml)

**2e. Tích hợp notification**
- `src/lib/hydrationReminders.ts` — refactor để dùng smart reminders thay vì fixed schedule
- `useHydrationNotifications.ts` — update để consume smart reminders
- Giữ backward compat: nếu chưa có đủ data (new user), fallback về fixed schedule cũ

#### Acceptance Criteria
- [ ] Smart reminder engine tạo schedule hợp lý dựa trên pattern + calendar + weather
- [ ] Blind spot reminder: nhắc 15 phút trước khung giờ yếu
- [ ] Weather trigger: tăng tần suất khi nóng > 35°C
- [ ] Post-event reminder: nhắc sau calendar event kết thúc
- [ ] Migration `smart_reminders` table + RLS + index
- [ ] In-app reminder hiển thị đúng giờ, có snooze + quick drink
- [ ] Local notification hoạt động trên mobile (Capacitor)
- [ ] Offline: reminders từ localStorage cache
- [ ] New user fallback: fixed schedule cũ nếu chưa có pattern data
- [ ] Tất cả text tiếng Việt, dark theme, `lucide-react` icons

#### Files Created/Modified
- `src/lib/smartReminderEngine.ts` — **tạo mới**
- `src/hooks/useSmartReminders.ts` — **tạo mới**
- `src/components/home/SmartReminderBanner.tsx` — **tạo mới**
- `supabase/migrations/` — `smart_reminders` table
- `src/lib/hydrationReminders.ts` — refactor fallback
- `src/features/hydration/useHydrationNotifications.ts` — tích hợp smart reminders
- `src/tabs/HomeTab.tsx` — thêm SmartReminderBanner
- `src/tabs/HomeTab/index.tsx` — thêm SmartReminderBanner

---

## Dependencies & Blockers

| # | Dependency | Owner | Risk | Mitigation |
|---|-----------|-------|------|------------|
| 1 | 7+ ngày water_logs data cho pattern analysis | User data | Medium | New user fallback: pattern không available thì dùng default template |
| 2 | Capacitor Local Notifications plugin | Plugin | Low | Đã có sẵn, cần kiểm tra permission flow |
| 3 | Supabase RLS policy cho new tables | Dev | Low | Test với service_role và anon key |

---

## Data Flow Diagrams

### Pattern Analysis Flow
```
water_logs (7 ngày)
    ↓
patternEngine.ts: phân tích time-of-day, weather, consistency
    ↓
UserHydrationPattern
    ↓
  ├── Lưu vào user_hydration_patterns table (online)
  ├── Cache vào localStorage (offline)
  ├── Gửi xuống HabitNudgeBar → show blind spot warning
  └── Gửi xuống SmartReminderEngine → generate reminders
```

### Smart Reminder Flow
```
UserHydrationPattern + CalendarEvents + WeatherData
    ↓
smartReminderEngine.ts: tính toán thời gian tối ưu
    ↓
ReminderSchedule[]
    ↓
  ├── Lưu vào smart_reminders table
  ├── Khi đến giờ → in-app banner + local notification
  ├── User response → update DB
  └── Pattern cập nhật → regenerate nếu cần
```

---

## Verification Plan

### Automated Tests
- Unit tests cho `patternEngine.ts`:
  - Blind spot detection với mock data
  - Weather correlation calculation
  - Consistency scoring
- Unit tests cho `smartReminderEngine.ts`:
  - Schedule generation với các input khác nhau
  - Fallback behavior khi thiếu data
- Migration tests: `supabase db reset` pass

### Manual Verification
1. **Pattern analysis:**
   - User có 7 ngày data → pattern được tính đúng
   - User mới (0-3 ngày) → pattern = null, fallback hoạt động
   - Blind spot: thêm water_logs thiếu 14-16h → pattern phát hiện đúng
   - Weather: mock nhiệt độ > 35°C → weather factor > 1.0

2. **Smart reminders:**
   - Tạo calendar event "Tập gym 15-16h" → reminder sau 16h +150ml
   - Nhiệt độ > 35°C → tần suất reminder tăng
   - Blind spot 14-16h → reminder lúc 13:45
   - New user: fallback về fixed schedule cũ
   - Snooze 15 phút → reminder lại sau 15 phút

---

## Definition of Done (Sprint 13)

```
☑ patternEngine.ts phân tích blind spots, peak hours, weather correlation chính xác
☑ user_hydration_patterns migration + RLS + RPC upsert
☑ Blind spot warning hiển thị trên HabitNudgeBar đúng khung giờ
☑ BehaviorInsightCards hiển thị pattern summary
☑ SmartReminderEngine tạo schedule dựa trên pattern + calendar + weather
☑ In-app reminder banner có snooze + quick drink
☑ Local notification gửi đúng giờ trên mobile
☑ Fallback về fixed schedule cho new user
☑ Tất cả text tiếng Việt, dark theme, lucide-react icons
☑ Tất cả tests pass, typecheck pass, build pass
☑ supabase db reset pass với migration mới
```

---

## Risk Register (Sprint-specific)

| # | Risk | Prob | Impact | Mitigation |
|---|------|------|--------|------------|
| R1 | User không có đủ 7 ngày data | High | Medium | Fallback: pattern = null, dùng default template cho reminders |
| R2 | Notification permission bị từ chối | Med | Low | In-app banner vẫn hoạt động, không phụ thuộc notification |
| R3 | Pattern calculation quá nặng trên client | Low | Low | Chỉ tính trên 7-14 ngày data, dùng useMemo, cache kết quả |
| R4 | Over-reminding gây khó chịu | Med | Medium | SmartReminder có priority, không gửi quá 1 reminder/30 phút |
| R5 | Migration xung đột với existing reminders | Low | Medium | Smart reminders là additive, không xoá existing code |