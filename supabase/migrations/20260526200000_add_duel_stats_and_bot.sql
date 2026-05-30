-- Phase 3: Duel Nâng Cao
-- 1. Duel stats columns for public_profiles
-- 2. Update resolve_stale_battle to track streaks + total stats
-- 3. Bot player profile
-- 4. start_bot_duel RPC
-- 5. find_duel_match RPC (random opponent)

-- ============================================================
-- 1. Add duel stats to public_profiles
-- ============================================================
ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS duel_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_total_draws integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_wp integer NOT NULL DEFAULT 0;

-- Index for quick matchmaking (find available players)
CREATE INDEX IF NOT EXISTS idx_public_profiles_duel_wp
  ON public.public_profiles(duel_wp DESC)
  WHERE leaderboard_opt_in = true;

-- ============================================================
-- 2. Update resolve_stale_battle to update duel stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_stale_battle(battle_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_battle record;
  v_my_id uuid;
  v_opponent_id uuid;
  v_my_ml int;
  v_opponent_ml int;
  v_status text;
  v_reward int := 0;
  v_is_bot boolean;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('status', 'error', 'reward', 0);
  END IF;

  SELECT * INTO v_battle
  FROM public.hydration_battles
  WHERE id = battle_id
  FOR UPDATE;

  IF NOT FOUND OR v_battle.status <> 'active' THEN
    RETURN json_build_object('status', 'expired', 'reward', 0);
  END IF;

  -- BOLA Protection
  IF v_battle.challenger_id <> v_my_id AND v_battle.opponent_id <> v_my_id THEN
    RETURN json_build_object('status', 'error', 'reward', 0);
  END IF;

  -- Determine opponent
  IF v_battle.challenger_id = v_my_id THEN
    v_opponent_id := v_battle.opponent_id;
  ELSE
    v_opponent_id := v_battle.challenger_id;
  END IF;

  -- Check if opponent is a bot
  SELECT EXISTS(SELECT 1 FROM public.public_profiles WHERE id = v_opponent_id AND nickname LIKE '[Bot]%') INTO v_is_bot;

  SELECT COALESCE(water_today, 0) INTO v_my_ml
  FROM public.public_profiles
  WHERE id = v_my_id;

  -- For bot opponents, use a simulated water intake
  IF v_is_bot THEN
    -- Bot's intake is based on time of day + difficulty
    -- We'll use a deterministic pattern: hour of day * (target_ml / 24) * bot_factor
    DECLARE
      v_hour int := EXTRACT(HOUR FROM now())::int;
      v_bot_ml int;
    BEGIN
      -- Bot drinks more actively during daytime (8-22)
      IF v_hour BETWEEN 8 AND 22 THEN
        v_bot_ml := ((v_hour - 7) * (v_battle.target_ml / 15))::int;
      ELSE
        v_bot_ml := (v_battle.target_ml * 0.3)::int;
      END IF;
      -- Add randomness: ±20%
      v_bot_ml := v_bot_ml + (v_bot_ml * (floor(random() * 41) - 20) / 100)::int;
      v_opponent_ml := GREATEST(0, v_bot_ml);
    END;
  ELSE
    SELECT COALESCE(water_today, 0) INTO v_opponent_ml
    FROM public.public_profiles
    WHERE id = v_opponent_id;
  END IF;

  -- Determine winner and update stats
  IF v_my_ml > v_opponent_ml THEN
    v_status := 'won';
    v_reward := v_battle.stake_coins;
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = v_my_id, updated_at = now()
    WHERE id = battle_id;
    -- Increment win streak + total wins for caller
    UPDATE public.public_profiles
    SET duel_win_streak = duel_win_streak + 1,
        duel_total_wins = duel_total_wins + 1,
        duel_wp = duel_wp + 10
    WHERE id = v_my_id;
    -- Reset loser's streak (if not a bot)
    IF NOT v_is_bot THEN
      UPDATE public.public_profiles
      SET duel_win_streak = 0,
          duel_total_losses = duel_total_losses + 1
      WHERE id = v_opponent_id;
    END IF;
  ELSIF v_opponent_ml > v_my_ml THEN
    v_status := 'loss';
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = CASE
      WHEN v_battle.challenger_id = v_my_id THEN v_battle.opponent_id
      ELSE v_battle.challenger_id
    END, updated_at = now()
    WHERE id = battle_id;
    -- Reset win streak + increment losses for caller
    UPDATE public.public_profiles
    SET duel_win_streak = 0,
        duel_total_losses = duel_total_losses + 1
    WHERE id = v_my_id;
    -- Increment winner's stats (if not a bot)
    IF NOT v_is_bot THEN
      UPDATE public.public_profiles
      SET duel_win_streak = duel_win_streak + 1,
          duel_total_wins = duel_total_wins + 1,
          duel_wp = duel_wp + 10
      WHERE id = v_opponent_id;
    END IF;
  ELSE
    v_status := 'draw';
    v_reward := v_battle.stake_coins;
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = NULL, updated_at = now()
    WHERE id = battle_id;
    UPDATE public.public_profiles
    SET duel_total_draws = duel_total_draws + 1,
        duel_wp = duel_wp + 5
    WHERE id = v_my_id;
    IF NOT v_is_bot THEN
      UPDATE public.public_profiles
      SET duel_total_draws = duel_total_draws + 1,
          duel_wp = duel_wp + 5
      WHERE id = v_opponent_id;
    END IF;
  END IF;

  RETURN json_build_object('status', v_status, 'reward', v_reward);
END;
$func$;

-- ============================================================
-- 3. Bot + System profiles
-- Bypass FK temporarily (profiles.id -> auth.users.id can't accept fake UUIDs)
-- ============================================================
ALTER TABLE public.public_profiles DROP CONSTRAINT IF EXISTS public_profiles_id_fkey;

INSERT INTO public.public_profiles (id, nickname, avatar_url, level, wp, total_wp, duel_wp, leaderboard_opt_in)
VALUES
  ('00000000-0000-0000-0000-000000000000', '[System] Matchmaking', NULL, 0, 0, 0, 0, false),
  ('00000000-0000-0000-0000-000000000001', '[Bot] Rồng Nước', NULL, 5, 0, 0, 500, false),
  ('00000000-0000-0000-0000-000000000002', '[Bot] Thủy Thần', NULL, 10, 0, 0, 800, false),
  ('00000000-0000-0000-0000-000000000003', '[Bot] Giọt Sương', NULL, 3, 0, 0, 300, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.public_profiles
  ADD CONSTRAINT public_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE
  NOT VALID;

-- ============================================================
-- 4. start_bot_duel RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_bot_duel(p_bot_id uuid, p_target_ml integer DEFAULT 2000, p_deadline timestamptz DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_battle_id uuid;
  v_deadline timestamptz;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Default deadline: end of today
  IF p_deadline IS NULL THEN
    v_deadline := date_trunc('day', now()) + interval '1 day' - interval '1 minute';
  ELSE
    v_deadline := p_deadline;
  END IF;

  INSERT INTO public.hydration_battles (challenger_id, opponent_id, stake_coins, target_ml, deadline, mode, status)
  VALUES (v_my_id, p_bot_id, 0, p_target_ml, v_deadline, 'Đấu với Bot', 'active')
  RETURNING id INTO v_battle_id;

  RETURN json_build_object('battle_id', v_battle_id);
END;
$func$;

REVOKE ALL ON FUNCTION public.start_bot_duel(uuid, integer, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_bot_duel(uuid, integer, timestamptz) TO authenticated;

-- ============================================================
-- 5. find_duel_match RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_duel_match(p_stake_coins integer DEFAULT 0)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_match record;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Check if user already has an active battle
  IF EXISTS (
    SELECT 1 FROM public.hydration_battles
    WHERE (challenger_id = v_my_id OR opponent_id = v_my_id)
      AND status = 'active'
  ) THEN
    RETURN json_build_object('error', 'Bạn đang có trận đấu!');
  END IF;

  -- Find a pending battle that needs an opponent
  SELECT * INTO v_match
  FROM public.hydration_battles
  WHERE opponent_id = '00000000-0000-0000-0000-000000000000'
    AND status = 'pending'
    AND stake_coins = p_stake_coins
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    -- Accept the match
    UPDATE public.hydration_battles
    SET opponent_id = v_my_id,
        status = 'active',
        updated_at = now()
    WHERE id = v_match.id;

    RETURN json_build_object('battle_id', v_match.id, 'matched', true);
  ELSE
    -- No match found, create a new matchmaking entry
    INSERT INTO public.hydration_battles (challenger_id, opponent_id, stake_coins, target_ml, deadline, mode, status)
    VALUES (v_my_id, '00000000-0000-0000-0000-000000000000', p_stake_coins, 2000, date_trunc('day', now()) + interval '1 day' - interval '1 minute', 'Đấu Nhanh', 'pending')
    RETURNING id INTO v_match.id;

    RETURN json_build_object('battle_id', v_match.id, 'matched', false, 'waiting', true);
  END IF;
END;
$func$;

REVOKE ALL ON FUNCTION public.find_duel_match(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.find_duel_match(integer) TO authenticated;
