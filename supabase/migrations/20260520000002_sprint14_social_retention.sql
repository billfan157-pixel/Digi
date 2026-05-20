-- Sprint 14: Social Retention
-- 
-- 1. RLS policies for club_activity (club members only)
-- 2. RLS policies for club_challenges write (owner/deputy)
-- 3. RLS policies for reports table
-- 4. Index club_activity(club_id, created_at)
-- 5. decline_battle RPC

-- ============================================================================
-- 1. club_activity RLS
-- ============================================================================
DROP POLICY IF EXISTS "club_activity_select_members" ON public.club_activity;
CREATE POLICY "club_activity_select_members"
  ON public.club_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_activity.club_id
        AND cm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "club_activity_insert_members" ON public.club_activity;
CREATE POLICY "club_activity_insert_members"
  ON public.club_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_activity.club_id
        AND cm.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 2. club_challenges write RLS (owner/deputy)
-- ============================================================================
DROP POLICY IF EXISTS "club_challenges_insert_owner_deputy" ON public.club_challenges;
CREATE POLICY "club_challenges_insert_owner_deputy"
  ON public.club_challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_challenges.club_id
        AND cm.user_id = (SELECT auth.uid())
        AND cm.role IN ('owner', 'deputy')
    )
  );

DROP POLICY IF EXISTS "club_challenges_update_owner_deputy" ON public.club_challenges;
CREATE POLICY "club_challenges_update_owner_deputy"
  ON public.club_challenges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_challenges.club_id
        AND cm.user_id = (SELECT auth.uid())
        AND cm.role IN ('owner', 'deputy')
    )
  );

DROP POLICY IF EXISTS "club_challenges_delete_owner_deputy" ON public.club_challenges;
CREATE POLICY "club_challenges_delete_owner_deputy"
  ON public.club_challenges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_challenges.club_id
        AND cm.user_id = (SELECT auth.uid())
        AND cm.role IN ('owner', 'deputy')
    )
  );

-- ============================================================================
-- 3. reports RLS
-- ============================================================================
DROP POLICY IF EXISTS "reports_insert_authenticated" ON public.reports;
CREATE POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

-- ============================================================================
-- 4. Index for club_activity queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_club_activity_club_created
  ON public.club_activity (club_id, created_at DESC);

-- ============================================================================
-- 5. decline_battle RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.decline_battle(p_user_id uuid, p_battle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_opponent_id uuid;
BEGIN
  IF (SELECT auth.uid()) <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT opponent_id INTO v_opponent_id
  FROM public.hydration_battles
  WHERE id = p_battle_id AND status = 'pending'
  FOR UPDATE;

  IF v_opponent_id IS NULL THEN
    RAISE EXCEPTION 'Battle not found or already resolved';
  END IF;

  IF v_opponent_id <> p_user_id THEN
    RAISE EXCEPTION 'You are not the opponent for this battle';
  END IF;

  UPDATE public.hydration_battles
  SET status = 'declined', updated_at = now()
  WHERE id = p_battle_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decline_battle TO authenticated;
