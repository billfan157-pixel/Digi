# Kế Hoạch Nâng Cấp Hệ Thống Khiêu Chiến (Arena System v2)

**Ngày lập:** 2026-05-28
**Scope:** PvP Duel 1v1 + Club Wars + Group Events + Battle Pass Mùa
**Triết lý:** Ship từng phase độc lập — không block nhau, mỗi phase có thể deploy riêng.

---

## 1. Hiện Trạng Tóm Tắt

### Đã có (Sprint 1–20)

| Tính năng | DB | RPC | UI | Realtime |
|-----------|----|-----|----|----------|
| Duel 1v1 (hydration_battles) | ✅ | ✅ | ✅ | ✅ |
| Club Wars (club_battles) | ✅ | ✅ | ⚠️ (Club tab) | ⚠️ |
| Group Challenges | ✅ | ✅ | ❌ | ❌ |
| Seasons (seasons, season_duel_rankings) | ✅ | ✅ | ⚠️ (banner only) | ❌ |
| Duel stats (duel_wp, streak, win/loss/draw) | ✅ | ✅ | ✅ | — |
| Bot duels | ✅ | ✅ | ✅ | — |
| Quick matchmaking | ✅ | ✅ | ✅ | — |
| Auto-resolve stale battles (cron) | ✅ | ✅ | — | — |
| Achievements (milestone detection) | ✅ | ✅ | ✅ | — |

### Các vấn đề / cơ hội nâng cấp

1. **ELO giả tạo:** `rating = 1200 + wins*25 - losses*15` tính client-side → không có ý nghĩa matchmaking thực.
2. **Battle modes bị disable:** Daily/Quick/Tournament chỉ show toast, không tạo battle thực.
3. **Group Challenges chưa có UI:** Table đã có nhưng user không thao tác được.
4. **Club Wars thiếu meta-layer:** Chỉ là tổng lượt nước, không có lãnh thổ, buff, tier.
5. **Không có Battle Pass:** Seasons chỉ là reset WP, không có reward tier.
6. **Economy battle chưa khép kín:** Stake coins chưa thực sự lock/trả reward (nhiều nơi hardcode 0 stake).

---

## 2. Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────┐
│                    ARENA SYSTEM v2                    │
├─────────────────────────────────────────────────────┤
│  Layer 1: PvP Duel          │  Layer 2: Club Wars   │
│  - True ELO/Glicko          │  - Territory map      │
│  - Skill-based matchmaking  │  - War seasons        │
│  - Stake economy            │  - Club buffs         │
│  - Spectator/social share   │  - Cross-server raid  │
├─────────────────────────────┴───────────────────────┤
│  Layer 3: Group Events        │  Layer 4: Battle Pass │
│  - Bracket elimination      │  - Season XP track    │
│  - FFA/Last-man-standing    │  - Free + Premium     │
│  - Server-wide milestones   │  - Cosmetic + power   │
├─────────────────────────────────────────────────────┤
│             Shared: Anti-cheat + Fair Play            │
└─────────────────────────────────────────────────────┘
```

---

## 3. Phân Pha Implementation

> **Rule:** Mỗi phase deploy độc lập. Phase sau có thể dùng data từ phase trước.

---

## Phase 1: PvP Duel V2 — "True Ranked" (2–3 tuần)

### Mục tiêu
Biến Duel 1v1 thành hệ thống ranked thực sự với ELO lưu DB, matchmaking theo skill, và economy khép kín.

### 1.1 DB Schema Changes

```sql
-- true_elo thay thế client-side rating
ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS duel_elo integer NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS duel_matches_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_last_match_at timestamptz;

-- battle_modes hoạt động thực sự
ALTER TABLE public.hydration_battles
  ADD COLUMN IF NOT EXISTS mode_type text NOT NULL DEFAULT 'daily'
    CHECK (mode_type IN ('daily','quick','tournament')),
  ADD COLUMN IF NOT EXISTS elo_challenger integer,
  ADD COLUMN IF NOT EXISTS elo_opponent integer;

