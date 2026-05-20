-- Sprint 16: Security/Compliance
-- 1. delete_all_user_data_secure: data-only deletion RPC (was missing, breaking Settings > Xóa dữ liệu)
-- 2. Fix increment_club_member_intake: add auth.uid() check (bypass vulnerability)
-- 3. Audit logging: functions to log deletion/export events

-- ============================================================
-- PART 1: delete_all_user_data_secure
-- Called from useDeleteAccount.ts when user chooses "Xóa dữ liệu"
-- Deletes ALL user-generated content but keeps auth account + profile
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_all_user_data_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.social_comment_likes WHERE user_id = v_user_id;
  DELETE FROM public.social_comments WHERE author_id = v_user_id;
  DELETE FROM public.social_post_likes WHERE user_id = v_user_id;
  DELETE FROM public.post_cheers WHERE user_id = v_user_id;
  DELETE FROM public.saved_posts WHERE user_id = v_user_id;
  DELETE FROM public.social_follows WHERE follower_id = v_user_id OR following_id = v_user_id;

  DELETE FROM public.ai_messages WHERE user_id = v_user_id;
  DELETE FROM public.ai_conversations WHERE user_id = v_user_id;
  DELETE FROM public.ai_reports WHERE user_id = v_user_id;
  DELETE FROM public.ai_usage WHERE user_id = v_user_id;

  DELETE FROM public.quest_reward_logs WHERE user_id = v_user_id;
  DELETE FROM public.user_quests WHERE user_id = v_user_id;
  DELETE FROM public.user_challenges WHERE user_id = v_user_id;

  DELETE FROM public.hydration_battles
    WHERE challenger_id = v_user_id OR opponent_id = v_user_id OR winner_id = v_user_id;

  DELETE FROM public.club_messages WHERE user_id = v_user_id;
  DELETE FROM public.club_activity WHERE user_id = v_user_id;
  DELETE FROM public.club_daily_stats WHERE user_id = v_user_id;
  DELETE FROM public.club_members WHERE user_id = v_user_id;
  DELETE FROM public.club_challenges WHERE created_by = v_user_id;

  DELETE FROM public.notifications WHERE recipient_id = v_user_id OR actor_id = v_user_id;
  DELETE FROM public.nudges WHERE from_user_id = v_user_id OR to_user_id = v_user_id;
  DELETE FROM public.direct_messages WHERE sender_id = v_user_id OR receiver_id = v_user_id;
  DELETE FROM public.friends WHERE user_id = v_user_id OR friend_id = v_user_id;

  DELETE FROM public.device_integrations WHERE user_id = v_user_id;
  DELETE FROM public.live_snaps WHERE user_id = v_user_id;
  DELETE FROM public.reports WHERE reporter_id = v_user_id;
  DELETE FROM public.analytics_events WHERE user_id = v_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.widget_cache WHERE user_id = v_user_id;
  DELETE FROM public.widget_partners WHERE user_id = v_user_id OR partner_id = v_user_id;

  DELETE FROM public.user_bottles WHERE user_id = v_user_id;
  DELETE FROM public.user_purchases WHERE user_id = v_user_id;
  DELETE FROM public.user_badges WHERE user_id = v_user_id;
  DELETE FROM public.subscription_events WHERE user_id = v_user_id;
  DELETE FROM public.active_buffs WHERE target_user_id = v_user_id;

  DELETE FROM public.water_logs WHERE user_id = v_user_id;
  DELETE FROM public.social_posts WHERE author_id = v_user_id;

  -- Log the deletion
  INSERT INTO public.audit_logs (user_id, event_type, event_data)
  VALUES (v_user_id, 'user_data_deleted', jsonb_build_object('type', 'data-only', 'timestamp', now()::text));
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_all_user_data_secure() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_all_user_data_secure() TO authenticated;

COMMENT ON FUNCTION public.delete_all_user_data_secure() IS 'Xóa toàn bộ dữ liệu người dùng (posts, logs, quests, battles, clubs...) nhưng giữ tài khoản và profile.';

-- ============================================================
-- PART 2: Fix increment_club_member_intake — add auth.uid() check
-- Previously vulnerable: SECURITY DEFINER without owner verification
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_club_member_intake(
  p_user_id uuid,
  p_club_id uuid,
  p_amount_to_add integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING HINT = 'p_user_id must match authenticated user';
  END IF;
  PERFORM public.increment_club_water(p_club_id, p_user_id, p_amount_to_add);
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_club_member_intake(uuid, uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.increment_club_member_intake(uuid, uuid, integer) TO authenticated, service_role;

-- ============================================================
-- PART 3: Audit logging functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (user_id, event_type, event_data)
  VALUES (auth.uid(), p_event_type, p_event_data);
END;
$function$;

REVOKE ALL ON FUNCTION public.log_audit_event(text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.log_audit_event(text, jsonb) IS 'Ghi log sự kiện bảo mật (xóa dữ liệu, export, thay đổi nhạy cảm).';
