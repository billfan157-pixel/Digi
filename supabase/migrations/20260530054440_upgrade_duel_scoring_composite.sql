-- Upgrade duel scoring to composite system (3 factors)
-- 1. Goal completion %
-- 2. Consistency (water logs count during duel)
-- 3. Drop check-in bonus (water_drops table)

-- ============================================================
-- 1. Create water_drops table (social check-ins)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.water_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.public_profiles(id) ON DELETE CASCADE,
  water_log_id uuid,
  message text,
  points integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.water_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_drops_select_own"
  ON public.water_drops FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "water_drops_insert_own"
  ON public.water_drops FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_water_drops_user_created
  ON public.water_drops(user_id, created_at DESC);

REVOKE ALL ON public.water_drops FROM anon, public;
GRANT SELECT, INSERT ON public.water_drops TO authenticated;

-- ============================================================
-- 2. RPC: post_water_drop (social check-in when drinking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.post_water_drop(
  p_water_log_id uuid,
  p_message text DEFAULT '💧 Just dropped some water!'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_user_id uuid;
  v_drop_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Verify the water_log belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM public.water_logs
    WHERE id = p_water_log_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('error', 'Invalid water log');
  END IF;

  INSERT INTO public.water_drops (user_id, water_log_id, message, points)
  VALUES (v_user_id, p_water_log_id, p_message, 5)
  RETURNING id INTO v_drop_id;

  RETURN json_build_object('success', true, 'drop_id', v_drop_id, 'points', 5);
END;
$func$;

REVOKE ALL ON FUNCTION public.post_water_drop(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.post_water_drop(uuid, text) TO authenticated;

-- ============================================================
-- 3. Helper: calculate duel composite score
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_duel_score(
  p_user_id uuid,
  p_battle_start timestamptz,
  p_battle_end timestamptz,
  p_water_goal integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_water_today integer;
  v_goal_score integer;
  v_log_count integer;
  v_consistency_score integer;
  v_drop_bonus integer;
BEGIN
  -- Get current water intake
  SELECT COALESCE(water_today, 0) INTO v_water_today
  FROM public.public_profiles WHERE id = p_user_id;

  -- Factor 1: Goal completion % (0-100 points, capped at 100%)
  v_goal_score := LEAST((v_water_today::numeric / NULLIF(p_water_goal, 0) * 100)::integer, 100);
  IF v_goal_score IS NULL OR v_goal_score < 0 THEN v_goal_score := 0; END IF;

  -- Factor 2: Consistency (water logs during duel, max 50 points)
  SELECT COUNT(*) INTO v_log_count
  FROM public.water_logs
  WHERE user_id = p_user_id
    AND created_at >= p_battle_start
    AND created_at <= p_battle_end;

  v_consistency_score := LEAST(v_log_count * 5, 50);

  -- Factor 3: Drop check-in bonus
  SELECT COALESCE(SUM(points), 0) INTO v_drop_bonus
  FROM public.water_drops
  WHERE user_id = p_user_id
    AND created_at >= p_battle_start
    AND created_at <= p_battle_end;

  RETURN v_goal_score + v_consistency_score + v_drop_bonus;
END;
$func$;

REVOKE ALL ON FUNCTION public.calculate_duel_score(uuid, timestamptz, timestamptz, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.calculate_duel_score(uuid, timestamptz, timestamptz, integer) TO authenticated;

-- ============================================================
-- 4. Update resolve_ranked_battle with composite scoring
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_ranked_battle(p_battle_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_battle record;
  v_my_id uuid;
  v_challenger_id uuid;
  v_opponent_id uuid;
  v_winner_id uuid;
  v_my_score integer;
  v_opp_score integer;
  v_my_goal integer;
  v_opp_goal integer;
  v_my_elo integer;
  v_opp_elo integer;
  v_my_matches integer;
  v_opp_matches integer;
  v_my_k integer;
  v_opp_k integer;
  v_ea numeric;
  v_eb numeric;
  v_sa numeric;
  v_sb numeric;
  v_delta_a integer;
  v_delta_b integer;
  v_status text;
  v_stake integer;
  v_mode text;
  v_my_streak integer;
  v_opp_streak integer;
  v_bonus integer := 0;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('status', 'error', 'reward', 0);
  END IF;

  SELECT * INTO v_battle
  FROM public.hydration_battles
  WHERE id = p_battle_id
  FOR UPDATE;

  IF NOT FOUND OR v_battle.status <> 'active' THEN
    RETURN json_build_object('status', 'expired', 'reward', 0);
  END IF;

  -- BOLA protection
  IF v_battle.challenger_id <> v_my_id AND v_battle.opponent_id <> v_my_id THEN
    RETURN json_build_object('status', 'error', 'reward', 0);
  END IF;

  v_challenger_id := v_battle.challenger_id;
  v_opponent_id := v_battle.opponent_id;
  v_stake := COALESCE(v_battle.stake_coins, 0);
  v_mode := COALESCE(v_battle.mode_type, 'daily');

  -- Get water goals for both
  SELECT COALESCE(water_goal, 2000) INTO v_my_goal FROM public.public_profiles WHERE id = v_my_id;
  SELECT COALESCE(water_goal, 2000) INTO v_opp_goal FROM public.public_profiles WHERE id = v_opponent_id;

  -- Calculate composite duel scores (3 factors)
  v_my_score := public.calculate_duel_score(v_my_id, v_battle.created_at, COALESCE(v_battle.deadline, now()), v_my_goal);
  v_opp_score := public.calculate_duel_score(v_opponent_id, v_battle.created_at, COALESCE(v_battle.deadline, now()), v_opp_goal);

  -- Lock both profiles
  SELECT duel_elo, duel_matches_total, duel_win_streak
  INTO v_my_elo, v_my_matches, v_my_streak
  FROM public.public_profiles WHERE id = v_my_id FOR UPDATE;

  SELECT duel_elo, duel_matches_total, duel_win_streak
  INTO v_opp_elo, v_opp_matches, v_opp_streak
  FROM public.public_profiles WHERE id = v_opponent_id FOR UPDATE;

  -- Determine K-factors
  v_my_k := CASE
    WHEN v_my_matches < 30 THEN 40
    WHEN v_my_matches < 100 THEN 20
    ELSE 10
  END;
  v_opp_k := CASE
    WHEN v_opp_matches < 30 THEN 40
    WHEN v_opp_matches < 100 THEN 20
    ELSE 10
  END;

  -- Calculate expected scores
  v_ea := 1.0 / (1.0 + POWER(10.0, (v_opp_elo - v_my_elo)::numeric / 400.0));
  v_eb := 1.0 / (1.0 + POWER(10.0, (v_my_elo - v_opp_elo)::numeric / 400.0));

  IF v_my_score > v_opp_score THEN
    v_sa := 1.0; v_sb := 0.0;
    v_winner_id := v_my_id;
    v_status := 'won';

    -- Streak bonus for winner
    IF v_my_streak + 1 >= 3 THEN
      v_bonus := (v_stake * 0.1)::integer;
    END IF;

    IF v_stake > 0 THEN
      UPDATE public.public_profiles
      SET coins = coins + ((v_stake * 0.9)::integer) + v_bonus
      WHERE id = v_my_id;
    END IF;

  ELSIF v_opp_score > v_my_score THEN
    v_sa := 0.0; v_sb := 1.0;
    v_winner_id := v_opponent_id;
    v_status := 'loss';

    IF v_stake > 0 THEN
      UPDATE public.public_profiles
      SET coins = coins + ((v_stake * 0.9)::integer)
      WHERE id = v_winner_id;
    END IF;

  ELSE
    v_sa := 0.5; v_sb := 0.5;
    v_winner_id := NULL;
    v_status := 'draw';

    -- Refund both players (escrow return)
    IF v_stake > 0 THEN
      UPDATE public.public_profiles
      SET coins = coins + v_stake
      WHERE id = v_my_id;
      UPDATE public.public_profiles
      SET coins = coins + v_stake
      WHERE id = v_opponent_id;
    END IF;
  END IF;

  -- ELO deltas (rounded)
  v_delta_a := ROUND(v_my_k * (v_sa - v_ea))::integer;
  v_delta_b := ROUND(v_opp_k * (v_sb - v_eb))::integer;

  -- Update challenger profile
  IF v_my_id = v_challenger_id THEN
    UPDATE public.public_profiles
    SET duel_elo = GREATEST(0, duel_elo + v_delta_a),
        duel_matches_total = duel_matches_total + 1,
        duel_last_match_at = now(),
        duel_win_streak = CASE WHEN v_sa = 1.0 THEN duel_win_streak + 1 ELSE 0 END,
        duel_total_wins = CASE WHEN v_sa = 1.0 THEN duel_total_wins + 1 ELSE duel_total_wins END,
        duel_total_losses = CASE WHEN v_sa = 0.0 THEN duel_total_losses + 1 ELSE duel_total_losses END,
        duel_total_draws = CASE WHEN v_sa = 0.5 THEN duel_total_draws + 1 ELSE duel_total_draws END,
        duel_wp = duel_wp + CASE WHEN v_sa = 1.0 THEN 10 WHEN v_sa = 0.5 THEN 5 ELSE 0 END
    WHERE id = v_challenger_id;

    UPDATE public.public_profiles
    SET duel_elo = GREATEST(0, duel_elo + v_delta_b),
        duel_matches_total = duel_matches_total + 1,
        duel_last_match_at = now(),
        duel_win_streak = CASE WHEN v_sb = 1.0 THEN duel_win_streak + 1 ELSE 0 END,
        duel_total_wins = CASE WHEN v_sb = 1.0 THEN duel_total_wins + 1 ELSE duel_total_wins END,
        duel_total_losses = CASE WHEN v_sb = 0.0 THEN duel_total_losses + 1 ELSE duel_total_losses END,
        duel_total_draws = CASE WHEN v_sb = 0.5 THEN duel_total_draws + 1 ELSE duel_total_draws END,
        duel_wp = duel_wp + CASE WHEN v_sb = 1.0 THEN 10 WHEN v_sb = 0.5 THEN 5 ELSE 0 END
    WHERE id = v_opponent_id;
  ELSE
    UPDATE public.public_profiles
    SET duel_elo = GREATEST(0, duel_elo + v_delta_b),
        duel_matches_total = duel_matches_total + 1,
        duel_last_match_at = now(),
        duel_win_streak = CASE WHEN v_sb = 1.0 THEN duel_win_streak + 1 ELSE 0 END,
        duel_total_wins = CASE WHEN v_sb = 1.0 THEN duel_total_wins + 1 ELSE duel_total_wins END,
        duel_total_losses = CASE WHEN v_sb = 0.0 THEN duel_total_losses + 1 ELSE duel_total_losses END,
        duel_total_draws = CASE WHEN v_sb = 0.5 THEN duel_total_draws + 1 ELSE duel_total_draws END,
        duel_wp = duel_wp + CASE WHEN v_sb = 1.0 THEN 10 WHEN v_sb = 0.5 THEN 5 ELSE 0 END
    WHERE id = v_challenger_id;

    UPDATE public.public_profiles
    SET duel_elo = GREATEST(0, duel_elo + v_delta_a),
        duel_matches_total = duel_matches_total + 1,
        duel_last_match_at = now(),
        duel_win_streak = CASE WHEN v_sa = 1.0 THEN duel_win_streak + 1 ELSE 0 END,
        duel_total_wins = CASE WHEN v_sa = 1.0 THEN duel_total_wins + 1 ELSE duel_total_wins END,
        duel_total_losses = CASE WHEN v_sa = 0.0 THEN duel_total_losses + 1 ELSE duel_total_losses END,
        duel_total_draws = CASE WHEN v_sa = 0.5 THEN duel_total_draws + 1 ELSE duel_total_draws END,
        duel_wp = duel_wp + CASE WHEN v_sa = 1.0 THEN 10 WHEN v_sa = 0.5 THEN 5 ELSE 0 END
    WHERE id = v_opponent_id;
  END IF;

  -- Mark battle completed
  UPDATE public.hydration_battles
  SET status = 'completed',
      winner_id = v_winner_id,
      updated_at = now()
  WHERE id = p_battle_id;

  -- Insert match history with snapshot ELOs
  INSERT INTO public.duel_match_history (
    battle_id, challenger_id, opponent_id, mode_type, winner_id,
    stake_coins,
    elo_challenger_before, elo_challenger_after,
    elo_opponent_before, elo_opponent_after
  ) VALUES (
    p_battle_id, v_challenger_id, v_opponent_id, v_mode, v_winner_id,
    v_stake,
    v_battle.elo_challenger,
    (SELECT duel_elo FROM public.public_profiles WHERE id = v_challenger_id),
    v_battle.elo_opponent,
    (SELECT duel_elo FROM public.public_profiles WHERE id = v_opponent_id)
  );

  RETURN json_build_object(
    'status', v_status,
    'reward', CASE WHEN v_status = 'won' THEN ((v_stake * 0.9)::integer) + v_bonus ELSE 0 END,
    'my_score', v_my_score,
    'opponent_score', v_opp_score,
    'milestone', NULL
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_ranked_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_ranked_battle(uuid) TO authenticated;

-- ============================================================
-- 5. Update resolve_stale_battle with composite scoring
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
  v_my_goal integer;
  v_opp_goal integer;
  v_my_score integer;
  v_opp_score integer;
  v_status text;
  v_reward int := 0;
  v_is_bot boolean;
  v_new_total_wins int;
  v_milestone text := NULL;
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

  -- Get water goals
  SELECT COALESCE(water_goal, 2000) INTO v_my_goal FROM public.public_profiles WHERE id = v_my_id;
  SELECT COALESCE(water_goal, 2000) INTO v_opp_goal FROM public.public_profiles WHERE id = v_opponent_id;

  -- Calculate composite scores
  v_my_score := public.calculate_duel_score(v_my_id, v_battle.created_at, COALESCE(v_battle.deadline, now()), v_my_goal);

  IF v_is_bot THEN
    -- Bot score based on time + difficulty
    DECLARE
      v_hour int := EXTRACT(HOUR FROM now())::int;
      v_bot_ml int;
      v_bot_goal int;
    BEGIN
      v_bot_goal := COALESCE(v_battle.target_ml, 2000);
      IF v_hour BETWEEN 8 AND 22 THEN
        v_bot_ml := ((v_hour - 7) * (v_bot_goal / 15))::int;
      ELSE
        v_bot_ml := (v_bot_goal * 0.3)::int;
      END IF;
      v_bot_ml := v_bot_ml + (v_bot_ml * (floor(random() * 41) - 20) / 100)::int;
      -- Bot has no drops, so only goal% + consistency
      v_opp_score := LEAST((GREATEST(0, v_bot_ml)::numeric / NULLIF(v_opp_goal, 0) * 100)::integer, 100)
        + LEAST((v_hour / 2), 50); -- simulated log count
    END;
  ELSE
    v_opp_score := public.calculate_duel_score(v_opponent_id, v_battle.created_at, COALESCE(v_battle.deadline, now()), v_opp_goal);
  END IF;

  -- Determine winner and update stats
  IF v_my_score > v_opp_score THEN
    v_status := 'won';
    v_reward := v_battle.stake_coins;
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = v_my_id, updated_at = now()
    WHERE id = battle_id;
    UPDATE public.public_profiles
    SET duel_win_streak = duel_win_streak + 1,
        duel_total_wins = duel_total_wins + 1,
        duel_wp = duel_wp + 10
    WHERE id = v_my_id
    RETURNING duel_total_wins INTO v_new_total_wins;
    IF NOT v_is_bot THEN
      UPDATE public.public_profiles
      SET duel_win_streak = 0,
          duel_total_losses = duel_total_losses + 1
      WHERE id = v_opponent_id;
    END IF;
  ELSIF v_opp_score > v_my_score THEN
    v_status := 'loss';
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = CASE
      WHEN v_battle.challenger_id = v_my_id THEN v_battle.opponent_id
      ELSE v_battle.challenger_id
    END, updated_at = now()
    WHERE id = battle_id;
    UPDATE public.public_profiles
    SET duel_win_streak = 0,
        duel_total_losses = duel_total_losses + 1
    WHERE id = v_my_id;
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

  -- Achievement milestone check
  IF v_status = 'won' AND v_new_total_wins IN (5, 10, 25, 50, 100) THEN
    v_milestone := CASE v_new_total_wins
      WHEN 5 THEN 'Tân Binh — 5 trận thắng'
      WHEN 10 THEN 'Chiến Binh — 10 trận thắng'
      WHEN 25 THEN 'Hiệp Sĩ — 25 trận thắng'
      WHEN 50 THEN 'Anh Hùng — 50 trận thắng'
      WHEN 100 THEN 'Huyền Thoại — 100 trận thắng'
    END;
  END IF;

  RETURN json_build_object('status', v_status, 'reward', v_reward, 'my_score', v_my_score, 'opponent_score', v_opp_score, 'milestone', v_milestone);
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_stale_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_stale_battle(uuid) TO authenticated;
