# Sprint 14: AI Weekly Hydration Report

**Sprint Goal:** User nhận báo cáo tuần về thói quen uống nước với AI-generated insights.

**Thời gian:** 1 tuần

**Quarter:** Y1 Q3 (Tháng 7–9) — "Growth & AI Expansion"

**Theme:** AI Capability Evolution

**Dependencies:** Sprint 13 (Pattern Analysis + Smart Reminders)

---

## Current State (Post-Sprint 13)

| Mục | Trạng thái |
|-----|-----------|
| Pattern analysis (`patternEngine.ts`) | ✅ Hoạt động — blind spots, peak hours, weather correlation |
| Smart reminders (`smartReminderEngine.ts`) | ✅ Hoạt động — AI-driven timing dựa trên pattern |
| `user_hydration_patterns` table | ✅ Migration applied, RLS enabled |
| `smart_reminders` table | ✅ Migration applied, RLS enabled |
| AI weekly report | ❌ Chưa có |
| `weekly_reports` table | ✅ Migration applied (đã tạo trong Sprint 13-14) |
| Weekly report UI | ❌ Chưa có |

---

## Story Breakdown

---

### Story 1: AI Weekly Hydration Report (Push Notification)
**Points:** 3 | **Theme:** AI Capability Evolution | **Risk:** Low

Tạo report tổng kết tuần với AI-generated insights, gửi qua push notification và in-app.

#### Tasks

**1a. Weekly report generator (`src/lib/weeklyReportEngine.ts`) — mới**
- Input: 7 ngày water_logs + pattern data + weather data
- Output: `WeeklyReport`
- Sử dụng Groq AI để tạo nội dung (fallback: template-based nếu AI limit)

```typescript
export interface WeeklyReport {
  weekStart: string; // ISO date
  weekEnd: string;
  totalIntake: number;
  avgDaily: number;
  goalHitDays: number;
  bestDay: { date: string; ml: number };
  worstDay: { date: string; ml: number };
  trend: 'improving' | 'declining' | 'stable';
  insight: string; // AI-generated hoặc template
  tip: string; // personalized tip cho tuần sau
  comparisonToPreviousWeek: number; // % change
  consistencyScore: number;
}
```

- **Template-based insights** (fallback khi AI không available):
  - "Tuần này bạn đạt {goalHitDays}/7 ngày. {trend_message}. Tuần sau hãy cố gắng uống thêm {suggestedIncrease}ml mỗi ngày."
  - Tuỳ theo trend: "Đang cải thiện rõ rệt!" / "Cần chú ý hơn vào cuối tuần" / "Giữ vững phong độ!"
- **AI-powered insights** (dùng Groq):
  - Gửi pattern data + weekly stats → Groq sinh insight personalized
  - Cache trong `weekly_reports` table

**1b. Migration: `weekly_reports` table**
```sql
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_intake INTEGER NOT NULL,
  avg_daily NUMERIC(6,1),
  goal_hit_days INTEGER,
  best_day DATE,
  best_day_ml INTEGER,
  worst_day DATE,
  worst_day_ml INTEGER,
  trend TEXT,
  insight TEXT,
  tip TEXT,
  comparison_to_previous_week NUMERIC(5,2),
  consistency_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);
```
- RLS: user đọc dòng của mình
- Index: `(user_id, week_start DESC)`

**1c. Hook `useWeeklyReport.ts` — mới**
- Generate report khi:
  - User mở app lần đầu trong tuần mới (check bằng `weekStart` khác với last report)
  - Hoặc manual refresh
- Lưu vào DB + cache local
- Trigger push notification nếu là report mới

**1d. UI: Weekly report modal**
- `src/components/modals/WeeklyReportModal.tsx`
- Glassmorphism card với:
  - Header: "Báo cáo tuần {tuần}"
  - Ring progress: số ngày đạt goal / 7
  - Stats row: best day, worst day, total intake, avg daily
  - Insight section: AI-generated text
  - Tip cho tuần sau
  - So sánh với tuần trước (% change)
  - Nút "Chia sẻ" (copy text hoặc share native)
