-- Migration: Create Public API and Webhook tables and triggers
-- Action: Setup tables, RLS policies, trigger function using pg_net, and API key generation function.

-- 1. Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create public_api_keys table
CREATE TABLE IF NOT EXISTS public.public_api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    api_key text UNIQUE NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    last_used_at timestamptz
);

-- Enable RLS
ALTER TABLE public.public_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_api_keys
CREATE POLICY "public_api_keys_select_own" ON public.public_api_keys
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "public_api_keys_delete_own" ON public.public_api_keys
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Create webhook_subscriptions table
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    url text NOT NULL,
    events text[] NOT NULL, -- e.g. ['water_log.created', 'water_log.deleted'] or ['*']
    secret text UNIQUE NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_subscriptions
CREATE POLICY "webhook_subscriptions_select_own" ON public.webhook_subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "webhook_subscriptions_insert_own" ON public.webhook_subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "webhook_subscriptions_update_own" ON public.webhook_subscriptions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "webhook_subscriptions_delete_own" ON public.webhook_subscriptions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id uuid REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    response_status integer,
    response_body text,
    error_message text,
    delivered_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_deliveries
CREATE POLICY "webhook_deliveries_select_own" ON public.webhook_deliveries
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.webhook_subscriptions s 
            WHERE s.id = subscription_id AND s.user_id = auth.uid()
        )
    );

-- 5. Grant permissions to authenticated and service_role
GRANT SELECT, DELETE ON TABLE public.public_api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.public_api_keys TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_subscriptions TO service_role;

GRANT SELECT ON TABLE public.webhook_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_deliveries TO service_role;

-- 6. Trigger to automatically generate secret for webhook_subscriptions if not provided
CREATE OR REPLACE FUNCTION public.on_webhook_subscription_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.secret IS NULL THEN
    NEW.secret := 'dw_sec_' || encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.on_webhook_subscription_insert() FROM public, anon, authenticated;

CREATE TRIGGER on_webhook_subscription_before_insert
  BEFORE INSERT ON public.webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_webhook_subscription_insert();

-- 7. Trigger on water_logs to fire webhooks asynchronously via pg_net
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
    v_payload := json_build_object(
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
    v_payload := json_build_object(
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
    v_payload := json_build_object(
      'id', OLD.id,
      'user_id', OLD.user_id,
      'amount', OLD.amount,
      'name', OLD.name,
      'exp', OLD.exp,
      'day', OLD.day
    );
  END IF;

  -- Call the dispatcher Edge Function asynchronously via pg_net (net.http_post)
  -- Uses app.settings.webhook_dispatcher_url if set, otherwise defaults to local Kong gateway
  PERFORM net.http_post(
    url := COALESCE(
      current_setting('app.settings.webhook_dispatcher_url', true),
      'http://kong:8000/functions/v1/webhook-dispatcher'
    ),
    headers := json_build_object(
      'Content-Type', 'application/json',
      'x-database-secret', COALESCE(current_setting('app.settings.webhook_secret', true), '')
    ),
    body := json_build_object(
      'user_id', v_user_id,
      'event_type', v_event_type,
      'payload', v_payload
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.on_water_log_change_trigger() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_water_log_change_webhook ON public.water_logs;

CREATE TRIGGER trg_water_log_change_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.water_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.on_water_log_change_trigger();

-- 8. Create RPC function public.create_api_key(p_name text)
CREATE OR REPLACE FUNCTION public.create_api_key(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_key text;
BEGIN
  -- Validate API key name
  IF length(coalesce(trim(p_name), '')) = 0 THEN
    RAISE EXCEPTION 'Tên khóa API không được để trống';
  END IF;

  -- Generate secure key dw_live_ followed by 48-char random hex
  v_key := 'dw_live_' || encode(gen_random_bytes(24), 'hex');
  
  INSERT INTO public.public_api_keys (user_id, api_key, name)
  VALUES (auth.uid(), v_key, trim(p_name));
  
  RETURN v_key;
END;
$$;

REVOKE ALL ON FUNCTION public.create_api_key(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_api_key(text) TO authenticated;
