-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value text NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Revoke all access from public, anon, and authenticated roles
REVOKE ALL ON TABLE public.app_settings FROM public, anon, authenticated;

-- Grant access to service_role and postgres
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_settings TO postgres;

-- Recreate trigger function with fallback to query app_settings table first
CREATE OR REPLACE FUNCTION public.on_water_log_change_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_payload jsonb;
  v_event_type text;
  v_user_id uuid;
  v_webhook_url text;
  v_webhook_secret text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'water_log.created';
    v_user_id := NEW.user_id;
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'amount', NEW.amount,
      'name', NEW.name,
      'exp', NEW.exp,
      'day', NEW.day,
      'created_at', NEW.created_at,
      'drink_type', NEW.drink_type
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := 'water_log.updated';
    v_user_id := NEW.user_id;
    v_payload := jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'amount', NEW.amount,
      'name', NEW.name,
      'exp', NEW.exp,
      'day', NEW.day,
      'created_at', NEW.created_at,
      'drink_type', NEW.drink_type,
      'old_amount', OLD.amount
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'water_log.deleted';
    v_user_id := OLD.user_id;
    v_payload := jsonb_build_object(
      'id', OLD.id,
      'user_id', OLD.user_id,
      'amount', OLD.amount,
      'name', OLD.name,
      'exp', OLD.exp,
      'day', OLD.day
    );
  END IF;

  -- Query secret and URL from app_settings
  SELECT value INTO v_webhook_url FROM public.app_settings WHERE key = 'webhook_dispatcher_url';
  SELECT value INTO v_webhook_secret FROM public.app_settings WHERE key = 'webhook_secret';

  -- Fallbacks
  IF v_webhook_url IS NULL THEN
    v_webhook_url := COALESCE(
      current_setting('app.settings.webhook_dispatcher_url', true),
      'http://kong:8000/functions/v1/webhook-dispatcher'
    );
  END IF;

  IF v_webhook_secret IS NULL THEN
    v_webhook_secret := COALESCE(
      current_setting('app.settings.webhook_secret', true),
      ''
    );
  END IF;

  PERFORM net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-database-secret', v_webhook_secret
    ),
    body := jsonb_build_object(
      'user_id', v_user_id,
      'event_type', v_event_type,
      'payload', v_payload
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop and recreate the trigger to register the updated function cleanly
DROP TRIGGER IF EXISTS trg_water_log_change_webhook ON public.water_logs;

CREATE TRIGGER trg_water_log_change_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.water_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.on_water_log_change_trigger();
