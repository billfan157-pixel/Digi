-- Add read-only check_ai_usage function to avoid double-counting quota
-- consume_ai_usage is called by edge function (single source of truth)
-- This read-only check is called by client for UI display only
CREATE OR REPLACE FUNCTION public.check_ai_usage(p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO pg_catalog, public
AS $$
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
    and ((subscription_end is null or subscription_end > now()) or (grace_period_end is not null and grace_period_end > now()))
  into v_tier;
  v_tier := coalesce(v_tier, 'free');
  v_limit := case
    when v_tier = 'pro' then 1000000
    when v_tier = 'plus' then
      case when v_column = 'message_count' then 15 when v_column = 'advice_count' then 5 when v_column = 'scan_count' then 10 else 0 end
    else
      case when v_column = 'message_count' then 5 when v_column = 'advice_count' then 3 when v_column = 'scan_count' then 2 else 0 end
  end;
  v_current := 0;
  execute format('select coalesce(%I, 0) from public.ai_usage where user_id = $1 and date = current_date', v_column) into v_current using v_user_id;
  v_current := coalesce(v_current, 0);
  return jsonb_build_object('allowed', v_current < v_limit, 'limit', v_limit, 'remaining', greatest(v_limit - v_current, 0));
end;
$$;
REVOKE ALL ON FUNCTION public.check_ai_usage(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.check_ai_usage(text) TO authenticated;
