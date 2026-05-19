-- ── 1. DROP redundant RLS policies on profiles ──
-- Keep only one SELECT policy: profiles_select_own
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.profiles;

-- Keep only one INSERT policy: profiles_insert_own
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.profiles;

-- Keep only one UPDATE policy: profiles_update_own
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- ── 2. Add missing RLS policies on active_buffs ──
DROP POLICY IF EXISTS "active_buffs_select_own" ON public.active_buffs;
CREATE POLICY "active_buffs_select_own" ON public.active_buffs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = target_user_id);

DROP POLICY IF EXISTS "active_buffs_insert_own" ON public.active_buffs;
CREATE POLICY "active_buffs_insert_own" ON public.active_buffs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = target_user_id);

DROP POLICY IF EXISTS "active_buffs_update_own" ON public.active_buffs;
CREATE POLICY "active_buffs_update_own" ON public.active_buffs
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = target_user_id)
  WITH CHECK ((SELECT auth.uid()) = target_user_id);
