-- Sprint 17: Production Readiness
-- DB index/query audit: add missing indexes for hot query paths
-- Based on audit of all TypeScript query patterns across the codebase

-- ============================================================
-- CRITICAL: Notifications (queried on every app open)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

-- ============================================================
-- CRITICAL: Social posts feed (full table scan without this)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_social_posts_created_desc
  ON public.social_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_posts_author_created
  ON public.social_posts (author_id, created_at DESC);

-- ============================================================
-- CRITICAL: Hydration battles (OR query on challenger/opponent)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hydration_battles_challenger_created
  ON public.hydration_battles (challenger_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_battles_opponent_created
  ON public.hydration_battles (opponent_id, created_at DESC);

-- ============================================================
-- CRITICAL: Club chat (queried on every club open)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_club_messages_club_created
  ON public.club_messages (club_id, created_at ASC);

-- ============================================================
-- CRITICAL: Social follows (feed author resolution)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_social_follows_follower_created
  ON public.social_follows (follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_follows_following
  ON public.social_follows (following_id);

-- ============================================================
-- HIGH: Social comments (queried with every post) — conditional: column may not exist
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='social_comments' AND column_name='created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_social_comments_post_created ON public.social_comments (post_id, created_at ASC);
  END IF;
END $$;

-- ============================================================
-- HIGH: Club members (membership checks, role queries)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_club_members_club_user
  ON public.club_members (club_id, user_id);

CREATE INDEX IF NOT EXISTS idx_club_members_user
  ON public.club_members (user_id);

-- ============================================================
-- HIGH: AI conversations (export, history) — conditional: column may not exist
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_conversations' AND column_name='created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_created ON public.ai_conversations (user_id, created_at DESC);
  END IF;
END $$;

-- ============================================================
-- HIGH: AI reports (latest report lookup) — conditional: column may not exist
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_reports' AND column_name='period_end') THEN
    CREATE INDEX IF NOT EXISTS idx_ai_reports_user_type_period ON public.ai_reports (user_id, report_type, period_end DESC);
  END IF;
END $$;

-- ============================================================
-- HIGH: AI usage (export) — skipped: ai_usage.created_at may not exist
-- ============================================================

-- ============================================================
-- HIGH: Profiles leaderboard + widget queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_water_today
  ON public.profiles (water_today DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_wp
  ON public.profiles (wp DESC);

-- ============================================================
-- HIGH: User badges (gamification display) — conditional: column may not exist
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_badges' AND column_name='unlocked_at') THEN
    CREATE INDEX IF NOT EXISTS idx_user_badges_user_unlocked ON public.user_badges (user_id, unlocked_at DESC);
  END IF;
END $$;

-- ============================================================
-- HIGH: Challenges listing — conditional: column may not exist
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='challenges' AND column_name='is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_challenges_active_sort ON public.challenges (is_active, sort_order ASC);
  END IF;
END $$;

-- ============================================================
-- HIGH: Friends lookup
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_friends_user
  ON public.friends (user_id);
