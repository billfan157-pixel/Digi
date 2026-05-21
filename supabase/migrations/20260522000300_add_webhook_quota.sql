-- Add daily_quota column to webhook_subscriptions
ALTER TABLE public.webhook_subscriptions ADD COLUMN IF NOT EXISTS daily_quota integer DEFAULT 200 NOT NULL;
