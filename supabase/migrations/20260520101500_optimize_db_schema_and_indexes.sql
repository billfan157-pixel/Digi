-- Optimize DB schema, refactor RPCs and add missing indexes
-- (Implementation of 1.2 B, C, D in Strategy plan)

-- 1. Refactor get_profile_stats to use a single query with subselects
CREATE OR REPLACE FUNCTION public.get_profile_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'follower_count', (SELECT COUNT(*)::int FROM public.social_follows WHERE following_id = p_user_id),
      'following_count', (SELECT COUNT(*)::int FROM public.social_follows WHERE follower_id = p_user_id),
      'post_count', (SELECT COUNT(*)::int FROM public.social_posts WHERE author_id = p_user_id)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_profile_stats(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO authenticated;


-- 2. Refactor assign_daily_quests to randomly assign only 3 daily quests
CREATE OR REPLACE FUNCTION public.assign_daily_quests(p_user_id uuid)
RETURNS TABLE(assigned_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_daily_quests_today_count integer;
  v_newly_assigned_count integer := 0;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select count(*)
  into v_daily_quests_today_count
  from public.user_quests uq
  join public.quests q on uq.quest_id = q.id
  where uq.user_id = p_user_id
    and q.quest_type = 'daily'
    and uq.assigned_date = current_date;

  if v_daily_quests_today_count > 0 then
    return query select 0, 'Nhiệm vụ hàng ngày đã được giao hôm nay.'::text;
    return;
  end if;

  insert into public.user_quests (user_id, quest_id, reset_date, expires_at, assigned_date)
  select
    p_user_id,
    q.id,
    current_date,
    current_date + time '23:59:59',
    current_date
  from public.quests q
  where q.quest_type = 'daily'
  order by random()
  limit 3
  on conflict (user_id, quest_id, reset_date) do nothing;

  get diagnostics v_newly_assigned_count = row_count;

  return query select v_newly_assigned_count, ('Đã gán thành công ' || v_newly_assigned_count || ' nhiệm vụ.')::text;
end;
$$;

REVOKE ALL ON FUNCTION public.assign_daily_quests(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.assign_daily_quests(uuid) TO authenticated, service_role;


-- 3. Optimize delete_all_user_data_secure by removing redundant deletes (cascade covers ai_messages)
CREATE OR REPLACE FUNCTION public.delete_all_user_data_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Delete conversations (cascades to ai_messages automatically)
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
$$;

REVOKE ALL ON FUNCTION public.delete_all_user_data_secure() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_all_user_data_secure() TO authenticated;


-- 4. Create missing indexes (1.2.D)
CREATE INDEX IF NOT EXISTS idx_social_posts_author_created
  ON public.social_posts (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_user_created
  ON public.ai_messages (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
  ON public.analytics_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
