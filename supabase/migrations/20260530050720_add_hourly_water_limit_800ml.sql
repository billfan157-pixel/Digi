-- Migration: Add server-side hourly water intake limit (800ml/hour)
-- Guards against rapid water logging / anti-cheat

CREATE OR REPLACE FUNCTION public.record_hydration_event(
  p_user_id uuid,
  p_amount_ml integer,
  p_temp_c numeric DEFAULT null::numeric,
  p_exercise_mins integer DEFAULT 0,
  p_is_fasting boolean DEFAULT false,
  p_client_event_id text DEFAULT null,
  p_name text DEFAULT 'Nuoc Loc',
  p_day date DEFAULT current_date,
  p_created_at timestamptz DEFAULT now(),
  p_event_id bigint DEFAULT null,
  p_event_timestamp timestamptz DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_existing_id uuid;
  v_result jsonb;
  v_log_id uuid;
  v_last_event_id bigint;
  v_hourly_total integer;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_amount_ml IS NULL OR p_amount_ml < 1 OR p_amount_ml > 2000 THEN
    RAISE EXCEPTION 'Invalid hydration amount' USING ERRCODE = '22023';
  END IF;

  -- Anti-cheat: hourly limit 800ml (rolling 1-hour window)
  SELECT COALESCE(SUM(amount), 0)::int INTO v_hourly_total
  FROM public.water_logs
  WHERE user_id = p_user_id
    AND created_at >= (now() - interval '1 hour');

  IF v_hourly_total + p_amount_ml > 800 THEN
    RAISE EXCEPTION 'Hourly water limit exceeded: %ml recorded in the last hour. Max allowed: 800ml.', v_hourly_total
      USING ERRCODE = 'P0001',
            DETAIL = jsonb_build_object('hourly_total', v_hourly_total, 'limit', 800, 'requested', p_amount_ml);
  END IF;

  -- Lock profile row to prevent race conditions on BLE events
  SELECT last_event_id INTO v_last_event_id
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- BLE sequence counter check and rollover
  IF p_event_id IS NOT NULL THEN
    IF p_event_id <= v_last_event_id AND NOT (v_last_event_id > 4000000000 AND p_event_id < 1000000000) THEN
      RAISE EXCEPTION 'Duplicate or replayed hydration event detected' USING ERRCODE = '22023';
    END IF;

    -- Reject future-dated events (> 5 min ahead)
    IF p_event_timestamp IS NOT NULL AND p_event_timestamp > (now() + interval '5 minutes') THEN
      RAISE EXCEPTION 'Future-dated hydration event rejected' USING ERRCODE = '22023';
    END IF;

    UPDATE public.profiles SET last_event_id = p_event_id WHERE id = p_user_id;
  END IF;

  -- Idempotency: check client_event_id
  IF p_client_event_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.water_logs
    WHERE user_id = p_user_id
      AND client_event_id = p_client_event_id
      AND day = p_day
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'success', true,
        'idempotent', true,
        'log_id', v_existing_id,
        'water_today', water_today,
        'total_water', total_water,
        'wp', wp,
        'exp_gained', 0,
        'coins_gained', 0,
        'new_level', level,
        'rank_tier', rank_tier
      ) INTO v_result
      FROM public.profiles
      WHERE id = p_user_id;

      RETURN v_result;
    END IF;
  END IF;

  -- Insert water log
  INSERT INTO public.water_logs (
    id, user_id, amount, name, exp, day, created_at, client_event_id
  ) VALUES (
    gen_random_uuid(), p_user_id, p_amount_ml, p_name, 0, p_day, COALESCE(p_event_timestamp, p_created_at), p_client_event_id
  )
  RETURNING id INTO v_log_id;

  -- Process hydration side effects
  SELECT public.process_hydration_event(
    p_user_id, p_amount_ml, p_temp_c, p_exercise_mins, p_is_fasting
  ) INTO v_result;

  -- Update log with computed exp
  UPDATE public.water_logs
  SET exp = (v_result->>'exp_gained')::int
  WHERE id = v_log_id;

  RETURN v_result || jsonb_build_object('log_id', v_log_id);
END;
$$;

-- Preserve execute grants
GRANT EXECUTE ON FUNCTION public.record_hydration_event(
  uuid, integer, numeric, integer, boolean, text, text, date, timestamptz, bigint, timestamptz
) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_hydration_event(
  uuid, integer, numeric, integer, boolean, text, text, date, timestamptz, bigint, timestamptz
) FROM anon, public;