-- matchmaking queue
CREATE TABLE IF NOT EXISTS public.duel_matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode_type text NOT NULL DEFAULT 'daily',
  stake_coins int NOT NULL DEFAULT 0,
  elo_range_low int NOT NULL DEFAULT 0,
  elo_range_high int NOT NULL DEFAULT 9999,
  queue_started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mode_type)
);

-- duel_match_history (full log cho analytics)
CREATE TABLE IF NOT EXISTS public.duel_match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.hydration_battles(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL,
  opponent_id uuid,
  mode_type text NOT NULL,
  winner_id uuid,
  stake_coins int NOT NULL DEFAULT 0,
  elo_challenger_before int,
  elo_challenger_after int,
  elo_opponent_before int,
  elo_opponent_after int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_matchmaking_queue_mode ON public.duel_matchmaking_queue(mode_type, elo_range_low, elo_range_high);
CREATE INDEX idx_matchmaking_queue_time ON public.duel_matchmaking_queue(queue_started_at);
CREATE INDEX idx_duel_history_user ON public.duel_match_history(challenger_id, created_at);
CREATE INDEX idx_duel_history_opponent ON public.duel_match_history(opponent_id, created_at);
```

### 1.2 Business Logic (RPC)

**A. `enter_matchmaking_queue(p_mode, p_stake, p_elo_tolerance)`**
- Insert vào `duel_matchmaking_queue`.
- Nếu tìm được opponent trong `elo_range_low..elo_range_high`, tạo battle ngay.
- Nếu không, trả về `queued`.

**B. `find_ranked_match(p_mode, p_queue_id)`**
- Background cron chạy mỗi 5s (hoặc pg_cron + Edge Function trigger).
- Match 2 người trong queue có elo overlap.
- Mở rộng elo range theo thời gian chờ (widening): mỗi 30s +50 elo.
- Khi matched: tạo `hydration_battles` với `mode_type`, snapshot elo, lock stake.

**C. `resolve_ranked_battle(p_battle_id)`**
- Tính ELO với K-factor động (K=40 cho <30 trận, K=20 cho <100 trận, K=10 cho pro):
  ```
  Ea = 1 / (1 + 10^((Rb-Ra)/400))
  Sa = 1 (win), 0.5 (draw), 0 (loss)
  delta = K * (Sa - Ea)
  ```
- Cập nhật `duel_elo`, `duel_matches_total`, `duel_last_match_at`.
- Insert `duel_match_history`.
- **Stake economy:**
  - Loser: trừ stake_coins.
  - Winner: + stake_coins * 0.9 (10% fee burn → server fund).
  - Draw: trả lại stake.
- **Streak bonus:** win streak >= 3 → bonus +10% stake reward.
- **Decay:** không đánh trong 7 ngày → -10 ELO/ngày (soft).

### 1.3 UI Changes

| Component | Change |
|-----------|--------|
| `BattleModes.tsx` | Bỏ toast placeholder. Chọn mode → mở modal chọn stake + bắt đầu queue. |
| `ArenaTab.tsx` | Thêm "Matchmaking Status" section: đang tìm đối thủ, ELO range, thời gian chờ. |
| `ArenaStatsHero.tsx` | Thay "Rating" bằng `duel_elo` thật. Thêm rank tier (Bronze/Silver/Gold/Platinum/Diamond/Mythic). |
| `BattleDetailModal.tsx` | Show ELO change preview trước battle. Show "Ranked" badge. |
| `BattleHistory.tsx` | Show ELO delta (+/-) mỗi trận. |
| `DuelLeaderboard.tsx` | Sort by `duel_elo` thay vì `duel_wp`. Group theo rank tier. |
| New: `RankTierBadge.tsx` | Visual badge cho tier dựa trên ELO. |

### 1.4 Rank Tiers

| Tier | ELO Range | Color |
|------|-----------|-------|
| Bronze | 0–999 | `#cd7f32` |
| Silver | 1000–1199 | `#c0c0c0` |
| Gold | 1200–1399 | `#ffd700` |
| Platinum | 1400–1599 | `#3eb489` |
| Diamond | 1600–1799 | `#b9f2ff` |
| Mythic | 1800+ | `#ff4ecd` |

### 1.5 Verify
- Unit test ELO calculation với edge cases (draw, huge elo gap, K-factor transition).
- Playwright: queue → match → complete → elo update.
- Load: 100 concurrent queue entries, ensure no duplicate matches.

### 1.6 Breaking Changes
- `rating` field client-side bị bỏ → thay bằng `duel_elo` từ DB.
- Không ảnh hưởng `duel_wp` (WP là separate currency/point system).

---

## Phase 2: Club Wars V2 — "Territory & Guild Season" (2–3 tuần)

### Mục tiêu
Biến Club Wars từ "tổng lượt nước" thành hệ thống lãnh thổ có season, buff, và leaderboard liên club.

### 2.1 DB Schema Changes

```sql
-- Territory grid (simplified hex or zone system)
CREATE TABLE IF NOT EXISTS public.territory_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grid_x int NOT NULL DEFAULT 0,
  grid_y int NOT NULL DEFAULT 0,
  controlling_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  base_target_ml int NOT NULL DEFAULT 10000,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  captured_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Club war seasons (per season, each club has territory points)
CREATE TABLE IF NOT EXISTS public.club_war_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  territory_points int NOT NULL DEFAULT 0,
  zones_controlled int NOT NULL DEFAULT 0,
  total_water_contributed bigint NOT NULL DEFAULT 0,
  war_wins int NOT NULL DEFAULT 0,
  war_losses int NOT NULL DEFAULT 0,
  UNIQUE(season_id, club_id)
);

-- Club buffs (active during war season)
CREATE TABLE IF NOT EXISTS public.club_buffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  buff_type text NOT NULL CHECK (buff_type IN ('hydration_boost','defense_wall','spy_intel','morale_surge')),
  effect_percent int NOT NULL DEFAULT 0,
  duration_hours int NOT NULL DEFAULT 24,
  activated_at timestamptz NOT NULL DEFAULT now(),
  activated_by uuid NOT NULL REFERENCES public.profiles(id),
  cost_coins int NOT NULL DEFAULT 500
);

CREATE INDEX idx_territory_zone_season ON public.territory_zones(season_id);
CREATE INDEX idx_club_war_seasons_points ON public.club_war_seasons(season_id, territory_points DESC);
CREATE INDEX idx_club_buffs_active ON public.club_buffs(club_id, activated_at);
```

### 2.2 Business Logic (RPC)

**A. `start_club_war_season(p_season_id)`** — service_role cron
- Tạo `territory_zones` (grid 5×5 = 25 zones).
- Reset `club_war_seasons` cho tất cả clubs có `battle_wins + battle_losses > 0`.
- Bắt đầu season duration (7 ngày).

**B. `contribute_zone(p_battle_id, p_zone_id, p_amount)`** — member
- Kiểm tra `club_battles` active.
- Cập nhật `club_battle_participants.total_water`.
- Nếu tổng club >= `territory_zones.base_target_ml` → `controlling_club_id` = winner, `captured_at = now()`.
- Cập nhật `club_war_seasons.territory_points` (+100 mỗi zone), `zones_controlled`.
- **Buff effect:** Nếu club có `hydration_boost` active, member contribution đếm gấp đôi.

**C. `activate_club_buff(p_club_id, p_buff_type)`** — owner/deputy
- Kiểm tra club có đủ coins (server fund hoặc club treasury).
- Insert `club_buffs`. Effect apply vào contribution calculation.
- Max 1 buff mỗi loại cùng lúc. Cooldown 12h.

**D. `get_club_war_leaderboard(p_season_id)`**
- RETURN top 20 club theo `territory_points` DESC.
- Include `zones_controlled`, `total_water_contributed`, `war_wins`.

### 2.3 UI Changes

| Component | Change |
|-----------|--------|
| Club tab | Thêm "War Map" subtab: grid 5×5 visual, màu theo controlling club. |
| New: `TerritoryMap.tsx` | Heatmap zones, click để xem contribution breakdown. |
| New: `ClubBuffPanel.tsx` | Danh sách buff đang active, cooldown, nút activate (owner/deputy). |
| `BattleHistory` (Club) | Filter theo `mode_type = 'club_war'`. Show territory points earned. |
| SeasonBanner | Show club war season progress nếu user là member của club đang tham gia. |

### 2.4 Verify
- Integration: 2 clubs contribute vào cùng zone → club nào đạt target trước capture.
- Buff: hydration_boost x2 contribution, đảm bảo không có race condition.
- Leaderboard: sort và cache (read replica).

---

## Phase 3: Group Events — "Server-Wide Brackets" (1.5–2 tuần)

### Mục tiêu
Bật `group_challenges` + thêm bracket/elimination cho events server-wide.

### 3.1 DB Schema Changes

```sql
-- Extend group_challenges để hỗ trợ bracket
ALTER TABLE public.group_challenges
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'ffa'
    CHECK (event_type IN ('ffa','bracket','last_man_standing')),
  ADD COLUMN IF NOT EXISTS bracket_size int, -- 8, 16, 32, 64
  ADD COLUMN IF NOT EXISTS reward_tiers jsonb DEFAULT '[]'::jsonb;
  -- reward_tiers: [{"tier":1,"reward_coins":1000,"reward_exp":500},{"tier":2,...}]

-- Bracket matches (cho bracket mode)
CREATE TABLE IF NOT EXISTS public.group_challenge_brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.group_challenges(id) ON DELETE CASCADE,
  round int NOT NULL, -- 1, 2, 3, ...
  match_position int NOT NULL,
  user_a_id uuid REFERENCES public.profiles(id),
  user_b_id uuid REFERENCES public.profiles(id),
  winner_id uuid REFERENCES public.profiles(id),
  deadline timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed')),
  UNIQUE(challenge_id, round, match_position)
);
```

### 3.2 Business Logic (RPC)

**A. `create_group_event(p_name, p_event_type, p_bracket_size, p_duration_days, p_reward_tiers)`**
- Insert `group_challenges` với `status = 'pending'`.
- Nếu `event_type = 'bracket'`, xác nhận `bracket_size` là power of 2.

**B. `start_group_event(p_challenge_id)`** — creator/service_role
- Chuyển `status` → `'active'`.
- Nếu bracket: lấy list participants (join trước deadline), seed random, tạo round 1 brackets.
- Deadline mỗi round = `start_date + round * (duration_days / log2(bracket_size))`.

**C. `resolve_group_event_round(p_challenge_id, p_round)`** — cron/service_role
- Đối với FFA: sort participants by `total_ml` → assign rank → payout reward tiers.
- Đối với bracket: đối match nào hết deadline chưa có winner → auto-resolve (so sánh total_ml).
- Winner advance sang round tiếp. Repeat cho đến final.

**D. `claim_group_event_reward(p_challenge_id)`** — participant
- Kiểm tra event `status = 'completed'`.
- Kiểm tra user rank trong `season_duel_rankings`-like snapshot hoặc tính từ `group_challenge_participants`.
- Payout theo `reward_tiers` (tiền server fund, không từ user stake).

### 3.3 UI Changes

| Component | Change |
|-----------|--------|
| ArenaTab | Thêm "Sự Kiện" section (events list, đăng ký, đếm ngược). |
| New: `GroupEventCard.tsx` | Hiển thị event type, participants count, time left, reward pool. |
| New: `BracketView.tsx` | Tree view cho bracket mode (8/16/32 vòng). |
| New: `EventLeaderboard.tsx` | Real-time leaderboard cho FFA events (auto refresh mỗi 30s). |
| New: `LiveEventBanner.tsx` | Banner sticky khi có event đang active. |

---

## Phase 4: Battle Pass — "Season XP Track" (2 tuần)

### Mục tiêu
Gắn Battle Pass vào hệ thống seasons hiện có. Mỗi hành động trong Arena → XP → mở khóa tier reward.

### 4.1 DB Schema Changes

```sql
-- Battle Pass track definition
CREATE TABLE IF NOT EXISTS public.battle_pass_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_tier int NOT NULL DEFAULT 50,
  xp_per_tier int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_id)
);

-- Per-tier rewards
CREATE TABLE IF NOT EXISTS public.battle_pass_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_season_id uuid NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  tier int NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('coins','exp','theme','frame','badge','title','buff')),
  reward_value jsonb NOT NULL, -- { "amount": 500 } hoặc { "item_id": "abc" }
  is_premium boolean NOT NULL DEFAULT false,
  UNIQUE(pass_season_id, tier)
);

-- User progress
CREATE TABLE IF NOT EXISTS public.user_battle_pass (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pass_season_id uuid NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  current_tier int NOT NULL DEFAULT 0,
  current_xp int NOT NULL DEFAULT 0,
  is_premium boolean NOT NULL DEFAULT false,
  claimed_tiers int[] NOT NULL DEFAULT '{}',
  UNIQUE(user_id, pass_season_id)
);

CREATE INDEX idx_battle_pass_user ON public.user_battle_pass(user_id, pass_season_id);
```

### 4.2 XP Sources (Arena XP)

| Action | XP |
|--------|-----|
| Win duel ranked | 50 XP |
| Win duel vs bot | 20 XP |
| Club war contribution (per 1000ml) | 10 XP |
| Group event participate | 30 XP |
| Group event win | 100 XP |
| Win streak bonus | +10 XP per streak |
| Daily first duel | +25 XP |

### 4.3 Business Logic (RPC)

**A. `award_arena_xp(p_user_id, p_source, p_amount, p_reference_id)`**
- Insert/upsert `user_battle_pass.current_xp`.
- Nếu `current_xp >= xp_per_tier * (current_tier + 1)` → tier up, reset current_xp overflow.
- Trigger notification: tier up.

**B. `claim_battle_pass_reward(p_user_id, p_tier)`**
- Kiểm tra user đã reach tier.
- Nếu reward `is_premium = true`, kiểm tra `is_premium = true`.
- Payout (coins, exp, theme unlock, badge, title, active_buff).
- Mark `claimed_tiers`.

**C. `start_battle_pass_season(p_season_id, p_name, p_max_tier, p_xp_per_tier)`** — service_role
- Tạo `battle_pass_seasons` + `battle_pass_rewards` (seed default rewards hoặc từ config).
- Reset all `user_battle_pass` cho season trước → archive sang `user_battle_pass_history`.

### 4.4 UI Changes

| Component | Change |
|-----------|--------|
| New: `BattlePassScreen.tsx` | Full-screen battle pass với horizontal track (50 tiers). |
| New: `TierRewardCard.tsx` | Show free vs premium reward cho mỗi tier. Nút claim. |
| New: `BattlePassPurchaseModal.tsx` | Nâng cấp lên Premium (Coins hoặc IAP). |
| SeasonBanner | Show tier progress ("Tier 12 — 340/500 XP"). Mở Battle Pass khi tap. |

---

## Phase 5: Anti-Cheat & Fair Play (1.5 tuần — chạy song song)

### Mục tiêu
Bảo vệ integrity của hệ thống ranked. Không để user exploit.

### 5.1 Anti-Cheat Rules (Supabase Edge Function + Triggers)

1. **Water Log Velocity Check:** Nếu user log > 500ml trong < 1 phút → flag suspicious.
2. **Bot Farming Detection:** Nếu user thắng bot > 10 trận/ngày → giảm XP 50%, không tính streak.
3. **ELO Boosting:** Nếu 2 users chỉ đấu với nhau liên tục (> 5 trận/24h, cùng IP pattern) → flag.
4. **Club War Sandbagging:** Member không log water nhưng club win → kiểm tra contribution distribution.
5. **Auto-resolve Override:** Admin/service_role có thể revert battle result trong 1h.

### 5.2 DB Changes

```sql
CREATE TABLE IF NOT EXISTS public.arena_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Suspend ranked if flagged
ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS ranked_suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS cheat_flags int NOT NULL DEFAULT 0;
```

### 5.3 Verify
- Mock water log burst → expect flag.
- Mock bot farming → expect XP penalty.
- Run edge cases qua `challengeEngine.test.ts` và `clubChallenges.test.ts`.

---

## 4. Timeline & Sprint Mapping

| Phase | Sprint | Effort | Chủ đề |
|-------|--------|--------|--------|
| Phase 1: PvP Duel V2 | Sprint 21–22 | 3 tuần | True ELO, Matchmaking, Rank Tiers |
| Phase 2: Club Wars V2 | Sprint 23–24 | 2.5 tuần | Territory, Buff, War Seasons |
| Phase 3: Group Events | Sprint 24–25 | 2 tuần | Bracket, FFA, Reward Tiers |
| Phase 4: Battle Pass | Sprint 25–26 | 2 tuần | XP Track, Premium, Cosmetics |
| Phase 5: Anti-Cheat | Song song 21–26 | 1.5 tuần | Fair play, audit, flagging |
| **Tổng** | **~10 tuần (Sprint 21–30)** | **~7.5 tuần active coding + 2.5 buffer** | |

> Đề xuất: Merge Phase 3 + 4 nếu resource hạn chế (Group Events và Battle Pass đều là "event-like" features).

---

## 5. Chi Phí / Performance Impact

### 5.1 DB Write Volume
- Matchmaking: 1 write/queue entry. Khi matched: 1 battle insert + 2 queue deletes.
- ELO calculation: 2 profile updates/trận (challenger + opponent).
- Club war: N participants → N inserts/updates + 1 zone update.
- **Estimate:** 1000 DAU active arena → ~5,000 writes/ngày → không đáng kể cho Supabase.

### 5.2 Read Replicas
- Leaderboards (Duel ELO, Club War, Group Event) → `supabaseRead` (read replica).
- Matchmaking queue scan → index trên mode_type + elo range → O(log n).
- Battle Pass progress → single row lookup → O(1).

### 5.3 Frontend Bundle
- Mới: `BattlePassScreen.tsx`, `TerritoryMap.tsx`, `BracketView.tsx`, `RankTierBadge.tsx`
- **Estimate:** +15–25KB gzip. Lazy load (`React.lazy`) các màn major.

---

## 6. Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| ELO system bị exploit (smurf, boosting) | High | Anti-cheat Phase 5 chạy song song; K-factor thấp cho pro; IP/device fingerprint. |
| Club Wars = whales win (nạp nhiều coins mua buff) | Medium | Buff cooldown + cap per season; free players có daily free buff. |
| Battle Pass tạo pay-to-win feeling | Medium | Premium chỉ cosmetic/speed-up, không buff combat power. |
| Matchmaking queue empty ở regions nhỏ | Medium | Threshold widening; fallback to bot duels với ELO penalty nhẹ. |
| Migration conflict với Sprint 20 QA | Medium | Sprint 20 hoàn thành trước khi mở Phase 1; dùng branch per phase. |
| Club Wars real-time sync lag | Low | Dùng pg_cron batch update; không cần millisecond realtime cho territory. |

---

## 7. Success Criteria (Definition of Done cho cả 5 Phases)

- [ ] Player có thể queue ranked duel, matched với đối thủ ±100 ELO, kết quả cập nhật ELO real-time.
- [ ] Leaderboard hiển thị rank tier (Bronze→Mythic) không có bot/system accounts.
- [ ] Club có thể chiếm territory zones; buff có visible effect vào contribution.
- [ ] Group event bracket auto-advance winner; FFA event có live leaderboard.
- [ ] User có thể nhìn thấy Battle Pass tier, claim reward, và nâng premium.
- [ ] Không có report exploit nào unaddressed trong 7 ngày đầu deploy.
- [ ] Unit test coverage cho arena module >= 70%.
- [ ] All user-facing text bằng tiếng Việt (theo project rule).

---

## 8. Next Immediate Step

**Action:** Chuẩn bị Sprint 21 (Phase 1: PvP Duel V2).

**Checklist Sprint 21 (Week 1):**
- [ ] Migration: `duel_elo`, `duel_matches_total`, matchmaking queue, match history tables.
- [ ] RPC: `enter_matchmaking_queue`, `find_ranked_match`, `resolve_ranked_battle`.
- [ ] Edge/Trigger: Cron job 5s scan queue + ELO calculation.
- [ ] UI: `BattleModes` connect to real queue, `ArenaStatsHero` show tier, `DuelLeaderboard` by ELO.
- [ ] Unit test: ELO math, matchmaking logic, stake economy.
- [ ] Playwright: end-to-end ranked flow.

> **Đề xuất triển khai:** Mày muốn tôi bắt đầu Sprint 21 ngay — implement Phase 1 (True Ranked Duel) — hay cần adjust plan trước?
