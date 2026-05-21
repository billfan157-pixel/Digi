-- Phase 1.1 / Fix M2-02: Add idempotency key to water_logs + atomic hydration RPC
-- Prevents duplicate hydration rewards/counters after retry or crash during offline sync

-- 1. Add client_event_id column to water_logs (partitioned table)
ALTER TABLE public.water_logs ADD COLUMN IF NOT EXISTS client_event_id text;

-- 2. Unique index for idempotency (must include partition key 'day' on partitioned tables)
CREATE UNIQUE INDEX IF NOT EXISTS idx_water_logs_client_event_id
  ON public.water_logs (user_id, client_event_id, day)
  WHERE client_event_id IS NOT NULL;

-- 3. Atomic hydration RPC: inserts water_log + processes hydration side effects in one transaction
--    Uses client_event_id for idempotency to prevent double-counting on retry/crash
CREATE OR REPLACE FUNCTION public.record_hydration_event(
  p_user_id uuid,
  p_amount_ml integer,
  p_temp_c numeric DEFAULT null::numeric,
  p_exercise_mins integer DEFAULT 0,
  p_is_fasting boolean DEFAULT false,
  p_client_event_id text DEFAULT null,
  p_name text DEFAULT 'Nuoc Loc',
  p_day date DEFAULT current_date,
  p_created_at timestamptz DEFAULT now()
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
BEGIN
  -- Auth check
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  IF p_amount_ml IS NULL OR p_amount_ml < 1 OR p_amount_ml > 2000 THEN
    RAISE EXCEPTION 'Invalid hydration amount' USING ERRCODE = '22023';
  END IF;

  -- Idempotency: check if client_event_id already exists
  IF p_client_event_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.water_logs
    WHERE user_id = p_user_id
      AND client_event_id = p_client_event_id
      AND day = p_day
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      -- Already processed — return current profile state without reapplying rewards
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

  -- Insert water log (exp = 0 initially; will be updated after hydration processing)
  INSERT INTO public.water_logs (
    id, user_id, amount, name, exp, day, created_at, client_event_id
  ) VALUES (
    gen_random_uuid(), p_user_id, p_amount_ml, p_name, 0, p_day, p_created_at, p_client_event_id
  )
  RETURNING id INTO v_log_id;

  -- Process hydration side effects: updates profiles, computes EXP/coins/level/WP atomically
  SELECT public.process_hydration_event(
    p_user_id, p_amount_ml, p_temp_c, p_exercise_mins, p_is_fasting
  ) INTO v_result;

  -- Update log with server-computed exp (guarantees water_logs.exp matches profile total_exp)
  UPDATE public.water_logs
  SET exp = (v_result->>'exp_gained')::int
  WHERE id = v_log_id;

  -- Merge log_id into result so client can swap tempId -> real ID
  RETURN v_result || jsonb_build_object('log_id', v_log_id);
END;
$$;

-- 4. Revoke direct execute from anon/public (same restriction as process_hydration_event)
REVOKE EXECUTE ON FUNCTION public.record_hydration_event(uuid, integer, numeric, integer, boolean, text, text, date, timestamptz)
  FROM anon, public;
