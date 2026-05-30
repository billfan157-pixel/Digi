-- ============================================================
-- Sprint 21: Arena Duel V2 — True Ranked System
-- Phase 1: PvP Duel V2 — "True Ranked"
-- ============================================================
-- Changes:
--   1. Add duel_elo, duel_matches_total, duel_last_match_at to public_profiles
--   2. Add mode_type, elo_challenger, elo_opponent to hydration_battles
--   3. Create duel_matchmaking_queue table
--   4. Create duel_match_history table
--   5. RPC: enter_matchmaking_queue (with stake escrow)
--   6. RPC: cancel_matchmaking_queue (refund stake)
--   7. RPC: find_ranked_match (widening ELO range, called by Edge Function or client poll)
--   8. RPC: resolve_ranked_battle (ELO math + stake economy + streak)
-- ============================================================

-- ------------------------------------------------------------
-- 1. public_profiles: true ELO + match tracking
-- ------------------------------------------------------------
ALTER TABLE public.public_profiles
  ADD COLUMN IF NOT EXISTS duel_elo integer NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS duel_matches_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_last_match_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_public_profiles_duel_elo
  ON public.public_profiles(duel_elo DESC)
  WHERE leaderboard_opt_in = true;

-- ------------------------------------------------------------
-- 2. hydration_battles: mode_type enum + ELO snapshot
-- ------------------------------------------------------------
ALTER TABLE public.hydration_battles
  ADD COLUMN IF NOT EXISTS mode_type text NOT NULL DEFAULT 'daily'
    CHECK (mode_type IN ('daily','quick','tournament')),
  ADD COLUMN IF NOT EXISTS elo_challenger integer,
  ADD COLUMN IF NOT EXISTS elo_opponent integer;

-- Backfill existing rows: map old 'mode' text to mode_type
UPDATE public.hydration_battles
  SET mode_type = 'daily'
  WHERE mode_type IS NULL;

-- ------------------------------------------------------------
-- 3. Matchmaking queue table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duel_matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode_type text NOT NULL DEFAULT 'daily'
    CHECK (mode_type IN ('daily','quick','tournament')),
  stake_coins integer NOT NULL DEFAULT 0,
  elo_range_low integer NOT NULL DEFAULT 0,
  elo_range_high integer NOT NULL DEFAULT 9999,
  queue_started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mode_type)
);

CREATE INDEX idx_matchmaking_queue_mode
  ON public.duel_matchmaking_queue(mode_type, elo_range_low, elo_range_high);
CREATE INDEX idx_matchmaking_queue_time
  ON public.duel_matchmaking_queue(queue_started_at);

ALTER TABLE public.duel_matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mmq_select_own"
  ON public.duel_matchmaking_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "mmq_delete_own"
  ON public.duel_matchmaking_queue FOR DELETE
  USING (user_id = auth.uid());

REVOKE ALL ON public.duel_matchmaking_queue FROM anon, public;
GRANT SELECT, DELETE ON public.duel_matchmaking_queue TO authenticated;

