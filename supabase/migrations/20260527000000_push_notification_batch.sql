-- Batch push notification processing via pg_cron + pg_net

-- 1. Add push_sent tracking column to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS push_sent boolean DEFAULT false;

-- 2. Index for efficient batch queries
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent_created
  ON public.notifications (push_sent, created_at DESC)
  WHERE push_sent = false;

-- 3. Function triggered by pg_cron to fire the send-push-batch Edge Function
CREATE OR REPLACE FUNCTION public.trigger_push_batch()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE push_sent = false
    AND created_at > now() - interval '30 minutes';

  IF v_count = 0 THEN
    RETURN 0;
  END IF;

  PERFORM net.http_post(
    url := COALESCE(
      current_setting('app.settings.push_batch_url', true),
      'http://kong:8000/functions/v1/send-push-batch'
    ),
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-database-secret', COALESCE(current_setting('app.settings.webhook_secret', true), '')
    ),
    body := '{}'::jsonb
  );

  RETURN v_count;
END;
$func$;

REVOKE ALL ON FUNCTION public.trigger_push_batch() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_push_batch() TO service_role;

-- 4. Register cron job (every 5 minutes)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'push-notification-batch') THEN
    PERFORM cron.unschedule('push-notification-batch');
  END IF;
END $$;

SELECT cron.schedule(
  'push-notification-batch',
  '*/5 * * * *',
  $$SELECT public.trigger_push_batch();$$
);
