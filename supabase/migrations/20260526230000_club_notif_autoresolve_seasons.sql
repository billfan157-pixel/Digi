-- Phase 5: Club Battle Notifications + Auto-resolve + Seasons

-- ============================================================
-- PART 1: Club Battle Notification Triggers
-- ============================================================

-- Notify when a club challenge is sent
CREATE OR REPLACE FUNCTION public.notify_club_challenge_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, message)
  SELECT club_members.user_id, NEW.created_by, 'club_challenge',
    'Club ' || (SELECT name FROM public.clubs WHERE id = NEW.challenger_club_id) || ' đã thách đấu club của bạn!'
  FROM public.club_members
  WHERE club_members.club_id = NEW.opponent_club_id
    AND club_members.role IN ('owner', 'deputy');
  RETURN NEW;
END;
$func$;

-- Notify when club battle is accepted
CREATE OR REPLACE FUNCTION public.notify_club_battle_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_acceptor_id uuid;
BEGIN
  v_acceptor_id := auth.uid();
  INSERT INTO public.notifications (recipient_id, actor_id, type, message)
  SELECT club_members.user_id, v_acceptor_id, 'club_battle_started',
    'Trận chiến giữa ' || (SELECT name FROM public.clubs WHERE id = NEW.challenger_club_id)
    || ' và ' || (SELECT name FROM public.clubs WHERE id = NEW.opponent_club_id) || ' bắt đầu! Hãy đóng góp nước!'
  FROM public.club_members
  WHERE club_members.club_id IN (NEW.challenger_club_id, NEW.opponent_club_id);
  RETURN NEW;
END;
$func$;

-- Notify when club battle is completed
CREATE OR REPLACE FUNCTION public.notify_club_battle_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_winner_name text;
BEGIN
  SELECT name INTO v_winner_name FROM public.clubs WHERE id = NEW.winner_club_id;
  INSERT INTO public.notifications (recipient_id, type, message)
  SELECT club_members.user_id, 'club_battle_result',
    CASE WHEN club_members.club_id = NEW.winner_club_id
      THEN 'Club của bạn đã chiến thắng trước ' || (SELECT name FROM public.clubs WHERE id = CASE WHEN NEW.winner_club_id = NEW.challenger_club_id THEN NEW.opponent_club_id ELSE NEW.challenger_club_id END) || '!'
      ELSE 'Club của bạn đã thua trước ' || v_winner_name || '. Cố gắng lần sau!'
    END
  FROM public.club_members
  WHERE club_members.club_id IN (NEW.challenger_club_id, NEW.opponent_club_id);
  RETURN NEW;
END;
$func$;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_notify_club_challenge_sent ON public.club_battles;
DROP TRIGGER IF EXISTS trg_notify_club_battle_accepted ON public.club_battles;
DROP TRIGGER IF EXISTS trg_notify_club_battle_completed ON public.club_battles;

CREATE TRIGGER trg_notify_club_challenge_sent
  AFTER INSERT ON public.club_battles
  FOR EACH ROW EXECUTE FUNCTION public.notify_club_challenge_sent();

CREATE TRIGGER trg_notify_club_battle_accepted
  AFTER UPDATE OF status ON public.club_battles
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'active')
  EXECUTE FUNCTION public.notify_club_battle_accepted();

CREATE TRIGGER trg_notify_club_battle_completed
  AFTER UPDATE OF status ON public.club_battles
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.notify_club_battle_completed();

-- ============================================================
-- PART 2: Auto-resolve stale club battles
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolve_stale_club_battles_batch()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_battle record;
  v_challenger_total integer;
  v_opponent_total integer;
  v_resolved_count int := 0;
BEGIN
  FOR v_battle IN
    SELECT * FROM public.club_battles
    WHERE status = 'active' AND deadline < now()
    FOR UPDATE
  LOOP
    SELECT COALESCE(SUM(total_water), 0) INTO v_challenger_total
    FROM public.club_battle_participants
    WHERE battle_id = v_battle.id AND club_id = v_battle.challenger_club_id;

    SELECT COALESCE(SUM(total_water), 0) INTO v_opponent_total
    FROM public.club_battle_participants
    WHERE battle_id = v_battle.id AND club_id = v_battle.opponent_club_id;

    IF v_challenger_total >= v_opponent_total THEN
      UPDATE public.club_battles
      SET status = 'completed', winner_club_id = v_battle.challenger_club_id, updated_at = now()
      WHERE id = v_battle.id;
      UPDATE public.clubs SET battle_wins = battle_wins + 1 WHERE id = v_battle.challenger_club_id;
      UPDATE public.clubs SET battle_losses = battle_losses + 1 WHERE id = v_battle.opponent_club_id;
    ELSE
      UPDATE public.club_battles
      SET status = 'completed', winner_club_id = v_battle.opponent_club_id, updated_at = now()
      WHERE id = v_battle.id;
      UPDATE public.clubs SET battle_wins = battle_wins + 1 WHERE id = v_battle.opponent_club_id;
      UPDATE public.clubs SET battle_losses = battle_losses + 1 WHERE id = v_battle.challenger_club_id;
    END IF;

    v_resolved_count := v_resolved_count + 1;
  END LOOP;

  RETURN v_resolved_count;
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_stale_club_battles_batch() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_stale_club_battles_batch() TO service_role;

