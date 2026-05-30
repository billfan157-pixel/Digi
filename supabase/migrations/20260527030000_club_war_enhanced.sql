-- Club War Enhancements: Chests, Leagues, Enhanced Battle History

-- ============================================================
-- PART 1: Clan Chests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.club_chests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  target_ml integer NOT NULL DEFAULT 50000,
  current_ml integer NOT NULL DEFAULT 0,
  reward_coins integer NOT NULL DEFAULT 500,
  reward_exp integer NOT NULL DEFAULT 100,
  is_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  UNIQUE(club_id, season_id)
);

ALTER TABLE public.club_chests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_chests_select" ON public.club_chests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_chests.club_id AND user_id = auth.uid()));

-- RPC: Get or create clan chest
CREATE OR REPLACE FUNCTION public.get_or_create_club_chest(p_club_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_season_id uuid;
  v_chest record;
BEGIN
  SELECT id INTO v_season_id FROM public.seasons WHERE is_active = true LIMIT 1;

  SELECT * INTO v_chest FROM public.club_chests
  WHERE club_id = p_club_id AND (v_season_id IS NULL OR season_id = v_season_id)
    AND is_claimed = false
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.club_chests (club_id, season_id, target_ml, current_ml, reward_coins, reward_exp)
    VALUES (p_club_id, v_season_id, 50000, 0, 500, 100)
    RETURNING * INTO v_chest;
  END IF;

  RETURN json_build_object(
    'id', v_chest.id,
    'club_id', v_chest.club_id,
    'target_ml', v_chest.target_ml,
    'current_ml', v_chest.current_ml,
    'reward_coins', v_chest.reward_coins,
    'reward_exp', v_chest.reward_exp,
    'is_claimed', v_chest.is_claimed,
    'progress', CASE WHEN v_chest.target_ml > 0 THEN (v_chest.current_ml * 100.0 / v_chest.target_ml) ELSE 0 END
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.get_or_create_club_chest(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_club_chest(uuid) TO authenticated;

-- RPC: Contribute to clan chest
CREATE OR REPLACE FUNCTION public.contribute_club_chest(p_chest_id uuid, p_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_chest record;
  v_user_club_id uuid;
BEGIN
  SELECT club_id INTO v_user_club_id FROM public.club_members WHERE user_id = auth.uid() LIMIT 1;
  IF v_user_club_id IS NULL THEN
    RETURN json_build_object('error', 'Bạn không thuộc club nào');
  END IF;

  SELECT * INTO v_chest FROM public.club_chests WHERE id = p_chest_id FOR UPDATE;
  IF NOT FOUND OR v_chest.is_claimed THEN
    RETURN json_build_object('error', 'Rương không tồn tại hoặc đã nhận');
  END IF;

  IF v_user_club_id <> v_chest.club_id THEN
    RETURN json_build_object('error', 'Bạn không thuộc club này');
  END IF;

  UPDATE public.club_chests
  SET current_ml = LEAST(current_ml + p_amount, target_ml)
  WHERE id = p_chest_id;

  SELECT * INTO v_chest FROM public.club_chests WHERE id = p_chest_id;

  RETURN json_build_object(
    'current_ml', v_chest.current_ml,
    'target_ml', v_chest.target_ml,
    'progress', (v_chest.current_ml * 100.0 / NULLIF(v_chest.target_ml, 0)),
    'is_full', v_chest.current_ml >= v_chest.target_ml
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.contribute_club_chest(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contribute_club_chest(uuid, integer) TO authenticated;

-- RPC: Claim clan chest rewards
CREATE OR REPLACE FUNCTION public.claim_club_chest(p_chest_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_chest record;
  v_user_club_id uuid;
BEGIN
  SELECT club_id INTO v_user_club_id FROM public.club_members WHERE user_id = auth.uid() LIMIT 1;
  IF v_user_club_id IS NULL THEN
    RETURN json_build_object('error', 'Bạn không thuộc club nào');
  END IF;

  SELECT * INTO v_chest FROM public.club_chests WHERE id = p_chest_id FOR UPDATE;
  IF NOT FOUND OR v_chest.is_claimed THEN
    RETURN json_build_object('error', 'Rương không tồn tại hoặc đã nhận');
  END IF;

  IF v_chest.current_ml < v_chest.target_ml THEN
    RETURN json_build_object('error', 'Rương chưa đầy');
  END IF;

  UPDATE public.club_chests
  SET is_claimed = true, claimed_at = now()
  WHERE id = p_chest_id;

  UPDATE public.public_profiles
  SET coins = coins + (v_chest.reward_coins / (SELECT COUNT(*) FROM public.club_members WHERE club_id = v_chest.club_id)),
      exp = exp + (v_chest.reward_exp / (SELECT COUNT(*) FROM public.club_members WHERE club_id = v_chest.club_id))
  WHERE id = auth.uid();

  RETURN json_build_object('status', 'claimed', 'coins', v_chest.reward_coins, 'exp', v_chest.reward_exp);
END;
$func$;

REVOKE ALL ON FUNCTION public.claim_club_chest(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_club_chest(uuid) TO authenticated;

-- ============================================================
-- PART 2: War Leagues
-- ============================================================

CREATE TABLE IF NOT EXISTS public.club_war_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_rank integer NOT NULL DEFAULT 0,
  max_rank integer NOT NULL DEFAULT 999999,
  icon text NOT NULL DEFAULT 'shield',
  color text NOT NULL DEFAULT '#94a3b8',
  min_league_points integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.club_league_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.club_war_leagues(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  rank integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_id, club_id)
);

ALTER TABLE public.club_war_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_league_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_war_leagues_select" ON public.club_war_leagues FOR SELECT USING (true);
CREATE POLICY "club_league_rankings_select" ON public.club_league_rankings FOR SELECT USING (true);

-- Seed leagues
INSERT INTO public.club_war_leagues (name, min_rank, max_rank, icon, color, min_league_points) VALUES
  ('Đồng', 1, 10, 'shield', '#92400e', 0),
  ('Bạc', 11, 50, 'shield', '#64748b', 100),
  ('Vàng', 51, 100, 'shield', '#eab308', 300),
  ('Bạch Kim', 101, 200, 'shield', '#06b6d4', 600),
  ('Kim Cương', 201, 999999, 'crown', '#a855f7', 1000)
ON CONFLICT DO NOTHING;

-- Add league_points to clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS league_points integer NOT NULL DEFAULT 0;

-- RPC: Get club's league info
CREATE OR REPLACE FUNCTION public.get_club_league(p_club_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_points integer;
  v_league record;
  v_rank integer;
BEGIN
  SELECT league_points INTO v_points FROM public.clubs WHERE id = p_club_id;
  IF v_points IS NULL THEN
    v_points := 0;
  END IF;

  SELECT * INTO v_league FROM public.club_war_leagues
  WHERE v_points BETWEEN min_league_points AND (SELECT max(min_league_points) - 1 FROM public.club_war_leagues WHERE min_league_points > v_points ORDER BY min_league_points LIMIT 1)
  ORDER BY min_league_points DESC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_league FROM public.club_war_leagues ORDER BY min_league_points DESC LIMIT 1;
  END IF;

  SELECT COUNT(*)::integer + 1 INTO v_rank
  FROM public.clubs
  WHERE league_points > v_points;

  RETURN json_build_object(
    'league', json_build_object('name', v_league.name, 'icon', v_league.icon, 'color', v_league.color, 'min_points', v_league.min_league_points),
    'points', v_points,
    'rank', v_rank
  );
END;
$func$;

REVOKE ALL ON FUNCTION public.get_club_league(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_club_league(uuid) TO authenticated;

-- Grant league points when resolving club battle
CREATE OR REPLACE FUNCTION public.grant_league_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'active' AND NEW.winner_club_id IS NOT NULL THEN
    UPDATE public.clubs SET league_points = league_points + 25 WHERE id = NEW.winner_club_id;
    UPDATE public.clubs SET league_points = GREATEST(0, league_points - 10) WHERE id = CASE
      WHEN NEW.winner_club_id = NEW.challenger_club_id THEN NEW.opponent_club_id
      ELSE NEW.challenger_club_id
    END;
    UPDATE public.clubs SET league_points = league_points + 10 WHERE id IN (NEW.challenger_club_id, NEW.opponent_club_id);
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_grant_league_points ON public.club_battles;
CREATE TRIGGER trg_grant_league_points
  AFTER UPDATE OF status ON public.club_battles
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.grant_league_points();

-- RPC: Get league rankings
CREATE OR REPLACE FUNCTION public.get_league_rankings()
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
      'rank', ROW_NUMBER() OVER (ORDER BY league_points DESC),
      'club_id', c.id,
      'name', c.name,
      'league_points', c.league_points,
      'battle_wins', c.battle_wins,
      'battle_losses', c.battle_losses,
      'member_count', c.member_count
    ) ORDER BY league_points DESC
  ) INTO v_result
  FROM public.clubs c
  WHERE c.battle_wins + c.battle_losses > 0
  LIMIT 100;

  RETURN COALESCE(v_result, '[]'::json);
END;
$func$;

REVOKE ALL ON FUNCTION public.get_league_rankings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_league_rankings() TO authenticated;