-- ------------------------------------------------------------
-- 4. Duel match history table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duel_match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.hydration_battles(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL,
  opponent_id uuid,
  mode_type text NOT NULL DEFAULT 'daily',
  winner_id uuid,
  stake_coins integer NOT NULL DEFAULT 0,
  elo_challenger_before integer,
  elo_challenger_after integer,
  elo_opponent_before integer,
  elo_opponent_after integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_duel_history_user
  ON public.duel_match_history(challenger_id, created_at);
CREATE INDEX idx_duel_history_opponent
  ON public.duel_match_history(opponent_id, created_at);

ALTER TABLE public.duel_match_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dmh_select_all"
  ON public.duel_match_history FOR SELECT
  USING (true);

REVOKE ALL ON public.duel_match_history FROM anon, public;
GRANT SELECT ON public.duel_match_history TO authenticated;

-- ------------------------------------------------------------
-- 5. RPC: enter_matchmaking_queue
--    - Deducts stake coins immediately (escrow)
--    - Inserts queue row with current ELO range ±200
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enter_matchmaking_queue(
  p_mode_type text DEFAULT 'daily',
  p_stake_coins integer DEFAULT 0,
  p_elo_tolerance integer DEFAULT 200
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_my_elo integer;
  v_my_coins integer;
  v_queue_id uuid;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Check if already in an active battle
  IF EXISTS (
    SELECT 1 FROM public.hydration_battles
    WHERE (challenger_id = v_my_id OR opponent_id = v_my_id)
      AND status = 'active'
  ) THEN
    RETURN json_build_object('error', 'Bạn đang có trận đấu đang diễn ra!');
  END IF;

  -- Check if already in queue for this mode
  IF EXISTS (
    SELECT 1 FROM public.duel_matchmaking_queue
    WHERE user_id = v_my_id AND mode_type = p_mode_type
  ) THEN
    RETURN json_build_object('error', 'Bạn đã đang trong hàng đợi!');
  END IF;

  -- Lock profile row and get current ELO + coins
  SELECT duel_elo, coins INTO v_my_elo, v_my_coins
  FROM public.public_profiles
  WHERE id = v_my_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Profile not found');
  END IF;

  -- Validate stake
  IF p_stake_coins > 0 AND v_my_coins < p_stake_coins THEN
    RETURN json_build_object('error', 'Không đủ xu để đặt cược');
  END IF;

  -- Deduct stake (escrow)
  IF p_stake_coins > 0 THEN
    UPDATE public.public_profiles
    SET coins = coins - p_stake_coins
    WHERE id = v_my_id;
  END IF;

  -- Insert queue
  INSERT INTO public.duel_matchmaking_queue (
    user_id, mode_type, stake_coins, elo_range_low, elo_range_high, queue_started_at
  ) VALUES (
    v_my_id, p_mode_type, p_stake_coins,
    GREATEST(0, v_my_elo - p_elo_tolerance),
    v_my_elo + p_elo_tolerance,
    now()
  )
  RETURNING id INTO v_queue_id;

  RETURN json_build_object(
    'queued', true,
    'queue_id', v_queue_id,
    'mode_type', p_mode_type,
    'stake_coins', p_stake_coins,
    'elo', v_my_elo,
    'elo_range_low', GREATEST(0, v_my_elo - p_elo_tolerance),
    'elo_range_high', v_my_elo + p_elo_tolerance
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.enter_matchmaking_queue(text, integer, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.enter_matchmaking_queue(text, integer, integer) TO authenticated;

-- ------------------------------------------------------------
-- 6. RPC: cancel_matchmaking_queue
--    - Refunds stake coins
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_matchmaking_queue(
  p_queue_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_row record;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_row
  FROM public.duel_matchmaking_queue
  WHERE id = p_queue_id AND user_id = v_my_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Không tìm thấy hàng đợi');
  END IF;

  -- Refund stake
  IF v_row.stake_coins > 0 THEN
    UPDATE public.public_profiles
    SET coins = coins + v_row.stake_coins
    WHERE id = v_my_id;
  END IF;

  DELETE FROM public.duel_matchmaking_queue
  WHERE id = p_queue_id;

  RETURN json_build_object('cancelled', true, 'refund', v_row.stake_coins);
END;
$func$;

REVOKE ALL ON FUNCTION public.cancel_matchmaking_queue(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_matchmaking_queue(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 7. RPC: find_ranked_match
--    - Finds another user in queue with overlapping ELO range
--    - Expands ELO range by +50 every 30s of waiting
--    - When matched: creates hydration_battles row, deletes both queue entries
--    - Called by Edge Function trigger OR by client poll
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_ranked_match(
  p_mode_type text DEFAULT 'daily'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_my_queue record;
  v_opponent_queue record;
  v_my_elo integer;
  v_opp_elo integer;
  v_widened_low integer;
  v_widened_high integer;
  v_battle_id uuid;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_my_queue
  FROM public.duel_matchmaking_queue
  WHERE user_id = v_my_id AND mode_type = p_mode_type
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Không trong hàng đợi');
  END IF;

  -- Get current ELO
  SELECT duel_elo INTO v_my_elo
  FROM public.public_profiles
  WHERE id = v_my_id;

  -- Calculate widened ELO range based on wait time
  v_widened_low := GREATEST(0, v_my_elo - (
    200 + (GREATEST(0, EXTRACT(EPOCH FROM (now() - v_my_queue.queue_started_at))::int / 30) * 50)
  ));
  v_widened_high := v_my_elo + (
    200 + (GREATEST(0, EXTRACT(EPOCH FROM (now() - v_my_queue.queue_started_at))::int / 30) * 50)
  );

  -- Find opponent whose ELO overlaps with widened range
  SELECT q.*, pp.duel_elo AS opponent_elo INTO v_opponent_queue
  FROM public.duel_matchmaking_queue q
  JOIN public.public_profiles pp ON pp.id = q.user_id
  WHERE q.user_id <> v_my_id
    AND q.mode_type = p_mode_type
    AND pp.duel_elo BETWEEN v_widened_low AND v_widened_high
    AND q.queue_started_at <= now() -- opponent queued before or at same time
  ORDER BY q.queue_started_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN json_build_object('matched', false, 'waiting', true,
      'elo_range_low', v_widened_low, 'elo_range_high', v_widened_high);
  END IF;

  v_opp_elo := v_opponent_queue.opponent_elo;

  -- Create battle
  INSERT INTO public.hydration_battles (
    challenger_id, opponent_id, stake_coins, target_ml, deadline,
    mode, mode_type, status, created_at, updated_at,
    elo_challenger, elo_opponent
  ) VALUES (
    v_my_id, v_opponent_queue.user_id,
    v_my_queue.stake_coins,
    2000,
    CASE p_mode_type
      WHEN 'quick' THEN now() + interval '1 hour'
      WHEN 'tournament' THEN now() + interval '7 days'
      ELSE date_trunc('day', now()) + interval '1 day' - interval '1 minute'
    END,
    CASE p_mode_type
      WHEN 'daily' THEN 'Đấu Thường Ngày'
      WHEN 'quick' THEN 'Đấu Nhanh'
      WHEN 'tournament' THEN 'Giải Đấu'
      ELSE 'Xếp Hạng'
    END,
    p_mode_type,
    'active',
    now(), now(),
    v_my_elo, v_opp_elo
  )
  RETURNING id INTO v_battle_id;

  -- Delete both queue entries
  DELETE FROM public.duel_matchmaking_queue WHERE id = v_my_queue.id;
  DELETE FROM public.duel_matchmaking_queue WHERE id = v_opponent_queue.id;

  RETURN json_build_object(
    'matched', true,
    'battle_id', v_battle_id,
    'opponent_id', v_opponent_queue.user_id,
    'opponent_elo', v_opp_elo,
    'stake_coins', v_my_queue.stake_coins
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.find_ranked_match(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.find_ranked_match(text) TO authenticated;

-- ------------------------------------------------------------
-- 8. RPC: resolve_ranked_battle
--    - ELO calculation with dynamic K-factor
--    - Stake economy: loser loses stake, winner gains stake*0.9, draw refund
--    - Streak bonus: win streak >= 3 → +10% stake reward
--    - History snapshot
--    - Based on resolve_stale_battle but with ELO + ranked logic
-- ------------------------------------------------------------
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
  v_my_ml integer;
  v_opp_ml integer;
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

  -- Fetch current water intake
  SELECT COALESCE(water_today, 0) INTO v_my_ml
  FROM public.public_profiles WHERE id = v_my_id;

  IF v_challenger_id = v_my_id THEN
    SELECT COALESCE(water_today, 0) INTO v_opp_ml
    FROM public.public_profiles WHERE id = v_opponent_id;
  ELSE
    SELECT COALESCE(water_today, 0) INTO v_opp_ml
    FROM public.public_profiles WHERE id = v_challenger_id;
  END IF;

  -- Lock both profiles
  SELECT duel_elo, duel_matches_total, duel_win_streak
  INTO v_my_elo, v_my_matches, v_my_streak
  FROM public.public_profiles WHERE id = v_my_id FOR UPDATE;

  SELECT duel_elo, duel_matches_total, duel_win_streak
  INTO v_opp_elo, v_opp_matches, v_opp_streak
  FROM public.public_profiles WHERE id =
    CASE WHEN v_my_id = v_challenger_id THEN v_opponent_id ELSE v_challenger_id END
  FOR UPDATE;

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

  IF v_my_ml > v_opp_ml THEN
    v_sa := 1.0; v_sb := 0.0;
    v_winner_id := v_my_id;
    v_status := 'won';

    -- Streak bonus for winner
    IF v_my_streak + 1 >= 3 THEN
      v_bonus := (v_stake * 0.1)::integer;
    END IF;

    -- Winner coins: stake * 0.9 + bonus
    -- Loser already paid stake when entering queue (escrow)
    -- So winner gets stake*0.9, server keeps 10%
    IF v_stake > 0 THEN
      UPDATE public.public_profiles
      SET coins = coins + ((v_stake * 0.9)::integer) + v_bonus
      WHERE id = v_my_id;
    END IF;

  ELSIF v_opp_ml > v_my_ml THEN
    v_sa := 0.0; v_sb := 1.0;
    v_winner_id :=
      CASE WHEN v_my_id = v_challenger_id THEN v_opponent_id ELSE v_challenger_id END;
    v_status := 'loss';

    -- Winner gets stake*0.9 (loser already paid escrow)
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
      WHERE id =
        CASE WHEN v_my_id = v_challenger_id THEN v_opponent_id ELSE v_challenger_id END;
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
    'reward', CASE WHEN v_status = 'won' THEN ((v_stake * 0.9)::integer + v_bonus)
                 WHEN v_status = 'draw' THEN v_stake
                 ELSE 0 END,
    'elo_delta', CASE WHEN v_my_id = v_challenger_id THEN v_delta_a ELSE v_delta_b END,
    'bonus', v_bonus
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_ranked_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_ranked_battle(uuid) TO authenticated;