-- Register cron job (hourly)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resolve-stale-club-battles-cron') THEN
    PERFORM cron.unschedule('resolve-stale-club-battles-cron');
  END IF;
END $$;

SELECT cron.schedule(
  'resolve-stale-club-battles-cron',
  '0 * * * *', -- Every hour
  $$SELECT public.resolve_stale_club_battles_batch();$$
);

-- ============================================================
-- PART 3: Seasons System
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.season_duel_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.public_profiles(id) ON DELETE CASCADE,
  duel_wp_earned integer NOT NULL DEFAULT 0,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  rank integer,
  UNIQUE(season_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.season_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  rank_from integer NOT NULL,
  rank_to integer NOT NULL,
  reward_type text NOT NULL DEFAULT 'duel_wp',
  reward_amount integer NOT NULL DEFAULT 0
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_duel_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seasons_select" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "season_rankings_select" ON public.season_duel_rankings FOR SELECT USING (true);
CREATE POLICY "season_rewards_select" ON public.season_rewards FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_season_rankings_season ON public.season_duel_rankings(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_season_rankings_user ON public.season_duel_rankings(user_id);

-- RPC: start new season
CREATE OR REPLACE FUNCTION public.start_new_season(p_name text, p_start_date timestamptz, p_end_date timestamptz)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_season_id uuid;
BEGIN
  -- Deactivate all current seasons
  UPDATE public.seasons SET is_active = false WHERE is_active = true;
  -- Create new season
  INSERT INTO public.seasons (name, start_date, end_date, is_active)
  VALUES (p_name, p_start_date, p_end_date, true)
  RETURNING id INTO v_season_id;
  RETURN v_season_id;
END;
$func$;

REVOKE ALL ON FUNCTION public.start_new_season(text, timestamptz, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_new_season(text, timestamptz, timestamptz) TO service_role;

-- RPC: end season (archive rankings, reset duel_wp 50%)
CREATE OR REPLACE FUNCTION public.end_season(p_season_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_season record;
  v_player record;
  v_rank integer;
BEGIN
  SELECT * INTO v_season FROM public.seasons WHERE id = p_season_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Season not found');
  END IF;

  -- Snapshot current duel_wp as earned in season
  v_rank := 0;
  FOR v_player IN
    SELECT id, duel_wp, duel_total_wins, duel_total_losses
    FROM public.public_profiles
    WHERE duel_wp > 0
    ORDER BY duel_wp DESC
  LOOP
    v_rank := v_rank + 1;
    INSERT INTO public.season_duel_rankings (season_id, user_id, duel_wp_earned, matches_played, wins, rank)
    VALUES (p_season_id, v_player.id, v_player.duel_wp, v_player.duel_total_wins + v_player.duel_total_losses, v_player.duel_total_wins, v_rank)
    ON CONFLICT (season_id, user_id) DO UPDATE SET duel_wp_earned = EXCLUDED.duel_wp_earned, rank = EXCLUDED.rank;
  END LOOP;

  -- Reset duel_wp by 50% (keep half, incentive to play next season)
  UPDATE public.public_profiles
  SET duel_wp = duel_wp / 2;

  -- Deactivate season
  UPDATE public.seasons SET is_active = false WHERE id = p_season_id;

  RETURN json_build_object('status', 'ended', 'total_players', v_rank);
END;
$func$;

REVOKE ALL ON FUNCTION public.end_season(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.end_season(uuid) TO service_role;

-- RPC: get current season info
CREATE OR REPLACE FUNCTION public.get_current_season()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'id', s.id,
    'name', s.name,
    'start_date', s.start_date,
    'end_date', s.end_date,
    'is_active', s.is_active,
    'days_remaining', EXTRACT(DAY FROM (s.end_date - now()))::int
  ) INTO v_result
  FROM public.seasons s
  WHERE s.is_active = true
  LIMIT 1;
  RETURN v_result;
END;
$func$;

REVOKE ALL ON FUNCTION public.get_current_season() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_current_season() TO authenticated;

-- RPC: get season rankings (top 100)
CREATE OR REPLACE FUNCTION public.get_season_rankings(p_season_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'rank', sr.rank,
      'user_id', sr.user_id,
      'nickname', pp.nickname,
      'avatar_url', pp.avatar_url,
      'duel_wp_earned', sr.duel_wp_earned,
      'wins', sr.wins,
      'matches_played', sr.matches_played
    ) ORDER BY sr.rank
  ) INTO v_result
  FROM public.season_duel_rankings sr
  JOIN public.public_profiles pp ON pp.id = sr.user_id
  WHERE sr.season_id = p_season_id AND sr.rank <= 100;
  RETURN COALESCE(v_result, '[]'::json);
END;
$func$;

REVOKE ALL ON FUNCTION public.get_season_rankings(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_season_rankings(uuid) TO authenticated;

-- RPC: get user's season rank
CREATE OR REPLACE FUNCTION public.get_user_season_rank(p_season_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'rank', sr.rank,
    'duel_wp_earned', sr.duel_wp_earned,
    'wins', sr.wins,
    'matches_played', sr.matches_played
  ) INTO v_result
  FROM public.season_duel_rankings sr
  WHERE sr.season_id = p_season_id AND sr.user_id = p_user_id;
  RETURN v_result;
END;
$func$;

REVOKE ALL ON FUNCTION public.get_user_season_rank(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_season_rank(uuid, uuid) TO authenticated;
