-- Fix start_bot_duel returning 409 Conflict when user already has an active battle
-- Adds explicit active-battle guard, mode_type, and graceful error handling

CREATE OR REPLACE FUNCTION public.start_bot_duel(
  p_bot_id uuid,
  p_target_ml integer DEFAULT 2000,
  p_deadline timestamptz DEFAULT NULL
)
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
    RETURN json_build_object('error', 'Unauthorized', 'code', 'UNAUTHORIZED');
  END IF;

  -- Guard: one active battle per user
  IF EXISTS (
    SELECT 1 FROM public.hydration_battles
    WHERE (challenger_id = v_my_id OR opponent_id = v_my_id)
      AND status = 'active'
  ) THEN
    RETURN json_build_object('error', 'Already in an active battle', 'code', 'ALREADY_IN_BATTLE');
  END IF;

  -- Default deadline: end of today
  IF p_deadline IS NULL THEN
    v_deadline := date_trunc('day', now()) + interval '1 day' - interval '1 minute';
  ELSE
    v_deadline := p_deadline;
  END IF;

  INSERT INTO public.hydration_battles (
    challenger_id, opponent_id, stake_coins, target_ml, deadline,
    mode, mode_type, status
  )
  VALUES (
    v_my_id, p_bot_id, 0, p_target_ml, v_deadline,
    'Đấu với Bot', 'daily', 'active'
  )
  RETURNING id INTO v_battle_id;

  RETURN json_build_object('battle_id', v_battle_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'Battle conflict', 'code', 'CONFLICT');
END;
$func$;

REVOKE ALL ON FUNCTION public.start_bot_duel(uuid, integer, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_bot_duel(uuid, integer, timestamptz) TO authenticated;
