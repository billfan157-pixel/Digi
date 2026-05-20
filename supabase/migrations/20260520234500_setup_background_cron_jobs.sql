-- Migration: Setup Background Cron Jobs via pg_cron
-- Action: create batch assignment and resolution functions, and schedule them.

-- 1. Create assign_daily_quests_batch function
CREATE OR REPLACE FUNCTION public.assign_daily_quests_batch()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
  v_daily_quests_today_count integer;
  v_assigned_total integer := 0;
  v_newly_assigned_count integer;
BEGIN
  FOR v_profile IN 
    SELECT id FROM public.profiles
  LOOP
    -- Check if user already has daily quests assigned today
    SELECT count(*)
    INTO v_daily_quests_today_count
    FROM public.user_quests uq
    JOIN public.quests q ON uq.quest_id = q.id
    WHERE uq.user_id = v_profile.id
      AND q.quest_type = 'daily'
      AND uq.assigned_date = current_date;

    IF v_daily_quests_today_count = 0 THEN
      -- Assign 3 random daily quests
      INSERT INTO public.user_quests (user_id, quest_id, reset_date, expires_at, assigned_date)
      SELECT
        v_profile.id,
        q.id,
        current_date,
        current_date + time '23:59:59',
        current_date
      FROM public.quests q
      WHERE q.quest_type = 'daily'
      ORDER BY random()
      LIMIT 3
      ON CONFLICT (user_id, quest_id, reset_date) DO NOTHING;

      GET DIAGNOSTICS v_newly_assigned_count = row_count;
      v_assigned_total := v_assigned_total + v_newly_assigned_count;
    END IF;
  END LOOP;

  RETURN v_assigned_total;
END;
$$;

-- Revoke all permissions and grant only to service_role (and superuser cron)
REVOKE ALL ON FUNCTION public.assign_daily_quests_batch() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_daily_quests_batch() TO service_role;


-- 2. Create resolve_stale_battles_batch function
CREATE OR REPLACE FUNCTION public.resolve_stale_battles_batch()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle record;
  v_challenger_ml int;
  v_opponent_ml int;
  v_winner_id uuid;
  v_resolved_count int := 0;
BEGIN
  FOR v_battle IN 
    SELECT id, challenger_id, opponent_id, stake_coins FROM public.hydration_battles 
    WHERE status = 'active' AND ends_at < now()
    FOR UPDATE
  LOOP
    -- Get challenger water_today
    SELECT COALESCE(water_today, 0) INTO v_challenger_ml
    FROM public.public_profiles
    WHERE id = v_battle.challenger_id;

    -- Get opponent water_today
    SELECT COALESCE(water_today, 0) INTO v_opponent_ml
    FROM public.public_profiles
    WHERE id = v_battle.opponent_id;

    IF v_challenger_ml > v_opponent_ml THEN
      v_winner_id := v_battle.challenger_id;
      
      -- Award winner their prize (stake_coins)
      UPDATE public.profiles
      SET coins = COALESCE(coins, 0) + v_battle.stake_coins
      WHERE id = v_winner_id;

      UPDATE public.hydration_battles
      SET status = 'completed', winner_id = v_winner_id, updated_at = now()
      WHERE id = v_battle.id;

    ELSIF v_opponent_ml > v_challenger_ml THEN
      v_winner_id := v_battle.opponent_id;

      -- Award winner their prize (stake_coins)
      UPDATE public.profiles
      SET coins = COALESCE(coins, 0) + v_battle.stake_coins
      WHERE id = v_winner_id;

      UPDATE public.hydration_battles
      SET status = 'completed', winner_id = v_winner_id, updated_at = now()
      WHERE id = v_battle.id;

    ELSE
      -- Draw: no coins awarded, mark completed
      UPDATE public.hydration_battles
      SET status = 'completed', winner_id = NULL, updated_at = now()
      WHERE id = v_battle.id;
    END IF;

    v_resolved_count := v_resolved_count + 1;
  END LOOP;

  RETURN v_resolved_count;
END;
$$;

-- Revoke all permissions and grant only to service_role (and superuser cron)
REVOKE ALL ON FUNCTION public.resolve_stale_battles_batch() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_stale_battles_batch() TO service_role;


-- 3. Register background jobs using pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing schedules to prevent duplicate registration
SELECT cron.unschedule('assign-daily-quests-cron');
SELECT cron.unschedule('resolve-stale-battles-cron');

-- Schedule new cron jobs
SELECT cron.schedule(
    'assign-daily-quests-cron',
    '0 0 * * *', -- Daily at midnight
    $$SELECT public.assign_daily_quests_batch();$$
);

SELECT cron.schedule(
    'resolve-stale-battles-cron',
    '*/30 * * * *', -- Every 30 minutes
    $$SELECT public.resolve_stale_battles_batch();$$
);
