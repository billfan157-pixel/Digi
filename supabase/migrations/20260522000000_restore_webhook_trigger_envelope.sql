-- Restore the envelope wrapper {user_id, event_type, payload} around body
-- to match the expected format in webhook-dispatcher Edge Function.

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

  PERFORM net.http_post(
    url := COALESCE(
      current_setting('app.settings.webhook_dispatcher_url', true),
      'http://kong:8000/functions/v1/webhook-dispatcher'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-database-secret', COALESCE(current_setting('app.settings.webhook_secret', true), '')
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
