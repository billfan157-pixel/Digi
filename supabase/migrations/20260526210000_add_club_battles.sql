-- Phase 4: Club Battle (Guild Wars)
-- Tables + RPCs for club-vs-club hydration battles

-- ============================================================
-- 1. club_battles table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.club_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  opponent_club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
  target_ml integer NOT NULL DEFAULT 5000,
  deadline timestamptz,
  winner_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  stake_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.public_profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- 2. club_battle_participants table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.club_battle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.club_battles(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.public_profiles(id) ON DELETE CASCADE,
  total_water integer NOT NULL DEFAULT 0,
  contributed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- ============================================================
-- 3. Add battle stats to clubs table
-- ============================================================
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS battle_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS battle_losses integer NOT NULL DEFAULT 0;

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_club_battles_challenger ON public.club_battles(challenger_club_id);
CREATE INDEX IF NOT EXISTS idx_club_battles_opponent ON public.club_battles(opponent_club_id);
CREATE INDEX IF NOT EXISTS idx_club_battles_status ON public.club_battles(status);
CREATE INDEX IF NOT EXISTS idx_club_battle_participants_battle ON public.club_battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_club_battle_participants_user ON public.club_battle_participants(user_id);

-- ============================================================
-- 5. RLS
-- ============================================================
ALTER TABLE public.club_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_battle_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_battles_select_policy" ON public.club_battles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id IN (challenger_club_id, opponent_club_id)
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "club_battles_insert_policy" ON public.club_battles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = challenger_club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'deputy')
    )
  );

CREATE POLICY "club_battles_update_policy" ON public.club_battles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id IN (challenger_club_id, opponent_club_id)
        AND user_id = auth.uid()
        AND role IN ('owner', 'deputy')
    )
  );

CREATE POLICY "club_battle_participants_select" ON public.club_battle_participants
  FOR SELECT USING (true);

