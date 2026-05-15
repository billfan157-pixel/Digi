-- ============================================================
-- Migration: Create disband_club RPC + Performance Indexes
-- Date: 2026-05-14
-- ============================================================

-- 1. RPC: disband_club — atomic club deletion with ownership check
CREATE OR REPLACE FUNCTION public.disband_club(p_club_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Verify ownership
  SELECT owner_id INTO v_owner_id FROM clubs WHERE id = p_club_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Club not found';
  END IF;
  
  IF auth.uid() IS NULL OR auth.uid() <> v_owner_id THEN
    RAISE EXCEPTION 'Only club owner can disband the club';
  END IF;

  -- Delete all dependent records in a single transaction
  DELETE FROM club_activity WHERE club_id = p_club_id;
  DELETE FROM club_messages WHERE club_id = p_club_id;
  DELETE FROM club_daily_stats WHERE club_id = p_club_id;
  DELETE FROM club_members WHERE club_id = p_club_id;
  DELETE FROM clubs WHERE id = p_club_id;
END;
$$;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_water_logs_user_day
  ON public.water_logs (user_id, day);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_created
  ON public.water_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_battles_challenger
  ON public.hydration_battles (challenger_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_battles_opponent
  ON public.hydration_battles (opponent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_club_members_club_user
  ON public.club_members (club_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_quests_user_status
  ON public.user_quests (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status
  ON public.user_challenges (user_id, status);

-- 3. RLS for RPC: ensure the function can bypass RLS on club tables
-- (SECURITY DEFINER already handles this)