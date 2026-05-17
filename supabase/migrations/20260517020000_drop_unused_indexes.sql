-- Migration: Drop 33 unused indexes
-- These indexes have idx_scan = 0, wasting disk space and adding write overhead

-- AI tables
DROP INDEX IF EXISTS public.ai_conversations_user_created_idx;
DROP INDEX IF EXISTS public.ai_messages_conversation_created_idx;
DROP INDEX IF EXISTS public.ai_messages_user_created_idx;

-- Challenges
DROP INDEX IF EXISTS public.idx_challenges_active_category;
DROP INDEX IF EXISTS public.idx_challenges_dates;

-- Club tables (all club features unused - 0 rows)
DROP INDEX IF EXISTS public.idx_club_activity_user_id;
DROP INDEX IF EXISTS public.idx_club_admin_logs_club_id;
DROP INDEX IF EXISTS public.idx_club_challenges_created_by;
DROP INDEX IF EXISTS public.idx_club_daily_stats_user_id;
DROP INDEX IF EXISTS public.idx_club_members_club_user;
DROP INDEX IF EXISTS public.idx_club_messages_club_id;
DROP INDEX IF EXISTS public.idx_club_messages_user_id;

-- Direct messages
DROP INDEX IF EXISTS public.idx_dm_sender;

-- Friends
DROP INDEX IF EXISTS public.idx_friends_friend_id;

-- Hydration battles (duplicate indexes)
DROP INDEX IF EXISTS public.idx_hydration_battles_challenger;
DROP INDEX IF EXISTS public.idx_hydration_battles_opponent;

-- Notifications (unused composite indexes)
DROP INDEX IF EXISTS public.idx_notifications_actor_id;
DROP INDEX IF EXISTS public.idx_notifications_recipient_unread;
DROP INDEX IF EXISTS public.idx_notifications_reference;

-- Public profiles
DROP INDEX IF EXISTS public.idx_profiles_nickname_trgm;

-- Reports
DROP INDEX IF EXISTS public.idx_reports_reporter_id;

-- Social posts
DROP INDEX IF EXISTS public.idx_social_posts_event_type;
DROP INDEX IF EXISTS public.idx_social_posts_squad_priority;
DROP INDEX IF EXISTS public.social_posts_story_idx;

-- Subscription events
DROP INDEX IF EXISTS public.idx_subscription_events_user_id;

-- User tables
DROP INDEX IF EXISTS public.idx_unique_user_level_quest;
DROP INDEX IF EXISTS public.idx_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_user_bottles_bottle_id;
DROP INDEX IF EXISTS public.idx_user_bottles_user_id;
DROP INDEX IF EXISTS public.idx_user_challenges_challenge_id;
DROP INDEX IF EXISTS public.idx_user_purchases_item_id;

-- Water logs (old composite, replaced by idx_water_logs_user_day)
DROP INDEX IF EXISTS public.idx_water_logs_user_created;

-- Widget cache
DROP INDEX IF EXISTS public.idx_widget_cache_user;
