-- Add missing subscription columns referenced by consume_ai_usage RPC
-- These columns are required for the AI rate limiting function to determine premium status

alter table public.profiles
  add column if not exists subscription_tier text,
  add column if not exists subscription_end timestamptz;

-- Set default values for existing rows
update public.profiles
  set subscription_tier = 'free'
  where subscription_tier is null;