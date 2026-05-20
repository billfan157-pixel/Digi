-- Harden resolve_stale_battle RPC to prevent BOLA vulnerability
CREATE OR REPLACE FUNCTION public.resolve_stale_battle(battle_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $func$
DECLARE
  v_battle record;
  v_my_id uuid;
  v_my_ml int;
  v_opponent_ml int;
  v_status text;
  v_reward int := 0;
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

  -- BOLA Protection: Ensure the caller is either the challenger or the opponent
  IF v_battle.challenger_id <> v_my_id AND v_battle.opponent_id <> v_my_id THEN
    RETURN json_build_object('status', 'error', 'reward', 0);
  END IF;

  SELECT COALESCE(water_today, 0) INTO v_my_ml
  FROM public.public_profiles
  WHERE id = v_my_id;

  SELECT COALESCE(water_today, 0) INTO v_opponent_ml
  FROM public.public_profiles
  WHERE id = CASE
    WHEN v_battle.challenger_id = v_my_id THEN v_battle.opponent_id
    ELSE v_battle.challenger_id
  END;

  IF v_my_ml > v_opponent_ml THEN
    v_status := 'won';
    v_reward := v_battle.stake_coins;
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = v_my_id, updated_at = now()
    WHERE id = battle_id;
  ELSIF v_opponent_ml > v_my_ml THEN
    v_status := 'loss';
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = CASE
      WHEN v_battle.challenger_id = v_my_id THEN v_battle.opponent_id
      ELSE v_battle.challenger_id
    END, updated_at = now()
    WHERE id = battle_id;
  ELSE
    v_status := 'draw';
    v_reward := v_battle.stake_coins;
    UPDATE public.hydration_battles
    SET status = 'completed', winner_id = NULL, updated_at = now()
    WHERE id = battle_id;
  END IF;

  RETURN json_build_object('status', v_status, 'reward', v_reward);
END;
$func$;

REVOKE ALL ON FUNCTION public.resolve_stale_battle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_stale_battle(uuid) TO authenticated;
