-- Migration: Supabase Security Compliance — search_path, function privileges, and indexes
-- Fixes search_path on remaining SECURITY DEFINER functions that still use 'pg_catalog, public'
-- Revokes anon/public execute on client-callable functions that were missed by prior migrations
-- Adds performance indexes for AI tables

-- ============================================================
-- 1. Fix search_path on SECURITY DEFINER functions
--    (set to 'public' only, removing 'pg_catalog' prefix)
-- ============================================================

ALTER FUNCTION public.check_ai_usage(text) SET search_path = public;
ALTER FUNCTION public.consume_ai_usage(text) SET search_path = public;
ALTER FUNCTION public.delete_account_and_auth() SET search_path = public;

-- ============================================================
-- 2. Revoke anon/public execute on client-callable RPCs
--    These already have search_path set (by prior migration)
--    but never had execute privileges restricted.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_conversation_messages(UUID, INT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(UUID, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_conversations() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.send_direct_message(UUID, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.send_direct_message(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_messages_read(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.join_group_challenge(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_group_challenge(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_group_challenge_leaderboard(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_group_challenge_leaderboard(UUID) TO authenticated;

-- ============================================================
-- 3. Add performance indexes for AI tables
--    (Replaces composite indexes that were dropped in prior migration
--     with targeted single-column indexes for user_id lookups)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON public.ai_messages(user_id);
