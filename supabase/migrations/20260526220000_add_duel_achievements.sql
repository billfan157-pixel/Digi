-- Phase 5: Duel Achievements
-- Adds milestone detection to resolve_stale_battle RPC

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

  SELECT COALESCE(water_today, 0) INTO v_my_ml
  FROM public.public_profiles
  WHERE id = v_my_id;

  -- For bot opponents, use a simulated water intake
  IF v_is_bot THEN
    DECLARE
      v_hour int := EXTRACT(HOUR FROM now())::int;
      v_bot_ml int;
    BEGIN
      IF v_hour BETWEEN 8 AND 22 THEN
        v_bot_ml := ((v_hour - 7) * (v_battle.target_ml / 15))::int;
      ELSE
        v_bot_ml := (v_battle.target_ml * 0.3)::int;
      END IF;
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
  ELSIF v_opponent_ml > v_my_ml THEN
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

  RETURN json_build_object('status', v_status, 'reward', v_reward, 'milestone', v_milestone);
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_stale_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_stale_battle(uuid) TO authenticated;

-- Achievement tracking table (optional, for persistent badge display)
CREATE TABLE IF NOT EXISTS public.duel_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.public_profiles(id) ON DELETE CASCADE,
  achievement text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement)
);

ALTER TABLE public.duel_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duel_achievements_select" ON public.duel_achievements
  FOR SELECT USING (true);

CREATE POLICY "duel_achievements_insert" ON public.duel_achievements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.public_profiles WHERE id = user_id AND id = auth.uid())
  );
