-- DigiWell DBA Performance Audit: Top 10 EXPLAIN ANALYZE Queries
-- Copy and run these in the Supabase SQL Editor to analyze execution plans and indexes.

-- 1. Hydration events processing (process_hydration_event RPC check)
-- Verifies performance of inserting logs and updating streaks.
EXPLAIN ANALYZE
SELECT * FROM public.water_logs 
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
  AND day = CURRENT_DATE;

-- 2. Fetching current user's water logs (fetchWaterLogs)
EXPLAIN ANALYZE
SELECT id, user_id, amount, name, exp, day, created_at 
FROM public.water_logs 
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
  AND day = CURRENT_DATE 
ORDER BY created_at DESC;

-- 3. Fetching user profiles (fetchProfileById)
EXPLAIN ANALYZE
SELECT * FROM public.profiles 
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 4. Social Feed Query (useFeed)
-- Targets index performance on posts feed.
EXPLAIN ANALYZE
SELECT * FROM public.social_posts 
WHERE author_id = '00000000-0000-0000-0000-000000000000'::uuid 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Social Follows stats (get_profile_stats subselects)
-- Analyzes counts of followers and posts.
EXPLAIN ANALYZE
SELECT 
  (SELECT COUNT(*)::int FROM public.social_follows WHERE following_id = '00000000-0000-0000-0000-000000000000'::uuid) as follower_count,
  (SELECT COUNT(*)::int FROM public.social_follows WHERE follower_id = '00000000-0000-0000-0000-000000000000'::uuid) as following_count,
  (SELECT COUNT(*)::int FROM public.social_posts WHERE author_id = '00000000-0000-0000-0000-000000000000'::uuid) as post_count;

-- 6. AI Conversation History
EXPLAIN ANALYZE
SELECT * FROM public.ai_messages 
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
ORDER BY created_at DESC 
LIMIT 20;

-- 7. Analytics Event Log (analytics_events index test)
EXPLAIN ANALYZE
SELECT * FROM public.analytics_events 
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
ORDER BY created_at DESC 
LIMIT 50;

-- 8. Fetch user clubs details
EXPLAIN ANALYZE
SELECT club_id FROM public.club_members 
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- 9. Active daily quests (assign_daily_quests validation)
EXPLAIN ANALYZE
SELECT uq.quest_id 
FROM public.user_quests uq
JOIN public.quests q ON uq.quest_id = q.id
WHERE uq.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND q.quest_type = 'daily'
  AND uq.assigned_date = CURRENT_DATE;

-- 10. Social Comments on post
EXPLAIN ANALYZE
SELECT * FROM public.social_comments 
WHERE post_id = '00000000-0000-0000-0000-000000000000'::uuid 
ORDER BY created_at DESC;
