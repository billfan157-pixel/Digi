-- Add assigned_date column to user_quests (referenced by assign_daily_quests RPC)
ALTER TABLE public.user_quests ADD COLUMN IF NOT EXISTS assigned_date date;

-- Backfill: copy reset_date into assigned_date for existing daily quests
UPDATE public.user_quests SET assigned_date = reset_date WHERE assigned_date IS NULL;
