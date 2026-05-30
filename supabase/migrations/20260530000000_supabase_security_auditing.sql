-- Migration: Supabase Security Auditing and Index Optimizations
-- Action: Apply RLS to partitions/internal tables, set search_path on functions, drop duplicate indexes, index unindexed foreign keys, and secure storage buckets.

-- ============================================================
-- 1. Enable RLS on webhook_deliveries (partitioned) & dead_letter_queue
-- ============================================================
ALTER TABLE IF EXISTS public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_deliveries_legacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_deliveries_y2026m06 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_deliveries_select_own" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_select_own" ON public.webhook_deliveries
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.webhook_subscriptions s 
            WHERE s.id = subscription_id AND s.user_id = auth.uid()
        )
    );

ALTER TABLE IF EXISTS public.dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Secure storage buckets from public listing
-- ============================================================
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "shop_items_select_public" ON storage.objects;
CREATE POLICY "shop_items_select_public"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'shop-items');

-- ============================================================
-- 3. Set search_path and privileges on SECURITY DEFINER functions
-- ============================================================
ALTER FUNCTION public.mark_reminder_sent(UUID) SET search_path = public;
ALTER FUNCTION public.mark_reminder_responded(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.update_story_reaction_counts(UUID) SET search_path = public;
ALTER FUNCTION public.trigger_update_story_reaction_counts() SET search_path = public;
ALTER FUNCTION public.toggle_story_reaction(UUID, VARCHAR) SET search_path = public;
ALTER FUNCTION public.get_story_reactions(UUID) SET search_path = public;
ALTER FUNCTION public.get_or_create_conversation(UUID) SET search_path = public;
ALTER FUNCTION public.get_conversation_messages(UUID, INT) SET search_path = public;
ALTER FUNCTION public.get_user_conversations() SET search_path = public;
ALTER FUNCTION public.send_direct_message(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.mark_messages_read(UUID) SET search_path = public;
ALTER FUNCTION public.join_group_challenge(UUID) SET search_path = public;
ALTER FUNCTION public.get_group_challenge_leaderboard(UUID) SET search_path = public;

-- Revoke public/anon execution and grant to authenticated where client-callable
REVOKE EXECUTE ON FUNCTION public.mark_reminder_sent(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_reminder_sent(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_reminder_responded(UUID, INTEGER) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_reminder_responded(UUID, INTEGER) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_story_reaction_counts(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.trigger_update_story_reaction_counts() FROM anon, public;

-- ============================================================
-- 4. Drop duplicate and redundant indexes
-- ============================================================
DROP INDEX IF EXISTS public.idx_hydration_battles_challenger;
DROP INDEX IF EXISTS public.idx_hydration_battles_opponent;
DROP INDEX IF EXISTS public.ai_conversations_user_created_idx;
DROP INDEX IF EXISTS public.ai_messages_user_created_idx;

-- ============================================================
-- 5. Index unindexed Foreign Keys
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_purchases_item_id ON public.user_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_public_api_keys_user_id ON public.public_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_user_id ON public.webhook_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_club_battles_winner_club_id ON public.club_battles(winner_club_id);
CREATE INDEX IF NOT EXISTS idx_club_battle_participants_battle_id ON public.club_battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_club_battle_participants_club_id ON public.club_battle_participants(club_id);
CREATE INDEX IF NOT EXISTS idx_club_battle_participants_user_id ON public.club_battle_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_duel_achievements_user_id ON public.duel_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON public.story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_challenge_participants_challenge_id ON public.group_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_group_challenge_participants_user_id ON public.group_challenge_participants(user_id);
