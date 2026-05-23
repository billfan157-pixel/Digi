-- Add subscription_tier checks and upgrade consume_ai_usage RPC limits

-- 1. Alter profiles table to restrict subscription_tier values
-- Ensure column exists and add check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_subscription_tier;

-- Ensure default value is 'free' and column exists
ALTER TABLE public.profiles ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Convert existing 'premium' values to 'pro' for backward compatibility
UPDATE public.profiles SET subscription_tier = 'pro' WHERE subscription_tier = 'premium';
UPDATE public.profiles SET subscription_tier = 'free' WHERE subscription_tier IS NULL;

-- Enforce the constraint
ALTER TABLE public.profiles ADD CONSTRAINT check_subscription_tier CHECK (subscription_tier IN ('free', 'plus', 'pro'));

-- 2. Upgrade consume_ai_usage RPC function to support 3-tier limits
CREATE OR REPLACE FUNCTION public.consume_ai_usage(p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_column text;
  v_limit integer;
  v_current integer;
  v_tier text;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  v_column := case p_action
    when 'chat' then 'message_count'
    when 'advice' then 'advice_count'
    when 'insight' then 'advice_count'
    when 'report-analysis' then 'advice_count'
    when 'agentic' then 'advice_count'
    when 'scan' then 'scan_count'
    else null
  end;

  if v_column is null then
    raise exception 'Unsupported AI action' using errcode = '22023';
  end if;

  select coalesce(subscription_tier, 'free')
  from public.profiles
  where id = v_user_id
    and (
      (subscription_end is null or subscription_end > now())
      or
      (grace_period_end is not null and grace_period_end > now())
    )
  into v_tier;

  v_tier := coalesce(v_tier, 'free');

  -- Free / Plus / Pro limits mapping
  v_limit := case
    when v_tier = 'pro' then 1000000 -- unlimited
    when v_tier = 'plus' then
      case
        when v_column = 'message_count' then 15
        when v_column = 'advice_count' then 5
        when v_column = 'scan_count' then 10
        else 0
      end
    else -- free
      case
        when v_column = 'message_count' then 5
        when v_column = 'advice_count' then 3
        when v_column = 'scan_count' then 2
        else 0
      end
  end;

  insert into public.ai_usage (user_id, date)
  values (v_user_id, current_date)
  on conflict (user_id, date) do nothing;

  execute format(
    'select %I from public.ai_usage where user_id = $1 and date = current_date for update',
    v_column
  )
  into v_current
  using v_user_id;

  if coalesce(v_current, 0) >= v_limit then
    return jsonb_build_object(
      'allowed', false,
      'limit', v_limit,
      'remaining', 0
    );
  end if;

  execute format(
    'update public.ai_usage set %I = %I + 1 where user_id = $1 and date = current_date',
    v_column,
    v_column
  )
  using v_user_id;

  return jsonb_build_object(
    'allowed', true,
    'limit', v_limit,
    'remaining', greatest(v_limit - coalesce(v_current, 0) - 1, 0)
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.consume_ai_usage(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_usage(text) TO authenticated;