- Placement: HomeTab header → icon "Báo cáo tuần" (xuất hiện đầu tuần mới)
- Hoặc có thể xem trong Insight tab

**1e. Push notification delivery**
- Khi report được generate lần đầu trong tuần:
  - Gửi local notification (Capacitor Local Notifications)
  - Nếu online và có permission: gửi qua push service
- Notification content:
  - Title: "📊 Báo cáo tuần của bạn"
  - Body: "Tuần này bạn đạt {goalHitDays}/7 ngày. {short_insight}"
  - Click → mở WeeklyReportModal

#### Acceptance Criteria
- [ ] Weekly report generator hoạt động với template fallback + AI
- [ ] Migration `weekly_reports` table + RLS + index (✅ đã có)
- [ ] Report được generate tự động đầu tuần mới
- [ ] Modal hiển thị đẹp, dark theme, tiếng Việt
- [ ] Push notification gửi khi có report mới
- [ ] Click notification → mở modal
- [ ] So sánh với tuần trước (% change)
- [ ] Nút chia sẻ hoạt động
- [ ] Insight text có nghĩa (không generic)
- [ ] Offline: report từ cache

#### Files Created/Modified
- `src/lib/weeklyReportEngine.ts` — **tạo mới**
- `src/hooks/useWeeklyReport.ts` — **tạo mới**
- `src/components/modals/WeeklyReportModal.tsx` — **tạo mới**
- `src/tabs/HomeTab/components/HomeHeader.tsx` — thêm icon báo cáo tuần
- `src/tabs/InsightTab.tsx` — thêm weekly report entry
- `src/lib/ai.ts` — thêm `generateWeeklyInsight()` function
- Capacitor config: local notification permissions

---

## Dependencies & Blockers

| # | Dependency | Owner | Risk | Mitigation |
|---|-----------|-------|------|------------|
| 1 | Sprint 13 completion (pattern + reminders) | Dev | Low | Sprint 13 phải hoàn thành trước |
| 2 | Groq API availability cho AI insights | Groq | Low | Fallback: template-based insights (có logic thông minh không cần AI) |
| 3 | Capacitor Local Notifications plugin | Plugin | Low | Đã có sẵn, cần kiểm tra permission flow |

---

## Data Flow Diagrams

### Weekly Report Flow
```
7 ngày water_logs + pattern data + weather
    ↓
weeklyReportEngine.ts
    ↓
  ├── Template-based insight (fallback)
  └── AI-powered insight (dùng Groq)
    ↓
WeeklyReport → DB + Cache + Notification
```

---

## Verification Plan

### Automated Tests
- Unit tests cho `weeklyReportEngine.ts`:
  - Template insight generation
  - Comparison calculation
- Migration tests: `supabase db reset` pass

### Manual Verification
1. **Weekly report:**
   - Cuối tuần đầu tiên có đủ data → report hiển thị
   - AI insight khác template insight
   - Push notification gửi khi report mới
   - Click notification → mở modal

---

## Definition of Done (Sprint 14)

```
☑ Weekly report generator (template + AI)
☑ WeeklyReportModal hiển thị stats + insight
☑ Push notification khi có report mới
☑ So sánh với tuần trước (% change) trong report
☑ Tất cả text tiếng Việt, dark theme, lucide-react icons
☑ Tất cả tests pass, typecheck pass, build pass
☑ supabase db reset pass với migration mới
```

---

## Risk Register (Sprint-specific)

| # | Risk | Prob | Impact | Mitigation |
|---|------|------|--------|------------|
| R1 | Groq AI rate limit on weekly reports | Med | Low | Template-based fallback có sẵn, AI chỉ dùng khi available |
| R2 | Notification permission bị từ chối | Med | Low | In-app modal vẫn hoạt động, không phụ thuộc notification |
| R3 | AI insight quá generic | Med | Medium | Template fallback được tinh chỉnh với nhiều biến thể |
