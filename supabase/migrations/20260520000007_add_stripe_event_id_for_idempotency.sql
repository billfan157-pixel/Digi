-- Sprint 1.2: Add stripe_event_id for idempotency in stripe-webhook
-- Prevents duplicate event processing when Stripe retries webhooks

ALTER TABLE public.subscription_events
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_id
  ON public.subscription_events(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
