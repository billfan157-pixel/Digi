-- Add expires_at column to user_quests (referenced by assign_daily_quests RPC)
ALTER TABLE public.user_quests ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Backfill: set expires_at for daily quests (end of today)
UPDATE public.user_quests SET expires_at = (CURRENT_DATE + time '23:59:59' AT TIME ZONE 'UTC')::timestamptz WHERE expires_at IS NULL;
