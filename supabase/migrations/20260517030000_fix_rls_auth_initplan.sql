-- Migration: Fix Auth RLS InitPlan performance issue
-- Wrap auth.uid() calls in subqueries: (select auth.uid()) instead of auth.uid()
-- This prevents per-row re-evaluation of auth functions

-- ============================================================================
-- profiles
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_profiles_v1" ON public.profiles;
CREATE POLICY "delete_own_profiles_v1" ON public.profiles FOR DELETE TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO public USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO public USING ((SELECT auth.uid()) = id);

-- ============================================================================
-- ai_conversations
-- ============================================================================
DROP POLICY IF EXISTS "ai_conversations_delete_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_delete_own" ON public.ai_conversations FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "ai_conversations_select_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_select_own" ON public.ai_conversations FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "ai_conversations_update_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_update_own" ON public.ai_conversations FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "ai_conversations_insert_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_insert_own" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- ai_messages
-- ============================================================================
DROP POLICY IF EXISTS "ai_messages_delete_own" ON public.ai_messages;
CREATE POLICY "ai_messages_delete_own" ON public.ai_messages FOR DELETE TO authenticated USING (
  (SELECT auth.uid()) = user_id AND EXISTS (
    SELECT 1 FROM ai_conversations ac WHERE ac.id = ai_messages.conversation_id AND ac.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "ai_messages_select_own" ON public.ai_messages;
CREATE POLICY "ai_messages_select_own" ON public.ai_messages FOR SELECT TO authenticated USING (
  (SELECT auth.uid()) = user_id AND EXISTS (
    SELECT 1 FROM ai_conversations ac WHERE ac.id = ai_messages.conversation_id AND ac.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "ai_messages_update_own" ON public.ai_messages;
CREATE POLICY "ai_messages_update_own" ON public.ai_messages FOR UPDATE TO authenticated USING (
  (SELECT auth.uid()) = user_id AND EXISTS (
    SELECT 1 FROM ai_conversations ac WHERE ac.id = ai_messages.conversation_id AND ac.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "ai_messages_insert_own" ON public.ai_messages;
CREATE POLICY "ai_messages_insert_own" ON public.ai_messages FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) = user_id AND EXISTS (
    SELECT 1 FROM ai_conversations ac WHERE ac.id = ai_messages.conversation_id AND ac.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- ai_usage
-- ============================================================================
DROP POLICY IF EXISTS "ai_usage_self" ON public.ai_usage;
CREATE POLICY "ai_usage_self" ON public.ai_usage FOR ALL TO public USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_ai_usage_v1" ON public.ai_usage;
CREATE POLICY "delete_own_ai_usage_v1" ON public.ai_usage FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- ai_reports
-- ============================================================================
DROP POLICY IF EXISTS "ai_reports_self" ON public.ai_reports;
CREATE POLICY "ai_reports_self" ON public.ai_reports FOR ALL TO public USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_ai_reports_v1" ON public.ai_reports;
CREATE POLICY "delete_own_ai_reports_v1" ON public.ai_reports FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- active_buffs
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_buffs_v1" ON public.active_buffs;
CREATE POLICY "delete_own_buffs_v1" ON public.active_buffs FOR DELETE TO authenticated USING (target_user_id = (SELECT auth.uid()));

-- ============================================================================
-- club_daily_stats
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_club_stats_v1" ON public.club_daily_stats;
CREATE POLICY "delete_own_club_stats_v1" ON public.club_daily_stats FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- club_members
-- ============================================================================
DROP POLICY IF EXISTS "club_members_insert" ON public.club_members;
CREATE POLICY "club_members_insert" ON public.club_members FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_club_members_v1" ON public.club_members;
CREATE POLICY "delete_own_club_members_v1" ON public.club_members FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- club_messages
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.club_messages;
CREATE POLICY "Authenticated users can send messages" ON public.club_messages FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_club_msgs_v1" ON public.club_messages;
CREATE POLICY "delete_own_club_msgs_v1" ON public.club_messages FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- clubs
-- ============================================================================
DROP POLICY IF EXISTS "Owner can delete own club" ON public.clubs;
CREATE POLICY "Owner can delete own club" ON public.clubs FOR DELETE TO authenticated USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Owner can update own club" ON public.clubs;
CREATE POLICY "Owner can update own club" ON public.clubs FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can create clubs" ON public.clubs;
CREATE POLICY "Users can create clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = owner_id);

-- ============================================================================
-- device_integrations
-- ============================================================================
DROP POLICY IF EXISTS "devices_self" ON public.device_integrations;
CREATE POLICY "devices_self" ON public.device_integrations FOR ALL TO public USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_devices_v1" ON public.device_integrations;
CREATE POLICY "delete_own_devices_v1" ON public.device_integrations FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- direct_messages
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete own messages" ON public.direct_messages;
CREATE POLICY "Users can delete own messages" ON public.direct_messages FOR DELETE TO authenticated USING (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own messages" ON public.direct_messages;
CREATE POLICY "Users can update own messages" ON public.direct_messages FOR UPDATE TO authenticated USING (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their messages" ON public.direct_messages;
CREATE POLICY "Users can view their messages" ON public.direct_messages FOR SELECT TO authenticated USING (
  (SELECT auth.uid()) = sender_id OR (SELECT auth.uid()) = receiver_id
);

DROP POLICY IF EXISTS "delete_own_dm_v1" ON public.direct_messages;
CREATE POLICY "delete_own_dm_v1" ON public.direct_messages FOR DELETE TO authenticated USING (
  sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND sender_id = (SELECT auth.uid())
);

-- ============================================================================
-- friends
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete their own friends" ON public.friends;
CREATE POLICY "Users can delete their own friends" ON public.friends FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can see their own friends" ON public.friends;
CREATE POLICY "Users can see their own friends" ON public.friends FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_friends_v1" ON public.friends;
CREATE POLICY "delete_own_friends_v1" ON public.friends FOR DELETE TO authenticated USING (
  user_id = (SELECT auth.uid()) OR friend_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own friends" ON public.friends;
CREATE POLICY "Users can insert their own friends" ON public.friends FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- hydration_battles
-- ============================================================================
DROP POLICY IF EXISTS "hydration_battles_delete_participant" ON public.hydration_battles;
CREATE POLICY "hydration_battles_delete_participant" ON public.hydration_battles FOR DELETE TO authenticated USING (
  (SELECT auth.uid()) = challenger_id OR (SELECT auth.uid()) = opponent_id
);

DROP POLICY IF EXISTS "hydration_battles_select_participant" ON public.hydration_battles;
CREATE POLICY "hydration_battles_select_participant" ON public.hydration_battles FOR SELECT TO authenticated USING (
  (SELECT auth.uid()) = challenger_id OR (SELECT auth.uid()) = opponent_id
);

DROP POLICY IF EXISTS "hydration_battles_update_participant" ON public.hydration_battles;
CREATE POLICY "hydration_battles_update_participant" ON public.hydration_battles FOR UPDATE TO authenticated USING (
  (SELECT auth.uid()) = challenger_id OR (SELECT auth.uid()) = opponent_id
) WITH CHECK (
  (SELECT auth.uid()) = challenger_id OR (SELECT auth.uid()) = opponent_id
);

DROP POLICY IF EXISTS "hydration_battles_insert_challenger_only" ON public.hydration_battles;
CREATE POLICY "hydration_battles_insert_challenger_only" ON public.hydration_battles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = challenger_id);

-- ============================================================================
-- notifications
-- ============================================================================
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = recipient_id) WITH CHECK ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "delete_own_notifications_v1" ON public.notifications;
CREATE POLICY "delete_own_notifications_v1" ON public.notifications FOR DELETE TO authenticated USING (recipient_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = actor_id);

-- ============================================================================
-- quest_reward_logs
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_quest_logs_v1" ON public.quest_reward_logs;
CREATE POLICY "delete_own_quest_logs_v1" ON public.quest_reward_logs FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- saved_posts
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete own saved posts" ON public.saved_posts;
CREATE POLICY "Users can delete own saved posts" ON public.saved_posts FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own saved posts" ON public.saved_posts;
CREATE POLICY "Users can view own saved posts" ON public.saved_posts FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_saved_v1" ON public.saved_posts;
CREATE POLICY "delete_own_saved_v1" ON public.saved_posts FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own saved posts" ON public.saved_posts;
CREATE POLICY "Users can insert own saved posts" ON public.saved_posts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- social_comment_likes
-- ============================================================================
DROP POLICY IF EXISTS "Users can unlike comments" ON public.social_comment_likes;
CREATE POLICY "Users can unlike comments" ON public.social_comment_likes FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "delete_own_comment_likes_v1" ON public.social_comment_likes;
CREATE POLICY "delete_own_comment_likes_v1" ON public.social_comment_likes FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can like comments" ON public.social_comment_likes;
CREATE POLICY "Users can like comments" ON public.social_comment_likes FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())
);

-- ============================================================================
-- social_comments
-- ============================================================================
DROP POLICY IF EXISTS "Authors can delete comments" ON public.social_comments;
CREATE POLICY "Authors can delete comments" ON public.social_comments FOR DELETE TO authenticated USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authors can update comments" ON public.social_comments;
CREATE POLICY "Authors can update comments" ON public.social_comments FOR UPDATE TO authenticated USING (author_id = (SELECT auth.uid())) WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "delete_own_comments_v1" ON public.social_comments;
CREATE POLICY "delete_own_comments_v1" ON public.social_comments FOR DELETE TO authenticated USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.social_comments;
CREATE POLICY "Authenticated users can comment" ON public.social_comments FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND author_id = (SELECT auth.uid())
);

-- ============================================================================
-- social_follows
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_follows_v1" ON public.social_follows;
CREATE POLICY "delete_own_follows_v1" ON public.social_follows FOR DELETE TO authenticated USING (
  (SELECT auth.uid()) = follower_id OR (SELECT auth.uid()) = following_id
);

DROP POLICY IF EXISTS "social_follows_delete_own" ON public.social_follows;
CREATE POLICY "social_follows_delete_own" ON public.social_follows FOR DELETE TO authenticated USING ((SELECT auth.uid()) = follower_id);

DROP POLICY IF EXISTS "social_follows_insert_own" ON public.social_follows;
CREATE POLICY "social_follows_insert_own" ON public.social_follows FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = follower_id);

DROP POLICY IF EXISTS "social_follows_select_authenticated" ON public.social_follows;
CREATE POLICY "social_follows_select_authenticated" ON public.social_follows FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- social_posts
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_posts_v1" ON public.social_posts;
CREATE POLICY "delete_own_posts_v1" ON public.social_posts FOR DELETE TO authenticated USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "social_posts_delete_own" ON public.social_posts;
CREATE POLICY "social_posts_delete_own" ON public.social_posts FOR DELETE TO authenticated USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "social_posts_update_own" ON public.social_posts;
CREATE POLICY "social_posts_update_own" ON public.social_posts FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = author_id) WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Allow authenticated users insert" ON public.social_posts;
CREATE POLICY "Allow authenticated users insert" ON public.social_posts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "social_posts_insert_own" ON public.social_posts;
CREATE POLICY "social_posts_insert_own" ON public.social_posts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = author_id);

-- ============================================================================
-- social_post_likes
-- ============================================================================
DROP POLICY IF EXISTS "social_post_likes_delete_own" ON public.social_post_likes;
CREATE POLICY "social_post_likes_delete_own" ON public.social_post_likes FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "social_post_likes_insert_own" ON public.social_post_likes;
CREATE POLICY "social_post_likes_insert_own" ON public.social_post_likes FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- subscription_events
-- ============================================================================
DROP POLICY IF EXISTS "sub_events_self" ON public.subscription_events;
CREATE POLICY "sub_events_self" ON public.subscription_events FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- user_badges
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_badges_v1" ON public.user_badges;
CREATE POLICY "delete_own_badges_v1" ON public.user_badges FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_badges_self" ON public.user_badges;
CREATE POLICY "user_badges_self" ON public.user_badges FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- user_bottles
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_bottles_config_v1" ON public.user_bottles;
CREATE POLICY "delete_own_bottles_config_v1" ON public.user_bottles FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- user_challenges
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_challenges_v1" ON public.user_challenges;
CREATE POLICY "delete_own_challenges_v1" ON public.user_challenges FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_challenges_self" ON public.user_challenges;
CREATE POLICY "user_challenges_self" ON public.user_challenges FOR ALL TO public USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- user_purchases
-- ============================================================================
DROP POLICY IF EXISTS "Cho phép user xem kho đồ của mình" ON public.user_purchases;
CREATE POLICY "Cho phép user xem kho đồ của mình" ON public.user_purchases FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_purchases_v1" ON public.user_purchases;
CREATE POLICY "delete_own_purchases_v1" ON public.user_purchases FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- user_quests
-- ============================================================================
DROP POLICY IF EXISTS "delete_own_quests_v1" ON public.user_quests;
CREATE POLICY "delete_own_quests_v1" ON public.user_quests FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_quests_self" ON public.user_quests;
CREATE POLICY "user_quests_self" ON public.user_quests FOR ALL TO public USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_quests_select_own" ON public.user_quests;
CREATE POLICY "user_quests_select_own" ON public.user_quests FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_quests_update_own" ON public.user_quests;
CREATE POLICY "user_quests_update_own" ON public.user_quests FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_quests_insert_own" ON public.user_quests;
CREATE POLICY "user_quests_insert_own" ON public.user_quests FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
