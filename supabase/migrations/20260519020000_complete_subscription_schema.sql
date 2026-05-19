-- Complete subscription schema for Stripe integration
-- Adds missing columns and enables event logging

-- Add stripe_price_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ;

-- subscription_events already exists with:
-- id BIGSERIAL, user_id UUID, event_type TEXT, tier TEXT, amount_vnd INT, created_at TIMESTAMPTZ
-- Ensure proper indexes
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON public.subscription_events(user_id);

-- Allow users to INSERT their own events (for client-side logging)
DROP POLICY IF EXISTS "sub_events_insert" ON public.subscription_events;
CREATE POLICY "sub_events_insert" ON public.subscription_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also allow DELETE own events (cleanup)
DROP POLICY IF EXISTS "sub_events_delete" ON public.subscription_events;
CREATE POLICY "sub_events_delete" ON public.subscription_events
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
