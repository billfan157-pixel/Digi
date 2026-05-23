-- Create hardware_waitlist table and setup RLS policies

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.hardware_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tier_interest TEXT NOT NULL CHECK (tier_interest IN ('standard', 'pro_kit')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'purchased', 'cancelled')),
  CONSTRAINT hardware_waitlist_user_id_key UNIQUE (user_id)
);

-- 2. Enable RLS
ALTER TABLE public.hardware_waitlist ENABLE ROW LEVEL SECURITY;

-- 3. Setup RLS policies
DROP POLICY IF EXISTS hardware_waitlist_select_own ON public.hardware_waitlist;
CREATE POLICY hardware_waitlist_select_own ON public.hardware_waitlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS hardware_waitlist_insert_own ON public.hardware_waitlist;
CREATE POLICY hardware_waitlist_insert_own ON public.hardware_waitlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS hardware_waitlist_update_own ON public.hardware_waitlist;
CREATE POLICY hardware_waitlist_update_own ON public.hardware_waitlist
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS hardware_waitlist_delete_own ON public.hardware_waitlist;
CREATE POLICY hardware_waitlist_delete_own ON public.hardware_waitlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS hardware_waitlist_admin ON public.hardware_waitlist;
CREATE POLICY hardware_waitlist_admin ON public.hardware_waitlist
  FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hardware_waitlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hardware_waitlist TO service_role;

-- 5. Add secure RPC to get user's waitlist rank
CREATE OR REPLACE FUNCTION public.get_waitlist_rank()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_created_at timestamptz;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select created_at into v_created_at
  from public.hardware_waitlist
  where user_id = v_user_id;

  if v_created_at is null then
    return null;
  end if;

  select count(*) into v_count
  from public.hardware_waitlist
  where created_at < v_created_at or (created_at = v_created_at and id <= (select id from public.hardware_waitlist where user_id = v_user_id));

  return v_count;
end;
$function$;

REVOKE ALL ON FUNCTION public.get_waitlist_rank() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_waitlist_rank() TO authenticated;

