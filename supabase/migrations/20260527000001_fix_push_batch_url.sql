-- Add production URL as second fallback for push_batch cron trigger
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
      'https://plbwqjdrivyffrhpbmvm.supabase.co/functions/v1/send-push-batch',
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