CREATE POLICY "club_battle_participants_insert" ON public.club_battle_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = club_battle_participants.club_id
        AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. create_club_battle RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_club_battle(
  p_opponent_club_id uuid,
  p_target_ml integer DEFAULT 5000,
  p_stake_coins integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_my_club_id uuid;
  v_battle_id uuid;
  v_hours integer := 24;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Get user's club
  SELECT club_id INTO v_my_club_id
  FROM public.club_members
  WHERE user_id = v_my_id AND role IN ('owner', 'deputy');

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Bạn không phải chủ club hoặc phó!');
  END IF;

  IF v_my_club_id = p_opponent_club_id THEN
    RETURN json_build_object('error', 'Không thể thách đấu club của mình!');
  END IF;

  -- Check for existing active battle between these clubs
  IF EXISTS (
    SELECT 1 FROM public.club_battles
    WHERE ((challenger_club_id = v_my_club_id AND opponent_club_id = p_opponent_club_id)
        OR (challenger_club_id = p_opponent_club_id AND opponent_club_id = v_my_club_id))
      AND status IN ('pending', 'active')
  ) THEN
    RETURN json_build_object('error', 'Đã có trận đấu giữa 2 club!');
  END IF;

  INSERT INTO public.club_battles (challenger_club_id, opponent_club_id, target_ml, stake_coins, status, deadline, created_by)
  VALUES (v_my_club_id, p_opponent_club_id, p_target_ml, p_stake_coins, 'pending', now() + (v_hours || ' hours')::interval, v_my_id)
  RETURNING id INTO v_battle_id;

  RETURN json_build_object('battle_id', v_battle_id, 'status', 'pending');
END;
$func$;

REVOKE ALL ON FUNCTION public.create_club_battle(uuid, integer, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_club_battle(uuid, integer, integer) TO authenticated;

-- ============================================================
-- 7. accept_club_battle RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_club_battle(p_battle_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_battle record;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_battle
  FROM public.club_battles
  WHERE id = p_battle_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Không tìm thấy trận đấu!');
  END IF;

  -- Verify caller is owner/deputy of opponent club
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = v_battle.opponent_club_id
      AND user_id = v_my_id
      AND role IN ('owner', 'deputy')
  ) THEN
    RETURN json_build_object('error', 'Chỉ chủ club hoặc phó mới có thể nhận!');
  END IF;

  UPDATE public.club_battles
  SET status = 'active', updated_at = now()
  WHERE id = p_battle_id;

  -- Register all club members as participants
  INSERT INTO public.club_battle_participants (battle_id, club_id, user_id)
  SELECT p_battle_id, v_battle.challenger_club_id, cm.user_id
  FROM public.club_members cm
  WHERE cm.club_id = v_battle.challenger_club_id
    AND cm.user_id IS NOT NULL
  ON CONFLICT (battle_id, user_id) DO NOTHING;

  INSERT INTO public.club_battle_participants (battle_id, club_id, user_id)
  SELECT p_battle_id, v_battle.opponent_club_id, cm.user_id
  FROM public.club_members cm
  WHERE cm.club_id = v_battle.opponent_club_id
    AND cm.user_id IS NOT NULL
  ON CONFLICT (battle_id, user_id) DO NOTHING;

  RETURN json_build_object('battle_id', p_battle_id, 'status', 'active');
END;
$func$;

REVOKE ALL ON FUNCTION public.accept_club_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_club_battle(uuid) TO authenticated;

-- ============================================================
-- 8. contribute_club_battle RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.contribute_club_battle(
  p_battle_id uuid,
  p_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_my_id uuid;
  v_my_club_id uuid;
  v_battle record;
BEGIN
  v_my_id := auth.uid();
  IF v_my_id IS NULL THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT * INTO v_battle
  FROM public.club_battles
  WHERE id = p_battle_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trận đấu không hoạt động!');
  END IF;

  -- Determine user's club in this battle
  SELECT club_id INTO v_my_club_id
  FROM public.club_battle_participants
  WHERE battle_id = p_battle_id AND user_id = v_my_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Bạn không tham gia trận này!');
  END IF;

  -- Update participant's contribution (cumulative)
  INSERT INTO public.club_battle_participants (battle_id, club_id, user_id, total_water, contributed_at)
  VALUES (p_battle_id, v_my_club_id, v_my_id, p_amount, now())
  ON CONFLICT (battle_id, user_id)
  DO UPDATE SET total_water = club_battle_participants.total_water + p_amount,
                contributed_at = now(),
                club_id = v_my_club_id;

  -- Sum totals for both clubs and check win condition
  DECLARE
    v_challenger_total integer;
    v_opponent_total integer;
  BEGIN
    SELECT COALESCE(SUM(total_water), 0) INTO v_challenger_total
    FROM public.club_battle_participants
    WHERE battle_id = p_battle_id AND club_id = v_battle.challenger_club_id;

    SELECT COALESCE(SUM(total_water), 0) INTO v_opponent_total
    FROM public.club_battle_participants
    WHERE battle_id = p_battle_id AND club_id = v_battle.opponent_club_id;

    -- Auto-resolve if target reached by either side
    IF v_challenger_total >= v_battle.target_ml THEN
      UPDATE public.club_battles
      SET status = 'completed', winner_club_id = v_battle.challenger_club_id, updated_at = now()
      WHERE id = p_battle_id;
      UPDATE public.clubs SET battle_wins = battle_wins + 1 WHERE id = v_battle.challenger_club_id;
      UPDATE public.clubs SET battle_losses = battle_losses + 1 WHERE id = v_battle.opponent_club_id;
    ELSIF v_opponent_total >= v_battle.target_ml THEN
      UPDATE public.club_battles
      SET status = 'completed', winner_club_id = v_battle.opponent_club_id, updated_at = now()
      WHERE id = p_battle_id;
      UPDATE public.clubs SET battle_wins = battle_wins + 1 WHERE id = v_battle.opponent_club_id;
      UPDATE public.clubs SET battle_losses = battle_losses + 1 WHERE id = v_battle.challenger_club_id;
    END IF;
  END;

  RETURN json_build_object('status', 'ok');
END;
$func$;

REVOKE ALL ON FUNCTION public.contribute_club_battle(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contribute_club_battle(uuid, integer) TO authenticated;

-- ============================================================
-- 9. resolve_club_battle RPC (auto-resolve timed-out battles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_club_battle(p_battle_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_battle record;
  v_challenger_total integer;
  v_opponent_total integer;
BEGIN
  SELECT * INTO v_battle
  FROM public.club_battles
  WHERE id = p_battle_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Trận đấu không hợp lệ hoặc đã kết thúc!');
  END IF;

  SELECT COALESCE(SUM(total_water), 0) INTO v_challenger_total
  FROM public.club_battle_participants
  WHERE battle_id = p_battle_id AND club_id = v_battle.challenger_club_id;

  SELECT COALESCE(SUM(total_water), 0) INTO v_opponent_total
  FROM public.club_battle_participants
  WHERE battle_id = p_battle_id AND club_id = v_battle.opponent_club_id;

  IF v_challenger_total >= v_opponent_total THEN
    UPDATE public.club_battles
    SET status = 'completed', winner_club_id = v_battle.challenger_club_id, updated_at = now()
    WHERE id = p_battle_id;
    UPDATE public.clubs SET battle_wins = battle_wins + 1 WHERE id = v_battle.challenger_club_id;
    UPDATE public.clubs SET battle_losses = battle_losses + 1 WHERE id = v_battle.opponent_club_id;
  ELSE
    UPDATE public.club_battles
    SET status = 'completed', winner_club_id = v_battle.opponent_club_id, updated_at = now()
    WHERE id = p_battle_id;
    UPDATE public.clubs SET battle_wins = battle_wins + 1 WHERE id = v_battle.opponent_club_id;
    UPDATE public.clubs SET battle_losses = battle_losses + 1 WHERE id = v_battle.challenger_club_id;
  END IF;

  RETURN json_build_object('status', 'completed');
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_club_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_club_battle(uuid) TO authenticated;

-- ============================================================
-- 10. get_club_battles RPC (fetch battles for a club)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_club_battles(p_club_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_result json;
BEGIN
  WITH active AS (
    SELECT cb.*,
      c1.name AS challenger_name,
      c2.name AS opponent_name,
      COALESCE(SUM(cbp.total_water) FILTER (WHERE cbp.club_id = cb.challenger_club_id), 0) AS challenger_total,
      COALESCE(SUM(cbp.total_water) FILTER (WHERE cbp.club_id = cb.opponent_club_id), 0) AS opponent_total
    FROM public.club_battles cb
    JOIN public.clubs c1 ON c1.id = cb.challenger_club_id
    JOIN public.clubs c2 ON c2.id = cb.opponent_club_id
    LEFT JOIN public.club_battle_participants cbp ON cbp.battle_id = cb.id
    WHERE (cb.challenger_club_id = p_club_id OR cb.opponent_club_id = p_club_id)
    GROUP BY cb.id, c1.name, c2.name
    ORDER BY cb.created_at DESC
    LIMIT 50
  )
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'challenger_club_id', a.challenger_club_id,
      'opponent_club_id', a.opponent_club_id,
      'status', a.status,
      'target_ml', a.target_ml,
      'deadline', a.deadline,
      'winner_club_id', a.winner_club_id,
      'stake_coins', a.stake_coins,
      'created_at', a.created_at,
      'updated_at', a.updated_at,
      'created_by', a.created_by,
      'challenger_name', a.challenger_name,
      'opponent_name', a.opponent_name,
      'challenger_total', a.challenger_total,
      'opponent_total', a.opponent_total
    )
  ) INTO v_result FROM active;

  RETURN COALESCE(v_result, '[]'::json);
END;
$func$;

REVOKE ALL ON FUNCTION public.get_club_battles(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_club_battles(uuid) TO authenticated;
