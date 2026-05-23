-- Add calendar privacy update policy and Server-side aggregation RPC

-- 1. Add is_calendar_synced column to public_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'public_profiles' 
      AND column_name = 'is_calendar_synced'
  ) THEN
    ALTER TABLE public.public_profiles ADD COLUMN is_calendar_synced BOOLEAN DEFAULT false;
  END IF;
END;
$$;

-- 2. Create UPDATE policy for public_profiles to allow users to update their own is_calendar_synced
DROP POLICY IF EXISTS public_profiles_update_own ON public.public_profiles;
CREATE POLICY public_profiles_update_own ON public.public_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

GRANT UPDATE ON public.public_profiles TO authenticated;

-- 3. Create Server-side aggregation RPC for fetchMonthlyWaterData
CREATE OR REPLACE FUNCTION public.get_monthly_water_aggregated(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  day DATE,
  total_amount INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: ensure authenticated user can only access their own data
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    wl.day,
    SUM(wl.amount)::integer AS total_amount
  FROM
    public.water_logs wl
  WHERE
    wl.user_id = p_user_id
    AND wl.day >= p_start_date
    AND wl.day <= p_end_date
  GROUP BY
    wl.day;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_monthly_water_aggregated(UUID, DATE, DATE) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_monthly_water_aggregated(UUID, DATE, DATE) TO authenticated;
